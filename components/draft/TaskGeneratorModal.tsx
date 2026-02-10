
import React, { useState, useEffect } from 'react';
import { Template, TaskStatus } from '../../types';
import { X, Calendar, PlayCircle, Loader2, CheckCircle2, ArrowRight, Copy } from 'lucide-react';
import { calculateGenerationDates, GenerationConfig } from '../../utils/taskGenerationUtils';
import { createBulkTasks } from '../../services/api';

interface TaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  onSuccess: () => void;
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

type GenerationStep = 'config' | 'processing' | 'complete';

const TaskGeneratorModal: React.FC<TaskGeneratorModalProps> = ({ isOpen, onClose, template, onSuccess }) => {
  const [step, setStep] = useState<GenerationStep>('config');
  
  // Generation Config State
  const [config, setConfig] = useState<GenerationConfig>({
    mode: 'single',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 기본 1달
    count: 10,
    limitType: 'date',
    frequency: 'daily',
    interval: 1,
    weekDays: [1], // 월요일 기본
    monthDay: 1
  });

  // NEW: Copies per day (Duplicate generation)
  const [copiesPerDay, setCopiesPerDay] = useState<number>(1);

  const [previewDates, setPreviewDates] = useState<Date[]>([]);
  const [resultSummary, setResultSummary] = useState<{ count: number, first: string, last: string } | null>(null);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setStep('config');
      setResultSummary(null);
      setCopiesPerDay(1); // Reset copies
      
      // 템플릿 설정 불러오기
      if (template.scheduleConfig) {
        const sc = template.scheduleConfig;
        let freq: any = 'daily';
        
        if (sc.type === 'custom_days') freq = 'custom_days';
        else if (sc.type === 'weekly' || sc.type === 'biweekly') freq = 'weekly';
        else if (sc.type === 'monthly') freq = 'monthly';
        else freq = 'daily';

        setConfig(prev => ({
          ...prev,
          frequency: freq,
          interval: sc.intervalValue || (sc.type === 'biweekly' ? 2 : 1), 
          weekDays: sc.weekDay !== undefined ? [sc.weekDay] : [1],
          monthDay: sc.monthDay || 1,
          startDate: new Date() // 항상 오늘 날짜로 리셋
        }));
      }
    }
  }, [isOpen, template]);

  // 미리보기 날짜 계산
  useEffect(() => {
    const dates = calculateGenerationDates(config);
    setPreviewDates(dates);
  }, [config]);

  const handleGenerate = async () => {
    if (previewDates.length === 0) return;
    
    // 1. 진행 상태로 변경
    setStep('processing');

    try {
      // Flatten logic for copies per day
      const tasksToCreate = [];
      for (const date of previewDates) {
        for (let i = 0; i < copiesPerDay; i++) {
          tasksToCreate.push({
            title: template.title,
            description: template.description,
            status: TaskStatus.TODO,
            assigneeIds: template.assigneeIds || [],
            createdAt: date.toISOString(),
            recurrenceType: template.scheduleConfig?.type || 'none', 
            sourceTemplateId: template.id
          });
        }
      }

      // 2. API 호출
      const res = await createBulkTasks(tasksToCreate);
      
      if (res.success) {
        // 3. 결과 요약 저장 및 완료 상태로 변경
        setResultSummary({
          count: tasksToCreate.length,
          first: previewDates[0].toLocaleDateString(),
          last: previewDates[previewDates.length - 1].toLocaleDateString()
        });
        
        // 중요: 데이터 새로고침 트리거
        onSuccess();
        
        // 약간의 지연 후 완료 화면 표시 (로딩 경험 개선)
        setTimeout(() => {
          setStep('complete');
        }, 800);
      } else {
        alert("생성 실패: " + res.message);
        setStep('config'); // 실패 시 설정 화면으로 복귀
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
      setStep('config');
    }
  };

  const handleClose = () => {
    onClose();
    // 모달 닫힐 때 상태 초기화는 useEffect에서 처리됨
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300">
        
        {/* === STEP 1: CONFIGURATION === */}
        {step === 'config' && (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">업무 일괄 발급</h3>
                <p className="text-xs text-slate-500">{template.title}</p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
              {/* Mode Selection */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                 <button 
                   onClick={() => setConfig({...config, mode: 'single'})}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${config.mode === 'single' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                 >
                   단건 (하루)
                 </button>
                 <button 
                   onClick={() => setConfig({...config, mode: 'period'})}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${config.mode === 'period' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                 >
                   기간 (반복)
                 </button>
              </div>

              <div className="space-y-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">시작일</label>
                  <input 
                    type="date" 
                    value={config.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setConfig({...config, startDate: new Date(e.target.value)})}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200"
                  />
                </div>
                
                {/* Copies Per Day */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <Copy size={12} /> 하루 생성 개수
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      max="20"
                      value={copiesPerDay}
                      onChange={(e) => setCopiesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200"
                    />
                    <span className="text-sm font-bold text-slate-400 whitespace-nowrap">개씩 생성</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    예: 오전/오후 2번 필요하면 '2' 입력
                  </p>
                </div>

                {config.mode === 'period' && (
                  <div className="animate-fade-in space-y-4">
                     <hr className="border-slate-100 dark:border-slate-800" />
                     
                     {/* Frequency Type */}
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2">반복 주기</label>
                       <div className="grid grid-cols-3 gap-2">
                         {[
                           { id: 'daily', label: '매일' },
                           { id: 'weekly', label: '주간 (요일)' },
                           { id: 'custom_days', label: 'N일 간격' },
                           { id: 'monthly', label: '매월 (날짜)' },
                           { id: 'month_interval', label: 'N개월 간격' },
                         ].map(opt => (
                           <button
                             key={opt.id}
                             onClick={() => setConfig({...config, frequency: opt.id as any})}
                             className={`py-2 px-1 text-xs font-bold rounded-lg border ${
                               config.frequency === opt.id 
                                 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-600 dark:text-blue-400'
                                 : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                             }`}
                           >
                             {opt.label}
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Detailed Config based on Frequency */}
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        {config.frequency === 'custom_days' && (
                           <div className="flex items-center gap-3">
                             <input 
                               type="number" min="1" max="365"
                               value={config.interval}
                               onChange={(e) => setConfig({...config, interval: parseInt(e.target.value) || 1})}
                               className="w-20 p-2 rounded-lg border border-slate-300 text-center font-bold"
                             />
                             <span className="text-sm">일 간격으로 생성</span>
                           </div>
                        )}

                        {config.frequency === 'month_interval' && (
                           <div className="flex items-center gap-3">
                             <input 
                               type="number" min="1" max="12"
                               value={config.interval}
                               onChange={(e) => setConfig({...config, interval: parseInt(e.target.value) || 1})}
                               className="w-20 p-2 rounded-lg border border-slate-300 text-center font-bold"
                             />
                             <span className="text-sm">개월 간격으로 매월</span>
                             <input 
                               type="number" min="1" max="31"
                               value={config.monthDay}
                               onChange={(e) => setConfig({...config, monthDay: parseInt(e.target.value) || 1})}
                               className="w-16 p-2 rounded-lg border border-slate-300 text-center font-bold ml-auto"
                               title="일자"
                             />
                             <span className="text-sm">일에 생성</span>
                           </div>
                        )}

                        {(config.frequency === 'monthly') && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm">매월</span>
                              <input 
                               type="number" min="1" max="31"
                               value={config.monthDay}
                               onChange={(e) => setConfig({...config, monthDay: parseInt(e.target.value) || 1})}
                               className="w-16 p-2 rounded-lg border border-slate-300 text-center font-bold"
                             />
                             <span className="text-sm">일에 생성</span>
                            </div>
                        )}

                        {config.frequency === 'weekly' && (
                          <div>
                            <span className="text-xs font-bold mb-2 block">요일 선택 (다중 선택 가능)</span>
                            <div className="flex gap-1 justify-between">
                              {WEEK_DAYS.map((day, idx) => (
                                <button
                                  key={day}
                                  onClick={() => {
                                    const exists = config.weekDays.includes(idx);
                                    const newDays = exists 
                                      ? config.weekDays.filter(d => d !== idx)
                                      : [...config.weekDays, idx].sort();
                                    setConfig({...config, weekDays: newDays});
                                  }}
                                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                                    config.weekDays.includes(idx)
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {day}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                     </div>

                     <hr className="border-slate-100 dark:border-slate-800" />
                     
                     {/* Limit Settings */}
                     <div>
                       <label className="block text-xs font-bold text-slate-500 mb-2">종료 기준</label>
                       <div className="flex gap-4 items-center">
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="radio" 
                             checked={config.limitType === 'date'} 
                             onChange={() => setConfig({...config, limitType: 'date'})}
                             className="w-4 h-4 text-blue-600"
                           />
                           <span className="text-sm font-medium dark:text-slate-300">날짜까지</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                           <input 
                             type="radio" 
                             checked={config.limitType === 'count'} 
                             onChange={() => setConfig({...config, limitType: 'count'})}
                             className="w-4 h-4 text-blue-600"
                           />
                           <span className="text-sm font-medium dark:text-slate-300">횟수만큼</span>
                         </label>
                       </div>
                       
                       <div className="mt-3">
                         {config.limitType === 'date' ? (
                           <input 
                            type="date" 
                            value={config.endDate ? config.endDate.toISOString().split('T')[0] : ''}
                            onChange={(e) => setConfig({...config, endDate: new Date(e.target.value)})}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          />
                         ) : (
                           <div className="flex items-center gap-2">
                             <input 
                               type="number" min="1" max="100"
                               value={config.count}
                               onChange={(e) => setConfig({...config, count: parseInt(e.target.value) || 1})}
                               className="w-24 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                             />
                             <span className="text-sm font-bold text-slate-600 dark:text-slate-400">회 생성</span>
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    예상 생성 결과:
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                     총 {previewDates.length * copiesPerDay}개 업무
                     {copiesPerDay > 1 && <span className="text-xs ml-1 opacity-80">({previewDates.length}일 × {copiesPerDay}개)</span>}
                  </span>
               </div>
               
               <div className="flex gap-3">
                 <button onClick={handleClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                   취소
                 </button>
                 <button 
                   onClick={handleGenerate}
                   disabled={previewDates.length === 0}
                   className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {previewDates.length === 0 ? '날짜 없음' : '업무 일괄 발급'}
                   <PlayCircle size={18} className="ml-1" />
                 </button>
               </div>
            </div>
          </>
        )}

        {/* === STEP 2: PROCESSING === */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center h-80 p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">업무 생성 중...</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {previewDates.length * copiesPerDay}개의 업무를 데이터베이스에 등록하고 있습니다.<br/>잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* === STEP 3: COMPLETE === */}
        {step === 'complete' && resultSummary && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce-short">
                <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">발급 완료!</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                성공적으로 업무가 생성되었습니다.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800 w-full rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">총 생성 개수</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{resultSummary.count}건</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">기간</p>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200 flex flex-col">
                      <span>{resultSummary.first}</span>
                      <span className="text-slate-400 text-[10px]">부터</span>
                      <span>{resultSummary.last}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleClose}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                확인 (보드에서 확인하기)
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TaskGeneratorModal;
