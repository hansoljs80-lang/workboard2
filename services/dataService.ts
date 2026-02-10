
import { AppData, Staff, Task, Template } from '../types';
import { getSupabase, getSupabaseConfig } from './supabase';

// Data Mappers
export const fromDbTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  status: row.status,
  assigneeIds: row.assignee_ids || [],
  completedBy: row.completed_by || [],
  createdAt: row.created_at,
  recurrenceType: row.recurrence_type || 'none',
  sourceTemplateId: row.source_template_id
});

export const fromDbStaff = (row: any): Staff => ({
  id: row.id,
  name: row.name,
  role: row.role,
  color: row.color,
  isActive: row.is_active
});

export const fromDbTemplate = (row: any): Template => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  scheduleConfig: row.schedule_config,
  assigneeIds: row.assignee_ids || [],
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export const getApiUrl = (): string | null => {
  const { url, anonKey } = getSupabaseConfig();
  return url && anonKey ? url : null;
};

export const fetchAllData = async (): Promise<{ success: boolean; data?: AppData; message?: string }> => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB 설정이 필요합니다.' };

  try {
    const [tasksRes, staffRes, templatesRes, settingsRes] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('staff').select('*').order('name'),
      supabase.from('templates').select('*').order('created_at'),
      supabase.from('settings').select('*')
    ]);

    if (tasksRes.error) throw tasksRes.error;
    if (staffRes.error) throw staffRes.error;
    if (templatesRes.error) throw templatesRes.error;
    if (settingsRes.error) throw settingsRes.error;

    const settingsMap: Record<string, any> = {};
    settingsRes.data.forEach((item: any) => {
       settingsMap[item.key] = item.value;
    });

    return {
      success: true,
      data: {
        tasks: tasksRes.data.map(fromDbTask),
        staff: staffRes.data.map(fromDbStaff),
        templates: templatesRes.data.map(fromDbTemplate),
        settings: settingsMap
      }
    };
  } catch (error: any) {
    console.error("Supabase Error:", error);
    return { success: false, message: error.message || '데이터 불러오기 실패' };
  }
};
