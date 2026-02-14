
import { useState, useCallback, useRef, useEffect } from 'react';
import { Staff, Task, Template } from '../types';
import { deleteStaff, updateStaff, updateTask } from '../services/api';
import { OperationStatus } from './useTaskOperations';

interface UseStaffOperationsProps {
  onRefresh: () => void;
  tasks: Task[];
  templates: Template[];
}

export const useStaffOperations = ({ onRefresh, tasks, templates }: UseStaffOperationsProps) => {
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // OPTIMIZATION: Use refs to access latest data inside callbacks without changing the callback identity.
  const tasksRef = useRef(tasks);
  const templatesRef = useRef(templates);

  useEffect(() => {
    tasksRef.current = tasks;
    templatesRef.current = templates;
  }, [tasks, templates]);

  const handleAdd = useCallback(async (name: string, role: string, color: string) => {
    // Dynamic import targeting the specific service file to avoid 'export *' resolution issues in barrel file
    const { addStaff } = await import('../services/staffService');
    await addStaff(name, role, color);
    onRefresh();
  }, [onRefresh]);

  const handleUpdate = useCallback(async (id: string, name: string, role: string, color: string, isActive: boolean) => {
    await updateStaff(id, name, role, color, isActive);
    onRefresh();
  }, [onRefresh]);

  const handleDelete = useCallback(async (targetStaff: Staff) => {
    if (!targetStaff) return;
    const id = targetStaff.id;

    // Helper for Hard Delete (No History)
    const executeHardDelete = async () => {
      setOpStatus('loading');
      setOpMessage('영구 삭제 중...');
      
      try {
        const res = await deleteStaff(id);
        if (res.success) {
           setOpStatus('success');
           setOpMessage('삭제 완료');
           await onRefresh();
        } else {
           throw new Error(res.message);
        }
      } catch (error: any) {
        console.error(error);
        setOpStatus('error');
        setOpMessage('오류 발생');
        alert("삭제 중 오류가 발생했습니다: " + (error.message || "알 수 없는 오류"));
      } finally {
        setTimeout(() => setOpStatus('idle'), 1000);
      }
    };

    // Helper for Soft Delete (Resignation + Clean Future)
    const executeSoftDelete = async () => {
      setOpStatus('loading');
      setOpMessage('퇴사 처리 및 배정 정리 중...'); 
      
      try {
        // 1. Soft Delete (Update Staff status to Inactive)
        const staffRes = await updateStaff(id, undefined, undefined, undefined, false);
        if (!staffRes.success) throw new Error(staffRes.message);

        // 2. Clean up FUTURE assignments (Tasks created > Now)
        // We use the current tasks list to identify which tasks need updating
        const now = new Date();
        const tasksToUpdate = tasksRef.current.filter(t => {
           // Check if task is in the future AND assigned to this staff
           const taskDate = new Date(t.createdAt);
           const isFuture = taskDate > now;
           const isAssigned = t.assigneeIds && t.assigneeIds.includes(id);
           return isFuture && isAssigned;
        });

        // Update tasks in parallel
        if (tasksToUpdate.length > 0) {
            const updates = tasksToUpdate.map(t => {
                const newAssignees = t.assigneeIds.filter(aid => aid !== id);
                return updateTask(t.id, { assigneeIds: newAssignees });
            });
            await Promise.all(updates);
        }

        setOpStatus('success');
        setOpMessage('퇴사 처리 완료');
        await onRefresh();

      } catch (error: any) {
        console.error(error);
        setOpStatus('error');
        setOpMessage('처리 실패');
        alert("처리 중 오류가 발생했습니다.");
      } finally {
        setTimeout(() => setOpStatus('idle'), 1000);
      }
    };

    // 1. Check Usage History
    const currentTasks = tasksRef.current || [];
    const currentTemplates = templatesRef.current || [];

    // Check past usage
    const usedInTasks = currentTasks.some(t => 
      (Array.isArray(t.assigneeIds) && t.assigneeIds.includes(id)) || 
      (Array.isArray(t.completedBy) && t.completedBy.includes(id))
    );
    const usedInTemplates = currentTemplates.some(t => 
      Array.isArray(t.assigneeIds) && t.assigneeIds.includes(id)
    );

    const hasHistory = usedInTasks || usedInTemplates;

    // 2. Execute Logic with Confirmation (Removed setTimeout to ensure it works on mobile)
    // Mobile browsers often block confirm/alert if not directly triggered by user event.
    if (hasHistory) {
      // CASE: History Exists -> Soft Delete + Clean Future
      if (window.confirm(
        `[기록 보존 알림] "${targetStaff.name}" 님의 과거 업무 기록이 존재합니다.\n\n` +
        `• 과거 기록: 보존됨\n` +
        `• 미래 배정: 모두 해제됨\n` +
        `• 직원 목록: '퇴사' 상태로 변경됨\n\n` +
        `위 내용대로 퇴사 처리하시겠습니까?`
      )) {
          await executeSoftDelete();
      }
    } else {
      // CASE: No History -> Hard Delete
      if (window.confirm(`"${targetStaff.name}" 직원을 영구 삭제하시겠습니까?\n(관련 기록이 없어 DB에서 즉시 제거됩니다)`)) {
        await executeHardDelete();
      }
    }

  }, [onRefresh]);

  return {
    handleAdd,
    handleUpdate,
    handleDelete,
    opStatus,
    opMessage
  };
};
