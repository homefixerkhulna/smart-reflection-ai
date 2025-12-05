import { useEffect, useRef, useCallback } from 'react';
import type { Task } from '../types';
import { requestNotificationPermission, scheduleReminder, cancelReminder } from '../reminders';

export function useReminder(tasks: Task[]) {
  const scheduledReminders = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const clearAllReminders = useCallback(() => {
    scheduledReminders.current.forEach((_, taskId) => {
      cancelReminder(taskId, scheduledReminders.current);
    });
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    // Clear existing reminders
    clearAllReminders();

    // Schedule reminders for pending tasks
    tasks
      .filter((task) => task.status === 'pending' && task.reminder_enabled && task.due_time)
      .forEach((task) => {
        scheduleReminder(task, scheduledReminders.current);
      });

    return () => clearAllReminders();
  }, [tasks, clearAllReminders]);

  return {
    clearAllReminders,
    scheduledCount: scheduledReminders.current.size,
  };
}
