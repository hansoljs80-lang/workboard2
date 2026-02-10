
import React, { useState } from 'react';
import { Template, Staff, ScheduleConfig } from '../types';
import { Calendar, Repeat, Trash2, Edit2, CheckSquare, Square, StickyNote, PlayCircle } from 'lucide-react';
import { getRecurrenceTheme } from '../utils/styleUtils';
import AssigneeDisplay from './common/AssigneeDisplay';
import TaskGeneratorModal from './draft/TaskGeneratorModal';

interface DraftCardProps {
  template: Template;
  staff: Staff[];
  loading: boolean;
  onUse: (tmpl: Template, assignees: string[]) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void; 
  onEdit?: (tmpl: Template) => void;
  onRefresh?: () => void;
}

const DraftCard: React.FC<DraftCardProps> = ({ template, staff, loading, onDelete, onEdit, onRefresh }) => {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const getScheduleLabel = (config?: ScheduleConfig) => {
    if (!config) return '기본 설정 없음';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    
    // Helper for interval text
    const intervalTxt = config.intervalValue && config.intervalValue > 1 ? `${config.intervalValue}` : '';

    switch (config.type) {
      case 'none': return '단순 업무';
      case 'daily': return '매일';
      case 'weekly': 
      case 'biweekly': 
        // Logic for complex weekly
        const intervalW = config.intervalValue || (config.type === 'biweekly' ? 2 : 1);
        const prefix = intervalW > 1 ? `${intervalW}주마다 ` : '매주 ';
        
        // Handle weekDays array (New) or weekDay (Legacy)
        let dayNames = '';
        if (config.weekDays && config.weekDays.length > 0) {
            dayNames = config.weekDays.sort().map(d => days[d]).join(',');
        } else if (config.weekDay !== undefined) {
            dayNames = days[config.weekDay];
        } else {
            dayNames = '요일 미정';
        }
        return `${prefix}${dayNames}`;

      case 'monthly': 
        const intervalM = config.intervalValue || 1;
        const prefixM = intervalM > 1 ? `${intervalM}개월마다 ` : '매월 ';
        return `${prefixM}${config.monthDay}일`;
        
      case 'custom_days': return `${config.intervalValue}일 간격`;
      default: return '설정 없음';
    }
  };

  const scheduleLabel = getScheduleLabel(template.scheduleConfig);
  const theme = getRecurrenceTheme(template.scheduleConfig?.type);
  
  // Active/Inactive distinction removal -> Always active theme
  const cardStyle = theme.card;
  const titleStyle = theme.title;
  const badgeStyle = theme.badge;

  const renderDescription = () => {
    if (!template.description) {
       return <p className="text-[10px] text-slate-400 italic px-1">상세 내용 없음</p>;
    }
  
    const lines = template.description.split('\n');
    const hasChecklist = lines.some(l => l.trim().startsWith('- [ ]') || l.trim().startsWith('- [x]'));
  
    if (hasChecklist) {
      return (
        <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg max-h-[150px] overflow-y-auto custom-scrollbar pointer-events-auto">
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            const isUnchecked = trimmed.startsWith('- [ ]');
            const isChecked = trimmed.startsWith('- [x]');
            
            if (isUnchecked || isChecked) {
              const content = trimmed.substring(5).trim();
              return (
                 <div key={idx} className="flex items-start gap-1.5 py-0.5">
                    <div className={`mt-0.5 shrink-0 ${isChecked ? 'text-blue-500' : 'text-slate-400'}`}>
                      {isChecked ? <CheckSquare size={12} /> : <Square size={12} />}
                    </div>
                    <span className={`text-xs ${isChecked ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'} leading-snug`}>
                      {content}
                    </span>
                 </div>
              );
            } else {
               return (
                 <p key={idx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                   {line}
                 </p>
               );
            }
          })}
        </div>
      );
    }
  
    return (
       <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-2 rounded-lg leading-relaxed whitespace-pre-wrap pointer-events-auto">
         {template.description}
       </p>
    );
  };

  return (
    <>
      <div className="relative h-auto md:h-[100px] w-full group md:hover:z-[100]">
        <div className={`
          relative md:absolute top-0 left-0 right-0 min-h-full
          p-3 rounded-xl border transition-all duration-200 ease-out
          flex flex-col gap-2
          ${cardStyle}
          md:group-hover:shadow-2xl md:group-hover:bg-opacity-100
          dark:md:group-hover:bg-opacity-100
          md:group-hover:h-auto
          z-0
        `}>
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
             <h4 className={`
               font-bold text-sm leading-tight break-keep flex-1
               ${titleStyle}
             `}>
               {template.title}
             </h4>

             {scheduleLabel && (
               <div className={`
                 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border
                 ${badgeStyle}
               `}>
                 {template.scheduleConfig?.type === 'monthly' ? (
                   <Calendar size={10} />
                 ) : template.scheduleConfig?.type === 'none' ? (
                   <StickyNote size={10} />
                 ) : (
                   <Repeat size={10} />
                 )}
                 {scheduleLabel}
               </div>
             )}
          </div>

          {/* Description */}
          <div className="block md:hidden md:group-hover:block mt-1">
            {renderDescription()}
          </div>

          {/* Bottom Section */}
          <div className="mt-auto flex items-end justify-between pt-2 md:pt-0">
             <AssigneeDisplay 
               assigneeIds={template.assigneeIds || []} 
               staff={staff} 
               showNames={false} 
               compact={true} 
             />

             {/* Issue Button (Replaces Toggle) */}
             <button
                type="button"
                onClick={(e) => {
                   e.stopPropagation();
                   setTimeout(() => setIsGeneratorOpen(true), 10);
                }}
                disabled={loading}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shadow-sm shrink-0 z-20 relative touch-manipulation
                  bg-blue-600 hover:bg-blue-700 text-white active:scale-95 border border-blue-500
                `}
              >
                  <PlayCircle size={12} />
                  발급
              </button>
          </div>

          {/* Action Footer */}
          <div className={`
              flex items-center gap-2 pt-3 border-t border-slate-400/20 dark:border-slate-600/20 relative z-[50] bg-inherit rounded-b-xl
              opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200
          `}>
             {onEdit && (
                 <button
                   type="button"
                   onClick={(e) => {
                      e.stopPropagation();
                      if(!loading) {
                        setTimeout(() => onEdit(template), 10);
                      }
                   }}
                   disabled={loading}
                   className="relative flex-1 py-2 md:py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-95 touch-manipulation cursor-pointer pointer-events-auto disabled:opacity-50"
                 >
                    <Edit2 className="w-[14px] h-[14px] md:w-[12px] md:h-[12px]" /> 수정
                 </button>
             )}
             <button
               type="button"
               onClick={(e) => { 
                  e.stopPropagation();
                  // Removed setTimeout for delete action to ensure confirm dialog works
                  if(!loading) {
                    onDelete(template.id);
                  }
               }}
               disabled={loading}
               className="relative flex-1 py-2 md:py-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1 shadow-sm active:scale-95 touch-manipulation cursor-pointer pointer-events-auto disabled:opacity-50"
             >
               <Trash2 className="w-[14px] h-[14px] md:w-[12px] md:h-[12px]" /> 삭제
             </button>
          </div>
        </div>
      </div>

      <TaskGeneratorModal 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)}
        template={template}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};

export default React.memo(DraftCard);
