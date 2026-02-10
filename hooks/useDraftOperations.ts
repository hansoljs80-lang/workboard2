
import { useState, useCallback } from 'react';
import { deleteTemplate, toggleTemplateActive } from '../services/api';
import { OperationStatus } from './useTaskOperations';

export const useDraftOperations = (onRefresh: () => void) => {
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm('이 업무 템플릿을 영구 삭제하시겠습니까?\n(이미 보드에 생성된 과거 기록은 유지됩니다)')) {
      setOpStatus('loading');
      setOpMessage('업무 템플릿 삭제 중...');
      
      try {
        const res = await deleteTemplate(id);
        if (res.success) {
          setOpStatus('success');
          setOpMessage('삭제 완료');
          await onRefresh();
        } else {
          throw new Error(res.message);
        }
      } catch (e: any) {
        console.error(e);
        setOpStatus('error');
        setOpMessage(e.message || '삭제 실패');
        alert("삭제 중 오류가 발생했습니다: " + (e.message || "알 수 없는 오류"));
      } finally {
        setTimeout(() => setOpStatus('idle'), 1000);
      }
    }
  }, [onRefresh]);

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    // If turning OFF, warn about effect
    if (!isActive && !window.confirm("자동 생성을 끄시겠습니까?\n오늘부터 이 업무는 보드에 자동 생성되지 않습니다.")) {
       return;
    }

    setOpStatus('loading');
    setOpMessage(isActive ? '자동 생성 활성화 중...' : '자동 생성 비활성화 중...');
    
    try {
      const res = await toggleTemplateActive(id, isActive);
      if (res.success) {
        setOpStatus('success');
        setOpMessage('설정 변경 완료');
        await onRefresh();
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      setOpStatus('error');
      setOpMessage('변경 실패');
      alert("설정 변경 실패: " + (e.message || "알 수 없는 오류"));
    } finally {
      setTimeout(() => setOpStatus('idle'), 500);
    }
  }, [onRefresh]);

  const handleEditorSuccess = useCallback(async () => {
     setOpStatus('success');
     setOpMessage('저장 완료');
     await onRefresh();
     setTimeout(() => setOpStatus('idle'), 1000);
  }, [onRefresh]);

  return {
    handleDelete,
    handleToggleActive,
    handleEditorSuccess,
    opStatus,
    opMessage
  };
};
