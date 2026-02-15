
export enum TaskStatus {
  TODO = '할일',
  IN_PROGRESS = '진행중',
  DONE = '완료',
  SKIPPED = '건너뜀' // New status: Hides task from board but prevents regeneration
}

export enum Tab {
  BOARD = 'board',
  DRAFTS = 'drafts',       // List view & Creation view combined
  STAFF = 'staff',
  BEDS = 'beds',           // Bed Management
  LAUNDRY = 'laundry',     // Laundry Management
  SHOCKWAVE = 'shockwave', // Shockwave Management
  PT_ROOM = 'pt_room',     // New: PT Room Management
  CHANGING_ROOM = 'changing_room', // New: Changing Room Management
  SETTINGS = 'settings',   // Now DB Settings
  GENERAL_SETTINGS = 'general_settings' // New General Settings
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  color: string;
  isActive: boolean; // Added for employment status (Active/Resigned)
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom_days';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeIds: string[]; // JSON array of Staff IDs
  completedBy?: string[]; // JSON array of Staff IDs who actually completed the task
  createdAt: string;
  recurrenceType?: RecurrenceType; // Added for filtering in monthly view
  recurrenceInterval?: number; // Added for specific badges (e.g. "Every 2 days") - Front-end mostly
  sourceTemplateId?: string; // Link to the template that created this task
}

export interface ScheduleConfig {
  type: RecurrenceType;
  intervalValue?: number; // Universal interval (every N days/weeks/months)
  weekDay?: number; // Deprecated: keeping for backward compatibility logic
  weekDays?: number[]; // New: Array of 0-6 (Sun-Sat) for multi-day selection
  monthDay?: number; // 1-31 for monthly
}

export interface Template {
  id: string;
  title: string;
  description: string;
  scheduleConfig?: ScheduleConfig; // Added schedule config
  assigneeIds?: string[]; // Added: Templates can now have default assignees
  isActive: boolean; // Added toggle state
  createdAt: string; // Needed for custom interval calculation
  updatedAt?: string; // New: Versioning timestamp (When it was modified/archived)
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
  settings?: Record<string, any>; // Added: Global Settings Key-Value Map
}

// --- Bed Manager Types ---

export interface BedData {
  id: number;
  name: string;
  lastChanged: string | null;
  lastChangedBy?: string[]; // New: Staff IDs who performed the change
}

export interface BedConfig {
  count: number;
  interval: number; // Days
  routineDay: number; // 0=Sun, 1=Mon...
  cols: number; // Desktop columns
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
  performedBy?: string; // Optional: Store name of performer for ad-hoc items
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
  performedBy?: string; // Optional: Store name of performer for ad-hoc items
}

export interface PtPeriodicItem {
  id: string;
  label: string;
  interval: number; // Days
  lastCompleted?: string; // ISO Date String
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

// --- Changing Room Types (New) ---

export type ChangingRoomShift = 'MORNING' | 'LUNCH' | 'ADHOC';

export interface ChangingRoomChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  performedBy?: string; // Optional: Store name of performer for ad-hoc items
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
