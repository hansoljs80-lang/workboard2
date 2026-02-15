
import { fetchPtRoomLogs } from './ptRoomService';
import { fetchShockwaveLogs } from './shockwaveService';
import { fetchBedLogs } from './bedService';
import { fetchLaundryLogs } from './laundryService';
import { fetchChangingRoomLogs } from './changingRoomService';

export interface DashboardData {
  ptRoom: { count: number; items: any[] };
  shockwave: { count: number; items: any[] };
  beds: { count: number; items: any[] };
  laundry: { count: number; items: any[] };
  changingRoom: { count: number; items: any[] };
  staffPerformance: Record<string, number>;
  activityByDate: Record<string, number>;
}

export const fetchDashboardStats = async (start: Date, end: Date): Promise<DashboardData> => {
  try {
    // Fetch all logs in parallel for performance
    const [ptRes, swRes, bedRes, laundryRes, crRes] = await Promise.all([
      fetchPtRoomLogs(start, end),
      fetchShockwaveLogs(start, end),
      fetchBedLogs(start, end),
      fetchLaundryLogs(start, end),
      fetchChangingRoomLogs(start, end)
    ]);

    const ptLogs = ptRes.data || [];
    const swLogs = swRes.data || [];
    const bedLogs = bedRes.data || [];
    const laundryLogs = laundryRes.data || [];
    const crLogs = crRes.data || [];

    // Aggregate Staff Performance (Updated to sum Checkbox Items for complex logs)
    const staffPerf: Record<string, number> = {};
    
    // Helper to add score to staff
    const addScore = (ids: string[], score: number) => {
        ids.forEach(id => staffPerf[id] = (staffPerf[id] || 0) + score);
    };

    // 1. PT Room: Count checked items
    ptLogs.forEach(l => {
        const score = l.checklist ? l.checklist.filter((i: any) => i.checked).length : 1;
        addScore(l.performedBy, score > 0 ? score : 1);
    });

    // 2. Shockwave: Count checked items
    swLogs.forEach(l => {
        const score = l.checklist ? l.checklist.filter((i: any) => i.checked).length : 1;
        addScore(l.performedBy, score > 0 ? score : 1);
    });

    // 3. Changing Room: Count checked items
    crLogs.forEach(l => {
        const score = l.checklist ? l.checklist.filter((i: any) => i.checked).length : 1;
        addScore(l.performedBy, score > 0 ? score : 1);
    });

    // 4. Bed: 1 Log = 1 Count
    bedLogs.forEach(l => addScore(l.performedBy, 1));

    // 5. Laundry: 1 Log = 1 Count
    laundryLogs.forEach(l => addScore(l.performedBy, 1));

    // Aggregate Activity by Date (Remain as submission count or item count? Usually activity = submission count)
    const activityDate: Record<string, number> = {};
    const countDate = (dateStr: string) => {
        const d = new Date(dateStr).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
        activityDate[d] = (activityDate[d] || 0) + 1;
    };

    ptLogs.forEach(l => countDate(l.createdAt));
    swLogs.forEach(l => countDate(l.createdAt));
    bedLogs.forEach(l => countDate(l.createdAt));
    laundryLogs.forEach(l => countDate(l.createdAt));
    crLogs.forEach(l => countDate(l.createdAt));

    return {
      ptRoom: { count: ptLogs.length, items: ptLogs },
      shockwave: { count: swLogs.length, items: swLogs },
      beds: { count: bedLogs.length, items: bedLogs },
      laundry: { count: laundryLogs.length, items: laundryLogs },
      changingRoom: { count: crLogs.length, items: crLogs },
      staffPerformance: staffPerf,
      activityByDate: activityDate
    };

  } catch (e) {
    console.error("Dashboard fetch error", e);
    throw e;
  }
};
