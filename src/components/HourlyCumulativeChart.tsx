import React, { useState } from 'react';
import { TrendingUp, Layers, Split } from 'lucide-react';
import { HourlyStat } from '../types';

interface HourlyCumulativeChartProps {
  hourlyStats: HourlyStat[];
  activeHours: number[];
  selectedStatus?: string;
  selectedTasks?: string[];
}

export const HourlyCumulativeChart: React.FC<HourlyCumulativeChartProps> = ({
  hourlyStats,
  activeHours,
  selectedStatus = 'Complete',
  selectedTasks = [],
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  // View mode: 'total' | 'cherry-combined' (รวม Prty 40 + 50) | 'split-cherry'
  const [viewMode, setViewMode] = useState<'total' | 'cherry-combined' | 'split-cherry'>('total');

  const displayedStats = hourlyStats.filter((s) => activeHours.includes(s.hour));

  // Extract Prty 40 and Prty 50 counts
  const getTaskCount = (stat: HourlyStat, keyword: string) => {
    let count = 0;
    Object.entries(stat.taskBreakdown || {}).forEach(([task, cnt]) => {
      if (task.toLowerCase().includes(keyword.toLowerCase())) {
        count += cnt;
      }
    });
    return count;
  };

  // Compute cumulative series
  let run40 = 0;
  let run50 = 0;
  let runCombinedCherry = 0;
  const cumulativePrty40: number[] = [];
  const cumulativePrty50: number[] = [];
  const cumulativeCherryCombined: number[] = [];

  displayedStats.forEach((s) => {
    const c40 = getTaskCount(s, '40');
    const c50 = getTaskCount(s, '50');
    run40 += c40;
    run50 += c50;
    runCombinedCherry += (c40 + c50);

    cumulativePrty40.push(run40);
    cumulativePrty50.push(run50);
    cumulativeCherryCombined.push(runCombinedCherry);
  });

  const maxTotalCumulative = Math.max(1, ...displayedStats.map((s) => s.cumulativeCount));
  const maxCherryCombinedCumulative = Math.max(1, runCombinedCherry);
  const maxCherrySplitCumulative = Math.max(1, run40, run50);

  const maxCumulative =
    viewMode === 'total'
      ? maxTotalCumulative
      : viewMode === 'cherry-combined'
      ? maxCherryCombinedCumulative
      : maxCherrySplitCumulative;

  // Compact layout dimensions ("ขนาดเล็กพอดี")
  const chartHeight = 210;
  const paddingBottom = 28;
  const paddingTop = 24;
  const availableHeight = chartHeight - paddingBottom - paddingTop;
  const stepX = 42;
  const totalWidth = displayedStats.length * stepX;

  // Total / Combined Line Points
  const activeCumulativeSeries =
    viewMode === 'total'
      ? displayedStats.map((s) => s.cumulativeCount)
      : cumulativeCherryCombined;

  const linePoints = activeCumulativeSeries.map((cumulVal, idx) => {
    const x = idx * stepX + stepX / 2;
    const y = paddingTop + availableHeight - (cumulVal / maxCumulative) * availableHeight;
    return `${x},${y}`;
  });
  const pathD = linePoints.length > 0 ? `M ${linePoints.join(' L ')}` : '';

  return (
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>กราฟแท่งแสดงยอดสะสมรายชั่วโมง (Real-time)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                สถานะ: {selectedStatus === 'ALL' ? 'ทุกสถานะ' : selectedStatus}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>ยอดสะสมต่อเนื่องตลอดวัน (Cumulative)</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {selectedTasks.length === 0 ? 'ทุกหัวข้องาน' : `${selectedTasks.length} หัวข้องานที่เลือก`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>สะสมตามสถานะที่เลือกแบบ Real-time</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'total'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              สะสมรวมทุกงาน
            </button>
            <button
              onClick={() => setViewMode('cherry-combined')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'cherry-combined'
                  ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>สะสม Cherry Pick รวม (40+50)</span>
            </button>
            <button
              onClick={() => setViewMode('split-cherry')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'split-cherry'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Split className="w-3 h-3" />
              <span>แยกสะสม 40 vs 50</span>
            </button>
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
              <linearGradient id="cumulBarCompact" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="cumulCherryCombinedBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.35" />
              </linearGradient>

              <linearGradient id="cumulAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="cumulCherryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + availableHeight * (1 - pct);
              const val = Math.round(maxCumulative * pct);
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

            {/* Background Cumulative Progression Trend Line (for single mode) */}
            {viewMode !== 'split-cherry' && pathD && (
              <>
                <path
                  d={`${pathD} L ${(displayedStats.length - 1) * stepX + stepX / 2},${
                    paddingTop + availableHeight
                  } L ${stepX / 2},${paddingTop + availableHeight} Z`}
                  fill={viewMode === 'cherry-combined' ? 'url(#cumulCherryAreaGrad)' : 'url(#cumulAreaGrad)'}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={viewMode === 'cherry-combined' ? '#a855f7' : '#10b981'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Bars Rendering */}
            {displayedStats.map((stat, idx) => {
              const isHovered = hoveredHour === stat.hour;
              const groupCenterX = idx * stepX + stepX / 2;

              if (viewMode === 'total' || viewMode === 'cherry-combined') {
                const cumulVal =
                  viewMode === 'total'
                    ? stat.cumulativeCount
                    : cumulativeCherryCombined[idx] || 0;

                const barWidth = 18;
                const x = groupCenterX - barWidth / 2;
                const barHeight = maxCumulative > 0 ? (cumulVal / maxCumulative) * availableHeight : 0;
                const y = paddingTop + availableHeight - barHeight;

                const barFill =
                  viewMode === 'cherry-combined'
                    ? 'url(#cumulCherryCombinedBar)'
                    : 'url(#cumulBarCompact)';

                return (
                  <g
                    key={stat.hour}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredHour(stat.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    <rect
                      x={idx * stepX}
                      y={0}
                      width={stepX}
                      height={chartHeight - paddingBottom}
                      fill="transparent"
                    />

                    {isHovered && (
                      <rect
                        x={idx * stepX + 2}
                        y={paddingTop}
                        width={stepX - 4}
                        height={availableHeight}
                        rx={5}
                        className={
                          viewMode === 'cherry-combined'
                            ? 'fill-purple-500/10'
                            : 'fill-emerald-500/10'
                        }
                      />
                    )}

                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx={4}
                      fill={barFill}
                      className={isHovered ? 'stroke-1 stroke-emerald-300' : ''}
                    />

                    {/* Compact Cumulative Number on top */}
                    {cumulVal > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        className={`text-[8.5px] font-mono tabular-nums font-bold ${
                          isHovered
                            ? 'fill-emerald-400 font-extrabold text-[9px]'
                            : viewMode === 'cherry-combined'
                            ? 'fill-purple-500 dark:fill-purple-300 font-bold'
                            : 'fill-slate-700 dark:fill-slate-200'
                        }`}
                      >
                        {cumulVal}
                      </text>
                    )}

                    {/* Hour on X-axis */}
                    <text
                      x={groupCenterX}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
                    >
                      {String(stat.hour).padStart(2, '0')}:00
                    </text>
                  </g>
                );
              } else {
                // Split Cumulative: Prty 40 vs Prty 50 side-by-side
                const val40 = cumulativePrty40[idx] || 0;
                const val50 = cumulativePrty50[idx] || 0;

                const subBarWidth = 14;
                const x40 = groupCenterX - subBarWidth - 1.5;
                const x50 = groupCenterX + 1.5;

                const h40 = maxCumulative > 0 ? (val40 / maxCumulative) * availableHeight : 0;
                const h50 = maxCumulative > 0 ? (val50 / maxCumulative) * availableHeight : 0;

                const y40 = paddingTop + availableHeight - h40;
                const y50 = paddingTop + availableHeight - h50;

                return (
                  <g
                    key={stat.hour}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredHour(stat.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    <rect
                      x={idx * stepX}
                      y={0}
                      width={stepX}
                      height={chartHeight - paddingBottom}
                      fill="transparent"
                    />

                    {/* Bar 1: Prty 40 Cumulative */}
                    <rect
                      x={x40}
                      y={y40}
                      width={subBarWidth}
                      height={Math.max(2, h40)}
                      rx={3}
                      fill="#f43f5e"
                    />
                    {val40 > 0 && (
                      <text
                        x={x40 + subBarWidth / 2}
                        y={y40 - 4}
                        textAnchor="middle"
                        className="text-[8px] font-mono tabular-nums font-bold fill-rose-500"
                      >
                        {val40}
                      </text>
                    )}

                    {/* Bar 2: Prty 50 Cumulative */}
                    <rect
                      x={x50}
                      y={y50}
                      width={subBarWidth}
                      height={Math.max(2, h50)}
                      rx={3}
                      fill="#6366f1"
                    />
                    {val50 > 0 && (
                      <text
                        x={x50 + subBarWidth / 2}
                        y={y50 - 4}
                        textAnchor="middle"
                        className="text-[8px] font-mono tabular-nums font-bold fill-indigo-400"
                      >
                        {val50}
                      </text>
                    )}

                    {/* Hour on X-axis */}
                    <text
                      x={groupCenterX}
                      y={chartHeight - 8}
                      textAnchor="middle"
                      className="text-[9.5px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
                    >
                      {String(stat.hour).padStart(2, '0')}:00
                    </text>
                  </g>
                );
              }
            })}
          </svg>
        </div>
      </div>

      {/* Legend & Hover Details */}
      <div className="mt-2 pt-2 border-t border-white/10 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {viewMode === 'split-cherry' ? (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                สะสม Cherry Pick Prty 40
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                สะสม Cherry Pick Prty 50
              </span>
            </div>
          </div>
        ) : viewMode === 'cherry-combined' ? (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded bg-gradient-to-r from-purple-500 to-emerald-500 shrink-0" />
            <span className="font-semibold text-purple-600 dark:text-purple-300">
              ยอดสะสม Cherry Pick รวม (Prty 40 + Prty 50 นับรวมกัน)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              ยอดสะสมรวมทุกงาน (Cumulative Total)
            </span>
          </div>
        )}

        {hoveredHour !== null && (
          <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
            ยอดสะสมถึงเวลา {String(hoveredHour).padStart(2, '0')}:00 น. ={' '}
            {viewMode === 'total'
              ? displayedStats.find((s) => s.hour === hoveredHour)?.cumulativeCount || 0
              : viewMode === 'cherry-combined'
              ? cumulativeCherryCombined[displayedStats.findIndex((s) => s.hour === hoveredHour)] || 0
              : `P40: ${cumulativePrty40[displayedStats.findIndex((s) => s.hour === hoveredHour)] || 0} | P50: ${cumulativePrty50[displayedStats.findIndex((s) => s.hour === hoveredHour)] || 0}`}{' '}
            รายการ
          </div>
        )}
      </div>
    </div>
  );
};
