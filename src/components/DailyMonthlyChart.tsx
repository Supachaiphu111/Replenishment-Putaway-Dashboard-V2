import React, { useState, useMemo } from 'react';
import { CalendarDays, Sun, Moon, CheckCircle2, Sparkles, Layers } from 'lucide-react';
import { RP20Record, ShiftFilter } from '../types';
import { isMorningShift, isNightShift } from '../utils/sampleData';

interface DailyMonthlyChartProps {
  records: RP20Record[];
  onSelectDate?: (date: string) => void;
  selectedDate?: string;
  selectedStatus?: string;
  selectedTasks?: string[];
  shiftFilter?: ShiftFilter;
}

export const DailyMonthlyChart: React.FC<DailyMonthlyChartProps> = ({
  records,
  onSelectDate,
  selectedDate,
  selectedStatus = 'Complete',
  selectedTasks = [],
  shiftFilter = 'ALL',
}) => {
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter records based on selected tasks, status, and shift in real-time
  const filteredDataset = useMemo(() => {
    return records.filter((r) => {
      // 1. Task Description filter (multi-select)
      if (selectedTasks && selectedTasks.length > 0) {
        if (selectedTasks[0] === '__NONE__') return false;
        if (!selectedTasks.includes(r.taskDescription)) return false;
      }

      // 2. Task Status filter (Real-time sync based on user chosen status)
      if (selectedStatus && selectedStatus !== 'ALL') {
        if (r.taskStatus.toLowerCase() !== selectedStatus.toLowerCase()) return false;
      }

      // 3. Shift filter
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) return false;
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) return false;

      return true;
    });
  }, [records, selectedTasks, selectedStatus, shiftFilter]);

  // Group records by Date (Daily) - Pure bar aggregation (No trendline)
  const dailyData = useMemo(() => {
    const map: Record<string, { count: number; morning: number; night: number }> = {};

    filteredDataset.forEach((r) => {
      if (!map[r.date]) {
        map[r.date] = { count: 0, morning: 0, night: 0 };
      }
      map[r.date].count += 1;
      if (isMorningShift(r.completionHour)) {
        map[r.date].morning += 1;
      } else if (isNightShift(r.completionHour)) {
        map[r.date].night += 1;
      }
    });

    const sortedDates = Object.keys(map).sort();

    return sortedDates.map((date) => {
      const parts = date.split('-');
      const day = parts[2] || date;
      const month = parts[1] || '';
      const display = `${day}/${month}`;

      return {
        key: date,
        label: display,
        fullDate: date,
        count: map[date].count,
        morning: map[date].morning,
        night: map[date].night,
      };
    });
  }, [filteredDataset]);

  // Group records by Month (Monthly) - Pure bar aggregation (No trendline)
  const monthlyData = useMemo(() => {
    const map: Record<string, { count: number; morning: number; night: number }> = {};

    filteredDataset.forEach((r) => {
      const m = r.date.slice(0, 7); // "YYYY-MM"
      if (!map[m]) {
        map[m] = { count: 0, morning: 0, night: 0 };
      }
      map[m].count += 1;
      if (isMorningShift(r.completionHour)) {
        map[m].morning += 1;
      } else if (isNightShift(r.completionHour)) {
        map[m].night += 1;
      }
    });

    const sortedMonths = Object.keys(map).sort();

    const monthNamesThai = [
      '',
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];

    return sortedMonths.map((monthStr) => {
      const parts = monthStr.split('-');
      const monthNum = parseInt(parts[1], 10);
      const year = parts[0];
      const display = `${monthNamesThai[monthNum] || parts[1]} ${year.slice(2)}`;

      return {
        key: monthStr,
        label: display,
        fullDate: monthStr,
        count: map[monthStr].count,
        morning: map[monthStr].morning,
        night: map[monthStr].night,
      };
    });
  }, [filteredDataset]);

  const activeDataset = viewMode === 'daily' ? dailyData : monthlyData;

  // Max value for y-axis (pure bar count)
  const maxVal = Math.max(1, ...activeDataset.map((d) => d.count));

  // SVG Chart Layout - Compact & responsive ("ขนาดเล็กพอดี")
  const chartHeight = 210;
  const paddingBottom = 30;
  const paddingTop = 26;
  const availableHeight = chartHeight - paddingBottom - paddingTop;
  const stepX = Math.max(48, Math.floor(700 / (activeDataset.length || 1)));
  const totalWidth = Math.max(680, activeDataset.length * stepX);
  const barWidth = Math.min(26, stepX - 14);

  // Summary Metrics
  const totalCompleted = activeDataset.reduce((sum, d) => sum + d.count, 0);
  const totalMorning = activeDataset.reduce((sum, d) => sum + d.morning, 0);
  const totalNight = activeDataset.reduce((sum, d) => sum + d.night, 0);
  const avgPeriod = activeDataset.length > 0 ? Math.round(totalCompleted / activeDataset.length) : 0;
  const peakItem = [...activeDataset].sort((a, b) => b.count - a.count)[0];

  // Status Badge Color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'in progress':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'pending':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25';
    }
  };

  return (
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all space-y-4">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="liquid-icon liquid-icon-blue w-9 h-9">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>กราฟแท่งสรุปภาพรวม {viewMode === 'daily' ? 'รายวัน (Daily)' : 'รายเดือน (Monthly)'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selectedStatus)}`}>
                สถานะ: {selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>แสดงข้อมูลตามหัวข้องานและสถานะที่เลือกแบบ Real-time</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {selectedTasks.length === 0 ? 'ทุกหัวข้องาน' : `${selectedTasks.length} หัวข้องานที่เลือก`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>คลิกแท่งเพื่อเจาะลึกเฉพาะวัน</span>
          </p>
        </div>

        {/* View Mode Toggle with Liquid Glass Aesthetics */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs shadow-inner">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายวัน (Daily)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm shadow-cyan-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายเดือน (Monthly)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Strip (Crystalline Liquid Pods) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="text-[10px] text-slate-400 font-medium">ยอดรวมตามตัวกรอง</div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
            {totalCompleted.toLocaleString()} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-xs">
          <div className="text-[10px] text-cyan-700 dark:text-cyan-300 font-medium">
            ค่าเฉลี่ยต่อ{viewMode === 'daily' ? 'วัน' : 'เดือน'}
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-cyan-600 dark:text-cyan-400 mt-0.5">
            {avgPeriod.toLocaleString()} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-xs">
          <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
            ยอดสูงสุด ({peakItem?.label || '-'})
          </div>
          <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
            {peakItem?.count.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-xs">
          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium flex items-center justify-between">
            <span>สัดส่วนกะ (เช้า / ดึก)</span>
            <span className="text-[9px] font-mono">05-17 | 18-04</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-1 flex items-center justify-between">
            <span className="text-amber-500 flex items-center gap-1">
              <Sun className="w-3 h-3" /> {totalMorning.toLocaleString()}
            </span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Moon className="w-3 h-3" /> {totalNight.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart without Trendline ("เอาเส้นแนวโน้มออก") */}
      <div className="relative w-full overflow-x-auto pb-1">
        <div className="min-w-[650px] sm:min-w-full">
          <svg
            className="w-full overflow-visible"
            height={chartHeight}
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Normal Bar Gradient */}
              <linearGradient id="periodBarGradientClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.45" />
              </linearGradient>

              {/* Selected Bar Gradient */}
              <linearGradient id="periodSelectedGradientClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.65" />
              </linearGradient>
            </defs>

            {/* Guide Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + availableHeight * (1 - pct);
              const val = Math.round(maxVal * pct);
              return (
                <g key={i}>
                  <line
                    x1="0"
                    y1={y}
                    x2={totalWidth}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-200/60 dark:text-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x="2"
                    y={y - 4}
                    className="text-[8.5px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Main Pure Bars */}
            {activeDataset.map((item, idx) => {
              const x = idx * stepX + (stepX - barWidth) / 2;
              const barHeight = maxVal > 0 ? (item.count / maxVal) * availableHeight : 0;
              const y = paddingTop + availableHeight - barHeight;
              const isHovered = hoveredIndex === idx;
              const isSelected = viewMode === 'daily' && selectedDate === item.fullDate;

              return (
                <g
                  key={item.key}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => {
                    if (viewMode === 'daily' && onSelectDate) {
                      onSelectDate(item.fullDate);
                    }
                  }}
                >
                  {/* Backdrop touch target */}
                  <rect
                    x={idx * stepX}
                    y={0}
                    width={stepX}
                    height={chartHeight - paddingBottom}
                    fill="transparent"
                  />

                  {/* Hover highlight column */}
                  {isHovered && (
                    <rect
                      x={idx * stepX + 2}
                      y={paddingTop}
                      width={stepX - 4}
                      height={availableHeight}
                      rx={6}
                      className="fill-cyan-500/10 dark:fill-cyan-400/10"
                    />
                  )}

                  {/* Liquid Glass Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx={4}
                    fill={isSelected ? 'url(#periodSelectedGradientClean)' : 'url(#periodBarGradientClean)'}
                    className={`transition-all duration-300 ${
                      isSelected
                        ? 'stroke-2 stroke-cyan-300 shadow-lg'
                        : isHovered
                        ? 'stroke-1 stroke-cyan-300'
                        : ''
                    }`}
                  />

                  {/* Number count label directly on top of bar ("ขนาดเล็กพอดี") */}
                  {item.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className={`text-[8.5px] font-mono tabular-nums font-bold ${
                        isSelected
                          ? 'fill-cyan-400 font-extrabold'
                          : isHovered
                          ? 'fill-cyan-500 dark:fill-cyan-300'
                          : 'fill-slate-700 dark:fill-slate-200'
                      }`}
                    >
                      {item.count.toLocaleString()}
                    </text>
                  )}

                  {/* X-axis label */}
                  <text
                    x={idx * stepX + stepX / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono tabular-nums ${
                      isSelected
                        ? 'fill-cyan-400 font-bold'
                        : isHovered
                        ? 'fill-slate-800 dark:fill-slate-200 font-semibold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend & Hover Info (Clean without Trendline) */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-white/10 dark:border-white/5 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            ยอดงานเสร็จสิ้น ({selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus})
          </span>
        </div>

        {hoveredIndex !== null && activeDataset[hoveredIndex] && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <span>
              <strong>{activeDataset[hoveredIndex].label}</strong>: {activeDataset[hoveredIndex].count.toLocaleString()} งาน
            </span>
            <span className="text-amber-500 flex items-center gap-1">
              <Sun className="w-3 h-3" /> เช้า: {activeDataset[hoveredIndex].morning}
            </span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Moon className="w-3 h-3" /> ดึก: {activeDataset[hoveredIndex].night}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
