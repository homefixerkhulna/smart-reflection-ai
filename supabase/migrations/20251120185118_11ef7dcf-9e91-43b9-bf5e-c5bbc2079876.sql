-- Add additional personal information columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS height_feet INTEGER CHECK (height_feet >= 0 AND height_feet <= 8),
ADD COLUMN IF NOT EXISTS height_inches INTEGER CHECK (height_inches >= 0 AND height_inches < 12),
ADD COLUMN IF NOT EXISTS height_cm NUMERIC GENERATED ALWAYS AS ((height_feet * 30.48) + (height_inches * 2.54)) STORED,
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC CHECK (weight_kg > 0 AND weight_kg < 500),
ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));