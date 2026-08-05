import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import JSZip from 'jszip';
import { ROWRecord, PemeliharaanRecord } from '../types';
import { 
  Map as MapIcon, 
  TreePine, 
  ClipboardCheck, 
  Wrench, 
  Zap, 
  Search, 
  Info, 
  Maximize2,
  Download,
  Upload,
  Layers,
  FileCode,
  Trash2,
  X,
  Compass,
  CheckCircle2,
  Plus,
  Eye,
  EyeOff,
  Crosshair,
  Palette
} from 'lucide-react';
import { exportToKml, exportToKmz } from '../utils/kmlExport';

// Default coordinates in Ambon for each feeder (Penyulang)
export const PENYULANG_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Penyulang Gambir': { lat: -3.7250, lng: 128.1400 },   // Nusaniwe area
  'Penyulang Senayan': { lat: -3.6950, lng: 128.1800 },  // Sirimau area
  'Penyulang Palmerah': { lat: -3.7050, lng: 128.0900 }, // Laha/Airport area
  'Penyulang Cempaka': { lat: -3.6400, lng: 128.2400 },  // Passo/Baguala area
  'Penyulang Kebayoran': { lat: -3.6500, lng: 128.2250 },// Lateri/Leitimur area
  'Penyulang Kalibata': { lat: -3.6800, lng: 128.1300 }, // Hative Besar area
  'Penyulang Menteng': { lat: -3.6900, lng: 128.1900 },  // Ambon City center area
};

export const DEFAULT_CENTER = { lat: -3.6954, lng: 128.1814 }; // Ambon Island Center

export interface ImportedFeederMap {
  id: string;
  name: string;
  color: string;
  geojson: any;
  visible?: boolean;
  createdAt: string;
}

// Deterministic jitter based on ID to avoid exact overlap
export function getRecordCoordinates(record: { id?: string; penyulang?: string; latitude?: number; longitude?: number }): { lat: number; lng: number } {
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
  pemeliharaanRecords?: PemeliharaanRecord[];
  onSelectRecord?: (record: ROWRecord) => void;
  isLight?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({ 
  records, 
  pemeliharaanRecords = [], 
  onSelectRecord,
  isLight = false 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const geojsonLayersRef = useRef<L.LayerGroup | null>(null);
  const markerInstancesRef = useRef<Record<string, L.Marker>>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const hasAutoFitRef = useRef(false);

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category Layer Visibilities
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'ROW' | 'INSPEKSI' | 'PEMELIHARAAN' | 'GANGGUAN'>('ALL');
  const [filterConstraint, setFilterConstraint] = useState<'ALL' | 'PADAM' | 'IZIN' | 'BESAR'>('ALL');

  // Imported Feeder Layers
  const [importedMaps, setImportedMaps] = useState<ImportedFeederMap[]>(() => {
    try {
      const saved = localStorage.getItem('imported_feeder_maps');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load imported maps:', e);
    }
    return [];
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importLayerName, setImportLayerName] = useState('');
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importColor, setImportColor] = useState('#10b981');
  const [importError, setImportError] = useState<string | null>(null);

  // Save imported maps to localStorage
  const saveImportedMaps = (maps: ImportedFeederMap[]) => {
    setImportedMaps(maps);
    try {
      localStorage.setItem('imported_feeder_maps', JSON.stringify(maps));
    } catch (e) {
      console.error('Error saving imported maps:', e);
    }
  };

  // Extract all points for map display across categories
  const mapPoints = React.useMemo(() => {
    const points: Array<{
      id: string;
      category: 'ROW' | 'INSPEKSI' | 'PEMELIHARAAN' | 'GANGGUAN';
      title: string;
      penyulang: string;
      coords: { lat: number; lng: number };
      details: any;
      perluPadam?: boolean;
      tidakAdaIzin?: boolean;
      pohonBesar?: boolean;
      isEksekusi?: boolean;
      status?: string;
    }> = [];

    // 1. Process ROW & Inspection & Gangguan records
    records.forEach(r => {
      const isGangguan = r.gangguan === true;
      const isInspeksi = Boolean(r.inspectionType || r.temuanKonstruksi !== undefined);
      
      let category: 'ROW' | 'INSPEKSI' | 'PEMELIHARAAN' | 'GANGGUAN' = 'ROW';
      if (isGangguan) category = 'GANGGUAN';
      else if (isInspeksi) category = 'INSPEKSI';

      // Apply category filter
      if (categoryFilter !== 'ALL' && categoryFilter !== category) return;

      // Search match
      const matchesSearch = searchQuery.trim() === '' ||
        (r.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.catatan || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return;

      // Tree level points
      if (r.treeDetails && r.treeDetails.length > 0) {
        r.treeDetails.forEach((tree, idx) => {
          if (tree.latitude !== '' && tree.longitude !== '') {
            if (filterConstraint === 'PADAM' && !tree.perluPadam) return;
            if (filterConstraint === 'IZIN' && !tree.belumIzin) return;
            if (filterConstraint === 'BESAR' && !tree.pohonBesar) return;

            points.push({
              id: `${category}-${tree.id}`,
              category,
              title: `Pohon #${idx + 1} - ${r.section}`,
              penyulang: r.penyulang || 'Penyulang',
              coords: { lat: Number(tree.latitude), lng: Number(tree.longitude) },
              details: { ...r, tree },
              perluPadam: tree.perluPadam,
              tidakAdaIzin: tree.belumIzin,
              pohonBesar: tree.pohonBesar,
              isEksekusi: tree.isEksekusi,
            });
          }
        });
      }

      // Record level point
      if (filterConstraint === 'PADAM' && !r.perluPadam && !isGangguan) return;
      if (filterConstraint === 'IZIN' && !r.tidakAdaIzin) return;
      if (filterConstraint === 'BESAR' && !r.pohonBesar) return;

      points.push({
        id: `${category}-${r.id}`,
        category,
        title: r.section || (isGangguan ? `Gangguan ${r.penyulang}` : 'Lokasi Jaringan'),
        penyulang: r.penyulang || 'Penyulang',
        coords: getRecordCoordinates(r),
        details: r,
        perluPadam: r.perluPadam || isGangguan,
        tidakAdaIzin: r.tidakAdaIzin,
        pohonBesar: r.pohonBesar,
        isEksekusi: r.jumlahTemuan > 0 && r.realisasiTemuan >= r.jumlahTemuan
      });
    });

    // 2. Process Pemeliharaan Records
    if (categoryFilter === 'ALL' || categoryFilter === 'PEMELIHARAAN') {
      pemeliharaanRecords.forEach(p => {
        const matchesSearch = searchQuery.trim() === '' ||
          (p.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.penyulang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.jenisPemeliharaan || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.keterangan || '').toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return;

        points.push({
          id: `PEMELIHARAAN-${p.id}`,
          category: 'PEMELIHARAAN',
          title: `${p.jenisPemeliharaan} - ${p.penyulang}`,
          penyulang: p.penyulang || 'Penyulang',
          coords: getRecordCoordinates({ id: p.id, penyulang: p.penyulang, latitude: p.lokasi ? undefined : undefined }),
          details: p,
          isEksekusi: p.status === 'Selesai',
          status: p.status
        });
      });
    }

    return points;
  }, [records, pemeliharaanRecords, categoryFilter, filterConstraint, searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: 12,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(
      isLight 
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const geojsonLayers = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    leafletMapRef.current = map;
    markersLayerRef.current = markersLayer;
    geojsonLayersRef.current = geojsonLayers;

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

  // Swap map tiles when theme changes
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const newTileUrl = isLight 
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(newTileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, [isLight]);

  // Update GeoJSON imported feeder layers on map
  useEffect(() => {
    const geojsonLayers = geojsonLayersRef.current;
    if (!geojsonLayers) return;

    geojsonLayers.clearLayers();

    importedMaps.forEach(item => {
      if (item.visible === false || !item.geojson) return;
      try {
        const layer = L.geoJSON(item.geojson, {
          style: {
            color: item.color || '#10b981',
            weight: 4,
            opacity: 0.85
          },
          pointToLayer: (feature, latlng) => {
            return L.marker(latlng, {
              icon: L.divIcon({
                className: 'bg-transparent border-none',
                html: `
                  <div class="relative flex flex-col items-center justify-center" style="width: 36px; height: 36px;">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white" style="background-color: ${item.color || '#10b981'};">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-white"><path d="M12 2v20M7 7h10M5 12h14M8 17h8"/></svg>
                    </div>
                  </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -18]
              })
            });
          },
          onEachFeature: (feature, l) => {
            const props = feature.properties || {};
            const title = props.name || props.NAMA_PENYULANG || item.name;
            l.bindPopup(`
              <div class="p-2 font-sans text-xs">
                <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border" style="background-color: ${item.color}20; color: ${item.color}; border-color: ${item.color}50;">
                  Feeder Map (${item.name})
                </span>
                <h4 class="font-bold text-slate-900 mt-1">${title}</h4>
              </div>
            `);
          }
        });
        layer.addTo(geojsonLayers);
      } catch (e) {
        console.error("Failed to render GeoJSON layer:", e);
      }
    });

    if (!hasAutoFitRef.current && importedMaps.length > 0) {
      const map = leafletMapRef.current;
      if (map) {
        const bounds = L.latLngBounds([]);
        let hasBounds = false;
        importedMaps.forEach(m => {
          if (m.visible !== false && m.geojson) {
            try {
              const geoLayer = L.geoJSON(m.geojson);
              const mBounds = geoLayer.getBounds();
              if (mBounds.isValid()) {
                bounds.extend(mBounds);
                hasBounds = true;
              }
            } catch (e) {
              console.error(e);
            }
          }
        });
        if (hasBounds && bounds.isValid()) {
          setTimeout(() => {
            map.fitBounds(bounds, { padding: [50, 50] });
          }, 500);
          hasAutoFitRef.current = true;
        }
      }
    }
  }, [importedMaps]);

  // Update Markers on map
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerInstancesRef.current = {};

    const createCustomDivIcon = (point: any, isActive: boolean) => {
      let bgGrad = 'from-emerald-500 to-teal-700';
      // Electric Utility Pole / Tiang Listrik Icon
      let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-white"><path d="M12 2v20M7 7h10M5 12h14M8 17h8"/></svg>`;
      let ringColor = 'ring-emerald-400';

      if (point.category === 'GANGGUAN') {
        bgGrad = 'from-red-600 to-rose-700';
        ringColor = 'ring-red-400';
      } else if (point.category === 'INSPEKSI') {
        bgGrad = 'from-cyan-500 to-blue-700';
        ringColor = 'ring-cyan-400';
      } else if (point.category === 'PEMELIHARAAN') {
        bgGrad = 'from-purple-600 to-indigo-800';
        ringColor = 'ring-purple-400';
      } else if (point.perluPadam) {
        bgGrad = 'from-rose-500 to-red-700';
        ringColor = 'ring-rose-400';
      } else if (point.tidakAdaIzin) {
        bgGrad = 'from-amber-500 to-orange-600';
        ringColor = 'ring-amber-400';
      }

      const activeClasses = isActive 
        ? 'scale-125 ring-4 ring-amber-400 border-2 border-white' 
        : 'hover:scale-110';

      const isPulse = point.category === 'GANGGUAN' || point.perluPadam;
      const pulsePing = isPulse
        ? `<span class="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>`
        : '';

      const labelTag = point.category;

      return L.divIcon({
        className: 'bg-transparent border-none',
        html: `
          <div class="relative flex flex-col items-center justify-center transition-all duration-300 ${activeClasses}" style="width: 40px; height: 40px;">
            ${pulsePing}
            <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br ${bgGrad} border-2 border-white text-white relative z-10 ${ringColor}">
              ${iconSvg}
            </div>
            <div class="absolute -bottom-3 bg-slate-900 text-white text-[8px] font-extrabold px-1.5 py-0.2 rounded shadow border border-slate-700 whitespace-nowrap z-20 scale-90">
              ${labelTag}
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      });
    };

    mapPoints.forEach((point) => {
      const isSelected = selectedRecord?.id === point.id;
      const customIcon = createCustomDivIcon(point, isSelected);

      const marker = L.marker([point.coords.lat, point.coords.lng], { icon: customIcon });

      const d = point.details;
      let categoryBadge = `<span class="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">ROW</span>`;
      if (point.category === 'GANGGUAN') categoryBadge = `<span class="text-[9px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-300 px-1.5 py-0.5 rounded">Gangguan Outage</span>`;
      if (point.category === 'INSPEKSI') categoryBadge = `<span class="text-[9px] font-extrabold uppercase bg-cyan-100 text-cyan-800 border border-cyan-300 px-1.5 py-0.5 rounded">Inspeksi Visual</span>`;
      if (point.category === 'PEMELIHARAAN') categoryBadge = `<span class="text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.5 rounded">Pemeliharaan</span>`;

      const popupContent = `
        <div class="p-3 font-sans min-w-[220px] max-w-[260px] text-slate-800">
          <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
            ${categoryBadge}
            <span class="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              ${point.penyulang}
            </span>
          </div>
          <h4 class="font-bold text-xs text-slate-900 mb-2 leading-tight">${point.title}</h4>

          <div class="border-t border-slate-100 pt-2 mb-2 text-[10px] space-y-1">
            ${d.jenisPemeliharaan ? `<div><span class="text-slate-400 font-medium">Jenis:</span> <span class="font-bold text-purple-700">${d.jenisPemeliharaan}</span></div>` : ''}
            ${d.pelaksana ? `<div><span class="text-slate-400 font-medium">Pelaksana:</span> <span class="font-bold text-slate-800">${d.pelaksana}</span></div>` : ''}
            ${d.gangguanKeterangan ? `<div><span class="text-slate-400 font-medium">Keterangan Gangguan:</span> <span class="font-bold text-red-600">${d.gangguanKeterangan}</span></div>` : ''}
            ${d.catatan ? `<div><span class="text-slate-400 font-medium">Catatan:</span> <p class="italic text-slate-600">"${d.catatan}"</p></div>` : ''}
            <div><span class="text-slate-400 font-medium">Koordinat:</span> <span class="font-mono text-slate-600">${point.coords.lat.toFixed(5)}, ${point.coords.lng.toFixed(5)}</span></div>
          </div>

          <div class="text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Status: ${point.isEksekusi ? 'Selesai' : 'Pending / Dalam Proses'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setTimeout(() => {
          setSelectedRecord(point);
        }, 0);
      });

      marker.addTo(markersLayer);
      markerInstancesRef.current[point.id] = marker;
    });

    if (mapPoints.length > 0 && !selectedRecord) {
      const bounds = L.latLngBounds(mapPoints.map(item => [item.coords.lat, item.coords.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mapPoints, selectedRecord]);

  // Handle File Upload Parsing for KML or GeoJSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    if (!importLayerName) {
      setImportLayerName(file.name.replace(/\.[^/.]+$/, ""));
    }
    setImportError(null);

    const isKmz = file.name.toLowerCase().endsWith('.kmz');

    if (isKmz) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const kmlFileName = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
        if (!kmlFileName) {
          setImportError('Tidak ada file KML (.kml) ditemukan di dalam arsip KMZ ini.');
          return;
        }
        const kmlText = await zip.files[kmlFileName].async('string');
        setImportFileContent(kmlText);
      } catch (err: any) {
        console.error('KMZ parsing error:', err);
        setImportError('Gagal membaca file KMZ: ' + (err.message || 'Format ZIP/KMZ tidak valid.'));
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportFileContent(content);
        setImportError(null);
      };
      reader.onerror = () => {
        setImportError('Gagal membaca file.');
      };
      reader.readAsText(file);
    }
  };

  const handleFitBoundsToImportedMap = (mapItem: ImportedFeederMap) => {
    const map = leafletMapRef.current;
    if (!map || !mapItem.geojson) return;
    try {
      const geoLayer = L.geoJSON(mapItem.geojson);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] });
      }
    } catch (e) {
      console.error('Failed to fit bounds:', e);
    }
  };

  const processImportFile = () => {
    if (!importFileContent) {
      setImportError('Pilih file KML / KMZ / GeoJSON terlebih dahulu.');
      return;
    }

    const layerTitle = importLayerName.trim() || importFileName || 'Peta Penyulang';

    try {
      let geojsonObj: any = null;

      const isKmlOrKmz = importFileName.toLowerCase().endsWith('.kml') || 
                         importFileName.toLowerCase().endsWith('.kmz') || 
                         importFileContent.includes('<kml') || 
                         importFileContent.includes('<Placemark');

      if (isKmlOrKmz) {
        // Parse KML XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(importFileContent, "text/xml");
        const placemarks = Array.from(xmlDoc.getElementsByTagName("Placemark"));

        const features: any[] = [];
        placemarks.forEach((pm, idx) => {
          const name = pm.getElementsByTagName("name")[0]?.textContent || `${layerTitle} #${idx + 1}`;
          const description = pm.getElementsByTagName("description")[0]?.textContent || '';
          
          const coordsEls = pm.getElementsByTagName("coordinates");
          for (let c = 0; c < coordsEls.length; c++) {
            const coordsEl = coordsEls[c];
            if (!coordsEl || !coordsEl.textContent) continue;

            const rawCoords = coordsEl.textContent.trim().split(/\s+/);
            const coords = rawCoords.map(str => {
              const parts = str.split(',').map(Number);
              return [parts[0], parts[1]]; // [lng, lat]
            }).filter(c => !isNaN(c[0]) && !isNaN(c[1]) && c[0] !== 0 && c[1] !== 0);

            if (coords.length === 0) continue;

            if (coords.length === 1) {
              features.push({
                type: "Feature",
                properties: { name, description, layerTitle },
                geometry: { type: "Point", coordinates: coords[0] }
              });
            } else {
              features.push({
                type: "Feature",
                properties: { name, description, layerTitle },
                geometry: { type: "LineString", coordinates: coords }
              });
            }
          }
        });

        if (features.length === 0) {
          throw new Error('Tidak ada koordinat valid ditemukan dalam file KML/KMZ.');
        }

        geojsonObj = {
          type: "FeatureCollection",
          features
        };
      } else {
        // Parse JSON / GeoJSON
        geojsonObj = JSON.parse(importFileContent);
      }

      const newMap: ImportedFeederMap = {
        id: Date.now().toString(),
        name: layerTitle,
        color: importColor,
        geojson: geojsonObj,
        visible: true,
        createdAt: new Date().toLocaleDateString('id-ID')
      };

      saveImportedMaps([...importedMaps, newMap]);

      // Zoom map to the newly imported layer
      setTimeout(() => {
        handleFitBoundsToImportedMap(newMap);
      }, 300);

      // Reset modal
      setIsImportModalOpen(false);
      setImportFileName('');
      setImportLayerName('');
      setImportFileContent(null);
      setImportError(null);
    } catch (err: any) {
      setImportError(err?.message || 'Format file tidak valid (Gunakan KML, KMZ, atau GeoJSON valid).');
    }
  };

  const handleToggleMapVisibility = (id: string) => {
    const updated = importedMaps.map(m => m.id === id ? { ...m, visible: m.visible === false ? true : false } : m);
    saveImportedMaps(updated);
  };

  const handleChangeMapColor = (id: string, newColor: string) => {
    const updated = importedMaps.map(m => m.id === id ? { ...m, color: newColor } : m);
    saveImportedMaps(updated);
  };

  const handleDeleteImportedMap = (id: string) => {
    const updated = importedMaps.filter(m => m.id !== id);
    saveImportedMaps(updated);
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
    if (!map) return;
    
    setSelectedRecord(null);
    const bounds = L.latLngBounds([]);
    let hasBounds = false;

    if (mapPoints.length > 0) {
      mapPoints.forEach(p => {
        bounds.extend([p.coords.lat, p.coords.lng]);
        hasBounds = true;
      });
    }

    importedMaps.forEach(m => {
      if (m.visible !== false && m.geojson) {
        try {
          const geoLayer = L.geoJSON(m.geojson);
          const mBounds = geoLayer.getBounds();
          if (mBounds.isValid()) {
            bounds.extend(mBounds);
            hasBounds = true;
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    if (hasBounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-xl flex flex-col lg:flex-row h-[620px] lg:h-[700px] transition-all duration-300 ${
      isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      
      {/* Sidebar Controls & List */}
      <div className={`w-full lg:w-88 border-r flex flex-col h-[280px] lg:h-full ${
        isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-950/60'
      }`}>
        
        {/* Sidebar Header & Actions */}
        <div className={`p-3 border-b space-y-2 shrink-0 ${isLight ? 'border-slate-200 bg-white' : 'border-slate-800 bg-slate-900'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-500">
              <MapIcon className="w-4 h-4" />
              Peta Sebaran Jaringan
            </h3>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {mapPoints.length} Point
            </span>
          </div>

          {/* Action Bar: Export & Impor Peta */}
          <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px]">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-2 py-1.5 font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border border-teal-400/50 rounded-lg flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer"
              title="Import Peta Penyulang (GeoJSON/KML)"
            >
              <Upload className="w-3 h-3 stroke-[3]" />
              <span>+ Impor Peta</span>
            </button>
            <button
              onClick={() => exportToKml(records)}
              className="px-2 py-1.5 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Export KML"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>.KML</span>
            </button>
            <button
              onClick={() => exportToKmz(records)}
              className="px-2 py-1.5 font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
              title="Export KMZ"
            >
              <Download className="w-3 h-3 text-indigo-400" />
              <span>.KMZ</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari section, penyulang, atau temuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-emerald-500/40 ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
          </div>
        </div>

        {/* Category Selector Tabs */}
        <div className={`px-2 py-1.5 border-b flex gap-1 overflow-x-auto scrollbar-none shrink-0 text-[10px] font-bold ${
          isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2 py-1 rounded-md whitespace-nowrap transition-all ${
              categoryFilter === 'ALL'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Semua ({mapPoints.length})
          </button>
          <button
            onClick={() => setCategoryFilter('ROW')}
            className={`px-2 py-1 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === 'ROW'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
          >
            <TreePine className="w-3 h-3 text-emerald-400" /> ROW
          </button>
          <button
            onClick={() => setCategoryFilter('INSPEKSI')}
            className={`px-2 py-1 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === 'INSPEKSI'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
            }`}
          >
            <ClipboardCheck className="w-3 h-3 text-cyan-400" /> Inspeksi
          </button>
          <button
            onClick={() => setCategoryFilter('PEMELIHARAAN')}
            className={`px-2 py-1 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === 'PEMELIHARAAN'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
            }`}
          >
            <Wrench className="w-3 h-3 text-purple-400" /> Maintenance
          </button>
          <button
            onClick={() => setCategoryFilter('GANGGUAN')}
            className={`px-2 py-1 rounded-md whitespace-nowrap transition-all flex items-center gap-1 ${
              categoryFilter === 'GANGGUAN'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
            }`}
          >
            <Zap className="w-3 h-3 text-red-400" /> Gangguan
          </button>
        </div>


        {/* Imported Feeder Map Layers List (Peta Jaringan per File) */}
        {importedMaps.length > 0 && (
          <div className={`p-2 border-b text-xs space-y-1.5 ${isLight ? 'bg-emerald-50/70 border-slate-200' : 'bg-emerald-950/30 border-slate-800'}`}>
            <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> 
                Peta Feeder Import ({importedMaps.length} File)
              </span>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="text-[9px] text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Tambah File
              </button>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
              {importedMaps.map(m => {
                const isVisible = m.visible !== false;
                const featureCount = m.geojson?.features?.length || 0;

                return (
                  <div 
                    key={m.id} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition-all ${
                      isVisible 
                        ? isLight ? 'bg-white border-emerald-300 shadow-xs' : 'bg-slate-900/90 border-emerald-500/40' 
                        : 'opacity-50 bg-slate-900/20 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => handleToggleMapVisibility(m.id)}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer shrink-0"
                        title={isVisible ? 'Sembunyikan Peta' : 'Tampilkan Peta'}
                      />

                      <button
                        onClick={() => handleToggleMapVisibility(m.id)}
                        className={`p-1 rounded-lg transition ${
                          isVisible 
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                            : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                        title={isVisible ? 'Sembunyikan layer di peta' : 'Tampilkan layer di peta'}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      <div className="relative group shrink-0">
                        <input
                          type="color"
                          value={m.color || '#10b981'}
                          onChange={(e) => handleChangeMapColor(m.id, e.target.value)}
                          className="w-4 h-4 rounded cursor-pointer border-0 bg-transparent p-0"
                          title="Ubah Warna Rute"
                        />
                      </div>

                      <div className="truncate">
                        <div className="font-extrabold truncate text-slate-200" title={m.name}>
                          {m.name}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1">
                          <span>{featureCount} rute/tiang</span>
                          <span>•</span>
                          <span>{m.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleFitBoundsToImportedMap(m)}
                        className="p-1 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition"
                        title="Fokus / Zoom ke Rute Ini"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteImportedMap(m.id)}
                        className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                        title="Hapus Layer File Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List of Filtered Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {mapPoints.length === 0 ? (
            <div className="text-center py-8 px-4 text-slate-400 space-y-1">
              <Info className="w-5 h-5 mx-auto text-slate-500" />
              <p className="text-xs">Tidak ada lokasi temuan cocok.</p>
            </div>
          ) : (
            mapPoints.map((item) => {
              const isSelected = selectedRecord?.id === item.id;
              
              let catBadgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
              if (item.category === 'GANGGUAN') catBadgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
              if (item.category === 'INSPEKSI') catBadgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
              if (item.category === 'PEMELIHARAAN') catBadgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/30';

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedRecord(item);
                    const map = leafletMapRef.current;
                    if (map) {
                      map.setView([item.coords.lat, item.coords.lng], 16);
                      const marker = markerInstancesRef.current[item.id];
                      if (marker) setTimeout(() => marker.openPopup(), 300);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col text-xs leading-tight cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-800 text-white border-emerald-500 shadow-lg' 
                      : isLight 
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                        : 'bg-slate-900/90 hover:bg-slate-800/80 text-slate-200 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1 font-sans">
                    <span className={`text-[9px] font-extrabold uppercase border px-1.5 py-0.5 rounded ${catBadgeColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      {item.penyulang}
                    </span>
                  </div>
                  <h4 className="font-bold text-[11px] mb-0.5 truncate w-full text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.coords.lat.toFixed(4)}, {item.coords.lng.toFixed(4)}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Map Canvas Frame */}
      <div className="flex-1 relative h-full min-h-[300px]">
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Unified Interactive Map Legend (Bottom-Left) */}
        <div className={`absolute bottom-4 left-4 z-20 p-3 rounded-2xl border shadow-xl max-w-[220px] space-y-2 text-[10px] backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-950/90 border-slate-800 text-white'
        }`}>
          <h4 className="font-black uppercase tracking-wider text-[9px] flex items-center gap-1.5 text-emerald-400">
            <Compass className="w-3.5 h-3.5 text-emerald-500" />
            Legenda Peta Sebaran (4 Kategori)
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500 text-white shrink-0"><TreePine className="w-3 h-3" /></span>
              <span className="font-bold">Temuan & Pemangkasan ROW</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-500 text-white shrink-0"><ClipboardCheck className="w-3 h-3" /></span>
              <span className="font-bold">Monitoring Hasil Inspeksi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-500 text-white shrink-0"><Wrench className="w-3 h-3" /></span>
              <span className="font-bold">Monitoring Pemeliharaan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-red-500 text-white shrink-0 animate-pulse"><Zap className="w-3 h-3" /></span>
              <span className="font-bold text-red-400">Lokasi Gangguan Outage</span>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 pt-1.5 border-t border-slate-800/40 leading-tight">
            *Gunakan menu "+ Impor Peta" untuk mengunggah peta rute feeder KML/GeoJSON.
          </p>
        </div>
      </div>

      {/* Modal Import Peta Penyulang */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative overflow-hidden transition-all ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Impor Peta Jaringan / Feeder</h3>
                <p className="text-xs text-slate-400">Unggah file GeoJSON (.geojson, .json), KMZ (.kmz), atau KML (.kml) penyulang</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-300">Nama Layer Peta Feeder</label>
                <input
                  type="text"
                  placeholder="e.g. Rute Penyulang Senayan 20kV"
                  value={importLayerName}
                  onChange={(e) => setImportLayerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Warna Rute Jaringan</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={importColor}
                    onChange={(e) => setImportColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-700 bg-transparent p-1"
                  />
                  <span className="font-mono text-emerald-400 font-bold">{importColor}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-300">Upload File (.kml / .geojson / .json)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-950/50 relative">
                  <input
                    type="file"
                    accept=".kml,.kmz,.geojson,.json,.xml"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 mx-auto text-emerald-500 mb-2 animate-bounce" />
                  <p className="font-bold text-slate-200">
                    {importFileName ? importFileName : "Klik atau seret file KML / GeoJSON ke sini"}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Mendukung rute polylines & koordinat tiang/penyulang PLN</p>
                </div>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={processImportFile}
                  className="px-5 py-2 rounded-xl font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tampilkan di Peta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
