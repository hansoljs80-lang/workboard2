
export interface GenerationConfig {
  mode: 'single' | 'period'; // 단건 생성 vs 기간 생성
  startDate: Date;
  endDate?: Date; // 기간 모드일 때 종료일
  count?: number; // 횟수 모드일 때 생성 횟수
  limitType: 'date' | 'count'; // 종료 기준
  
  // 반복 설정
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom_days' | 'month_interval'; // N일/N주/N개월 간격 (month_interval added)
  interval: number; // N일/N주/N개월 간격
  weekDays: number[]; // 0(일) ~ 6(토) - weekly일 때 선택된 요일들 (다중 선택)
  monthDay: number; // 1~31 - monthly일 때 날짜
}

/**
 * 설정에 따라 생성될 날짜 배열을 계산하여 반환합니다.
 */
export const calculateGenerationDates = (config: GenerationConfig): Date[] => {
  const dates: Date[] = [];
  const start = new Date(config.startDate);
  start.setHours(9, 0, 0, 0); // 업무 시간 기준 (오전 9시)

  // 1. 단건 생성 모드
  if (config.mode === 'single') {
    dates.push(new Date(start));
    return dates;
  }

  // 2. 기간 생성 모드
  const MAX_LIMIT = 365; // 안전장치
  let current = new Date(start);
  let count = 0;

  // 종료 조건 함수
  const isFinished = () => {
    if (count >= MAX_LIMIT) return true;
    if (config.limitType === 'count') {
      return count >= (config.count || 1);
    } else {
      const end = new Date(config.endDate || new Date());
      end.setHours(23, 59, 59, 999);
      return current > end;
    }
  };

  // 주간 반복의 경우, 시작일이 속한 주의 일요일로 초기화하여 주 단위 계산을 용이하게 함
  // 단, 시작일 이전의 날짜는 필터링해야 함
  let loopDate = new Date(current);
  
  if (config.frequency === 'weekly') {
    // 로직 단순화를 위해 루프 방식을 달리함
    // 주 단위 점프가 아니라, 하루씩 증가하며 조건 체크하는 방식은 N주 간격 처리가 까다로움.
    // 따라서 "기준일(Start)"부터 시작해서 N주/N개월/N일씩 점프하는 방식 사용.
  }

  // === 통합 루프 로직 ===
  
  while (!isFinished()) {
    // 안전장치: 루프가 너무 멀리 가면 중단 (예: 5년 뒤)
    if (loopDate.getFullYear() > start.getFullYear() + 5) break;

    let matchFound = false;

    switch (config.frequency) {
      case 'daily':
        // 매일 (혹은 custom_days가 N=1일때) -> 그냥 추가
        matchFound = true;
        break;

      case 'custom_days':
        // N일 간격 -> 그냥 추가 (루프 끝에서 interval만큼 점프)
        matchFound = true;
        break;

      case 'weekly':
        // 주간 반복: 현재 loopDate 주간에 해당하는 요일들을 모두 체크하여 추가
        // 주의: N주 간격일 때, 시작 주간부터 interval 주마다 실행
        
        // 현재 loopDate가 시작일로부터 몇 주 차이인지 계산 필요 없이,
        // loopDate 주간의 [일,월...토] 중 선택된 요일을 날짜로 변환하여 추가
        // 그리고 loopDate를 7 * interval 일 만큼 증가시킴.
        
        // 현재 loopDate 주의 일요일 구하기
        const day = loopDate.getDay();
        const diff = loopDate.getDate() - day; // adjust when day is sunday
        const sunday = new Date(loopDate);
        sunday.setDate(diff);

        // 선택된 요일들을 순회하며 날짜 생성
        const weekDates: Date[] = [];
        config.weekDays.sort((a, b) => a - b).forEach(dayIndex => {
            const target = new Date(sunday);
            target.setDate(sunday.getDate() + dayIndex);
            target.setHours(9, 0, 0, 0);

            // 시작일 이전 날짜는 제외
            if (target >= start) {
                // 종료 조건 체크 (여기서 미리 체크해야 함)
                if (config.limitType === 'date' && config.endDate && target > config.endDate) return;
                weekDates.push(target);
            }
        });

        // 생성된 날짜들을 dates에 추가
        for (const d of weekDates) {
            if (isFinished()) break;
            dates.push(d);
            count++;
        }
        
        // 주 단위 처리는 여기서 날짜 추가가 끝났으므로 matchFound=false로 두고
        // 루프 하단에서 주 단위 점프를 수행하게 함
        matchFound = false; 
        break;

      case 'monthly':
      case 'month_interval':
        // 월간 반복: 현재 loopDate의 월에 config.monthDay가 존재하는지 확인
        const year = loopDate.getFullYear();
        const month = loopDate.getMonth();
        const targetDate = new Date(year, month, config.monthDay, 9, 0, 0);

        // 해당 월에 그 날짜가 존재하는지 확인 (예: 2월 30일 방지)
        // JS Date는 오버플로우되면 다음달로 넘어감 -> 월이 달라지면 유효하지 않은 날짜
        if (targetDate.getMonth() === month) {
             if (targetDate >= start) {
                 dates.push(targetDate);
                 count++;
             }
        }
        matchFound = false; // 월 단위 점프는 하단에서 처리
        break;
    }

    if (matchFound) {
      // Daily나 Custom Days인 경우 여기서 추가
      if (loopDate >= start) { // 시작일 조건 재확인
        dates.push(new Date(loopDate));
        count++;
      }
    }

    // === 날짜 점프 로직 ===
    if (config.frequency === 'daily') {
      loopDate.setDate(loopDate.getDate() + 1);
    } 
    else if (config.frequency === 'custom_days') {
      loopDate.setDate(loopDate.getDate() + (config.interval || 1));
    }
    else if (config.frequency === 'weekly') {
      // N주 후로 이동
      loopDate.setDate(loopDate.getDate() + (7 * (config.interval || 1)));
    }
    else if (config.frequency === 'monthly' || config.frequency === 'month_interval') {
      // N개월 후로 이동 (1일로 설정하여 월 계산 오차 방지)
      // 현재 loopDate가 1월 31일이고 1개월 뒤면 2월 28/29일이 되어야 하는데
      // 단순 setMonth는 3월로 튈 수 있음.
      // 하지만 위에서 targetDate를 새로 생성하므로, loopDate는 "연/월" 추적용으로만 씀.
      // 따라서 안전하게 1일로 맞추고 월을 더함.
      const currentMonth = loopDate.getMonth();
      loopDate.setMonth(currentMonth + (config.interval || 1));
      loopDate.setDate(1); // 다음 루프 계산을 위해 1일로 고정
    }
  }

  // 날짜순 정렬 (주간 반복 시 순서가 섞일 수 있으므로)
  return dates.sort((a, b) => a.getTime() - b.getTime());
};
