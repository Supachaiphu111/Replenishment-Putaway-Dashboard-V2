import React, { useState } from 'react';
import { ListFilter, Download, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { RP20Record } from '../types';

interface RawDataTableProps {
  records: RP20Record[];
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ records }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.taskDescription.toLowerCase().includes(q) ||
      r.byUser.toLowerCase().includes(q) ||
      r.taskStatus.toLowerCase().includes(q) ||
      r.completionTime.includes(q) ||
      r.date.includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportFilteredCSV = () => {
    const headers = ['Task ID', 'Task No. (แม่)', 'iLPN (ลูก)', 'Task Description', 'Task Status', 'By User', 'Date', 'Completion Time', 'Hour'];
    const rows = filtered.map((r) => [
      `"${r.id}"`,
      `"${r.taskNo || ''}"`,
      `"${r.ilpn || ''}"`,
      `"${r.taskDescription.replace(/"/g, '""')}"`,
      `"${r.taskStatus}"`,
      `"${r.byUser.replace(/"/g, '""')}"`,
      `"${r.date}"`,
      `"${r.completionTime}"`,
      r.completionHour,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RP20_Filtered_Tasks_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel glass-specular rounded-2xl p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
              <ListFilter className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
              รายการงานแต่ละรายการ (RP20 Task Detail Ledger)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            แสดงรายละเอียดงานที่ผ่านการกรอง พร้อมรหัส Task No. (แม่) และ iLPN (ลูก) ({filtered.length.toLocaleString()} รายการ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="กรองในตารางนี้..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={exportFilteredCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>ดาวน์โหลด CSV รายการ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">
              <th className="py-2.5 px-3 font-semibold min-w-[90px]">Task ID</th>
              <th className="py-2.5 px-3 font-semibold min-w-[110px]">Task No. (แม่)</th>
              <th className="py-2.5 px-3 font-semibold min-w-[110px]">iLPN (ลูก)</th>
              <th className="py-2.5 px-3 font-semibold min-w-[180px]">หัวข้องาน (Task Description)</th>
              <th className="py-2.5 px-3 font-semibold min-w-[100px]">สถานะ (Status)</th>
              <th className="py-2.5 px-3 font-semibold min-w-[140px]">พนักงาน (By User)</th>
              <th className="py-2.5 px-3 font-semibold min-w-[90px] text-center">วันที่</th>
              <th className="py-2.5 px-3 font-semibold min-w-[80px] text-right">เวลาเสร็จ</th>
              <th className="py-2.5 px-3 font-semibold min-w-[60px] text-center">ชั่วโมง</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono tabular-nums">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                  ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const isComplete = row.taskStatus.toLowerCase() === 'complete';
                const is2115 = String(row.ilpn || '').startsWith('2115');

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-medium">
                      {row.id}
                    </td>
                    <td className="py-2 px-3 text-purple-600 dark:text-purple-300 font-semibold">
                      {row.taskNo || '-'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={is2115 ? 'text-cyan-600 dark:text-cyan-300 font-bold' : 'text-slate-400'}>
                        {row.ilpn || '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium truncate max-w-[220px]">
                      {row.taskDescription}
                    </td>
                    <td className="py-2 px-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isComplete
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : row.taskStatus.toLowerCase().includes('progress')
                            ? 'text-blue-500 dark:text-blue-400'
                            : row.taskStatus.toLowerCase().includes('cancel')
                            ? 'text-rose-500 dark:text-rose-400'
                            : 'text-amber-500 dark:text-amber-400'
                        }`}
                      >
                        {isComplete && '✓ '}
                        {row.taskStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">
                      {row.byUser}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                      {row.date}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300 font-bold">
                      {row.completionTime}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                        {String(row.completionHour).padStart(2, '0')}:00
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>แสดงแถวต่อหน้า:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-mono tabular-nums">
            หน้า {currentPage} จาก {totalPages}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
