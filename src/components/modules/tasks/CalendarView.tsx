import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from './types';
import { PRIORITY_COLORS } from './types';

interface CalendarViewProps {
  tasks: Task[];
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export function CalendarView({ tasks, onDateSelect, selectedDate }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const dateKey = task.due_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  const getTasksForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const getHighestPriority = (dateTasks: Task[]) => {
    if (dateTasks.some((t) => t.priority === 'urgent')) return 'urgent';
    if (dateTasks.some((t) => t.priority === 'high')) return 'high';
    if (dateTasks.some((t) => t.priority === 'medium')) return 'medium';
    return 'low';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateTasks = getTasksForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasTasks = dateTasks.length > 0;
          const highestPriority = hasTasks ? getHighestPriority(dateTasks) : null;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'relative aspect-square p-1 rounded-lg text-sm transition-all hover:bg-accent',
                !isCurrentMonth && 'text-muted-foreground/50',
                isToday && 'ring-2 ring-primary',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <span className="absolute top-1 left-1/2 -translate-x-1/2">
                {format(day, 'd')}
              </span>

              {hasTasks && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      highestPriority === 'urgent' && 'bg-red-500',
                      highestPriority === 'high' && 'bg-orange-500',
                      highestPriority === 'medium' && 'bg-amber-500',
                      highestPriority === 'low' && 'bg-emerald-500'
                    )}
                  />
                  {dateTasks.length > 1 && (
                    <span className="text-[10px] leading-none">{dateTasks.length}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">
            Tasks for {format(selectedDate, 'MMM d, yyyy')}
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {getTasksForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks for this date</p>
            ) : (
              getTasksForDate(selectedDate).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <span className={cn(task.status === 'completed' && 'line-through text-muted-foreground')}>
                    {task.title}
                  </span>
                  <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
                    {task.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
