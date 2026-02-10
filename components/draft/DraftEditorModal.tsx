
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Template, Staff } from '../../types';
import DraftForm from '../DraftForm';

interface DraftEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedTemplate?: Template, shouldIssue?: boolean) => void;
  staff: Staff[];
  initialData?: Template | null;
}

const DraftEditorModal: React.FC<DraftEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  staff, 
  initialData 
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-fade-in-up">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
             <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {initialData ? '업무 템플릿 수정' : '새 업무 템플릿 등록'}
             </h3>
             <button 
               onClick={onClose}
               className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
               disabled={loading}
             >
               <X size={24} />
             </button>
          </div>
          <div className="overflow-y-auto p-0 flex-1 custom-scrollbar">
             <DraftForm 
               initialData={initialData || undefined}
               staff={staff}
               onSuccess={(savedTemplate, shouldIssue) => {
                 onSuccess(savedTemplate, shouldIssue);
                 if (!shouldIssue) {
                   onClose();
                 }
               }}
               loading={loading}
               setLoading={setLoading}
             />
          </div>
       </div>
    </div>
  );
};

export default DraftEditorModal;
