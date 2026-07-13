-- Add qr_poster_text column to locations table to support customized counter flyer headings
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS qr_poster_text TEXT;
