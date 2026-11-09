export interface RP20Record {
  id: string;
  taskNo?: string; // Task No. (ลาเบลแม่)
  ilpn?: string; // iLPN (ลาเบลลูก ที่ขึ้นต้นด้วย 2115)
  taskDescription: string;
  taskStatus: string; // e.g. "Complete", "In Progress", "Pending", "Cancelled"
  byUser: string;
  completionTime: string; // "HH:mm:ss" or ISO
  completionHour: number; // 0 - 23
  date: string; // "YYYY-MM-DD"
  latestTaskUpdateDate?: string; // Latest Task Update Date
  rawRow?: Record<string, any>;
}

export interface ColumnMapping {
  taskDescription: string;
  taskStatus: string;
  byUser: string;
  completionTime: string; // Latest Task Update Date / Time
  date?: string;
  taskNo?: string;
  ilpn?: string;
  latestTaskUpdateDate?: string;
}

export type ShiftFilter = 'ALL' | 'MORNING' | 'NIGHT'; // MORNING: 05:00-17:00, NIGHT: 18:00-04:00

export interface FilterState {
  selectedDate: string; // 'ALL' or specific 'YYYY-MM-DD'
  taskDescriptions: string[]; // empty means all, or array of selected task descriptions
  taskStatus: string; // 'Complete' (default) or 'ALL' or specific
  byUser: string; // 'ALL' or specific user
  shift: ShiftFilter; // 'ALL', 'MORNING', 'NIGHT'
  hourRange: [number, number]; // [0, 23]
  searchQuery: string;
}

export interface HourlyStat {
  hour: number;
  label: string; // "00:00", "01:00", ...
  count: number;
  cumulativeCount: number;
  userBreakdown: Record<string, number>;
  taskBreakdown: Record<string, number>;
}

export interface DailyStat {
  date: string; // "YYYY-MM-DD"
  displayDate: string; // "05 พ.ย." or formatted
  count: number;
  morningCount: number;
  nightCount: number;
  trendValue: number; // linear trend value
}

export interface MonthlyStat {
  month: string; // "2026-11"
  displayMonth: string; // "พ.ย. 2026"
  count: number;
  avgPerDay: number;
  trendValue: number; // linear trend value
}

export interface CherryPickStat {
  groupKey: string; // Hour label or User name or Task name
  parentCount: number; // ลาเบลแม่ (Task No.)
  childCount: number; // ลาเบลลูก (iLPN ขึ้นต้นด้วย 2115)
  ratio: number; // child / parent
}

export interface UserMatrixRow {
  user: string;
  hourlyCounts: number[]; // 24 numbers for 0..23
  total: number;
  percentage: number;
  rank: number;
}

export interface WidgetVisibility {
  kpiCards: boolean;
  hourlyChart: boolean;
  cumulativeChart: boolean;
  dailyMonthlyChart: boolean;
  cherryPickWidget: boolean;
  ilpnAuditWidget: boolean;
  topUsers: boolean;
  taskDistribution: boolean;
  matrixTable: boolean;
  rawDataTable: boolean;
}

export interface DuplicateIlpnEntry {
  ilpn: string;
  count: number;
  users: string[];
  tasks: Array<{
    id: string;
    taskNo?: string;
    byUser: string;
    completionTime: string;
    date: string;
    taskDescription: string;
    taskStatus: string;
  }>;
}

export interface UserDuplicateIlpnStat {
  user: string;
  duplicateIlpnCount: number;
  totalDuplicateScans: number;
  items: Array<{
    ilpn: string;
    timesUsed: number;
    tasks: Array<{ id: string; taskNo?: string; time: string; date: string; taskDescription: string }>;
  }>;
}

export interface WrongTypeLabelRecord {
  id: string;
  taskNo?: string;
  ilpn: string;
  byUser: string;
  taskDescription: string;
  taskStatus: string;
  completionTime: string;
  date: string;
  hour: number;
}

export interface UserWrongLabelStat {
  user: string;
  count2114: number;
  records: WrongTypeLabelRecord[];
}

export type GlassIntensity = 'subtle' | 'standard' | 'ultra';

export interface DashboardSettings {
  widgets: WidgetVisibility;
  glassIntensity: GlassIntensity;
  showShiftOnly: boolean; // 08:00 - 18:00 or full 24h (legacy support)
  autoRefreshSample: boolean;
}

