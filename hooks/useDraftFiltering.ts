
import { useState, useMemo } from 'react';
import { Template, RecurrenceType } from '../types';

// Sorting Priority for "Auto/Priority" mode: Daily > Custom > Weekly > Biweekly > Monthly > None
const PRIORITY_ORDER: Record<string, number> = {
  'daily': 1,
  'custom_days': 2,
  'weekly': 3,
  'biweekly': 4,
  'monthly': 5,
  'none': 6
};

// Helper to convert recurrence to approximate days for frequency sorting
const getFrequencyScore = (type: RecurrenceType, interval?: number): number => {
  switch (type) {
    case 'daily': return 1;
    case 'custom_days': return interval || 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30; // Approx
    case 'none': return 999; // Least frequent (Manual)
    default: return 999;
  }
};

export type SortOrder = 'priority' | 'name' | 'frequency-asc' | 'frequency-desc';

export const useDraftFiltering = (templates: Template[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<RecurrenceType[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('priority');
  const [showArchived, setShowArchived] = useState(false); // New state to hide old versions

  const toggleFilter = (type: RecurrenceType) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilters([]);
    setSortOrder('priority');
    setShowArchived(false);
  };

  const processedTemplates = useMemo(() => {
    let result = [...templates];

    // 0. Active/Archived Filter
    if (!showArchived) {
      result = result.filter(t => t.isActive !== false);
    }

    // 1. Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // 2. Type Filter (Multi-select)
    if (selectedFilters.length > 0) {
      result = result.filter(t => {
        const type = t.scheduleConfig?.type || 'none';
        return selectedFilters.includes(type);
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      // A. Priority Sort (Default)
      if (sortOrder === 'priority') {
        const typeA = a.scheduleConfig?.type || 'none';
        const typeB = b.scheduleConfig?.type || 'none';
        
        const scoreA = PRIORITY_ORDER[typeA] || 99;
        const scoreB = PRIORITY_ORDER[typeB] || 99;
        
        if (scoreA !== scoreB) return scoreA - scoreB;
      }
      
      // B. Frequency Sort (Ascending: Shortest -> Longest)
      if (sortOrder === 'frequency-asc') {
        const scoreA = getFrequencyScore(a.scheduleConfig?.type || 'none', a.scheduleConfig?.intervalValue);
        const scoreB = getFrequencyScore(b.scheduleConfig?.type || 'none', b.scheduleConfig?.intervalValue);
        if (scoreA !== scoreB) return scoreA - scoreB;
      }

      // C. Frequency Sort (Descending: Longest -> Shortest)
      if (sortOrder === 'frequency-desc') {
        const scoreA = getFrequencyScore(a.scheduleConfig?.type || 'none', a.scheduleConfig?.intervalValue);
        const scoreB = getFrequencyScore(b.scheduleConfig?.type || 'none', b.scheduleConfig?.intervalValue);
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      
      // Secondary (or Primary if 'name' mode): Title Alphabetical
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [templates, searchQuery, selectedFilters, sortOrder, showArchived]);

  const hasActiveFilters = searchQuery !== '' || selectedFilters.length > 0 || sortOrder !== 'priority' || showArchived;

  return {
    searchQuery,
    setSearchQuery,
    selectedFilters,
    toggleFilter,
    clearFilters,
    processedTemplates,
    hasActiveFilters,
    sortOrder,
    setSortOrder,
    showArchived,
    setShowArchived
  };
};
