-- Create Tolla Users Table
CREATE TABLE IF NOT EXISTS public.tolla_users (
    id TEXT PRIMARY KEY, -- e.g. TR-84F2K9 (Universal ID)
    phone_number TEXT UNIQUE,
    email_address TEXT UNIQUE,
    name TEXT,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    consent_ip TEXT,
    referral_code TEXT UNIQUE,
    notification_preferences JSONB NOT NULL DEFAULT '{"whatsapp": true, "email": true, "sms": false}',
    wallet_pin_hash TEXT,
    wallet_currency TEXT NOT NULL DEFAULT 'ZAR',
    wallet_status TEXT NOT NULL CHECK (wallet_status IN ('active', 'locked', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Customer Businesses Join Table
CREATE TABLE IF NOT EXISTS public.customer_businesses (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tolla_user_id TEXT NOT NULL REFERENCES public.tolla_users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    custom_identifier TEXT,
    referral_score INT NOT NULL DEFAULT 0,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tolla_user_id, business_id)
);

-- Create Manager Links Table (stateless bypass tokens)
CREATE TABLE IF NOT EXISTS public.manager_links (
    id TEXT PRIMARY KEY, -- unguessable token (e.g. ML-A8B9C)
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    expiry_days TEXT NOT NULL CHECK (expiry_days IN ('30', '90', 'never')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create WhatsApp Contacts Table (normalized thread sessions)
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tolla_user_id TEXT NOT NULL REFERENCES public.tolla_users(id) ON DELETE CASCADE,
    wa_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    last_message TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    conversation_open BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
