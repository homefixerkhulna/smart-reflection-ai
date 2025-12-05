import type { Task } from './types';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  }
}

export function scheduleReminder(task: Task, scheduledMap: Map<string, NodeJS.Timeout>) {
  if (!task.due_time || !task.reminder_enabled) return;

  const dueDateTime = new Date(`${task.due_date}T${task.due_time}`);
  const reminderTime = new Date(dueDateTime.getTime() - task.reminder_minutes_before * 60 * 1000);
  const now = new Date();

  // Schedule reminder before due time
  if (reminderTime > now) {
    const delay = reminderTime.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      showNotification(`⏰ Task Reminder: ${task.title}`, {
        body: `Due in ${task.reminder_minutes_before} minutes${task.description ? `\n${task.description}` : ''}`,
        tag: `reminder-${task.id}`,
      });
    }, delay);
    scheduledMap.set(`${task.id}-before`, timeoutId);
  }

  // Schedule on-time notification
  if (dueDateTime > now) {
    const delay = dueDateTime.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      showNotification(`🔔 Task Due Now: ${task.title}`, {
        body: task.description || 'Your task is due now!',
        tag: `due-${task.id}`,
      });
    }, delay);
    scheduledMap.set(`${task.id}-ontime`, timeoutId);
  }
}

export function cancelReminder(taskId: string, scheduledMap: Map<string, NodeJS.Timeout>) {
  const beforeId = scheduledMap.get(`${taskId}-before`);
  const ontimeId = scheduledMap.get(`${taskId}-ontime`);

  if (beforeId) {
    clearTimeout(beforeId);
    scheduledMap.delete(`${taskId}-before`);
  }
  if (ontimeId) {
    clearTimeout(ontimeId);
    scheduledMap.delete(`${taskId}-ontime`);
  }
}
