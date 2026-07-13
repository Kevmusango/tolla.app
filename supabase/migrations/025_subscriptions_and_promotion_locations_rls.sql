-- RLS Policies for subscriptions Table
CREATE POLICY "Members can view subscriptions" ON public.subscriptions
    FOR SELECT USING (
        public.check_profile_is_member(auth.uid(), business_id)
    );

CREATE POLICY "Owners can manage subscriptions" ON public.subscriptions
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

-- RLS Policies for promotion_locations Table
CREATE POLICY "Public read access for promotion locations" ON public.promotion_locations
    FOR SELECT USING (TRUE);

CREATE POLICY "Owners can manage promotion locations" ON public.promotion_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.promotions p
            WHERE p.id = public.promotion_locations.promotion_id AND public.check_profile_is_owner(auth.uid(), p.business_id)
        )
    );
