"""
EIA Screening Platform — Adaptive DAG Workflow Builder
Uses Microsoft Agent Framework patterns for graph-based orchestration.

The workflow is an adaptive DAG (Directed Acyclic Graph) with conditional
branching at the ScreeningDecision node:
  - EXEMPT path: jumps directly to report generation
  - SCREENING_REQUIRED path: full analysis pipeline

The graph enforces:
  1. Sequential data dependencies (each node receives upstream outputs)
  2. Conditional routing (exempt vs full screening)
  3. State machine enforcement (blocks invalid transitions)
  4. Readiness gating (blocks orchestration if project data is incomplete)
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Callable, Optional, Awaitable

from ..models.state import WorkflowState, AgentStatus, AgentPhase

logger = logging.getLogger(__name__)


@dataclass
class ExecutorNode:
    """A node in the workflow DAG wrapping an executor instance."""
    name: str
    display_name: str
    executor: object  # The executor instance with an `execute` method
    edges: list[ConditionalEdge] = field(default_factory=list)


@dataclass
class ConditionalEdge:
    """
    An edge in the DAG that optionally gates on a condition function.
    If condition is None, the edge is unconditional (always taken).
    If condition returns True, the edge is taken; otherwise skipped.
    """
    target: str  # Name of the target executor
    condition: Optional[Callable[[WorkflowState], bool]] = None
    label: str = ""


class WorkflowBuilder:
    """
    Builds an executable DAG workflow from executor nodes and conditional edges.

    Usage:
        workflow = (
            WorkflowBuilder("EIA Screening Workflow")
            .add_executor(project_structuring_executor)
            .add_executor(legal_threshold_executor)
            ...
            .add_edge("project_structuring", "legal_threshold")
            .add_edge("legal_threshold", "screening_decision")
            .add_edge("screening_decision", "report_generation",
                       condition=is_exempt, label="Exempt path")
            .add_edge("screening_decision", "context_analysis",
                       condition=is_screening_required, label="Full screening")
            ...
            .set_entry_point("project_structuring")
            .build()
        )
    """

    def __init__(self, name: str) -> None:
        self.name = name
        self._nodes: dict[str, ExecutorNode] = {}
        self._entry_point: Optional[str] = None

    def add_executor(self, executor: object) -> WorkflowBuilder:
        """Register an executor as a node in the DAG."""
        name = getattr(executor, "name", executor.__class__.__name__)
        display_name = getattr(executor, "display_name", name)
        self._nodes[name] = ExecutorNode(
            name=name,
            display_name=display_name,
            executor=executor,
        )
        return self

    def add_edge(
        self,
        source: str,
        target: str,
        condition: Optional[Callable[[WorkflowState], bool]] = None,
        label: str = "",
    ) -> WorkflowBuilder:
        """Add a directed edge (optionally conditional) from source to target."""
        if source not in self._nodes:
            raise ValueError(f"Source executor '{source}' not registered")
        if target not in self._nodes:
            raise ValueError(f"Target executor '{target}' not registered")
        self._nodes[source].edges.append(
            ConditionalEdge(target=target, condition=condition, label=label)
        )
        return self

    def set_entry_point(self, name: str) -> WorkflowBuilder:
        """Set which executor starts the workflow."""
        if name not in self._nodes:
            raise ValueError(f"Entry point '{name}' not registered")
        self._entry_point = name
        return self

    def build(self) -> Workflow:
        """Construct the executable workflow."""
        if not self._entry_point:
            raise ValueError("Entry point not set. Call set_entry_point().")
        return Workflow(
            name=self.name,
            nodes=dict(self._nodes),
            entry_point=self._entry_point,
        )


class Workflow:
    """
    An executable DAG workflow that processes WorkflowState through
    a sequence of executor nodes, following conditional edges.
    """

    def __init__(
        self,
        name: str,
        nodes: dict[str, ExecutorNode],
        entry_point: str,
    ) -> None:
        self.name = name
        self._nodes = nodes
        self._entry_point = entry_point

    def _initialize_agent_statuses(self, state: WorkflowState) -> None:
        """Pre-populate agent status entries for all nodes."""
        state.agent_statuses = [
            AgentStatus(
                executor_name=node.name,
                display_name=node.display_name,
                phase=AgentPhase.IDLE,
            )
            for node in self._nodes.values()
        ]

    async def execute(self, state: WorkflowState) -> WorkflowState:
        """
        Execute the entire workflow starting from the entry point.

        Traverses the DAG by following edges from each completed node:
          - Unconditional edges are always followed
          - Conditional edges are followed only if their condition returns True
          - If multiple edges match, they execute sequentially (not parallel)
        """
        from datetime import datetime

        logger.info(f"[Workflow:{self.name}] Starting execution")
        state.started_at = datetime.utcnow()
        self._initialize_agent_statuses(state)

        # BFS-like traversal of the DAG
        queue: list[str] = [self._entry_point]
        visited: set[str] = set()

        while queue:
            current_name = queue.pop(0)
            if current_name in visited:
                continue
            visited.add(current_name)

            node = self._nodes.get(current_name)
            if not node:
                logger.error(f"[Workflow] Node '{current_name}' not found in DAG")
                continue

            # Check if already skipped (e.g., by ScreeningDecision)
            current_status = next(
                (s for s in state.agent_statuses if s.executor_name == current_name),
                None,
            )
            if current_status and current_status.phase == AgentPhase.SKIPPED:
                logger.info(f"[Workflow] Skipping '{current_name}' (marked as skipped)")
                # Still follow unconditional edges from skipped nodes
                # but don't execute them
                continue

            # Execute the node
            logger.info(f"[Workflow] Executing '{current_name}'")
            try:
                state = await node.executor.execute(state)
            except Exception as e:
                state.mark_executor_error(current_name, str(e))
                logger.error(f"[Workflow] Error in '{current_name}': {e}")
                state.error = str(e)
                break

            # Check for errors
            if state.error:
                logger.error(f"[Workflow] Aborting due to error in '{current_name}'")
                break

            # Follow edges
            for edge in node.edges:
                if edge.condition is None:
                    # Unconditional edge — always follow
                    queue.append(edge.target)
                elif edge.condition(state):
                    # Conditional edge — condition passed
                    logger.info(
                        f"[Workflow] Following conditional edge "
                        f"'{current_name}' -> '{edge.target}' ({edge.label})"
                    )
                    queue.append(edge.target)
                else:
                    logger.info(
                        f"[Workflow] Skipping conditional edge "
                        f"'{current_name}' -> '{edge.target}' ({edge.label})"
                    )

        if not state.error:
            state.is_complete = True
            state.completed_at = datetime.utcnow()

        logger.info(
            f"[Workflow:{self.name}] Execution complete. "
            f"Visited: {visited}. Error: {state.error}"
        )
        return state


# ─────────────────────────────────────────────────────────────
# Condition functions for conditional edges
# ─────────────────────────────────────────────────────────────

def is_exempt(state: WorkflowState) -> bool:
    """Condition: project is exempt from full screening."""
    return (
        state.screening_decision is not None
        and state.screening_decision.is_exempt is True
    )


def is_screening_required(state: WorkflowState) -> bool:
    """Condition: project requires full screening pipeline."""
    return (
        state.screening_decision is not None
        and state.screening_decision.is_exempt is False
    )
