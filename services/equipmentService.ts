
import { getSupabase } from './supabase';
import { Equipment, EquipmentAction, EquipmentLog } from '../types';

export const fetchEquipments = async (): Promise<{ success: boolean; data?: Equipment[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { data, error } = await supabase
      .from('equipments')
      .select('*')
      .order('name');

    if (error) throw error;

    const items: Equipment[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      count: row.count,
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

export const addEquipment = async (item: Omit<Equipment, 'id' | 'updatedAt'>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const { error } = await supabase.from('equipments').insert({
      name: item.name,
      category: item.category,
      count: item.count,
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

export const updateEquipment = async (id: string, updates: Partial<Equipment>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.count !== undefined) dbUpdates.count = updates.count;
    if (updates.vendorName !== undefined) dbUpdates.vendor_name = updates.vendorName;
    if (updates.vendorPhone !== undefined) dbUpdates.vendor_phone = updates.vendorPhone;
    if (updates.note !== undefined) dbUpdates.note = updates.note;

    const { error } = await supabase.from('equipments').update(dbUpdates).eq('id', id);

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

export const fetchEquipmentLogs = async (startDate: Date, endDate: Date): Promise<{ success: boolean; data?: EquipmentLog[]; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  try {
    const { data, error } = await supabase
      .from('equipment_logs')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const logs: EquipmentLog[] = (data || []).map((row: any) => ({
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
