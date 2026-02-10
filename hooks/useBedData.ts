
import { useState, useEffect, useCallback } from 'react';
import { BedData, BedConfig, TaskStatus, Task } from '../types';
import { updateSetting, addTask, updateTask } from '../services/api';
import { getDefaultBedConfig, initializeBeds, getNextRoutineDate } from '../utils/bedUtils';
import { OperationStatus } from '../components/StatusOverlay';

const SETTING_KEY = 'bed_manager_data';

export const useBedData = (settings: Record<string, any>, tasks: Task[], onRefresh: () => void) => {
  const [beds, setBeds] = useState<BedData[]>([]);
  const [config, setConfig] = useState<BedConfig>(getDefaultBedConfig());
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');

  // 1. Initial Load
  useEffect(() => {
    if (settings && settings[SETTING_KEY]) {
      try {
        const parsed = JSON.parse(settings[SETTING_KEY]);
        if (parsed.config) setConfig(parsed.config);
        
        if (parsed.beds && Array.isArray(parsed.beds)) {
          setBeds(parsed.beds);
        } else {
          setBeds(initializeBeds(parsed.config?.count || 10));
        }
      } catch (e) {
        console.error("Failed to parse bed data", e);
        setBeds(initializeBeds(10));
      }
    } else {
      setBeds(initializeBeds(10));
    }
  }, [settings]);

  // 2. Save Helper
  const saveData = async (newBeds: BedData[], newConfig: BedConfig) => {
    const payload = JSON.stringify({ beds: newBeds, config: newConfig });
    await updateSetting(SETTING_KEY, payload);
    onRefresh();
  };

  // 3. Action: Manual Change (Reset Timer & Sync Checklist)
  const handleBedChange = async (bedId: number, staffIds: string[]) => {
    setOpStatus('loading');
    setOpMessage('교체 기록 업데이트 중...');
    
    try {
      const today = new Date().toISOString();
      const bedName = beds.find(b => b.id === bedId)?.name || `${bedId}번 베드`;
      
      const updatedBeds = beds.map(b => 
        b.id === bedId ? { ...b, lastChanged: today, lastChangedBy: staffIds } : b
      );
      
      // Optimistic Update
      setBeds(updatedBeds); 
      
      // Save to Settings (JSON Storage)
      const payload = JSON.stringify({ beds: updatedBeds, config });
      await updateSetting(SETTING_KEY, payload);
      
      // 3.1 Create Audit Task (Log)
      await addTask({
        title: `${bedName} 커버 교체`,
        description: '배드 관리 탭에서 수동 교체 기록됨',
        status: TaskStatus.DONE,
        assigneeIds: [],
        completedBy: staffIds,
        createdAt: today,
        recurrenceType: 'none'
      });

      // 3.2 Sync with Active Routine Task (Dynamic Checklist Update)
      // Find active routine task regardless of its scheduled date (can be today or future)
      if (tasks) {
        const activeRoutineTask = tasks.find(t => 
           t.title.includes('베드 커버 정기 교체') && 
           (t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS)
        );

        if (activeRoutineTask && activeRoutineTask.description) {
           const lines = activeRoutineTask.description.split('\n');
           let updated = false;
           const newLines = lines.map(line => {
              // Match line that contains bed name and is an unchecked checklist item
              if (line.includes(bedName) && line.trim().startsWith('- [ ]')) {
                 updated = true;
                 return line.replace('- [ ]', '- [x]') + ` (미리 교체됨: ${new Date().toLocaleDateString()})`;
              }
              return line;
           });

           if (updated) {
              await updateTask(activeRoutineTask.id, { description: newLines.join('\n') });
           }
        }
      }

      setOpStatus('success');
      setOpMessage('교체 완료!');
      onRefresh(); // Sync with server
    } catch (e) {
      console.error(e);
      setOpStatus('error');
      setOpMessage('저장 실패');
    } finally {
      setTimeout(() => setOpStatus('idle'), 1000);
    }
  };

  // 4. Action: Rename Bed
  const updateBedName = async (bedId: number, newName: string) => {
    // UI Local Update first
    const updatedBeds = beds.map(b => 
      b.id === bedId ? { ...b, name: newName } : b
    );
    setBeds(updatedBeds);

    // Silent Save
    try {
      const payload = JSON.stringify({ beds: updatedBeds, config });
      await updateSetting(SETTING_KEY, payload);
    } catch (e) {
      console.error("Failed to save bed name", e);
    }
  };

  // 5. Action: Generate Routine
  const handleGenerateRoutine = async (onNavigate: () => void) => {
    setOpStatus('loading');
    setOpMessage('정기 교체 업무 생성 중...');

    try {
      // Calculate target date based on configured routine day
      const targetDate = getNextRoutineDate(config.routineDay);
      targetDate.setHours(9, 0, 0, 0); // Set to 9 AM of that day

      const needsChange: string[] = [];
      const recentlyChanged: string[] = [];
      const RECENT_THRESHOLD = 2 * 24 * 60 * 60 * 1000; // 2 days

      beds.forEach(bed => {
        if (!bed.lastChanged) {
          needsChange.push(`- [ ] ${bed.name}`);
        } else {
          const lastDate = new Date(bed.lastChanged);
          // Check difference relative to the TARGET date, not necessarily today
          const diff = targetDate.getTime() - lastDate.getTime();
          
          if (diff < RECENT_THRESHOLD && diff >= 0) {
             recentlyChanged.push(`- [x] ${bed.name} (최근 교체됨: ${lastDate.toLocaleDateString()})`);
          } else {
             needsChange.push(`- [ ] ${bed.name}`);
          }
        }
      });

      // Format date for title: "10월 24일 목요일"
      const dateStr = targetDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
      const title = `베드 커버 정기 교체 (${dateStr})`;

      const description = [
        `정기 베드 커버 교체 업무입니다. (${dateStr})`,
        '',
        '**교체 대상:**',
        ...needsChange,
        '',
        recentlyChanged.length > 0 ? '**최근 교체 완료 (건너뛰기 가능):**' : '',
        ...recentlyChanged
      ].join('\n');

      await addTask({
        title,
        description,
        status: TaskStatus.TODO,
        assigneeIds: [],
        createdAt: targetDate.toISOString(), // Create on the specific routine day
        recurrenceType: 'none'
      });

      setOpStatus('success');
      setOpMessage(`${dateStr} 업무가 생성되었습니다.`);
      
      setTimeout(() => {
        onNavigate();
      }, 1000);

    } catch (e) {
      setOpStatus('error');
      setOpMessage('생성 실패');
      setTimeout(() => setOpStatus('idle'), 1000);
    }
  };

  // 6. Action: Update Configuration
  const updateConfig = async (newConfig: BedConfig) => {
    setConfig(newConfig);
    
    // Resize array logic
    let newBeds = [...beds];
    if (newConfig.count > beds.length) {
      for (let i = beds.length + 1; i <= newConfig.count; i++) {
        newBeds.push({ id: i, name: `${i}번 베드`, lastChanged: null });
      }
    } else if (newConfig.count < beds.length) {
      newBeds = newBeds.slice(0, newConfig.count);
    }
    
    setBeds(newBeds);
    await saveData(newBeds, newConfig);
  };

  return {
    beds,
    config,
    opStatus,
    opMessage,
    handleBedChange,
    updateBedName, 
    handleGenerateRoutine,
    updateConfig
  };
};
