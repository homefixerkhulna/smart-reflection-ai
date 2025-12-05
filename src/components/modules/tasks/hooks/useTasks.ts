import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

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

  const markComplete = async (id: string) => {
    return updateTask(id, { status: 'completed', completed_at: new Date().toISOString() });
  };

  const markPending = async (id: string) => {
    return updateTask(id, { status: 'pending', completed_at: null });
  };

  // Filtered views
  const todayTasks = tasks.filter((t) => {
    const today = new Date().toISOString().split('T')[0];
    return t.due_date === today;
  });

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');

  return {
    tasks,
    todayTasks,
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
