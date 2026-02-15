
import { useState, useEffect } from 'react';

/**
 * 값을 일정 시간(delay) 동안 지연시켰다가 반환하는 훅입니다.
 * 검색어 입력 등 빈번한 상태 변경 시 성능 최적화를 위해 사용합니다.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
