-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    google_maps_link TEXT,
    whatsapp_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    opening_hours JSONB NOT NULL,
    banner_url TEXT,
    current_promotion_id UUID,
    custom_identifier_name TEXT,
    verification_method TEXT CHECK (verification_method IN ('code', 'code_phone', 'code_identifier', 'manager_approval')),
    industry TEXT,
    custom_industry TEXT,
    business_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);
