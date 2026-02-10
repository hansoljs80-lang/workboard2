
import { NOTE_COLORS } from '../constants/colors';
import { RecurrenceType } from '../types';

/**
 * Generates a consistent color theme based on a string input (e.g., Task ID).
 * Uses a hash function to ensure the same ID always returns the same color.
 */
export const getNoteColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NOTE_COLORS.length;
  return NOTE_COLORS[index];
};

/**
 * Calculates portal position to ensure it stays within viewport bounds.
 */
export const calculatePopupPosition = (rect: DOMRect) => {
  const HEADER_HEIGHT = 60; // Approximate
  const GAP = 4;
  
  // Default: Show below the card
  let top = rect.bottom + window.scrollY + GAP;
  let left = rect.left + window.scrollX;
  
  // If too close to bottom of screen, flip to top
  if (rect.bottom + 200 > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - GAP;
    // We'll handle 'transform: translateY(-100%)' in CSS for the top positioning
  }

  return { top, left, width: rect.width };
};

/**
 * Returns the Tailwind CSS background color class for the task indicator strip
 * based on the recurrence type.
 */
export const getRecurrenceIndicatorColor = (type?: RecurrenceType): string => {
  switch (type) {
    case 'weekly':
      return 'bg-emerald-500'; // Green
    case 'biweekly':
      return 'bg-violet-500'; // Purple
    case 'monthly':
      return 'bg-orange-500'; // Orange
    case 'custom_days':
      return 'bg-pink-500'; // Pink
    case 'daily':
      return 'bg-blue-500'; // Blue
    case 'none':
    default:
      return 'bg-slate-500'; // Slate/Gray (Default for single tasks)
  }
};

/**
 * Returns a comprehensive theme object for Draft Cards based on recurrence type.
 * Includes styles for Card Background, Border, Toggle Button, and Badges.
 */
export const getRecurrenceTheme = (type?: RecurrenceType) => {
  switch (type) {
    case 'daily':
      return {
        card: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm',
        toggle: 'bg-blue-600',
        badge: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
        title: 'text-blue-900 dark:text-blue-100',
        icon: 'text-blue-500'
      };
    case 'weekly':
      return {
        card: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 shadow-sm',
        toggle: 'bg-emerald-600',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
        title: 'text-emerald-900 dark:text-emerald-100',
        icon: 'text-emerald-500'
      };
    case 'biweekly':
      return {
        card: 'bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800 shadow-sm',
        toggle: 'bg-violet-600',
        badge: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700',
        title: 'text-violet-900 dark:text-violet-100',
        icon: 'text-violet-500'
      };
    case 'monthly':
      return {
        card: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 shadow-sm',
        toggle: 'bg-orange-600',
        badge: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700',
        title: 'text-orange-900 dark:text-orange-100',
        icon: 'text-orange-500'
      };
    case 'custom_days':
      return {
        card: 'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-800 shadow-sm',
        toggle: 'bg-pink-600',
        badge: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:border-pink-700',
        title: 'text-pink-900 dark:text-pink-100',
        icon: 'text-pink-500'
      };
    case 'none':
    default:
      return {
        card: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm',
        toggle: 'bg-slate-600',
        badge: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600',
        title: 'text-slate-700 dark:text-slate-300',
        icon: 'text-slate-500'
      };
  }
};

/**
 * Returns a human-readable label for the recurrence type for tooltips.
 */
export const getRecurrenceLabel = (type?: RecurrenceType): string => {
  switch (type) {
    case 'daily': return '매일 반복';
    case 'weekly': return '매주 반복';
    case 'biweekly': return '격주 반복';
    case 'monthly': return '매월 반복';
    case 'custom_days': return '지정 간격 반복';
    default: return '일반 업무';
  }
};

/**
 * Returns a short badge label and style class for the task title prefix.
 */
export const getRecurrenceBadge = (type?: RecurrenceType, interval?: number): { label: string; className: string } | null => {
  switch (type) {
    case 'daily':
      return { label: '일일', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    case 'weekly':
      return { label: '매주', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    case 'biweekly':
      return { label: '격주', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' };
    case 'monthly':
      return { label: '매월', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
    case 'custom_days':
      // interval check for '격일' (every 2 days)
      if (interval === 2) {
          return { label: '격일', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' };
      }
      return { label: interval ? `${interval}일` : '지정', className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' };
    default:
      return null; // No badge for standard 'none' tasks
  }
};
