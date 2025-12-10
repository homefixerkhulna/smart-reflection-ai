-- Add new columns for enhanced analysis with Bengali translations and 20 disease probabilities
ALTER TABLE public.skin_analyses
ADD COLUMN IF NOT EXISTS analysis_text_bn TEXT,
ADD COLUMN IF NOT EXISTS triage_suggestion_bn TEXT,
ADD COLUMN IF NOT EXISTS disease_probabilities JSONB,
ADD COLUMN IF NOT EXISTS visual_features JSONB,
ADD COLUMN IF NOT EXISTS general_skin_info JSONB;