export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  due_time?: string | null;
  priority: TaskPriority;
  category: string;
  status: TaskStatus;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: TaskPriority;
  category: string;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  completed_at?: string | null;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const CATEGORIES = [
  'general',
  'skincare',
  'health',
  'appointment',
  'medication',
  'exercise',
  'work',
  'personal',
] as const;
