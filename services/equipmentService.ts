
import { getSupabase } from './supabase';
import { Equipment } from '../types';

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
