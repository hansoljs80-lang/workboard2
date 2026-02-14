
import React, { useState, useCallback } from 'react';
import { Task, Staff, Template, TaskStatus } from '../types';
import CompleteTaskModal from './CompleteTaskModal';
import StatusOverlay from './StatusOverlay';
import CalendarView from './CalendarView';
import KanbanView from './KanbanView';
import BoardHeader from './BoardHeader';
import BoardModals, { ModalMode } from './BoardModals';
import { useTaskFilter } from '../hooks/useTaskFilter';
import { useTaskInteraction } from '../hooks/useTaskInteraction';
import { addTask } from '../services/api';

interface BoardProps {
  tasks: Task[];
  staff: Staff[];
  templates?: Template[];
  onRefresh: () => void;
}

type ViewMode = 'day' | 'week' | 'month';

const Board: React.FC<BoardProps> = ({ tasks, staff, templates = [], onRefresh }) => {
  // UI State
  const [modalMode, setModalMode] = useState<ModalMode>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Logic Hooks - Removed templates dependency from filter
  const { filteredTasks, todoTasks, inProgressTasks, doneTasks } = useTaskFilter(tasks, staff, viewMode, currentDate);
  
  const { 
    handleRequestMove, 
    handleDirectComplete, // New handler
    handleDelete, 
    operationStatus, 
    operationMessage,
    completingTask, 
    setCompletingTask, 
    handleCompletionConfirm 
  } = useTaskInteraction({ tasks, filteredTasks, currentDate, onRefresh });

  // Navigation Logic
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'day') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      } else if (viewMode === 'week') {
        newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      } else if (viewMode === 'month') {
        newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      }
      return newDate;
    });
  }, [viewMode]);

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date);
    // 사용자 요청: 날짜 선택 시 그 날의 업무 내용을 볼 수 있도록 Day 모드로 자동 전환
    setViewMode('day');
  }, []);

  const handleTaskDoubleClick = useCallback((task: Task) => {
    setCurrentDate(new Date(task.createdAt));
    setViewMode('day');
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  }, []);

  const handleAddClick = useCallback(() => {
    setModalMode('choice');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalMode('none');
  }, []);

  const handleCloseCompletion = useCallback(() => {
    setCompletingTask(null);
  }, [setCompletingTask]);

  // Handler for adding task from draft
  const handleAddFromDraft = useCallback(async (template: Template) => {
    // Determine creation time (using current selected date + 9 AM)
    const dateToSave = new Date(currentDate);
    dateToSave.setHours(9, 0, 0, 0);

    try {
      const res = await addTask({
        title: template.title,
        description: template.description,
        status: TaskStatus.TODO,
        assigneeIds: template.assigneeIds, // Inherit default assignees
        createdAt: dateToSave.toISOString(),
        recurrenceType: 'none', // Ad-hoc instance has no recurrence rule itself
        sourceTemplateId: template.id
      });
      
      if (res.success) {
        onRefresh(); 
      } else {
        alert('추가 실패: ' + res.message);
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  }, [currentDate, onRefresh]);

  return (
    <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-950 relative">
      <StatusOverlay status={operationStatus} message={operationMessage} />

      <BoardHeader 
        currentDate={currentDate} 
        viewMode={viewMode} 
        onNavigate={navigateDate} 
        onViewChange={setViewMode} 
        onDateSelect={handleDateSelect}
      />

      {/* 
         Mobile: overflow-y-auto allowed on main area so vertical stacked columns can scroll.
         Added pb-24 to mobile to ensure content isn't hidden behind bottom sidebar.
         Desktop: overflow-hidden kept to ensure columns handle their own internal scrolling.
      */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 pb-24 md:pb-4 custom-scrollbar">
        {viewMode === 'day' ? (
          <KanbanView 
            todoTasks={todoTasks}
            inProgressTasks={inProgressTasks}
            doneTasks={doneTasks}
            staff={staff}
            onDelete={handleDelete}
            onMove={handleRequestMove}
            onDirectComplete={handleDirectComplete}
            onTaskDoubleClick={handleTaskDoubleClick}
            onAddClick={handleAddClick}
            onRefresh={onRefresh}
          />
        ) : (
          <CalendarView 
            viewMode={viewMode}
            currentDate={currentDate}
            tasks={filteredTasks}
            staff={staff}
            onTaskDoubleClick={handleTaskDoubleClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Extracted Creation Modals */}
      <BoardModals 
        mode={modalMode}
        onClose={handleCloseModal}
        setMode={setModalMode}
        staff={staff}
        currentDate={currentDate}
        onRefresh={onRefresh}
        templates={templates}
        onAddFromDraft={handleAddFromDraft}
      />

      {/* Task Completion Modal */}
      <CompleteTaskModal 
        isOpen={!!completingTask}
        task={completingTask}
        staff={staff}
        onClose={handleCloseCompletion}
        onConfirm={handleCompletionConfirm}
      />
    </div>
  );
};

export default Board;
