import { db } from './MockDatabase';
import { Business, Location, BusinessUser, Promotion, CustomerBusiness, Referral, Review, TollaUser, Wallet, TimelineEvent, ManagerLink } from '../types';
import { supabase } from './supabase';

/**
 * EasyRewardService
 * 
 * This is the clean data abstraction layer. UI components call these methods exclusively.
 * Right now, they translate directly to local MockDatabase calls.
 * To migrate to Supabase in the future, simply swap the method bodies below with Supabase JS SDK queries.
 */
export const EasyRewardService = {
  // --- Business Services ---
  getBusinesses: async (): Promise<Business[]> => {
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .is('deleted_at', null);

    if (bizError) throw bizError;
    if (!businesses) return [];

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('business_id, plan_name');

    const subMap = new Map((subs || []).map(s => [s.business_id, s.plan_name]));

    return businesses.map(b => {
      const plan = subMap.get(b.id) || 'free';
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logo_url || undefined,
        industry: b.industry || 'Other',
        customIndustry: b.custom_industry || undefined,
        businessType: b.business_type || undefined,
        referrerReward: b.referrer_reward,
        friendReward: b.friend_reward,
        subscriptionPlan: 'premium',
        createdAt: b.created_at,
        verificationMethod: b.verification_method as any,
        customIdentifierLabel: b.custom_identifier_label || undefined,
        limitOnePerFriend: b.limit_one_per_friend,
        requirePurchase: b.require_purchase,
        minimumSpend: b.minimum_spend ? Number(b.minimum_spend) : null,
        rewardExpiryDays: b.reward_expiry_days,
        limitOnePerDay: b.limit_one_per_day,
        firstTimeOnly: b.first_time_only,
        blockSelfReferral: b.block_self_referral,
        redeemableLocationIds: b.redeemable_location_ids || [],
        eligibleServiceIds: b.eligible_service_ids || []
      };
    });
  },
  
  createBusiness: async (data: Omit<Business, 'id' | 'createdAt'>): Promise<Business> => {
    const { data: created, error } = await supabase
      .from('businesses')
      .insert({
        name: data.name,
        slug: data.slug,
        logo_url: data.logoUrl || null,
        industry: data.industry,
        custom_industry: data.customIndustry || null,
        business_type: data.businessType || null,
        referrer_reward: data.referrerReward,
        friend_reward: data.friendReward,
        verification_method: data.verificationMethod,
        custom_identifier_label: data.customIdentifierLabel || null,
        limit_one_per_friend: data.limitOnePerFriend,
        require_purchase: data.requirePurchase,
        minimum_spend: data.minimumSpend,
        reward_expiry_days: data.rewardExpiryDays,
        limit_one_per_day: data.limitOnePerDay,
        first_time_only: data.firstTimeOnly,
        block_self_referral: data.blockSelfReferral,
        redeemable_location_ids: data.redeemableLocationIds,
        eligible_service_ids: data.eligibleServiceIds
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      logoUrl: created.logo_url || undefined,
      industry: created.industry || 'Other',
      customIndustry: created.custom_industry || undefined,
      businessType: created.business_type || undefined,
      referrerReward: created.referrer_reward,
      friendReward: created.friend_reward,
      subscriptionPlan: 'premium',
      createdAt: created.created_at,
      verificationMethod: created.verification_method as any,
      customIdentifierLabel: created.custom_identifier_label || undefined,
      limitOnePerFriend: created.limit_one_per_friend,
      requirePurchase: created.require_purchase,
      minimumSpend: created.minimum_spend ? Number(created.minimum_spend) : null,
      rewardExpiryDays: created.reward_expiry_days,
      limitOnePerDay: created.limit_one_per_day,
      firstTimeOnly: created.first_time_only,
      blockSelfReferral: created.block_self_referral,
      redeemableLocationIds: created.redeemable_location_ids || [],
      eligibleServiceIds: created.eligible_service_ids || []
    };
  },
  
  updateBusiness: async (id: string, data: Partial<Business>): Promise<Business> => {
    const updateObj: any = {};
    if (data.name !== undefined) updateObj.name = data.name;
    if (data.logoUrl !== undefined) updateObj.logo_url = data.logoUrl;
    if (data.referrerReward !== undefined) updateObj.referrer_reward = data.referrerReward;
    if (data.friendReward !== undefined) updateObj.friend_reward = data.friendReward;
    if (data.verificationMethod !== undefined) updateObj.verification_method = data.verificationMethod;
    if (data.customIdentifierLabel !== undefined) updateObj.custom_identifier_label = data.customIdentifierLabel;
    if (data.limitOnePerFriend !== undefined) updateObj.limit_one_per_friend = data.limitOnePerFriend;
    if (data.requirePurchase !== undefined) updateObj.require_purchase = data.requirePurchase;
    if (data.minimumSpend !== undefined) updateObj.minimum_spend = data.minimumSpend;
    if (data.rewardExpiryDays !== undefined) updateObj.reward_expiry_days = data.rewardExpiryDays;
    if (data.limitOnePerDay !== undefined) updateObj.limit_one_per_day = data.limitOnePerDay;
    if (data.firstTimeOnly !== undefined) updateObj.first_time_only = data.firstTimeOnly;
    if (data.blockSelfReferral !== undefined) updateObj.block_self_referral = data.blockSelfReferral;
    if (data.redeemableLocationIds !== undefined) updateObj.redeemable_location_ids = data.redeemableLocationIds;
    if (data.eligibleServiceIds !== undefined) updateObj.eligible_service_ids = data.eligibleServiceIds;

    if (Object.keys(updateObj).length > 0) {
      const { error } = await supabase
        .from('businesses')
        .update(updateObj)
        .eq('id', id);
      if (error) throw error;
    }

    if (data.subscriptionPlan !== undefined) {
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({ plan_name: data.subscriptionPlan, updated_at: new Date().toISOString() })
        .eq('business_id', id);
      if (subError) console.error('Failed to update subscription details:', subError.message);
    }

    // Retrieve full updated business details
    const { data: updatedBiz, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('business_id', id)
      .maybeSingle();

    return {
      id: updatedBiz.id,
      name: updatedBiz.name,
      slug: updatedBiz.slug,
      logoUrl: updatedBiz.logo_url || undefined,
      industry: updatedBiz.industry || 'Other',
      customIndustry: updatedBiz.custom_industry || undefined,
      businessType: updatedBiz.business_type || undefined,
      referrerReward: updatedBiz.referrer_reward,
      friendReward: updatedBiz.friend_reward,
      subscriptionPlan: 'premium',
      createdAt: updatedBiz.created_at,
      verificationMethod: updatedBiz.verification_method as any,
      customIdentifierLabel: updatedBiz.custom_identifier_label || undefined,
      limitOnePerFriend: updatedBiz.limit_one_per_friend,
      requirePurchase: updatedBiz.require_purchase,
      minimumSpend: updatedBiz.minimum_spend ? Number(updatedBiz.minimum_spend) : null,
      rewardExpiryDays: updatedBiz.reward_expiry_days,
      limitOnePerDay: updatedBiz.limit_one_per_day,
      firstTimeOnly: updatedBiz.first_time_only,
      blockSelfReferral: updatedBiz.block_self_referral,
      redeemableLocationIds: updatedBiz.redeemable_location_ids || [],
      eligibleServiceIds: updatedBiz.eligible_service_ids || []
    };
  },

  // --- Location Services ---
  getLocations: async (businessId?: string): Promise<Location[]> => {
    let query = supabase
      .from('locations')
      .select('*')
      .is('deleted_at', null);

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, slug');

    return data.map(l => {
      const biz = (businesses || []).find(b => b.id === l.business_id);
      const bizSlug = biz ? biz.slug : l.business_id;
      const waUrl = `https://wa.me/27833977936?text=Hi!%20Join%20${bizSlug}%20${l.id}`;
      return {
        id: l.id,
        businessId: l.business_id,
        name: l.name,
        address: l.address,
        googleMapsLink: l.google_maps_link || undefined,
        whatsappNumber: l.whatsapp_number,
        phoneNumber: l.phone_number,
        openingHours: l.opening_hours,
        galleryUrls: l.gallery_urls || [],
        bannerUrl: l.banner_url || undefined,
        currentPromotionId: l.current_promotion_id || undefined,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waUrl)}`,
        customIdentifierName: l.custom_identifier_name || undefined,
        verificationMethod: l.verification_method || undefined,
        services: l.services || [],
        industry: l.industry || undefined,
        customIndustry: l.custom_industry || undefined,
        businessType: l.business_type || undefined,
        qrPosterText: l.qr_poster_text || undefined,
        createdAt: l.created_at
      };
    });
  },
  
  createLocation: async (data: Omit<Location, 'id' | 'createdAt' | 'qrCodeUrl'>): Promise<Location> => {
    const { data: created, error } = await supabase
      .from('locations')
      .insert({
        business_id: data.businessId,
        name: data.name,
        address: data.address,
        google_maps_link: data.googleMapsLink,
        whatsapp_number: data.whatsappNumber,
        phone_number: data.phoneNumber,
        opening_hours: data.openingHours,
        banner_url: data.bannerUrl,
        current_promotion_id: data.currentPromotionId,
        custom_identifier_name: data.customIdentifierName,
        verification_method: data.verificationMethod,
        industry: data.industry,
        custom_industry: data.customIndustry,
        business_type: data.businessType,
        gallery_urls: data.galleryUrls || []
      })
      .select()
      .single();

    if (error) throw error;

    const { data: biz } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', created.business_id)
      .single();
    const bizSlug = biz ? biz.slug : created.business_id;
    const waUrl = `https://wa.me/27833977936?text=Hi!%20Join%20${bizSlug}%20${created.id}`;

    return {
      id: created.id,
      businessId: created.business_id,
      name: created.name,
      address: created.address,
      googleMapsLink: created.google_maps_link || undefined,
      whatsappNumber: created.whatsapp_number,
      phoneNumber: created.phone_number,
      openingHours: created.opening_hours,
      galleryUrls: created.gallery_urls || [],
      bannerUrl: created.banner_url || undefined,
      currentPromotionId: created.current_promotion_id || undefined,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waUrl)}`,
      customIdentifierName: created.custom_identifier_name || undefined,
      verificationMethod: created.verification_method || undefined,
      services: created.services || [],
      industry: created.industry || undefined,
      customIndustry: created.custom_industry || undefined,
      businessType: created.business_type || undefined,
      qrPosterText: created.qr_poster_text || undefined,
      createdAt: created.created_at
    };
  },
  
  updateLocation: async (id: string, data: Partial<Location>): Promise<Location> => {
    const updateObj: any = {};
    if (data.name !== undefined) updateObj.name = data.name;
    if (data.address !== undefined) updateObj.address = data.address;
    if (data.googleMapsLink !== undefined) updateObj.google_maps_link = data.googleMapsLink;
    if (data.whatsappNumber !== undefined) updateObj.whatsapp_number = data.whatsappNumber;
    if (data.phoneNumber !== undefined) updateObj.phone_number = data.phoneNumber;
    if (data.openingHours !== undefined) updateObj.opening_hours = data.openingHours;
    if (data.bannerUrl !== undefined) updateObj.banner_url = data.bannerUrl;
    if (data.currentPromotionId !== undefined) updateObj.current_promotion_id = data.currentPromotionId;
    if (data.customIdentifierName !== undefined) updateObj.custom_identifier_name = data.customIdentifierName;
    if (data.verificationMethod !== undefined) updateObj.verification_method = data.verificationMethod;
    if (data.industry !== undefined) updateObj.industry = data.industry;
    if (data.customIndustry !== undefined) updateObj.custom_industry = data.customIndustry;
    if (data.businessType !== undefined) updateObj.business_type = data.businessType;
    if (data.galleryUrls !== undefined) updateObj.gallery_urls = data.galleryUrls;
    if (data.qrPosterText !== undefined) updateObj.qr_poster_text = data.qrPosterText;

    const { data: updated, error } = await supabase
      .from('locations')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: biz } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', updated.business_id)
      .single();
    const bizSlug = biz ? biz.slug : updated.business_id;
    const waUrl = `https://wa.me/27833977936?text=Hi!%20Join%20${bizSlug}%20${updated.id}`;

    return {
      id: updated.id,
      businessId: updated.business_id,
      name: updated.name,
      address: updated.address,
      googleMapsLink: updated.google_maps_link || undefined,
      whatsappNumber: updated.whatsapp_number,
      phoneNumber: updated.phone_number,
      openingHours: updated.opening_hours,
      galleryUrls: updated.gallery_urls || [],
      bannerUrl: updated.banner_url || undefined,
      currentPromotionId: updated.current_promotion_id || undefined,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(waUrl)}`,
      customIdentifierName: updated.custom_identifier_name || undefined,
      verificationMethod: updated.verification_method || undefined,
      services: updated.services || [],
      industry: updated.industry || undefined,
      customIndustry: updated.custom_industry || undefined,
      businessType: updated.business_type || undefined,
      qrPosterText: updated.qr_poster_text || undefined,
      createdAt: updated.created_at
    };
  },

  deleteLocation: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('locations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- User Services (Owner / Manager) ---
  getBusinessUsers: async (businessId: string): Promise<BusinessUser[]> => {
    const { data, error } = await supabase
      .from('profile_businesses')
      .select('*, profiles(*)')
      .eq('business_id', businessId);
      
    if (error) throw error;
    if (!data) return [];
    
    return data.map((pb: any) => ({
      id: pb.id,
      businessId: pb.business_id,
      locationId: null,
      role: pb.role as 'owner' | 'manager',
      whatsappNumber: '',
      createdAt: pb.created_at
    }));
  },
  
  createBusinessUser: async (data: Omit<BusinessUser, 'id' | 'createdAt'>): Promise<BusinessUser> => {
    const { data: created, error } = await supabase
      .from('profile_businesses')
      .insert({
        business_id: data.businessId,
        role: data.role
      })
      .select()
      .single();
      
    if (error) throw error;
    return {
      id: created.id,
      businessId: created.business_id,
      locationId: null,
      role: created.role as 'owner' | 'manager',
      whatsappNumber: '',
      createdAt: created.created_at
    };
  },

  // --- Customer Services (Referrer) ---
  getAllCustomerBusinesses: async (): Promise<CustomerBusiness[]> => {
    const { data, error } = await supabase
      .from('customer_businesses')
      .select('*, tolla_users(*)');
      
    if (error) throw error;
    if (!data) return [];
    
    return data.map((cb: any) => ({
      id: cb.id,
      tollaUserId: cb.tolla_user_id,
      businessId: cb.business_id,
      locationId: cb.location_id,
      customIdentifier: cb.custom_identifier || undefined,
      referralScore: cb.referral_score,
      connectedAt: cb.connected_at,
      lastActivityAt: cb.last_activity_at || undefined,
      referralCode: cb.tolla_users?.referral_code || `TR-${cb.tolla_user_id.replace('TR-', '')}`
    }));
  },

  getCustomers: async (businessId: string): Promise<CustomerBusiness[]> => {
    const { data, error } = await supabase
      .from('customer_businesses')
      .select('*, tolla_users(*)')
      .eq('business_id', businessId);
      
    if (error) throw error;
    if (!data) return [];
    
    return data.map((cb: any) => ({
      id: cb.id,
      tollaUserId: cb.tolla_user_id,
      businessId: cb.business_id,
      locationId: cb.location_id,
      customIdentifier: cb.custom_identifier || undefined,
      referralScore: cb.referral_score,
      connectedAt: cb.connected_at,
      lastActivityAt: cb.last_activity_at || undefined,
      referralCode: cb.tolla_users?.referral_code || `TR-${cb.tolla_user_id.replace('TR-', '')}`
    }));
  },
  
  createCustomer: async (data: {
    businessId: string;
    locationId: string;
    phoneNumber?: string;
    emailAddress?: string;
    name?: string;
    customIdentifier?: string;
    marketingConsent?: boolean;
    consentIp?: string;
    preferredChannels?: ('whatsapp' | 'email')[];
  }): Promise<{ customer?: CustomerBusiness; tollaUser?: TollaUser; error?: string }> => {
    try {
      let tollaUserRow = null;
      const cleanPhone = data.phoneNumber ? data.phoneNumber.trim().replace(/\D/g, '') : null;
      const cleanEmail = data.emailAddress ? data.emailAddress.trim().toLowerCase() : null;

      if (cleanPhone) {
        const { data: matched } = await supabase
          .from('tolla_users')
          .select('*')
          .eq('phone_number', data.phoneNumber)
          .maybeSingle();
        tollaUserRow = matched;
      }
      
      if (!tollaUserRow && cleanEmail) {
        const { data: matched } = await supabase
          .from('tolla_users')
          .select('*')
          .eq('email_address', data.emailAddress)
          .maybeSingle();
        tollaUserRow = matched;
      }

      if (!tollaUserRow) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 6; i++) {
          randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const newUserId = `TR-${randomCode}`;

        const { data: inserted, error: insertError } = await supabase
          .from('tolla_users')
          .insert({
            id: newUserId,
            phone_number: data.phoneNumber || null,
            email_address: data.emailAddress || null,
            name: data.name || 'Anonymous Advocate',
            marketing_consent: data.marketingConsent || false,
            consent_timestamp: new Date().toISOString(),
            consent_ip: data.consentIp || null,
            referral_code: newUserId
          })
          .select()
          .single();

        if (insertError) throw insertError;
        tollaUserRow = inserted;
      }

      let customerBusinessRow = null;
      const { data: existingMap } = await supabase
        .from('customer_businesses')
        .select('*')
        .eq('tolla_user_id', tollaUserRow.id)
        .eq('business_id', data.businessId)
        .maybeSingle();

      if (existingMap) {
        customerBusinessRow = existingMap;
      } else {
        const { data: insertedMap, error: mapError } = await supabase
          .from('customer_businesses')
          .insert({
            tolla_user_id: tollaUserRow.id,
            business_id: data.businessId,
            location_id: data.locationId,
            custom_identifier: data.customIdentifier || null,
            referral_score: 0
          })
          .select()
          .single();

        if (mapError) throw mapError;
        customerBusinessRow = insertedMap;
      }

      const returnUser: TollaUser = {
        id: tollaUserRow.id,
        phoneNumber: tollaUserRow.phone_number || undefined,
        emailAddress: tollaUserRow.email_address || undefined,
        name: tollaUserRow.name || undefined,
        marketingConsent: tollaUserRow.marketing_consent,
        consentTimestamp: tollaUserRow.consent_timestamp || undefined,
        consentIp: tollaUserRow.consent_ip || undefined,
        referralCode: tollaUserRow.referral_code,
        createdAt: tollaUserRow.created_at
      };

      const returnCustomer: CustomerBusiness = {
        id: customerBusinessRow.id,
        tollaUserId: customerBusinessRow.tolla_user_id,
        businessId: customerBusinessRow.business_id,
        locationId: customerBusinessRow.location_id,
        customIdentifier: customerBusinessRow.custom_identifier || undefined,
        referralScore: customerBusinessRow.referral_score,
        connectedAt: customerBusinessRow.connected_at,
        lastActivityAt: customerBusinessRow.last_activity_at || undefined,
        referralCode: returnUser.referralCode
      };

      await supabase.from('tolla_events').insert({
        type: 'onboard',
        business_id: data.businessId,
        location_id: data.locationId,
        user_id: returnUser.id,
        metadata: { source: 'qr_scan_registration' }
      });

      return { customer: returnCustomer, tollaUser: returnUser };
    } catch (err: any) {
      console.error("Error creating customer:", err);
      return { error: err.message || "Failed to register customer" };
    }
  },

  getCustomerByReferralCode: async (code: string): Promise<CustomerBusiness | undefined> => {
    const clean = code.trim().toUpperCase().replace('TR-', '');
    
    const { data: users, error } = await supabase
      .from('tolla_users')
      .select('*');

    if (error || !users) return undefined;

    const user = users.find(u => 
      u.id.toUpperCase() === code.toUpperCase() ||
      u.id.toUpperCase().replace('TR-', '') === clean ||
      u.id.toUpperCase() === `u${clean.replace('C', '')}` ||
      u.id.toUpperCase() === `u${code.toUpperCase().replace('C', '')}`
    );

    if (!user) return undefined;

    const { data: cb } = await supabase
      .from('customer_businesses')
      .select('*')
      .eq('tolla_user_id', user.id)
      .maybeSingle();

    if (!cb) return undefined;

    return {
      id: cb.id,
      tollaUserId: cb.tolla_user_id,
      businessId: cb.business_id,
      locationId: cb.location_id,
      customIdentifier: cb.custom_identifier || undefined,
      referralScore: cb.referral_score,
      connectedAt: cb.connected_at,
      lastActivityAt: cb.last_activity_at || undefined,
      referralCode: user.referral_code
    };
  },

  getCustomerByReferralCodeAndBusiness: async (code: string, businessId: string): Promise<CustomerBusiness | undefined> => {
    const { data: users } = await supabase.from('tolla_users').select('*');
    if (!users) return undefined;
    
    const clean = code.trim().toUpperCase();
    const user = users.find(u => 
      u.referral_code?.toUpperCase() === clean ||
      u.id.toUpperCase() === clean ||
      u.id.toUpperCase().replace('TR-', '') === clean
    );
    if (!user) return undefined;
    
    const { data: cb } = await supabase
      .from('customer_businesses')
      .select('*')
      .eq('tolla_user_id', user.id)
      .eq('business_id', businessId)
      .maybeSingle();
      
    if (!cb) return undefined;
    
    return {
      id: cb.id,
      tollaUserId: cb.tolla_user_id,
      businessId: cb.business_id,
      locationId: cb.location_id,
      customIdentifier: cb.custom_identifier || undefined,
      referralScore: cb.referral_score,
      connectedAt: cb.connected_at,
      lastActivityAt: cb.last_activity_at || undefined,
      referralCode: user.referral_code
    };
  },

  getCustomerHubData: async (referralCode: string): Promise<any> => {
    const { data: user, error: userError } = await supabase
      .from('tolla_users')
      .select('*')
      .eq('referral_code', referralCode)
      .maybeSingle();

    if (userError || !user) return null;

    const { data: cbList, error: cbError } = await supabase
      .from('customer_businesses')
      .select('*, businesses(*)')
      .eq('tolla_user_id', user.id);

    if (cbError || !cbList) return { user, relationships: [] };

    const relationships = await Promise.all(cbList.map(async (cb: any) => {
      const biz = cb.businesses;
      const wallets = await EasyRewardService.getWallets(cb.id);
      const locations = await EasyRewardService.getLocations(biz.id);
      const primaryLoc = locations.find((l: any) => l.id === cb.location_id) || locations[0] || null;
      
      return {
        relationshipId: cb.id,
        business: {
          id: biz.id,
          name: biz.name,
          slug: biz.slug,
          logoUrl: biz.logo_url,
          industry: biz.industry,
          referrerReward: biz.referrer_reward,
          friendReward: biz.friend_reward
        },
        location: primaryLoc,
        wallets,
        referralScore: cb.referral_score,
        connectedAt: cb.connected_at
      };
    }));

    return {
      user: {
        id: user.id,
        name: user.name,
        phoneNumber: user.phone_number,
        emailAddress: user.email_address,
        referralCode: user.referral_code,
        createdAt: user.created_at
      },
      relationships
    };
  },

  getTollaUser: async (id: string): Promise<TollaUser | undefined> => {
    const { data, error } = await supabase
      .from('tolla_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.id,
      phoneNumber: data.phone_number || undefined,
      emailAddress: data.email_address || undefined,
      name: data.name || undefined,
      marketingConsent: data.marketing_consent,
      consentTimestamp: data.consent_timestamp || undefined,
      consentIp: data.consent_ip || undefined,
      referralCode: data.referral_code,
      createdAt: data.created_at
    };
  },

  getTollaUserByContact: async (contact: string): Promise<TollaUser | undefined> => {
    const clean = contact.trim().toLowerCase();
    
    let query = supabase.from('tolla_users').select('*');
    if (/^\+?[0-9]+$/.test(clean.replace(/\D/g, ''))) {
      query = query.eq('phone_number', contact);
    } else {
      query = query.eq('email_address', clean);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) return undefined;

    return {
      id: data.id,
      phoneNumber: data.phone_number || undefined,
      emailAddress: data.email_address || undefined,
      name: data.name || undefined,
      marketingConsent: data.marketing_consent,
      consentTimestamp: data.consent_timestamp || undefined,
      consentIp: data.consent_ip || undefined,
      referralCode: data.referral_code,
      createdAt: data.created_at
    };
  },

  getTollaUsers: async (): Promise<TollaUser[]> => {
    const { data, error } = await supabase
      .from('tolla_users')
      .select('*');

    if (error || !data) return [];

    return data.map(u => ({
      id: u.id,
      phoneNumber: u.phone_number || undefined,
      emailAddress: u.email_address || undefined,
      name: u.name || undefined,
      marketingConsent: u.marketing_consent,
      consentTimestamp: u.consent_timestamp || undefined,
      consentIp: u.consent_ip || undefined,
      referralCode: u.referral_code,
      createdAt: u.created_at
    }));
  },

  calculateReferralReward: (referrerRewardSetting: string, spendAmount: number): number => {
    if (!referrerRewardSetting) return 0;
    const cleanSetting = referrerRewardSetting.toLowerCase();
    if (cleanSetting.includes('%')) {
      const match = cleanSetting.match(/(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        const percentVal = parseFloat(match[1]);
        return Math.round((spendAmount * (percentVal / 100)) * 100) / 100;
      }
    }
    const matchCash = cleanSetting.match(/(?:r\s*|cash\s*)?(\d+(?:\.\d+)?)/);
    if (matchCash) {
      return parseFloat(matchCash[1]);
    }
    return 0;
  },

  getWallets: async (customerBusinessId: string): Promise<Wallet[]> => {
    const { data: cb, error: cbError } = await supabase
      .from('customer_businesses')
      .select('*, tolla_users(*)')
      .eq('id', customerBusinessId)
      .maybeSingle();

    if (cbError || !cb) return [];

    const { data: txs, error: txError } = await supabase
      .from('reward_transactions')
      .select('cash_equivalent_value')
      .eq('tolla_user_id', cb.tolla_user_id)
      .eq('business_id', cb.business_id);

    if (txError || !txs) return [];

    const balance = txs.reduce((sum, tx) => sum + (Number(tx.cash_equivalent_value) || 0), 0);

    return [{
      id: `w-${customerBusinessId}`,
      customerBusinessId,
      currency: 'ZAR',
      balance: Math.max(0, Math.round(balance * 100) / 100),
      status: 'active',
      createdAt: cb.connected_at
    }];
  },

  redeemWalletBalance: async (customerBusinessId: string, locationId: string, amountToRedeem: number, managerId: string): Promise<{ success: boolean; error?: string }> => {
    const { data: cb } = await supabase
      .from('customer_businesses')
      .select('*')
      .eq('id', customerBusinessId)
      .single();
      
    if (!cb) return { success: false, error: 'Customer profile not found' };
    
    const wallets = await EasyRewardService.getWallets(customerBusinessId);
    const currentBalance = wallets[0]?.balance || 0;
    
    if (amountToRedeem > currentBalance) {
      return { success: false, error: `Insufficient wallet balance. Available: R${currentBalance.toFixed(2)}` };
    }
    
    const { error: txError } = await supabase
      .from('reward_transactions')
      .insert({
        tolla_user_id: cb.tolla_user_id,
        business_id: cb.business_id,
        location_id: locationId,
        source: 'manual_adjustment',
        status: 'REDEEMED',
        reward_type: 'cash',
        reward_value: String(-amountToRedeem),
        cash_equivalent_value: -amountToRedeem,
        created_by: managerId
      });
      
    if (txError) throw txError;
    
    await supabase.from('tolla_events').insert({
      type: 'redeem_loyalty',
      business_id: cb.business_id,
      location_id: locationId,
      user_id: cb.tolla_user_id,
      metadata: { amount: amountToRedeem, notes: 'Wallet balance redemption' }
    });
    
    return { success: true };
  },

  getTimelineEvents: async (customerBusinessId: string): Promise<TimelineEvent[]> => {
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('customer_business_id', customerBusinessId);

    if (error || !referrals) return [];

    return referrals.map(r => ({
      id: `evt-${r.id}`,
      customerBusinessId,
      eventType: r.status === 'redeemed' ? 'redeemed' : 'invite',
      metadata: { 
        code: r.discount_code, 
        amount: r.spend_amount || 0,
        referee: r.referee_phone || 'Walk-in' 
      },
      createdAt: r.redeemed_at || r.created_at
    }));
  },

  deleteCustomer: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('customer_businesses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Promotion Services ---
  getPromotions: async (businessId: string): Promise<Promotion[]> => {
    const { data: proms, error: promError } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null);

    if (promError || !proms) return [];

    const result: Promotion[] = [];
    for (const p of proms) {
      const { data: locs } = await supabase
        .from('promotion_locations')
        .select('location_id')
        .eq('promotion_id', p.id);

      result.push({
        id: p.id,
        businessId: p.business_id,
        title: p.title,
        description: p.description,
        imageUrl: p.image_url || undefined,
        locationIds: (locs || []).map(l => l.location_id),
        expiryDate: p.expiry_date || undefined,
        createdAt: p.created_at
      });
    }

    return result;
  },
  
  createPromotion: async (data: Omit<Promotion, 'id' | 'createdAt'>): Promise<{ promotion?: Promotion; error?: string }> => {
    try {
      const { data: created, error } = await supabase
        .from('promotions')
        .insert({
          business_id: data.businessId,
          title: data.title,
          description: data.description,
          image_url: data.imageUrl || null,
          expiry_date: data.expiryDate || null
        })
        .select()
        .single();

      if (error) throw error;

      if (data.locationIds && data.locationIds.length > 0) {
        const rows = data.locationIds.map(locId => ({
          promotion_id: created.id,
          location_id: locId
        }));
        const { error: locError } = await supabase
          .from('promotion_locations')
          .insert(rows);
        if (locError) throw locError;
      }

      const returnProm: Promotion = {
        id: created.id,
        businessId: created.business_id,
        title: created.title,
        description: created.description,
        imageUrl: created.image_url || undefined,
        locationIds: data.locationIds,
        expiryDate: created.expiry_date || undefined,
        createdAt: created.created_at
      };

      return { promotion: returnProm };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || "Failed to create promotion" };
    }
  },
  
  updatePromotion: async (id: string, data: Partial<Promotion>): Promise<Promotion> => {
    const updateObj: any = {};
    if (data.title !== undefined) updateObj.title = data.title;
    if (data.description !== undefined) updateObj.description = data.description;
    if (data.imageUrl !== undefined) updateObj.image_url = data.imageUrl || null;
    if (data.expiryDate !== undefined) updateObj.expiry_date = data.expiryDate || null;

    if (Object.keys(updateObj).length > 0) {
      const { error } = await supabase
        .from('promotions')
        .update(updateObj)
        .eq('id', id);
      if (error) throw error;
    }

    if (data.locationIds !== undefined) {
      await supabase.from('promotion_locations').delete().eq('promotion_id', id);
      if (data.locationIds.length > 0) {
        const rows = data.locationIds.map(locId => ({
          promotion_id: id,
          location_id: locId
        }));
        await supabase.from('promotion_locations').insert(rows);
      }
    }

    const { data: updated, error: fetchError } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    return {
      id: updated.id,
      businessId: updated.business_id,
      title: updated.title,
      description: updated.description,
      imageUrl: updated.image_url || undefined,
      locationIds: data.locationIds,
      expiryDate: updated.expiry_date || undefined,
      createdAt: updated.created_at
    };
  },
  
  deletePromotion: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('promotions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // --- Review Services ---
  getReviews: async (locationId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, tolla_users(*)')
      .eq('location_id', locationId);

    if (error || !data) return [];

    return data.map(r => ({
      id: r.id,
      locationId: r.location_id,
      tollaUserId: r.tolla_user_id || undefined,
      customerName: r.customer_name || r.tolla_users?.name || 'Anonymous Customer',
      rating: r.rating,
      comment: r.comment || '',
      isApproved: r.is_approved,
      createdAt: r.created_at
    }));
  },
  
  createReview: async (data: Omit<Review, 'id' | 'createdAt' | 'isApproved'>): Promise<Review> => {
    const { data: created, error } = await supabase
      .from('reviews')
      .insert({
        location_id: data.locationId,
        tolla_user_id: data.tollaUserId || null,
        customer_name: data.customerName,
        rating: data.rating,
        comment: data.comment,
        is_approved: false
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: created.id,
      locationId: created.location_id,
      tollaUserId: created.tolla_user_id || undefined,
      customerName: created.customer_name || data.customerName,
      rating: created.rating,
      comment: created.comment || '',
      isApproved: created.is_approved,
      createdAt: created.created_at
    };
  },
  
  updateReviewStatus: async (id: string, isApproved: boolean): Promise<{ review?: Review; error?: string }> => {
    try {
      const { data: updated, error } = await supabase
        .from('reviews')
        .update({ is_approved: isApproved })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      let userName = '';
      if (updated.tolla_user_id) {
        const { data: user } = await supabase
          .from('tolla_users')
          .select('name')
          .eq('id', updated.tolla_user_id)
          .maybeSingle();
        userName = user?.name || '';
      }

      const returnReview: Review = {
        id: updated.id,
        locationId: updated.location_id,
        tollaUserId: updated.tolla_user_id || undefined,
        customerName: updated.customer_name || userName || 'Anonymous Customer',
        rating: updated.rating,
        comment: updated.comment || '',
        isApproved: updated.is_approved,
        createdAt: updated.created_at
      };

      return { review: returnReview };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || "Failed to update review status" };
    }
  },

  // --- Referral & Redemption Services ---
  getReferrals: async (businessId: string): Promise<Referral[]> => {
    const { data: cbs } = await supabase
      .from('customer_businesses')
      .select('id')
      .eq('business_id', businessId);

    if (!cbs || cbs.length === 0) return [];
    const cbIds = cbs.map(c => c.id);

    const { data, error } = await supabase
      .from('referrals')
      .select('*, customer_businesses(*, tolla_users(*))')
      .in('customer_business_id', cbIds)
      .is('deleted_at', null);

    if (error || !data) return [];

    return data.map(r => ({
      id: r.id,
      customerBusinessId: r.customer_business_id,
      referrerPhone: r.customer_businesses?.tolla_users?.phone_number || undefined,
      referrerName: r.customer_businesses?.tolla_users?.name || undefined,
      refereePhone: r.referee_phone || undefined,
      refereeEmail: r.referee_email || undefined,
      refereeIdentifier: r.referee_identifier || undefined,
      discountCode: r.discount_code,
      locationId: r.location_id,
      status: r.status as 'pending' | 'redeemed' | 'pending_approval' | 'rejected',
      spendAmount: r.spend_amount ? Number(r.spend_amount) : undefined,
      verificationNotes: r.verification_notes || undefined,
      redeemedAt: r.redeemed_at || undefined,
      createdAt: r.created_at
    }));
  },
  
  createReferral: async (data: Omit<Referral, 'id' | 'createdAt' | 'status'> & { marketingConsent?: boolean }): Promise<Referral> => {
    try {
      const cleanPhone = data.refereePhone ? data.refereePhone.trim().replace(/\D/g, '') : null;
      const cleanEmail = data.refereeEmail ? data.refereeEmail.trim().toLowerCase() : null;
      let existingUser = null;

      if (cleanPhone) {
        const { data: matched } = await supabase
          .from('tolla_users')
          .select('*')
          .eq('phone_number', data.refereePhone)
          .maybeSingle();
        existingUser = matched;
      }
      
      if (!existingUser && cleanEmail) {
        const { data: matched } = await supabase
          .from('tolla_users')
          .select('*')
          .eq('email_address', data.refereeEmail)
          .maybeSingle();
        existingUser = matched;
      }

      if (existingUser) {
        await supabase
          .from('tolla_users')
          .update({
            marketing_consent: data.marketingConsent ?? false,
            consent_timestamp: new Date().toISOString()
          })
          .eq('id', existingUser.id);
      } else if (cleanPhone || cleanEmail) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomCode = '';
        for (let i = 0; i < 6; i++) {
          randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const newUserId = `TR-${randomCode}`;
        await supabase
          .from('tolla_users')
          .insert({
            id: newUserId,
            phone_number: data.refereePhone || null,
            email_address: data.refereeEmail || null,
            name: 'Anonymous Friend',
            marketing_consent: data.marketingConsent ?? false,
            consent_timestamp: new Date().toISOString(),
            referral_code: newUserId
          });
      }
    } catch (err) {
      console.error("Error upserting referee user profile for marketing consent:", err);
    }

    const { data: created, error } = await supabase
      .from('referrals')
      .insert({
        customer_business_id: data.customerBusinessId,
        referee_phone: data.refereePhone || null,
        referee_email: data.refereeEmail || null,
        referee_identifier: data.refereeIdentifier || null,
        discount_code: data.discountCode,
        location_id: data.locationId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: created.id,
      customerBusinessId: created.customer_business_id,
      referrerPhone: data.referrerPhone,
      referrerName: data.referrerName,
      refereePhone: created.referee_phone || undefined,
      refereeEmail: created.referee_email || undefined,
      refereeIdentifier: created.referee_identifier || undefined,
      discountCode: created.discount_code,
      locationId: created.location_id,
      status: created.status as 'pending' | 'redeemed' | 'pending_approval' | 'rejected',
      spendAmount: created.spend_amount ? Number(created.spend_amount) : undefined,
      verificationNotes: created.verification_notes || undefined,
      redeemedAt: created.redeemed_at || undefined,
      createdAt: created.created_at
    };
  },
  
  redeemCode: async (
    discountCode: string, 
    managerId: string, 
    locationId: string,
    refereePhone?: string,
    refereeIdentifier?: string,
    spendAmount?: number,
    refereeEmail?: string
  ): Promise<{ referral?: Referral; referrerReward: string; friendReward: string; error?: string }> => {
    try {
      const codeClean = discountCode.trim().toUpperCase();

      const { data: r, error: fetchError } = await supabase
        .from('referrals')
        .select('*, customer_businesses(*, tolla_users(*))')
        .eq('discount_code', codeClean)
        .eq('status', 'pending')
        .is('deleted_at', null)
        .maybeSingle();

      if (fetchError || !r) {
        return { error: "Invalid or already redeemed discount code." };
      }

      const bizId = r.customer_businesses.business_id;
      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', bizId)
        .single();

      if (!biz) {
        return { error: "Business details not found." };
      }

      if (biz.require_purchase && biz.minimum_spend) {
        const spend = spendAmount || 0;
        if (spend < Number(biz.minimum_spend)) {
          return { error: `Minimum checkout spend of R${biz.minimum_spend} is required to validate this code.` };
        }
      }

      const { data: loc } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      const method = loc?.verification_method || biz.verification_method || 'code';
      let verifyNotes = '';

      if (method === 'code_phone') {
        if (!refereePhone) {
          return { error: "Phone number verification is required at this branch location." };
        }
        verifyNotes = `Verified Phone: ${refereePhone}`;
      } else if (method === 'code_identifier') {
        if (!refereeIdentifier) {
          const label = loc?.custom_identifier_name || biz.custom_identifier_label || "Business Identifier";
          return { error: `${label} details are required to validate this checkout.` };
        }
        verifyNotes = `Identifier: ${refereeIdentifier}`;
      }

      const nextStatus = (method === 'manager_approval') ? 'pending_approval' : 'redeemed';
      const updateData: any = {
        status: nextStatus,
        verification_notes: verifyNotes || null,
        spend_amount: spendAmount || null
      };

      if (nextStatus === 'redeemed') {
        updateData.redeemed_at = new Date().toISOString();
        updateData.redeemed_by_user_id = managerId;
      }

      const { data: updatedRef, error: updateError } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', r.id)
        .select()
        .single();

      if (updateError) throw updateError;

      if (nextStatus === 'redeemed') {
        const { data: cb } = await supabase
          .from('customer_businesses')
          .select('referral_score, tolla_user_id')
          .eq('id', r.customer_business_id)
          .single();
        const currentScore = cb?.referral_score || 0;

        await supabase
          .from('customer_businesses')
          .update({ referral_score: currentScore + 1 })
          .eq('id', r.customer_business_id);

        const calculatedVal = EasyRewardService.calculateReferralReward(biz.referrer_reward, spendAmount || 0);

        await supabase
          .from('reward_transactions')
          .insert({
            tolla_user_id: cb?.tolla_user_id || r.customer_businesses.tolla_user_id,
            business_id: bizId,
            location_id: locationId,
            source: 'referral',
            status: 'ACTIVE',
            reward_type: 'cash',
            reward_value: String(calculatedVal),
            cash_equivalent_value: calculatedVal
          });

        await supabase.from('tolla_events').insert({
          type: 'redeem',
          business_id: bizId,
          location_id: locationId,
          user_id: r.customer_businesses.tolla_user_id,
          metadata: { amount: spendAmount || 0, code: codeClean }
        });
      }

      const returnRef: Referral = {
        id: updatedRef.id,
        customerBusinessId: updatedRef.customer_business_id,
        referrerPhone: r.customer_businesses.tolla_users?.phone_number || undefined,
        referrerName: r.customer_businesses.tolla_users?.name || undefined,
        refereePhone: updatedRef.referee_phone || undefined,
        refereeEmail: updatedRef.referee_email || undefined,
        refereeIdentifier: updatedRef.referee_identifier || undefined,
        discountCode: updatedRef.discount_code,
        locationId: updatedRef.location_id,
        status: updatedRef.status as any,
        spendAmount: updatedRef.spend_amount ? Number(updatedRef.spend_amount) : undefined,
        verificationNotes: updatedRef.verification_notes || undefined,
        redeemedAt: updatedRef.redeemed_at || undefined,
        createdAt: updatedRef.created_at
      };

      return {
        referral: returnRef,
        referrerReward: biz.referrer_reward,
        friendReward: biz.friend_reward
      };
    } catch (err: any) {
      console.error(err);
      return { error: err.message || "Failed to validate checkout code" };
    }
  },

  approveReferral: async (referralId: string, managerId: string) => {
    const { data: r, error: fetchError } = await supabase
      .from('referrals')
      .select('*, customer_businesses(*)')
      .eq('id', referralId)
      .single();

    if (fetchError) throw fetchError;

    const { data: updated, error } = await supabase
      .from('referrals')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: managerId
      })
      .eq('id', referralId)
      .select()
      .single();

    if (error) throw error;

    const { data: cb } = await supabase
      .from('customer_businesses')
      .select('referral_score')
      .eq('id', r.customer_business_id)
      .single();
    const currentScore = cb?.referral_score || 0;

    await supabase
      .from('customer_businesses')
      .update({ referral_score: currentScore + 1 })
      .eq('id', r.customer_business_id);

    await supabase.from('tolla_events').insert({
      type: 'redeem',
      business_id: r.customer_businesses.business_id,
      location_id: r.location_id,
      user_id: r.customer_businesses.tolla_user_id,
      metadata: { approved: true, code: r.discount_code }
    });

    return {
      id: updated.id,
      customerBusinessId: updated.customer_business_id,
      discountCode: updated.discount_code,
      locationId: updated.location_id,
      status: updated.status as any,
      redeemedAt: updated.redeemed_at || undefined,
      createdAt: updated.created_at
    };
  },

  rejectReferral: async (referralId: string, managerId: string) => {
    const { data: updated, error } = await supabase
      .from('referrals')
      .update({
        status: 'rejected'
      })
      .eq('id', referralId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: updated.id,
      customerBusinessId: updated.customer_business_id,
      discountCode: updated.discount_code,
      locationId: updated.location_id,
      status: updated.status as any,
      redeemedAt: updated.redeemed_at || undefined,
      createdAt: updated.created_at
    };
  },

  // --- Analytics Services ---
  trackEvent: async (locationId: string, eventType: AnalyticsEvent['eventType'], customerId?: string): Promise<void> => {
    // Determine business ID mapping dynamically
    const { data: location } = await supabase
      .from('locations')
      .select('business_id')
      .eq('id', locationId)
      .single();

    if (!location) return;

    await supabase.from('tolla_events').insert({
      type: eventType === 'qr_scan' ? 'scan' : (eventType === 'page_view' ? 'view' : 'share'),
      business_id: location.business_id,
      location_id: locationId,
      user_id: customerId || null
    });
  },

  getAnalyticsSummary: async (locationId: string) => {
    // Compute analytics details dynamically from live Supabase events lists!
    const { data: cbList } = await supabase
      .from('customer_businesses')
      .select('id')
      .eq('location_id', locationId);

    const cbIds = (cbList || []).map(c => c.id);

    const { count: customersCount } = await supabase
      .from('customer_businesses')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', locationId);

    const { data: events } = await supabase
      .from('tolla_events')
      .select('type')
      .eq('location_id', locationId);

    let redemptionsCount = 0;
    let pendingCount = 0;

    if (cbIds.length > 0) {
      const { count: redCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .in('customer_business_id', cbIds)
        .eq('status', 'redeemed');
      redemptionsCount = redCount || 0;

      const { count: pendCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .in('customer_business_id', cbIds)
        .eq('status', 'pending');
      pendingCount = pendCount || 0;
    }

    const qrScans = (events || []).filter(e => e.type === 'scan' || e.type === 'qr_scan').length;
    const pageViews = (events || []).filter(e => e.type === 'view' || e.type === 'page_view').length;
    const shares = (events || []).filter(e => e.type === 'share' || e.type === 'share_click').length;

    const conversionRate = pageViews > 0 ? Math.round(((redemptionsCount || 0) / pageViews) * 100) : 0;

    return {
      customersRegistered: customersCount || 0,
      referralPagesGenerated: customersCount || 0,
      referralPageViews: pageViews,
      qrScans,
      linksShared: shares,
      successfulRedemptions: redemptionsCount || 0,
      pendingRewards: pendingCount || 0,
      conversionRate,
      registrationAttempts: customersCount || 0
    };
  },

  getWeeklyTraffic: async (locationId: string): Promise<{ name: string; Scans: number; PageViews: number; Shares: number }[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const { data: events, error } = await supabase
      .from('tolla_events')
      .select('type, timestamp')
      .eq('location_id', locationId)
      .gte('timestamp', sevenDaysAgo.toISOString());

    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({
        name: daysShort[d.getDay()],
        dateStr: d.toDateString(),
        Scans: 0,
        PageViews: 0,
        Shares: 0
      });
    }

    if (!error && events) {
      events.forEach(e => {
        const evtDate = new Date(e.timestamp).toDateString();
        const targetDay = result.find(r => r.dateStr === evtDate);
        if (targetDay) {
          if (e.type === 'qr_scan' || e.type === 'scan') {
            targetDay.Scans += 1;
          } else if (e.type === 'page_view' || e.type === 'view') {
            targetDay.PageViews += 1;
          } else if (e.type === 'share_click' || e.type === 'share') {
            targetDay.Shares += 1;
          }
        }
      });
    }

    return result.map(({ name, Scans, PageViews, Shares }) => ({ name, Scans, PageViews, Shares }));
  },

  checkLimitEnforced: async (locationId: string, actionType: 'registration' | 'review_approval' | 'create_promotion'): Promise<{ allowed: boolean; currentCount: number; limit: number }> => {
    return { allowed: true, currentCount: 0, limit: 9999 };
    const { data: location } = await supabase
      .from('locations')
      .select('*, businesses(*)')
      .eq('id', locationId)
      .single();

    if (!location) return { allowed: true, currentCount: 0, limit: 9999 };
    const business = location.businesses;
    if (!business) return { allowed: true, currentCount: 0, limit: 9999 };

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan_name')
      .eq('business_id', business.id)
      .maybeSingle();

    if (sub?.plan_name === 'premium') {
      return { allowed: true, currentCount: 0, limit: 9999 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    if (actionType === 'registration') {
      const { count } = await supabase
        .from('customer_businesses')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .gte('connected_at', startOfMonth);

      const currentCount = count || 0;
      return {
        allowed: currentCount < 5,
        currentCount,
        limit: 5
      };
    }

    if (actionType === 'review_approval') {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', locationId)
        .eq('is_approved', true);

      const currentCount = count || 0;
      return {
        allowed: currentCount < 2,
        currentCount,
        limit: 2
      };
    }

    if (actionType === 'create_promotion') {
      const { count } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('created_at', startOfMonth)
        .is('deleted_at', null);

      const currentCount = count || 0;
      return {
        allowed: currentCount < 2,
        currentCount,
        limit: 2
      };
    }

    return { allowed: true, currentCount: 0, limit: 9999 };
  },

  // --- Service Catalog Services ---
  addService: async (locationId: string, serviceData: { name: string; price: number; imageUrl?: string }) => {
    const { data: loc } = await supabase
      .from('locations')
      .select('services')
      .eq('id', locationId)
      .single();

    const services = loc?.services || [];
    const newService = {
      id: `s_${Date.now()}`,
      name: serviceData.name,
      price: serviceData.price,
      imageUrl: serviceData.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&fit=crop&q=60',
      applicablePromoIds: []
    };

    services.push(newService);

    const { error } = await supabase
      .from('locations')
      .update({ services })
      .eq('id', locationId);

    if (error) throw error;
    return newService;
  },

  deleteService: async (locationId: string, serviceId: string) => {
    const { data: loc } = await supabase
      .from('locations')
      .select('services')
      .eq('id', locationId)
      .single();

    if (!loc) return;
    const services = (loc.services || []).filter((s: any) => s.id !== serviceId);

    const { error } = await supabase
      .from('locations')
      .update({ services })
      .eq('id', locationId);

    if (error) throw error;
  },

  updateService: async (locationId: string, serviceId: string, serviceData: { name: string; price: number; imageUrl?: string }) => {
    const { data: loc } = await supabase
      .from('locations')
      .select('services')
      .eq('id', locationId)
      .single();

    if (!loc) throw new Error("Location not found");
    let updatedService: any = null;
    const services = (loc.services || []).map((s: any) => {
      if (s.id === serviceId) {
        updatedService = {
          ...s,
          name: serviceData.name,
          price: serviceData.price,
          imageUrl: serviceData.imageUrl || s.imageUrl
        };
        return updatedService;
      }
      return s;
    });

    const { error } = await supabase
      .from('locations')
      .update({ services })
      .eq('id', locationId);

    if (error) throw error;
    return updatedService || {};
  },

  togglePromoForService: async (locationId: string, serviceId: string, promoId: string) => {
    const { data: loc } = await supabase
      .from('locations')
      .select('services')
      .eq('id', locationId)
      .single();

    if (!loc) throw new Error("Location not found");
    const services = (loc.services || []).map((s: any) => {
      if (s.id === serviceId) {
        const promos = s.applicablePromoIds || [];
        const index = promos.indexOf(promoId);
        if (index > -1) {
          promos.splice(index, 1);
        } else {
          promos.push(promoId);
        }
        return { ...s, applicablePromoIds: promos };
      }
      return s;
    });

    const { error } = await supabase
      .from('locations')
      .update({ services })
      .eq('id', locationId);

    if (error) throw error;
  },

  // --- Manager Link Services ---
  getAllManagerLinks: async (): Promise<ManagerLink[]> => {
    const { data, error } = await supabase
      .from('manager_links')
      .select('*')
      .is('deleted_at', null);

    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      locationId: l.location_id,
      businessId: l.business_id,
      expiryDays: l.expiry_days as '30' | '90' | 'never',
      expiresAt: l.expires_at,
      createdAt: l.created_at
    }));
  },

  getManagerLinks: async (locationId: string): Promise<ManagerLink[]> => {
    const { data, error } = await supabase
      .from('manager_links')
      .select('*')
      .eq('location_id', locationId)
      .is('deleted_at', null);

    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      locationId: l.location_id,
      businessId: l.business_id,
      expiryDays: l.expiry_days as '30' | '90' | 'never',
      expiresAt: l.expires_at,
      createdAt: l.created_at
    }));
  },

  createManagerLink: async (locationId: string, businessId: string, expiryDays: '30' | '90' | 'never'): Promise<ManagerLink> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'ML-';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let expiresAt: string | null = null;
    if (expiryDays === '30') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (expiryDays === '90') {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { data, error } = await supabase
      .from('manager_links')
      .insert({
        id,
        location_id: locationId,
        business_id: businessId,
        expiry_days: expiryDays,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      locationId: data.location_id,
      businessId: data.business_id,
      expiryDays: data.expiry_days as '30' | '90' | 'never',
      expiresAt: data.expires_at,
      createdAt: data.created_at
    };
  },

  deleteManagerLink: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('manager_links')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  validateManagerLink: async (id: string): Promise<ManagerLink | undefined> => {
    const { data, error } = await supabase
      .from('manager_links')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return undefined;

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return undefined;
    }

    return {
      id: data.id,
      locationId: data.location_id,
      businessId: data.business_id,
      expiryDays: data.expiry_days as '30' | '90' | 'never',
      expiresAt: data.expires_at,
      createdAt: data.created_at
    };
  },

  handleIncomingWhatsAppMessage: async (fromPhone: string, text: string): Promise<{ text: string }> => {
    return db.handleIncomingWhatsAppMessage(fromPhone, text);
  },

  getSystemSetting: async (key: string): Promise<any> => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data?.value || null;
  },

  saveSystemSetting: async (key: string, value: any): Promise<void> => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
  }
};
import { AnalyticsEvent } from '../types';
export type { AnalyticsEvent };
