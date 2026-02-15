
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

    // Aggregate Staff Performance
    const staffPerf: Record<string, number> = {};
    const countStaff = (ids: string[]) => ids.forEach(id => staffPerf[id] = (staffPerf[id] || 0) + 1);

    ptLogs.forEach(l => countStaff(l.performedBy));
    swLogs.forEach(l => countStaff(l.performedBy));
    bedLogs.forEach(l => countStaff(l.performedBy));
    laundryLogs.forEach(l => countStaff(l.performedBy));
    crLogs.forEach(l => countStaff(l.performedBy));

    // Aggregate Activity by Date
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
