/**
 * LifeOS Type Definitions
 * Central type definitions for the entire application
 */

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageValue {
  [key: string]: unknown;
}

export type StorageKey = string;

export interface StorageStats {
  used: number;
  available: number;
  total: number;
  percentUsed: number;
}

// ============================================================================
// Module Types
// ============================================================================

export type ModuleName =
  | 'todo'
  | 'fitness'
  | 'finance'
  | 'investments'
  | 'habits'
  | 'goals'
  | 'journal'
  | 'poetry';

export interface Module {
  name: ModuleName;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

// ============================================================================
// Todo List Types
// ============================================================================

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
  tags?: string[];
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  completionRate: number;
}

// ============================================================================
// Habits Types
// ============================================================================

export interface HabitEntry {
  date: string;
  completed: boolean;
  note?: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  active: boolean;
  createdAt: string;
  entries: Record<string, HabitEntry>;
  streak?: number;
  bestStreak?: number;
}

// ============================================================================
// Goals Types
// ============================================================================

export type GoalStatus = 'active' | 'completed' | 'archived' | 'paused';
export type GoalCategory = 'personal' | 'career' | 'health' | 'financial' | 'learning' | 'other';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  targetDate?: string;
  createdAt: string;
  completedAt?: string;
  milestones: Milestone[];
  tags?: string[];
}

// ============================================================================
// Fitness Types
// ============================================================================

export type MetricType = 'weight' | 'steps' | 'calories' | 'distance' | 'duration' | 'reps';
export type WorkoutType = 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';

export interface FitnessGoal {
  id: string;
  name: string;
  type: MetricType;
  target: number;
  unit: string;
  startDate: string;
  endDate?: string;
  history: FitnessEntry[];
}

export interface FitnessEntry {
  date: string;
  fullDate?: string;
  amount: number;
  note?: string;
}

export interface Workout {
  id: string;
  type: WorkoutType;
  name: string;
  duration: number;
  calories?: number;
  date: string;
  notes?: string;
}

// ============================================================================
// Finance Types
// ============================================================================

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  tags?: string[];
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: 'weekly' | 'monthly' | 'yearly';
  spent?: number;
  remaining?: number;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  topCategories: Array<{ category: string; amount: number }>;
}

// ============================================================================
// Journal Types
// ============================================================================

export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood?: Mood;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Poetry Types
// ============================================================================

export interface Poem {
  id: string;
  title: string;
  content: string;
  dateCreated: string;
  dateModified?: string;
  tags?: string[];
  category?: string;
}

// ============================================================================
// Dashboard Widget Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'stable';

export interface WidgetData {
  primary: string | number;
  primaryLabel: string;
  secondary: string | number;
  secondaryLabel: string;
  accent: string;
  trend: TrendDirection;
}

export interface Widget {
  title: string;
  icon: string;
  getData: () => WidgetData;
  color: string;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  background?: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  gradient: string;
}

// ============================================================================
// Data Export/Import Types
// ============================================================================

export interface ExportMetadata {
  exportDate: string;
  version: string;
  platform: string;
  modules: ModuleName[];
}

export interface ModuleExportData {
  moduleName: string;
  exportDate: string;
  data: Record<string, unknown>;
  statistics?: Record<string, unknown>;
}

export interface ExportData {
  metadata: ExportMetadata;
  data: Record<string, ModuleExportData>;
}

export interface ImportResult {
  success: string[];
  errors: string[];
  skipped: string[];
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchResult {
  module: ModuleName;
  type: string;
  title: string;
  preview: string;
  matchedText?: string;
  date?: string;
  url?: string;
}

export interface SearchFilter {
  modules?: ModuleName[];
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    title?: {
      display: boolean;
      text?: string;
    };
  };
}

// ============================================================================
// Backup Types
// ============================================================================

export interface Backup {
  key: string;
  timestamp: number;
  date: string;
  size: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface DataRefreshEvent extends CustomEvent {
  type: 'dataRefresh';
}

export interface ModuleChangeEvent extends CustomEvent {
  type: 'moduleChange';
  detail: {
    from?: ModuleName;
    to: ModuleName;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncFunction<T = void> = () => Promise<T>;

export type Callback<T = void> = (value: T) => void;

// ============================================================================
// Error Types
// ============================================================================

export class LifeOSError extends Error {
  constructor(
    message: string,
    public code?: string,
    public module?: ModuleName
  ) {
    super(message);
    this.name = 'LifeOSError';
  }
}

export class StorageError extends LifeOSError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'StorageError';
  }
}

export class DataValidationError extends LifeOSError {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}
