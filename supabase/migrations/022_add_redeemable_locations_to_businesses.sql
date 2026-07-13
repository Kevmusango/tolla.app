-- Add redeemable_location_ids column to businesses table to support store eligibility checkmarks
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS redeemable_location_ids JSONB NOT NULL DEFAULT '[]'::jsonb;
