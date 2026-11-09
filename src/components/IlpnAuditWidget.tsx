import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Copy,
  Users,
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { RP20Record, DuplicateIlpnEntry, UserDuplicateIlpnStat, WrongTypeLabelRecord, UserWrongLabelStat } from '../types';
import { isWrongTypeLabel } from '../utils/sampleData';

interface IlpnAuditWidgetProps {
  records: RP20Record[];
  onSelectUser?: (user: string) => void;
}

export const IlpnAuditWidget: React.FC<IlpnAuditWidgetProps> = ({ records, onSelectUser }) => {
  const [activeTab, setActiveTab] = useState<'duplicate' | 'wrong-2114'>('duplicate');
  const [subView, setSubView] = useState<'by-user' | 'by-ilpn'>('by-user');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // 1. Audit Duplicate Child iLPNs (iLPN ที่ถูกสแกน/ใช้มากกว่า 1 ครั้ง)
  const duplicateAudit = useMemo(() => {
    // Map iLPN -> Array of records
    const ilpnMap = new Map<string, RP20Record[]>();

    records.forEach((r) => {
      const ilpn = String(r.ilpn || '').trim();
      // Only audit valid child label strings (length >= 5 and not empty)
      if (!ilpn || ilpn === '-' || ilpn.toLowerCase() === 'null') return;

      if (!ilpnMap.has(ilpn)) {
        ilpnMap.set(ilpn, []);
      }
      ilpnMap.get(ilpn)!.push(r);
    });

    // Filter only those scanned > 1 time
    const duplicateList: DuplicateIlpnEntry[] = [];
    ilpnMap.forEach((recs, ilpn) => {
      if (recs.length > 1) {
        const uniqueUsers = Array.from(new Set(recs.map((r) => r.byUser)));
        duplicateList.push({
          ilpn,
          count: recs.length,
          users: uniqueUsers,
          tasks: recs.map((r) => ({
            id: r.id,
            taskNo: r.taskNo,
            byUser: r.byUser,
            completionTime: r.completionTime,
            date: r.date,
            taskDescription: r.taskDescription,
            taskStatus: r.taskStatus,
          })),
        });
      }
    });

    // Sort by most duplicated first
    duplicateList.sort((a, b) => b.count - a.count);

    // Group duplicate iLPNs by User
    const userMap = new Map<string, { ilpns: Map<string, RP20Record[]> }>();

    duplicateList.forEach((entry) => {
      entry.tasks.forEach((t) => {
        const u = t.byUser;
        if (!userMap.has(u)) {
          userMap.set(u, { ilpns: new Map() });
        }
        const userObj = userMap.get(u)!;
        if (!userObj.ilpns.has(entry.ilpn)) {
          userObj.ilpns.set(entry.ilpn, []);
        }
        // reconstruct record reference
        userObj.ilpns.get(entry.ilpn)!.push({
          id: t.id,
          taskNo: t.taskNo,
          ilpn: entry.ilpn,
          taskDescription: t.taskDescription,
          taskStatus: t.taskStatus,
          byUser: t.byUser,
          completionTime: t.completionTime,
          completionHour: 8,
          date: t.date,
        });
      });
    });

    const userStats: UserDuplicateIlpnStat[] = [];
    userMap.forEach((val, user) => {
      let totalDuplicateScans = 0;
      const items: Array<{
        ilpn: string;
        timesUsed: number;
        tasks: Array<{ id: string; taskNo?: string; time: string; date: string; taskDescription: string }>;
      }> = [];

      val.ilpns.forEach((recs, ilpn) => {
        totalDuplicateScans += recs.length;
        items.push({
          ilpn,
          timesUsed: recs.length,
          tasks: recs.map((r) => ({
            id: r.id,
            taskNo: r.taskNo,
            time: r.completionTime,
            date: r.date,
            taskDescription: r.taskDescription,
          })),
        });
      });

      // Sort items by timesUsed desc
      items.sort((a, b) => b.timesUsed - a.timesUsed);

      userStats.push({
        user,
        duplicateIlpnCount: items.length,
        totalDuplicateScans,
        items,
      });
    });

    // Sort users by duplicate iLPN count desc
    userStats.sort((a, b) => b.duplicateIlpnCount - a.duplicateIlpnCount || b.totalDuplicateScans - a.totalDuplicateScans);

    return {
      duplicateList,
      userStats,
      totalDuplicateIlpns: duplicateList.length,
      totalUsersWithDuplicates: userStats.length,
      maxDuplicateTimes: duplicateList.length > 0 ? duplicateList[0].count : 0,
    };
  }, [records]);

  // 2. Audit Wrong Label Type: iLPN starting with 2114
  const wrongTypeAudit = useMemo(() => {
    const wrongRecords: WrongTypeLabelRecord[] = [];
    const userMap = new Map<string, WrongTypeLabelRecord[]>();

    records.forEach((r) => {
      const ilpn = String(r.ilpn || '').trim();
      if (isWrongTypeLabel(ilpn)) {
        const item: WrongTypeLabelRecord = {
          id: r.id,
          taskNo: r.taskNo,
          ilpn,
          byUser: r.byUser,
          taskDescription: r.taskDescription,
          taskStatus: r.taskStatus,
          completionTime: r.completionTime,
          date: r.date,
          hour: r.completionHour,
        };
        wrongRecords.push(item);

        if (!userMap.has(r.byUser)) {
          userMap.set(r.byUser, []);
        }
        userMap.get(r.byUser)!.push(item);
      }
    });

    const userStats: UserWrongLabelStat[] = [];
    userMap.forEach((recs, user) => {
      userStats.push({
        user,
        count2114: recs.length,
        records: recs,
      });
    });

    userStats.sort((a, b) => b.count2114 - a.count2114);

    return {
      wrongRecords,
      userStats,
      totalWrongCount: wrongRecords.length,
      totalUsersWithWrong: userStats.length,
    };
  }, [records]);

  // Toggle user row expansion
  const toggleUserExpand = (user: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [user]: !prev[user],
    }));
  };

  // Filtered User Duplicate Stats by Search
  const filteredUserStats = useMemo(() => {
    if (!searchQuery) return duplicateAudit.userStats;
    const q = searchQuery.toLowerCase();
    return duplicateAudit.userStats.filter((u) => {
      const nameMatch = u.user.toLowerCase().includes(q);
      const ilpnMatch = u.items.some((item) => item.ilpn.toLowerCase().includes(q));
      return nameMatch || ilpnMatch;
    });
  }, [duplicateAudit.userStats, searchQuery]);

  // Filtered Duplicate iLPN List by Search
  const filteredDuplicateList = useMemo(() => {
    if (!searchQuery) return duplicateAudit.duplicateList;
    const q = searchQuery.toLowerCase();
    return duplicateAudit.duplicateList.filter((d) => {
      const ilpnMatch = d.ilpn.toLowerCase().includes(q);
      const userMatch = d.users.some((u) => u.toLowerCase().includes(q));
      return ilpnMatch || userMatch;
    });
  }, [duplicateAudit.duplicateList, searchQuery]);

  // Filtered 2114 Records by Search
  const filteredWrongRecords = useMemo(() => {
    if (!searchQuery) return wrongTypeAudit.wrongRecords;
    const q = searchQuery.toLowerCase();
    return wrongTypeAudit.wrongRecords.filter((r) => {
      return (
        r.ilpn.toLowerCase().includes(q) ||
        r.byUser.toLowerCase().includes(q) ||
        (r.taskNo && r.taskNo.toLowerCase().includes(q)) ||
        r.taskDescription.toLowerCase().includes(q)
      );
    });
  }, [wrongTypeAudit.wrongRecords, searchQuery]);

  // Export report to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'duplicate') {
      csvContent += 'User,iLPN (Child Label),Times Used,Task No.,Completion Time,Date,Task Description,Task Status\r\n';
      duplicateAudit.duplicateList.forEach((entry) => {
        entry.tasks.forEach((t) => {
          csvContent += `"${t.byUser}","${entry.ilpn}",${entry.count},"${t.taskNo || ''}","${t.completionTime}","${t.date}","${t.taskDescription}","${t.taskStatus}"\r\n`;
        });
      });
    } else {
      csvContent += 'User,Wrong iLPN (Prefix 2114),Task No.,Completion Time,Date,Task Description,Task Status\r\n';
      wrongTypeAudit.wrongRecords.forEach((r) => {
        csvContent += `"${r.byUser}","${r.ilpn}","${r.taskNo || ''}","${r.completionTime}","${r.date}","${r.taskDescription}","${r.taskStatus}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Audit_${activeTab === 'duplicate' ? 'Duplicate_iLPN' : 'Wrong_Type_2114'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel glass-specular rounded-2xl p-4 sm:p-5 transition-all space-y-4">
      {/* 1. Header with Badge & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 dark:border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>ตรวจสอบความถูกต้อง iLPN & ตรวจจับข้อผิดพลาด (iLPN Audit)</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ตรวจจับ <strong>User ที่ใช้ iLPN ลูกซ้ำมากกว่า 1 ครั้ง</strong> และ <strong>การสแกนลาเบลผิดประเภท (ขึ้นต้นด้วย 2114*)</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleExportCSV}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title="ส่งออกรายงานความผิดปกตินี้เป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-500" />
            <span>ดาวน์โหลดรายงาน CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Users with Duplicate iLPNs */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
            <span>User ที่ใช้ iLPN ซ้ำ</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {duplicateAudit.totalUsersWithDuplicates.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            สแกน iLPN ลูกลูกเดิม &gt; 1 ครั้ง
          </div>
        </div>

        {/* Card 2: Total Duplicate iLPN codes */}
        <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-700 dark:text-purple-300">
            <span>iLPN ที่ถูกใช้ซ้ำทั้งหมด</span>
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-purple-600 dark:text-purple-300 mt-1">
            {duplicateAudit.totalDuplicateIlpns.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            พบซ้ำสูงสุด {duplicateAudit.maxDuplicateTimes} ครั้ง/iLPN
          </div>
        </div>

        {/* Card 3: Wrong Type Label (2114*) */}
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-700 dark:text-rose-300">
            <span>ลาเบลผิดประเภท (2114*)</span>
            <XCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {wrongTypeAudit.totalWrongCount.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">ชิ้น</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            iLPN ที่ขึ้นต้นด้วย 2114 แทน 2115
          </div>
        </div>

        {/* Card 4: Users using 2114* */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span>User ที่สแกน 2114*</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {wrongTypeAudit.totalUsersWithWrong.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">คน</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            พนักงานที่พบข้อผิดพลาดลาเบล 2114
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Tab Strip & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('duplicate')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'duplicate'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>User ที่ใช้ iLPN ซ้ำ (&gt; 1 ครั้ง)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-black/20 text-white font-bold ml-1">
              {duplicateAudit.totalUsersWithDuplicates}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('wrong-2114')}
            className={`px-3 py-1.5 font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'wrong-2114'
                ? 'bg-rose-500 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>ลาเบลผิดประเภท (ขึ้นต้น 2114*)</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-black/20 text-white font-bold ml-1">
              {wrongTypeAudit.totalWrongCount}
            </span>
          </button>
        </div>

        {/* Search input & Sub-view Switch */}
        <div className="flex items-center gap-2">
          {activeTab === 'duplicate' && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs">
              <button
                onClick={() => setSubView('by-user')}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  subView === 'by-user'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                ดูตามพนักงาน
              </button>
              <button
                onClick={() => setSubView('by-ilpn')}
                className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                  subView === 'by-ilpn'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                ดูตามรหัส iLPN
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'duplicate' ? 'ค้นหาชื่อ User หรือ iLPN...' : 'ค้นหา User, iLPN 2114...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* 4. TAB 1 CONTENT: User ที่ใช้ iLPN ลูกมากกว่า 1 ครั้ง */}
      {activeTab === 'duplicate' && (
        <div className="space-y-3">
          {duplicateAudit.totalUsersWithDuplicates === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                ไม่พบการใช้ iLPN ลูกซ้ำ
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ทุก iLPN ถูกสแกนและใช้งานอย่างถูกต้องเพียง 1 ครั้งเท่านั้น
              </p>
            </div>
          ) : subView === 'by-user' ? (
            /* By User Accordion Cards */
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredUserStats.map((u) => {
                const isExpanded = !!expandedUsers[u.user];

                return (
                  <div
                    key={u.user}
                    className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 transition-all hover:border-amber-500/30"
                  >
                    {/* User Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleUserExpand(u.user)}
                          className="p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-amber-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                              {u.user}
                            </span>
                            {onSelectUser && (
                              <button
                                onClick={() => onSelectUser(u.user)}
                                className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                title="กรองดูเฉพาะพนักงานคนนี้"
                              >
                                <span>กรองดู</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>
                              ใช้ iLPN ซ้ำ:{' '}
                              <strong className="text-amber-600 dark:text-amber-400 font-mono font-bold">
                                {u.duplicateIlpnCount}
                              </strong>{' '}
                              รหัส
                            </span>
                            <span>·</span>
                            <span>
                              รวมสแกนซ้ำ:{' '}
                              <strong className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                                {u.totalDuplicateScans}
                              </strong>{' '}
                              ครั้ง
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Badge */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          ใช้ซ้ำ {u.duplicateIlpnCount} รหัส
                        </span>
                        <button
                          onClick={() => toggleUserExpand(u.user)}
                          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer underline text-[11px]"
                        >
                          {isExpanded ? 'ย่อรายละเอียด' : 'ดู iLPN ทั้งหมด'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail Table */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/5 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          รายการ iLPN ที่ {u.user} นำมาใช้ซ้ำ:
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-200/70 dark:border-white/5">
                          <table className="w-full text-left text-[11px] font-mono tabular-nums border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px]">
                              <tr>
                                <th className="py-1.5 px-2.5">iLPN ลูก</th>
                                <th className="py-1.5 px-2.5 text-center">จำนวนครั้งที่ใช้</th>
                                <th className="py-1.5 px-2.5">รหัสงาน Task No. ที่ใช้ซ้ำ</th>
                                <th className="py-1.5 px-2.5">เวลาที่อัปเดต</th>
                                <th className="py-1.5 px-2.5 font-sans">ประเภทงาน</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white/40 dark:bg-slate-900/40">
                              {u.items.map((item) => (
                                <tr key={item.ilpn} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                                  <td className="py-1.5 px-2.5 font-bold text-amber-600 dark:text-amber-400">
                                    {item.ilpn}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-center">
                                    <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                      {item.timesUsed} ครั้ง
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2.5 text-purple-600 dark:text-purple-300 font-semibold">
                                    {item.tasks.map((t) => t.taskNo || t.id).join(', ')}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-slate-400">
                                    {item.tasks.map((t) => t.time).join(' | ')}
                                  </td>
                                  <td className="py-1.5 px-2.5 font-sans text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                    {item.tasks[0]?.taskDescription || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* By iLPN Code Flat Table */
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 max-h-[480px]">
              <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3">iLPN ลูก (ที่ใช้ซ้ำ)</th>
                    <th className="py-2 px-3 text-center">จำนวนครั้งที่ใช้</th>
                    <th className="py-2 px-3 font-sans">พนักงานที่ใช้ (Users)</th>
                    <th className="py-2 px-3">Task No. ที่เกี่ยวข้อง</th>
                    <th className="py-2 px-3">เวลาเสร็จสิ้น</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredDuplicateList.map((d) => (
                    <tr key={d.ilpn} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">
                        {d.ilpn}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          {d.count} ครั้ง
                        </span>
                      </td>
                      <td className="py-2 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {d.users.join(', ')}
                      </td>
                      <td className="py-2 px-3 text-purple-600 dark:text-purple-300 font-semibold">
                        {d.tasks.map((t) => t.taskNo || t.id).join(', ')}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {d.tasks.map((t) => t.completionTime).join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 2 CONTENT: ลาเบลผิดประเภทที่ขึ้นต้นด้วย 2114 */}
      {activeTab === 'wrong-2114' && (
        <div className="space-y-3">
          {wrongTypeAudit.totalWrongCount === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                ไม่พบลาเบลผิดประเภท (2114*)
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ทุกลาเบลลูกขึ้นต้นด้วย 2115 อย่างถูกต้องสมบูรณ์ ไม่มีข้อผิดพลาดลาเบล 2114
              </p>
            </div>
          ) : (
            <div>
              {/* Summary of users who made 2114 mistakes */}
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                    สรุปพนักงานที่สแกนลาเบลผิดประเภท (ขึ้นต้น 2114 แทนที่จะเป็น 2115):
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {wrongTypeAudit.userStats.map((u) => (
                    <span
                      key={u.user}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1"
                    >
                      <span>{u.user.split(' ')[0]}</span>
                      <strong className="text-slate-900 dark:text-white">({u.count2114})</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 max-h-[440px]">
                <table className="w-full text-left text-xs font-mono tabular-nums border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-3 text-rose-500 font-bold">iLPN ผิดประเภท (2114*)</th>
                      <th className="py-2 px-3 font-sans">พนักงาน (By User)</th>
                      <th className="py-2 px-3">Task No. (แม่)</th>
                      <th className="py-2 px-3 font-sans">หัวข้องาน</th>
                      <th className="py-2 px-3 text-center">เวลาเสร็จสิ้น</th>
                      <th className="py-2 px-3 text-center">วันที่</th>
                      <th className="py-2 px-3 text-right font-sans">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredWrongRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors">
                        <td className="py-2 px-3 font-bold text-rose-600 dark:text-rose-400">
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30">
                            {r.ilpn}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">
                          {r.byUser}
                        </td>
                        <td className="py-2 px-3 text-purple-600 dark:text-purple-300 font-bold">
                          {r.taskNo || r.id}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {r.taskDescription}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400">
                          {r.completionTime}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-500 dark:text-slate-400">
                          {r.date}
                        </td>
                        <td className="py-2 px-3 text-right font-sans">
                          <span className="text-emerald-500 font-semibold">{r.taskStatus}</span>
                        </td>
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
  );
};
