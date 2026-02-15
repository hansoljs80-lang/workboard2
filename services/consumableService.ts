
import { getSupabase } from './supabase';
import { Consumable } from '../types';

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
