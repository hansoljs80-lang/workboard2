
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ArrowUpDown, Check, Archive, ArrowDownAZ, ArrowUpWideNarrow, ArrowDownWideNarrow } from 'lucide-react';
import { RecurrenceType } from '../../types';
import { SortOrder } from '../../hooks/useDraftFiltering';

interface DraftFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFilters: RecurrenceType[];
  toggleFilter: (type: RecurrenceType) => void;
  onClear: () => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
}

const FILTER_OPTIONS: { id: RecurrenceType; label: string }[] = [
  { id: 'daily', label: '매일' },
  { id: 'custom_days', label: '간격' },
  { id: 'weekly', label: '매주' },
  { id: 'biweekly', label: '격주' },
  { id: 'monthly', label: '매월' },
  { id: 'none', label: '일반' },
];

const SORT_OPTIONS: { id: SortOrder; label: string; icon: React.ReactNode }[] = [
  { id: 'priority', label: '중요도 순', icon: <ArrowUpDown size={14} /> },
  { id: 'name', label: '이름 순', icon: <ArrowDownAZ size={14} /> },
  { id: 'frequency-asc', label: '주기 짧은 순 (자주)', icon: <ArrowUpWideNarrow size={14} /> },
  { id: 'frequency-desc', label: '주기 긴 순 (가끔)', icon: <ArrowDownWideNarrow size={14} /> },
];

const DraftFilterBar: React.FC<DraftFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedFilters,
  toggleFilter,
  onClear,
  sortOrder,
  setSortOrder,
  showArchived,
  setShowArchived
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFilterCount = selectedFilters.length;
  
  // Get current sort label
  const currentSortLabel = SORT_OPTIONS.find(s => s.id === sortOrder)?.label || '정렬';

  return (
    <div className="mb-6 space-y-3 relative z-30">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="업무명 또는 내용 검색..."
          className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100 shadow-sm transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter/Sort Controls - Removed overflow-x-auto to prevent clipping of dropdowns */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Sort Dropdown */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-all whitespace-nowrap
                ${sortOrder !== 'priority'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
              `}
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'priority' ? '정렬' : currentSortLabel.split(' ')[0]} 
            </button>

            {isSortOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-2 animate-fade-in-up">
                <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-1">정렬 기준</div>
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSortOrder(option.id);
                      setIsSortOpen(false);
                    }}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                      ${sortOrder === option.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                       {option.icon}
                       {option.label}
                    </div>
                    {sortOrder === option.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-all whitespace-nowrap
                ${activeFilterCount > 0 || isFilterOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
              `}
            >
              <Filter size={16} />
              필터
              {activeFilterCount > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[10px]">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-2 animate-fade-in-up">
                <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-1">반복 유형 선택</div>
                {FILTER_OPTIONS.map((option) => {
                  const isSelected = selectedFilters.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleFilter(option.id)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                      `}
                    >
                      {option.label}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Archive Toggle */}
          <button
             onClick={() => setShowArchived(!showArchived)}
             className={`
               flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-all whitespace-nowrap
               ${showArchived 
                 ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' 
                 : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}
             `}
             title="이전 버전(비활성) 보기"
          >
             <Archive size={16} />
             {showArchived ? '보관됨 표시' : '보관됨 숨김'}
          </button>
        </div>

        {/* Clear Button */}
        {(activeFilterCount > 0 || searchQuery || sortOrder !== 'priority' || showArchived) && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-500 underline decoration-slate-300 dark:decoration-slate-700 transition-colors whitespace-nowrap"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(DraftFilterBar);
