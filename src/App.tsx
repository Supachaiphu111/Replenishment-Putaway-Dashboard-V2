import React, { useState, useMemo, useEffect } from 'react';
import { RP20Record, FilterState, DashboardSettings, HourlyStat, UserMatrixRow, ShiftFilter } from './types';
import { generateSampleRP20Data, isMorningShift, isNightShift } from './utils/sampleData';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KPICards } from './components/KPICards';
import { HourlyBarChart } from './components/HourlyBarChart';
import { HourlyCumulativeChart } from './components/HourlyCumulativeChart';
import { DailyMonthlyChart } from './components/DailyMonthlyChart';
import { CherryPickAnalytics } from './components/CherryPickAnalytics';
import { IlpnAuditWidget } from './components/IlpnAuditWidget';
import { TopUserRanking } from './components/TopUserRanking';
import { MatrixTable } from './components/MatrixTable';
import { TaskDistributionChart } from './components/TaskDistributionChart';
import { RawDataTable } from './components/RawDataTable';
import { UploadModal } from './components/UploadModal';
import { WidgetCustomizerModal } from './components/WidgetCustomizerModal';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('rp20_theme');
    if (saved) return saved === 'dark';
    return true; // Default dark for sleek liquid glass
  });

  // Apply dark class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('rp20_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Master RP20 Records
  const [records, setRecords] = useState<RP20Record[]>(() => generateSampleRP20Data());
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Dashboard Settings (Real-time customizable widgets & glass)
  const [settings, setSettings] = useState<DashboardSettings>({
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

  // Shift Filter state: 'ALL', 'MORNING' (05:00-17:00), 'NIGHT' (18:00-04:00)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>('ALL');

  // Extract all distinct dates from dataset
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).filter(Boolean);
    return dates.sort((a, b) => b.localeCompare(a));
  }, [records]);

  // Extract all distinct tasks
  const availableTasks = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.taskDescription))).filter(Boolean).sort();
  }, [records]);

  // Extract all distinct statuses
  const availableStatuses = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.taskStatus))).filter(Boolean).sort();
  }, [records]);

  // Extract all distinct users
  const availableUsers = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.byUser))).filter(Boolean).sort();
  }, [records]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    selectedDate: availableDates[0] || 'ALL',
    taskDescriptions: [], // empty = all tasks, or array of selected task descriptions
    taskStatus: 'Complete', // Explicit requirement: count from Complete
    byUser: 'ALL',
    shift: 'ALL',
    hourRange: [0, 23],
    searchQuery: '',
  });

  // Update selectedDate if records change
  useEffect(() => {
    if (availableDates.length > 0 && filters.selectedDate === 'ALL') {
      setFilters((prev) => ({ ...prev, selectedDate: availableDates[0] }));
    }
  }, [availableDates]);

  // Selected hour filter for chart interaction
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Active hours based on shift:
  // - MORNING: 05:00 - 17:00 (hours 5 to 17)
  // - NIGHT: 18:00 - 04:00 (hours 18..23, 0..4)
  // - ALL: 0..23 (24 hours)
  const activeHours = useMemo(() => {
    if (shiftFilter === 'MORNING') {
      return Array.from({ length: 13 }, (_, i) => i + 5);
    }
    if (shiftFilter === 'NIGHT') {
      return [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
    }
    return Array.from({ length: 24 }, (_, i) => i);
  }, [shiftFilter]);

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date filter
      if (filters.selectedDate !== 'ALL' && r.date !== filters.selectedDate) {
        return false;
      }
      // Task Description filter (multi-select)
      if (filters.taskDescriptions && filters.taskDescriptions.length > 0) {
        if (filters.taskDescriptions[0] === '__NONE__') {
          return false;
        }
        if (!filters.taskDescriptions.includes(r.taskDescription)) {
          return false;
        }
      }
      // Task Status filter
      if (filters.taskStatus !== 'ALL') {
        if (r.taskStatus.toLowerCase() !== filters.taskStatus.toLowerCase()) {
          return false;
        }
      }
      // Shift filter: 05:00-17:00 Morning, 18:00-04:00 Night
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) {
        return false;
      }
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) {
        return false;
      }
      // By User filter
      if (filters.byUser !== 'ALL' && r.byUser !== filters.byUser) {
        return false;
      }
      // Selected specific hour (from chart click)
      if (selectedHour !== null && r.completionHour !== selectedHour) {
        return false;
      }
      // Free text search (includes taskNo and ilpn)
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matches =
          r.id.toLowerCase().includes(q) ||
          (r.taskNo && r.taskNo.toLowerCase().includes(q)) ||
          (r.ilpn && r.ilpn.toLowerCase().includes(q)) ||
          r.taskDescription.toLowerCase().includes(q) ||
          r.byUser.toLowerCase().includes(q) ||
          r.completionTime.includes(q) ||
          r.taskStatus.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, filters, selectedHour, shiftFilter]);

  // Completed Count & Raw Count for metrics (dynamically reflects selected status)
  const totalCompletedCount = useMemo(() => {
    if (filters.taskStatus === 'ALL') {
      return filteredRecords.filter((r) => r.taskStatus.toLowerCase() === 'complete').length;
    }
    return filteredRecords.length;
  }, [filteredRecords, filters.taskStatus]);

  const totalLoadedCount = records.length;
  const filteredLoadedCount = filteredRecords.length;

  // Active Users count
  const activeUsersCount = useMemo(() => {
    return new Set(filteredRecords.map((r) => r.byUser)).size;
  }, [filteredRecords]);

  // Hourly Statistics (over activeHours)
  const hourlyStats: HourlyStat[] = useMemo(() => {
    const stats: HourlyStat[] = [];
    let runningCumulative = 0;

    for (const h of activeHours) {
      const recordsInHour = filteredRecords.filter((r) => r.completionHour === h);
      const count = recordsInHour.length;
      runningCumulative += count;

      const userBreakdown: Record<string, number> = {};
      const taskBreakdown: Record<string, number> = {};

      recordsInHour.forEach((r) => {
        userBreakdown[r.byUser] = (userBreakdown[r.byUser] || 0) + 1;
        taskBreakdown[r.taskDescription] = (taskBreakdown[r.taskDescription] || 0) + 1;
      });

      stats.push({
        hour: h,
        label: `${String(h).padStart(2, '0')}:00`,
        count,
        cumulativeCount: runningCumulative,
        userBreakdown,
        taskBreakdown,
      });
    }

    return stats;
  }, [filteredRecords, activeHours]);

  // Peak Hour
  const peakHourObj = useMemo(() => {
    let peakH = activeHours[0] || 8;
    let maxC = -1;
    hourlyStats.forEach((s) => {
      if (s.count > maxC) {
        maxC = s.count;
        peakH = s.hour;
      }
    });
    return {
      hour: peakH,
      count: maxC > 0 ? maxC : 0,
      label: `${String(peakH).padStart(2, '0')}:00 - ${String(peakH).padStart(2, '0')}:59 น.`,
    };
  }, [hourlyStats, activeHours]);

  // Avg per Hour (over active hours with >0 tasks)
  const avgPerHour = useMemo(() => {
    const activeHrs = hourlyStats.filter((s) => s.count > 0);
    if (activeHrs.length === 0) return 0;
    return filteredRecords.length / activeHrs.length;
  }, [hourlyStats, filteredRecords]);

  // Completion Rate %
  const completionRate = useMemo(() => {
    const allStatusMatching = records.filter((r) => {
      if (filters.selectedDate !== 'ALL' && r.date !== filters.selectedDate) return false;
      if (filters.taskDescriptions && filters.taskDescriptions.length > 0) {
        if (filters.taskDescriptions[0] === '__NONE__') return false;
        if (!filters.taskDescriptions.includes(r.taskDescription)) return false;
      }
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) return false;
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) return false;
      if (filters.byUser !== 'ALL' && r.byUser !== filters.byUser) return false;
      return true;
    });
    if (allStatusMatching.length === 0) return 100;
    const completes = allStatusMatching.filter((r) => r.taskStatus.toLowerCase() === 'complete').length;
    return (completes / allStatusMatching.length) * 100;
  }, [records, filters.selectedDate, filters.taskDescriptions, filters.byUser, shiftFilter]);

  // Dynamic counts for status tabs matching current date, tasks, user, hour, and shift
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Complete: 0,
      'In Progress': 0,
      Pending: 0,
      Cancelled: 0,
      ALL: 0,
    };

    records.forEach((r) => {
      if (filters.selectedDate !== 'ALL' && r.date !== filters.selectedDate) return;
      if (filters.taskDescriptions && filters.taskDescriptions.length > 0) {
        if (filters.taskDescriptions[0] === '__NONE__') return;
        if (!filters.taskDescriptions.includes(r.taskDescription)) return;
      }
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) return;
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) return;
      if (filters.byUser !== 'ALL' && r.byUser !== filters.byUser) return;
      if (selectedHour !== null && r.completionHour !== selectedHour) return;

      counts.ALL = (counts.ALL || 0) + 1;
      const statusLower = r.taskStatus.toLowerCase();
      if (statusLower === 'complete') {
        counts.Complete = (counts.Complete || 0) + 1;
      } else if (statusLower.includes('progress')) {
        counts['In Progress'] = (counts['In Progress'] || 0) + 1;
      } else if (statusLower.includes('pending')) {
        counts.Pending = (counts.Pending || 0) + 1;
      } else if (statusLower.includes('cancel')) {
        counts.Cancelled = (counts.Cancelled || 0) + 1;
      } else {
        counts[r.taskStatus] = (counts[r.taskStatus] || 0) + 1;
      }
    });

    return counts;
  }, [records, filters.selectedDate, filters.taskDescriptions, filters.byUser, selectedHour, shiftFilter]);

  // Task counts for FilterBar tabs
  const taskCountsForTabs = useMemo(() => {
    const counts: Record<string, number> = {};
    availableTasks.forEach((t) => {
      counts[t] = 0;
    });

    records.forEach((r) => {
      if (filters.selectedDate !== 'ALL' && r.date !== filters.selectedDate) return;
      if (filters.taskStatus !== 'ALL' && r.taskStatus.toLowerCase() !== filters.taskStatus.toLowerCase()) return;
      if (shiftFilter === 'MORNING' && !isMorningShift(r.completionHour)) return;
      if (shiftFilter === 'NIGHT' && !isNightShift(r.completionHour)) return;
      if (filters.byUser !== 'ALL' && r.byUser !== filters.byUser) return;
      if (selectedHour !== null && r.completionHour !== selectedHour) return;

      counts[r.taskDescription] = (counts[r.taskDescription] || 0) + 1;
    });

    return counts;
  }, [records, filters.selectedDate, filters.taskStatus, filters.byUser, selectedHour, availableTasks, shiftFilter]);

  // Matrix Data (Users x Hours)
  const matrixRows: UserMatrixRow[] = useMemo(() => {
    const userMap: Record<string, number[]> = {};

    filteredRecords.forEach((r) => {
      if (!userMap[r.byUser]) {
        userMap[r.byUser] = Array(24).fill(0);
      }
      userMap[r.byUser][r.completionHour] += 1;
    });

    const totalAll = filteredRecords.length || 1;

    const rows: UserMatrixRow[] = Object.entries(userMap).map(([user, hourlyCounts]) => {
      const total = hourlyCounts.reduce((a, b) => a + b, 0);
      return {
        user,
        hourlyCounts,
        total,
        percentage: (total / totalAll) * 100,
        rank: 0,
      };
    });

    // Sort descending by total
    rows.sort((a, b) => b.total - a.total);
    rows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return rows;
  }, [filteredRecords]);

  // Peak hour per user
  const peakHourByUser = useMemo(() => {
    const map: Record<string, { hour: number; count: number }> = {};
    matrixRows.forEach((r) => {
      let maxH = activeHours[0] || 8;
      let maxC = 0;
      activeHours.forEach((h) => {
        const cnt = r.hourlyCounts[h] || 0;
        if (cnt > maxC) {
          maxC = cnt;
          maxH = h;
        }
      });
      map[r.user] = { hour: maxH, count: maxC };
    });
    return map;
  }, [matrixRows, activeHours]);

  // Task distribution counts
  const taskCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      map[r.taskDescription] = (map[r.taskDescription] || 0) + 1;
    });
    return map;
  }, [filteredRecords]);

  // Handlers
  const handleUploadSuccess = (newRecords: RP20Record[], newFileName: string) => {
    setRecords(newRecords);
    setFileName(newFileName);
    const newDates = Array.from(new Set(newRecords.map((r) => r.date))).filter(Boolean).sort((a, b) => b.localeCompare(a));
    setFilters({
      selectedDate: newDates[0] || 'ALL',
      taskDescriptions: [],
      taskStatus: 'Complete',
      byUser: 'ALL',
      shift: 'ALL',
      hourRange: [0, 23],
      searchQuery: '',
    });
    setShiftFilter('ALL');
    setSelectedHour(null);
  };

  const handleResetSample = () => {
    const sample = generateSampleRP20Data();
    setRecords(sample);
    setFileName(undefined);
    setFilters({
      selectedDate: '2026-11-07',
      taskDescriptions: [],
      taskStatus: 'Complete',
      byUser: 'ALL',
      shift: 'ALL',
      hourRange: [0, 23],
      searchQuery: '',
    });
    setShiftFilter('ALL');
    setSelectedHour(null);
  };

  // Glass style modifier class
  const glassClass =
    settings.glassIntensity === 'ultra'
      ? 'backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 shadow-2xl'
      : settings.glassIntensity === 'subtle'
      ? 'backdrop-blur-md bg-white/50 dark:bg-slate-900/40'
      : '';

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden ${glassClass}`}>
      {/* Ambient Liquid Glow Orbs */}
      <div className="liquid-glow w-[500px] h-[500px] -top-40 -left-40 bg-cyan-500/20" />
      <div className="liquid-glow w-[600px] h-[600px] top-1/3 -right-48 bg-indigo-500/15" />
      <div className="liquid-glow w-[450px] h-[450px] -bottom-32 left-1/4 bg-emerald-500/15" />

      {/* Main Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onResetSample={handleResetSample}
        currentRecords={records}
        totalRecordsCount={totalLoadedCount}
        fileName={fileName}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Filter Controls Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableDates={availableDates}
          availableTasks={availableTasks}
          availableStatuses={availableStatuses}
          availableUsers={availableUsers}
          taskCounts={taskCountsForTabs}
          statusCounts={statusCounts}
          totalFilteredCount={filteredLoadedCount}
          totalRawCount={totalLoadedCount}
          shiftFilter={shiftFilter}
          onSelectShift={setShiftFilter}
        />

        {/* Selected Hour Alert / Reset filter */}
        {selectedHour !== null && (
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-300">
            <span>
              กำลังเจาะลึกเฉพาะเวลา:{' '}
              <strong className="font-mono">{String(selectedHour).padStart(2, '0')}:00 - {String(selectedHour).padStart(2, '0')}:59 น.</strong>
            </span>
            <button
              onClick={() => setSelectedHour(null)}
              className="font-semibold underline cursor-pointer hover:text-cyan-900 dark:hover:text-white"
            >
              แสดงครบทุกชั่วโมง
            </button>
          </div>
        )}

        {/* 1. KPI Cards Widget */}
        {settings.widgets.kpiCards && (
          <KPICards
            completedCount={totalCompletedCount}
            totalCount={filteredLoadedCount}
            activeUsersCount={activeUsersCount}
            peakHourLabel={peakHourObj.label}
            peakHourCount={peakHourObj.count}
            avgPerHour={avgPerHour}
            completionRate={completionRate}
            statusLabel={filters.taskStatus}
          />
        )}

        {/* 2. REQUISITE: ยอดงานเสร็จรายชั่วโมง และ กราฟแท่งแสดงยอดสะสมรายชั่วโมง อยู่คนละแถว (Separate Rows) */}
        {/* Hourly Productivity Bar Chart (Row 1) */}
        {settings.widgets.hourlyChart && (
          <div className="w-full">
            <HourlyBarChart
              hourlyStats={hourlyStats}
              activeHours={activeHours}
              peakHour={peakHourObj.hour}
              selectedHour={selectedHour}
              onSelectHour={(h) => setSelectedHour(selectedHour === h ? null : h)}
              selectedStatus={filters.taskStatus}
              selectedTasks={filters.taskDescriptions}
            />
          </div>
        )}

        {/* Hourly Cumulative Bar Chart (Row 2 - คนละแถวพร้อมตัวเลขกำกับทุกแท่ง) */}
        {settings.widgets.cumulativeChart && (
          <div className="w-full">
            <HourlyCumulativeChart
              hourlyStats={hourlyStats}
              activeHours={activeHours}
              selectedStatus={filters.taskStatus}
              selectedTasks={filters.taskDescriptions}
            />
          </div>
        )}

        {/* 3. NEW: กราฟแท่งสรุปรายวันและรายเดือน พร้อมเส้นแนวโน้ม (Daily & Monthly Bar Chart with Trendline) */}
        {settings.widgets.dailyMonthlyChart && (
          <div className="w-full">
            <DailyMonthlyChart
              records={records}
              selectedDate={filters.selectedDate}
              onSelectDate={(d) => setFilters({ ...filters, selectedDate: d })}
              selectedStatus={filters.taskStatus}
              selectedTasks={filters.taskDescriptions}
              shiftFilter={shiftFilter}
            />
          </div>
        )}

        {/* 4. NEW: กราฟแท่งจำนวนนับ Cherry Pick (Task No. แม่ vs iLPN 2115* ลูก) */}
        {settings.widgets.cherryPickWidget && (
          <div className="w-full">
            <CherryPickAnalytics
              records={records}
              activeHours={activeHours}
              selectedDate={filters.selectedDate}
              selectedStatus={filters.taskStatus}
              selectedUser={filters.byUser}
              shiftFilter={shiftFilter}
            />
          </div>
        )}

        {/* 5. NEW: ตรวจสอบความถูกต้อง iLPN (User ที่ใช้ iLPN ลูกซ้ำ > 1 ครั้ง และ ลาเบลผิดประเภท 2114*) */}
        {settings.widgets.ilpnAuditWidget && (
          <div className="w-full">
            <IlpnAuditWidget
              records={filteredRecords}
              onSelectUser={(u) => setFilters({ ...filters, byUser: u })}
            />
          </div>
        )}

        {/* 6. Top Performers & Task Distribution Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {settings.widgets.topUsers && (
            <div className="lg:col-span-2">
              <TopUserRanking
                matrixRows={matrixRows}
                selectedUser={filters.byUser}
                onSelectUser={(u) => setFilters({ ...filters, byUser: u })}
                peakHourByUser={peakHourByUser}
              />
            </div>
          )}

          {settings.widgets.taskDistribution && (
            <div className={settings.widgets.topUsers ? 'lg:col-span-1' : 'lg:col-span-3'}>
              <TaskDistributionChart
                taskCounts={taskCounts}
                selectedTasks={filters.taskDescriptions || []}
                onToggleTask={(task) => {
                  const current = filters.taskDescriptions || [];
                  let updated: string[];
                  if (current.includes(task)) {
                    updated = current.filter((t) => t !== task);
                  } else {
                    updated = [...current, task];
                  }
                  setFilters({ ...filters, taskDescriptions: updated });
                }}
                onClearTasks={() => setFilters({ ...filters, taskDescriptions: [] })}
                totalCompleted={filteredLoadedCount}
              />
            </div>
          )}
        </div>

        {/* 6. Matrix Table (พนักงาน By User × รายชั่วโมง) */}
        {settings.widgets.matrixTable && (
          <MatrixTable
            matrixRows={matrixRows}
            activeHours={activeHours}
            selectedUser={filters.byUser}
            onSelectUser={(u) => setFilters({ ...filters, byUser: u })}
            onCellClick={(user, hour) => {
              setFilters({ ...filters, byUser: user });
              setSelectedHour(hour);
            }}
          />
        )}

        {/* 7. Raw Data Ledger Table */}
        {settings.widgets.rawDataTable && (
          <RawDataTable records={filteredRecords} />
        )}
      </main>

      {/* Live Excel Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        sampleRecords={records}
      />

      {/* Real-time Widget Customizer Modal */}
      <WidgetCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </div>
  );
}
