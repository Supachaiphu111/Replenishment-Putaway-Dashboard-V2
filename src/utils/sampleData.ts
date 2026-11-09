import { RP20Record } from '../types';

export const SAMPLE_TASK_DESCRIPTIONS = [
  'Replenish Active Cherry  Pick  Prty 40',
  'Replenish Active Cherry  Pick  Prty 50',
  'Order Picking (Piece Pick)',
  'Batch Pick & Sorting',
  'Bulk Replenishment',
  'Inbound Putaway',
  'Pack & Shipping Label',
  'Cycle Count & Audit',
];

export const SAMPLE_USERS = [
  'Somchai K. (EMP-101)',
  'Wichai P. (EMP-102)',
  'Nattaporn S. (EMP-103)',
  'Anan T. (EMP-104)',
  'Jiraporn M. (EMP-105)',
  'Kittisak B. (EMP-106)',
  'Supaporn W. (EMP-107)',
  'Prasert C. (EMP-108)',
];

export const STATUS_OPTIONS = ['Complete', 'In Progress', 'Pending', 'Cancelled'];

/**
 * Checks if task description is Cherry Pick
 */
export function isCherryPickTask(taskDesc: string): boolean {
  const norm = taskDesc.toLowerCase().replace(/\s+/g, ' ');
  return (
    norm.includes('cherry pick prty 40') ||
    norm.includes('cherry pick prty 50') ||
    (norm.includes('cherry') && norm.includes('pick'))
  );
}

/**
 * Checks if hour belongs to Morning Shift (05:00 - 17:00)
 */
export function isMorningShift(hour: number): boolean {
  return hour >= 5 && hour <= 17;
}

/**
 * Checks if hour belongs to Night Shift (18:00 - 04:00)
 */
export function isNightShift(hour: number): boolean {
  return hour >= 18 || hour <= 4;
}

/**
 * Checks if label is wrong type (starts with 2114 instead of standard 2115)
 */
export function isWrongTypeLabel(ilpn?: string): boolean {
  return String(ilpn || '').trim().startsWith('2114');
}

/**
 * Checks if label is an audited child iLPN for duplicate detection:
 * Must start with 2115, and explicitly excludes labels starting with 125.
 * "ลาเบลซ้ำกันมากกว่า1 ครั้ง ให้ดึงที่ขึ้นตันด้วย 2115 ตัดที่ขึ้น125 ออก"
 */
export function isDuplicateAuditLabel(ilpn?: string): boolean {
  const str = String(ilpn || '').trim();
  if (!str || str === '-' || str.toLowerCase() === 'null') return false;
  // Explicitly cut out/exclude labels starting with 125
  if (str.startsWith('125')) return false;
  // Retrieve/include only child labels starting with 2115
  return str.startsWith('2115');
}

/**
 * Generates realistic RP20 task records with Task No., iLPN, across multiple dates/months
 */
export function generateSampleRP20Data(): RP20Record[] {
  const records: RP20Record[] = [];

  // Generate 8 days in November and 4 days in October for daily & monthly trendline demonstration
  const dates = [
    '2026-11-07',
    '2026-11-06',
    '2026-11-05',
    '2026-11-04',
    '2026-11-03',
    '2026-11-02',
    '2026-11-01',
    '2026-10-31',
    '2026-10-30',
    '2026-10-29',
    '2026-10-28',
  ];

  // Hourly weight distribution curve (00:00 - 23:00)
  // Morning shift: 05:00 - 17:00 (active high volume)
  // Night shift: 18:00 - 04:00 (moderate & steady volume)
  const hourlyWeight: number[] = [
    12, 10, 8, 7, 9,        // 00-04 Night shift late hours
    22, 38, 52, 65, 70, 72, 60, // 05-11 Morning shift peak
    48, 68, 76, 74, 62, 54,     // 12-17 Afternoon morning shift end
    42, 45, 48, 38, 30, 20,     // 18-23 Night shift start & peak
  ];

  let idCounter = 10001;
  let taskNoCounter = 4001;
  const userRecentIlpns: Record<string, string[]> = {};

  dates.forEach((date, dateIdx) => {
    // Generate ~150 - 280 records per day to simulate healthy realistic workload
    const recordsPerDay = dateIdx < 3 ? 240 : dateIdx < 7 ? 210 : 180;

    // Track active parent tasks on this day for Cherry Pick 1:N relations
    const dailyCherryParents: string[] = [];

    for (let i = 0; i < recordsPerDay; i++) {
      // Pick hour based on weighted distribution
      const totalWeight = hourlyWeight.reduce((a, b) => a + b, 0);
      let rand = Math.random() * totalWeight;
      let hour = 8;
      for (let h = 0; h < 24; h++) {
        if (rand < hourlyWeight[h]) {
          hour = h;
          break;
        }
        rand -= hourlyWeight[h];
      }

      const minute = Math.floor(Math.random() * 60);
      const second = Math.floor(Math.random() * 60);
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

      // Status: ~85% Complete, 8% In Progress, 4% Pending, 3% Cancelled
      const statusRand = Math.random();
      let status = 'Complete';
      if (statusRand > 0.85 && statusRand <= 0.93) {
        status = 'In Progress';
      } else if (statusRand > 0.93 && statusRand <= 0.97) {
        status = 'Pending';
      } else if (statusRand > 0.97) {
        status = 'Cancelled';
      }

      const userIdx = Math.floor(Math.random() * SAMPLE_USERS.length);
      const user = SAMPLE_USERS[userIdx];

      // Task description: 35% chance of Cherry Pick tasks to ensure solid data for the Cherry Pick widget
      let taskDesc: string;
      const cherryRand = Math.random();
      if (cherryRand < 0.22) {
        taskDesc = 'Replenish Active Cherry  Pick  Prty 40';
      } else if (cherryRand < 0.38) {
        taskDesc = 'Replenish Active Cherry  Pick  Prty 50';
      } else {
        const otherTasks = SAMPLE_TASK_DESCRIPTIONS.slice(2);
        taskDesc = otherTasks[Math.floor(Math.random() * otherTasks.length)];
      }

      // Generate Task No. (ลาเบลแม่) and iLPN (ลาเบลลูก)
      let taskNo: string;
      let ilpn: string;

      if (isCherryPickTask(taskDesc)) {
        // For Cherry pick: create parent Task No. (1:N relations)
        if (dailyCherryParents.length > 0 && Math.random() < 0.45) {
          taskNo = dailyCherryParents[Math.floor(Math.random() * dailyCherryParents.length)];
        } else {
          taskNo = `TSK-CHERRY-${taskNoCounter++}`;
          dailyCherryParents.push(taskNo);
        }

        // Check if user reuses an already scanned iLPN (> 1 time)
        const userPool = userRecentIlpns[user] || [];
        const shouldDuplicate = userPool.length > 0 && Math.random() < 0.07;

        if (shouldDuplicate) {
          // Re-use an existing iLPN to simulate User scanning iLPN > 1 time
          ilpn = userPool[Math.floor(Math.random() * userPool.length)];
        } else {
          // Check if this record should have wrong label type starting with 2114
          // (Simulating 4-6% human scan errors using wrong label type 2114 instead of 2115)
          const isWrongType2114 = Math.random() < 0.055;
          const serial = Math.floor(100000 + Math.random() * 900000);

          if (isWrongType2114) {
            ilpn = `2114${serial}`; // ลาเบลผิดประเภท ขึ้นต้นด้วย 2114
          } else {
            ilpn = `2115${serial}`; // ลาเบลลูกปกติ ขึ้นต้นด้วย 2115
          }

          if (!userRecentIlpns[user]) userRecentIlpns[user] = [];
          userRecentIlpns[user].push(ilpn);
        }
      } else {
        taskNo = `TSK-${taskNoCounter++}`;
        // Standard non-cherry iLPN: mix of 125* pallet labels and LPN* barcodes
        if (Math.random() < 0.35) {
          ilpn = `125${Math.floor(10000000 + Math.random() * 90000000)}`;
        } else {
          ilpn = `LPN${Math.floor(10000000 + Math.random() * 90000000)}`;
        }
      }

      records.push({
        id: `RP20-${idCounter++}`,
        taskNo,
        ilpn,
        taskDescription: taskDesc,
        taskStatus: status,
        byUser: user,
        completionTime: timeStr,
        completionHour: hour,
        date: date,
        rawRow: {
          'Task ID': `RP20-${idCounter}`,
          'Task No.': taskNo,
          'iLPN': ilpn,
          'Task Description': taskDesc,
          'Task Status': status,
          'By User': user,
          'Completion Time': `${date} ${timeStr}`,
          'Date': date,
          'Shift': isMorningShift(hour) ? 'Morning (05:00-17:00)' : 'Night (18:00-04:00)',
        },
      });
    }
  });

  return records.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return a.completionTime.localeCompare(b.completionTime);
  });
}
