-- Create Reward Transactions Table
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tolla_user_id TEXT NOT NULL REFERENCES public.tolla_users(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('referral', 'loyalty', 'birthday', 'ai_campaign', 'manual_adjustment')),
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED', 'PENDING')),
    reward_type TEXT NOT NULL CHECK (reward_type IN ('cash', 'percentage', 'custom_gift')),
    reward_value TEXT NOT NULL,
    cash_equivalent_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create Referrals Table (claimed coupons)
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    customer_business_id UUID NOT NULL REFERENCES public.customer_businesses(id) ON DELETE CASCADE,
    referee_phone TEXT,
    referee_email TEXT,
    referee_identifier TEXT,
    discount_code TEXT UNIQUE NOT NULL,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'redeemed', 'pending_approval', 'rejected')) DEFAULT 'pending',
    spend_amount NUMERIC(10,2),
    verification_notes TEXT,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create Promotions Table
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create Promotion Locations Table
CREATE TABLE IF NOT EXISTS public.promotion_locations (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(promotion_id, location_id)
);

-- Create Reviews Table (linked to locations and customers)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    tolla_user_id TEXT NOT NULL REFERENCES public.tolla_users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
