
import React, { useState, useMemo } from 'react';
import { Search, X, Plus, CheckCircle2, Calendar, Repeat } from 'lucide-react';
import { Template, Staff } from '../types';
import { getRecurrenceBadge } from '../utils/styleUtils';
import AssigneeDisplay from './common/AssigneeDisplay';

interface DraftSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: Template[];
  onSelect: (template: Template) => Promise<void>;
  staff: Staff[];
}

const DraftSelectionModal: React.FC<DraftSelectionModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelect,
  staff
}) => {
  const [query, setQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Filter templates: Show Active only by default, match search
  const filteredTemplates = useMemo(() => {
    const q = query.toLowerCase();
    return templates
      .filter(t => t.isActive !== false) // Only active templates
      .filter(t => t.title.toLowerCase().includes(q));
  }, [templates, query]);

  const handleSelect = async (template: Template) => {
    setProcessingId(template.id);
    try {
      await onSelect(template);
      
      // Show success state
      setAddedIds(prev => {
        const next = new Set(prev);
        next.add(template.id);
        return next;
      });

      // Reset success indicator after 2 seconds
      setTimeout(() => {
        setAddedIds(prev => {
          const next = new Set(prev);
          next.delete(template.id);
          return next;
        });
      }, 2000);
      
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">업무 목록에서 추가</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">자주 쓰는 업무를 선택하여 보드에 즉시 추가합니다.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="업무명 검색..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 flex-1 bg-slate-50/50 dark:bg-black/20 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTemplates.map(tmpl => {
              const badge = getRecurrenceBadge(tmpl.scheduleConfig?.type, tmpl.scheduleConfig?.intervalValue);
              const isProcessing = processingId === tmpl.id;
              const isAdded = addedIds.has(tmpl.id);

              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl)}
                  disabled={isProcessing}
                  className={`
                    relative text-left p-3 rounded-xl border transition-all duration-200 group
                    flex flex-col gap-2 bg-white dark:bg-slate-800
                    ${isAdded 
                      ? 'border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'}
                  `}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1 min-w-0 pr-2">
                       <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                         {tmpl.title}
                       </h4>
                       <div className="flex items-center gap-2 mt-1.5">
                         {badge && (
                           <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 flex items-center gap-1 ${badge.className}`}>
                             <Repeat size={10} /> {badge.label}
                           </span>
                         )}
                         <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar size={10} />
                            템플릿
                         </span>
                       </div>
                    </div>
                    
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm
                      ${isAdded 
                        ? 'bg-green-500 text-white scale-110' 
                        : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white'}
                    `}>
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : isAdded ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[60%]">
                       {tmpl.description || '내용 없음'}
                     </p>
                     <AssigneeDisplay assigneeIds={tmpl.assigneeIds || []} staff={staff} showNames={false} compact />
                  </div>
                </button>
              );
            })}
            
            {filteredTemplates.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-400">
                  검색 결과가 없습니다.
               </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftSelectionModal;
