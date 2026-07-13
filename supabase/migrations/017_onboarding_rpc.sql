-- Create Onboarding Transactional RPC Function
CREATE OR REPLACE FUNCTION public.onboard_new_merchant(
  biz_name TEXT,
  biz_slug TEXT,
  loc_name TEXT,
  loc_address TEXT,
  loc_whatsapp TEXT,
  loc_phone TEXT,
  loc_industry TEXT,
  loc_custom_industry TEXT,
  loc_business_type TEXT
)
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_business_id UUID;
  v_subscription_id UUID;
  v_location_id UUID;
  v_profile_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- Get active authenticated user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure profile exists (sanity check)
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
  IF NOT v_profile_exists THEN
    RAISE EXCEPTION 'Profile record does not exist yet. Please wait a moment and try again.';
  END IF;

  -- Check slug uniqueness
  IF EXISTS(SELECT 1 FROM public.businesses WHERE slug = biz_slug AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Business identifier (slug) already taken.';
  END IF;

  -- 1. Insert into public.businesses
  INSERT INTO public.businesses (
    name,
    slug,
    referrer_reward,
    friend_reward,
    status
  )
  VALUES (
    biz_name,
    biz_slug,
    'Free Coffee', -- default placeholders
    'Free Muffin',
    'trial'
  )
  RETURNING id INTO v_business_id;

  -- 2. Link profile as owner in profile_businesses
  INSERT INTO public.profile_businesses (
    profile_id,
    business_id,
    role
  )
  VALUES (
    v_user_id,
    v_business_id,
    'owner'
  );

  -- 3. Create default trial subscription inside public.subscriptions
  INSERT INTO public.subscriptions (
    business_id,
    plan_name,
    status,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end,
    branch_limit,
    scan_limit
  )
  VALUES (
    v_business_id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '14 days',
    NOW(),
    NOW() + INTERVAL '14 days',
    1,
    5
  )
  RETURNING id INTO v_subscription_id;

  -- 4. Create first location in public.locations
  INSERT INTO public.locations (
    business_id,
    name,
    address,
    whatsapp_number,
    phone_number,
    opening_hours,
    industry,
    custom_industry,
    business_type
  )
  VALUES (
    v_business_id,
    loc_name,
    loc_address,
    loc_whatsapp,
    loc_phone,
    '{"monday": "09:00 - 17:00", "tuesday": "09:00 - 17:00", "wednesday": "09:00 - 17:00", "thursday": "09:00 - 17:00", "friday": "09:00 - 17:00", "saturday": "09:00 - 17:00", "sunday": "closed"}'::jsonb,
    loc_industry,
    loc_custom_industry,
    loc_business_type
  )
  RETURNING id INTO v_location_id;

  -- Log business creation event
  INSERT INTO public.tolla_events (type, business_id, location_id, user_id, metadata)
  VALUES (
    'business_created',
    v_business_id,
    v_location_id,
    v_user_id::text,
    jsonb_build_object('name', biz_name, 'slug', biz_slug)
  );

  -- Log location creation event
  INSERT INTO public.tolla_events (type, business_id, location_id, user_id, metadata)
  VALUES (
    'location_created',
    v_business_id,
    v_location_id,
    v_user_id::text,
    jsonb_build_object('name', loc_name, 'address', loc_address)
  );

  -- Build success response object
  v_result := jsonb_build_object(
    'success', true,
    'business_id', v_business_id,
    'location_id', v_location_id,
    'subscription_id', v_subscription_id
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
