
import { getSupabase } from './supabase';
import { BedData, BedConfig } from '../types';

const SETTING_KEY = 'bed_manager_data';

/**
 * Fetches the current Bed Manager settings (beds + config).
 */
export const getBedData = async (): Promise<{ beds: BedData[], config: BedConfig } | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTING_KEY)
    .single();

  if (error || !data) return null;

  try {
    return JSON.parse(data.value);
  } catch (e) {
    console.error("Failed to parse bed data", e);
    return null;
  }
};

/**
 * Updates the 'lastChanged' date of a specific bed by finding it via name match.
 * Used when a checklist item (e.g., "1번 베드") is checked on the board.
 */
export const updateBedDateByName = async (
  bedNamePartial: string, 
  staffIds: string[]
): Promise<{ success: boolean; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  try {
    // 1. Fetch current data
    const currentData = await getBedData();
    if (!currentData || !currentData.beds) {
      return { success: false, message: '배드 설정 데이터가 없습니다.' };
    }

    // 2. Find target bed (Fuzzy match)
    // "1번 베드" matches "1번 베드", "1번 베드 커버" etc.
    // We normalize by removing spaces for comparison
    const targetName = bedNamePartial.trim().replace(/\s+/g, '');
    
    const bedIndex = currentData.beds.findIndex(b => {
        const dbName = b.name.trim().replace(/\s+/g, '');
        // Check if one includes the other to allow "1번 베드" to match "1번 베드 교체"
        return dbName.includes(targetName) || targetName.includes(dbName);
    });

    if (bedIndex === -1) {
      // Not a bed-related task, ignore silently
      return { success: true, message: 'No matching bed found (Ignored)' };
    }

    // 3. Update Data
    const today = new Date().toISOString();
    currentData.beds[bedIndex].lastChanged = today;
    currentData.beds[bedIndex].lastChangedBy = staffIds;

    // 4. Save back to DB
    const { error } = await supabase.from('settings').upsert({
      key: SETTING_KEY,
      value: JSON.stringify(currentData),
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
    
    return { success: true };

  } catch (e: any) {
    console.error("Bed Sync Error:", e);
    return { success: false, message: e.message };
  }
};
