import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, MoreVertical, Pencil, Trash2, Bell, BellOff, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from './types';
import { PRIORITY_COLORS } from './types';

interface TaskListProps {
  tasks: Task[];
  onMarkComplete: (id: string) => void;
  onMarkPending: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  onMarkComplete,
  onMarkPending,
  onEdit,
  onDelete,
  emptyMessage = 'No tasks found',
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className={cn(
            'p-4 transition-all hover:shadow-md',
            task.status === 'completed' && 'opacity-60',
            task.status === 'overdue' && 'border-red-500/50'
          )}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={(checked) =>
                checked ? onMarkComplete(task.id) : onMarkPending(task.id)
              }
              className="mt-1"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    'font-medium truncate',
                    task.status === 'completed' && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </h4>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant="outline" className={cn('text-xs', PRIORITY_COLORS[task.priority])}>
                  {task.priority}
                </Badge>

                <Badge variant="secondary" className="text-xs capitalize">
                  {task.category}
                </Badge>

                {task.status === 'overdue' && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}

                {task.recurrence_type && task.recurrence_type !== 'none' && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    <Repeat className="h-3 w-3 mr-1" />
                    {task.recurrence_type}
                  </Badge>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  {task.due_time && <span>at {task.due_time.slice(0, 5)}</span>}
                </div>

                {task.reminder_enabled ? (
                  <Bell className="h-3 w-3 text-primary" />
                ) : (
                  <BellOff className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
