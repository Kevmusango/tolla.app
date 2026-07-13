-- Create Indexes for Join Table Optimizations
CREATE INDEX IF NOT EXISTS idx_profile_biz_ids ON public.profile_businesses(profile_id, business_id);
CREATE INDEX IF NOT EXISTS idx_promo_loc_ids ON public.promotion_locations(promotion_id, location_id);

-- Soft Deletes Filters
CREATE INDEX IF NOT EXISTS idx_businesses_deleted ON public.businesses(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_locations_deleted ON public.locations(deleted_at) WHERE deleted_at IS NULL;

-- Event Logs / Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_tolla_events_biz_time ON public.tolla_events(business_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tolla_events_loc_time ON public.tolla_events(location_id, timestamp DESC);

-- Transaction / Referral Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_reward_transactions_user_biz ON public.reward_transactions(tolla_user_id, business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_discount_code ON public.referrals(discount_code);
CREATE INDEX IF NOT EXISTS idx_manager_links_token ON public.manager_links(id);
