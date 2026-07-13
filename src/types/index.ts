export interface Business {
  id: string;
  name: string;
  slug: string; // e.g. "silkandshears" for silkandshears.easyreward.co.za
  logoUrl?: string;
  industry: string;
  customIndustry?: string; // Stored when selecting "Other" or entering a custom industry value
  businessType?: string; // e.g. "Service", "Food", "Retail", "Distribution", "Professional", "Membership", "Education"
  referrerReward: string; // e.g. "Get a R100 voucher"
  friendReward: string; // e.g. "Get 10% off your first visit"
  subscriptionPlan: 'free' | 'premium';
  subscriptionExpiresAt?: string;
  activeLocationsCount?: number;
  createdAt: string;
  redeemableLocationIds?: string[]; // Locations where rewards are eligible for redemption
  // Referral Rules & Anti-Fraud Settings
  verificationMethod: 'code' | 'code_phone' | 'code_identifier' | 'manager_approval';
  customIdentifierLabel?: string;
  limitOnePerFriend: boolean;
  requirePurchase: boolean;
  minimumSpend: number | null;
  rewardExpiryDays: number | null;
  limitOnePerDay: boolean;
  firstTimeOnly: boolean;
  blockSelfReferral: boolean;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  applicablePromoIds: string[]; // List of Promotion IDs currently applied to this service
}

export interface Location {
  id: string;
  businessId: string;
  name: string;
  address: string;
  googleMapsLink?: string;
  whatsappNumber: string;
  phoneNumber: string;
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
  galleryUrls: string[];
  bannerUrl?: string;
  currentPromotionId?: string;
  qrCodeUrl: string;
  customIdentifierName?: string; // e.g. "Plate Number", "Membership Number", "Pet Name"
  verificationMethod?: 'code' | 'code_phone' | 'code_identifier' | 'manager_approval';
  services?: Service[];
  industry?: string;
  customIndustry?: string;
  businessType?: string;
  qrPosterText?: string;
  createdAt: string;
}

export interface ManagerLink {
  id: string; // Unguessable token
  locationId: string;
  businessId: string;
  expiryDays: '30' | '90' | 'never';
  expiresAt: string | null;
  createdAt: string;
}

export interface BusinessUser {
  id: string;
  businessId: string;
  locationId: string | null; // Null for Owner (all-access), populated for Managers
  role: 'owner' | 'manager';
  whatsappNumber: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  imageUrl?: string;
  locationIds?: string[]; // Locations where this promotion is active
  expiryDate?: string;
  createdAt: string;
}

export interface TollaUser {
  id: string; // "TR-84F2K9" (Universal ID)
  phoneNumber?: string;
  emailAddress?: string;
  name?: string;
  marketingConsent: boolean;
  consentTimestamp?: string;
  consentIp?: string;
  preferredChannels?: ('whatsapp' | 'email')[];
  createdAt: string;
}

export interface CustomerBusiness {
  id: string;
  tollaUserId: string;
  businessId: string;
  locationId: string;
  customIdentifier?: string; // e.g. license plate or pet name
  referralScore: number; // 0 to 100
  connectedAt: string;
  lastActivityAt?: string;
}

// Compatibility alias to prevent breaking existing code imports immediately
export type Customer = CustomerBusiness;

export interface Wallet {
  id: string;
  customerBusinessId: string;
  rewardType: 'cash' | 'item' | 'percent' | 'custom';
  balance: number; // e.g. 60 or 2
  description: string; // e.g. "R60 Credit" or "2 Free Coffees"
  expiresAt?: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  customerBusinessId: string;
  eventType: 'registered' | 'shared_link' | 'friend_redeemed' | 'reward_added' | 'visited_again' | 'birthday_reward' | 'promotion_opened' | 'campaign_clicked' | 'reward_redeemed' | 'popia_scrub';
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Referral {
  id: string;
  customerBusinessId: string; // links to CustomerBusiness
  refereePhone?: string;
  refereeEmail?: string;
  refereeIdentifier?: string; // Captured custom identifier (e.g. License Plate)
  discountCode: string; // Single use temporary transaction token
  redeemedAt?: string;
  redeemedByUserId?: string;
  locationId: string;
  status: 'pending' | 'redeemed' | 'pending_approval' | 'rejected';
  spendAmount?: number;
  verificationNotes?: string; // Verification warnings or notes
  createdAt: string;
}

export interface Review {
  id: string;
  locationId: string;
  tollaUserId?: string;
  customerName: string;
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  locationId: string;
  eventType: 'qr_scan' | 'page_view' | 'share_click' | 'registration_attempt';
  customerId?: string;
  createdAt: string;
}

// New Platform Conversational Infrastructure Models
export type TollaEventType =
  | 'qr_scanned'
  | 'customer_joined'
  | 'referral_link_created'
  | 'referral_link_shared'
  | 'referral_link_opened'
  | 'promotion_viewed'
  | 'promotion_clicked'
  | 'reward_earned'
  | 'reward_redeemed'
  | 'store_visited'
  | 'loyalty_checked_in'
  | 'campaign_sent'
  | 'campaign_opened'
  | 'campaign_clicked';

export interface TollaEvent {
  id: string;
  type: TollaEventType;
  businessId?: string;
  locationId?: string;
  userId?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface ReferralLink {
  id: string;
  tollaUserId: string;
  businessId: string;
  code: string;
  totalShares: number;
  totalClicks: number;
  totalVisits: number;
  totalConversions: number;
  createdAt: string;
}

export type TransactionSource = 'referral' | 'loyalty' | 'birthday' | 'ai_campaign' | 'manual_adjustment';
export type TransactionStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface RewardTransaction {
  id: string;
  tollaUserId: string;
  businessId: string;
  locationId?: string;
  source: TransactionSource;
  status: TransactionStatus;
  rewardType: 'cash' | 'percentage' | 'custom_gift';
  rewardValue: string;
  cashEquivalentValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessRelationship {
  id: string;
  tollaUserId: string;
  businessId: string;
  currentWalletBalance: number;
  totalFriendsReferred: number;
  lastVisitedAt: string;
  createdAt: string;
}

export interface ChannelPreferences {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationCenter {
  tollaUserId: string;
  rewardUpdates: ChannelPreferences;
  promotions: ChannelPreferences;
  birthdayOffers: ChannelPreferences;
  monthlySummary: ChannelPreferences;
  updatedAt: string;
}

export interface TollaCLV {
  tollaUserId: string;
  businessesJoinedCount: number;
  totalLifetimeSavings: number;
  friendsReferredCount: number;
  successfulConversionsCount: number;
  activeWalletsCount: number;
  netNetworkValue: number;
}
