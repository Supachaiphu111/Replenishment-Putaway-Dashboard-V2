import React, { useState } from 'react';
import { Table, Download, FileSpreadsheet, Search } from 'lucide-react';
import { UserMatrixRow } from '../types';
import { exportMatrixToCSV, exportMatrixToExcel } from '../utils/excelParser';

interface MatrixTableProps {
  matrixRows: UserMatrixRow[];
  activeHours: number[];
  onCellClick?: (user: string, hour: number) => void;
  selectedUser: string;
  onSelectUser: (user: string) => void;
}

export const MatrixTable: React.FC<MatrixTableProps> = ({
  matrixRows,
  activeHours,
  onCellClick,
  selectedUser,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRows = matrixRows.filter((r) =>
    r.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate highest cell value for heatmap intensity normalization
  let maxCell = 1;
  matrixRows.forEach((r) => {
    activeHours.forEach((h) => {
      if (r.hourlyCounts[h] > maxCell) maxCell = r.hourlyCounts[h];
    });
  });

  // Calculate column totals
  const columnTotals = activeHours.map((h) =>
    matrixRows.reduce((sum, r) => sum + (r.hourlyCounts[h] || 0), 0)
  );
  const grandTotal = matrixRows.reduce((sum, r) => sum + r.total, 0);

  // Helper for heatmap background
  const getCellBg = (count: number) => {
    if (count === 0) return 'text-slate-400/40 dark:text-slate-600';
    const intensity = Math.min(1, count / maxCell);
    if (intensity > 0.75) {
      return 'bg-cyan-500/35 text-cyan-900 dark:text-cyan-200 font-bold border border-cyan-400/30';
    } else if (intensity > 0.45) {
      return 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-semibold';
    } else if (intensity > 0.2) {
      return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-medium';
    }
    return 'bg-slate-500/5 text-slate-700 dark:text-slate-300';
  };

  return (
    <div className="glass-panel glass-specular rounded-2xl p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Table className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              ตาราง Matrix ผลงาน (พนักงาน By User × รายชั่วโมง)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            แสดงจำนวนงานที่ทำเสร็จในแต่ละชั่วโมงพร้อมแถบระดับสีความหนาแน่น (Heatmap Matrix)
          </p>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={() => exportMatrixToCSV(matrixRows, activeHours)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="ส่งออกตาราง Matrix เป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => exportMatrixToExcel(matrixRows, activeHours)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="ส่งออกตาราง Matrix เป็นไฟล์ Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>ส่งออก Excel</span>
          </button>
        </div>
      </div>

      {/* Responsive Matrix Grid Table */}
      <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10">
              <th className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-100 dark:bg-slate-900 z-10 whitespace-nowrap min-w-[160px]">
                พนักงาน (By User)
              </th>
              {activeHours.map((h) => (
                <th
                  key={h}
                  className="py-2 px-2 text-center font-mono font-medium text-slate-600 dark:text-slate-400 min-w-[42px] whitespace-nowrap"
                >
                  {String(h).padStart(2, '0')}:00
                </th>
              ))}
              <th className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-800/80 min-w-[70px] whitespace-nowrap">
                รวม
              </th>
              <th className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200 min-w-[65px] whitespace-nowrap">
                สัดส่วน
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono tabular-nums">
            {filteredRows.map((row) => {
              const isSelected = selectedUser === row.user;

              return (
                <tr
                  key={row.user}
                  className={`transition-colors hover:bg-cyan-500/5 ${
                    isSelected ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  {/* User Name (Sticky Left) */}
                  <td
                    onClick={() => onSelectUser(isSelected ? 'ALL' : row.user)}
                    className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200 sticky left-0 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xs z-10 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 truncate max-w-[180px]"
                    title={row.user}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono w-4">
                        #{row.rank}
                      </span>
                      <span className="truncate">{row.user}</span>
                    </div>
                  </td>

                  {/* Hourly Cells */}
                  {activeHours.map((h) => {
                    const count = row.hourlyCounts[h] || 0;
                    return (
                      <td
                        key={h}
                        onClick={() => onCellClick && onCellClick(row.user, h)}
                        className={`py-1.5 px-1 text-center transition-all cursor-pointer ${getCellBg(
                          count
                        )}`}
                        title={`${row.user} @ ${String(h).padStart(2, '0')}:00 น. : ${count} งาน`}
                      >
                        {count > 0 ? count : '-'}
                      </td>
                    );
                  })}

                  {/* Row Total */}
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-800/40">
                    {row.total.toLocaleString()}
                  </td>

                  {/* Share % */}
                  <td className="py-2 px-3 text-right text-slate-500 dark:text-slate-400 text-[11px]">
                    {row.percentage.toFixed(1)}%
                  </td>
                </tr>
              );
            })}

            {/* Column Summary Row */}
            <tr className="bg-slate-100/95 dark:bg-slate-900/95 font-bold border-t-2 border-slate-300 dark:border-white/10">
              <td className="py-2.5 px-3 text-slate-900 dark:text-white font-sans sticky left-0 bg-slate-100 dark:bg-slate-900 z-10">
                รวมทั้งหมด (All Users)
              </td>
              {columnTotals.map((tot, idx) => (
                <td
                  key={activeHours[idx]}
                  className="py-2 px-1 text-center text-cyan-600 dark:text-cyan-400 font-mono"
                >
                  {tot > 0 ? tot.toLocaleString() : '-'}
                </td>
              ))}
              <td className="py-2.5 px-3 text-right font-extrabold text-cyan-600 dark:text-cyan-400 bg-slate-200/80 dark:bg-slate-800/80">
                {grandTotal.toLocaleString()}
              </td>
              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>* ช่องสีฟ้าเข้มแสดงช่วงเวลาที่พนักงานมีความหนาแน่นของงานเสร็จสิ้นสูง</span>
        <span>คลิกที่ชื่อพนักงานเพื่อกรอง หรือคลิกส่งออก CSV/Excel ได้ทันที</span>
      </div>
    </div>
  );
};
