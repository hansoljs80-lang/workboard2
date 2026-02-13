import { getSupabase } from './supabase';
import { LaundryLog, LaundryAction } from '../types';

export const logLaundryAction = async (actionType: LaundryAction, staffIds: string[]) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('laundry_logs').insert({
      action_type: actionType,
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) {
       console.error("Laundry log insert failed:", error);
       return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Laundry log exception:", e);
    return { success: false, message: e.message };
  }
};

export const fetchLaundryLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: LaundryLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('laundry_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const logs: LaundryLog[] = (data || []).map((row: any) => ({
      id: row.id,
      actionType: row.action_type,
      performedBy: row.performed_by || [],
      createdAt: row.created_at
    }));

    return { success: true, data: logs };
  } catch (e: any) {
    return { success: false, message: e.message || "Unknown error" };
  }
};