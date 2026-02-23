
import React, { useRef, useEffect } from 'react';

export interface TabOption<T> {
  value: T;
  label: string;
  icon: React.ReactNode;
  activeColorClass: string;
}

interface MobileTabSelectorProps<T> {
  activeTab: T;
  onTabChange: (tab: T) => void;
  tabs: TabOption<T>[];
}

const MobileTabSelector = <T extends string>({ activeTab, onTabChange, tabs }: MobileTabSelectorProps<T>) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (scrollRef.current) {
      // Simple scroll logic, can be enhanced
    }
  }, [activeTab]);

  return (
    <div 
      ref={scrollRef}
      className="md:hidden flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 shrink-0 overflow-x-auto custom-scrollbar gap-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap min-w-[100px]
              ${isActive 
                ? `${tab.activeColorClass} shadow-sm` 
                : 'text-slate-400 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default MobileTabSelector;
