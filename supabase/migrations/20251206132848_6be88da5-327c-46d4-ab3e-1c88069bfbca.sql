-- Add recurring task columns
ALTER TABLE public.tasks 
ADD COLUMN recurrence_type text DEFAULT 'none' CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly')),
ADD COLUMN recurrence_end_date date DEFAULT NULL;