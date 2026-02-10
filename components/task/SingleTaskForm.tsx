
import React from 'react';
import { Calendar } from 'lucide-react';
import { Staff } from '../../types';
import DescriptionInput from '../common/DescriptionInput';
import AssigneeSelector from '../common/AssigneeSelector';

interface SingleTaskFormProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  assignees: string[];
  setAssignees: (val: string[]) => void;
  staff: Staff[];
}

const SingleTaskForm: React.FC<SingleTaskFormProps> = ({
  title, setTitle,
  description, setDescription,
  date, setDate,
  assignees, setAssignees,
  staff
}) => {
  return (
    <div className="p-5 space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1">업무명 (필수)</label>
        <input 
          autoFocus
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-900 dark:text-slate-100 font-bold"
          placeholder="예: 3번 베드 치료기 점검"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
          <Calendar size={12} /> 수행 날짜
        </label>
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200"
        />
      </div>

      {/* Description */}
      <DescriptionInput 
        value={description} 
        onChange={setDescription} 
        placeholder="상세 내용을 입력하세요."
      />

      {/* Assignee */}
      <AssigneeSelector 
        staff={staff}
        selectedIds={assignees}
        onChange={setAssignees}
      />
    </div>
  );
};

export default SingleTaskForm;
