
import { getSupabase } from './supabase';
import { ShockwaveLog, ShockwaveShift, ShockwaveChecklistItem, ShockwaveConfig } from '../types';

const CONFIG_KEY = 'shockwave_config';

const DEFAULT_CONFIG: ShockwaveConfig = {
  morningItems: [
    { id: 'power_on', label: '기기 전원 켜기' },
    { id: 'tissues', label: '티슈 수량 확인 및 채우기' },
    { id: 'gel', label: '초음파 겔 채우기' },
    { id: 'pads', label: '충격파 패드 정리' },
    { id: 'device', label: '기기 닦기' },
    { id: 'room', label: '초음파실 정리' }
  ],
  dailyItems: [
    { id: 'gel_check', label: '수시 겔 보충' },
    { id: 'pad_check', label: '패드 상태 점검' },
    { id: 'tidy_up', label: '사용 후 정리 정돈' }
  ],
  eveningItems: [
    { id: 'room', label: '초음파실 정리' },
    { id: 'wash', label: '초음파 패드 세척' },
    { id: 'power_off', label: '기기 전원 끄기' },
    { id: 'clean_up', label: '전선, 의자 올려 놓기 (청소 업체 방문 시)' }
  ]
};

export const getShockwaveConfig = async (): Promise<ShockwaveConfig> => {
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

    const parsed = JSON.parse(data.value) as ShockwaveConfig;
    
    // Migration: Ensure all keys exist
    if (!parsed.morningItems) parsed.morningItems = DEFAULT_CONFIG.morningItems;
    if (!parsed.dailyItems) parsed.dailyItems = DEFAULT_CONFIG.dailyItems;
    if (!parsed.eveningItems) parsed.eveningItems = DEFAULT_CONFIG.eveningItems;

    return parsed;
  } catch (e) {
    console.error("Failed to load shockwave config", e);
    return DEFAULT_CONFIG;
  }
};

export const saveShockwaveConfig = async (config: ShockwaveConfig): Promise<{ success: boolean; message?: string }> => {
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

export const logShockwaveAction = async (
  shiftType: ShockwaveShift, 
  checklist: ShockwaveChecklistItem[], 
  staffIds: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('shockwave_logs').insert({
      shift_type: shiftType,
      checklist: checklist,
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) {
       console.error("Shockwave log insert failed:", error);
       return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("Shockwave log exception:", e);
    return { success: false, message: e.message };
  }
};

export const fetchShockwaveLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: ShockwaveLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('shockwave_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const logs: ShockwaveLog[] = (data || []).map((row: any) => ({
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
