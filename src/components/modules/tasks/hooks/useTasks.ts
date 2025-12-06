import { useState, useEffect, useCallback } from 'react';
import { addDays, addWeeks, addMonths, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Task, CreateTaskInput, UpdateTaskInput, RecurrenceType } from '../types';

export function useTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true, nullsFirst: false });

    if (error) {
      toast({ title: 'Error fetching tasks', description: error.message, variant: 'destructive' });
    } else {
      // Auto-detect overdue tasks
      const now = new Date();
      const updatedTasks = (data || []).map((task) => {
        if (task.status === 'pending') {
          const dueDateTime = new Date(`${task.due_date}T${task.due_time || '23:59:59'}`);
          if (dueDateTime < now) {
            return { ...task, status: 'overdue' as const };
          }
        }
        return task;
      }) as Task[];
      setTasks(updatedTasks);
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  const createTask = async (input: CreateTaskInput) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
      return null;
    }

    toast({ title: 'Task created successfully' });
    return data as Task;
  };

  const updateTask = async (id: string, input: UpdateTaskInput) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
      return null;
    }

    toast({ title: 'Task updated' });
    return data as Task;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      toast({ title: 'Error deleting task', description: error.message, variant: 'destructive' });
      return false;
    }

    toast({ title: 'Task deleted' });
    return true;
  };

  const getNextDueDate = (currentDate: string, recurrenceType: RecurrenceType): string => {
    const date = new Date(currentDate);
    switch (recurrenceType) {
      case 'daily':
        return format(addDays(date, 1), 'yyyy-MM-dd');
      case 'weekly':
        return format(addWeeks(date, 1), 'yyyy-MM-dd');
      case 'monthly':
        return format(addMonths(date, 1), 'yyyy-MM-dd');
      default:
        return currentDate;
    }
  };

  const markComplete = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    // Mark current task as completed
    const result = await updateTask(id, { status: 'completed', completed_at: new Date().toISOString() });

    // If recurring, create next occurrence
    if (task.recurrence_type !== 'none' && user) {
      const nextDueDate = getNextDueDate(task.due_date, task.recurrence_type);
      
      // Check if next occurrence is within the recurrence end date
      const shouldCreateNext = !task.recurrence_end_date || nextDueDate <= task.recurrence_end_date;
      
      if (shouldCreateNext) {
        await supabase.from('tasks').insert({
          user_id: user.id,
          title: task.title,
          description: task.description,
          due_date: nextDueDate,
          due_time: task.due_time,
          priority: task.priority,
          category: task.category,
          reminder_enabled: task.reminder_enabled,
          reminder_minutes_before: task.reminder_minutes_before,
          recurrence_type: task.recurrence_type,
          recurrence_end_date: task.recurrence_end_date,
          status: 'pending',
        });
      }
    }

    return result;
  };

  const markPending = async (id: string) => {
    return updateTask(id, { status: 'pending', completed_at: null });
  };

  // Filtered views
  const todayTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date === today;
  });

  const weeklyTasks = tasks.filter((t) => {
    const today = new Date();
    const taskDate = new Date(t.due_date);
    const weekEnd = addDays(today, 7);
    return taskDate >= today && taskDate <= weekEnd;
  });

  const monthlyTasks = tasks.filter((t) => {
    const today = new Date();
    const taskDate = new Date(t.due_date);
    const monthEnd = addMonths(today, 1);
    return taskDate >= today && taskDate <= monthEnd;
  });

  const yearlyTasks = tasks.filter((t) => {
    const today = new Date();
    const taskDate = new Date(t.due_date);
    const yearEnd = new Date(today.getFullYear(), 11, 31);
    return taskDate >= today && taskDate <= yearEnd;
  });

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');

  return {
    tasks,
    todayTasks,
    weeklyTasks,
    monthlyTasks,
    yearlyTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    markComplete,
    markPending,
    refetch: fetchTasks,
  };
}
