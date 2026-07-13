-- Add customer_name column to reviews table to store reviewer names directly
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Make tolla_user_id nullable to support guest/anonymous feedback reviews
ALTER TABLE public.reviews ALTER COLUMN tolla_user_id DROP NOT NULL;
