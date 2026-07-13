-- RLS Policies for manager_links Table
CREATE POLICY "Owners can manage manager links" ON public.manager_links
    FOR ALL USING (
        public.check_profile_is_owner(auth.uid(), business_id)
    );

CREATE POLICY "Public read access to manager links" ON public.manager_links
    FOR SELECT USING (deleted_at IS NULL);

-- RLS Policies for reviews Table
CREATE POLICY "Public read access to reviews" ON public.reviews
    FOR SELECT USING (TRUE);

CREATE POLICY "Public write access to reviews" ON public.reviews
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Owners can manage reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.locations l
            WHERE l.id = public.reviews.location_id AND public.check_profile_is_owner(auth.uid(), l.business_id)
        )
    );
