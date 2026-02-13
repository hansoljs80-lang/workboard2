

export const SUPABASE_SCHEMA_SQL = `
-- 물리치료실 업무 보드 Supabase 초기화 스크립트 (v12 - Add Shockwave Logs)
-- Supabase 대시보드 > SQL Editor에 복사하여 실행하세요.

-- 1. UUID 확장 기능 활성화 (필수)
create extension if not exists "uuid-ossp";

-- 2. STAFF (직원) 테이블
create table if not exists public.staff (
    id text default uuid_generate_v4()::text primary key,
    name text not null,
    role text not null,
    color text not null,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- 3. TEMPLATES (업무 템플릿) 테이블
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

-- 4. TASKS (업무) 테이블
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

-- 5. SETTINGS (설정) 테이블
create table if not exists public.settings (
    key text primary key,
    value text, 
    updated_at timestamptz default now()
);

-- 6. BED LOGS (배드 관리 로그) 테이블
create table if not exists public.bed_logs (
    id text default uuid_generate_v4()::text primary key,
    bed_id integer not null,
    bed_name text not null,
    action_type text default 'CHANGE', 
    performed_by jsonb default '[]'::jsonb, 
    created_at timestamptz default now(),
    note text
);

-- 7. LAUNDRY LOGS (빨래 업무 로그) 테이블
create table if not exists public.laundry_logs (
    id text default uuid_generate_v4()::text primary key,
    action_type text not null,
    performed_by jsonb default '[]'::jsonb,
    created_at timestamptz default now()
);

-- 8. SHOCKWAVE LOGS (충격파실 관리 로그) 테이블
create table if not exists public.shockwave_logs (
    id text default uuid_generate_v4()::text primary key,
    shift_type text not null, -- 'MORNING' or 'EVENING'
    checklist jsonb default '[]'::jsonb, -- Store state of checklist items
    performed_by jsonb default '[]'::jsonb,
    created_at timestamptz default now()
);

-- 9. 인덱스 설정 (성능 최적화)
alter table public.tasks drop constraint if exists fk_tasks_template;
alter table public.tasks add constraint fk_tasks_template foreign key (source_template_id) references public.templates(id) on delete set null;

create index if not exists idx_tasks_date_status on public.tasks(created_at, status);
create index if not exists idx_bed_logs_created_at on public.bed_logs(created_at);
create index if not exists idx_laundry_logs_created_at on public.laundry_logs(created_at);
create index if not exists idx_shockwave_logs_created_at on public.shockwave_logs(created_at);

-- 10. 초기 관리자 계정 생성
insert into public.staff (name, role, color, is_active)
select '관리자', '실장', '#EF4444', true
where not exists (select 1 from public.staff);

-- 11. RLS 및 권한 설정 (핵심: 익명 사용자 쓰기 허용)
alter table public.staff enable row level security;
alter table public.templates enable row level security;
alter table public.tasks enable row level security;
alter table public.settings enable row level security;
alter table public.bed_logs enable row level security;
alter table public.laundry_logs enable row level security;
alter table public.shockwave_logs enable row level security;

-- 기존 정책 삭제 (중복 방지)
drop policy if exists "Enable all access for all users" on public.staff;
drop policy if exists "Enable all access for all users" on public.templates;
drop policy if exists "Enable all access for all users" on public.tasks;
drop policy if exists "Enable all access for all users" on public.settings;
drop policy if exists "Enable all access for all users" on public.bed_logs;
drop policy if exists "Enable all access for all users" on public.laundry_logs;
drop policy if exists "Enable all access for all users" on public.shockwave_logs;

-- 새 정책 생성
create policy "Enable all access for all users" on public.staff for all using (true) with check (true);
create policy "Enable all access for all users" on public.templates for all using (true) with check (true);
create policy "Enable all access for all users" on public.tasks for all using (true) with check (true);
create policy "Enable all access for all users" on public.settings for all using (true) with check (true);
create policy "Enable all access for all users" on public.bed_logs for all using (true) with check (true);
create policy "Enable all access for all users" on public.laundry_logs for all using (true) with check (true);
create policy "Enable all access for all users" on public.shockwave_logs for all using (true) with check (true);

-- 권한 부여 (Permission Grant - 필수)
grant all on table public.staff to anon, authenticated, service_role;
grant all on table public.templates to anon, authenticated, service_role;
grant all on table public.tasks to anon, authenticated, service_role;
grant all on table public.settings to anon, authenticated, service_role;
grant all on table public.bed_logs to anon, authenticated, service_role;
grant all on table public.laundry_logs to anon, authenticated, service_role;
grant all on table public.shockwave_logs to anon, authenticated, service_role;
`;