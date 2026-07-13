-- Add eligible_service_ids column to businesses table to map which catalog items the friend discount applies to
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS eligible_service_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
