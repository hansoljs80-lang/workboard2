
import { useState, useCallback } from 'react';
import { TaskStatus } from '../types';
import { updateTaskStatus, deleteTask } from '../services/api';

export type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

export const useTaskOperations = (onRefresh: () => Promise<void> | void) => {
  const [operationStatus, setOperationStatus] = useState<OperationStatus>('idle');
  const [operationMessage, setOperationMessage] = useState('');

  // Helper to manage the flow: Loading -> API -> Success -> Refresh -> Idle
  // Wrapped in useCallback to ensure stability across renders
  const performOperation = useCallback(async (
    loadingMsg: string, 
    successMsg: string, 
    operation: () => Promise<any>
  ) => {
    try {
      setOperationStatus('loading');
      setOperationMessage(loadingMsg);
      
      const response = await operation();
      
      // Check API response success
      if (response && response.success === false) {
        throw new Error(response.message || '작업에 실패했습니다.');
      }
      
      setOperationStatus('success');
      setOperationMessage(successMsg);
      
      // Refresh data while showing success message
      await onRefresh();

      // Show success message for a brief moment before closing
      setTimeout(() => {
        setOperationStatus('idle');
        setOperationMessage('');
      }, 1000);

    } catch (error: any) {
      console.error(error);
      setOperationStatus('error'); 
      // Show error message in overlay briefly or alert
      setOperationMessage(error.message || '오류가 발생했습니다.');
      alert(error.message || '오류가 발생했습니다. 다시 시도해주세요.');
      
      setTimeout(() => {
        setOperationStatus('idle');
        setOperationMessage('');
      }, 2000);
    }
  }, [onRefresh]);
  
  const handleMove = useCallback((taskId: string, currentStatus: TaskStatus, direction: 'next' | 'prev', completedBy?: string[]) => {
    let nextStatus = currentStatus;
    
    if (direction === 'next') {
      // TODO -> IN_PROGRESS -> DONE
      if (currentStatus === TaskStatus.TODO) nextStatus = TaskStatus.IN_PROGRESS;
      else if (currentStatus === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.DONE;
    } else {
      // DONE -> IN_PROGRESS -> TODO
      if (currentStatus === TaskStatus.DONE) nextStatus = TaskStatus.IN_PROGRESS;
      else if (currentStatus === TaskStatus.IN_PROGRESS) nextStatus = TaskStatus.TODO;
    }

    if (nextStatus !== currentStatus) {
      const isComplete = nextStatus === TaskStatus.DONE;
      performOperation(
        '상태 업데이트 중...',
        isComplete ? '업무 완료!' : '상태 변경 완료',
        () => updateTaskStatus(taskId, nextStatus, completedBy)
      );
    }
  }, [performOperation]);

  // Base delete function
  const handleDeleteBasic = useCallback((taskId: string) => {
    performOperation(
      '삭제 중...',
      '삭제 완료',
      () => deleteTask(taskId)
    );
  }, [performOperation]);

  return {
    handleMove,
    handleDeleteBasic, // Export raw delete for custom handlers
    operationStatus,
    operationMessage,
    setOperationStatus,
    setOperationMessage,
    performOperation // Export helper for custom actions
  };
};
