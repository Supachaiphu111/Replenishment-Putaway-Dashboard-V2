import * as XLSX from 'xlsx';
import { RP20Record, ColumnMapping, UserMatrixRow } from '../types';

/**
 * Normalizes header string for fuzzy matching
 */
function normalizeKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
}

/**
 * Detects the most suitable column mapping from a list of header keys
 */
export function detectColumnMapping(headers: string[]): ColumnMapping {
  let taskDescription = '';
  let taskStatus = '';
  let byUser = '';
  let completionTime = '';
  let date = '';
  let taskNo = '';
  let ilpn = '';
  let latestTaskUpdateDate = '';

  for (const h of headers) {
    const norm = normalizeKey(h);

    // Task No detection (ลาเบลแม่)
    if (!taskNo) {
      if (
        norm.includes('taskno') ||
        norm.includes('tasknum') ||
        norm.includes('taskid') ||
        norm === 'task' ||
        norm.includes('เลขที่งาน') ||
        norm.includes('รหัสงาน')
      ) {
        taskNo = h;
      }
    }

    // iLPN detection (ลาเบลลูก ที่ขึ้นต้นด้วย 2115)
    if (!ilpn) {
      if (
        norm.includes('ilpn') ||
        norm === 'lpn' ||
        norm.includes('carton') ||
        norm.includes('pallet') ||
        norm.includes('ลาเบล') ||
        norm.includes('label')
      ) {
        ilpn = h;
      }
    }

    // Task Description / Item Description detection
    if (!taskDescription) {
      if (
        norm.includes('itemdesc') ||
        norm.includes('itemdescription') ||
        norm.includes('taskdesc') ||
        norm.includes('description') ||
        norm.includes('tasktype') ||
        norm.includes('activity') ||
        norm.includes('item') ||
        norm.includes('หัวข้อ') ||
        norm.includes('รายละเอียด') ||
        norm.includes('ชื่อรายการ')
      ) {
        taskDescription = h;
      }
    }

    // Task Status detection
    if (!taskStatus) {
      if (
        norm.includes('taskstatus') ||
        norm.includes('status') ||
        norm.includes('state') ||
        norm.includes('สถานะ')
      ) {
        taskStatus = h;
      }
    }

    // By User detection
    if (!byUser) {
      if (
        norm.includes('byuser') ||
        norm.includes('user') ||
        norm.includes('completedby') ||
        norm.includes('operator') ||
        norm.includes('employee') ||
        norm.includes('staff') ||
        norm.includes('พนักงาน') ||
        norm.includes('ผู้ปฏิบัติงาน') ||
        norm.includes('ผู้ทำ')
      ) {
        byUser = h;
      }
    }

    // Latest Task Update Date / Completion Time detection (Highest priority as requested by user)
    if (!latestTaskUpdateDate) {
      if (
        norm.includes('latesttaskupdatedate') ||
        norm.includes('latesttaskupdate') ||
        norm.includes('latestupdate') ||
        norm.includes('taskupdatedate') ||
        norm.includes('updatedate') ||
        norm.includes('lastupdate')
      ) {
        latestTaskUpdateDate = h;
        completionTime = h;
      }
    }

    // Completion Time fallback detection
    if (!completionTime) {
      if (
        norm.includes('latesttaskupdatedate') ||
        norm.includes('latesttaskupdate') ||
        norm.includes('completiontime') ||
        norm.includes('completetime') ||
        norm.includes('endtime') ||
        norm.includes('finishtime') ||
        norm.includes('closedtime') ||
        norm.includes('timestamp') ||
        norm.includes('time') ||
        norm.includes('datetime') ||
        norm.includes('เวลา')
      ) {
        completionTime = h;
      }
    }

    // Date detection
    if (!date) {
      if (
        norm.includes('date') ||
        norm.includes('วันที่') ||
        norm.includes('taskdate')
      ) {
        date = h;
      }
    }
  }

  // Fallbacks if not detected
  if (!taskDescription && headers.length > 0) taskDescription = headers[0];
  if (!taskStatus && headers.length > 1) taskStatus = headers[1];
  if (!byUser && headers.length > 2) byUser = headers[2];
  return { taskDescription, taskStatus, byUser, completionTime, date, taskNo, ilpn, latestTaskUpdateDate };
}

/**
 * Extracts hour (0-23) and formatted date from various value types
 */
function parseTimeAndDate(val: any, fallbackDateVal?: any): { hour: number; timeStr: string; dateStr: string } {
  let hour = 8;
  let timeStr = '08:00:00';
  let dateStr = new Date().toISOString().split('T')[0];

  if (fallbackDateVal) {
    if (fallbackDateVal instanceof Date && !isNaN(fallbackDateVal.getTime())) {
      dateStr = fallbackDateVal.toISOString().split('T')[0];
    } else {
      const parsed = String(fallbackDateVal).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(parsed)) {
        dateStr = parsed.slice(0, 10);
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(parsed)) {
        const parts = parsed.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].slice(0, 4);
        dateStr = `${year}-${month}-${day}`;
      }
    }
  }

  if (val instanceof Date && !isNaN(val.getTime())) {
    hour = val.getHours();
    const h = String(hour).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    const s = String(val.getSeconds()).padStart(2, '0');
    timeStr = `${h}:${m}:${s}`;
    if (!fallbackDateVal) {
      dateStr = val.toISOString().split('T')[0];
    }
    return { hour, timeStr, dateStr };
  }

  if (typeof val === 'number') {
    // If it's an Excel fractional day serial (e.g. 0.5 = 12:00 PM)
    if (val >= 0 && val < 1) {
      const totalSeconds = Math.round(val * 86400);
      hour = Math.floor(totalSeconds / 3600) % 24;
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      timeStr = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return { hour, timeStr, dateStr };
    } else if (val >= 1) {
      // Full Excel serial date with time (e.g. 45200.6)
      const parsedDate = new Date((val - (25567 + 2)) * 86400 * 1000);
      if (!isNaN(parsedDate.getTime())) {
        hour = parsedDate.getHours();
        timeStr = parsedDate.toTimeString().split(' ')[0];
        if (!fallbackDateVal) {
          dateStr = parsedDate.toISOString().split('T')[0];
        }
        return { hour, timeStr, dateStr };
      }
    }
  }

  const str = String(val || '').trim();

  // Try matching time formats: HH:mm:ss or HH:mm
  const timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10) % 24;
    const min = timeMatch[2];
    const sec = timeMatch[3] || '00';
    timeStr = `${String(hour).padStart(2, '0')}:${min}:${sec}`;
  }

  // Check if string also has a date
  const isoDateMatch = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoDateMatch && !fallbackDateVal) {
    dateStr = `${isoDateMatch[1]}-${isoDateMatch[2].padStart(2, '0')}-${isoDateMatch[3].padStart(2, '0')}`;
  } else {
    const slashDateMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashDateMatch && !fallbackDateVal) {
      dateStr = `${slashDateMatch[3]}-${slashDateMatch[2].padStart(2, '0')}-${slashDateMatch[1].padStart(2, '0')}`;
    }
  }

  return { hour, timeStr, dateStr };
}

/**
 * Parses an Excel or CSV file buffer and returns parsed RP20 records
 */
export function parseExcelFile(
  buffer: ArrayBuffer,
  customMapping?: Partial<ColumnMapping>
): { records: RP20Record[]; detectedMapping: ColumnMapping; sheetNames: string[]; totalRows: number } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  if (sheetNames.length === 0) {
    throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel นี้');
  }

  const firstSheet = workbook.Sheets[sheetNames[0]];
  const rawJson: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '', raw: false });

  if (rawJson.length === 0) {
    throw new Error('ไฟล์ว่างเปล่า ไม่มีข้อมูลในตาราง');
  }

  const sampleRow = rawJson[0];
  const headers = Object.keys(sampleRow);
  const detected = detectColumnMapping(headers);

  const mapping: ColumnMapping = {
    taskDescription: customMapping?.taskDescription || detected.taskDescription,
    taskStatus: customMapping?.taskStatus || detected.taskStatus,
    byUser: customMapping?.byUser || detected.byUser,
    completionTime: customMapping?.completionTime || detected.completionTime,
    date: customMapping?.date || detected.date,
    taskNo: customMapping?.taskNo || detected.taskNo,
    ilpn: customMapping?.ilpn || detected.ilpn,
    latestTaskUpdateDate: customMapping?.latestTaskUpdateDate || detected.latestTaskUpdateDate,
  };

  const records: RP20Record[] = [];

  rawJson.forEach((row, index) => {
    const rawDesc = String(row[mapping.taskDescription] || 'Unassigned Task').trim();
    const rawStatus = String(row[mapping.taskStatus] || 'Complete').trim();
    const rawUser = String(row[mapping.byUser] || 'Unknown User').trim();
    const rawTime = (mapping.latestTaskUpdateDate && row[mapping.latestTaskUpdateDate]) || row[mapping.completionTime];
    const rawDate = mapping.date ? row[mapping.date] : undefined;
    const rawTaskNo = mapping.taskNo ? String(row[mapping.taskNo] || '').trim() : undefined;
    const rawIlpn = mapping.ilpn ? String(row[mapping.ilpn] || '').trim() : undefined;

    const { hour, timeStr, dateStr } = parseTimeAndDate(rawTime, rawDate);

    records.push({
      id: `EXCEL-${index + 1}`,
      taskNo: rawTaskNo || `TSK-${index + 1}`,
      ilpn: rawIlpn || (row['iLPN'] ? String(row['iLPN']) : undefined),
      taskDescription: rawDesc || 'General Task',
      taskStatus: rawStatus || 'Complete',
      byUser: rawUser || 'General User',
      completionTime: timeStr,
      completionHour: hour,
      date: dateStr,
      latestTaskUpdateDate: String(rawTime || timeStr),
      rawRow: row,
    });
  });

  return {
    records,
    detectedMapping: mapping,
    sheetNames,
    totalRows: rawJson.length,
  };
}

/**
 * Downloads a sample RP20 Excel file (.xlsx) prefilled with sample records
 */
export function downloadSampleRP20Excel(records: RP20Record[]) {
  const dataForExcel = records.map((r, i) => ({
    'Task ID': r.id || `RP20-${1000 + i}`,
    'Task No.': r.taskNo || `TSK-${4000 + i}`,
    'iLPN': r.ilpn || `2115${Math.floor(100000 + Math.random() * 900000)}`,
    'Task Description': r.taskDescription,
    'Task Status': r.taskStatus,
    'By User': r.byUser,
    'Latest Task Update Date': `${r.date} ${r.completionTime}`,
    'Date': r.date,
    'Time Only': r.completionTime,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 38 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'RP20_Productivity');

  XLSX.writeFile(workbook, `RP20_Productivity_Sample_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Exports Matrix data to CSV format
 */
export function exportMatrixToCSV(matrixRows: UserMatrixRow[], hours: number[] = Array.from({ length: 24 }, (_, i) => i)) {
  const headers = ['By User', ...hours.map((h) => `${String(h).padStart(2, '0')}:00`), 'Total Completed', 'Share %'];

  const rows = matrixRows.map((r) => {
    return [
      `"${r.user.replace(/"/g, '""')}"`,
      ...hours.map((h) => r.hourlyCounts[h] || 0),
      r.total,
      `${r.percentage.toFixed(1)}%`,
    ].join(',');
  });

  // Add column totals summary row
  const columnTotals = hours.map((h) => matrixRows.reduce((sum, r) => sum + (r.hourlyCounts[h] || 0), 0));
  const grandTotal = matrixRows.reduce((sum, r) => sum + r.total, 0);
  const totalRow = ['"TOTAL (ALL USERS)"', ...columnTotals, grandTotal, '100.0%'].join(',');

  const csvContent = '\uFEFF' + [headers.join(','), ...rows, totalRow].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `RP20_Matrix_Hourly_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports Matrix data to Excel format (.xlsx)
 */
export function exportMatrixToExcel(matrixRows: UserMatrixRow[], hours: number[] = Array.from({ length: 24 }, (_, i) => i)) {
  const data = matrixRows.map((r) => {
    const rowObj: Record<string, any> = { 'By User': r.user };
    hours.forEach((h) => {
      rowObj[`${String(h).padStart(2, '0')}:00`] = r.hourlyCounts[h] || 0;
    });
    rowObj['Total Completed'] = r.total;
    rowObj['Share %'] = `${r.percentage.toFixed(1)}%`;
    return rowObj;
  });

  // Grand total row
  const totalObj: Record<string, any> = { 'By User': 'TOTAL (ALL USERS)' };
  hours.forEach((h) => {
    totalObj[`${String(h).padStart(2, '0')}:00`] = matrixRows.reduce((sum, r) => sum + (r.hourlyCounts[h] || 0), 0);
  });
  totalObj['Total Completed'] = matrixRows.reduce((sum, r) => sum + r.total, 0);
  totalObj['Share %'] = '100.0%';
  data.push(totalObj);

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hourly_Matrix');
  XLSX.writeFile(wb, `RP20_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
}
