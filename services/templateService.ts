
import { ScheduleConfig } from '../types';
import { getSupabase } from './supabase';
import { fromDbTemplate } from './dataService';

export const addTemplate = async (title: string, description: string, scheduleConfig?: ScheduleConfig, assigneeIds?: string[]) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { data, error } = await supabase.from('templates').insert({
    title,
    description,
    schedule_config: scheduleConfig,
    assignee_ids: assigneeIds || [],
    is_active: true, // Default to true
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).select().single();

  return error ? { success: false, message: error.message } : { success: true, data: fromDbTemplate(data) };
};

export const updateTemplate = async (
  templateId: string, 
  title?: string, 
  description?: string, 
  scheduleConfig?: ScheduleConfig, 
  isActive?: boolean, 
  assigneeIds?: string[]
) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const updates: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (scheduleConfig !== undefined) updates.schedule_config = scheduleConfig;
  if (isActive !== undefined) updates.is_active = isActive;
  if (assigneeIds !== undefined) updates.assignee_ids = assigneeIds;

  const { data, error } = await supabase.from('templates').update(updates).eq('id', templateId).select().single();
  return error ? { success: false, message: error.message } : { success: true, data: fromDbTemplate(data) };
};

export const deleteTemplate = async (templateId: string) => {
  if (!templateId) return { success: false, message: "ID is missing" };
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { error } = await supabase.from('templates').delete().eq('id', templateId);
  if (error) {
    console.error("Template Delete Error:", error);
    return { success: false, message: error.message };
  }
  return { success: true };
};

export const toggleTemplateActive = async (templateId: string, isActive: boolean) => {
  return updateTemplate(templateId, undefined, undefined, undefined, isActive);
};
