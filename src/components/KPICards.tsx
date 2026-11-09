import React from 'react';
import { CheckCircle2, Users, Flame, Gauge, TrendingUp } from 'lucide-react';

interface KPICardsProps {
  completedCount: number;
  totalCount: number;
  activeUsersCount: number;
  peakHourLabel: string;
  peakHourCount: number;
  avgPerHour: number;
  completionRate: number;
  statusLabel?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  completedCount,
  totalCount,
  activeUsersCount,
  peakHourLabel,
  peakHourCount,
  avgPerHour,
  completionRate,
  statusLabel = 'Complete',
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Completed Tasks */}
      <div className="glass-panel glass-specular p-4 relative group hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {statusLabel === 'ALL' || statusLabel.toLowerCase() === 'complete'
              ? 'ยอดงานเสร็จสิ้น (Completed)'
              : `ยอดงาน (${statusLabel})`}
          </span>
          <div className="liquid-icon liquid-icon-emerald w-9 h-9 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {completedCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 font-mono">งาน</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>จาก {totalCount.toLocaleString()} รายการ</span>
          <span>·</span>
          <span className="text-emerald-500 font-bold">{completionRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 2. Peak Productive Hour */}
      <div className="glass-panel glass-specular p-4 relative group hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            ช่วงเวลาพีคสุด (Peak Hour)
          </span>
          <div className="liquid-icon liquid-icon-amber w-9 h-9 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-mono tabular-nums text-amber-500 truncate">
            {peakHourLabel}
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="font-bold text-amber-600 dark:text-amber-400">{peakHourCount.toLocaleString()} งาน</span>
          <span>·</span>
          <span>กำลังผลิตสูงสุด</span>
        </div>
      </div>

      {/* 3. Active Users */}
      <div className="glass-panel glass-specular p-4 relative group hover:border-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            พนักงานปฏิบัติงาน (Users)
          </span>
          <div className="liquid-icon liquid-icon-cyan w-9 h-9 shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {activeUsersCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">คน</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>เฉลี่ย {(completedCount / (activeUsersCount || 1)).toFixed(1)} งาน/คน</span>
        </div>
      </div>

      {/* 4. Average Hourly Speed */}
      <div className="glass-panel glass-specular p-4 relative group hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            เฉลี่ยต่อชั่วโมง (Tasks/Hr)
          </span>
          <div className="liquid-icon liquid-icon-indigo w-9 h-9 shrink-0">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {avgPerHour.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 font-mono">งาน/ชม.</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>ชั่วโมงที่มีการปิดงาน</span>
        </div>
      </div>

      {/* 5. Completion Efficiency */}
      <div className="glass-panel glass-specular p-4 relative group hover:border-violet-500/40 hover:-translate-y-0.5 transition-all duration-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            อัตราเสร็จสิ้น (Success %)
          </span>
          <div className="liquid-icon liquid-icon-violet w-9 h-9 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-emerald-500 dark:text-emerald-400">
            {completionRate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2.5 w-full bg-slate-200 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden p-[1px] border border-white/5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/30"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
