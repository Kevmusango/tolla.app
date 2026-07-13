-- Create Notification Templates Table
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE, -- null for system templates
    name TEXT UNIQUE NOT NULL,
    body_template TEXT NOT NULL,
    channels TEXT[] NOT NULL DEFAULT '{"whatsapp"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Notification Logs Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tolla_user_id TEXT NOT NULL REFERENCES public.tolla_users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
    recipient_address TEXT NOT NULL, -- phone number or email address
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
