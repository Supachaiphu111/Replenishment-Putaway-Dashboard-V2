import React from 'react';
import { X, Sliders, Eye, EyeOff, Sparkles, Check, RotateCcw } from 'lucide-react';
import { DashboardSettings, GlassIntensity, WidgetVisibility } from '../types';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DashboardSettings;
  onUpdateSettings: (newSettings: DashboardSettings) => void;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const toggleWidget = (key: keyof WidgetVisibility) => {
    onUpdateSettings({
      ...settings,
      widgets: {
        ...settings.widgets,
        [key]: !settings.widgets[key],
      },
    });
  };

  const setGlass = (intensity: GlassIntensity) => {
    onUpdateSettings({
      ...settings,
      glassIntensity: intensity,
    });
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      widgets: {
        kpiCards: true,
        hourlyChart: true,
        cumulativeChart: true,
        dailyMonthlyChart: true,
        cherryPickWidget: true,
        ilpnAuditWidget: true,
        topUsers: true,
        taskDistribution: true,
        matrixTable: true,
        rawDataTable: true,
      },
      glassIntensity: 'standard',
      showShiftOnly: false,
      autoRefreshSample: false,
    });
  };

  const widgetDefinitions: { id: keyof WidgetVisibility; label: string; desc: string }[] = [
    {
      id: 'kpiCards',
      label: 'การ์ดยอดรวม KPI สรุปด่วน',
      desc: 'แสดงงานเสร็จสมบูรณ์, ชั่วโมงพีค, จำนวนพนักงาน, ความเร็วเฉลี่ย',
    },
    {
      id: 'hourlyChart',
      label: 'กราฟแท่งยอดงานรายชั่วโมง (00:00 - 23:00)',
      desc: 'กราฟแท่งแสดงปริมาณงานเสร็จแยกตามชั่วโมงเพื่อวิเคราะห์ช่วงเวลาพีค (แสดงแยกแถว)',
    },
    {
      id: 'cumulativeChart',
      label: 'กราฟแท่งแสดงยอดสะสมรายชั่วโมง (Cumulative Growth)',
      desc: 'แสดงยอดรวมสะสมต่อเนื่องตลอดวัน พร้อมตัวเลขกำกับทุกแท่ง (แสดงแยกแถว)',
    },
    {
      id: 'dailyMonthlyChart',
      label: 'กราฟแท่งสรุปผลงานรายวันและรายเดือน พร้อมเส้นแนวโน้ม',
      desc: 'แสดงยอดงานรายวัน/รายเดือน เปรียบเทียบกะเช้า-ดึก พร้อมเส้นแนวโน้ม Trendline',
    },
    {
      id: 'cherryPickWidget',
      label: 'กราฟแท่งวิเคราะห์ Cherry Pick (Task No. แม่ vs iLPN 2115 ลูก)',
      desc: 'นับเฉพาะ Replenish Active Cherry Pick Prty 40 และ 50 เปรียบเทียบลาเบลแม่และลูก',
    },
    {
      id: 'ilpnAuditWidget',
      label: 'ตรวจสอบความถูกต้อง iLPN & ตรวจจับข้อผิดพลาด (iLPN Audit)',
      desc: 'ตรวจจับ User ที่ใช้ iLPN ลูกซ้ำมากกว่า 1 ครั้ง และการใช้ลาเบลผิดประเภท (ขึ้นต้น 2114*)',
    },
    {
      id: 'topUsers',
      label: 'กราฟจัดอันดับผลงานพนักงาน (Top Leaderboard)',
      desc: 'อันดับยอดงานเสร็จสิ้นของพนักงานในช่อง By User และสัดส่วน %',
    },
    {
      id: 'taskDistribution',
      label: 'สัดส่วนตามประเภทงาน (Task Description Breakdown)',
      desc: 'แถบเปรียบเทียบสัดส่วนงานประเภทต่างๆ เช่น Picking, Putaway, etc.',
    },
    {
      id: 'matrixTable',
      label: 'ตาราง Matrix (พนักงาน × รายชั่วโมง)',
      desc: 'ตาราง Heatmap แสดงงานต่อชั่วโมงของทุกคน พร้อมปุ่มส่งออก CSV/Excel',
    },
    {
      id: 'rawDataTable',
      label: 'ตารางรายการงานรายแถว (Task Ledger)',
      desc: 'ตรวจสอบรายชื่องานแต่ละรายการ ค้นหา และส่งออกรายการงาน',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 relative shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                ปรับแต่ง Widget & สไตล์ Liquid Glass (Real-time)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เปิด/ปิดส่วนแสดงผลตามต้องการ การเปลี่ยนแปลงจะมีผลทันที
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

        {/* Content */}
        <div className="py-4 overflow-y-auto space-y-5 flex-1">
          {/* Glass Style Intensity */}
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span>ระดับความเข้มข้น Liquid Glass (Glassmorphism Depth)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['subtle', 'standard', 'ultra'] as GlassIntensity[]).map((level) => {
                const isActive = settings.glassIntensity === level;
                return (
                  <button
                    key={level}
                    onClick={() => setGlass(level)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="capitalize">{level} Glass</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                      {level === 'subtle'
                        ? 'โปร่งแสงเรียบหรู'
                        : level === 'standard'
                        ? 'บาลานซ์แสงเงาสวยงาม'
                        : 'กระจกเงาเข้มสะท้อนแสง'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget Toggles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>การแสดงผลของแต่ละ Widget</span>
              </div>
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-400 hover:text-cyan-500 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            </div>

            <div className="space-y-2">
              {widgetDefinitions.map((widget) => {
                const isVisible = settings.widgets[widget.id];
                return (
                  <div
                    key={widget.id}
                    onClick={() => toggleWidget(widget.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isVisible
                        ? 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/90 dark:border-white/10'
                        : 'bg-slate-100/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {widget.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{widget.desc}</div>
                    </div>

                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                        isVisible ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform ${
                          isVisible ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 dark:border-white/5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            เสร็จสิ้น (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
