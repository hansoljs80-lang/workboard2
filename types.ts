
export enum TaskStatus {
  TODO = '할일',
  IN_PROGRESS = '진행중',
  DONE = '완료',
  SKIPPED = '건너뜀'
}

export enum Tab {
  PT_ROOM = 'pt_room',     // 1. 물리치료실 (Default)
  SHOCKWAVE = 'shockwave', // 2. 충격파실
  BEDS = 'beds',           // 3. 배드 커버 관리
  LAUNDRY = 'laundry',     // 4. 세탁 관리
  CHANGING_ROOM = 'changing_room', // 5. 탈의실 관리
  BOARD = 'board',         // 6. 통계 대시보드 (구 업무보드)
  STAFF = 'staff',
  SETTINGS = 'settings',
  GENERAL_SETTINGS = 'general_settings'
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  color: string;
  isActive: boolean;
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_days';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeIds: string[];
  completedBy?: string[];
  createdAt: string;
  recurrenceType?: RecurrenceType;
  recurrenceInterval?: number;
  sourceTemplateId?: string;
}

export interface ScheduleConfig {
  type: RecurrenceType;
  intervalValue?: number;
  weekDay?: number;
  weekDays?: number[];
  monthDay?: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  scheduleConfig?: ScheduleConfig;
  assigneeIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface AppData {
  tasks: Task[];
  staff: Staff[];
  templates: Template[];
  settings?: Record<string, any>;
}

// --- Bed Manager Types ---

export interface BedData {
  id: number;
  name: string;
  lastChanged: string | null;
  lastChangedBy?: string[];
}

export interface BedConfig {
  count: number;
  interval: number;
  routineDay: number;
  cols: number;
}

export type BedStatusLevel = 'success' | 'warning' | 'danger' | 'today';

export interface BedStatus {
  status: BedStatusLevel;
  diffDays: number;
  label: string;
}

export interface BedLog {
  id: string;
  bedId: number;
  bedName: string;
  actionType: string;
  performedBy: string[];
  createdAt: string;
  note?: string;
}

// --- Laundry Types ---

export type LaundryAction = 'WASH' | 'DRY' | 'FOLD';

export interface LaundryLog {
  id: string;
  actionType: LaundryAction;
  performedBy: string[];
  createdAt: string;
}

// --- Shockwave Types ---

export type ShockwaveShift = 'MORNING' | 'DAILY' | 'EVENING';

export interface ShockwaveChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  performedBy?: string;
}

export interface ShockwaveLog {
  id: string;
  shiftType: ShockwaveShift;
  checklist: ShockwaveChecklistItem[];
  performedBy: string[];
  createdAt: string;
}

export interface ShockwaveConfig {
  morningItems: { id: string; label: string }[];
  dailyItems: { id: string; label: string }[];
  eveningItems: { id: string; label: string }[];
}

// --- PT Room Types ---

export type PtRoomShift = 'MORNING' | 'DAILY' | 'EVENING' | 'PERIODIC';

export interface PtRoomChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  performedBy?: string;
}

export interface PtPeriodicItem {
  id: string;
  label: string;
  interval: number;
  lastCompleted?: string;
}

export interface PtRoomLog {
  id: string;
  shiftType: PtRoomShift;
  checklist: PtRoomChecklistItem[];
  performedBy: string[];
  createdAt: string;
}

export interface PtRoomConfig {
  morningItems: { id: string; label: string }[];
  dailyItems: { id: string; label: string }[];
  eveningItems: { id: string; label: string }[];
  periodicItems: PtPeriodicItem[];
}

// --- Changing Room Types ---

export type ChangingRoomShift = 'MORNING' | 'LUNCH' | 'ADHOC';

export interface ChangingRoomChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  performedBy?: string;
}

export interface ChangingRoomLog {
  id: string;
  shiftType: ChangingRoomShift;
  checklist: ChangingRoomChecklistItem[];
  performedBy: string[];
  createdAt: string;
}

export interface ChangingRoomConfig {
  morningItems: { id: string; label: string }[];
  lunchItems: { id: string; label: string }[];
  adhocItems: { id: string; label: string }[];
}
