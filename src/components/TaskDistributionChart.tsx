import React from 'react';
import { PieChart, Check } from 'lucide-react';

interface TaskDistributionProps {
  taskCounts: Record<string, number>;
  selectedTasks: string[];
  onToggleTask: (task: string) => void;
  onClearTasks: () => void;
  totalCompleted: number;
}

export const TaskDistributionChart: React.FC<TaskDistributionProps> = ({
  taskCounts,
  selectedTasks,
  onToggleTask,
  onClearTasks,
  totalCompleted,
}) => {
  const sortedTasks = Object.entries(taskCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...sortedTasks.map((t) => t[1]));

  const colorPalette = [
    'from-cyan-500 to-blue-500',
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-violet-500 to-pink-500',
    'from-blue-500 to-indigo-500',
    'from-teal-500 to-cyan-500',
    'from-rose-500 to-amber-500',
  ];

  const hasSpecificSelection = selectedTasks.length > 0;

  return (
    <div className="glass-panel glass-specular rounded-2xl p-5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-500">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              สัดส่วนตามประเภทงาน (Task Breakdown)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            คลิกเพื่อเลือก/ยกเลิกหัวข้องาน (เลือกพร้อมกันได้หลายหัวข้อ)
          </p>
        </div>

        {hasSpecificSelection && (
          <button
            onClick={onClearTasks}
            className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            เลือกทั้งหมด
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {sortedTasks.map(([task, count], idx) => {
          const isSelected = selectedTasks.includes(task);
          const percentage = totalCompleted > 0 ? (count / totalCompleted) * 100 : 0;
          const barWidth = (count / maxCount) * 100;
          const gradient = colorPalette[idx % colorPalette.length];

          return (
            <div
              key={task}
              onClick={() => onToggleTask(task)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-violet-500/15 border-violet-500/50 shadow-xs ring-1 ring-violet-500/30'
                  : hasSpecificSelection
                  ? 'bg-slate-50/40 dark:bg-slate-900/30 opacity-60 border-slate-200/50 dark:border-white/5 hover:opacity-100'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200/70 dark:border-white/5'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] transition-colors ${
                      isSelected
                        ? 'bg-violet-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {task}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {count.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400">({percentage.toFixed(1)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200/80 dark:bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`bg-gradient-to-r ${gradient} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
