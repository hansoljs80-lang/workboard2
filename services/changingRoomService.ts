import { getSupabase } from './supabase';
import { ChangingRoomLog, ChangingRoomShift, ChangingRoomChecklistItem, ChangingRoomConfig } from '../types';

const CONFIG_KEY = 'changing_room_config';

const DEFAULT_CONFIG: ChangingRoomConfig = {
  morningItems: [
    { id: 'locker_check', label: '라커룸 열쇠 및 잠금 확인' },
    { id: 'floor', label: '바닥 청소 상태 확인' },
    { id: 'light', label: '전등 및 환풍기 작동 확인' }
  ],
  lunchItems: [
    { id: 'towel_refill', label: '수건 및 비품 보충' },
    { id: 'floor_spot', label: '바닥 머리카락 등 정리' },
    { id: 'bin', label: '휴지통 비우기 (필요시)' }
  ],
  adhocItems: [
    { id: 'smell', label: '환기 및 냄새 제거' },
    { id: 'temperature', label: '온도/습도 점검' },
    { id: 'lost_found', label: '분실물 확인' }
  ]
};

export const getChangingRoomConfig = async (): Promise<ChangingRoomConfig> => {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_CONFIG;

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', CONFIG_KEY)
      .single();

    if (error || !data) {
      return DEFAULT_CONFIG;
    }

    const parsed = JSON.parse(data.value) as ChangingRoomConfig;
    
    // Migration: Ensure all keys exist
    if (!parsed.morningItems) parsed.morningItems = DEFAULT_CONFIG.morningItems;
    if (!parsed.lunchItems) parsed.lunchItems = DEFAULT_CONFIG.lunchItems;
    if (!parsed.adhocItems) parsed.adhocItems = DEFAULT_CONFIG.adhocItems;

    return parsed;
  } catch (e) {
    console.error("Failed to load Changing Room config", e);
    return DEFAULT_CONFIG;
  }
};

export const saveChangingRoomConfig = async (config: ChangingRoomConfig): Promise<{ success: boolean; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('settings').upsert({
      key: CONFIG_KEY,
      value: JSON.stringify(config),
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const logChangingRoomAction = async (
  shiftType: ChangingRoomShift, 
  checklist: ChangingRoomChecklistItem[], 
  staffIds: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('changing_room_logs').insert({
      shift_type: shiftType,
      checklist: checklist,
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) {
       console.error("Changing Room log insert failed:", error);
       return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Changing Room log exception:", e);
    return { success: false, message: e.message };
  }
};

export const fetchChangingRoomLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: ChangingRoomLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('changing_room_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const logs: ChangingRoomLog[] = (data || []).map((row: any) => ({
      id: row.id,
      shiftType: row.shift_type,
      checklist: row.checklist || [],
      performedBy: row.performed_by || [],
      createdAt: row.created_at
    }));

    return { success: true, data: logs };
  } catch (e: any) {
    return { success: false, message: e.message || "Unknown error" };
  }
};
