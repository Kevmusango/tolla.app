-- Alter Profile Businesses table to add nullable location_id for managers
ALTER TABLE public.profile_businesses 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE;
