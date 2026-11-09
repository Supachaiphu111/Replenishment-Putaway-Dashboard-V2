import React from 'react';
import { Upload, Download, Sliders, Moon, Sun, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { RP20Record } from '../types';
import { downloadSampleRP20Excel } from '../utils/excelParser';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUpload: () => void;
  onOpenCustomizer: () => void;
  onResetSample: () => void;
  currentRecords: RP20Record[];
  totalRecordsCount: number;
  fileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenUpload,
  onOpenCustomizer,
  onResetSample,
  currentRecords,
  totalRecordsCount,
  fileName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 dark:border-white/10 bg-white/70 dark:bg-slate-950/75 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone: 1-line display wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                RP20 Liquid Analytics
              </span>
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                Hourly Hub
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
              <span>{fileName ? `File: ${fileName}` : 'RP20 Production Live Stream'}</span>
              <span>·</span>
              <span>{totalRecordsCount.toLocaleString()} total rows</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sample Reset & Download */}
          <button
            onClick={() => downloadSampleRP20Excel(currentRecords)}
            title="ดาวน์โหลดไฟล์ตัวอย่าง RP20 Excel (.xlsx)"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>Sample Excel</span>
          </button>

          <button
            onClick={onResetSample}
            title="รีเซ็ตข้อมูลเป็นตัวอย่างมาตรฐาน"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Real-time Widget Customizer */}
          <button
            onClick={onOpenCustomizer}
            title="ปรับแต่งการแสดงผล Widget แบบ Real-time"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Customize Widgets</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Primary Action: Upload Live Excel */}
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลด Excel (RP20)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
