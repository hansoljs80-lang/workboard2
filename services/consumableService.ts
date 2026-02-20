
import { getSupabase } from './supabase';
import { Consumable, ConsumableAction, ConsumableLog } from '../types';

// ── DB row → 앱 타입 매핑 ──────────────────────────────────────────────────
const rowToConsumable = (row: any): Consumable => ({
  id: row.id,
  name: row.name,
  category: row.category,
  count: row.count,
  unit: row.unit,
  itemsPerPack: row.items_per_pack,
  packUnit: row.pack_unit,
  minCount: row.min_count || 0,
  vendorName: row.vendor_name,
  vendorPhone: row.vendor_phone,
  note: row.note,
  updatedAt: row.updated_at,
});

const rowToConsumableLog = (row: any): ConsumableLog => ({
  id: row.id,
  itemName: row.item_name,
  actionType: row.action_type,
  changes: row.changes,
  performedBy: row.performed_by || [],
  createdAt: row.created_at,
});

// ── 앱 타입 → DB insert payload ───────────────────────────────────────────
const consumableToInsertRow = (item: Omit<Consumable, 'id' | 'updatedAt'>) => ({
  name: item.name,
  category: item.category,
  count: item.count,
  unit: item.unit,
  items_per_pack: item.itemsPerPack,
  pack_unit: item.packUnit,
  min_count: item.minCount,
  vendor_name: item.vendorName,
  vendor_phone: item.vendorPhone,
  note: item.note,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// ── 부분 업데이트 payload 빌더 ────────────────────────────────────────────
const buildUpdatePayload = (updates: Partial<Consumable>): Record<string, any> => {
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined)         payload.name = updates.name;
  if (updates.category !== undefined)     payload.category = updates.category;
  if (updates.count !== undefined)        payload.count = updates.count;
  if (updates.unit !== undefined)         payload.unit = updates.unit;
  if (updates.itemsPerPack !== undefined) payload.items_per_pack = updates.itemsPerPack;
  if (updates.packUnit !== undefined)     payload.pack_unit = updates.packUnit;
  if (updates.minCount !== undefined)     payload.min_count = updates.minCount;
  if (updates.vendorName !== undefined)   payload.vendor_name = updates.vendorName;
  if (updates.vendorPhone !== undefined)  payload.vendor_phone = updates.vendorPhone;
  if (updates.note !== undefined)         payload.note = updates.note;
  return payload;
};

// ── CRUD ──────────────────────────────────────────────────────────────────
export const fetchConsumables = async (): Promise<{ success: boolean; data?: Consumable[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('consumables')
      .select('*')
      .order('name');

    if (error) throw error;
    return { success: true, data: (data || []).map(rowToConsumable) };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const addConsumable = async (item: Omit<Consumable, 'id' | 'updatedAt'>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('consumables').insert(consumableToInsertRow(item));
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const updateConsumable = async (id: string, updates: Partial<Consumable>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase
      .from('consumables')
      .update(buildUpdatePayload(updates))
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const deleteConsumable = async (id: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('consumables').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

// ── 로그 ──────────────────────────────────────────────────────────────────
export const logConsumableAction = async (
  itemName: string,
  actionType: ConsumableAction,
  changes: string,
  staffIds: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('consumable_logs').insert({
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

export const fetchConsumableLogs = async (
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; data?: ConsumableLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('consumable_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: (data || []).map(rowToConsumableLog) };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
