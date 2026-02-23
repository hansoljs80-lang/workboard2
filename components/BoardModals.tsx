
import React from 'react';
import { Staff, Template } from '../types';
import TaskChoiceModal from './TaskChoiceModal';
import NewTaskModal from './NewTaskModal';
import DraftSelectionModal from './DraftSelectionModal';

export type ModalMode = 'none' | 'choice' | 'create' | 'draft';

interface BoardModalsProps {
  mode: ModalMode;
  onClose: () => void;
  setMode: (mode: ModalMode) => void;
  staff: Staff[];
  currentDate: Date;
  onRefresh: () => void;
  templates: Template[];
  onAddFromDraft: (template: Template) => Promise<void>;
}

const BoardModals: React.FC<BoardModalsProps> = ({
  mode,
  onClose,
  setMode,
  staff,
  currentDate,
  onRefresh,
  templates,
  onAddFromDraft
}) => {
  return (
    <>
      {/* 1. Choice Modal */}
      <TaskChoiceModal 
        isOpen={mode === 'choice'}
        onClose={onClose}
        onSelectCreate={() => setMode('create')}
        onSelectDraft={() => setMode('draft')}
      />

      {/* 2. Create New Task Modal (Direct) */}
      <NewTaskModal 
        isOpen={mode === 'create'} 
        onClose={onClose} 
        onSuccess={onRefresh} 
        staff={staff}
        initialDate={currentDate}
      />

      {/* 3. Draft Selection Modal */}
      <DraftSelectionModal
        isOpen={mode === 'draft'}
        onClose={onClose}
        templates={templates}
        staff={staff}
        onSelect={onAddFromDraft}
      />
    </>
  );
};

export default React.memo(BoardModals);
