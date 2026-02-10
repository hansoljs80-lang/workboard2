
import React, { useState, useEffect } from 'react';
import { RecurrenceType, ScheduleConfig, Template, Staff } from '../types';
import { addTemplate, updateTemplate } from '../services/api';
import ScheduleSelector from './draft/ScheduleSelector';
import DescriptionInput from './common/DescriptionInput';
import AssigneeSelector from './common/AssigneeSelector';
import { PlayCircle, Save } from 'lucide-react';

interface DraftFormProps {
  initialData?: Template;
  staff: Staff[];
  onSuccess: (savedTemplate?: Template, shouldIssue?: boolean) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

const DraftForm: React.FC<DraftFormProps> = ({ initialData, staff, onSuccess, setLoading, loading }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Scheduling State
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [customInterval, setCustomInterval] = useState<number>(1);
  const [weekDays, setWeekDays] = useState<number[]>([1]); // Default Monday
  const [monthDay, setMonthDay] = useState<number>(1);
  
  // Assignee State
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  // Initialize form with initialData if present
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setSelectedAssignees(initialData.assigneeIds || []);

      // Parse Schedule
      const config = initialData.scheduleConfig;
      if (config) {
        setRecurrence(config.type);
        setCustomInterval(config.intervalValue || 1);
        
        // Handle weekDays (support legacy weekDay)
        if (config.weekDays && config.weekDays.length > 0) {
          setWeekDays(config.weekDays);
        } else if (config.weekDay !== undefined) {
          setWeekDays([config.weekDay]);
        }
        
        if (config.monthDay !== undefined) setMonthDay(config.monthDay);
      }
    } else {
      setSelectedAssignees([]);
    }
  }, [initialData]);

  const handleSave = async (shouldIssue: boolean = false) => {
    if (!title.trim()) return;
    
    // Validation for weekly
    if (recurrence === 'weekly' && weekDays.length === 0) {
        alert("요일을 최소 1개 이상 선택해주세요.");
        return;
    }

    setLoading(true);

    const scheduleConfig: ScheduleConfig = { 
        type: recurrence,
        intervalValue: customInterval,
        weekDays: recurrence === 'weekly' ? weekDays : undefined,
        monthDay: recurrence === 'monthly' ? monthDay : undefined
    };

    try {
      let savedTemplate: Template | undefined;

      if (initialData) {
        // VERSIONING LOGIC:
        // 1. Mark old template as Inactive
        await updateTemplate(
          initialData.id,
          undefined, undefined, undefined, false, undefined
        );

        // 2. Create NEW template (Active)
        const response = await addTemplate(
          title, 
          description, 
          scheduleConfig, 
          selectedAssignees
        );
        
        if (response.success && response.data) {
          savedTemplate = response.data;
        } else {
           throw new Error(response.message || "수정 실패");
        }

      } else {
        // Create New
        const response = await addTemplate(
          title, 
          description, 
          scheduleConfig, 
          selectedAssignees
        );
        
        if (response.success && response.data) {
          savedTemplate = response.data;
        } else {
           throw new Error(response.message || "생성 실패");
        }
      }
      
      if (savedTemplate) {
        if (!initialData) {
          // Clear form if it was a new creation
          setTitle('');
          setDescription('');
          setRecurrence('none');
          setCustomInterval(1);
          setWeekDays([1]);
          setMonthDay(1);
          setSelectedAssignees([]);
        }
        onSuccess(savedTemplate, shouldIssue);
      } 
    } catch (error: any) {
      console.error(error);
      alert("오류가 발생했습니다: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 w-full">
           <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">업무명 (필수)</label>
           <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-900 dark:text-slate-100 font-bold text-lg placeholder:font-normal"
            placeholder="예: 치료실 대청소"
            autoFocus={!initialData}
          />
        </div>
      </div>
      
      {/* Description Input */}
      <DescriptionInput 
        value={description} 
        onChange={setDescription} 
        placeholder="업무 진행 시 체크해야 할 사항 등을 자유롭게 입력하세요."
      />

      {/* Schedule Selector */}
      <ScheduleSelector 
        recurrence={recurrence}
        setRecurrence={setRecurrence}
        customInterval={customInterval}
        setCustomInterval={setCustomInterval}
        weekDays={weekDays}
        setWeekDays={setWeekDays}
        monthDay={monthDay}
        setMonthDay={setMonthDay}
        // Legacy stubs
        weekDay={1} setWeekDay={() => {}} 
      />

      {/* Assignee Selector */}
      <AssigneeSelector 
        staff={staff}
        selectedIds={selectedAssignees}
        onChange={setSelectedAssignees}
      />

      {initialData && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-lg">
          💡 <strong>수정 모드 알림:</strong> 내용을 수정하면 기존 업무 기록 보존을 위해 <strong>오늘부터 적용되는 새 버전</strong>이 생성됩니다.
        </div>
      )}

      <div className="pt-4 flex flex-col md:flex-row gap-3">
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={loading || !title}
          className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {loading ? '저장 중...' : '저장만 하기'}
        </button>
        
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={loading || !title}
          className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 dark:shadow-none hover:translate-y-[-2px] flex items-center justify-center gap-2"
        >
          {loading ? '처리 중...' : '저장 후 바로 발급'}
          <PlayCircle size={18} />
        </button>
      </div>
    </div>
  );
};

export default DraftForm;
