
import { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { getNoteColor, getRecurrenceIndicatorColor, getRecurrenceLabel, getRecurrenceBadge } from '../utils/styleUtils';
import { getChecklistProgress, hasChecklist } from '../utils/checklistUtils';

export const useTaskCardLogic = (task: Task) => {
  // 1. Style Memoization
  const colorStyle = useMemo(() => getNoteColor(task.id), [task.id]);
  
  // 2. Status Booleans
  const isDone = task.status === TaskStatus.DONE;
  const isInProgress = task.status === TaskStatus.IN_PROGRESS;

  // 3. Display IDs Logic
  const displayIds = useMemo(() => {
    return isDone && task.completedBy && task.completedBy.length > 0 
      ? task.completedBy 
      : task.assigneeIds;
  }, [isDone, task.completedBy, task.assigneeIds]);

  // 4. Visual Indicators
  const indicatorClass = isDone ? 'bg-slate-400' : getRecurrenceIndicatorColor(task.recurrenceType);
  const indicatorLabel = getRecurrenceLabel(task.recurrenceType);
  
  const recurrenceBadge = useMemo(() => 
    getRecurrenceBadge(task.recurrenceType, task.recurrenceInterval), 
  [task.recurrenceType, task.recurrenceInterval]);

  // 5. Checklist Logic
  const progress = useMemo(() => {
    return hasChecklist(task.description) ? getChecklistProgress(task.description) : null;
  }, [task.description]);

  return {
    colorStyle,
    isDone,
    isInProgress,
    displayIds,
    indicatorClass,
    indicatorLabel,
    recurrenceBadge,
    progress
  };
};
