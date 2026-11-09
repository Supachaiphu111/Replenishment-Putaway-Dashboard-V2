import React from 'react';
import { Award, UserCheck, Flame, ChevronRight } from 'lucide-react';
import { UserMatrixRow } from '../types';

interface TopUserRankingProps {
  matrixRows: UserMatrixRow[];
  selectedUser: string;
  onSelectUser: (user: string) => void;
  peakHourByUser: Record<string, { hour: number; count: number }>;
}

export const TopUserRanking: React.FC<TopUserRankingProps> = ({
  matrixRows,
  selectedUser,
  onSelectUser,
  peakHourByUser,
}) => {
  const maxUserTotal = Math.max(1, ...matrixRows.map((r) => r.total));

  return (
    <div className="glass-panel glass-specular rounded-2xl p-5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="liquid-icon liquid-icon-amber w-9 h-9 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              จัดอันดับผลงานพนักงาน (Top Performer Leaderboard)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            สรุปยอดงานเสร็จสิ้นตามรายชื่อในช่อง By User (คลิกที่รายชื่อเพื่อกรองเฉพาะคนนั้น)
          </p>
        </div>

        {selectedUser !== 'ALL' && (
          <button
            onClick={() => onSelectUser('ALL')}
            className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            แสดงทุกคน
          </button>
        )}
      </div>

      {/* Leaderboard Rows */}
      <div className="space-y-2.5">
        {matrixRows.slice(0, 8).map((row, index) => {
          const rank = index + 1;
          const isSelected = selectedUser === row.user;
          const pctWidth = (row.total / maxUserTotal) * 100;
          const userPeak = peakHourByUser[row.user];

          return (
            <div
              key={row.user}
              onClick={() => onSelectUser(isSelected ? 'ALL' : row.user)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-white/5'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Rank Badge */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 ${
                    rank === 1
                      ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30'
                      : rank === 2
                      ? 'bg-slate-300/30 text-slate-400 dark:text-slate-200 border border-slate-300/40'
                      : rank === 3
                      ? 'bg-amber-700/20 text-amber-600 dark:text-amber-500 border border-amber-700/30'
                      : 'bg-slate-200/50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {rank}
                </div>

                {/* User Name & Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {row.user}
                    </span>
                    {rank === 1 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/20 shrink-0">
                        Top #1
                      </span>
                    )}
                  </div>

                  {/* Progress Bar Track */}
                  <div className="mt-1.5 w-full bg-slate-200/80 dark:bg-slate-700/50 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rank === 1
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : rank === 2
                          ? 'bg-gradient-to-r from-cyan-400 to-cyan-500'
                          : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                      }`}
                      style={{ width: `${pctWidth}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats & Peak Hour */}
              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs">
                {userPeak && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>
                      พีค {String(userPeak.hour).padStart(2, '0')}:00 น.
                    </span>
                  </div>
                )}

                <div className="text-right">
                  <div className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                    {row.total.toLocaleString()} <span className="text-xs font-normal text-slate-400">งาน</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                    สัดส่วน {row.percentage.toFixed(1)}%
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-cyan-500' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
