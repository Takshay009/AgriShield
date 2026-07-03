"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface FarmMapProps {
  onPolygonChange?: (points: [number, number][]) => void;
  initialPolygon?: [number, number][];
  readOnly?: boolean;
}

function ClickHandler({ onMapClick }: { onMapClick: (latlng: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function FarmMap({ onPolygonChange, initialPolygon = [], readOnly = false }: FarmMapProps) {
  const [points, setPoints] = useState<[number, number][]>(initialPolygon);

  const handleMapClick = (latlng: [number, number]) => {
    if (readOnly) return;
    const newPoints = [...points, latlng];
    setPoints(newPoints);
    if (onPolygonChange) {
      onPolygonChange(newPoints);
    }
  };

  const handleClear = () => {
    if (readOnly) return;
    setPoints([]);
    if (onPolygonChange) {
      onPolygonChange([]);
    }
  };

  const center: [number, number] = points.length > 0 ? points[0] : [51.505, -0.09]; // Default center

  return (
    <div className="relative w-full h-[400px] rounded-md overflow-hidden border">
      {!readOnly && (
        <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow">
          <p className="text-xs mb-2">Click map to draw boundary</p>
          <button 
            type="button" 
            onClick={handleClear}
            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded"
          >
            Clear Drawing
          </button>
        </div>
      )}
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={handleMapClick} />
        {points.length > 0 && <Polygon positions={points} pathOptions={{ color: "green" }} />}
      </MapContainer>
    </div>
  );
}
