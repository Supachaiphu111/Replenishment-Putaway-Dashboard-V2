import React, { useState, useMemo } from 'react';
import { CalendarDays, TrendingUp, Sparkles, Sun, Moon, CheckCircle2, Layers } from 'lucide-react';
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

  // Group records by Date (Daily)
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

    // Sort dates ascending for trend line progression
    const sortedDates = Object.keys(map).sort();

    // Linear regression for trendline
    const n = sortedDates.length;
    let trendValues: number[] = [];
    if (n > 1) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      sortedDates.forEach((d, i) => {
        const y = map[d].count;
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;
      trendValues = sortedDates.map((_, i) => Math.max(0, Math.round(intercept + slope * i)));
    } else {
      trendValues = sortedDates.map((d) => map[d].count);
    }

    return sortedDates.map((date, idx) => {
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
        trend: trendValues[idx],
      };
    });
  }, [filteredDataset]);

  // Group records by Month (Monthly)
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

    // Linear regression for trendline
    const n = sortedMonths.length;
    let trendValues: number[] = [];
    if (n > 1) {
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      sortedMonths.forEach((m, i) => {
        const y = map[m].count;
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;
      trendValues = sortedMonths.map((_, i) => Math.max(0, Math.round(intercept + slope * i)));
    } else {
      trendValues = sortedMonths.map((m) => map[m].count);
    }

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

    return sortedMonths.map((monthStr, idx) => {
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
        trend: trendValues[idx],
      };
    });
  }, [filteredDataset]);

  const activeDataset = viewMode === 'daily' ? dailyData : monthlyData;

  // Max value for y-axis
  const maxVal = Math.max(
    1,
    ...activeDataset.flatMap((d) => [d.count, d.trend])
  );

  // SVG Chart Layout - Compact & responsive ("ขนาดเล็กพอดี")
  const chartHeight = 210;
  const paddingBottom = 30;
  const paddingTop = 26;
  const availableHeight = chartHeight - paddingBottom - paddingTop;
  const stepX = Math.max(48, Math.floor(700 / (activeDataset.length || 1)));
  const totalWidth = Math.max(680, activeDataset.length * stepX);
  const barWidth = Math.min(26, stepX - 14);

  // Trendline SVG path
  const trendLinePoints = activeDataset.map((item, idx) => {
    const x = idx * stepX + stepX / 2;
    const y = paddingTop + availableHeight - (item.trend / maxVal) * availableHeight;
    return `${x},${y}`;
  });
  const trendPathD = trendLinePoints.length > 1 ? `M ${trendLinePoints.join(' L ')}` : '';

  // Summary Metrics
  const totalCompleted = activeDataset.reduce((sum, d) => sum + d.count, 0);
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
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>กราฟแท่งสรุปภาพรวม {viewMode === 'daily' ? 'รายวัน (Daily)' : 'รายเดือน (Monthly)'}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selectedStatus)}`}>
                สถานะ: {selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>แสดงข้อมูลทุกหัวข้องานที่เลือกแบบ Real-time</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {selectedTasks.length === 0 ? 'ทุกหัวข้องาน' : `${selectedTasks.length} หัวข้องานที่เลือก`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>พร้อมเส้นแนวโน้ม (Linear Trendline)</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายวัน (Daily)
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              รายเดือน (Monthly)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Pill Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <div className="text-[10px] text-slate-400">ยอดรวมตามตัวกรอง</div>
          <div className="text-base font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
            {totalCompleted.toLocaleString()} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <div className="text-[10px] text-slate-400">ค่าเฉลี่ยต่อ{viewMode === 'daily' ? 'วัน' : 'เดือน'}</div>
          <div className="text-base font-extrabold font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
            {avgPeriod.toLocaleString()} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
          <div className="text-[10px] text-slate-400">สูงสุด ({peakItem?.label || '-'})</div>
          <div className="text-base font-extrabold font-mono tabular-nums text-amber-500">
            {peakItem?.count.toLocaleString() || 0} <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>เส้นแนวโน้ม</span>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Linear Trendline
            </div>
          </div>
          <div className="w-8 h-1 bg-emerald-500 rounded-full" />
        </div>
      </div>

      {/* SVG Bar Chart with Trendline */}
      <div className="relative w-full overflow-x-auto pb-1">
        <div className="min-w-[650px] sm:min-w-full">
          <svg
            className="w-full overflow-visible"
            height={chartHeight}
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="periodBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
              </linearGradient>

              <linearGradient id="periodSelectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
              </linearGradient>

              <linearGradient id="trendGlowGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
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

            {/* Main Bars */}
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

                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(2, barHeight)}
                    rx={4}
                    fill={isSelected ? 'url(#periodSelectedGradient)' : 'url(#periodBarGradient)'}
                    className={`transition-all duration-300 ${
                      isSelected
                        ? 'stroke-2 stroke-cyan-300'
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

            {/* Linear Trendline Overlay */}
            {trendPathD && (
              <g>
                <path
                  d={trendPathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)] pointer-events-none"
                />

                {/* Trend dots */}
                {activeDataset.map((item, idx) => {
                  const cx = idx * stepX + stepX / 2;
                  const cy = paddingTop + availableHeight - (item.trend / maxVal) * availableHeight;
                  return (
                    <circle
                      key={`dot-${item.key}`}
                      cx={cx}
                      cy={cy}
                      r="2.5"
                      className="fill-emerald-400 stroke-white dark:stroke-slate-900 pointer-events-none"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-white/10 dark:border-white/5 gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              ยอดงานเสร็จสิ้น ({selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 bg-emerald-500 stroke-dasharray-4 rounded shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              เส้นแนวโน้ม (Linear Trendline)
            </span>
          </div>
        </div>

        {hoveredIndex !== null && activeDataset[hoveredIndex] && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
            <span>
              <strong>{activeDataset[hoveredIndex].label}</strong>: {activeDataset[hoveredIndex].count.toLocaleString()} งาน
            </span>
            <span className="text-amber-500 flex items-center gap-1">
              <Sun className="w-3 h-3" /> เช้า: {activeDataset[hoveredIndex].morning}
            </span>
            <span className="text-indigo-400 flex items-center gap-1">
              <Moon className="w-3 h-3" /> ดึก: {activeDataset[hoveredIndex].night}
            </span>
            <span className="text-emerald-500 font-bold">
              แนวโน้ม: {activeDataset[hoveredIndex].trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
