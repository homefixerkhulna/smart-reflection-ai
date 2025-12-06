import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ListTodo, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTasks } from './hooks/useTasks';
import { useReminder } from './hooks/useReminder';
import { TaskList } from './TaskList';
import { TodaySchedule } from './TodaySchedule';
import { CalendarView } from './CalendarView';
import { CreateTaskModal } from './CreateTaskModal';
import type { Task } from './types';

export function TaskManagerModule() {
  const {
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
  } = useTasks();

  useReminder(tasks);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>();

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setIsCreateOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateOpen(false);
    setEditTask(null);
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Manager</h2>
          <p className="text-muted-foreground">Manage your tasks and reminders</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <ListTodo className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks.length}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayTasks.length}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueTasks.length}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
              <TabsTrigger value="completed">Done</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <TaskList
                tasks={pendingTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No pending tasks"
              />
            </TabsContent>

            <TabsContent value="today">
              <TaskList
                tasks={todayTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No tasks for today"
              />
            </TabsContent>

            <TabsContent value="weekly">
              <TaskList
                tasks={weeklyTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No tasks for this week"
              />
            </TabsContent>

            <TabsContent value="monthly">
              <TaskList
                tasks={monthlyTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No tasks for this month"
              />
            </TabsContent>

            <TabsContent value="yearly">
              <TaskList
                tasks={yearlyTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No tasks for this year"
              />
            </TabsContent>

            <TabsContent value="completed">
              <TaskList
                tasks={completedTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No completed tasks yet"
              />
            </TabsContent>

            <TabsContent value="overdue">
              <TaskList
                tasks={overdueTasks}
                onMarkComplete={markComplete}
                onMarkPending={markPending}
                onEdit={handleEdit}
                onDelete={deleteTask}
                emptyMessage="No overdue tasks. Great job!"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <TodaySchedule
            tasks={todayTasks}
            onMarkComplete={markComplete}
            onMarkPending={markPending}
          />
          <CalendarView
            tasks={tasks}
            selectedDate={selectedCalendarDate}
            onDateSelect={setSelectedCalendarDate}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={handleCloseModal}
        onSubmit={createTask}
        editTask={editTask}
        onUpdate={updateTask}
      />
    </div>
  );
}
