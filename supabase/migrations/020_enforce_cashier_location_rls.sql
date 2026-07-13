-- Create function to verify if a profile is allowed to manage a specific branch location
CREATE OR REPLACE FUNCTION public.check_profile_can_manage_location(user_id UUID, loc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  biz_id UUID;
  profile_loc_id UUID;
  profile_role TEXT;
BEGIN
  -- Get business ID of the location
  SELECT business_id INTO biz_id FROM public.locations WHERE id = loc_id;
  IF biz_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get profile business association details
  SELECT location_id, role INTO profile_loc_id, profile_role 
  FROM public.profile_businesses 
  WHERE profile_id = user_id AND business_id = biz_id;

  -- If no association found, deny
  IF profile_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owners have all-access
  IF profile_role = 'owner' THEN
    RETURN TRUE;
  END IF;

  -- Managers are restricted to their specific branch location
  IF profile_role = 'manager' THEN
    RETURN (profile_loc_id = loc_id);
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old update policy on referrals
DROP POLICY IF EXISTS "Managers and owners can update referrals" ON public.referrals;

-- Recreate referrals update policy with strict cashier-location checking
CREATE POLICY "Managers and owners can update referrals" ON public.referrals
    FOR UPDATE USING (
        public.check_profile_can_manage_location(auth.uid(), location_id)
    );
