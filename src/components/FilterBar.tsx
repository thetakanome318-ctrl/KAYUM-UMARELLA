import React from 'react';
import { Filter, Calendar, Search, LayoutDashboard, Clock, Table, BarChart3, X, CalendarDays } from 'lucide-react';
import { FilterState, ViewTab } from '../types';
import { BULAN_SIMPLE_LIST, YEAR_LIST } from '../data/mockData';

interface FilterBarProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  totalFilteredCount: number;
  availablePenyulang?: string[];
  availableYears?: number[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  activeTab,
  onTabChange,
  totalFilteredCount,
  availablePenyulang = [],
  availableYears = YEAR_LIST,
}) => {
  const handlePenyulangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, penyulang: e.target.value });
  };

  const handleTahunChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({ ...filter, tahun: val === 'ALL' ? 'ALL' : Number(val) });
  };

  const handleBulanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filter, bulan: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filter, search: e.target.value });
  };

  const clearFilters = () => {
    onFilterChange({
      penyulang: 'ALL',
      bulan: 'ALL',
      tahun: 'ALL',
      search: '',
    });
  };

  const hasActiveFilters = filter.penyulang !== 'ALL' || filter.bulan !== 'ALL' || filter.tahun !== 'ALL' || filter.search !== '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 space-y-3">
      {/* View Switcher & Search Bar Top Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        
        {/* Tabs navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => onTabChange('charts')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'charts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Grafik Tren & Analytics</span>
          </button>

          <button
            onClick={() => onTabChange('timeline')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Timeline Row Pohon</span>
          </button>

          <button
            onClick={() => onTabChange('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Kalender Hasil Tanggal</span>
          </button>

          <button
            onClick={() => onTabChange('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition ${
              activeTab === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-amber-600" />
            <span>Data Tabel ({totalFilteredCount})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari section, lokasi..."
            value={filter.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
          />
          {filter.search && (
            <button
              onClick={() => onFilterChange({ ...filter, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Select Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter Penyulang */}
        <div className="flex-1 min-w-[170px]">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-600" />
            Penyulang:
          </label>
          <select
            value={filter.penyulang}
            onChange={handlePenyulangChange}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-medium"
          >
            <option value="ALL">Semua Penyulang {availablePenyulang.length > 0 ? `(${availablePenyulang.length})` : ''}</option>
            {availablePenyulang.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tahun */}
        <div className="w-full sm:w-44">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-purple-600" />
            Monitoring Tahun:
          </label>
          <select
            value={filter.tahun}
            onChange={handleTahunChange}
            className="w-full px-3 py-1.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-purple-900 font-bold"
          >
            <option value="ALL">Semua Tahun</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Bulan */}
        <div className="flex-1 min-w-[180px]">
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-600" />
            Monitoring Bulan:
          </label>
          <select
            value={filter.bulan}
            onChange={handleBulanChange}
            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-medium"
          >
            <option value="ALL">Semua Bulan (Januari - Desember)</option>
            {BULAN_SIMPLE_LIST.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filter button */}
        {hasActiveFilters && (
          <div className="sm:self-end">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
