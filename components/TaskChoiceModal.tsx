
import React from 'react';
import { PenSquare, ClipboardList, X } from 'lucide-react';

interface TaskChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreate: () => void;
  onSelectDraft: () => void;
}

const TaskChoiceModal: React.FC<TaskChoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectCreate, 
  onSelectDraft 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">업무 추가 방식 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 grid gap-4">
          <button
            onClick={onSelectCreate}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all group text-left shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <PenSquare size={24} />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">새 업무 직접 입력</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">일회성 업무를 직접 작성하여 추가합니다.</p>
            </div>
          </button>

          <button
            onClick={onSelectDraft}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group text-left shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClipboardList size={24} />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-800 dark:text-slate-100">업무 목록에서 가져오기</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">등록된 템플릿을 선택하여 추가합니다. (중복 가능)</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskChoiceModal;
