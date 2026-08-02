import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { ROWRecord } from '../types';

interface HeatmapViewProps {
  records: ROWRecord[];
  isLight?: boolean;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({ records, isLight }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([-6.2088, 106.8456], 10); // Default Jakarta
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    // Prepare data
    const points: [number, number, number][] = records
      .filter(r => r.latitude && r.longitude && r.jumlahTemuan)
      .map(r => [r.latitude!, r.longitude!, r.jumlahTemuan!]);

    if (points.length > 0) {
      // @ts-ignore
      const heat = L.heatLayer(points, { radius: 25 }).addTo(mapInstance.current);
      return () => {
        mapInstance.current?.removeLayer(heat);
      };
    }
  }, [records]);

  return (
    <div ref={mapRef} className={`w-full h-96 rounded-xl overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`} />
  );
};
