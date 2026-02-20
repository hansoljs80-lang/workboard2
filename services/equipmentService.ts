
import { getSupabase } from './supabase';
import { Equipment, EquipmentAction, EquipmentLog } from '../types';

// ── DB row → 앱 타입 매핑 ──────────────────────────────────────────────────
const rowToEquipment = (row: any): Equipment => ({
  id: row.id,
  name: row.name,
  category: row.category,
  count: row.count,
  vendorName: row.vendor_name,
  vendorPhone: row.vendor_phone,
  vendorPhone2: row.vendor_phone2,
  note: row.note,
  updatedAt: row.updated_at,
});

const rowToEquipmentLog = (row: any): EquipmentLog => ({
  id: row.id,
  itemName: row.item_name,
  actionType: row.action_type,
  changes: row.changes,
  performedBy: row.performed_by || [],
  createdAt: row.created_at,
});

// ── 앱 타입 → DB insert payload ───────────────────────────────────────────
const equipmentToInsertRow = (item: Omit<Equipment, 'id' | 'updatedAt'>) => ({
  name: item.name,
  category: item.category,
  count: item.count,
  vendor_name: item.vendorName,
  vendor_phone: item.vendorPhone,
  vendor_phone2: item.vendorPhone2,
  note: item.note,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ── 부분 업데이트 payload 빌더 ────────────────────────────────────────────
const buildUpdatePayload = (updates: Partial<Equipment>): Record<string, any> => {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined)         payload.name = updates.name;
  if (updates.category !== undefined)     payload.category = updates.category;
  if (updates.count !== undefined)        payload.count = updates.count;
  if (updates.vendorName !== undefined)   payload.vendor_name = updates.vendorName;
  if (updates.vendorPhone !== undefined)  payload.vendor_phone = updates.vendorPhone;
  if (updates.vendorPhone2 !== undefined) payload.vendor_phone2 = updates.vendorPhone2;
  if (updates.note !== undefined)         payload.note = updates.note;
  return payload;
};

// ── CRUD ──────────────────────────────────────────────────────────────────
export const fetchEquipments = async (): Promise<{ success: boolean; data?: Equipment[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('name');

    if (error) throw error;
    return { success: true, data: (data || []).map(rowToEquipment) };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const addEquipment = async (item: Omit<Equipment, 'id' | 'updatedAt'>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('equipments').insert(equipmentToInsertRow(item));
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase
      .from('equipments')
      .update(buildUpdatePayload(updates))
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const deleteEquipment = async (id: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('equipments').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

// ── 로그 ──────────────────────────────────────────────────────────────────
export const logEquipmentAction = async (
  itemName: string,
  actionType: EquipmentAction,
  changes: string,
  staffIds: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('equipment_logs').insert({
      item_name: itemName,
      action_type: actionType,
      changes,
      performed_by: staffIds,
      created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const fetchEquipmentLogs = async (
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: EquipmentLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('equipment_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: (data || []).map(rowToEquipmentLog) };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
