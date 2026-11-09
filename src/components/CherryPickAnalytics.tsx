import React, { useState, useMemo } from 'react';
import { Tag, Layers, ArrowUpDown, Sun, Moon, BarChart2, Clock, Search, CheckCircle2 } from 'lucide-react';
import { RP20Record, ShiftFilter } from '../types';
import { isCherryPickTask, isMorningShift, isNightShift } from '../utils/sampleData';

interface CherryPickAnalyticsProps {
  records: RP20Record[];
  activeHours?: number[];
  selectedDate?: string;
  selectedStatus?: string;
  selectedUser?: string;
  shiftFilter?: ShiftFilter;
}

export type CherryViewMode = 'overview' | 'hourly';

export const CherryPickAnalytics: React.FC<CherryPickAnalyticsProps> = ({
  records,
  activeHours = Array.from({ length: 24 }, (_, i) => i),
  selectedDate,
  selectedStatus = 'Complete',
  selectedUser = 'ALL',
  shiftFilter = 'ALL',
}) => {
  // Original clean UX: simple view switch between Overview (Replenish Active Cherry Pick) and Hourly
  const [viewMode, setViewMode] = useState<CherryViewMode>('overview');
  const [searchTable, setSearchTable] = useState('');

  // 1. Filter Cherry Pick records matching the active filters
  const cherryRecords = useMemo(() => {
    return records.filter((r) => {
      // Must be Cherry Pick task
      if (!isCherryPickTask(r.taskDescription)) return false;

      // Date filter
      if (selectedDate && selectedDate !== 'ALL' && r.date !== selectedDate) return false;

      // Status filter (real-time sync)
      if (selectedStatus && selectedStatus !== 'ALL' && r.taskStatus.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }

      // User filter
      if (selectedUser && selectedUser !== 'ALL' && r.byUser !== selectedUser) return false;

      // Shift filter
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) return false;
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) return false;

      return true;
    });
  }, [records, selectedDate, selectedStatus, selectedUser, shiftFilter]);

  // 2. Combined calculations: Prty 40 and Prty 50 counted together as unified "Replenish Active Cherry  Pick"
  const combinedStats = useMemo(() => {
    const parentTaskNos = new Set<string>();
    const morningParents = new Set<string>();
    const nightParents = new Set<string>();

    let totalChild2115 = 0;
    let morningChild2115 = 0;
    let nightChild2115 = 0;

    let morningCount = 0;
    let nightCount = 0;

    cherryRecords.forEach((r) => {
      const taskNo = r.taskNo || r.id;
      parentTaskNos.add(taskNo);

      const ilpnStr = String(r.ilpn || '').trim();
      const is2115 = ilpnStr.startsWith('2115');
      if (is2115) {
        totalChild2115 += 1;
      }

      if (isMorningShift(r.completionHour)) {
        morningCount += 1;
        morningParents.add(taskNo);
        if (is2115) morningChild2115 += 1;
      } else if (isNightShift(r.completionHour)) {
        nightCount += 1;
        nightParents.add(taskNo);
        if (is2115) nightChild2115 += 1;
      }
    });

    const uniqueParents = parentTaskNos.size;
    const ratio = uniqueParents > 0 ? totalChild2115 / uniqueParents : 0;

    return {
      totalRecords: cherryRecords.length,
      uniqueParents,
      totalChild2115,
      ratio,
      morningCount,
      nightCount,
      morningParents: morningParents.size,
      morningChild2115,
      nightParents: nightParents.size,
      nightChild2115,
    };
  }, [cherryRecords]);

  // 3. Bar chart data:
  // "ให้แก้แท่งกราฟร่วมกันไม่ต้องแยก 40 กับ 50 เปลี่ยนเป็น Replenish Active Cherry  Pick ในแท่งกราฟ"
  // Combined together without separating 40 vs 50
  const chartData = useMemo(() => {
    if (viewMode === 'overview') {
      // Unified Bar Chart items:
      // 1) Main bar: Replenish Active Cherry  Pick (Combined total)
      // 2) Morning shift (05:00 - 17:00)
      // 3) Night shift (18:00 - 04:00)
      return [
        {
          key: 'cherry-total',
          label: 'Replenish Active Cherry  Pick',
          sublabel: 'ยอดรวมทั้งหมด (Prty 40 + 50)',
          parentCount: combinedStats.uniqueParents,
          childCount: combinedStats.totalChild2115,
          isHighlight: true,
        },
        {
          key: 'shift-morning',
          label: 'กะเช้า (05:00 - 17:00)',
          sublabel: 'Morning Shift',
          parentCount: combinedStats.morningParents,
          childCount: combinedStats.morningChild2115,
          isHighlight: false,
        },
        {
          key: 'shift-night',
          label: 'กะดึก (18:00 - 04:00)',
          sublabel: 'Night Shift',
          parentCount: combinedStats.nightParents,
          childCount: combinedStats.nightChild2115,
          isHighlight: false,
        },
      ];
    } else {
      // Hourly view: Combined Prty 40 + 50 for each active hour
      return activeHours.map((h) => {
        const hourRecs = cherryRecords.filter((r) => r.completionHour === h);
        const parents = new Set(hourRecs.map((r) => r.taskNo || r.id)).size;
        const children = hourRecs.filter((r) => String(r.ilpn || '').trim().startsWith('2115')).length;

        return {
          key: `h-${h}`,
          label: `${String(h).padStart(2, '0')}:00`,
          sublabel: `${hourRecs.length} รายการ`,
          parentCount: parents,
          childCount: children,
          isHighlight: false,
        };
      });
    }
  }, [viewMode, combinedStats, cherryRecords, activeHours]);

  const maxChartVal = useMemo(() => {
    let max = 1;
    chartData.forEach((d) => {
      max = Math.max(max, d.parentCount, d.childCount);
    });
    return max;
  }, [chartData]);

  // Inspection table data
  const tableRows = useMemo(() => {
    if (!searchTable) return cherryRecords;
    const q = searchTable.toLowerCase();
    return cherryRecords.filter((r) => {
      return (
        (r.taskNo && r.taskNo.toLowerCase().includes(q)) ||
        (r.ilpn && r.ilpn.toLowerCase().includes(q)) ||
        r.byUser.toLowerCase().includes(q) ||
        r.taskDescription.toLowerCase().includes(q) ||
        r.completionTime.includes(q)
      );
    });
  }, [cherryRecords, searchTable]);

  // Chart layout dimensions - Compact & refined ("ขนาดเล็กพอดี")
  const chartHeight = 200;
  const paddingBottom = 26;
  const paddingTop = 22;
  const availableHeight = chartHeight - paddingBottom - paddingTop;
  const stepX = viewMode === 'overview' ? Math.max(160, Math.floor(740 / 3)) : Math.max(48, Math.floor(740 / (chartData.length || 1)));
  const totalWidth = Math.max(680, chartData.length * stepX);
  const singleBarWidth = viewMode === 'overview' ? 32 : Math.min(18, Math.floor((stepX - 12) / 2));

  return (
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all space-y-4">
      {/* 1. Header with Title & UX Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="liquid-icon liquid-icon-rose w-9 h-9 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>วิเคราะห์จำนวนนับ Cherry Pick (Replenish Active Cherry  Pick)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25">
                รวมยอด 40 + 50
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            นับรวม Prty 40 และ Prty 50 เข้าด้วยกัน · ลาเบลแม่นับจาก <strong>Task No.</strong> · ลาเบลลูกนับจาก <strong>iLPN (ขึ้นต้นด้วย 2115*)</strong>
          </p>
        </div>

        {/* Original Clean View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'overview'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>ยอดรวม (Replenish Active Cherry  Pick)</span>
          </button>
          <button
            onClick={() => setViewMode('hourly')}
            className={`px-3 py-1 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'hourly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>รายชั่วโมง (Hourly)</span>
          </button>
        </div>
      </div>

      {/* 2. KPI CARDS - Clean & Focused (Prty 40 and 50 unified as requested) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Combined Parent Task No. */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent border border-purple-500/30 dark:border-purple-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
            <span>ลาเบลแม่รวม (Task No.)</span>
            <div className="liquid-icon liquid-icon-purple w-7 h-7 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-purple-600 dark:text-purple-300 mt-1">
            {combinedStats.uniqueParents.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">งาน</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            รหัสงานแม่ Task No. ไม่ซ้ำ (รวม 40+50)
          </div>
        </div>

        {/* Card 2: Combined Child iLPN 2115* */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-transparent border border-cyan-500/30 dark:border-cyan-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-700 dark:text-cyan-300">
            <span>ลาเบลลูกรวม (iLPN 2115*)</span>
            <div className="liquid-icon liquid-icon-cyan w-7 h-7 shrink-0">
              <Tag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-cyan-600 dark:text-cyan-300 mt-1">
            {combinedStats.totalChild2115.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">ชิ้น</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            iLPN ที่ขึ้นต้นด้วย 2115* ทั้งหมด
          </div>
        </div>

        {/* Card 3: Combined Ratio (Child per Parent) */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <span>อัตราส่วนรวม (ลูก/แม่)</span>
            <div className="liquid-icon liquid-icon-emerald w-7 h-7 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-300 mt-1">
            {combinedStats.ratio.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">iLPN/งาน</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            เฉลี่ยจำนวนลูกต่อ 1 รหัสงานแม่
          </div>
        </div>

        {/* Card 4: Shift Summary (Clean & Dignified) */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>ยอดรวมแยกตามกะ</span>
            <div className="liquid-icon liquid-icon-amber w-7 h-7 shrink-0">
              <Sun className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1.5">
            <span className="flex items-center gap-1 text-amber-500">
              <Sun className="w-3 h-3" />
              เช้า: {combinedStats.morningCount}
            </span>
            <span className="flex items-center gap-1 text-indigo-400">
              <Moon className="w-3 h-3" />
              ดึก: {combinedStats.nightCount}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>กะเช้า (05-17)</span>
            <span>กะดึก (18-04)</span>
          </div>
        </div>
      </div>

      {/* 3. CLUSTERED BAR CHART: Unified "Replenish Active Cherry  Pick" Without Splitting 40 vs 50 */}
      <div className="relative w-full overflow-x-auto pb-1">
        <div className="min-w-[650px] sm:min-w-full">
          <svg
            className="w-full overflow-visible"
            height={chartHeight}
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            preserveAspectRatio="none"
          >
            <defs>
              {/* Parent gradient */}
              <linearGradient id="cherryParentGradClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.5" />
              </linearGradient>

              {/* Child gradient */}
              <linearGradient id="cherryChildGradClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* Guide Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + availableHeight * (1 - pct);
              const val = Math.round(maxChartVal * pct);
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

            {/* Clustered Bars with compact numbers on top ("ขนาดเล็กพอดี") */}
            {chartData.map((item, idx) => {
              const groupCenterX = idx * stepX + stepX / 2;
              const parentX = groupCenterX - singleBarWidth - 2;
              const childX = groupCenterX + 2;

              const parentH =
                maxChartVal > 0 ? (item.parentCount / maxChartVal) * availableHeight : 0;
              const childH =
                maxChartVal > 0 ? (item.childCount / maxChartVal) * availableHeight : 0;

              const parentY = paddingTop + availableHeight - parentH;
              const childY = paddingTop + availableHeight - childH;

              return (
                <g key={item.key} className="transition-all duration-200">
                  {/* Subtle column highlight backdrop */}
                  {item.isHighlight && (
                    <rect
                      x={idx * stepX + 6}
                      y={paddingTop}
                      width={stepX - 12}
                      height={availableHeight}
                      rx={8}
                      className="fill-purple-500/5 stroke-1 stroke-purple-500/20"
                    />
                  )}

                  {/* Parent Bar (Task No. แม่) */}
                  <rect
                    x={parentX}
                    y={parentY}
                    width={singleBarWidth}
                    height={Math.max(2, parentH)}
                    rx={3.5}
                    fill="url(#cherryParentGradClean)"
                    className={item.isHighlight ? 'stroke-1 stroke-purple-300' : ''}
                  />
                  {item.parentCount > 0 && (
                    <text
                      x={parentX + singleBarWidth / 2}
                      y={parentY - 4}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono tabular-nums font-bold fill-purple-600 dark:fill-purple-300"
                    >
                      {item.parentCount}
                    </text>
                  )}

                  {/* Child Bar (iLPN 2115* ลูก) */}
                  <rect
                    x={childX}
                    y={childY}
                    width={singleBarWidth}
                    height={Math.max(2, childH)}
                    rx={3.5}
                    fill="url(#cherryChildGradClean)"
                    className={item.isHighlight ? 'stroke-1 stroke-cyan-300' : ''}
                  />
                  {item.childCount > 0 && (
                    <text
                      x={childX + singleBarWidth / 2}
                      y={childY - 4}
                      textAnchor="middle"
                      className="text-[8.5px] font-mono tabular-nums font-bold fill-cyan-600 dark:fill-cyan-400"
                    >
                      {item.childCount}
                    </text>
                  )}

                  {/* X-axis Label: Prominently "Replenish Active Cherry  Pick" */}
                  <text
                    x={groupCenterX}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className={`text-[9.5px] font-mono tabular-nums ${
                      item.isHighlight
                        ? 'fill-purple-600 dark:fill-purple-300 font-bold'
                        : 'fill-slate-500 dark:fill-slate-400'
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

      {/* 4. Chart Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-white/10 dark:border-white/5 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              ลาเบลแม่รวม (Task No.)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cyan-500 shrink-0" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              ลาเบลลูกรวม (iLPN 2115*)
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          * แท่งกราฟรวมเป็น <strong>Replenish Active Cherry  Pick</strong> เดียวกัน ไม่แยก 40 กับ 50 ตามคำสั่ง
        </div>
      </div>

      {/* 5. Inspection Table */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            ตารางรายการงาน Replenish Active Cherry  Pick (รวม {tableRows.length.toLocaleString()} รายการ):
          </span>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา Task No. หรือ iLPN 2115..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-xl max-h-48">
          <table className="w-full text-left text-[11px] border-collapse font-mono tabular-nums">
            <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-1.5 px-2.5">Task No. (แม่)</th>
                <th className="py-1.5 px-2.5">iLPN (ลูก)</th>
                <th className="py-1.5 px-2.5 font-sans">Task Description</th>
                <th className="py-1.5 px-2.5 font-sans">By User</th>
                <th className="py-1.5 px-2.5 text-center">Latest Update</th>
                <th className="py-1.5 px-2.5 text-center font-sans">กะ</th>
                <th className="py-1.5 px-2.5 text-right font-sans">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {tableRows.slice(0, 15).map((row) => {
                const is2115 = String(row.ilpn || '').startsWith('2115');
                const isMorning = isMorningShift(row.completionHour);

                return (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-1.5 px-2.5 font-bold text-purple-600 dark:text-purple-300">
                      {row.taskNo || row.id}
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          is2115
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {row.ilpn || '-'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 font-sans text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mr-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-300">
                        Cherry Pick
                      </span>
                      Replenish Active Cherry  Pick
                    </td>
                    <td className="py-1.5 px-2.5 font-sans text-slate-600 dark:text-slate-400">
                      {row.byUser}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-slate-400">
                      {row.latestTaskUpdateDate || row.completionTime}
                    </td>
                    <td className="py-1.5 px-2.5 text-center font-sans">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                          isMorning
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {isMorning ? 'กะเช้า' : 'กะดึก'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-sans">
                      <span className="text-emerald-500 font-semibold">{row.taskStatus}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
