-- Add services column to locations table to support Service Catalog
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS services JSONB NOT NULL DEFAULT '[]'::jsonb;
