import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ROWRecord } from '../types';
import { 
  Map as MapIcon, 
  TreePine, 
  Navigation, 
  Filter, 
  Info, 
  ShieldAlert, 
  Zap, 
  FileText, 
  Compass, 
  Search, 
  Calendar,
  AlertCircle,
  Maximize2,
  ListFilter
} from 'lucide-react';

// Default coordinates in Jakarta for each feeder (Penyulang)
export const PENYULANG_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Penyulang Gambir': { lat: -6.1754, lng: 106.8272 },   // Monas area
  'Penyulang Senayan': { lat: -6.2185, lng: 106.8025 },  // GBK Senayan area
  'Penyulang Palmerah': { lat: -6.2115, lng: 106.7845 }, // Palmerah area
  'Penyulang Cempaka': { lat: -6.1735, lng: 106.8681 },  // Cempaka Putih area
  'Penyulang Kebayoran': { lat: -6.2443, lng: 106.7912 },// Kebayoran Baru area
  'Penyulang Kalibata': { lat: -6.2558, lng: 106.8488 }, // Kalibata area
  'Penyulang Menteng': { lat: -6.1953, lng: 106.8322 },  // Menteng area
};

export const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 }; // Central Jakarta

// Deterministic jitter based on ID to avoid exact overlap
export function getRecordCoordinates(record: ROWRecord): { lat: number; lng: number } {
  if (record.latitude && record.longitude) {
    return { lat: record.latitude, lng: record.longitude };
  }

  const feeder = record.penyulang || '';
  const base = PENYULANG_COORDINATES[feeder] || DEFAULT_CENTER;

  // Simple consistent hash
  let hash = 0;
  const idStr = record.id || '';
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Consistent jitter between -0.012 and +0.012 degrees
  const latJitter = ((hash % 100) / 100) * 0.016 - 0.008;
  const lngJitter = (((hash >> 8) % 100) / 100) * 0.016 - 0.008;

  return {
    lat: base.lat + latJitter,
    lng: base.lng + lngJitter
  };
}

interface MapViewProps {
  records: ROWRecord[];
  onSelectRecord?: (record: ROWRecord) => void;
}

export const MapView: React.FC<MapViewProps> = ({ records, onSelectRecord }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerInstancesRef = useRef<Record<string, L.Marker>>({});
  
  const [selectedRecord, setSelectedRecord] = useState<ROWRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PADAM' | 'IZIN' | 'BESAR'>('ALL');

  // Filter records based on local search and map filter state
  const mapFilteredRecords = records.filter(r => {
    // Apply local search
    const matchesSearch = searchQuery.trim() === '' || 
      r.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.catatan || '').toLowerCase().includes(searchQuery.toLowerCase());

    // Apply local map filter category
    if (!matchesSearch) return false;
    if (filterType === 'PADAM') return r.perluPadam === true;
    if (filterType === 'IZIN') return r.tidakAdaIzin === true;
    if (filterType === 'BESAR') return r.pohonBesar === true;
    return true;
  });

  // Calculate coordinates for all filtered records
  const recordsWithCoords = mapFilteredRecords.map(r => ({
    record: r,
    coords: getRecordCoordinates(r)
  }));

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the map instance
    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 12,
      zoomControl: false, // Custom position later
    });

    // Add high-quality grayscale theme (CartoDB Positron) for a premium dashboard look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // Zoom controls on bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create a group layer for markers
    const markersLayer = L.layerGroup().addTo(map);

    leafletMapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Add Resize Observer to handle container resizing fluidly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update Markers when records or filterType change
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous markers
    markersLayer.clearLayers();
    markerInstancesRef.current = {};

    // Custom Icon Maker
    const createCustomDivIcon = (record: ROWRecord, isActive: boolean) => {
      let colorClass = 'bg-emerald-500 text-white ring-emerald-100';
      
      if (record.perluPadam) {
        colorClass = 'bg-rose-500 text-white ring-rose-100';
      } else if (record.tidakAdaIzin) {
        colorClass = 'bg-amber-500 text-slate-900 ring-amber-100';
      } else if (record.pohonBesar) {
        colorClass = 'bg-purple-500 text-white ring-purple-100';
      }

      const activeClasses = isActive 
        ? 'scale-125 ring-4 ring-emerald-400 border-2 border-white' 
        : 'hover:scale-110';

      const pulsePing = record.perluPadam 
        ? '<span class="absolute inset-0 rounded-full bg-rose-400 opacity-65 animate-ping"></span>' 
        : record.tidakAdaIzin 
          ? '<span class="absolute inset-0 rounded-full bg-amber-400 opacity-45 animate-ping"></span>'
          : '';

      const shortenedPenyulang = record.penyulang 
        ? record.penyulang.replace('Penyulang ', '') 
        : 'Rutin';

      return L.divIcon({
        className: 'bg-transparent border-none',
        html: `
          <div class="relative flex flex-col items-center justify-center transition-all duration-300 ${activeClasses}" style="width: 40px; height: 40px;">
            ${pulsePing}
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-md ${colorClass} border-2 border-white relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
                <path d="m12 2-8 14h16L12 2z" fill="currentColor" fill-opacity="0.3" />
                <path d="M12 16v6M9 22h6" />
              </svg>
            </div>
            <div class="absolute -bottom-3 bg-slate-900 text-white text-[8px] font-bold px-1 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap z-20 scale-90">
              ${shortenedPenyulang}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    };

    // Add markers
    recordsWithCoords.forEach(({ record, coords }) => {
      const isSelected = selectedRecord?.id === record.id;
      const customIcon = createCustomDivIcon(record, isSelected);

      const marker = L.marker([coords.lat, coords.lng], { icon: customIcon });

      // Generate HTML details for popup
      const popupContent = `
        <div class="p-3 font-sans min-w-[220px] max-w-[260px] text-slate-800">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
              ${record.penyulang || 'Penyulang Umum'}
            </span>
            ${record.perluPadam ? '<span class="text-[9px] font-extrabold uppercase bg-rose-50 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded">Perlu Padam</span>' : ''}
          </div>
          <h4 class="font-bold text-xs text-slate-900 mb-2 leading-tight">${record.section}</h4>
          
          <div class="grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-2 mb-2 text-[10px]">
            <div>
              <span class="text-slate-400 font-medium">Temuan Pohon:</span>
              <p class="font-bold text-slate-800">${record.jumlahTemuan} Pohon</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Selesai Pangkas:</span>
              <p class="font-bold text-emerald-600">${record.realisasiTemuan} / ${record.jumlahTemuan} (${record.jumlahTemuan > 0 ? Math.round((record.realisasiTemuan/record.jumlahTemuan)*100) : 0}%)</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Realisasi KMS:</span>
              <p class="font-bold text-slate-800">${record.realisasiKms} KMS</p>
            </div>
            <div>
              <span class="text-slate-400 font-medium">Gawang Selesai:</span>
              <p class="font-bold text-slate-800">${record.realisasiGawang} Span</p>
            </div>
          </div>

          ${record.catatan ? `
            <div class="bg-slate-50 border border-slate-200 p-1.5 rounded text-[10px] text-slate-600 leading-relaxed italic mb-2">
              "${record.catatan}"
            </div>
          ` : ''}

          <div class="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-1.5">
            <span>Update: ${record.tanggalUpdate || record.tanggal || '-'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedRecord(record);
      });

      marker.addTo(markersLayer);
      markerInstancesRef.current[record.id] = marker;
    });

    // Auto-fit bounds if we have markers to display
    if (recordsWithCoords.length > 0 && !selectedRecord) {
      const bounds = L.latLngBounds(recordsWithCoords.map(item => [item.coords.lat, item.coords.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mapFilteredRecords, selectedRecord, filterType]);

  const handleSelectRecordFromSidebar = (item: ROWRecord) => {
    setSelectedRecord(item);
    const coords = getRecordCoordinates(item);
    const map = leafletMapRef.current;
    
    if (map) {
      map.setView([coords.lat, coords.lng], 16);
      
      const marker = markerInstancesRef.current[item.id];
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    }
  };

  const handleZoomToFeeder = (feederName: string) => {
    const coords = PENYULANG_COORDINATES[feederName];
    const map = leafletMapRef.current;
    if (map && coords) {
      setSelectedRecord(null);
      map.setView([coords.lat, coords.lng], 15);
    }
  };

  const handleResetMapZoom = () => {
    const map = leafletMapRef.current;
    if (map && recordsWithCoords.length > 0) {
      setSelectedRecord(null);
      const bounds = L.latLngBounds(recordsWithCoords.map(item => [item.coords.lat, item.coords.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (map) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col lg:flex-row h-[580px] lg:h-[650px]">
      
      {/* Sidebar Controls & List */}
      <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col h-[240px] lg:h-full bg-slate-50/50">
        
        {/* Sidebar Header & Search */}
        <div className="p-3 border-b border-slate-200 bg-white space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapIcon className="w-4 h-4 text-emerald-500" />
              Sebaran Geografis
            </h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {mapFilteredRecords.length} Lokasi
            </span>
          </div>
          
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari section atau penyulang..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 text-slate-800"
            />
          </div>
        </div>

        {/* Tab Filter buttons */}
        <div className="px-3 py-2 bg-white border-b border-slate-100 flex gap-1 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('PADAM')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'PADAM'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Zap className="w-2.5 h-2.5" /> Padam
          </button>
          <button
            onClick={() => setFilterType('IZIN')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'IZIN'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <FileText className="w-2.5 h-2.5" /> Izin
          </button>
          <button
            onClick={() => setFilterType('BESAR')}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-md whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'BESAR'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <TreePine className="w-2.5 h-2.5" /> Besar
          </button>
        </div>

        {/* Feeder Zoom Shortcuts */}
        <div className="p-2 border-b border-slate-200 bg-slate-50 flex flex-wrap gap-1 items-center shrink-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Fokus:</span>
          {Object.keys(PENYULANG_COORDINATES).map((name) => (
            <button
              key={name}
              onClick={() => handleZoomToFeeder(name)}
              className="px-1.5 py-0.5 text-[9px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition"
            >
              {name.replace('Penyulang ', '')}
            </button>
          ))}
          <button
            onClick={handleResetMapZoom}
            className="ml-auto p-0.5 text-emerald-600 hover:text-emerald-700 transition"
            title="Reset Zoom Map"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* List of Section findings */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {mapFilteredRecords.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-400 space-y-1">
              <Info className="w-5 h-5 mx-auto text-slate-300" />
              <p className="text-xs">Tidak ada lokasi temuan cocok.</p>
            </div>
          ) : (
            mapFilteredRecords.map((item) => {
              const isSelected = selectedRecord?.id === item.id;
              let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (item.perluPadam) badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              else if (item.tidakAdaIzin) badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              else if (item.pohonBesar) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

              const completion = item.jumlahTemuan > 0 
                ? Math.round((item.realisasiTemuan / item.jumlahTemuan) * 100) 
                : 100;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRecordFromSidebar(item)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col text-xs leading-tight ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-[8px] font-extrabold uppercase border px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-slate-800 text-emerald-300 border-slate-700' : badgeColor
                    }`}>
                      {item.penyulang || 'Penyulang'}
                    </span>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {completion}% Pangkas
                    </span>
                  </div>
                  <h4 className={`font-bold text-[11px] mb-1 truncate w-full ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {item.section}
                  </h4>
                  <div className="flex items-center justify-between w-full text-[10px] text-slate-400">
                    <span>{item.jumlahTemuan} pohon temuan</span>
                    <span className="font-semibold text-emerald-500">{item.realisasiKms} KMS</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="flex-1 relative h-full min-h-[300px]">
        {/* Map div */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Legend Overlay (Fixed position on Map bottom-left) */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-lg border border-slate-200 shadow-md max-w-[200px] space-y-1.5 text-[10px]">
          <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[9px] mb-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-emerald-600 animate-spin-slow" />
            Legenda Status ROW
          </h4>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-sm shrink-0" />
            <span className="font-semibold text-slate-700">Perlu Padam (Urgent)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm shrink-0" />
            <span className="font-semibold text-slate-700">Belum Ada Izin Warga</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-sm shrink-0" />
            <span className="font-semibold text-slate-700">Pohon Ukuran Besar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm shrink-0" />
            <span className="font-semibold text-slate-700">Rutin / Normal</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-1.5 leading-tight pt-1.5 border-t border-slate-100">
            *Pin berdenyut (pulse) menandakan kendala urgent perlu tindak lanjut cepat.
          </p>
        </div>
      </div>
    </div>
  );
};
