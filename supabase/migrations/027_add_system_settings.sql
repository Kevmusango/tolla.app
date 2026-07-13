-- Create system_settings table to store global configurations like invoice details
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to system_settings
DROP POLICY IF EXISTS "Public read access to system settings" ON public.system_settings;
CREATE POLICY "Public read access to system settings" ON public.system_settings
    FOR SELECT USING (TRUE);

-- Allow admins (all logged in authenticated users for simulation) to manage settings
DROP POLICY IF EXISTS "Public write access to system settings" ON public.system_settings;
CREATE POLICY "Public write access to system settings" ON public.system_settings
    FOR ALL USING (TRUE);

-- Seed default invoice settings
INSERT INTO public.system_settings (key, value)
VALUES (
    'invoice_details',
    '{
        "companyName": "Tolla (Pty) Ltd",
        "companyAddress": "124 Rivonia Road, Sandton, Johannesburg, South Africa, 2196",
        "bankName": "First National Bank (FNB)",
        "accountHolder": "Tolla (Pty) Ltd",
        "accountNumber": "62901234567",
        "branchCode": "250655"
    }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
