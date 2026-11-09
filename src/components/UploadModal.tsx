import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle, ArrowRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ColumnMapping, RP20Record } from '../types';
import { parseExcelFile, detectColumnMapping, downloadSampleRP20Excel } from '../utils/excelParser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (records: RP20Record[], fileName: string) => void;
  sampleRecords: RP20Record[];
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  sampleRecords,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview & Mapping state
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    taskDescription: '',
    taskStatus: '',
    byUser: '',
    completionTime: '',
    date: '',
  });
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      setFileBuffer(buffer);

      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      if (workbook.SheetNames.length === 0) {
        throw new Error('ไม่พบข้อมูลชีตในไฟล์ Excel');
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });

      if (json.length === 0) {
        throw new Error('ไฟล์นี้ไม่มีข้อมูลในแถวตาราง');
      }

      const sample = json[0];
      const detectedHeaders = Object.keys(sample);
      setHeaders(detectedHeaders);

      const autoMap = detectColumnMapping(detectedHeaders);
      setMapping(autoMap);
      setPreviewRows(json.slice(0, 5));
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!fileBuffer || !selectedFile) return;

    try {
      setIsProcessing(true);
      const { records } = parseExcelFile(fileBuffer, mapping);
      if (records.length === 0) {
        throw new Error('ไม่พบข้อมูลที่สามารถประมวลผลได้');
      }
      onUploadSuccess(records, selectedFile.name);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถแปลงข้อมูลได้ กรุณาตรวจสอบการจับคู่คอลัมน์');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 relative shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="liquid-icon liquid-icon-cyan w-10 h-10 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                อัปโหลดไฟล์รายงาน RP20 (Excel Live Upload)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                รองรับไฟล์นามสกุล .xlsx, .xls หรือ .csv พร้อมตรวจสอบคอลัมน์อัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="py-4 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-slate-300 dark:border-white/15 hover:border-cyan-500/50 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์ RP20
              </p>
              <p className="text-xs text-slate-400 mt-1">
                ระบบจะตรวจสอบช่อง Task Description, Task Status, By User และเวลาเสร็จสิ้น
              </p>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleRP20Excel(sampleRecords);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์ตัวอย่าง RP20 Template เพื่อทดสอบ</span>
                </button>
              </div>
            </div>
          ) : (
            /* File loaded & Column Mapping verification */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB · พบ {previewRows.length > 0 ? 'ข้อมูลพร้อมนำเข้า' : ''}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setFileBuffer(null);
                    setPreviewRows([]);
                  }}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  เปลี่ยนไฟล์
                </button>
              </div>

              {/* Column Mapping Selector */}
              <div className="bg-slate-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>ตรวจสอบการจับคู่คอลัมน์ (Column Mapping)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Task Description */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      1. หัวข้องาน (Item Description / Task Description) *
                    </label>
                    <select
                      value={mapping.taskDescription}
                      onChange={(e) => setMapping({ ...mapping, taskDescription: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Task Status */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      2. สถานะงาน (Task Status - ค่าเริ่มต้น Complete) *
                    </label>
                    <select
                      value={mapping.taskStatus}
                      onChange={(e) => setMapping({ ...mapping, taskStatus: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* By User */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      3. พนักงาน (By User) *
                    </label>
                    <select
                      value={mapping.byUser}
                      onChange={(e) => setMapping({ ...mapping, byUser: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Completion Time */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      4. Latest Task Update Date (เวลาอัปเดตงานเสร็จล่าสุด) *
                    </label>
                    <select
                      value={mapping.completionTime}
                      onChange={(e) => setMapping({ ...mapping, completionTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Task No. (ลาเบลแม่) */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      5. เลขที่งาน Task No. (ลาเบลแม่)
                    </label>
                    <select
                      value={mapping.taskNo || ''}
                      onChange={(e) => setMapping({ ...mapping, taskNo: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="">-- ไม่ระบุ (สร้างอัตโนมัติ) --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* iLPN (ลาเบลลูก ขึ้นต้นด้วย 2115) */}
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      6. ช่อง iLPN (ลาเบลลูก 2115*)
                    </label>
                    <select
                      value={mapping.ilpn || ''}
                      onChange={(e) => setMapping({ ...mapping, ilpn: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      <option value="">-- ไม่ระบุ --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sample 3 rows preview */}
              {previewRows.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    ตัวอย่างข้อมูล 3 แถวแรกจากไฟล์:
                  </div>
                  <div className="overflow-x-auto border border-slate-200/80 dark:border-white/10 rounded-xl">
                    <table className="w-full text-left text-[11px] font-mono tabular-nums">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-white/10">
                        <tr>
                          <th className="py-1.5 px-2">Task Desc</th>
                          <th className="py-1.5 px-2">Status</th>
                          <th className="py-1.5 px-2">By User</th>
                          <th className="py-1.5 px-2">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {previewRows.slice(0, 3).map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            <td className="py-1.5 px-2 truncate max-w-[150px]">
                              {r[mapping.taskDescription]}
                            </td>
                            <td className="py-1.5 px-2">{r[mapping.taskStatus]}</td>
                            <td className="py-1.5 px-2 truncate max-w-[120px]">
                              {r[mapping.byUser]}
                            </td>
                            <td className="py-1.5 px-2">{r[mapping.completionTime]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-white/10 dark:border-white/5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>

          {selectedFile && (
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? 'กำลังประมวลผล...' : 'นำเข้าข้อมูลเข้าสู่ Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
