
import React from 'react';
import { ArrowRight, Copy } from 'lucide-react';
import { Staff } from '../../types';
import { GenerationConfig } from '../../utils/taskGenerationUtils';
import DescriptionInput from '../common/DescriptionInput';
import AssigneeSelector from '../common/AssigneeSelector';
import ScheduleSelector from '../draft/ScheduleSelector';

interface BulkTaskFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  assignees: string[];
  setAssignees: (val: string[]) => void;
  staff: Staff[];
  
  genConfig: GenerationConfig;
  setGenConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  copiesPerDay: number;
  setCopiesPerDay: (val: number) => void;
  previewCount: number;
}

const BulkTaskForm: React.FC<BulkTaskFormProps> = ({
  title, setTitle,
  description, setDescription,
  assignees, setAssignees,
  staff,
  genConfig, setGenConfig,
  copiesPerDay, setCopiesPerDay,
  previewCount
}) => {
  return (
    <div className="p-5 space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">업무명 (필수)</label>
        <input 
          autoFocus
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-900 dark:text-slate-100 font-bold"
          placeholder="예: 치료실 대청소"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {/* Reuse ScheduleSelector logic */}
        <ScheduleSelector
           recurrence={genConfig.frequency as any}
           setRecurrence={(type) => {
              let freq: any = type;
              if (type === 'biweekly') {
                  freq = 'weekly';
                  setGenConfig(prev => ({ ...prev, frequency: freq, interval: 2 }));
              } else {
                  setGenConfig(prev => ({ ...prev, frequency: freq, interval: 1 }));
              }
           }}
           customInterval={genConfig.interval}
           setCustomInterval={(val) => setGenConfig(prev => ({ ...prev, interval: val }))}
           weekDays={genConfig.weekDays}
           setWeekDays={(days) => setGenConfig(prev => ({ ...prev, weekDays: days }))}
           monthDay={genConfig.monthDay}
           setMonthDay={(val) => setGenConfig(prev => ({ ...prev, monthDay: val }))}
           weekDay={1} setWeekDay={() => {}}
        />
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500">생성 범위 설정</span>
              <span className="text-xs text-blue-600 font-bold bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                 예상: {previewCount}건
              </span>
           </div>
           
           <div className="flex gap-2 items-end mb-4">
               <div className="flex-1">
                   <label className="block text-[10px] text-slate-400 mb-1">시작일</label>
                   <input 
                       type="date"
                       value={genConfig.startDate.toISOString().split('T')[0]}
                       onChange={(e) => setGenConfig({...genConfig, startDate: new Date(e.target.value)})}
                       className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                   />
               </div>
               <div className="pb-2 text-slate-400"><ArrowRight size={16} /></div>
               <div className="flex-1">
                   <label className="block text-[10px] text-slate-400 mb-1">종료일</label>
                   <input 
                       type="date"
                       value={genConfig.endDate ? genConfig.endDate.toISOString().split('T')[0] : ''}
                       onChange={(e) => setGenConfig({...genConfig, endDate: new Date(e.target.value)})}
                       className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                   />
               </div>
           </div>

           {/* Copies Per Day */}
           <div>
             <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
               <Copy size={12} /> 하루 생성 개수
             </label>
             <div className="flex items-center gap-2">
               <input 
                 type="number" 
                 min="1" 
                 max="20"
                 value={copiesPerDay}
                 onChange={(e) => setCopiesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                 className="w-full p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200"
               />
               <span className="text-sm font-bold text-slate-400 whitespace-nowrap">개씩 생성</span>
             </div>
           </div>
        </div>
      </div>

      <DescriptionInput 
        value={description} 
        onChange={setDescription} 
        placeholder="상세 내용을 입력하세요."
      />

      <AssigneeSelector 
         staff={staff}
         selectedIds={assignees}
         onChange={setAssignees}
      />
    </div>
  );
};

export default BulkTaskForm;
