
import React, { useState } from 'react';
import { Template, Staff } from '../types';
import { ClipboardList, Plus } from 'lucide-react';
import DraftList from './DraftList';
import StatusOverlay from './StatusOverlay';
import DraftFilterBar from './draft/DraftFilterBar';
import DraftEditorModal from './draft/DraftEditorModal';
import TaskGeneratorModal from './draft/TaskGeneratorModal';
import { useDraftFiltering } from '../hooks/useDraftFiltering';
import { useDraftOperations } from '../hooks/useDraftOperations';

interface DraftManagerProps {
  templates: Template[];
  staff: Staff[];
  onRefresh: () => void;
  onNavigateToBoard: () => void;
}

const DraftManager: React.FC<DraftManagerProps> = ({ templates, staff, onRefresh, onNavigateToBoard }) => {
  // Logic Hooks
  const { 
    handleDelete, 
    handleToggleActive, 
    handleEditorSuccess, 
    opStatus, 
    opMessage 
  } = useDraftOperations(onRefresh);

  const { 
    searchQuery, 
    setSearchQuery, 
    selectedFilters, 
    toggleFilter, 
    clearFilters,
    processedTemplates, 
    hasActiveFilters,
    sortOrder,
    setSortOrder,
    showArchived,
    setShowArchived
  } = useDraftFiltering(templates);

  // Editor Modal State (Create & Edit)
  const [editorState, setEditorState] = useState<{ isOpen: boolean; template: Template | null }>({
    isOpen: false,
    template: null
  });

  // Generator Modal State (Immediate Issue after Save)
  const [generatorState, setGeneratorState] = useState<{ isOpen: boolean; template: Template | null }>({
    isOpen: false,
    template: null
  });

  const openCreateModal = () => setEditorState({ isOpen: true, template: null });
  const openEditModal = (tmpl: Template) => setEditorState({ isOpen: true, template: tmpl });
  const closeEditorModal = () => setEditorState({ ...editorState, isOpen: false });

  // Wrapper for editor success to handle "Save & Issue"
  const onEditorSuccess = async (savedTemplate?: Template, shouldIssue?: boolean) => {
    await handleEditorSuccess();
    
    if (shouldIssue && savedTemplate) {
      // Close Editor and Open Generator
      closeEditorModal();
      setTimeout(() => {
        setGeneratorState({ isOpen: true, template: savedTemplate });
      }, 100);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full h-full overflow-y-auto pb-24 relative bg-slate-50 dark:bg-slate-950">
      <StatusOverlay status={opStatus} message={opMessage} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-300 dark:border-slate-700">
            <ClipboardList className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">업무 목록</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                자주 쓰는 업무를 등록하고, 필요한 만큼 일괄 발급(생성)합니다.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
          >
            <Plus size={20} />
            새 업무 등록
          </button>
        </div>
      </div>

      <DraftFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFilters={selectedFilters}
        toggleFilter={toggleFilter}
        onClear={clearFilters}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        showArchived={showArchived}
        setShowArchived={setShowArchived}
      />

      <div className="grid grid-cols-1 gap-8">
        <DraftList 
          templates={processedTemplates} 
          staff={staff} 
          loading={opStatus === 'loading'} 
          onUseTemplate={() => {}} 
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onEdit={openEditModal}
          hasActiveFilters={hasActiveFilters}
          onRefresh={onRefresh}
        />
      </div>

      {/* Editor Modal (Create/Edit) */}
      <DraftEditorModal 
        isOpen={editorState.isOpen}
        onClose={closeEditorModal}
        onSuccess={onEditorSuccess}
        staff={staff}
        initialData={editorState.template}
      />

      {/* Generator Modal (Immediate Issue) */}
      {generatorState.template && (
        <TaskGeneratorModal
          isOpen={generatorState.isOpen}
          onClose={() => setGeneratorState({ isOpen: false, template: null })}
          template={generatorState.template}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default DraftManager;
