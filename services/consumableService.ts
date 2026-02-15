
import { getSupabase } from './supabase';
import { Consumable, ConsumableAction, ConsumableLog } from '../types';

export const fetchConsumables = async (): Promise<{ success: boolean; data?: Consumable[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('consumables')
      .select('*')
      .order('name');

    if (error) throw error;

    const items: Consumable[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      count: row.count,
      unit: row.unit,
      itemsPerPack: row.items_per_pack,
      packUnit: row.pack_unit,
      minCount: row.min_count || 0, // Load minCount
      vendorName: row.vendor_name,
      vendorPhone: row.vendor_phone,
      note: row.note,
      updatedAt: row.updated_at
    }));

    return { success: true, data: items };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const addConsumable = async (item: Omit<Consumable, 'id' | 'updatedAt'>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('consumables').insert({
      name: item.name,
      category: item.category,
      count: item.count,
      unit: item.unit,
      items_per_pack: item.itemsPerPack,
      pack_unit: item.packUnit,
      min_count: item.minCount, // Save minCount
      vendor_name: item.vendorName,
      vendor_phone: item.vendorPhone,
      note: item.note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

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
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.count !== undefined) dbUpdates.count = updates.count;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.itemsPerPack !== undefined) dbUpdates.items_per_pack = updates.itemsPerPack;
    if (updates.packUnit !== undefined) dbUpdates.pack_unit = updates.packUnit;
    if (updates.minCount !== undefined) dbUpdates.min_count = updates.minCount; // Update minCount
    if (updates.vendorName !== undefined) dbUpdates.vendor_name = updates.vendorName;
    if (updates.vendorPhone !== undefined) dbUpdates.vendor_phone = updates.vendorPhone;
    if (updates.note !== undefined) dbUpdates.note = updates.note;

    const { error } = await supabase.from('consumables').update(dbUpdates).eq('id', id);

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
      changes: changes,
      performed_by: staffIds,
      created_at: new Date().toISOString()
    });

    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};

export const fetchConsumableLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: ConsumableLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('consumable_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const logs: ConsumableLog[] = (data || []).map((row: any) => ({
      id: row.id,
      itemName: row.item_name,
      actionType: row.action_type,
      changes: row.changes,
      performedBy: row.performed_by || [],
      createdAt: row.created_at
    }));

    return { success: true, data: logs };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
