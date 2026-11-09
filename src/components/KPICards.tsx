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
      <div className="glass-panel glass-specular rounded-2xl p-4 relative group hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {statusLabel === 'ALL' || statusLabel.toLowerCase() === 'complete'
              ? 'ยอดงานเสร็จสิ้น (Completed)'
              : `ยอดงานสถานะ (${statusLabel})`}
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {completedCount.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">tasks</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>จากทั้งหมด {totalCount.toLocaleString()} งาน</span>
          <span>·</span>
          <span className="text-emerald-500 font-semibold">{completionRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* 2. Peak Productive Hour */}
      <div className="glass-panel glass-specular rounded-2xl p-4 relative group hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            ช่วงเวลาพีคสุด (Peak Hour)
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-amber-500">
            {peakHourLabel}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{peakHourCount.toLocaleString()} งาน</span>
          <span>·</span>
          <span>ช่วงกำลังการผลิตสูงสุด</span>
        </div>
      </div>

      {/* 3. Active Users */}
      <div className="glass-panel glass-specular rounded-2xl p-4 relative group hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            พนักงานที่ปฏิบัติงาน (Active Users)
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {activeUsersCount}
          </span>
          <span className="text-xs text-slate-400">คน</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>เฉลี่ย {(completedCount / (activeUsersCount || 1)).toFixed(1)} งาน/คน</span>
        </div>
      </div>

      {/* 4. Average Hourly Speed */}
      <div className="glass-panel glass-specular rounded-2xl p-4 relative group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            เฉลี่ยต่อชั่วโมง (Avg Tasks/Hr)
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
            {avgPerHour.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">งาน/ชม.</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>คิดจากชั่วโมงที่มีการบันทึก</span>
        </div>
      </div>

      {/* 5. Completion Efficiency */}
      <div className="glass-panel glass-specular rounded-2xl p-4 relative group hover:border-violet-500/30 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            อัตราเสร็จสมบูรณ์ (Completion %)
          </span>
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-emerald-500 dark:text-emerald-400">
            {completionRate.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, completionRate)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
