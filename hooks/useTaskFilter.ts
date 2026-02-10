
import { useMemo } from 'react';
import { Task, TaskStatus, Staff } from '../types';
import { getWeekRange, isSameDay } from '../utils/dateUtils';

type ViewMode = 'day' | 'week' | 'month';

export const useTaskFilter = (
  tasks: Task[], 
  staff: Staff[],
  viewMode: ViewMode, 
  currentDate: Date
) => {
  
  // OPTIMIZATION: Memoize filteredTasks to prevent heavy re-calculation (O(Tasks))
  const filteredTasks = useMemo(() => {
    // Get relevant concrete tasks (saved in DB)
    return tasks.filter(task => {
      // SKIPPED (삭제/숨김) 업무는 보드에서 제외
      if (task.status === TaskStatus.SKIPPED) return false;

      const taskDate = new Date(task.createdAt);
      
      if (viewMode === 'day') {
        return isSameDay(taskDate, currentDate);
      } else if (viewMode === 'week') {
        const { start, end } = getWeekRange(currentDate);
        return taskDate >= start && taskDate <= end;
      } else if (viewMode === 'month') {
        const sameMonth = taskDate.getMonth() === currentDate.getMonth() && 
                          taskDate.getFullYear() === currentDate.getFullYear();
        if (!sameMonth) return false;
        return true;
      }
      return true;
    });

  }, [
    tasks,      // DB Task 목록 변경 시에만 재계산
    staff,      
    currentDate.getTime(), 
    viewMode
  ]);

  // Column filters
  const todoTasks = useMemo(() => filteredTasks.filter(t => t.status === TaskStatus.TODO), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === TaskStatus.IN_PROGRESS), [filteredTasks]);
  const doneTasks = useMemo(() => filteredTasks.filter(t => t.status === TaskStatus.DONE), [filteredTasks]);

  return {
    filteredTasks,
    todoTasks,
    inProgressTasks,
    doneTasks
  };
};
