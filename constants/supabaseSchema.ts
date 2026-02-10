

export const SUPABASE_SCHEMA_SQL = `
-- 물리치료실 업무 보드 Supabase 초기화 스크립트 (v7 - Bed Audit Update)
-- Supabase 대시보드 > SQL Editor에 복사하여 실행하세요.

-- 1. UUID 확장 기능 활성화
create extension if not exists "uuid-ossp";

-- 2. 기존 테이블 정리 (주의: 데이터 초기화 시에만 주석 해제)
-- drop table if exists public.tasks;
-- drop table if exists public.templates;
-- drop table if exists public.staff;
-- drop table if exists public.settings;
-- drop table if exists public.bed_logs;

-- 3. STAFF (직원) 테이블
create table if not exists public.staff (
    id text default uuid_generate_v4()::text primary key,
    name text not null,
    role text not null,
    color text not null,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 4. TEMPLATES (업무 템플릿) 테이블
create table if not exists public.templates (
    id text default uuid_generate_v4()::text primary key,
    title text not null,
    description text,
    schedule_config jsonb, 
    assignee_ids jsonb default '[]'::jsonb,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. TASKS (업무) 테이블
create table if not exists public.tasks (
    id text default uuid_generate_v4()::text primary key,
    title text not null,
    description text,
    status text not null default 'TODO',
    assignee_ids jsonb default '[]'::jsonb,
    completed_by jsonb default '[]'::jsonb,
    recurrence_type text default 'none',
    source_template_id text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 6. SETTINGS (설정) 테이블
create table if not exists public.settings (
    key text primary key,
    value text, 
    updated_at timestamptz default now()
);

-- 7. BED LOGS (배드 관리 로그) 테이블 - [NEW]
-- 현재 설정은 settings에 JSON으로 저장되지만, 교체 이력은 별도로 쌓아두면 추후 분석에 유리합니다.
create table if not exists public.bed_logs (
    id text default uuid_generate_v4()::text primary key,
    bed_id integer not null,
    bed_name text not null,
    action_type text default 'CHANGE', -- CHANGE, INSPECT etc.
    performed_by jsonb default '[]'::jsonb, -- 작업을 수행한 직원 ID 목록
    created_at timestamptz default now(),
    note text
);

-- 8. 성능 최적화 및 무결성 강화

alter table public.tasks 
  drop constraint if exists fk_tasks_template;

alter table public.tasks 
  add constraint fk_tasks_template 
  foreign key (source_template_id) 
  references public.templates(id) 
  on delete set null;

-- [Index] 업무 보드 로딩 속도 향상을 위한 복합 인덱스 (날짜 + 상태)
create index if not exists idx_tasks_date_status on public.tasks(created_at, status);
create index if not exists idx_tasks_source_template on public.tasks(source_template_id);
create index if not exists idx_templates_active on public.templates(is_active);
create index if not exists idx_bed_logs_bed_id on public.bed_logs(bed_id);

-- 9. 초기 관리자 계정 생성 (데이터가 없을 때만)
insert into public.staff (name, role, color, is_active)
select '관리자', '실장', '#EF4444', true
where not exists (select 1 from public.staff);

-- 10. RLS (보안 정책) 설정 - 익명 접근 허용
alter table public.staff enable row level security;
alter table public.templates enable row level security;
alter table public.tasks enable row level security;
alter table public.settings enable row level security;
alter table public.bed_logs enable row level security;

drop policy if exists "Enable all access for all users" on public.staff;
drop policy if exists "Enable all access for all users" on public.templates;
drop policy if exists "Enable all access for all users" on public.tasks;
drop policy if exists "Enable all access for all users" on public.settings;
drop policy if exists "Enable all access for all users" on public.bed_logs;

create policy "Enable all access for all users" on public.staff for all using (true) with check (true);
create policy "Enable all access for all users" on public.templates for all using (true) with check (true);
create policy "Enable all access for all users" on public.tasks for all using (true) with check (true);
create policy "Enable all access for all users" on public.settings for all using (true) with check (true);
create policy "Enable all access for all users" on public.bed_logs for all using (true) with check (true);
`;
