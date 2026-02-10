
import { getSupabase } from './supabase';

export const updateSetting = async (key: string, value: any) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { error } = await supabase.from('settings').upsert({
    key,
    value: String(value),
    updated_at: new Date().toISOString()
  });

  return error ? { success: false, message: error.message } : { success: true };
};
