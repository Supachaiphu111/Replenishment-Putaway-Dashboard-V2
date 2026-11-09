import React from 'react';
import {
  Calendar,
  CheckCircle2,
  User,
  Filter,
  Search,
  RotateCcw,
  Clock,
  Check,
  Activity,
  AlertCircle,
  XCircle,
  Layers,
} from 'lucide-react';
import { FilterState, ShiftFilter } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableDates: string[];
  availableTasks: string[];
  availableStatuses: string[];
  availableUsers: string[];
  taskCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  totalFilteredCount: number;
  totalRawCount: number;
  shiftFilter: ShiftFilter;
  onSelectShift: (shift: ShiftFilter) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableDates,
  availableTasks,
  availableStatuses,
  availableUsers,
  taskCounts,
  statusCounts,
  totalFilteredCount,
  totalRawCount,
  shiftFilter,
  onSelectShift,
}) => {
  const handleReset = () => {
    onFilterChange({
      selectedDate: availableDates[0] || 'ALL',
      taskDescriptions: [], // empty = all tasks
      taskStatus: 'Complete', // User explicit default: Complete
      byUser: 'ALL',
      shift: 'ALL',
      hourRange: [0, 23],
      searchQuery: '',
    });
    onSelectShift('ALL');
  };

  const isFiltered =
    (filters.taskDescriptions && filters.taskDescriptions.length > 0) ||
    filters.taskStatus !== 'Complete' ||
    filters.byUser !== 'ALL' ||
    filters.searchQuery !== '' ||
    shiftFilter !== 'ALL' ||
    filters.selectedDate !== (availableDates[0] || 'ALL');

  // Multi-select Task handlers - updates selected tasks in real-time while preserving chosen status
  const handleToggleTask = (task: string) => {
    const current = filters.taskDescriptions || [];
    let updated: string[];
    if (current.includes(task)) {
      updated = current.filter((t) => t !== task);
    } else {
      updated = [...current, task];
    }
    onFilterChange({ ...filters, taskDescriptions: updated });
  };

  const handleSelectAllTasks = () => {
    onFilterChange({ ...filters, taskDescriptions: [] }); // empty means all
  };

  const handleClearAllTasks = () => {
    onFilterChange({ ...filters, taskDescriptions: ['__NONE__'] }); // deliberate empty filter
  };

  const selectedCount = filters.taskDescriptions.length;
  const isAllTasksSelected = selectedCount === 0;

  // Status Tab Definitions
  const statusTabs = [
    {
      id: 'Complete',
      label: 'Complete (งานเสร็จ)',
      icon: CheckCircle2,
      activeColor: 'bg-emerald-500 text-white shadow-emerald-500/25',
      badgeBg: 'bg-emerald-600/30 text-white',
    },
    {
      id: 'In Progress',
      label: 'In Progress (กำลังทำ)',
      icon: Activity,
      activeColor: 'bg-blue-500 text-white shadow-blue-500/25',
      badgeBg: 'bg-blue-600/30 text-white',
    },
    {
      id: 'Pending',
      label: 'Pending (รอดำเนินการ)',
      icon: AlertCircle,
      activeColor: 'bg-amber-500 text-white shadow-amber-500/25',
      badgeBg: 'bg-amber-600/30 text-white',
    },
    {
      id: 'Cancelled',
      label: 'Cancelled (ยกเลิก)',
      icon: XCircle,
      activeColor: 'bg-rose-500 text-white shadow-rose-500/25',
      badgeBg: 'bg-rose-600/30 text-white',
    },
    {
      id: 'ALL',
      label: 'ทุกสถานะ (All)',
      icon: Layers,
      activeColor: 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900',
      badgeBg: 'bg-slate-700/40 text-white dark:bg-slate-200/50 dark:text-slate-900',
    },
  ];

  // Total count for all tasks combined
  const totalTaskCount = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all space-y-4">
      {/* 1. Header Bar: Title, Counters, Shift Toggle, Reset */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="liquid-icon liquid-icon-cyan w-9 h-9 shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              ตัวกรองข้อมูล RP20 (Auto-Filtered Parameters)
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              เลือกหัวข้องานได้มากกว่า 1 หัวข้อ, เลือกสถานะงาน และสลับกะการทำงาน (กะเช้า 05-17 / กะดึก 18-04)
            </p>
          </div>
        </div>

        {/* Counter & Shift Toggle (กะเช้า 05:00-17:00 / กะดึก 18:00-04:00) */}
        <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
          {/* Shift toggle button */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              onClick={() => onSelectShift('ALL')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                shiftFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              24 ชม.
            </button>
            <button
              onClick={() => onSelectShift('MORNING')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                shiftFilter === 'MORNING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>กะเช้า (05:00-17:00)</span>
            </button>
            <button
              onClick={() => onSelectShift('NIGHT')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                shiftFilter === 'NIGHT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>กะดึก (18:00-04:00)</span>
            </button>
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
            แสดง <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{totalFilteredCount.toLocaleString()}</strong> / {totalRawCount.toLocaleString()} รายการ
          </div>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TASK DESCRIPTION SELECTION TABS */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center flex-wrap gap-2">
            <div className="liquid-icon liquid-icon-indigo w-7 h-7 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>แท็บเลือกหัวข้องาน / Item Description:</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>สถานะที่เลือก: {filters.taskStatus === 'ALL' ? 'ทุกสถานะ (All)' : filters.taskStatus} (Real-time)</span>
            </span>
            {selectedCount > 0 && filters.taskDescriptions[0] !== '__NONE__' && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                เลือก {selectedCount} จาก {availableTasks.length} หัวข้อ
              </span>
            )}
          </div>

          {/* Quick Action links */}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleSelectAllTasks}
              className={`hover:underline cursor-pointer transition-colors ${
                isAllTasksSelected
                  ? 'font-bold text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-indigo-500'
              }`}
            >
              ✓ เลือกทุกหัวข้องาน
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={handleClearAllTasks}
              className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
            >
              ล้างการเลือก
            </button>
          </div>
        </div>

        {/* Task Tabs Pill Strip */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-white/10">
          {/* All Tasks Tab */}
          <button
            type="button"
            onClick={handleSelectAllTasks}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
              isAllTasksSelected
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>ทุกหัวข้องาน (All Tasks)</span>
            <span
              className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                isAllTasksSelected
                  ? 'bg-indigo-700/50 text-white'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {totalTaskCount.toLocaleString()}
            </span>
          </button>

          {/* Individual Task Tabs */}
          {availableTasks.map((task) => {
            const isSelected = !isAllTasksSelected && filters.taskDescriptions.includes(task);
            const count = taskCounts[task] || 0;

            return (
              <button
                key={task}
                type="button"
                onClick={() => {
                  if (isAllTasksSelected) {
                    onFilterChange({ ...filters, taskDescriptions: [task] });
                  } else {
                    handleToggleTask(task);
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/25 font-semibold ring-1 ring-white/20'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200/80 dark:hover:border-white/10'
                }`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-white shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                )}
                <span>{task}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                    isSelected
                      ? 'bg-black/25 text-white font-bold'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STATUS SELECTION TABS BAR (แท็บเลือกสถานะงาน) */}
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
          <div className="liquid-icon liquid-icon-emerald w-7 h-7 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span>แท็บเลือกสถานะงาน (Status Tabs):</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-white/10 overflow-x-auto">
          {statusTabs.map((tab) => {
            const isActive =
              filters.taskStatus.toLowerCase() === tab.id.toLowerCase() ||
              (tab.id === 'ALL' && filters.taskStatus === 'ALL');
            const Icon = tab.icon;
            const count = statusCounts[tab.id] || (tab.id === 'ALL' ? statusCounts.ALL || 0 : 0);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange({ ...filters, taskStatus: tab.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActive
                    ? `${tab.activeColor} shadow-sm font-semibold`
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-current' : 'opacity-70'}`} />
                <span>{tab.label}</span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                    isActive ? tab.badgeBg : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Secondary Inputs Grid: Date, By User, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/70 dark:border-white/5">
        {/* Date Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>วันที่ปฏิบัติงาน (Date)</span>
          </label>
          <select
            value={filters.selectedDate}
            onChange={(e) => onFilterChange({ ...filters, selectedDate: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
          >
            <option value="ALL">ทุกวันที่ (All Dates)</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* By User Selector */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-violet-500" />
            <span>พนักงาน (By User)</span>
          </label>
          <select
            value={filters.byUser}
            onChange={(e) => onFilterChange({ ...filters, byUser: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer truncate"
          >
            <option value="ALL">ทุกคน (All Users)</option>
            {availableUsers.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Search Query */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>ค้นหาข้อความ / รหัสงาน</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="ค้นหา เช่น Picking, EMP-101..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
