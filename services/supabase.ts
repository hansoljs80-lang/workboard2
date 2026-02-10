
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/supabaseConfig';

const KEY_URL = 'pt_board_supabase_url';
const KEY_ANON = 'pt_board_supabase_anon';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  // 1순위: 코드에 하드코딩된 설정 (constants/supabaseConfig.ts)
  // 2순위: 로컬 스토리지 설정 (설정 화면 입력값)
  const url = SUPABASE_URL || localStorage.getItem(KEY_URL) || '';
  const anonKey = SUPABASE_ANON_KEY || localStorage.getItem(KEY_ANON) || '';

  return { url, anonKey };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  // 하드코딩된 값이 있다면 로컬 스토리지 저장은 무시되거나 의미가 없지만,
  // 사용자가 설정을 덮어쓰려 할 때를 대비해 저장은 수행합니다.
  localStorage.setItem(KEY_URL, url);
  localStorage.setItem(KEY_ANON, anonKey);
  // Reset instance to force recreation with new credentials
  supabaseInstance = null;
};

export const getSupabase = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getSupabaseConfig();

  if (url && anonKey) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false // No auth needed for this simplified version
        }
      });
      return supabaseInstance;
    } catch (e) {
      console.error("Failed to initialize Supabase client", e);
      return null;
    }
  }
  return null;
};
