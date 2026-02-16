
// Supabase 설정 파일
// Vercel 등의 배포 환경에서는 Environment Variables(환경 변수)가 우선 적용됩니다.
// 로컬 개발 시에는 아래 하드코딩된 값이 fallback으로 사용됩니다.

// process.env는 번들링 시점에 값으로 치환됩니다.
export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uqivbmkeuupsaghwshcw.supabase.co';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaXZibWtldXVwc2FnaHdzaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0ODM3OTUsImV4cCI6MjA4NTA1OTc5NX0.FY86a0vaN_x-KeErBYAVyCpyXKsxloZiy7eysZGSFjk';
