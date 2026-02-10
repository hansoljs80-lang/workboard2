
import { useState, useEffect, useCallback } from 'react';
import { Task, Staff, Template } from '../types';
import { fetchAllData, getApiUrl } from '../services/api';

export const useAppData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const loadData = useCallback(async () => {
    const url = getApiUrl();
    if (!url) {
      setIsConfigured(false);
      return;
    }
    
    setIsConfigured(true);
    setLoading(true);
    try {
      const result = await fetchAllData();
      if (result.success && result.data) {
        setTasks(result.data.tasks);
        setStaff(result.data.staff);
        setTemplates(result.data.templates || []);
        if (result.data.settings) {
          setSettings(result.data.settings);
        }
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    tasks,
    staff,
    templates,
    settings,
    loading,
    isConfigured,
    loadData
  };
};
