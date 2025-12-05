import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarDays, Sun, Sunrise, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from './types';
import { PRIORITY_COLORS } from './types';

interface TodayScheduleProps {
  tasks: Task[];
  onMarkComplete: (id: string) => void;
  onMarkPending: (id: string) => void;
}

function getTimeIcon(time?: string | null) {
  if (!time) return <CalendarDays className="h-4 w-4" />;
  const hour = parseInt(time.split(':')[0]);
  if (hour < 12) return <Sunrise className="h-4 w-4 text-amber-400" />;
  if (hour < 18) return <Sun className="h-4 w-4 text-yellow-400" />;
  return <Moon className="h-4 w-4 text-indigo-400" />;
}

export function TodaySchedule({ tasks, onMarkComplete, onMarkPending }: TodayScheduleProps) {
  const today = new Date();
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_time && !b.due_time) return 0;
    if (!a.due_time) return 1;
    if (!b.due_time) return -1;
    return a.due_time.localeCompare(b.due_time);
  });

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Today's Schedule</h3>
          <p className="text-sm text-muted-foreground">{format(today, 'EEEE, MMMM d')}</p>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No tasks scheduled for today</p>
          <p className="text-sm">Enjoy your free day!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all hover:bg-accent/50',
                task.status === 'completed' && 'opacity-50'
              )}
            >
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={(checked) =>
                  checked ? onMarkComplete(task.id) : onMarkPending(task.id)
                }
              />

              <div className="flex items-center gap-2">
                {getTimeIcon(task.due_time)}
                <span className="text-sm font-medium w-14">
                  {task.due_time ? task.due_time.slice(0, 5) : 'All day'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'font-medium truncate',
                    task.status === 'completed' && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </p>
              </div>

              <Badge variant="outline" className={cn('text-xs shrink-0', PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t flex justify-between text-sm text-muted-foreground">
        <span>{sortedTasks.filter((t) => t.status === 'completed').length} completed</span>
        <span>{sortedTasks.filter((t) => t.status !== 'completed').length} remaining</span>
      </div>
    </Card>
  );
}
