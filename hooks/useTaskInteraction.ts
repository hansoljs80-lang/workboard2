
import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '../types';
import { updateTaskStatus, deleteTask } from '../services/api';
import { useTaskOperations } from './useTaskOperations';

interface UseTaskInteractionProps {
  tasks: Task[];
  filteredTasks: Task[];
  currentDate: Date;
  onRefresh: () => void;
}

export const useTaskInteraction = ({ tasks, filteredTasks, onRefresh }: UseTaskInteractionProps) => {
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  
  const { 
    handleMove: handleBasicMove, 
    handleDeleteBasic,
    operationStatus, 
    operationMessage, 
    setOperationStatus, 
    setOperationMessage,
    performOperation
  } = useTaskOperations(onRefresh);

  const handleRequestMove = useCallback(async (taskId: string, currentStatus: TaskStatus, direction: 'next' | 'prev', completedBy?: string[]) => {
    // 모든 업무는 이제 실제 DB 업무이므로 복잡한 검색 로직 불필요
    if (direction === 'next' && currentStatus === TaskStatus.IN_PROGRESS) {
      const task = filteredTasks.find(t => t.id === taskId) || tasks.find(t => t.id === taskId);
      if (task) {
        setCompletingTask(task);
        return;
      }
    }

    handleBasicMove(taskId, currentStatus, direction, completedBy);
  }, [tasks, filteredTasks, handleBasicMove]);

  const handleDirectComplete = useCallback((task: Task) => {
    setCompletingTask(task);
  }, []);

  const handleDelete = useCallback(async (taskId: string) => {
    const task = filteredTasks.find(t => t.id === taskId) || tasks.find(t => t.id === taskId);
    
    if (!task) {
        console.warn(`Delete failed: Task ${taskId} not found.`);
        return;
    }

    // 반복 업무(템플릿 출신)라면 'SKIPPED' 처리하여 기록 보존 (건너뜀)
    const isRecurringInstance = !!task.sourceTemplateId;

    if (isRecurringInstance) {
      if (window.confirm('이 업무를 삭제하시겠습니까?\n(반복 발급된 업무이므로 기록 보존을 위해 "건너뜀" 처리되어 목록에서 사라집니다)')) {
        performOperation(
           '삭제 처리 중...',
           '삭제 완료',
           () => updateTaskStatus(task.id, TaskStatus.SKIPPED)
        );
      }
    } else {
      // 직접 생성한 1회성 업무는 완전 삭제
      if (window.confirm('이 업무를 완전히 삭제하시겠습니까?\n(복구할 수 없습니다)')) {
        handleDeleteBasic(taskId);
      }
    }

  }, [filteredTasks, tasks, performOperation, handleDeleteBasic]);

  const handleCompletionConfirm = async (staffIds: string[]) => {
    if (!completingTask) return;

    performOperation(
      '완료 처리 중...',
      '업무 완료!',
      () => updateTaskStatus(completingTask.id, TaskStatus.DONE, staffIds)
    );
    setCompletingTask(null);
  };

  return {
    handleRequestMove,
    handleDirectComplete,
    handleDelete,
    operationStatus,
    operationMessage,
    setOperationStatus,
    setOperationMessage,
    completingTask,
    setCompletingTask,
    handleCompletionConfirm
  };
};
