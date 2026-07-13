-- Add gallery_urls column to locations table to support store layout custom photos gallery
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
