
import React, { useState, useEffect } from 'react';
import { Staff, TaskStatus } from '../types';
import { addTask, createBulkTasks } from '../services/api';
import { X, Calendar, Layers, CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { calculateGenerationDates, GenerationConfig } from '../utils/taskGenerationUtils';
import SingleTaskForm from './task/SingleTaskForm';
import BulkTaskForm from './task/BulkTaskForm';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff: Staff[];
  initialDate?: Date;
}

const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose, onSuccess, staff, initialDate }) => {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [step, setStep] = useState<'form' | 'processing' | 'complete'>('form');
  
  // Common State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  // Single Mode State
  const [singleDate, setSingleDate] = useState<string>('');

  // Bulk Mode State
  const [genConfig, setGenConfig] = useState<GenerationConfig>({
    mode: 'period', // Bulk tab implies period/multiple
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    count: 10,
    limitType: 'date',
    frequency: 'daily',
    interval: 1,
    weekDays: [1],
    monthDay: 1
  });
  
  const [copiesPerDay, setCopiesPerDay] = useState<number>(1);
  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [resultSummary, setResultSummary] = useState<{ count: number } | null>(null);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setMode('single');
      setTitle('');
      setDesc('');
      setSelectedAssignees([]);
      setResultSummary(null);
      setCopiesPerDay(1);

      const d = initialDate ? new Date(initialDate) : new Date();
      setSingleDate(d.toISOString().split('T')[0]);
      
      setGenConfig(prev => ({
        ...prev,
        startDate: d,
        endDate: new Date(new Date(d).setMonth(d.getMonth() + 1)),
        frequency: 'daily',
        interval: 1,
        weekDays: [d.getDay()], // Start with current day selected
        monthDay: d.getDate()
      }));
    }
  }, [isOpen, initialDate]);

  // Calculate Preview for Bulk
  useEffect(() => {
    if (mode === 'bulk') {
      const dates = calculateGenerationDates(genConfig);
      setPreviewDates(dates);
    }
  }, [genConfig, mode]);

  const handleClose = () => {
    if (step === 'complete') {
        onSuccess();
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    setStep('processing');

    try {
      if (mode === 'single') {
        // 1. Single Task Creation
        const targetDate = new Date(singleDate);
        targetDate.setHours(9, 0, 0, 0); // Default 9 AM

        const res = await addTask({
          title,
          description: desc,
          status: TaskStatus.TODO,
          assigneeIds: selectedAssignees,
          createdAt: targetDate.toISOString(),
          recurrenceType: 'none'
        });

        if (!res.success) throw new Error(res.message);
        setResultSummary({ count: 1 });

      } else {
        // 2. Bulk Task Creation (with copies support)
        if (previewDates.length === 0) return;

        const tasksToCreate = [];
        for (const date of previewDates) {
          for (let i = 0; i < copiesPerDay; i++) {
             tasksToCreate.push({
                title,
                description: desc,
                status: TaskStatus.TODO,
                assigneeIds: selectedAssignees,
                createdAt: date.toISOString(),
                recurrenceType: 'none', // Created directly, so treated as individual tasks
                sourceTemplateId: undefined // Not linked to a template
             });
          }
        }

        const res = await createBulkTasks(tasksToCreate);
        
        if (!res.success) throw new Error(res.message);
        setResultSummary({ count: tasksToCreate.length });
      }
      
      // Success Transition
      setTimeout(() => {
        setStep('complete');
        onSuccess(); // Refresh data in background
      }, 500);

    } catch (e: any) {
      console.error(e);
      alert('오류 발생: ' + e.message);
      setStep('form');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center shrink-0">
           <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
             {step === 'complete' ? '생성 완료' : '새 업무 발급'}
           </h3>
           <button 
             onClick={handleClose}
             className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
           >
             <X size={24} />
           </button>
        </div>

        {/* PROCESSING STATE */}
        {step === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[300px]">
             <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
             <p className="text-slate-600 dark:text-slate-300 font-bold">업무를 생성하고 있습니다...</p>
          </div>
        )}

        {/* COMPLETE STATE */}
        {step === 'complete' && resultSummary && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce-short">
              <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">발급 완료!</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
               총 <strong className="text-blue-600 dark:text-blue-400">{resultSummary.count}건</strong>의 업무가 등록되었습니다.
            </p>
            <button 
              onClick={handleClose}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
            >
              확인
            </button>
          </div>
        )}

        {/* FORM STATE */}
        {step === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {/* Tab Switcher */}
               <div className="flex border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                 <button
                   onClick={() => setMode('single')}
                   className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${
                     mode === 'single' 
                       ? 'text-blue-600 dark:text-blue-400' 
                       : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   <Calendar size={16} /> 단건 등록
                   {mode === 'single' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                 </button>
                 <button
                   onClick={() => setMode('bulk')}
                   className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors relative ${
                     mode === 'bulk' 
                       ? 'text-blue-600 dark:text-blue-400' 
                       : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   <Layers size={16} /> 반복/일괄 발급
                   {mode === 'bulk' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                 </button>
               </div>

               {/* Render split components */}
               {mode === 'single' ? (
                 <SingleTaskForm 
                    title={title} setTitle={setTitle}
                    description={desc} setDescription={setDesc}
                    date={singleDate} setDate={setSingleDate}
                    assignees={selectedAssignees} setAssignees={setSelectedAssignees}
                    staff={staff}
                 />
               ) : (
                 <BulkTaskForm 
                    title={title} setTitle={setTitle}
                    description={desc} setDescription={setDesc}
                    assignees={selectedAssignees} setAssignees={setSelectedAssignees}
                    staff={staff}
                    genConfig={genConfig} setGenConfig={setGenConfig}
                    copiesPerDay={copiesPerDay} setCopiesPerDay={setCopiesPerDay}
                    previewCount={previewDates.length * copiesPerDay}
                 />
               )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-3 shrink-0">
              <button 
                onClick={handleClose}
                className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!title || (mode === 'bulk' && previewDates.length === 0)}
                className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mode === 'single' ? '업무 등록' : `${previewDates.length * copiesPerDay}건 일괄 발급`}
                {mode === 'bulk' && <PlayCircle size={18} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NewTaskModal;
