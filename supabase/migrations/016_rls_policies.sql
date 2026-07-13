-- Security Definer Functions to check membership and ownership without RLS recursion
CREATE OR REPLACE FUNCTION public.check_profile_is_member(user_id UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profile_businesses
    WHERE profile_id = user_id AND business_id = biz_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_profile_is_owner(user_id UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profile_businesses
    WHERE profile_id = user_id AND business_id = biz_id AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_profile_is_manager(user_id UUID, biz_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profile_businesses
    WHERE profile_id = user_id AND business_id = biz_id AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Businesses Policies
CREATE POLICY "Public read access for businesses" ON public.businesses
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Owners can manage their businesses" ON public.businesses
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), id)
    );

-- Profile Businesses Policies
CREATE POLICY "Members can view profile associations" ON public.profile_businesses
    FOR SELECT USING (
        profile_id = auth.uid() OR public.check_profile_is_owner(auth.uid(), business_id)
    );

CREATE POLICY "Owners can manage profile associations" ON public.profile_businesses
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

-- Locations Policies
CREATE POLICY "Public read access for locations" ON public.locations
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Owners can manage locations" ON public.locations
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

CREATE POLICY "Managers can view locations" ON public.locations
    FOR SELECT USING (
        public.check_profile_is_manager(auth.uid(), business_id)
    );

-- Business Media Policies
CREATE POLICY "Public read access for business media" ON public.business_media
    FOR SELECT USING (TRUE);

CREATE POLICY "Owners can manage business media" ON public.business_media
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

-- QR Codes Policies
CREATE POLICY "Public read access for qr codes" ON public.qr_codes
    FOR SELECT USING (active = TRUE);

CREATE POLICY "Owners can manage qr codes" ON public.qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            WHERE l.id = public.qr_codes.location_id AND public.check_profile_is_owner(auth.uid(), l.business_id)
        )
    );

-- Tolla Users (Customers) Policies
CREATE POLICY "Public select and insert access for tolla users" ON public.tolla_users
    FOR SELECT USING (TRUE);

CREATE POLICY "Public insert access for tolla users" ON public.tolla_users
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Customers can manage their own data" ON public.tolla_users
    FOR UPDATE USING (TRUE);

-- Customer Businesses Policies
CREATE POLICY "Public access to customer business maps" ON public.customer_businesses
    FOR SELECT USING (TRUE);

CREATE POLICY "Public registration for customer business maps" ON public.customer_businesses
    FOR INSERT WITH CHECK (TRUE);

-- Reward Transactions Policies
CREATE POLICY "Customers can view their transactions" ON public.reward_transactions
    FOR SELECT USING (TRUE);

CREATE POLICY "Members can read transactions" ON public.reward_transactions
    FOR SELECT USING (
        public.check_profile_is_member(auth.uid(), business_id)
    );

-- Referrals Policies
CREATE POLICY "Public access for referrals claiming" ON public.referrals
    FOR SELECT USING (TRUE);

CREATE POLICY "Public claim referral coupons" ON public.referrals
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Managers and owners can update referrals" ON public.referrals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            WHERE l.id = public.referrals.location_id AND public.check_profile_is_member(auth.uid(), l.business_id)
        )
    );

-- Promotions Policies
CREATE POLICY "Public read access for promotions" ON public.promotions
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Owners can manage promotions" ON public.promotions
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

-- Tolla Events Policies
CREATE POLICY "Public can log analytics events" ON public.tolla_events
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Members can read events" ON public.tolla_events
    FOR SELECT USING (
        public.check_profile_is_member(auth.uid(), business_id)
    );
