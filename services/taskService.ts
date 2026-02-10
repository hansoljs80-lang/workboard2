
import { Task } from '../types';
import { getSupabase } from './supabase';

export const addTask = async (task: Omit<Task, 'id' | 'createdAt'> & { createdAt?: string }) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const dbPayload = {
    title: task.title,
    description: task.description,
    status: task.status,
    assignee_ids: task.assigneeIds,
    completed_by: task.completedBy || [],
    recurrence_type: task.recurrenceType,
    source_template_id: task.sourceTemplateId,
    created_at: task.createdAt || new Date().toISOString()
  };

  const { error } = await supabase.from('tasks').insert(dbPayload);
  return error ? { success: false, message: error.message } : { success: true };
};

// NEW: Bulk Task Creation with optimization
export const createBulkTasks = async (tasks: (Omit<Task, 'id' | 'createdAt'> & { createdAt?: string })[]) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  if (tasks.length === 0) return { success: true, count: 0 };

  // Supabase bulk insert works best with batches if the array is huge, 
  // but for < 1000 items, a single call is usually fine.
  const dbPayloads = tasks.map(task => ({
    title: task.title,
    description: task.description,
    status: task.status,
    assignee_ids: task.assigneeIds,
    completed_by: [],
    recurrence_type: task.recurrenceType,
    source_template_id: task.sourceTemplateId,
    created_at: task.createdAt || new Date().toISOString()
  }));

  const { error } = await supabase.from('tasks').insert(dbPayloads);
  return error ? { success: false, message: error.message } : { success: true, count: tasks.length };
};

export const updateTaskStatus = async (taskId: string, status: string, completedBy?: string[]) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const updates: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (completedBy) {
    updates.completed_by = completedBy;
  } else if (status !== 'DONE' && status !== '완료') {
    updates.completed_by = [];
  }

  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
  return error ? { success: false, message: error.message } : { success: true };
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.createdAt !== undefined) dbUpdates.created_at = updates.createdAt;
  if (updates.assigneeIds !== undefined) dbUpdates.assignee_ids = updates.assigneeIds;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
  return error ? { success: false, message: error.message } : { success: true };
};

export const deleteTask = async (taskId: string) => {
  if (!taskId) return { success: false, message: "ID is missing" };
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'DB Disconnected' };

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) {
    console.error("Task Delete Error:", error);
    return { success: false, message: error.message };
  }
  return { success: true };
};
