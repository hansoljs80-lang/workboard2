
import React from 'react';
import { Template, Staff } from '../types';
import { ClipboardList, SearchX } from 'lucide-react';
import DraftCard from './DraftCard';

interface DraftListProps {
  templates: Template[];
  staff: Staff[];
  loading: boolean;
  onUseTemplate: (tmpl: Template, assignees: string[]) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onEdit?: (tmpl: Template) => void;
  hasActiveFilters?: boolean; 
  onRefresh?: () => void;
}

const DraftList: React.FC<DraftListProps> = ({ 
  templates, 
  staff, 
  loading, 
  onUseTemplate, 
  onDelete, 
  onToggleActive,
  onEdit,
  hasActiveFilters = false,
  onRefresh
}) => {
  
  if (templates.length === 0) {
    if (hasActiveFilters) {
      return (
        <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-600 bg-white/50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-slate-300 dark:border-slate-800">
          <SearchX size={48} className="mx-auto mb-3 opacity-20" />
          <p>검색 결과가 없습니다.</p>
          <p className="text-xs mt-1">검색어나 필터 조건을 변경해보세요.</p>
        </div>
      );
    }
    
    return (
      <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-600 bg-white/50 dark:bg-slate-900/50 rounded-xl border-dashed border-2 border-slate-300 dark:border-slate-800">
        <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
        <p>등록된 업무가 없습니다.</p>
        <p className="text-xs mt-1">상단 메뉴 '업무 등록'에서 자주 쓰는 업무를 등록하세요.</p>
      </div>
    );
  }

  // Changed gap from 4 to 3 for tighter packing
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-24">
      {templates.map((tmpl) => (
        <DraftCard 
          key={tmpl.id}
          template={tmpl}
          staff={staff}
          loading={loading}
          onUse={onUseTemplate}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
};

export default DraftList;
