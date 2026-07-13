import { Business, Location, BusinessUser, Promotion, Customer, Referral, Review, AnalyticsEvent } from '../types';

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "b1",
    name: "Silk & Shears Salon",
    slug: "silkandshears",
    logoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop&q=80",
    industry: "Salon",
    referrerReward: "Free blowout on your next visit",
    friendReward: "15% off your first hair styling",
    subscriptionPlan: "premium",
    subscriptionExpiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString(),
    activeLocationsCount: 7,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    redeemableLocationIds: ['loc1', 'loc2'],
    verificationMethod: 'code',
    customIdentifierLabel: 'Appointment Name',
    limitOnePerFriend: true,
    requirePurchase: false,
    minimumSpend: null,
    rewardExpiryDays: 30,
    limitOnePerDay: false,
    firstTimeOnly: true,
    blockSelfReferral: true
  },
  {
    id: "b2",
    name: "Sparkle Car Wash",
    slug: "sparklecarwash",
    logoUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=150&h=150&fit=crop&q=80",
    industry: "Car Wash",
    referrerReward: "Free executive wash & vacuum",
    friendReward: "R50 off any deluxe valet service",
    subscriptionPlan: "premium",
    activeLocationsCount: 1,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    redeemableLocationIds: ['loc3'],
    verificationMethod: 'code_identifier',
    customIdentifierLabel: 'License Plate',
    limitOnePerFriend: true,
    requirePurchase: true,
    minimumSpend: 150,
    rewardExpiryDays: 60,
    limitOnePerDay: true,
    firstTimeOnly: false,
    blockSelfReferral: true
  },
  {
    id: "b3",
    name: "Bella Beauty Spa",
    slug: "bellaspa",
    logoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&h=150&fit=crop&q=80",
    industry: "Spa",
    referrerReward: "R150 Spa Voucher",
    friendReward: "Free welcome massage",
    subscriptionPlan: "premium",
    subscriptionExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    activeLocationsCount: 2,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    redeemableLocationIds: [],
    verificationMethod: 'code',
    customIdentifierLabel: 'Booking Name',
    limitOnePerFriend: true,
    requirePurchase: false,
    minimumSpend: null,
    rewardExpiryDays: 30,
    limitOnePerDay: false,
    firstTimeOnly: true,
    blockSelfReferral: true
  },
  {
    id: "b4",
    name: "Iron Athletics Gym",
    slug: "irongym",
    logoUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop&q=80",
    industry: "Gym",
    referrerReward: "1 Free Personal Trainer Session",
    friendReward: "3-Day Free Pass",
    subscriptionPlan: "free",
    activeLocationsCount: 1,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    redeemableLocationIds: [],
    verificationMethod: 'code',
    customIdentifierLabel: 'Membership ID',
    limitOnePerFriend: true,
    requirePurchase: false,
    minimumSpend: null,
    rewardExpiryDays: 30,
    limitOnePerDay: false,
    firstTimeOnly: true,
    blockSelfReferral: true
  },
  {
    id: "b5",
    name: "Tazza Cafe & Bistro",
    slug: "tazzacafe",
    logoUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&h=150&fit=crop&q=80",
    industry: "Restaurant",
    referrerReward: "Free Cappuccino & Croissant",
    friendReward: "15% off your breakfast",
    subscriptionPlan: "premium",
    subscriptionExpiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    activeLocationsCount: 4,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    redeemableLocationIds: [],
    verificationMethod: 'code',
    customIdentifierLabel: 'Table Number',
    limitOnePerFriend: true,
    requirePurchase: true,
    minimumSpend: 100,
    rewardExpiryDays: 30,
    limitOnePerDay: false,
    firstTimeOnly: true,
    blockSelfReferral: true
  }
];

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: "loc1",
    businessId: "b1",
    name: "Sandton Branch",
    address: "Shop 24, Sandton City Mall, Sandton, Johannesburg",
    googleMapsLink: "https://maps.google.com/?q=Sandton+City+Mall",
    whatsappNumber: "+27821111111",
    phoneNumber: "+27118880001",
    openingHours: {
      Monday: { open: "09:00", close: "18:00", closed: false },
      Tuesday: { open: "09:00", close: "18:00", closed: false },
      Wednesday: { open: "09:00", close: "18:00", closed: false },
      Thursday: { open: "09:00", close: "20:00", closed: false },
      Friday: { open: "09:00", close: "20:00", closed: false },
      Saturday: { open: "08:00", close: "17:00", closed: false },
      Sunday: { open: "09:00", close: "14:00", closed: false }
    },
    galleryUrls: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&fit=crop&q=80",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&fit=crop&q=80",
      "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=500&fit=crop&q=80"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80",
    currentPromotionId: "p1",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://silkandshears.tolla.app/scan",
    services: [
      {
        id: "s1",
        name: "Hair Styling",
        price: 450,
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&fit=crop&q=60",
        applicablePromoIds: ["p1"]
      },
      {
        id: "s2",
        name: "Blowout",
        price: 250,
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&fit=crop&q=60",
        applicablePromoIds: []
      },
      {
        id: "s3",
        name: "Wash",
        price: 100,
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&fit=crop&q=60",
        applicablePromoIds: []
      }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "loc2",
    businessId: "b1",
    name: "Rosebank Mall",
    address: "Level 1, Rosebank Mall, Rosebank, Johannesburg",
    googleMapsLink: "https://maps.google.com/?q=Rosebank+Mall",
    whatsappNumber: "+27821111112",
    phoneNumber: "+27118880002",
    openingHours: {
      Monday: { open: "09:00", close: "18:00", closed: false },
      Tuesday: { open: "09:00", close: "18:00", closed: false },
      Wednesday: { open: "09:00", close: "18:00", closed: false },
      Thursday: { open: "09:00", close: "18:00", closed: false },
      Friday: { open: "09:00", close: "18:00", closed: false },
      Saturday: { open: "09:00", close: "17:00", closed: false },
      Sunday: { open: "09:00", close: "15:00", closed: false }
    },
    galleryUrls: [
      "https://images.unsplash.com/photo-1605497746444-ac9da58d8d4a?w=500&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=500&fit=crop&q=80"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1605497746444-ac9da58d8d4a?w=1200&h=400&fit=crop&q=80",
    currentPromotionId: "p2",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://silkandshears.tolla.app/scan",
    services: [
      {
        id: "s2_1",
        name: "Hair Styling",
        price: 450,
        imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&fit=crop&q=60",
        applicablePromoIds: []
      },
      {
        id: "s2_2",
        name: "Blowout",
        price: 250,
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&fit=crop&q=60",
        applicablePromoIds: ["p2"]
      }
    ],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "loc3",
    businessId: "b2",
    name: "Midrand Centre",
    address: "Unit A5, Midrand Commercial Park, Old Pretoria Rd, Midrand",
    googleMapsLink: "https://maps.google.com/?q=Midrand",
    whatsappNumber: "+27822222222",
    phoneNumber: "+27117770001",
    openingHours: {
      Monday: { open: "08:00", close: "17:00", closed: false },
      Tuesday: { open: "08:00", close: "17:00", closed: false },
      Wednesday: { open: "08:00", close: "17:00", closed: false },
      Thursday: { open: "08:00", close: "17:00", closed: false },
      Friday: { open: "08:00", close: "17:00", closed: false },
      Saturday: { open: "08:00", close: "17:00", closed: false },
      Sunday: { open: "08:30", close: "13:00", closed: false }
    },
    galleryUrls: [
      "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=500&fit=crop&q=80",
      "https://images.unsplash.com/photo-1552930294-6b595f4c2974?w=500&fit=crop&q=80"
    ],
    bannerUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&h=400&fit=crop&q=80",
    currentPromotionId: "p3",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://sparklecarwash.tolla.app/scan",
    customIdentifierName: "License Plate",
    services: [
      {
        id: "s3_1",
        name: "Executive Wash & Vacuum",
        price: 150,
        imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300&fit=crop&q=60",
        applicablePromoIds: ["p3"]
      },
      {
        id: "s3_2",
        name: "Full Body Polish",
        price: 400,
        imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=300&fit=crop&q=60",
        applicablePromoIds: []
      }
    ],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_BUSINESS_USERS: BusinessUser[] = [
  {
    id: "user1",
    businessId: "b1",
    locationId: null, // Owner
    role: "owner",
    whatsappNumber: "+27820000000",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user2",
    businessId: "b1",
    locationId: "loc1", // Sandton Manager
    role: "manager",
    whatsappNumber: "+27821112222",
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "user3",
    businessId: "b2",
    locationId: null, // Sparkle Car Wash Owner
    role: "owner",
    whatsappNumber: "+27830000000",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: "p1",
    businessId: "b1",
    title: "Winter Glam Glow-Up",
    description: "Get a customized hair treatment + professional styling. Perfect for refreshing your winter look.",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&fit=crop&q=80",
    locationIds: ["loc1", "loc2"],
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "p2",
    businessId: "b1",
    title: "Balayage & Highlights Special",
    description: "Book an full balayage session and receive a complimentary moisture-infusion conditioning mask.",
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&fit=crop&q=80",
    locationIds: ["loc1"],
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "p3",
    businessId: "b2",
    title: "Eco Wash Clean Special",
    description: "Upgrade to premium polymer shine protection and get your interior thoroughly sanitized for free.",
    imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1ecc6f?w=600&fit=crop&q=80",
    locationIds: ["loc3"],
    expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_TOLLA_USERS: TollaUser[] = [
  {
    id: "u1",
    phoneNumber: "+27712345678",
    emailAddress: "c1.gold@tolla.app",
    name: "John Golden",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.82.4.15",
    preferredChannels: ['whatsapp', 'email'],
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u2",
    phoneNumber: "+27823334444",
    emailAddress: "c11.diamond@tolla.app",
    name: "Sarah Diamond",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.82.16.89",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u3",
    phoneNumber: "+27825550001",
    emailAddress: "c111.silver@tolla.app",
    name: "David Silver",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.43.12.110",
    preferredChannels: ['email'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u4",
    phoneNumber: "+27825550002",
    emailAddress: "c112.silver@tolla.app",
    name: "Emma Silver",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.43.12.111",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u5",
    phoneNumber: "+27824445555",
    emailAddress: "c12.silver@tolla.app",
    name: "Mark Stone",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.82.90.1",
    preferredChannels: ['whatsapp', 'email'],
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u6",
    phoneNumber: "+27825550003",
    emailAddress: "c121.silver@tolla.app",
    name: "Chris Amber",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "41.13.9.99",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u7",
    phoneNumber: "+27798765432",
    emailAddress: "c2.silver@tolla.app",
    name: "Lerato Modise",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "41.80.33.22",
    preferredChannels: ['whatsapp', 'email'],
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u8",
    phoneNumber: "+27827778888",
    emailAddress: "c21.silver@tolla.app",
    name: "Pieter Botha",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.80.4.99",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u9",
    phoneNumber: "+27825550004",
    emailAddress: "c211.silver@tolla.app",
    name: "Jessica Meyers",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "197.80.4.100",
    preferredChannels: ['email'],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u10",
    phoneNumber: "+27825550005",
    emailAddress: "c2111.bronze@tolla.app",
    name: "David Khumalo",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "41.13.12.80",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u11",
    phoneNumber: "+27725556666",
    emailAddress: "c3.organic@tolla.app",
    name: "Michael Scott",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "41.220.10.5",
    preferredChannels: ['whatsapp', 'email'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "u12",
    phoneNumber: "+27731112222",
    emailAddress: "c4.wash@tolla.app",
    name: "Dwight Schrute",
    marketingConsent: true,
    consentTimestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    consentIp: "196.12.44.89",
    preferredChannels: ['whatsapp'],
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_CUSTOMER_BUSINESSES: CustomerBusiness[] = [
  { id: "c1", tollaUserId: "u1", businessId: "b1", locationId: "loc1", customIdentifier: "GP-123-JH", referralScore: 94, connectedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_1_1", tollaUserId: "u2", businessId: "b1", locationId: "loc1", customIdentifier: "GP-111-GP", referralScore: 98, connectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_1_1_1", tollaUserId: "u3", businessId: "b1", locationId: "loc1", customIdentifier: "GP-222-GP", referralScore: 75, connectedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_1_1_2", tollaUserId: "u4", businessId: "b1", locationId: "loc1", customIdentifier: "GP-333-GP", referralScore: 82, connectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_1_2", tollaUserId: "u5", businessId: "b1", locationId: "loc1", customIdentifier: "GP-444-GP", referralScore: 60, connectedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_1_2_1", tollaUserId: "u6", businessId: "b1", locationId: "loc1", customIdentifier: "GP-555-GP", referralScore: 45, connectedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c2", tollaUserId: "u7", businessId: "b1", locationId: "loc1", customIdentifier: "GP-987-JH", referralScore: 70, connectedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_2_1", tollaUserId: "u8", businessId: "b1", locationId: "loc1", customIdentifier: "GP-666-GP", referralScore: 55, connectedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_2_1_1", tollaUserId: "u9", businessId: "b1", locationId: "loc1", customIdentifier: "GP-777-GP", referralScore: 40, connectedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c_2_1_1_1", tollaUserId: "u10", businessId: "b1", locationId: "loc1", customIdentifier: "GP-888-GP", referralScore: 30, connectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c3", tollaUserId: "u11", businessId: "b1", locationId: "loc1", customIdentifier: "GP-234-PT", referralScore: 25, connectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "c4", tollaUserId: "u12", businessId: "b2", locationId: "loc3", customIdentifier: "GP-883-NW", referralScore: 80, connectedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), lastActivityAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString() }
];

export const INITIAL_CUSTOMERS: CustomerBusiness[] = INITIAL_CUSTOMER_BUSINESSES;

export const INITIAL_WALLETS: Wallet[] = [
  { id: "w1", customerBusinessId: "c1", rewardType: "cash", balance: 60, description: "R60 Credit", updatedAt: new Date().toISOString() },
  { id: "w2", customerBusinessId: "c_1_1", rewardType: "cash", balance: 120, description: "R120 Credit", updatedAt: new Date().toISOString() },
  { id: "w3", customerBusinessId: "c2", rewardType: "item", balance: 2, description: "2 Free Coffees", updatedAt: new Date().toISOString() },
  { id: "w4", customerBusinessId: "c4", rewardType: "percent", balance: 15, description: "15% Voucher", updatedAt: new Date().toISOString() }
];

export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "t1", customerBusinessId: "c1", eventType: "registered", description: "Registered customer profile on Silk & Shears via Sandton branch QR code.", createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t2", customerBusinessId: "c1", eventType: "shared_link", description: "Shared referral link with friends.", createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t3", customerBusinessId: "c1", eventType: "friend_redeemed", description: "Friend (+27823334444) completed checkout and redeemed discount.", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "t4", customerBusinessId: "c1", eventType: "reward_added", description: "Referrer reward R60 added to active wallet.", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }
];

export const INITIAL_REFERRALS: Referral[] = [
  // c1 refers c_1_1 (redeemed)
  {
    id: "ref_1_1",
    customerBusinessId: "c1",
    refereePhone: "+27823334444",
    discountCode: "AB4890",
    redeemedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 450,
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c1 refers c_1_2 (redeemed)
  {
    id: "ref_1_2",
    customerBusinessId: "c1",
    refereePhone: "+27824445555",
    discountCode: "AB4890",
    redeemedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 320,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c_1_1 refers c_1_1_1 (redeemed)
  {
    id: "ref_1_1_1",
    customerBusinessId: "c_1_1",
    refereePhone: "+27825550001",
    discountCode: "AB1111",
    redeemedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 280,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c_1_1 refers c_1_1_2 (redeemed)
  {
    id: "ref_1_1_2",
    customerBusinessId: "c_1_1",
    refereePhone: "+27825550002",
    discountCode: "AB1111",
    redeemedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 600,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c_1_2 refers c_1_2_1 (redeemed)
  {
    id: "ref_1_2_1",
    customerBusinessId: "c_1_2",
    refereePhone: "+27825550003",
    discountCode: "AB4444",
    redeemedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 150,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },

  // c2 refers c_2_1 (redeemed)
  {
    id: "ref_2_1",
    customerBusinessId: "c2",
    refereePhone: "+27827778888",
    discountCode: "XY3911",
    redeemedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 500,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c_2_1 refers c_2_1_1 (redeemed)
  {
    id: "ref_2_1_1",
    customerBusinessId: "c_2_1",
    refereePhone: "+27825550004",
    discountCode: "AB6666",
    redeemedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 220,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c_2_1_1 refers c_2_1_1_1 (redeemed)
  {
    id: "ref_2_1_1_1",
    customerBusinessId: "c_2_1_1",
    refereePhone: "+27825550005",
    discountCode: "AB7777",
    redeemedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user2",
    locationId: "loc1",
    status: "redeemed",
    spendAmount: 480,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },

  // c3 refers some pending friend (just to log invites)
  {
    id: "ref_3_1",
    customerBusinessId: "c3",
    refereePhone: "+27829990000",
    discountCode: "SL9230",
    locationId: "loc1",
    status: "pending",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  // c4 refers car wash customer (redeemed)
  {
    id: "ref_4_1",
    customerBusinessId: "c4",
    refereePhone: "+27728889999",
    refereeIdentifier: "GP-111-GP",
    discountCode: "CW8271",
    redeemedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedByUserId: "user3",
    locationId: "loc3",
    status: "redeemed",
    spendAmount: 380,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev1",
    locationId: "loc1",
    customerName: "Jessica Meyers",
    rating: 5,
    comment: "Absolutely in love with the service here! They treated me so well and the haircut was exactly what I wanted.",
    isApproved: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev2",
    locationId: "loc1",
    customerName: "David Khumalo",
    rating: 5,
    comment: "Fast, highly professional hair styling. The referral discount makes it an absolute no-brainer.",
    isApproved: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev3",
    locationId: "loc1",
    customerName: "Lerato Modise",
    rating: 4,
    comment: "Nice location, relaxing vibe. Recommended to my colleagues and already earned my free blowout reward!",
    isApproved: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "rev4",
    locationId: "loc3",
    customerName: "Pieter Botha",
    rating: 5,
    comment: "Great vacuum detailing and quick car wash. Will definitely come back using my friend's discount code.",
    isApproved: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to pre-populate historical page views and scans for dashboard charts
export const generateMockAnalyticsEvents = (): AnalyticsEvent[] => {
  const events: AnalyticsEvent[] = [];
  const startDay = 30; // 30 days of data
  
  // Generating some trends for location 1
  for (let i = startDay; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    
    // Add QR scans (average 5 to 15 per day)
    const scanCount = Math.floor(Math.random() * 10) + 5;
    for (let s = 0; s < scanCount; s++) {
      events.push({
        id: `ae-scan-${i}-${s}`,
        locationId: "loc1",
        eventType: "qr_scan",
        createdAt: new Date(date.getTime() + Math.random() * 8 * 60 * 60 * 1000).toISOString()
      });
    }

    // Add Page Views (average 15 to 45 per day)
    const viewCount = Math.floor(Math.random() * 30) + 15;
    for (let v = 0; v < viewCount; v++) {
      events.push({
        id: `ae-view-${i}-${v}`,
        locationId: "loc1",
        eventType: "page_view",
        createdAt: new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000).toISOString()
      });
    }

    // Add Shares (average 2 to 8 per day)
    const shareCount = Math.floor(Math.random() * 6) + 2;
    for (let sh = 0; sh < shareCount; sh++) {
      events.push({
        id: `ae-share-${i}-${sh}`,
        locationId: "loc1",
        eventType: "share_click",
        createdAt: new Date(date.getTime() + Math.random() * 12 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  // Adding events for other locations too
  for (let i = 15; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    // Rosebank Mall
    const count = Math.floor(Math.random() * 5) + 1;
    for (let v = 0; v < count; v++) {
      events.push({
        id: `ae-rb-${i}-${v}`,
        locationId: "loc2",
        eventType: "page_view",
        createdAt: date.toISOString()
      });
    }
    // Midrand
    const count2 = Math.floor(Math.random() * 8) + 2;
    for (let v = 0; v < count2; v++) {
      events.push({
        id: `ae-mr-${i}-${v}`,
        locationId: "loc3",
        eventType: "qr_scan",
        createdAt: date.toISOString()
      });
    }
  }

  return events;
};
