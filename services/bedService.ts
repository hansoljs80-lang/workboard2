import { getSupabase } from './supabase';
import { BedLog } from '../types';

export const logBedChange = async (bedId: number, bedName: string, staffIds: string[]) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('bed_logs').insert({
      bed_id: bedId,
      bed_name: bedName,
      action_type: 'CHANGE',
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) {
       console.error("Log insert failed:", error);
       return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Log exception:", e);
    return { success: false, message: e.message };
  }
};

export const fetchBedLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: BedLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  // Adjust dates to ensure full ISO coverage
  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('bed_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch Bed Logs Error:", error);
      return { success: false, message: error.message };
    }

    const logs: BedLog[] = (data || []).map((row: any) => ({
      id: row.id,
      bedId: row.bed_id,
      bedName: row.bed_name,
      actionType: row.action_type,
      performedBy: row.performed_by || [],
      createdAt: row.created_at,
      note: row.note
    }));

    return { success: true, data: logs };
  } catch (e: any) {
    console.error("Fetch Bed Logs Exception:", e);
    return { success: false, message: e.message || "Unknown error" };
  }
};