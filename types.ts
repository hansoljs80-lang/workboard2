
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
  CONSUMABLES = 'consumables', // 6. 소모품 관리
  EQUIPMENT = 'equipment', // 7. 장비 관리 (New)
  BOARD = 'board',         // 8. 통계 대시보드
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

// --- Consumables Types ---

export interface Consumable {
  id: string;
  name: string;
  category?: string;
  count: number;
  unit: string;
  vendorName?: string;
  vendorPhone?: string;
  note?: string;
  updatedAt: string;
}

// --- Equipment Types (New) ---

export interface Equipment {
  id: string;
  name: string;
  category?: string; // e.g. '치료기기', '운동기구', 'PC/가전'
  count: number;
  vendorName?: string;
  vendorPhone?: string;
  note?: string; // e.g. AS 번호, 모델명, 구매일
  updatedAt: string;
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
