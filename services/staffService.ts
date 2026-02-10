
import { getSupabase } from './supabase';

export const addStaff = async (name: string, role: string, color?: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { error } = await supabase.from('staff').insert({
    name,
    role,
    color: color || '#888888',
    is_active: true
  });
  return error ? { success: false, message: error.message } : { success: true };
};

export const updateStaff = async (staffId: string, name?: string, role?: string, color?: string, isActive?: boolean) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (color !== undefined) updates.color = color;
  if (isActive !== undefined) updates.is_active = isActive;

  const { error } = await supabase.from('staff').update(updates).eq('id', staffId);
  return error ? { success: false, message: error.message } : { success: true };
};

export const deleteStaff = async (staffId: string) => {
  if (!staffId) return { success: false, message: "ID is missing" };
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { error } = await supabase.from('staff').delete().eq('id', staffId);
  if (error) {
    console.error("Staff Delete Error:", error);
    return { success: false, message: error.message };
  }
  return { success: true };
};
