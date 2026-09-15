-- Additive migration: existing records, amounts and RLS policies remain unchanged.
-- Run once in the SQL Editor of project xmzwebhiljgsxrtfbfvz BEFORE deploying the UI.
BEGIN;
ALTER TABLE public.werkelijk ADD COLUMN IF NOT EXISTS afgerond boolean NOT NULL DEFAULT false;
ALTER TABLE public.werkelijk ADD COLUMN IF NOT EXISTS verdeling jsonb;
ALTER TABLE public.forecast ADD COLUMN IF NOT EXISTS verdeling jsonb;
NOTIFY pgrst, 'reload schema';
COMMIT;
