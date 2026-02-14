import { getSupabase } from './supabase';
import { PtRoomLog, PtRoomShift, PtRoomChecklistItem, PtRoomConfig } from '../types';

const CONFIG_KEY = 'pt_room_config';

const DEFAULT_CONFIG: PtRoomConfig = {
  morningItems: [
    { id: 'vent', label: '치료실 환기 시키기' },
    { id: 'water', label: '정수기 물 채우기' },
    { id: 'computer', label: '컴퓨터 및 기기 전원 켜기' },
    { id: 'prepare', label: '치료 도구 정돈 및 준비' }
  ],
  dailyItems: [
    { id: 'trash', label: '휴지통 비우기' },
    { id: 'towel', label: '수건 정리 및 보충' },
    { id: 'clean', label: '바닥 청소 및 정리' }
  ],
  eveningItems: [
    { id: 'power_off', label: '모든 기기 전원 끄기' },
    { id: 'window', label: '창문 닫기 및 잠금 확인' },
    { id: 'trash_final', label: '쓰레기 최종 정리' }
  ],
  periodicItems: [
    { id: 'deep_clean', label: '치료실 대청소', interval: 30 },
    { id: 'filter', label: '공기청정기 필터 세척', interval: 14 },
    { id: 'inventory', label: '비품 재고 파악 및 발주', interval: 7 },
    { id: 'machine_safety', label: '의료기기 안전 점검', interval: 30 }
  ]
};

export const getPtRoomConfig = async (): Promise<PtRoomConfig> => {
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

    const parsed = JSON.parse(data.value) as PtRoomConfig;
    
    // Migration: Ensure periodicItems exists and has interval structure
    if (!parsed.periodicItems) {
      parsed.periodicItems = DEFAULT_CONFIG.periodicItems;
    } else {
      // Map old simple items to new structure if needed
      parsed.periodicItems = parsed.periodicItems.map((item: any) => {
        if (typeof item.interval === 'undefined') {
          return { ...item, interval: 30 }; // Default to 30 days if missing
        }
        return item;
      });
    }
    
    return parsed;
  } catch (e) {
    console.error("Failed to load PT Room config", e);
    return DEFAULT_CONFIG;
  }
};

export const savePtRoomConfig = async (config: PtRoomConfig): Promise<{ success: boolean; message?: string }> => {
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

export const updatePeriodicItemDate = async (itemId: string, date: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const config = await getPtRoomConfig();
    const newItems = config.periodicItems.map(item => 
      item.id === itemId ? { ...item, lastCompleted: date } : item
    );
    
    return await savePtRoomConfig({ ...config, periodicItems: newItems });
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const logPtRoomAction = async (
  shiftType: PtRoomShift, 
  checklist: PtRoomChecklistItem[], 
  staffIds: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('pt_room_logs').insert({
      shift_type: shiftType,
      checklist: checklist,
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) {
       console.error("PT Room log insert failed:", error);
       return { success: false, message: error.message };
    }
    return { success: true };
  } catch (e: any) {
    console.error("PT Room log exception:", e);
    return { success: false, message: e.message };
  }
};

export const fetchPtRoomLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: PtRoomLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('pt_room_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    const logs: PtRoomLog[] = (data || []).map((row: any) => ({
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
