-- Add new columns for enhanced skin analysis with risk levels and structured data
ALTER TABLE public.skin_analyses 
ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS triage_suggestion text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS condition_probabilities jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS isic_reference_ids text[] DEFAULT NULL;

-- Create index for risk level queries
CREATE INDEX IF NOT EXISTS idx_skin_analyses_risk_level ON public.skin_analyses(risk_level);

-- Add comment for documentation
COMMENT ON COLUMN public.skin_analyses.risk_level IS 'Risk stratification: LOW, MEDIUM, or HIGH based on AI analysis';
COMMENT ON COLUMN public.skin_analyses.confidence_score IS 'AI confidence score between 0-1';
COMMENT ON COLUMN public.skin_analyses.triage_suggestion IS 'Recommended next steps based on analysis';
COMMENT ON COLUMN public.skin_analyses.condition_probabilities IS 'JSON object with condition names and their probabilities';
COMMENT ON COLUMN public.skin_analyses.isic_reference_ids IS 'Array of ISIC image IDs used as reference';