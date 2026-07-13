import { Business, Location, BusinessUser, Promotion, Customer, Referral, Review, AnalyticsEvent, TollaUser, CustomerBusiness, Wallet, TimelineEvent, ManagerLink } from '../types';
import { 
  INITIAL_BUSINESSES, 
  INITIAL_LOCATIONS, 
  INITIAL_BUSINESS_USERS, 
  INITIAL_PROMOTIONS, 
  INITIAL_CUSTOMERS, 
  INITIAL_REFERRALS, 
  INITIAL_REVIEWS, 
  generateMockAnalyticsEvents,
  INITIAL_TOLLA_USERS,
  INITIAL_CUSTOMER_BUSINESSES,
  INITIAL_WALLETS,
  INITIAL_TIMELINE_EVENTS
} from './mockData';

class MockDatabase {
  private get<T>(key: string, initial: T): T {
    const val = localStorage.getItem(`tolla_${key}`);
    if (!val) {
      this.set(key, initial);
      return initial;
    }
    try {
      return JSON.parse(val) as T;
    } catch {
      return initial;
    }
  }

  private set<T>(key: string, value: T): void {
    localStorage.setItem(`tolla_${key}`, JSON.stringify(value));
  }

  // --- Core Lists (Getters) ---
  public getBusinesses(): Business[] {
    const list = this.get<Business[]>('businesses', INITIAL_BUSINESSES);
    let modified = false;
    const now = new Date();
    const migrated = list.map(b => {
      let updatedBiz = { ...b };
      
      // Auto-deactivate check
      if (updatedBiz.subscriptionPlan === 'premium' && updatedBiz.subscriptionExpiresAt) {
        const expiryDate = new Date(updatedBiz.subscriptionExpiresAt);
        if (now > expiryDate) {
          updatedBiz.subscriptionPlan = 'free';
          modified = true;
        }
      }

      if (updatedBiz.verificationMethod === undefined) {
        modified = true;
        updatedBiz = {
          ...updatedBiz,
          verificationMethod: 'code',
          customIdentifierLabel: 'Appointment Name',
          limitOnePerFriend: true,
          requirePurchase: false,
          minimumSpend: null,
          rewardExpiryDays: 30,
          limitOnePerDay: false,
          firstTimeOnly: true,
          blockSelfReferral: true
        };
      }
      return updatedBiz;
    });
    if (modified) {
      this.setBusinesses(migrated);
    }
    return migrated;
  }

  public getLocations(): Location[] {
    const list = this.get<Location[]>('locations', INITIAL_LOCATIONS);
    let modified = false;
    const migrated = list.map(l => {
      if (l.verificationMethod === undefined) {
        modified = true;
        return {
          ...l,
          verificationMethod: 'code',
          customIdentifierName: l.customIdentifierName ?? ''
        };
      }
      return l;
    });
    if (modified) {
      this.setLocations(migrated);
    }
    return migrated;
  }

  public getBusinessUsers(): BusinessUser[] {
    return this.get<BusinessUser[]>('business_users', INITIAL_BUSINESS_USERS);
  }

  public getPromotions(): Promotion[] {
    return this.get<Promotion[]>('promotions', INITIAL_PROMOTIONS);
  }

  public getTollaUsers(): TollaUser[] {
    return this.get<TollaUser[]>('tolla_users', INITIAL_TOLLA_USERS);
  }
  public setTollaUsers(data: TollaUser[]): void {
    this.set('tolla_users', data);
  }

  public getCustomerBusinesses(): CustomerBusiness[] {
    return this.get<CustomerBusiness[]>('customer_businesses', INITIAL_CUSTOMER_BUSINESSES);
  }
  public setCustomerBusinesses(data: CustomerBusiness[]): void {
    this.set('customer_businesses', data);
  }

  public getCustomers(): CustomerBusiness[] {
    return this.getCustomerBusinesses();
  }

  public getWallets(): Wallet[] {
    return this.get<Wallet[]>('wallets', INITIAL_WALLETS);
  }
  public setWallets(data: Wallet[]): void {
    this.set('wallets', data);
  }

  public getTimelineEvents(): TimelineEvent[] {
    return this.get<TimelineEvent[]>('timeline_events', INITIAL_TIMELINE_EVENTS);
  }
  public setTimelineEvents(data: TimelineEvent[]): void {
    this.set('timeline_events', data);
  }

  public getReferrals(): Referral[] {
    return this.get<Referral[]>('referrals', INITIAL_REFERRALS);
  }
  public setReferrals(data: Referral[]): void {
    this.set('referrals', data);
  }

  public getReviews(): Review[] {
    return this.get<Review[]>('reviews', INITIAL_REVIEWS);
  }
  public setReviews(data: Review[]): void {
    this.set('reviews', data);
  }

  public getAnalyticsEvents(): AnalyticsEvent[] {
    return this.get<AnalyticsEvent[]>('analytics_events', generateMockAnalyticsEvents());
  }

  // --- Setters ---
  private setBusinesses(data: Business[]): void { this.set('businesses', data); }
  private setLocations(data: Location[]): void { this.set('locations', data); }
  private setBusinessUsers(data: BusinessUser[]): void { this.set('business_users', data); }
  private setPromotions(data: Promotion[]): void { this.set('promotions', data); }
  private setAnalyticsEvents(data: AnalyticsEvent[]): void { this.set('analytics_events', data); }

  // --- helper functions ---
  public generateTollaUserId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    const users = this.getTollaUsers();
    do {
      code = 'TR-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (users.some(u => u.id === code));
    return code;
  }

  public generateReferralCode(): string {
    return this.generateTollaUserId().replace('TR-', '');
  }

  // --- Subscriptions and Limits ---
  public checkLimitEnforced(locationId: string, actionType: 'registration' | 'review_approval' | 'create_promotion'): { allowed: boolean; currentCount: number; limit: number } {
    const locations = this.getLocations();
    const location = locations.find(l => l.id === locationId);
    if (!location) return { allowed: true, currentCount: 0, limit: 9999 };

    const businesses = this.getBusinesses();
    const business = businesses.find(b => b.id === location.businessId);
    if (!business) return { allowed: true, currentCount: 0, limit: 9999 };

    // If Premium, no limits!
    if (business.subscriptionPlan === 'premium') {
      return { allowed: true, currentCount: 0, limit: 9999 };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (actionType === 'registration') {
      // Free plan: max 5 successful registrations per location per calendar month
      const customers = this.getCustomers().filter(c => {
        const date = new Date(c.createdAt);
        return c.locationId === locationId && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      return {
        allowed: customers.length < 5,
        currentCount: customers.length,
        limit: 5
      };
    }

    if (actionType === 'review_approval') {
      // Free plan: max 2 approved reviews showing on links
      const approvedReviews = this.getReviews().filter(r => r.locationId === locationId && r.isApproved);
      return {
        allowed: approvedReviews.length < 2,
        currentCount: approvedReviews.length,
        limit: 2
      };
    }

    if (actionType === 'create_promotion') {
      // Free plan: max 2 promotions created per calendar month
      const promos = this.getPromotions().filter(p => {
        const date = new Date(p.createdAt);
        return p.businessId === business.id && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      return {
        allowed: promos.length < 2,
        currentCount: promos.length,
        limit: 2
      };
    }

    return { allowed: true, currentCount: 0, limit: 9999 };
  }

  // --- CRUD Implementations ---

  // Business
  public createBusiness(data: Omit<Business, 'id' | 'createdAt'>): Business {
    const businesses = this.getBusinesses();
    const newBiz: Business = {
      ...data,
      id: `b-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    businesses.push(newBiz);
    this.setBusinesses(businesses);
    return newBiz;
  }

  public updateBusiness(id: string, data: Partial<Business>): Business {
    const businesses = this.getBusinesses();
    const index = businesses.findIndex(b => b.id === id);
    if (index === -1) throw new Error("Business not found");
    businesses[index] = { ...businesses[index], ...data };
    this.setBusinesses(businesses);
    return businesses[index];
  }

  // Location
  public createLocation(data: Omit<Location, 'id' | 'createdAt' | 'qrCodeUrl'>): Location {
    const locations = this.getLocations();
    const id = `loc-${Date.now()}`;
    
    // Find the business slug to create a realistic QR Code URL
    const businesses = this.getBusinesses();
    const biz = businesses.find(b => b.id === data.businessId);
    const slug = biz ? biz.slug : 'default';

    const newLoc: Location = {
      ...data,
      id,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${slug}.tolla.app/scan`,
      createdAt: new Date().toISOString()
    };
    locations.push(newLoc);
    this.setLocations(locations);
    return newLoc;
  }

  public updateLocation(id: string, data: Partial<Location>): Location {
    const locations = this.getLocations();
    const index = locations.findIndex(l => l.id === id);
    if (index === -1) throw new Error("Location not found");
    locations[index] = { ...locations[index], ...data };
    this.setLocations(locations);
    return locations[index];
  }

  public deleteLocation(id: string): void {
    const locations = this.getLocations();
    const updated = locations.filter(l => l.id !== id);
    this.setLocations(updated);
  }

  // Business User
  public createBusinessUser(data: Omit<BusinessUser, 'id' | 'createdAt'>): BusinessUser {
    const users = this.getBusinessUsers();
    const newUser: BusinessUser = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.setBusinessUsers(users);
    return newUser;
  }

  // Customer (Referrer Scan Flow / Opt-in)
  public createCustomer(data: {
    businessId: string;
    locationId: string;
    phoneNumber?: string;
    emailAddress?: string;
    name?: string;
    customIdentifier?: string;
    marketingConsent?: boolean;
    consentIp?: string;
    preferredChannels?: ('whatsapp' | 'email')[];
  }): { customer?: CustomerBusiness; tollaUser?: TollaUser; error?: string } {
    if (!data.phoneNumber && !data.emailAddress) {
      return { error: "Please enter your WhatsApp Number or Email Address to register." };
    }

    const limitStatus = this.checkLimitEnforced(data.locationId, 'registration');
    if (!limitStatus.allowed) {
      this.trackEvent(data.locationId, 'registration_attempt');
      return { error: `Free limit reached. This location has used its 5 free customer registrations for the month.` };
    }

    // 1. Check or Create Universal TollaUser
    const users = this.getTollaUsers();
    let tollaUser = users.find(u => 
      (data.phoneNumber && u.phoneNumber === data.phoneNumber) || 
      (data.emailAddress && u.emailAddress && u.emailAddress.toLowerCase() === data.emailAddress.toLowerCase())
    );

    const mockIps = ["41.13.12.98", "197.82.4.15", "196.12.44.89", "41.220.10.5", "197.43.12.110"];
    const randomIp = mockIps[Math.floor(Math.random() * mockIps.length)];

    if (!tollaUser) {
      const code = this.generateTollaUserId();
      tollaUser = {
        id: code,
        phoneNumber: data.phoneNumber,
        emailAddress: data.emailAddress,
        name: data.name || (data.emailAddress ? data.emailAddress.split('@')[0] : 'Member'),
        marketingConsent: data.marketingConsent ?? true,
        consentTimestamp: new Date().toISOString(),
        consentIp: data.consentIp || randomIp,
        preferredChannels: data.preferredChannels || (data.phoneNumber ? ['whatsapp'] : ['email']),
        createdAt: new Date().toISOString()
      };
      users.push(tollaUser);
      this.setTollaUsers(users);
    }

    // 2. Check or Create CustomerBusiness Relationship
    const relationships = this.getCustomerBusinesses();
    let relationship = relationships.find(r => r.tollaUserId === tollaUser.id && r.businessId === data.businessId);

    if (!relationship) {
      const id = `cb-${Date.now()}`;
      relationship = {
        id,
        tollaUserId: tollaUser.id,
        businessId: data.businessId,
        locationId: data.locationId,
        customIdentifier: data.customIdentifier,
        referralScore: 0,
        connectedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      };
      relationships.push(relationship);
      this.setCustomerBusinesses(relationships);

      // Create Initial Empty Wallet for this store relationship
      const wallets = this.getWallets();
      wallets.push({
        id: `w-${Date.now()}`,
        customerBusinessId: id,
        rewardType: 'cash',
        balance: 0,
        description: 'Store Wallet Credit',
        updatedAt: new Date().toISOString()
      });
      this.setWallets(wallets);

      // Log Timeline event
      const events = this.getTimelineEvents();
      events.push({
        id: `t-${Date.now()}`,
        customerBusinessId: id,
        eventType: 'registered',
        description: `Opted in and connected profile to business.`,
        createdAt: new Date().toISOString()
      });
      this.setTimelineEvents(events);
    } else {
      relationship.lastActivityAt = new Date().toISOString();
      this.setCustomerBusinesses(relationships);
    }

    this.trackEvent(data.locationId, 'qr_scan', relationship.id);

    return { customer: relationship, tollaUser };
  }

  // Promotion
  public createPromotion(data: Omit<Promotion, 'id' | 'createdAt'>): { promotion?: Promotion; error?: string } {
    // Need to find location of business to check limit. Since promotions are business-wide, we check business-wide limit.
    const locations = this.getLocations().filter(l => l.businessId === data.businessId);
    
    // Check limit on the first location
    if (locations.length > 0) {
      const limitStatus = this.checkLimitEnforced(locations[0].id, 'create_promotion');
      if (!limitStatus.allowed) {
        return { error: `Free plan limit reached. You can only create 2 promotions per month on the Free Plan.` };
      }
    }

    const promotions = this.getPromotions();
    const newPromo: Promotion = {
      ...data,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    promotions.push(newPromo);
    this.setPromotions(promotions);
    return { promotion: newPromo };
  }

  public updatePromotion(id: string, data: Partial<Promotion>): Promotion {
    const promotions = this.getPromotions();
    const index = promotions.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Promotion not found");
    promotions[index] = { ...promotions[index], ...data };
    this.setPromotions(promotions);
    return promotions[index];
  }

  public deletePromotion(id: string): void {
    const promotions = this.getPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    this.setPromotions(filtered);
  }

  // Reviews
  public createReview(data: Omit<Review, 'id' | 'createdAt' | 'isApproved'>): Review {
    const reviews = this.getReviews();
    const newReview: Review = {
      ...data,
      id: `rev-${Date.now()}`,
      isApproved: false,
      createdAt: new Date().toISOString()
    };
    reviews.push(newReview);
    this.setReviews(reviews);
    return newReview;
  }

  public updateReviewStatus(id: string, isApproved: boolean): { review?: Review; error?: string } {
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) throw new Error("Review not found");

    if (isApproved) {
      // Check limits before approving
      const limitStatus = this.checkLimitEnforced(reviews[index].locationId, 'review_approval');
      if (!limitStatus.allowed) {
        return { error: `Free limit reached. You can show a maximum of 2 approved reviews on the Free Plan.` };
      }
    }

    reviews[index].isApproved = isApproved;
    this.setReviews(reviews);
    return { review: reviews[index] };
  }

  // Referrals (Redemptions)
  public createReferral(data: Omit<Referral, 'id' | 'createdAt' | 'status'>): Referral {
    const referrals = this.getReferrals();
    const newRef: Referral = {
      ...data,
      id: `ref-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    referrals.push(newRef);
    this.setReferrals(referrals);
    return newRef;
  }

  private detectFraudWarnings(
    referrals: Referral[], 
    customerBusinessId: string, 
    discountCode: string, 
    refereePhone?: string, 
    refereeIdentifier?: string,
    refereeEmail?: string
  ): string[] {
    const warnings: string[] = [];
    const cleanPhone = refereePhone ? refereePhone.trim().replace(/\D/g, '') : '';
    const cleanIdentifier = refereeIdentifier ? refereeIdentifier.trim().toLowerCase() : '';
    const cleanEmail = refereeEmail ? refereeEmail.trim().toLowerCase() : '';

    if (cleanPhone) {
      // 1. Same phone number used repeatedly
      const phoneRedemptions = referrals.filter(r => 
        (r.status === 'redeemed' || r.status === 'pending_approval') && 
        r.refereePhone && 
        r.refereePhone.trim().replace(/\D/g, '') === cleanPhone
      );
      if (phoneRedemptions.length >= 1) {
        warnings.push(`Friend's phone (${refereePhone}) has already redeemed ${phoneRedemptions.length} time(s).`);
      }
    }

    if (cleanEmail) {
      // Same email used repeatedly
      const emailRedemptions = referrals.filter(r => 
        (r.status === 'redeemed' || r.status === 'pending_approval') && 
        r.refereeEmail && 
        r.refereeEmail.trim().toLowerCase() === cleanEmail
      );
      if (emailRedemptions.length >= 1) {
        warnings.push(`Friend's email (${refereeEmail}) has already redeemed ${emailRedemptions.length} time(s).`);
      }
    }

    if (cleanIdentifier) {
      // 2. Same identifier used multiple times
      const idRedemptions = referrals.filter(r => 
        (r.status === 'redeemed' || r.status === 'pending_approval') && 
        r.refereeIdentifier && 
        r.refereeIdentifier.trim().toLowerCase() === cleanIdentifier
      );
      if (idRedemptions.length >= 1) {
        warnings.push(`Identifier "${refereeIdentifier}" has been used in ${idRedemptions.length} redemption(s).`);
      }
    }

    // 3. Many referrals redeemed within minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentRedemptions = referrals.filter(r => 
      r.redeemedAt && 
      new Date(r.redeemedAt).getTime() > fiveMinutesAgo
    );
    if (recentRedemptions.length >= 3) {
      warnings.push(`High frequency: ${recentRedemptions.length} codes redeemed in the last 5 minutes.`);
    }

    // 4. One customer generating unusually high numbers of referrals
    const successfulAdvocacies = referrals.filter(r => 
      r.customerBusinessId === customerBusinessId && 
      (r.status === 'redeemed' || r.status === 'pending_approval')
    );
    if (successfulAdvocacies.length >= 5) {
      warnings.push(`Advocate has generated ${successfulAdvocacies.length} successful referrals.`);
    }

    return warnings;
  }

  public redeemCode(
    discountCode: string, 
    managerId: string, 
    locationId: string, 
    refereePhone?: string, 
    refereeIdentifier?: string,
    spendAmount?: number,
    refereeEmail?: string
  ): { referral?: Referral; referrerReward: string; friendReward: string; error?: string } {
    const referrals = this.getReferrals();
    const locations = this.getLocations();
    const businesses = this.getBusinesses();

    const location = locations.find(l => l.id === locationId);
    if (!location) return { error: "Location not found.", referrerReward: "", friendReward: "" };

    const business = businesses.find(b => b.id === location.businessId);
    if (!business) return { error: "Business profile not found.", referrerReward: "", friendReward: "" };

    const referrerReward = business.referrerReward;
    const friendReward = business.friendReward;

    // Validate if the reward can be redeemed at this location
    const eligibleIds = business.redeemableLocationIds ?? [];
    if (eligibleIds.length > 0 && !eligibleIds.includes(locationId)) {
      return { error: `Redemption failed: Referral rewards cannot be redeemed at this branch (${location.name}).`, referrerReward, friendReward };
    }

    // Find referrer TollaUser by code/id
    const cleanCode = discountCode.trim().toUpperCase().replace('TR-', '');
    const users = this.getTollaUsers();
    const tollaUser = users.find(u => 
      u.id.toUpperCase() === discountCode.toUpperCase() ||
      u.id.toUpperCase().replace('TR-', '') === cleanCode ||
      u.id.toUpperCase() === `u${cleanCode.replace('C', '')}` ||
      u.id.toUpperCase() === `u${discountCode.toUpperCase().replace('C', '')}`
    );

    if (!tollaUser) {
      return { error: "Invalid referral code. Please check and try again.", referrerReward, friendReward };
    }

    // Find CustomerBusiness relationship for this tollaUser at this business
    const customers = this.getCustomerBusinesses();
    const referrer = customers.find(c => c.tollaUserId === tollaUser.id && c.businessId === business.id);
    if (!referrer) {
      return { error: "No active advocate connection found for this business.", referrerReward, friendReward };
    }

    // 1. Verification Mode Constraints
    const activeMethod = location.verificationMethod || business.verificationMethod || 'code';
    const activeLabel = location.customIdentifierName || business.customIdentifierLabel || 'Identifier';

    if (activeMethod === 'code_phone' && !refereePhone && !refereeEmail) {
      return { error: "Verification failed: Friend's phone number or email is required.", referrerReward, friendReward };
    }
    if (activeMethod === 'code_identifier' && !refereeIdentifier) {
      return { error: `Verification failed: ${activeLabel} is required.`, referrerReward, friendReward };
    }

    // 2. Anti-fraud checks
    // Self-referral block
    if (business.blockSelfReferral) {
      if (refereePhone && tollaUser.phoneNumber) {
        const cleanReferrer = tollaUser.phoneNumber.trim().replace(/\D/g, '');
        const cleanReferee = refereePhone.trim().replace(/\D/g, '');
        if (cleanReferrer === cleanReferee) {
          return { error: "Self-referral blocked: Referral code holder cannot redeem their own code.", referrerReward, friendReward };
        }
      }
      if (refereeEmail && tollaUser.emailAddress) {
        if (refereeEmail.trim().toLowerCase() === tollaUser.emailAddress.trim().toLowerCase()) {
          return { error: "Self-referral blocked: Referral code holder cannot redeem their own code.", referrerReward, friendReward };
        }
      }
    }

    // Spend threshold
    if (business.minimumSpend && spendAmount !== undefined && spendAmount < business.minimumSpend) {
      return { error: `Verification failed: Minimum spend of R${business.minimumSpend} required (entered: R${spendAmount}).`, referrerReward, friendReward };
    }

    // Limit one per friend
    if (business.limitOnePerFriend) {
      if (refereePhone) {
        const cleanReferee = refereePhone.trim().replace(/\D/g, '');
        const alreadyRedeemed = referrals.some(r => 
          (r.status === 'redeemed' || r.status === 'pending_approval') &&
          r.refereePhone &&
          r.refereePhone.trim().replace(/\D/g, '') === cleanReferee &&
          r.locationId === locationId
        );
        if (alreadyRedeemed) {
          return { error: "Verification failed: A referral reward has already been claimed for this phone number.", referrerReward, friendReward };
        }
      }
      if (refereeEmail) {
        const cleanRefereeEmail = refereeEmail.trim().toLowerCase();
        const alreadyRedeemedEmail = referrals.some(r => 
          (r.status === 'redeemed' || r.status === 'pending_approval') &&
          r.refereeEmail &&
          r.refereeEmail.trim().toLowerCase() === cleanRefereeEmail &&
          r.locationId === locationId
        );
        if (alreadyRedeemedEmail) {
          return { error: "Verification failed: A referral reward has already been claimed for this email address.", referrerReward, friendReward };
        }
      }
    }

    // First time customer only
    if (business.firstTimeOnly) {
      if (refereePhone) {
        const cleanReferee = refereePhone.trim().replace(/\D/g, '');
        const hasPreviousRedemption = referrals.some(r => 
          r.status === 'redeemed' &&
          r.refereePhone &&
          r.refereePhone.trim().replace(/\D/g, '') === cleanReferee
        );
        if (hasPreviousRedemption) {
          return { error: "Verification failed: Only first-time customers are eligible to redeem this referral.", referrerReward, friendReward };
        }
      }
      if (refereeEmail) {
        const cleanRefereeEmail = refereeEmail.trim().toLowerCase();
        const hasPreviousRedemptionEmail = referrals.some(r => 
          r.status === 'redeemed' &&
          r.refereeEmail &&
          r.refereeEmail.trim().toLowerCase() === cleanRefereeEmail
        );
        if (hasPreviousRedemptionEmail) {
          return { error: "Verification failed: Only first-time customers are eligible to redeem this referral.", referrerReward, friendReward };
        }
      }
    }

    // Limit one per day
    if (business.limitOnePerDay && refereePhone) {
      const cleanReferee = refereePhone.trim().replace(/\D/g, '');
      const todayStr = new Date().toDateString();
      const alreadyRedeemedToday = referrals.some(r => {
        if (r.status !== 'redeemed' || !r.redeemedAt || !r.refereePhone) return false;
        const cleanRPhone = r.refereePhone.trim().replace(/\D/g, '');
        return cleanRPhone === cleanReferee && new Date(r.redeemedAt).toDateString() === todayStr;
      });
      if (alreadyRedeemedToday) {
        return { error: "Verification failed: Limit of one redemption per day reached for this customer.", referrerReward, friendReward };
      }
    }

    // Expiry check
    if (business.rewardExpiryDays) {
      const joinedTime = new Date(referrer.connectedAt).getTime();
      const expiryMs = business.rewardExpiryDays * 24 * 60 * 60 * 1000;
      if (Date.now() - joinedTime > expiryMs) {
        return { error: `Verification failed: This discount code has expired (valid for ${business.rewardExpiryDays} days from signup).`, referrerReward, friendReward };
      }
    }

    // 3. Determine status based on verification mode
    const status = business.verificationMethod === 'manager_approval' ? 'pending_approval' : 'redeemed';

    // 4. Run fraud analyzer to check for warnings
    const warnings = this.detectFraudWarnings(referrals, referrer.id, discountCode, refereePhone, refereeIdentifier, refereeEmail);
    const verificationNotes = warnings.length > 0 ? warnings.join(' | ') : undefined;

    // Check if there is an existing pending referral for this code
    let referral = referrals.find(r => 
      r.customerBusinessId === referrer.id && 
      r.discountCode === discountCode && 
      r.status === 'pending'
    );

    const completeCheckoutPayout = (refRecord: Referral) => {
      if (refRecord.status === 'redeemed') {
        // Payout to Wallet
        const wallets = this.getWallets();
        let wallet = wallets.find(w => w.customerBusinessId === referrer.id);
        const numMatch = business.referrerReward.match(/\d+/);
        const rewardValue = numMatch ? parseInt(numMatch[0]) : 50;
        const isPercent = business.referrerReward.includes('%');
        
        if (!wallet) {
          wallet = {
            id: `w-${Date.now()}`,
            customerBusinessId: referrer.id,
            rewardType: isPercent ? 'percent' : 'cash',
            balance: rewardValue,
            description: business.referrerReward,
            updatedAt: new Date().toISOString()
          };
          wallets.push(wallet);
        } else {
          wallet.balance += rewardValue;
          wallet.updatedAt = new Date().toISOString();
        }
        this.setWallets(wallets);

        // Add Timeline Event
        const events = this.getTimelineEvents();
        events.push({
          id: `t-${Date.now()}`,
          customerBusinessId: referrer.id,
          eventType: 'reward_added',
          description: `Earned ${business.referrerReward} (Friend visit validated).`,
          createdAt: new Date().toISOString()
        });
        this.setTimelineEvents(events);

        // Recalculate Score
        this.recalculateReferralScore(referrer.id);
      }
    };

    if (!referral) {
      // Create new referral on the fly
      const newRef: Referral = {
        id: `ref-${Date.now()}`,
        customerBusinessId: referrer.id,
        refereePhone: refereePhone || undefined,
        refereeEmail: refereeEmail || undefined,
        refereeIdentifier: refereeIdentifier || undefined,
        discountCode,
        status,
        redeemedAt: status === 'redeemed' ? new Date().toISOString() : undefined,
        redeemedByUserId: status === 'redeemed' ? managerId : undefined,
        locationId,
        spendAmount: spendAmount || 0,
        verificationNotes,
        createdAt: new Date().toISOString()
      };
      referrals.push(newRef);
      this.setReferrals(referrals);

      // Log last activity timestamp on referrer customer record!
      referrer.lastActivityAt = new Date().toISOString();
      const allCustomers = this.getCustomerBusinesses();
      const rIdx = allCustomers.findIndex(c => c.id === referrer.id);
      if (rIdx !== -1) {
        allCustomers[rIdx] = referrer;
        this.setCustomerBusinesses(allCustomers);
      }

      completeCheckoutPayout(newRef);

      return { referral: newRef, referrerReward, friendReward };
    }

    // Update existing pending referral
    referral.status = status;
    referral.refereePhone = refereePhone || referral.refereePhone;
    referral.refereeEmail = refereeEmail || referral.refereeEmail;
    referral.refereeIdentifier = refereeIdentifier || referral.refereeIdentifier;
    referral.verificationNotes = verificationNotes;
    referral.spendAmount = spendAmount || referral.spendAmount || 0;
    if (status === 'redeemed') {
      referral.redeemedAt = new Date().toISOString();
      referral.redeemedByUserId = managerId;
      referral.locationId = locationId;
    }

    // Log last activity timestamp on referrer customer record!
    referrer.lastActivityAt = new Date().toISOString();
    const allCustomers = this.getCustomerBusinesses();
    const rIdx = allCustomers.findIndex(c => c.id === referrer.id);
    if (rIdx !== -1) {
      allCustomers[rIdx] = referrer;
      this.setCustomerBusinesses(allCustomers);
    }

    this.setReferrals(referrals);
    completeCheckoutPayout(referral);

    return { referral, referrerReward, friendReward };
  }

  public approveReferral(referralId: string, managerId: string): { referral?: Referral; error?: string } {
    const referrals = this.getReferrals();
    const index = referrals.findIndex(r => r.id === referralId);
    if (index === -1) return { error: "Referral record not found." };

    referrals[index].status = 'redeemed';
    referrals[index].redeemedAt = new Date().toISOString();
    referrals[index].redeemedByUserId = managerId;

    this.setReferrals(referrals);
    return { referral: referrals[index] };
  }

  public rejectReferral(referralId: string, managerId: string): { referral?: Referral; error?: string } {
    const referrals = this.getReferrals();
    const index = referrals.findIndex(r => r.id === referralId);
    if (index === -1) return { error: "Referral record not found." };

    referrals[index].status = 'rejected';
    referrals[index].verificationNotes = `Rejected by manager/owner on ${new Date().toLocaleDateString()}`;

    this.setReferrals(referrals);
    return { referral: referrals[index] };
  }

  // Analytics Event Tracker
  public trackEvent(locationId: string, eventType: AnalyticsEvent['eventType'], customerId?: string): void {
    const events = this.getAnalyticsEvents();
    events.push({
      id: `ae-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      locationId,
      eventType,
      customerId,
      createdAt: new Date().toISOString()
    });
    this.setAnalyticsEvents(events);
  }

  // Get Analytics Summary for Location
  public getAnalyticsSummary(locationId: string) {
    const events = this.getAnalyticsEvents().filter(e => e.locationId === locationId);
    const customers = this.getCustomers().filter(c => c.locationId === locationId);
    const referrals = this.getReferrals().filter(r => r.locationId === locationId && r.status === 'redeemed');
    
    const qrScans = events.filter(e => e.eventType === 'qr_scan').length;
    const pageViews = events.filter(e => e.eventType === 'page_view').length;
    const shares = events.filter(e => e.eventType === 'share_click').length;
    const registrationAttempts = events.filter(e => e.eventType === 'registration_attempt').length;
    const redemptions = referrals.length;

    const conversionRate = pageViews > 0 ? Math.round((redemptions / pageViews) * 100) : 0;

    return {
      customersRegistered: customers.length,
      referralPagesGenerated: customers.length,
      referralPageViews: pageViews,
      qrScans,
      linksShared: shares,
      successfulRedemptions: redemptions,
      pendingRewards: referrals.filter(r => r.status === 'pending').length,
      conversionRate,
      registrationAttempts // For Free Limit warning counts!
    };
  }

  // --- Service Catalog Services ---
  public addService(locationId: string, serviceData: { name: string; price: number; imageUrl?: string }) {
    const locations = this.getLocations();
    const locIndex = locations.findIndex(l => l.id === locationId);
    if (locIndex === -1) return;

    const location = locations[locIndex];
    if (!location.services) location.services = [];

    const newService = {
      id: `s_${Date.now()}`,
      name: serviceData.name,
      price: serviceData.price,
      imageUrl: serviceData.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&fit=crop&q=60',
      applicablePromoIds: []
    };

    location.services.push(newService);
    this.setLocations(locations);
    return newService;
  }

  public deleteService(locationId: string, serviceId: string) {
    const locations = this.getLocations();
    const locIndex = locations.findIndex(l => l.id === locationId);
    if (locIndex === -1) return;

    const location = locations[locIndex];
    if (location.services) {
      location.services = location.services.filter(s => s.id !== serviceId);
      this.setLocations(locations);
    }
  }

  public updateService(locationId: string, serviceId: string, serviceData: { name: string; price: number; imageUrl?: string }) {
    const locations = this.getLocations();
    const locIndex = locations.findIndex(l => l.id === locationId);
    if (locIndex === -1) return;

    const location = locations[locIndex];
    if (location.services) {
      location.services = location.services.map(s => {
        if (s.id === serviceId) {
          return {
            ...s,
            name: serviceData.name,
            price: serviceData.price,
            imageUrl: serviceData.imageUrl !== undefined ? serviceData.imageUrl : s.imageUrl
          };
        }
        return s;
      });
      this.setLocations(locations);
    }
  }

  public togglePromoForService(locationId: string, serviceId: string, promoId: string) {
    const locations = this.getLocations();
    const locIndex = locations.findIndex(l => l.id === locationId);
    if (locIndex === -1) return;

    const location = locations[locIndex];
    if (location.services) {
      location.services = location.services.map(s => {
        if (s.id === serviceId) {
          const hasPromo = s.applicablePromoIds.includes(promoId);
          return {
            ...s,
            applicablePromoIds: hasPromo 
              ? s.applicablePromoIds.filter(id => id !== promoId)
              : [...s.applicablePromoIds, promoId]
          };
        }
        return s;
      });
      this.setLocations(locations);
    }
  }

  // --- Manager Link DB helpers ---
  public getManagerLinks(): ManagerLink[] {
    return this.get<ManagerLink[]>('manager_links', []);
  }

  public setManagerLinks(links: ManagerLink[]): void {
    this.set('manager_links', links);
  }

  public createManagerLink(locationId: string, businessId: string, expiryDays: '30' | '90' | 'never'): ManagerLink {
    const links = this.getManagerLinks();
    
    // Revoke any existing active link for this location first
    const updatedLinks = links.filter(l => l.locationId !== locationId);

    const token = `ML-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    let expiresAt: string | null = null;
    if (expiryDays === '30') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expiresAt = d.toISOString();
    } else if (expiryDays === '90') {
      const d = new Date();
      d.setDate(d.getDate() + 90);
      expiresAt = d.toISOString();
    }

    const newLink: ManagerLink = {
      id: token,
      locationId,
      businessId,
      expiryDays,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    updatedLinks.push(newLink);
    this.setManagerLinks(updatedLinks);
    return newLink;
  }

  public deleteManagerLink(id: string): void {
    const links = this.getManagerLinks();
    this.setManagerLinks(links.filter(l => l.id !== id));
  }

  public validateManagerLink(id: string): ManagerLink | undefined {
    const links = this.getManagerLinks();
    const link = links.find(l => l.id === id);
    if (!link) return undefined;

    // Check expiry
    if (link.expiresAt) {
      if (new Date() > new Date(link.expiresAt)) {
        // Expired! Clean it up from database
        this.deleteManagerLink(id);
        return undefined;
      }
    }

    return link;
  }

  public deleteCustomer(id: string): void {
    const relationships = this.getCustomerBusinesses();
    const customerToDelete = relationships.find(c => c.id === id);
    if (!customerToDelete) return;
    
    // Remove the customer relationship
    const updatedRelationships = relationships.filter(c => c.id !== id);
    this.setCustomerBusinesses(updatedRelationships);

    // Get the tolla user
    const users = this.getTollaUsers();
    const userIndex = users.findIndex(u => u.id === customerToDelete.tollaUserId);
    let userPhone = '';
    
    if (userIndex !== -1) {
      const user = users[userIndex];
      userPhone = user.phoneNumber || '';
      
      // If user has no other CustomerBusiness relationships, scrub/delete the profile completely!
      const otherConns = updatedRelationships.some(r => r.tollaUserId === user.id);
      if (!otherConns) {
        users.splice(userIndex, 1);
        this.setTollaUsers(users);
      }
    }

    // Clean up matching wallets and timeline events
    const wallets = this.getWallets().filter(w => w.customerBusinessId !== id);
    this.setWallets(wallets);

    const events = this.getTimelineEvents().filter(e => e.customerBusinessId !== id);
    this.setTimelineEvents(events);

    // Anonymize matching referrals referee PII
    const referrals = this.getReferrals();
    const updatedReferrals = referrals.map(r => {
      const ref = { ...r };
      const normalizedRefPhone = (ref.refereePhone || '').replace(/[^0-9]/g, '');
      const normalizedCustPhone = userPhone.replace(/[^0-9]/g, '');
      
      if (userPhone && normalizedRefPhone === normalizedCustPhone) {
        ref.refereePhone = '[POPIA Deleted]';
        ref.refereeIdentifier = '[POPIA Deleted]';
      }
      return ref;
    });
    this.setReferrals(updatedReferrals);
  }

  public handleIncomingWhatsAppMessage(fromPhone: string, text: string): { text: string } {
    const cleanText = text.trim().toLowerCase();
    
    if (cleanText === 'test' || cleanText === 'run tests') {
      const testPhone = `+2782000${Math.floor(1000 + Math.random() * 9000)}`;
      const logs: string[] = [];
      
      const r1 = this.handleIncomingWhatsAppMessage(testPhone, "Start Silk & Shears Salon");
      const p1 = r1.text.includes("To finish joining, please reply with");
      logs.push(`${p1 ? '🟢' : '🔴'} Assertion 1: Onboard Init Command - ${p1 ? 'Passed' : 'Failed'}`);

      const r2 = this.handleIncomingWhatsAppMessage(testPhone, "YES");
      const p2 = r2.text.includes("Would you like to receive specials");
      logs.push(`${p2 ? '🟢' : '🔴'} Assertion 2: YES Confirmation Step - ${p2 ? 'Passed' : 'Failed'}`);

      const r3 = this.handleIncomingWhatsAppMessage(testPhone, "YES");
      const p3 = r3.text.includes("🎉 You're all set!") && r3.text.includes("personal Tolla Wallet & Referral Board");
      logs.push(`${p3 ? '🟢' : '🔴'} Assertion 3: Marketing Opt-in & Wallet Create - ${p3 ? 'Passed' : 'Failed'}`);

      const user = this.getTollaUsers().find(u => u.phoneNumber === testPhone);
      const userTx = this.get<any[]>('reward_transactions', []).filter(t => t.tollaUserId === user?.id);
      const p4 = userTx.length === 1 && userTx[0].cashEquivalentValue === 20;
      logs.push(`${p4 ? '🟢' : '🔴'} Assertion 4: RewardTransaction Balance Ledger - ${p4 ? 'Passed' : 'Failed'}`);

      if (user) {
        this.setTollaUsers(this.getTollaUsers().filter(u => u.id !== user.id));
        this.set('reward_transactions', this.get<any[]>('reward_transactions', []).filter(t => t.tollaUserId !== user.id));
        this.set('referral_links', this.get<any[]>('referral_links', []).filter(l => l.tollaUserId !== user.id));
        this.set('notification_centers', this.get<any[]>('notification_centers', []).filter(p => p.tollaUserId !== user.id));
      }

      const allPassed = p1 && p2 && p3 && p4;
      return {
        text: `🧪 Tolla Integration Test Suite\n\n${logs.join('\n')}\n\n${allPassed ? '🎉 Integration tests executed successfully! All assertions PASSED.' : '⚠️ Integration tests completed with failures.'}`
      };
    }

    const sessionKey = `onboard_session_${fromPhone}`;
    const sessionState = localStorage.getItem(sessionKey); 
    let tollaUser = this.getTollaUsers().find(u => u.phoneNumber === fromPhone);
    
    if (sessionState) {
      const stateObj = JSON.parse(sessionState);
      if (stateObj.step === 'awaiting_yes') {
        if (cleanText === 'yes') {
          if (!tollaUser) {
            const newUserId = this.generateTollaUserId();
            tollaUser = {
              id: newUserId,
              phoneNumber: fromPhone,
              marketingConsent: false,
              createdAt: new Date().toISOString()
            };
            this.setTollaUsers([...this.getTollaUsers(), tollaUser]);
          }
          
          const refLinkCode = `${stateObj.businessSlug.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const refLinks = this.get<any[]>('referral_links', []);
          const exists = refLinks.find(l => l.tollaUserId === tollaUser!.id && l.businessId === stateObj.businessId);
          if (!exists) {
            refLinks.push({
              id: `link_${Date.now()}`,
              tollaUserId: tollaUser.id,
              businessId: stateObj.businessId,
              code: refLinkCode,
              totalShares: 1,
              totalClicks: 0,
              totalVisits: 0,
              totalConversions: 0,
              createdAt: new Date().toISOString()
            });
            this.set('referral_links', refLinks);
          }

          const events = this.get<any[]>('tolla_events', []);
          events.push({
            id: `ev_${Date.now()}`,
            type: 'customer_joined',
            businessId: stateObj.businessId,
            userId: tollaUser.id,
            timestamp: new Date().toISOString(),
            metadata: { channel: 'whatsapp', businessName: stateObj.businessName }
          });
          this.set('tolla_events', events);

          stateObj.step = 'awaiting_consent';
          localStorage.setItem(sessionKey, JSON.stringify(stateObj));

          return {
            text: `Welcome to ${stateObj.businessName}!\n\nWould you like to receive specials, updates, and promotions from us?\n\nReply:\n👉 YES\n👉 NO`
          };
        } else {
          return { text: `Please reply with "YES" to complete your registration for ${stateObj.businessName}.` };
        }
      } else if (stateObj.step === 'awaiting_consent') {
        const consentVal = cleanText === 'yes';
        
        const preferences = this.get<any[]>('notification_centers', []);
        const userPrefIdx = preferences.findIndex(p => p.tollaUserId === tollaUser!.id);
        const newPref = {
          tollaUserId: tollaUser!.id,
          rewardUpdates: { whatsapp: true, email: false, sms: false, push: false },
          promotions: { whatsapp: consentVal, email: false, sms: false, push: false },
          birthdayOffers: { whatsapp: consentVal, email: false, sms: false, push: false },
          monthlySummary: { whatsapp: true, email: false, sms: false, push: false },
          updatedAt: new Date().toISOString()
        };
        if (userPrefIdx >= 0) {
          preferences[userPrefIdx] = newPref;
        } else {
          preferences.push(newPref);
        }
        this.set('notification_centers', preferences);

        const transactions = this.get<any[]>('reward_transactions', []);
        transactions.push({
          id: `rt_${Date.now()}`,
          tollaUserId: tollaUser!.id,
          businessId: stateObj.businessId,
          source: 'referral',
          status: 'ACTIVE',
          rewardType: 'cash',
          rewardValue: 'R20',
          cashEquivalentValue: 20,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        this.set('reward_transactions', transactions);

        localStorage.removeItem(sessionKey);

        const refLinks = this.get<any[]>('referral_links', []);
        const link = refLinks.find(l => l.tollaUserId === tollaUser!.id && l.businessId === stateObj.businessId);
        const linkCode = link ? link.code : '84F2';

        return {
          text: `🎉 You're all set!\n\nWelcome to ${stateObj.businessName} Rewards.\n\nYour Tolla ID: ${tollaUser!.id}\n\nHere is your personal Tolla Wallet & Referral Board:\n👉 http://localhost:5173/r/${tollaUser!.id}\n\nClick the link to view your rewards, check branch maps, and share specials directly with friends on WhatsApp!`
        };
      }
    }

    if (cleanText.startsWith('start ')) {
      const businessNameQuery = text.replace(/start /i, '').trim();
      const businesses = this.getBusinesses();
      const matchingBiz = businesses.find(b => b.name.toLowerCase().includes(businessNameQuery.toLowerCase()));
      
      if (matchingBiz) {
        const initialSession = {
          step: 'awaiting_yes',
          businessId: matchingBiz.id,
          businessName: matchingBiz.name,
          businessSlug: matchingBiz.slug
        };
        localStorage.setItem(sessionKey, JSON.stringify(initialSession));
        
        return {
          text: `Welcome to ${matchingBiz.name}!\n\nYou'll receive:\n✔ R20 OFF today\n✔ Rewards every time friends visit\n\nTo finish joining, please reply with:\n👉 YES`
        };
      } else {
        return { text: `We couldn't find a business named "${businessNameQuery}". Try typing the exact name!` };
      }
    }

    if (!tollaUser) {
      return {
        text: `Welcome to Tolla 👋\n\nWe couldn't find a wallet linked to this WhatsApp number.\n\nTo get started, please scan the QR code at your favorite local business to claim your first reward!`
      };
    }

    if (cleanText === 'links') {
      const links = this.get<any[]>('referral_links', []);
      const userLinks = links.filter(l => l.tollaUserId === tollaUser!.id);
      const businesses = this.getBusinesses();
      
      if (userLinks.length === 0) {
        return { text: `You don't have any referral links yet. Join a business by scanning their QR code!` };
      }

      let reply = `Tolla: Your Referral Links 🔗\n\n`;
      userLinks.forEach((l, idx) => {
        const biz = businesses.find(b => b.id === l.businessId);
        if (biz) {
          reply += `${idx + 1}. ${biz.name}\n👉 https://${biz.slug}.tolla.app/r/${l.code}\n\n`;
        }
      });
      return { text: reply + `Share these with friends to start earning!` };
    }

    if (cleanText === 'promos' || cleanText === 'specials') {
      const links = this.get<any[]>('referral_links', []);
      const userLinks = links.filter(l => l.tollaUserId === tollaUser!.id);
      const businesses = this.getBusinesses();
      
      if (userLinks.length === 0) {
        return { text: `You haven't joined any business rewards programs yet. Scan a QR code to view active specials!` };
      }

      let reply = `Today's Specials 🏷️\n\n`;
      userLinks.forEach(l => {
        const biz = businesses.find(b => b.id === l.businessId);
        if (biz) {
          let promoText = biz.friendReward;
          if (biz.id === 'b1') promoText = 'Wash & Wax: Save R30';
          else if (biz.id === 'b2') promoText = 'Free Muffin with any Cappuccino';
          reply += `• ${biz.name}:\n🎁 ${promoText}\n\n`;
        }
      });
      return { text: reply };
    }

    if (cleanText === 'history') {
      const transactions = this.get<any[]>('reward_transactions', []).filter(t => t.tollaUserId === tollaUser!.id);
      const businesses = this.getBusinesses();
      
      if (transactions.length === 0) {
        return { text: `You don't have any reward history recorded yet.` };
      }

      let reply = `Tolla Reward History 📜\n\n`;
      transactions.slice(0, 5).forEach(t => {
        const biz = businesses.find(b => b.id === t.businessId);
        const bizName = biz ? biz.name : 'Partner store';
        const sign = t.status === 'REDEEMED' ? '🔴 -' : '🟢 +';
        reply += `${new Date(t.createdAt).toLocaleDateString()}:\n${sign}${t.rewardValue}\n${bizName} (${t.source})\n\n`;
      });
      return { text: reply };
    }

    const refLinks = this.get<any[]>('referral_links', []).filter(l => l.tollaUserId === tollaUser!.id);
    const transactions = this.get<any[]>('reward_transactions', []).filter(t => t.tollaUserId === tollaUser!.id);
    
    const activeCashSum = transactions
      .filter(t => t.status === 'ACTIVE' && t.rewardType === 'cash')
      .reduce((sum, t) => sum + t.cashEquivalentValue, 0);

    const activeGiftCount = transactions
      .filter(t => t.status === 'ACTIVE' && t.rewardType === 'custom_gift').length;

    const totalSaved = transactions
      .filter(t => t.status === 'REDEEMED')
      .reduce((sum, t) => sum + t.cashEquivalentValue, 0) + 120;

    return {
      text: `🎉 Welcome back ${tollaUser.name || 'Advocate'}!\n\nHere is your personal Tolla Wallet & Referral Board:\n👉 http://localhost:5173/r/${tollaUser.id}\n\nClick the link to view your rewards, check branch maps, and share active specials directly with friends on WhatsApp!\n\nOr reply with:\n1️⃣ Share My Links\n2️⃣ Today's Specials\n3️⃣ Reward History`
    };
  }
}

export const db = new MockDatabase();
