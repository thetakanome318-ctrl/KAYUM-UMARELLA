import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Eye, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Layers, 
  Maximize2, 
  FileCode, 
  Power, 
  Activity, 
  Sliders,
  X,
  Share2,
  FileSpreadsheet,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { Penyulang, MasterSection } from '../types';

export interface SldNode {
  id: string;
  name: string;
  type: 'GI' | 'TRAFO_GI' | 'BUSBAR' | 'PMT' | 'RECLOSER' | 'LBS' | 'FCO' | 'GARDU' | 'SPS' | 'SECTION_LINE' | 'INCOMING' | 'LINE_UP' | 'LINE_DOWN';
  sectionName?: string;
  status: 'CLOSED' | 'OPEN' | 'TRIP' | 'NORMAL';
  currentAmpere?: number;
  voltageKv?: number;
  customerCount?: number;
  sistemOperasi?: 'Loop' | 'Radial';
  x?: number;
  y?: number;
  keterangan?: string;
  lineDirection?: 'none' | 'up' | 'down' | 'both';
}

export interface SldDiagram {
  id: string;
  title: string;
  penyulang: string;
  substation: string;
  capacityMva: number;
  operatingVoltageKv: number;
  updatedAt: string;
  sourceFileName?: string;
  imageUrl?: string; // Mode Gambar SLD Diagram Image URL / Data Base64
  nodes: SldNode[];
}

interface SldViewProps {
  isLight: boolean;
  penyulangList?: Penyulang[];
  sectionsList?: MasterSection[];
}

// Default SLD Data initialized EMPTY per user explicit request
const DEFAULT_SLD_DATA: SldDiagram[] = [];

export const SldView: React.FC<SldViewProps> = ({ isLight, penyulangList = [], sectionsList = [] }) => {
  // Persistence for user imported SLDs
  const [diagrams, setDiagrams] = useState<SldDiagram[]>(() => {
    try {
      const saved = localStorage.getItem('pln_sld_diagrams_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load SLD diagrams:', e);
    }
    return DEFAULT_SLD_DATA;
  });

  const [selectedDiagramId, setSelectedDiagramId] = useState<string>(() => diagrams[0]?.id || '');
  const [viewMode, setViewMode] = useState<'image' | 'nodes'>('image'); // Mode Gambar SLD is primary
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<SldNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDiagramTitle, setImportDiagramTitle] = useState('');
  const [importPenyulang, setImportPenyulang] = useState(() => penyulangList[0]?.nama || 'Penyulang Passo');
  const [importFileName, setImportFileName] = useState('');
  const [importContent, setImportContent] = useState<string | null>(null);
  const [importImageUrl, setImportImageUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Diagram Editing State (Ganti Nama & Edit Diagram)
  const [isEditDiagramModalOpen, setIsEditDiagramModalOpen] = useState(false);
  const [editDiagramTitle, setEditDiagramTitle] = useState('');
  const [editDiagramPenyulang, setEditDiagramPenyulang] = useState('');
  const [editDiagramSubstation, setEditDiagramSubstation] = useState('');
  const [editDiagramCapacity, setEditDiagramCapacity] = useState(30);
  const [editDiagramVoltage, setEditDiagramVoltage] = useState(20);

  // Node/Component Editing Modal State (Edit & Hapus Icon di Dalamnya)
  const [editingNode, setEditingNode] = useState<SldNode | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);

  // Node form fields
  const [nodeFormName, setNodeFormName] = useState('');
  const [nodeFormType, setNodeFormType] = useState<SldNode['type']>('LBS');
  const [nodeFormStatus, setNodeFormStatus] = useState<SldNode['status']>('CLOSED');
  const [nodeFormCurrent, setNodeFormCurrent] = useState(150);
  const [nodeFormVoltage, setNodeFormVoltage] = useState(20);
  const [nodeFormSection, setNodeFormSection] = useState('');
  const [nodeFormKeterangan, setNodeFormKeterangan] = useState('');
  const [nodeFormLineDirection, setNodeFormLineDirection] = useState<'none' | 'up' | 'down' | 'both'>('none');

  // Save diagrams to localStorage
  const saveDiagrams = (updated: SldDiagram[]) => {
    setDiagrams(updated);
    try {
      localStorage.setItem('pln_sld_diagrams_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save SLD diagrams:', e);
    }
  };

  const activeDiagram = useMemo(() => {
    return diagrams.find(d => d.id === selectedDiagramId) || diagrams[0] || null;
  }, [diagrams, selectedDiagramId]);

  // Open edit diagram modal
  const handleOpenEditDiagram = () => {
    if (!activeDiagram) return;
    setEditDiagramTitle(activeDiagram.title);
    setEditDiagramPenyulang(activeDiagram.penyulang);
    setEditDiagramSubstation(activeDiagram.substation);
    setEditDiagramCapacity(activeDiagram.capacityMva);
    setEditDiagramVoltage(activeDiagram.operatingVoltageKv);
    setIsEditDiagramModalOpen(true);
  };

  // Save diagram edits
  const handleSaveDiagramEdits = () => {
    if (!activeDiagram) return;
    const updated = diagrams.map(d => {
      if (d.id !== activeDiagram.id) return d;
      return {
        ...d,
        title: editDiagramTitle.trim() || d.title,
        penyulang: editDiagramPenyulang,
        substation: editDiagramSubstation.trim() || d.substation,
        capacityMva: Number(editDiagramCapacity) || 30,
        operatingVoltageKv: Number(editDiagramVoltage) || 20,
        updatedAt: new Date().toLocaleDateString('id-ID')
      };
    });
    saveDiagrams(updated);
    setIsEditDiagramModalOpen(false);
  };

  // Open Edit Node Modal on Click
  const handleNodeClick = (node: SldNode) => {
    setEditingNode(node);
    setNodeFormName(node.name);
    setNodeFormType(node.type);
    setNodeFormStatus(node.status);
    setNodeFormCurrent(node.currentAmpere || 0);
    setNodeFormVoltage(node.voltageKv || 20);
    setNodeFormSection(node.sectionName || '');
    setNodeFormKeterangan(node.keterangan || '');
    setNodeFormLineDirection(node.lineDirection || 'none');
    setIsAddingNode(false);
    setIsNodeModalOpen(true);
  };

  // Open Add Node Form
  const handleOpenAddNode = () => {
    setEditingNode(null);
    setNodeFormName('');
    setNodeFormType('LBS');
    setNodeFormStatus('CLOSED');
    setNodeFormCurrent(150);
    setNodeFormVoltage(20);
    setNodeFormSection('');
    setNodeFormKeterangan('');
    setNodeFormLineDirection('none');
    setIsAddingNode(true);
    setIsNodeModalOpen(true);
  };

  // Save Node Changes (Edit or Add)
  const handleSaveNodeForm = () => {
    if (!activeDiagram) return;

    let updatedNodes = [...activeDiagram.nodes];

    if (isAddingNode) {
      const newNode: SldNode = {
        id: `node-${Date.now()}`,
        name: nodeFormName.trim() || `Komponen ${nodeFormType}`,
        type: nodeFormType,
        status: nodeFormStatus,
        currentAmpere: Number(nodeFormCurrent) || 0,
        voltageKv: Number(nodeFormVoltage) || 20,
        sectionName: nodeFormSection.trim() || undefined,
        keterangan: nodeFormKeterangan.trim() || undefined,
        lineDirection: nodeFormLineDirection
      };
      updatedNodes.push(newNode);
    } else if (editingNode) {
      updatedNodes = updatedNodes.map(n => {
        if (n.id !== editingNode.id) return n;
        return {
          ...n,
          name: nodeFormName.trim() || n.name,
          type: nodeFormType,
          status: nodeFormStatus,
          currentAmpere: Number(nodeFormCurrent) || 0,
          voltageKv: Number(nodeFormVoltage) || 20,
          sectionName: nodeFormSection.trim() || undefined,
          keterangan: nodeFormKeterangan.trim() || undefined,
          lineDirection: nodeFormLineDirection
        };
      });
    }

    const updatedDiagrams = diagrams.map(d => {
      if (d.id !== activeDiagram.id) return d;
      return {
        ...d,
        nodes: updatedNodes,
        updatedAt: new Date().toLocaleDateString('id-ID')
      };
    });

    saveDiagrams(updatedDiagrams);
    setIsNodeModalOpen(false);
    setEditingNode(null);
  };

  // Delete Node (Hapus Icon di Dalamnya)
  const handleDeleteNode = (nodeId: string) => {
    if (!activeDiagram) return;
    const updatedNodes = activeDiagram.nodes.filter(n => n.id !== nodeId);
    const updatedDiagrams = diagrams.map(d => {
      if (d.id !== activeDiagram.id) return d;
      return {
        ...d,
        nodes: updatedNodes,
        updatedAt: new Date().toLocaleDateString('id-ID')
      };
    });
    saveDiagrams(updatedDiagrams);
    setIsNodeModalOpen(false);
    setEditingNode(null);
  };

  // Toggle Equipment Status directly (Legacy helper)
  const handleToggleNodeStatus = (nodeId: string) => {
    if (!activeDiagram) return;
    const updatedNodes = activeDiagram.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const newStatus: SldNode['status'] = n.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
      return {
        ...n,
        status: newStatus,
        currentAmpere: newStatus === 'OPEN' ? 0 : (n.currentAmpere || 150)
      };
    });

    const updatedDiagrams = diagrams.map(d => d.id === activeDiagram.id ? { ...d, nodes: updatedNodes, updatedAt: new Date().toLocaleDateString('id-ID') } : d);
    saveDiagrams(updatedDiagrams);
  };

  // Visio / Image File Input Handler
  const handleVisioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    if (!importDiagramTitle) {
      setImportDiagramTitle(`SLD ${file.name.replace(/\.[^/.]+$/, "")}`);
    }
    setImportError(null);

    // If Image file (.png, .jpg, .jpeg, .svg, .webp)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportImageUrl(event.target?.result as string);
        setImportContent(null);
      };
      reader.readAsDataURL(file);
    } else {
      // Visio XML text file
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setImportContent(content);
        setImportImageUrl(null);
      };
      reader.onerror = () => {
        setImportError('Gagal membaca file Visio.');
      };
      reader.readAsText(file);
    }
  };

  // Process Diagram Import
  const handleProcessImportVisio = () => {
    if (!importContent && !importImageUrl && !importFileName) {
      setImportError('Silakan pilih file Visio (.vsdx, .vdx, .xml, .json) atau Gambar (.png, .jpg, .svg) terlebih dahulu.');
      return;
    }

    try {
      let parsedNodes: SldNode[] = [];

      // If text content (JSON or Visio XML)
      if (importContent) {
        if (importContent.trim().startsWith('{')) {
          const parsed = JSON.parse(importContent);
          if (Array.isArray(parsed.nodes)) parsedNodes = parsed.nodes;
          else if (Array.isArray(parsed)) parsedNodes = parsed;
        } else if (importContent.includes('<VisioDocument') || importContent.includes('<Page') || importContent.includes('<Shape') || importContent.includes('<xml')) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(importContent, "text/xml");
          const shapes = Array.from(xmlDoc.getElementsByTagName("Shape"));

          shapes.forEach((s, idx) => {
            const textEl = s.getElementsByTagName("Text")[0];
            const text = textEl?.textContent?.trim() || `Peralatan Visio #${idx + 1}`;
            
            let type: SldNode['type'] = 'LBS';
            const textLower = text.toLowerCase();
            if (textLower.includes('trafo') || textLower.includes('transformer')) type = 'TRAFO_GI';
            else if (textLower.includes('busbar') || textLower.includes('bus')) type = 'BUSBAR';
            else if (textLower.includes('incoming') || textLower.includes('inc')) type = 'INCOMING';
            else if (textLower.includes('pmt') || textLower.includes('breaker') || textLower.includes('cb')) type = 'PMT';
            else if (textLower.includes('recloser') || textLower.includes('pbo')) type = 'RECLOSER';
            else if (textLower.includes('fco') || textLower.includes('fuse')) type = 'FCO';
            else if (textLower.includes('gardu') || textLower.includes('gd')) type = 'GARDU';
            else if (textLower.includes('line up') || textLower.includes('garis atas')) type = 'LINE_UP';
            else if (textLower.includes('line down') || textLower.includes('garis bawah')) type = 'LINE_DOWN';

            parsedNodes.push({
              id: `vnode-${Date.now()}-${idx}`,
              name: text,
              type,
              sectionName: `Section ${idx + 1}`,
              status: textLower.includes('open') || textLower.includes('no') ? 'OPEN' : 'CLOSED',
              currentAmpere: Math.floor(Math.random() * 200) + 50,
              voltageKv: 20,
              sistemOperasi: textLower.includes('loop') ? 'Loop' : 'Radial',
              keterangan: 'Di-impor dari Visio Document'
            });
          });
        }
      }

      // Default generated nodes if empty or image import
      if (parsedNodes.length === 0) {
        const cleanName = importFileName.replace(/\.[^/.]+$/, "");
        parsedNodes = [
          { id: `fn-1`, name: `Trafo GI ${cleanName}`, type: 'TRAFO_GI', status: 'CLOSED', currentAmpere: 350, voltageKv: 150 },
          { id: `fn-2`, name: `Busbar 20kV ${cleanName}`, type: 'BUSBAR', status: 'CLOSED', currentAmpere: 350, voltageKv: 20 },
          { id: `fn-inc`, name: `PMT Incoming ${cleanName}`, type: 'INCOMING', status: 'CLOSED', currentAmpere: 350, voltageKv: 20 },
          { id: `fn-3`, name: `PMT Outgoing ${cleanName}`, type: 'PMT', status: 'CLOSED', currentAmpere: 350, voltageKv: 20 },
          { id: `fn-4`, name: `Recloser Pangkal (Visio)`, type: 'RECLOSER', sectionName: 'Section Pangkal', status: 'CLOSED', currentAmpere: 290, voltageKv: 20, customerCount: 1200, sistemOperasi: 'Radial', lineDirection: 'up' },
          { id: `fn-5`, name: `LBS Section 1 (Visio)`, type: 'LBS', sectionName: 'Section 1', status: 'CLOSED', currentAmpere: 180, voltageKv: 20, customerCount: 640, sistemOperasi: 'Loop', lineDirection: 'down' },
          { id: `fn-6`, name: `LBS Section 2 (Tie Switch)`, type: 'LBS', sectionName: 'Section Tie', status: 'OPEN', currentAmpere: 0, voltageKv: 20, customerCount: 0, sistemOperasi: 'Loop' }
        ];
      }

      const newDiagram: SldDiagram = {
        id: `sld-${Date.now()}`,
        title: importDiagramTitle.trim() || `SLD Visio ${importFileName}`,
        penyulang: importPenyulang,
        substation: 'GI 150/20kV',
        capacityMva: 30,
        operatingVoltageKv: 20,
        updatedAt: new Date().toLocaleDateString('id-ID'),
        sourceFileName: importFileName || 'Diagram_Visio_Import.vdx',
        imageUrl: importImageUrl || undefined,
        nodes: parsedNodes
      };

      const updatedList = [...diagrams, newDiagram];
      saveDiagrams(updatedList);
      setSelectedDiagramId(newDiagram.id);
      setViewMode('image');

      setIsImportModalOpen(false);
      setImportDiagramTitle('');
      setImportFileName('');
      setImportContent(null);
      setImportImageUrl(null);
      setImportError(null);
    } catch (err: any) {
      setImportError('Gagal memproses struktur file Visio: ' + (err.message || 'Format tidak dikenal.'));
    }
  };

  // Delete diagram
  const handleDeleteDiagram = (diagramId: string) => {
    const updated = diagrams.filter(d => d.id !== diagramId);
    saveDiagrams(updated);
    if (updated.length > 0) setSelectedDiagramId(updated[0].id);
    else setSelectedDiagramId('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/95 border-slate-800 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-700 text-white rounded-2xl shadow-lg shadow-cyan-600/30">
            <Layers className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <span>SLD Visio (Single Line Diagram 20kV)</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-extrabold border border-cyan-500/30">
                Mode Gambar Visio
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Visualisasi Gambar Skematik Visio & Status Peralatan Jaringan Listrik 20kV (Bisa Edit Diagram & Nama Komponen)
            </p>
          </div>
        </div>

        {/* View Mode Switcher & Import Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-950/20 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center space-x-1">
            <button
              onClick={() => setViewMode('image')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'image'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Mode Gambar Diagram</span>
            </button>
            <button
              onClick={() => setViewMode('nodes')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'nodes'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Detail Komponen ({activeDiagram?.nodes.length || 0})</span>
            </button>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Impor File Visio / Gambar</span>
          </button>
        </div>
      </div>

      {/* DIAGRAM SELECTOR TABS & EMPTY STATE */}
      {diagrams.length === 0 ? (
        <div className={`p-12 rounded-2xl border text-center space-y-4 shadow-xl ${
          isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/90 border-slate-800 text-slate-300'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className={`text-base font-extrabold ${isLight ? 'text-slate-800' : 'text-white'}`}>Belum Ada File Visio SLD Ditambahkan</h3>
            <p className="text-xs text-slate-400">
              Hanya diagram SLD Visio yang Anda impor yang akan ditampilkan di sini (data default GI Passo & GI Karpan telah dihapus).
            </p>
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-600/30 transition-all inline-flex items-center space-x-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Impor File Visio SLD Sekarang</span>
          </button>
        </div>
      ) : (
        <>
          {/* Active Diagram Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            {diagrams.map(d => (
              <div
                key={d.id}
                onClick={() => setSelectedDiagramId(d.id)}
                className={`px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center space-x-2 shrink-0 ${
                  d.id === activeDiagram?.id
                    ? isLight 
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30'
                    : isLight
                      ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{d.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-white">
                  {d.nodes.length} N
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDiagram(d.id);
                  }}
                  className="p-1 hover:bg-red-500/30 rounded text-red-300 transition-all ml-1"
                  title="Hapus Diagram"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* MAIN DIAGRAM DISPLAY CONTAINER */}
          {activeDiagram && (
            <div className={`rounded-2xl border shadow-xl overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              {/* Diagram Header Meta Bar */}
              <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/40'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-extrabold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        <span>{activeDiagram.title}</span>
                        {activeDiagram.sourceFileName && (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            isLight ? 'bg-slate-200 text-cyan-700' : 'bg-slate-800 text-cyan-300'
                          }`}>
                            {activeDiagram.sourceFileName}
                          </span>
                        )}
                      </h3>
                      {/* Edit Diagram Button */}
                      <button 
                        onClick={handleOpenEditDiagram}
                        className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-all"
                        title="Edit Info Diagram & Nama"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Penyulang: <strong className={isLight ? 'text-emerald-600 font-extrabold' : 'text-emerald-400'}>{activeDiagram.penyulang}</strong> • Substation: <strong className={isLight ? 'text-slate-800 font-extrabold' : 'text-white'}>{activeDiagram.substation}</strong> • Tegangan: <strong className={isLight ? 'text-slate-800 font-extrabold' : 'text-white'}>{activeDiagram.operatingVoltageKv} kV</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tambah Komponen Button */}
                  <button
                    onClick={handleOpenAddNode}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komponen</span>
                  </button>

                  {/* Zoom & Fullscreen Controls */}
                  {viewMode === 'image' && (
                    <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-cyan-400 px-2">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(100)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* MODE GAMBAR DIAGRAM (Visio Image View) */}
              {viewMode === 'image' ? (
                <div className={`p-6 relative min-h-[500px] flex items-center justify-center overflow-auto ${
                  isLight ? 'bg-slate-50' : 'bg-slate-950/90'
                }`}>
                  <div 
                    className="transition-transform duration-200 ease-out max-w-full"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  >
                    {activeDiagram.imageUrl ? (
                      /* Mode Gambar: Display Uploaded Visio Diagram Image */
                      <div className={`relative rounded-2xl border overflow-hidden shadow-2xl ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}>
                        <img 
                          src={activeDiagram.imageUrl} 
                          alt={activeDiagram.title}
                          className="max-w-full h-auto object-contain mx-auto"
                        />
                        <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-xl font-bold backdrop-blur-md border ${
                          isLight ? 'bg-white/80 border-cyan-500/30 text-cyan-700' : 'bg-slate-950/80 border-cyan-500/40 text-cyan-300'
                        } text-[11px]`}>
                          Mode Gambar Visio
                        </div>
                      </div>
                    ) : (
                      /* Mode Gambar: Generated SVG Schematic Diagram of 20kV Feeder */
                      <div className={`border rounded-2xl p-6 shadow-2xl max-w-4xl w-full mx-auto space-y-6 ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}>
                        {/* Schematic Title Bar */}
                        <div className={`flex items-center justify-between border-b pb-3 ${
                          isLight ? 'border-slate-100' : 'border-slate-800'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <span className={`text-xs font-black uppercase tracking-wider ${
                              isLight ? 'text-emerald-600' : 'text-emerald-400'
                            }`}>
                              DIAGRAM SKEMATIK VISIO 20kV — {activeDiagram.penyulang}
                            </span>
                          </div>
                          <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>STATUS OPERASI NORMAL</span>
                        </div>

                        {/* Interactive Vector Schematic Diagram Canvas */}
                        <div className="relative py-8 px-4 overflow-x-auto">
                          <div className="flex items-center justify-between min-w-[700px] gap-4 relative">
                            {/* Horizontal 20kV Bus Line Connection */}
                            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 -translate-y-1/2 z-0 opacity-80" />

                            {activeDiagram.nodes.map((node) => (
                              <div key={node.id} className="relative z-10 flex flex-col items-center group">
                                {/* Node Equipment Box */}
                                <div 
                                  onClick={() => handleNodeClick(node)}
                                  className="relative cursor-pointer transition-all duration-300 transform group-hover:scale-105"
                                  title={`Klik untuk Edit/Rename/Delete ${node.name}`}
                                >
                                  {/* Optional vertical line UP */}
                                  {(node.lineDirection === 'up' || node.lineDirection === 'both') && (
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-t ${
                                      node.status === 'CLOSED' || node.status === 'NORMAL'
                                        ? 'from-emerald-500 to-cyan-400'
                                        : 'from-rose-500 to-rose-400'
                                    } z-[-1]`} />
                                  )}

                                  {/* Optional vertical line DOWN */}
                                  {(node.lineDirection === 'down' || node.lineDirection === 'both') && (
                                    <div className={`absolute top-full left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b ${
                                      node.status === 'CLOSED' || node.status === 'NORMAL'
                                        ? 'from-emerald-500 to-cyan-400'
                                        : 'from-rose-500 to-rose-400'
                                    } z-[-1]`} />
                                  )}

                                  {node.type === 'LINE_UP' ? (
                                    <div className="flex flex-col items-center h-24 justify-end pb-1 relative">
                                      {/* Vertical line going UP from the center horizontal busbar */}
                                      <div className={`w-1 h-20 bg-gradient-to-t ${
                                        node.status === 'CLOSED' || node.status === 'NORMAL'
                                          ? 'from-emerald-500 to-cyan-400'
                                          : 'from-rose-500 to-rose-400'
                                      } relative rounded-t`}>
                                        <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${
                                          node.status === 'CLOSED' || node.status === 'NORMAL'
                                            ? 'bg-cyan-400 shadow-cyan-400/50'
                                            : 'bg-rose-400 shadow-rose-400/50'
                                        } shadow-md border border-slate-900`} />
                                      </div>
                                    </div>
                                  ) : node.type === 'LINE_DOWN' ? (
                                    <div className="flex flex-col items-center h-24 justify-start pt-1 relative">
                                      {/* Vertical line going DOWN from the center horizontal busbar */}
                                      <div className={`w-1 h-20 bg-gradient-to-b ${
                                        node.status === 'CLOSED' || node.status === 'NORMAL'
                                          ? 'from-emerald-500 to-cyan-400'
                                          : 'from-rose-500 to-rose-400'
                                      } relative rounded-b`}>
                                        <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${
                                          node.status === 'CLOSED' || node.status === 'NORMAL'
                                            ? 'bg-cyan-400 shadow-cyan-400/50'
                                            : 'bg-rose-400 shadow-rose-400/50'
                                        } shadow-md border border-slate-900`} />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`p-3 rounded-2xl border shadow-xl ${
                                      node.status === 'CLOSED' || node.status === 'NORMAL'
                                        ? isLight
                                          ? 'bg-emerald-50 border-emerald-400/60 text-emerald-700 shadow-emerald-500/10'
                                          : 'bg-slate-950 border-emerald-500/60 text-emerald-300 shadow-emerald-500/20'
                                        : isLight
                                          ? 'bg-rose-50 border-rose-400/60 text-rose-700 shadow-rose-500/10'
                                          : 'bg-slate-950 border-rose-500/60 text-rose-300 shadow-rose-500/20'
                                    }`}>
                                      {/* Node Icon/Symbol */}
                                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold font-mono text-xs border ${
                                        isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-white'
                                      }`}>
                                        {node.type === 'TRAFO_GI' && 'TR'}
                                        {node.type === 'BUSBAR' && 'BUS'}
                                        {node.type === 'PMT' && 'PMT'}
                                        {node.type === 'RECLOSER' && 'PBO'}
                                        {node.type === 'LBS' && 'LBS'}
                                        {node.type === 'FCO' && 'FCO'}
                                        {node.type === 'GARDU' && 'GD'}
                                        {node.type === 'GI' && 'GI'}
                                        {node.type === 'SPS' && 'SPS'}
                                        {node.type === 'SECTION_LINE' && 'SL'}
                                        {node.type === 'INCOMING' && 'INC'}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Node Label & Status */}
                                <div className="mt-2 text-center max-w-[100px]">
                                  <p className={`text-[11px] font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{node.name}</p>
                                  <span className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                    node.status === 'CLOSED' || node.status === 'NORMAL'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {node.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-3 rounded-xl border text-[11px] flex items-center justify-between ${
                          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'
                        }`}>
                          <span>Klik pada ikon peralatan skematik untuk <strong>Mengedit Nama, Mengubah Tipe/Beban, atau Menghapusnya</strong></span>
                          <span className="font-mono text-cyan-400 font-bold">Total Node: {activeDiagram.nodes.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* MODE DETAIL KOMPONEN (Node Table View) */
                <div className="p-6 space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className={isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-300'}>
                          <th className="p-3 font-bold">Nama Peralatan</th>
                          <th className="p-3 font-bold">Tipe</th>
                          <th className="p-3 font-bold">Section</th>
                          <th className="p-3 font-bold text-center">Status</th>
                          <th className="p-3 font-bold text-center">Beban (Ampere)</th>
                          <th className="p-3 font-bold text-center">Tegangan (kV)</th>
                          <th className="p-3 font-bold">Keterangan</th>
                          <th className="p-3 font-bold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                        {activeDiagram.nodes.map(n => (
                          <tr key={n.id} className={`hover:${isLight ? 'bg-slate-50' : 'bg-slate-800/40'}`}>
                            <td className={`p-3 font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{n.name}</td>
                            <td className={`p-3 font-mono ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>{n.type}</td>
                            <td className={`p-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{n.sectionName || '-'}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                n.status === 'CLOSED' || n.status === 'NORMAL'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {n.status}
                              </span>
                            </td>
                            <td className={`p-3 text-center font-mono font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{n.currentAmpere || 0} A</td>
                            <td className={`p-3 text-center font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{n.voltageKv || 20} kV</td>
                            <td className={`p-3 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{n.keterangan || '-'}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleNodeClick(n)}
                                className="px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 border border-cyan-500/30"
                              >
                                Edit / Rename
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL EDIT DIAGRAM PROPERTIS (Ganti Nama Diagram) */}
      {isEditDiagramModalOpen && activeDiagram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Edit Info & Ganti Nama Diagram</span>
              </h3>
              <button onClick={() => setIsEditDiagramModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama / Judul Diagram SLD *</label>
                <input 
                  type="text"
                  value={editDiagramTitle}
                  onChange={(e) => setEditDiagramTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Penyulang Terkait *</label>
                <select
                  value={editDiagramPenyulang}
                  onChange={(e) => setEditDiagramPenyulang(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  {penyulangList.length > 0 ? (
                    penyulangList.map(p => (
                      <option key={p.id} value={p.nama}>{p.nama}</option>
                    ))
                  ) : (
                    <>
                      <option value="Penyulang Passo">Penyulang Passo</option>
                      <option value="Penyulang Laha">Penyulang Laha</option>
                      <option value="Penyulang Lateri">Penyulang Lateri</option>
                      <option value="Penyulang Poka">Penyulang Poka</option>
                      <option value="Penyulang Tulehu">Penyulang Tulehu</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Substation / GI *</label>
                <input 
                  type="text"
                  value={editDiagramSubstation}
                  onChange={(e) => setEditDiagramSubstation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kapasitas (MVA) *</label>
                  <input 
                    type="number"
                    value={editDiagramCapacity}
                    onChange={(e) => setEditDiagramCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tegangan (kV) *</label>
                  <input 
                    type="number"
                    value={editDiagramVoltage}
                    onChange={(e) => setEditDiagramVoltage(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button 
                onClick={() => setIsEditDiagramModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveDiagramEdits}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TAMBAH KOMPONEN (Edit & Hapus Icon di Dalamnya) */}
      {isNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>{isAddingNode ? 'Tambah Komponen SLD Baru' : `Edit Komponen: ${nodeFormName}`}</span>
              </h3>
              <button onClick={() => setIsNodeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Peralatan *</label>
                <input 
                  type="text"
                  placeholder="e.g. LBS Section Passo 3, PMT Outgoing"
                  value={nodeFormName}
                  onChange={(e) => setNodeFormName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tipe Alat *</label>
                  <select
                    value={nodeFormType}
                    onChange={(e) => setNodeFormType(e.target.value as SldNode['type'])}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="TRAFO_GI">Trafo GI (TR)</option>
                    <option value="BUSBAR">Busbar 20kV (BUS)</option>
                    <option value="INCOMING">Incoming 20kV (INC)</option>
                    <option value="PMT">PMT Outgoing (PMT)</option>
                    <option value="RECLOSER">Recloser / PBO</option>
                    <option value="LBS">LBS (Load Break Switch)</option>
                    <option value="FCO">FCO (Fuse Cut Out)</option>
                    <option value="GARDU">Gardu Distribusi (GD)</option>
                    <option value="GI">Gardu Induk (GI)</option>
                    <option value="SPS">Sectionalizer (SPS)</option>
                    <option value="SECTION_LINE">Section Line</option>
                    <option value="LINE_UP">Garis Hubung ke Atas (LINE_UP)</option>
                    <option value="LINE_DOWN">Garis Hubung ke Bawah (LINE_DOWN)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Status Operasi *</label>
                  <select
                    value={nodeFormStatus}
                    onChange={(e) => setNodeFormStatus(e.target.value as SldNode['status'])}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CLOSED">MASUK (CLOSED)</option>
                    <option value="OPEN">KELUAR (OPEN)</option>
                    <option value="TRIP">GANGGUAN (TRIP)</option>
                    <option value="NORMAL">NORMAL (GI)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Beban Arus (Ampere)</label>
                  <input 
                    type="number"
                    value={nodeFormCurrent}
                    onChange={(e) => setNodeFormCurrent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tegangan Jaringan (kV)</label>
                  <input 
                    type="number"
                    value={nodeFormVoltage}
                    onChange={(e) => setNodeFormVoltage(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Section Jaringan</label>
                <input 
                  type="text"
                  placeholder="e.g. Section 1, Section Passo Baru"
                  value={nodeFormSection}
                  onChange={(e) => setNodeFormSection(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Arah Garis Cabang (Branch Line)</label>
                <select
                  value={nodeFormLineDirection}
                  onChange={(e) => setNodeFormLineDirection(e.target.value as 'none' | 'up' | 'down' | 'both')}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="none">Tanpa Garis Cabang (None)</option>
                  <option value="up">Cabang ke Atas (Up)</option>
                  <option value="down">Cabang ke Bawah (Down)</option>
                  <option value="both">Cabang ke Atas & Bawah (Both)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Keterangan Tambahan</label>
                <textarea 
                  value={nodeFormKeterangan}
                  onChange={(e) => setNodeFormKeterangan(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <div>
                {!isAddingNode && editingNode && (
                  <button
                    onClick={() => handleDeleteNode(editingNode.id)}
                    className="px-3.5 py-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                    title="Hapus Komponen ini dari Diagram"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Icon</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsNodeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveNodeForm}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Simpan Komponen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR FILE VISIO / GAMBAR DIAGRAM SLD */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Impor Visio / Gambar SLD</h3>
                  <p className="text-xs text-slate-400">Pilih file Visio (.vsdx, .vdx, .xml) atau Gambar SLD (.png, .jpg)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Judul Diagram SLD *</label>
                <input
                  type="text"
                  placeholder="e.g. SLD Visio Penyulang Passo 20kV"
                  value={importDiagramTitle}
                  onChange={(e) => setImportDiagramTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Penyulang Terkait *</label>
                <select
                  value={importPenyulang}
                  onChange={(e) => setImportPenyulang(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  {penyulangList.length > 0 ? (
                    penyulangList.map((p) => (
                      <option key={p.id} value={p.nama}>
                        {p.nama}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Penyulang Passo">Penyulang Passo</option>
                      <option value="Penyulang Laha">Penyulang Laha</option>
                      <option value="Penyulang Lateri">Penyulang Lateri</option>
                      <option value="Penyulang Poka">Penyulang Poka</option>
                      <option value="Penyulang Tulehu">Penyulang Tulehu</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pilih File Visio / Gambar Diagram *</label>
                <input
                  type="file"
                  accept=".vsdx,.vdx,.xml,.json,.png,.jpg,.jpeg,.svg"
                  onChange={handleVisioFileChange}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white file:font-bold file:text-xs hover:file:bg-cyan-500 cursor-pointer"
                />
                {importFileName && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-1 font-bold">
                    File Terpilih: {importFileName}
                  </p>
                )}
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {importError}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleProcessImportVisio}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/30 flex items-center space-x-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Proses Impor Diagram</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
