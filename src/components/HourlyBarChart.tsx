import React, { useState } from 'react';
import { BarChart3, Clock, Sparkles, Layers, CheckCircle2, Split } from 'lucide-react';
import { HourlyStat } from '../types';

interface HourlyBarChartProps {
  hourlyStats: HourlyStat[];
  activeHours: number[];
  peakHour: number;
  onSelectHour?: (hour: number) => void;
  selectedHour?: number | null;
  selectedStatus?: string;
  selectedTasks?: string[];
}

// Distinct vibrant colors for tasks when multiple are selected
const TASK_PALETTE = [
  { name: 'cyan', fill: '#06b6d4', grad: 'from-cyan-500 to-blue-600', text: 'text-cyan-400' },
  { name: 'rose', fill: '#f43f5e', grad: 'from-rose-500 to-pink-600', text: 'text-rose-400' },
  { name: 'purple', fill: '#a855f7', grad: 'from-purple-500 to-indigo-600', text: 'text-purple-400' },
  { name: 'emerald', fill: '#10b981', grad: 'from-emerald-500 to-teal-600', text: 'text-emerald-400' },
  { name: 'amber', fill: '#f59e0b', grad: 'from-amber-500 to-orange-600', text: 'text-amber-400' },
  { name: 'indigo', fill: '#6366f1', grad: 'from-indigo-500 to-blue-700', text: 'text-indigo-400' },
  { name: 'sky', fill: '#38bdf8', grad: 'from-sky-400 to-cyan-600', text: 'text-sky-300' },
  { name: 'lime', fill: '#84cc16', grad: 'from-lime-500 to-emerald-600', text: 'text-lime-400' },
];

export const HourlyBarChart: React.FC<HourlyBarChartProps> = ({
  hourlyStats,
  activeHours,
  peakHour,
  onSelectHour,
  selectedHour,
  selectedStatus = 'Complete',
  selectedTasks = [],
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  // View mode: 'total' (รวมหัวข้อที่เลือก) | 'stacked' (จำแนกแต่ละหัวข้อที่เลือก)
  const [viewMode, setViewMode] = useState<'total' | 'stacked'>('total');

  const displayedStats = hourlyStats.filter((s) => activeHours.includes(s.hour));

  // Determine active task list for breakdown
  const activeTaskList = React.useMemo(() => {
    if (selectedTasks && selectedTasks.length > 0 && selectedTasks[0] !== '__NONE__') {
      return selectedTasks;
    }
    // If all tasks selected, extract all task keys present in the hourly breakdown
    const set = new Set<string>();
    displayedStats.forEach((s) => {
      Object.keys(s.taskBreakdown || {}).forEach((t) => set.add(t));
    });
    return Array.from(set).slice(0, 8);
  }, [selectedTasks, displayedStats]);

  const maxTotalCount = Math.max(1, ...displayedStats.map((s) => s.count));

  // Chart layout dimensions - Compact & refined ("ขนาดเล็กพอดี")
  const chartHeight = 205;
  const paddingBottom = 28;
  const paddingTop = 24;
  const availableHeight = chartHeight - paddingBottom - paddingTop;
  const stepX = 42;
  const totalWidth = displayedStats.length * stepX;
  const barWidth = 20;

  // Status Badge Color
  const getStatusBadge = (status: string) => {
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

  const hoveredStat = hoveredHour !== null ? displayedStats.find((s) => s.hour === hoveredHour) : null;

  return (
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>ยอดงานเสร็จรายชั่วโมง (Real-time)</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedStatus)}`}>
                สถานะ: {selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>ยึดเวลาตาม <strong>Latest Task Update Date</strong></span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {selectedTasks.length === 0 ? 'แสดงทุกหัวข้องาน' : `แสดง ${selectedTasks.length} หัวข้องานที่เลือก`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>ข้อมูลเปลี่ยนตามสถานะที่เลือกทันที</span>
          </p>
        </div>

        {/* View Mode Toggle & Peak Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTaskList.length > 1 && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
              <button
                onClick={() => setViewMode('total')}
                className={`px-2.5 py-1 font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'total'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ยอดรวม
              </button>
              <button
                onClick={() => setViewMode('stacked')}
                className={`px-2.5 py-1 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'stacked'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>จำแนกหัวข้อ ({activeTaskList.length})</span>
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-white/10 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>พีค: {String(peakHour).padStart(2, '0')}:00 น.</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-x-auto pb-1">
        <div className="min-w-[650px] sm:min-w-full">
          <svg
            className="w-full overflow-visible"
            height={chartHeight}
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="hourlyBarGradCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
              </linearGradient>

              <linearGradient id="hourlyPeakBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + availableHeight * (1 - pct);
              const val = Math.round(maxTotalCount * pct);
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
                    y={y - 3}
                    className="text-[8.5px] font-mono fill-slate-400 dark:fill-slate-500 tabular-nums"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Bars Rendering */}
            {displayedStats.map((stat, idx) => {
              const isPeak = stat.hour === peakHour;
              const isHovered = hoveredHour === stat.hour;
              const isSelected = selectedHour === stat.hour;
              const groupCenterX = idx * stepX + stepX / 2;
              const x = groupCenterX - barWidth / 2;
              const totalBarH = maxTotalCount > 0 ? (stat.count / maxTotalCount) * availableHeight : 0;
              const y = paddingTop + availableHeight - totalBarH;

              return (
                <g
                  key={stat.hour}
                  className="cursor-pointer transition-transform duration-200"
                  onMouseEnter={() => setHoveredHour(stat.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                  onClick={() => onSelectHour && onSelectHour(stat.hour)}
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
                  {(isHovered || isSelected) && (
                    <rect
                      x={idx * stepX + 2}
                      y={paddingTop}
                      width={stepX - 4}
                      height={availableHeight}
                      rx={5}
                      className="fill-cyan-500/10 dark:fill-cyan-400/10"
                    />
                  )}

                  {/* Single bar or Stacked Segments */}
                  {viewMode === 'total' || activeTaskList.length <= 1 ? (
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, totalBarH)}
                      rx={4}
                      fill={isPeak ? 'url(#hourlyPeakBarGrad)' : 'url(#hourlyBarGradCompact)'}
                      className={isSelected ? 'stroke-2 stroke-cyan-300' : ''}
                    />
                  ) : (
                    // Stacked segments for each selected task
                    (() => {
                      let currentY = paddingTop + availableHeight;
                      return activeTaskList.map((taskName, taskIdx) => {
                        const cnt = stat.taskBreakdown[taskName] || 0;
                        if (cnt === 0) return null;
                        const segH = (cnt / maxTotalCount) * availableHeight;
                        currentY -= segH;
                        const paletteItem = TASK_PALETTE[taskIdx % TASK_PALETTE.length];

                        return (
                          <rect
                            key={taskName}
                            x={x}
                            y={currentY}
                            width={barWidth}
                            height={Math.max(2, segH)}
                            rx={taskIdx === 0 ? 3 : 1}
                            fill={paletteItem.fill}
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                        );
                      });
                    })()
                  )}

                  {/* Compact Number Label directly on top of bar ("ขนาดเล็กพอดี") */}
                  {stat.count > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className={`text-[8.5px] font-mono tabular-nums font-bold ${
                        isPeak
                          ? 'fill-amber-500 font-extrabold'
                          : isHovered || isSelected
                          ? 'fill-cyan-400 font-extrabold'
                          : 'fill-slate-600 dark:fill-slate-300'
                      }`}
                    >
                      {stat.count}
                    </text>
                  )}

                  {/* X-axis Hour Label */}
                  <text
                    x={groupCenterX}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono tabular-nums ${
                      isPeak
                        ? 'fill-amber-500 font-bold'
                        : isSelected
                        ? 'fill-cyan-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {String(stat.hour).padStart(2, '0')}:00
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend & Real-time Task Breakdown Detail on Hover */}
      <div className="mt-2 pt-2 border-t border-white/10 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Selected Tasks Legend Pills (when in stacked mode or multi-select) */}
        {viewMode === 'stacked' && activeTaskList.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            {activeTaskList.map((t, idx) => {
              const pal = TASK_PALETTE[idx % TASK_PALETTE.length];
              return (
                <div key={t} className="flex items-center gap-1 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: pal.fill }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]">
                    {t}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>* ยึดเวลาปิดงานตาม Latest Task Update Date</span>
            <span>·</span>
            <span>สถานะปัจจุบัน: <strong className="text-emerald-500">{selectedStatus}</strong></span>
          </div>
        )}

        {/* Hover Breakdown Popover Info */}
        {hoveredStat && (
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            <span>เวลา {String(hoveredStat.hour).padStart(2, '0')}:00 น.</span>
            <span>=</span>
            <strong className="text-slate-900 dark:text-white font-bold">{hoveredStat.count} รายการ</strong>
            {activeTaskList.length > 1 && (
              <span className="text-[10px] text-slate-400 dark:text-slate-400 hidden lg:inline">
                ({activeTaskList
                  .filter((t) => (hoveredStat.taskBreakdown[t] || 0) > 0)
                  .map((t) => `${t.split(' ')[0]}: ${hoveredStat.taskBreakdown[t]}`)
                  .join(' · ') || 'ไม่มีงาน'})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
