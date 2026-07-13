-- Create Profile Businesses Join Table (Role Map)
CREATE TABLE IF NOT EXISTS public.profile_businesses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(profile_id, business_id)
);
