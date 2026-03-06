"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default icon path issue in webpack/next.js
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export interface SensitiveAreaMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: "critical" | "high" | "moderate" | "low";
}

interface ProjectMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  marker?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  bufferRadiusKm?: number;
  sensitiveAreas?: SensitiveAreaMarker[];
  readonly?: boolean;
  height?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  moderate: "#d97706",
  low: "#65a30d",
};

export function ProjectMap({
  center = { lat: 56.5, lng: -122.5 },
  zoom = 6,
  marker,
  onLocationSelect,
  bufferRadiusKm,
  sensitiveAreas = [],
  readonly = false,
  height = "400px",
}: ProjectMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const bufferCircleRef = useRef<L.Circle | null>(null);
  const sensitiveMarkersRef = useRef<L.CircleMarker[]>([]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    // Click handler for placing marker
    if (!readonly && onLocationSelect) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onLocationSelect(
          parseFloat(e.latlng.lat.toFixed(6)),
          parseFloat(e.latlng.lng.toFixed(6))
        );
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker position
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Remove existing buffer
    if (bufferCircleRef.current) {
      map.removeLayer(bufferCircleRef.current);
      bufferCircleRef.current = null;
    }

    if (marker) {
      // Create custom red icon for project marker
      const redIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 28px; height: 28px;
          background: #e51937;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "><div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const m = L.marker([marker.lat, marker.lng], { icon: redIcon }).addTo(map);
      m.bindPopup(
        `<strong>Project Location</strong><br/>${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`
      );
      markerRef.current = m;

      // Add buffer circle
      if (bufferRadiusKm && bufferRadiusKm > 0) {
        const circle = L.circle([marker.lat, marker.lng], {
          radius: bufferRadiusKm * 1000,
          color: "#e51937",
          fillColor: "#e51937",
          fillOpacity: 0.06,
          weight: 2,
          dashArray: "8 4",
        }).addTo(map);
        circle.bindPopup(`Buffer Zone: ${bufferRadiusKm} km`);
        bufferCircleRef.current = circle;
      }

      // Pan to marker
      map.setView([marker.lat, marker.lng], Math.max(map.getZoom(), 8), {
        animate: true,
      });
    }
  }, [marker, bufferRadiusKm]);

  // Update sensitive area markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    sensitiveMarkersRef.current.forEach((m) => map.removeLayer(m));
    sensitiveMarkersRef.current = [];

    sensitiveAreas.forEach((area) => {
      const color = SEVERITY_COLORS[area.severity] || "#6b7280";
      const cm = L.circleMarker([area.lat, area.lng], {
        radius: area.severity === "critical" ? 12 : area.severity === "high" ? 10 : 8,
        color,
        fillColor: color,
        fillOpacity: 0.25,
        weight: 2,
      }).addTo(map);
      cm.bindPopup(
        `<strong>${area.name}</strong><br/>Severity: <span style="color:${color};font-weight:600;">${area.severity.toUpperCase()}</span>`
      );
      sensitiveMarkersRef.current.push(cm);
    });
  }, [sensitiveAreas]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border z-0">
      <div ref={mapContainerRef} style={{ height, width: "100%", zIndex: 0 }} />
      {!readonly && (
        <div className="absolute bottom-3 left-3 z-[1000] rounded-md border border-border bg-card/95 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="text-[10px] text-muted-foreground">
            Click on the map to set project location
          </p>
        </div>
      )}
      {readonly && (
        <div className="absolute top-3 right-3 z-[1000] rounded-md border border-border bg-card/95 px-2.5 py-1.5 backdrop-blur-sm">
          <p className="text-[10px] text-muted-foreground">
            Read-only view with overlay layers
          </p>
        </div>
      )}
    </div>
  );
}
