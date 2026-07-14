import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { EasyRewardService } from '../services/EasyRewardService';
import { INDUSTRY_CATEGORIES } from './Onboard';
import { Business, Location, Customer, Referral, Promotion, Review, TollaUser, CustomerBusiness, Wallet, TimelineEvent } from '../types';
import { ReferralTree } from '../components/ReferralTree';
import { Logo } from '../components/Logo';
import { 
  LayoutGrid, Users, Share2, BarChart3, Flame, Star, 
  Network, Settings, CreditCard, LogOut, ArrowRight, Check, X,
  AlertTriangle, Copy, Trash2, Edit2, Plus, ExternalLink, Calendar,
  Activity, CheckCircle2, Clock, ShieldCheck, Mail, Download, TrendingUp,
  Phone, MessageCircle, Sparkles, MapPin, Award, Upload, Megaphone
} from 'lucide-react';

const renderStars = (rating: number) => {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`w-3.5 h-3.5 ${i < rating ? 'fill-amber-500 stroke-amber-500' : 'stroke-slate-700 fill-none'}`} 
        />
      ))}
    </div>
  );
};
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';

interface DashboardProps {
  authUser: {
    id: string;
    role: 'owner' | 'manager';
    businessId: string;
    locationId: string | null;
  };
  onLogout: () => void;
}

const PRESET_BANNERS = [
  { name: 'Car Wash', url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&h=400&fit=crop&q=80' },
  { name: 'Car Detailing', url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&h=400&fit=crop&q=80' },
  { name: 'Hair Salon', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80' },
  { name: 'Coffee Shop', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=400&fit=crop&q=80' },
  { name: 'Retail Store', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop&q=80' },
  { name: 'Restaurant', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop&q=80' }
];

export const Dashboard: React.FC<DashboardProps> = ({ authUser, onLogout }) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tollaUsers, setTollaUsers] = useState<TollaUser[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [weeklyTraffic, setWeeklyTraffic] = useState<{ name: string; Scans: number; PageViews: number; Shares: number }[]>([]);
  const [qrPosterText, setQrPosterText] = useState('');
  const [analytics, setAnalytics] = useState<any>({
    customersRegistered: 0,
    referralPagesGenerated: 0,
    referralPageViews: 0,
    qrScans: 0,
    linksShared: 0,
    successfulRedemptions: 0,
    pendingRewards: 0,
    conversionRate: 0,
    registrationAttempts: 0,
  });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
  };
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'marketing' | 'growth' | 'settings' | 'billing'>('dashboard');
  const [customersSubTab, setCustomersSubTab] = useState<'list' | 'referrals' | 'networks' | 'analytics'>('list');

  // Redemption State
  const [redeemCode, setRedeemCode] = useState('');
  const [redemptionResult, setRedemptionResult] = useState<any>(null);
  const [redemptionError, setRedemptionError] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [amountToRedeem, setAmountToRedeem] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Forms / Modals
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBranchCount, setSelectedBranchCount] = useState<number>(1);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoImg, setPromoImg] = useState('');
  const [promoExpiry, setPromoExpiry] = useState('');
  const [promoError, setPromoError] = useState('');

  // Settings
  const [bizName, setBizName] = useState('');
  const [bizLogoUrl, setBizLogoUrl] = useState('');
  const [referrerReward, setReferrerReward] = useState('');
  const [friendReward, setFriendReward] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [managerLinks, setManagerLinks] = useState<ManagerLink[]>([]);
  const [selectedLinkExpiry, setSelectedLinkExpiry] = useState<Record<string, '30' | '90' | 'never'>>({});
  const [invoiceConfig, setInvoiceConfig] = useState({
    companyName: 'Tolla (Pty) Ltd',
    companyAddress: '124 Rivonia Road, Sandton, Johannesburg, South Africa, 2196',
    bankName: 'First National Bank (FNB)',
    accountHolder: 'Tolla (Pty) Ltd',
    accountNumber: '62901234567',
    branchCode: '250655'
  });

  // Unique list of all catalog services across all locations of this business
  const allCatalogServices = useMemo(() => {
    const map = new Map<string, { id: string; name: string; price: number }>();
    locations.forEach(loc => {
      (loc.services || []).forEach((s: any) => {
        const idKey = s.id || s.name;
        map.set(idKey, { id: idKey, name: s.name, price: s.price });
      });
    });
    return Array.from(map.values());
  }, [locations]);

  // Dynamic analytics calculations
  const dynamicStats = useMemo(() => {
    if (!activeLocation) return {
      scanners: 0,
      registeredCustomers: 0,
      scannersWhoShare: 0,
      sharesThatBecomeVisits: 0,
      costOfRewards: 0,
      newRevenue: 0
    };

    // 1. # of customers who scan: total QR Code scans recorded for this branch
    const scanners = analytics.qrScans || 0;

    const localCustomers = customers.filter(c => c.locationId === activeLocation.id);
    const localReferrals = referrals.filter(r => r.locationId === activeLocation.id);

    const registeredCustomers = localCustomers.length;

    // Number of customers who have at least one referral
    const scannersWhoShare = localCustomers.filter(c => 
      localReferrals.some(r => r.customerBusinessId === c.id)
    ).length;

    // 3. # of shares that become visits: referrals redeemed
    const sharesThatBecomeVisits = localReferrals.filter(r => r.status === 'redeemed').length;

    // 4. Cost of rewards: sum of referral payout reward values (referrers + friend discounts)
    const parseRewardValue = (rewardStr: string, spendAmt: number = 0) => {
      if (!rewardStr) return 0;
      const clean = rewardStr.replace(/[^\d.]/g, '');
      const val = parseFloat(clean);
      if (isNaN(val)) return 0;
      if (rewardStr.includes('%')) {
        return (val / 100) * spendAmt;
      }
      return val;
    };

    const costOfRewards = localReferrals.filter(r => r.status === 'redeemed').reduce((sum, r) => {
      const spend = r.spendAmount || 0;
      const referrerCost = business ? parseRewardValue(business.referrerReward, spend) : 50;
      const refereeCost = business ? parseRewardValue(business.friendReward, spend) : 50;
      return sum + referrerCost + refereeCost;
    }, 0);

    // 5. New revenue generated: sum of spendAmount of redeemed referrals
    const newRevenue = localReferrals.filter(r => r.status === 'redeemed').reduce((sum, r) => sum + (r.spendAmount || 0), 0);

    return {
      scanners,
      registeredCustomers,
      scannersWhoShare,
      sharesThatBecomeVisits,
      costOfRewards,
      newRevenue
    };
  }, [activeLocation, analytics.qrScans, customers, referrals, business]);

  // Referral Rules & Anti-Fraud Settings
  const [verificationMethod, setVerificationMethod] = useState<'code' | 'code_phone' | 'code_identifier' | 'manager_approval'>('code');
  const [customIdentifierLabel, setCustomIdentifierLabel] = useState('');
  const [limitOnePerFriend, setLimitOnePerFriend] = useState(true);
  const [requirePurchase, setRequirePurchase] = useState(false);
  const [minimumSpend, setMinimumSpend] = useState<string>('');
  const [rewardExpiryDays, setRewardExpiryDays] = useState<string>('');
  const [limitOnePerDay, setLimitOnePerDay] = useState(false);
  const [firstTimeOnly, setFirstTimeOnly] = useState(true);
  const [blockSelfReferral, setBlockSelfReferral] = useState(true);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Timeline Event Modal States
  const [selectedTimelineCust, setSelectedTimelineCust] = useState<CustomerBusiness | null>(null);
  const [selectedTimelineEvents, setSelectedTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedTimelineUser, setSelectedTimelineUser] = useState<TollaUser | null>(null);

  // Validation Inputs (Counter Validation Page)
  const [validationPhone, setValidationPhone] = useState('');
  const [validationEmail, setValidationEmail] = useState('');
  const [validationMode, setValidationMode] = useState<'whatsapp' | 'email'>('whatsapp');
  const [validationIdentifier, setValidationIdentifier] = useState('');
  const [validationSpend, setValidationSpend] = useState('');

  // Service Catalog States
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceImage, setNewServiceImage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Inline Service Editing States
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('');
  const [editServiceImage, setEditServiceImage] = useState('');
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [isDraggingPromo, setIsDraggingPromo] = useState(false);
  const [promoImageError, setPromoImageError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Reward Type Selector States
  const [referrerRewardType, setReferrerRewardType] = useState<'cash' | 'percent'>('cash');
  const [friendRewardType, setFriendRewardType] = useState<'cash' | 'percent'>('percent');
  const [hasFriendReward, setHasFriendReward] = useState<boolean>(true);
  const [referrerGifts, setReferrerGifts] = useState<string[]>(['']);
  const [friendGifts, setFriendGifts] = useState<string[]>(['']);

  // Multi-location States
  const [selectedRedeemableLocationIds, setSelectedRedeemableLocationIds] = useState<string[]>([]);
  const [selectedEligibleServiceIds, setSelectedEligibleServiceIds] = useState<string[]>([]);
  const [selectedCheckoutServiceId, setSelectedCheckoutServiceId] = useState('');
  const [selectedPromoLocationIds, setSelectedPromoLocationIds] = useState<string[]>([]);
  const [previewLocCount, setPreviewLocCount] = useState<number | null>(null);
  const [showMobileValidateModal, setShowMobileValidateModal] = useState(false);
  const [showMobileQuickActions, setShowMobileQuickActions] = useState(false);
  const [showMobileQRModal, setShowMobileQRModal] = useState(false);

  // Subscriptions upgrade dialog
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Location Configure Hours & Photos Modal State
  const [configureLocId, setConfigureLocId] = useState<string | null>(null);
  const [configHours, setConfigHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({});
  const [configGallery, setConfigGallery] = useState<string[]>([]);
  const [isDraggingGallery, setIsDraggingGallery] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [configLocName, setConfigLocName] = useState('');
  const [configLocAddress, setConfigLocAddress] = useState('');
  const [configLocPhone, setConfigLocPhone] = useState('');
  const [configLocWhatsapp, setConfigLocWhatsapp] = useState('');
  const [configLocIdentifier, setConfigLocIdentifier] = useState('');
  const [configLocVerificationMethod, setConfigLocVerificationMethod] = useState<'code' | 'code_phone' | 'code_identifier' | 'manager_approval'>('code');
  const [configLocBannerUrl, setConfigLocBannerUrl] = useState('');

  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [configLocCategory, setConfigLocCategory] = useState('beauty');
  const [configLocSubIndustry, setConfigLocSubIndustry] = useState('Hair Salon');
  const [configLocCustomVal, setConfigLocCustomVal] = useState('');
  const [configLocCustomType, setConfigLocCustomType] = useState('Service');

  const [hasCompletedSetup, setHasCompletedSetup] = useState(() => {
    return localStorage.getItem(`tolla_onboarded_${authUser.id}`) === 'true';
  });

  // Onboarding check for new merchant accounts
  const isNewMerchantAccount = useMemo(() => {
    if (hasCompletedSetup) return false;
    return authUser.role === 'owner' && 
           locations.length === 1 && 
           locations[0].address === 'Default Store Address, South Africa';
  }, [locations, authUser.role, hasCompletedSetup]);

  // Ref for Google Maps Autocomplete address binding
  const addressInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load Google Maps Autocomplete script dynamically on mount
  useEffect(() => {
    const apiKey = (import.meta.env as any).VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is not defined in .env.local. Google Places autocomplete is disabled.");
      return;
    }
    if ((window as any).google?.maps?.places) return;

    const scriptId = 'google-maps-places-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Force onboarding modal open if isNewMerchantAccount
  useEffect(() => {
    if (isNewMerchantAccount && locations[0] && !configureLocId) {
      openConfigureModal(locations[0]);
    }
  }, [isNewMerchantAccount, locations, configureLocId]);

  // Bind Google Autocomplete places autocomplete listener to address input
  useEffect(() => {
    if (!configureLocId && !isCreatingLocation) return;

    const timer = setTimeout(() => {
      const input = addressInputRef.current;
      if (!input || !(window as any).google?.maps?.places) return;

      const autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
        types: ['address', 'establishment'],
        componentRestrictions: { country: 'za' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setConfigLocAddress(place.formatted_address);
        } else if (place.name) {
          setConfigLocAddress(place.name);
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [configureLocId, isCreatingLocation]);

  // Load location-specific data whenever activeLocation.id changes
  useEffect(() => {
    if (!activeLocation) return;
    setQrPosterText(activeLocation.qrPosterText || `Scan to get ${business?.friendReward || 'rewards'}! 🎁`);
    
    const loadLocationData = async () => {
      try {
        const summary = await EasyRewardService.getAnalyticsSummary(activeLocation.id);
        setAnalytics(summary);
        
        const revs = await EasyRewardService.getReviews(activeLocation.id);
        setReviews(revs);

        const traffic = await EasyRewardService.getWeeklyTraffic(activeLocation.id);
        setWeeklyTraffic(traffic);
      } catch (err) {
        console.error("Error loading location-specific data", err);
      }
    };

    loadLocationData();
  }, [activeLocation?.id, business?.friendReward]);

  const handlePrintPoster = () => {
    if (!activeLocation) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups to print the poster.", "error");
      return;
    }

    const qrUrl = activeLocation.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`https://wa.me/27833977936?text=Hi!%20Join%20${business?.slug || ''}%20${activeLocation.id}`)}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print A4 Poster - ${business?.name || 'Tolla'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, sans-serif;
              background: #ffffff;
              color: #0f172a;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              height: 100vh;
              box-sizing: border-box;
              padding: 3.5cm 2.2cm;
              text-align: center;
              -webkit-print-color-adjust: exact;
            }
            .wrapper {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
            }
            .header {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            }
            .brand-name {
              font-size: 32px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .brand-sub {
              font-size: 14px;
              font-weight: 700;
              color: #10b981;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .cta-container {
              margin: 30px 0;
              max-width: 95%;
            }
            .cta-title {
              font-size: 42px;
              font-weight: 900;
              line-height: 1.2;
              color: #0f172a;
              letter-spacing: -1px;
            }
            .qr-outer {
              padding: 28px;
              background: #ffffff;
              border: 3px solid #e2e8f0;
              border-radius: 36px;
              display: inline-block;
            }
            .qr-img {
              width: 300px;
              height: 300px;
              display: block;
            }
            .instructions {
              width: 100%;
              margin-top: 30px;
            }
            .instructions-title {
              font-size: 16px;
              font-weight: 800;
              color: #64748b;
              margin-bottom: 24px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .steps {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              width: 100%;
            }
            .step-card {
              flex: 1;
              background: #ffffff;
              border: 2px solid #f1f5f9;
              border-radius: 20px;
              padding: 24px 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
              text-align: center;
            }
            .step-num {
              width: 32px;
              height: 32px;
              background: #0f172a;
              color: #ffffff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 800;
            }
            .step-heading {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .step-text {
              font-size: 12px;
              font-weight: 500;
              color: #64748b;
              line-height: 1.5;
            }
            .footer {
              font-size: 13px;
              font-weight: 600;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              width: 100%;
              padding-top: 24px;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <div class="brand-name">${business?.name || 'Tolla'}</div>
              <div class="brand-sub">Rewards Partner</div>
            </div>
            
            <div class="cta-container">
              <div class="cta-title">${qrPosterText}</div>
            </div>
            
            <div class="qr-outer">
              <img class="qr-img" src="${qrUrl}" alt="Storefront QR Code" />
            </div>
            
            <div class="instructions">
              <div class="instructions-title">How it works</div>
              <div class="steps">
                <div class="step-card">
                  <div class="step-num">1</div>
                  <div class="step-heading">Scan QR Code</div>
                  <div class="step-text">Open your phone camera and scan the code.</div>
                </div>
                <div class="step-card">
                  <div class="step-num">2</div>
                  <div class="step-heading">Get Your Link</div>
                  <div class="step-text">Register instantly to receive your invite link.</div>
                </div>
                <div class="step-card">
                  <div class="step-num">3</div>
                  <div class="step-heading">Earn Rewards</div>
                  <div class="step-text">Share your link with friends to earn rewards.</div>
                </div>
              </div>
            </div>
            
            <div class="footer">Powered by Tolla.app</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const openConfigureModal = (loc: Location) => {
    setIsCreatingLocation(false);
    setConfigureLocId(loc.id);
    setConfigLocName(loc.name);
    setConfigLocAddress(loc.address);
    setConfigLocPhone(loc.phoneNumber);
    setConfigLocWhatsapp(loc.whatsappNumber);
    setConfigLocIdentifier(loc.customIdentifierName ?? '');
    setConfigLocBannerUrl(loc.bannerUrl || '');
    setConfigLocVerificationMethod(loc.verificationMethod ?? 'code');
    
    // Attempt to reverse match industry category, otherwise default to other
    let matchedCategory = 'other';
    if (loc.industry) {
      for (const [catKey, catVal] of Object.entries(INDUSTRY_CATEGORIES)) {
        if (catVal.items.some(item => item.name === loc.industry)) {
          matchedCategory = catKey;
          break;
        }
      }
    }
    setConfigLocCategory(matchedCategory);
    setConfigLocSubIndustry(loc.industry ?? 'Hair Salon');
    setConfigLocCustomVal(loc.customIndustry ?? '');
    setConfigLocCustomType(loc.businessType ?? 'Service');

    // Seed with existing hours or sensible defaults
    const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach(day => {
      defaultHours[day] = loc.openingHours?.[day] ?? {
        open: '08:00',
        close: '17:00',
        closed: day === 'Sunday',
      };
    });
    setConfigHours(defaultHours);
    setConfigGallery(loc.galleryUrls ?? []);
  };

  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingGallery(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
        showToast('Only image files are allowed (PNG, JPG, GIF, WEBP, SVG)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setConfigGallery(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGalleryFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
        showToast('Only image files are allowed', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setConfigGallery(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
      showToast('Only image files are allowed', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBizLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
      showToast('Only image files are allowed', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBizLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
      showToast('Only image files are allowed', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfigLocBannerUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png','jpg','jpeg','gif','webp','svg'].includes(ext)) {
      showToast('Only image files are allowed', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setConfigLocBannerUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLocationConfig = async () => {
    if (!configureLocId && !isCreatingLocation) return;
    
    // Determine values to save
    const isCustom = configLocSubIndustry === 'Other (Custom)' || configLocCategory === 'other';
    const finalIndustry = isCustom ? (configLocCustomVal.trim() || 'Custom Business') : configLocSubIndustry;
    const finalCustomIndustry = isCustom ? finalIndustry : undefined;
    
    // Resolve business type
    let finalType = 'Other';
    if (isCustom) {
      finalType = configLocCustomType;
    } else {
      const match = INDUSTRY_CATEGORIES[configLocCategory]?.items.find(i => i.name === configLocSubIndustry);
      if (match) finalType = match.type;
    }

    try {
      if (isCreatingLocation) {
        // Create location
        const newLoc = await EasyRewardService.createLocation({
          businessId: business!.id,
          name: configLocName,
          address: configLocAddress,
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(configLocAddress)}`,
          phoneNumber: configLocPhone,
          whatsappNumber: configLocWhatsapp,
          verificationMethod: configLocVerificationMethod,
          customIdentifierName: configLocVerificationMethod === 'code_identifier' ? configLocIdentifier : undefined,
          openingHours: configHours,
          galleryUrls: configGallery,
          industry: finalIndustry,
          customIndustry: finalCustomIndustry,
          businessType: finalType,
          bannerUrl: configLocBannerUrl || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80"
        });

        // Auto enable for redemptions
        const updatedRedeemable = [...(business!.redeemableLocationIds ?? []), newLoc.id];
        await EasyRewardService.updateBusiness(business!.id, {
          redeemableLocationIds: updatedRedeemable
        });

        showToast('Location created successfully!', 'success');
        setIsCreatingLocation(false);
      } else {
        // Update location
        await EasyRewardService.updateLocation(configureLocId!, {
          name: configLocName,
          address: configLocAddress,
          googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(configLocAddress)}`,
          phoneNumber: configLocPhone,
          whatsappNumber: configLocWhatsapp,
          verificationMethod: configLocVerificationMethod,
          customIdentifierName: configLocVerificationMethod === 'code_identifier' ? configLocIdentifier : undefined,
          openingHours: configHours,
          galleryUrls: configGallery,
          industry: finalIndustry,
          customIndustry: finalCustomIndustry,
          businessType: finalType,
          bannerUrl: configLocBannerUrl || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80"
        });
        showToast('Location updated successfully!', 'success');
        setConfigureLocId(null);
        setHasCompletedSetup(true);
        localStorage.setItem(`tolla_onboarded_${authUser.id}`, 'true');
      }
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save changes.', 'error');
    }
  };

  const handleDeleteLocation = async () => {
    if (!configureLocId) return;
    
    // Prevent deleting the only location
    if (locations.length <= 1) {
      showToast("Error: You must have at least one branch location registered for your business.", "error");
      return;
    }

    if (window.confirm(`Are you sure you want to remove the location "${configLocName}"? This will delete all of its active analytics history, scanned referrals, and customer reviews.`)) {
      try {
        await EasyRewardService.deleteLocation(configureLocId);
        showToast("Location removed successfully.", "info");
        setConfigureLocId(null);
        
        // If the deleted location was the active one, fallback to the remaining one
        const remaining = locations.filter(l => l.id !== configureLocId);
        if (activeLocation?.id === configureLocId && remaining.length > 0) {
          setActiveLocation(remaining[0]);
        }
        
        loadData();
      } catch (err) {
        console.error(err);
        showToast("Failed to remove location.", "error");
      }
    }
  };

  const handleGenerateManagerLink = async (locationId: string) => {
    try {
      const expiry = selectedLinkExpiry[locationId] || '30';
      const link = await EasyRewardService.createManagerLink(locationId, business!.id, expiry);
      showToast(`Stateless cashier access link generated! Expires: ${expiry === 'never' ? 'Never' : `${expiry} Days`}`, 'success');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to generate manager access link.', 'error');
    }
  };

  const handleRevokeManagerLink = async (linkId: string) => {
    if (window.confirm("Are you sure you want to revoke this manager access link? The cashier will immediately lose access and be locked out.")) {
      try {
        await EasyRewardService.deleteManagerLink(linkId);
        showToast('Cashier link revoked successfully.', 'info');
        loadData();
      } catch (err) {
        console.error(err);
        showToast('Failed to revoke access link.', 'error');
      }
    }
  };

  const handleIncrementLocation = async () => {
    try {
      const nextIndex = locations.length + 1;
      const newLoc = await EasyRewardService.createLocation({
        businessId: business!.id,
        name: `Branch Location #${nextIndex}`,
        address: `Street Address ${nextIndex}, South Africa`,
        phoneNumber: `+2711000${nextIndex}00`,
        whatsappNumber: `+2782000${nextIndex}00`,
        openingHours: {
          Monday: { open: "08:00", close: "17:00", closed: false },
          Tuesday: { open: "08:00", close: "17:00", closed: false },
          Wednesday: { open: "08:00", close: "17:00", closed: false },
          Thursday: { open: "08:00", close: "17:00", closed: false },
          Friday: { open: "08:00", close: "17:00", closed: false },
          Saturday: { open: "08:00", close: "17:00", closed: false },
          Sunday: { open: "09:00", close: "15:00", closed: true }
        },
        galleryUrls: [],
        bannerUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80",
        verificationMethod: 'code'
      });
      
      // Auto enable for redemptions
      const updatedRedeemable = [...(business!.redeemableLocationIds ?? []), newLoc.id];
      await EasyRewardService.updateBusiness(business!.id, {
        redeemableLocationIds: updatedRedeemable
      });

      showToast(`Branch Location #${nextIndex} created!`, 'success');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add location.', 'error');
    }
  };

  const handleDecrementLocations = async () => {
    if (locations.length <= 1) {
      showToast("Error: You must have at least one branch location registered.", "error");
      return;
    }
    const lastLoc = locations[locations.length - 1];
    try {
      await EasyRewardService.deleteLocation(lastLoc.id);
      showToast(`Branch "${lastLoc.name}" removed.`, 'info');
      
      // Update active selection if the deleted one was selected
      if (activeLocation?.id === lastLoc.id && locations.length > 1) {
        setActiveLocation(locations[0]);
      }

      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove location.', 'error');
    }
  };

  // Load Data
  const loadData = async () => {
    try {
      const businesses = await EasyRewardService.getBusinesses();
      const biz = businesses.find(b => b.id === authUser.businessId);
      setBusiness(biz);
      setBizName(biz.name);
      setBizLogoUrl(biz.logoUrl || '');
      setQrPosterText(prev => prev || `Scan to get ${biz.friendReward || 'rewards'}! 🎁`);
      setReferrerReward(biz.referrerReward);
      if (biz.referrerReward.includes('%')) {
        setReferrerRewardType('percent');
      } else {
        setReferrerRewardType('cash');
      }
      
      if (biz.referrerReward.includes(' | ')) {
        setReferrerGifts(biz.referrerReward.split(' | '));
      } else {
        setReferrerGifts([biz.referrerReward]);
      }

      if (biz.friendReward === 'none' || biz.friendReward === 'No special reward' || !biz.friendReward) {
        setHasFriendReward(false);
        setFriendRewardType('percent');
        setFriendReward('15% discount on checkout');
      } else {
        setHasFriendReward(true);
        setFriendReward(biz.friendReward);
        if (biz.friendReward.includes('%')) {
          setFriendRewardType('percent');
        } else {
          setFriendRewardType('cash');
        }
      }

      if (biz.friendReward && biz.friendReward.includes(' | ')) {
        setFriendGifts(biz.friendReward.split(' | '));
      } else if (biz.friendReward) {
        setFriendGifts([biz.friendReward]);
      }

      setVerificationMethod(biz.verificationMethod ?? 'code');
      setCustomIdentifierLabel(biz.customIdentifierLabel ?? '');
      setLimitOnePerFriend(biz.limitOnePerFriend ?? false);
      setRequirePurchase(biz.requirePurchase ?? false);
      setMinimumSpend(biz.minimumSpend ? String(biz.minimumSpend) : '');
      setRewardExpiryDays(biz.rewardExpiryDays ? String(biz.rewardExpiryDays) : '');
      setLimitOnePerDay(biz.limitOnePerDay ?? false);
      setFirstTimeOnly(biz.firstTimeOnly ?? false);
      setBlockSelfReferral(biz.blockSelfReferral ?? false);
      setSelectedRedeemableLocationIds(biz.redeemableLocationIds ?? []);
      setSelectedEligibleServiceIds(biz.eligibleServiceIds ?? []);

      const locs = await EasyRewardService.getLocations(biz.id);
      setLocations(locs);
      setPreviewLocCount(locs.length);
      setSelectedBranchCount(locs.length);
      
      // Determine active location
      let currentLoc = null;
      if (authUser.role === 'manager' && authUser.locationId) {
        currentLoc = locs.find(l => l.id === authUser.locationId) || null;
      } else {
        const activeId = activeLocation ? activeLocation.id : null;
        currentLoc = locs.find(l => l.id === activeId) || locs[0] || null;
      }
      setActiveLocation(currentLoc);

      if (currentLoc) {
        // Analytics, reviews, and traffic are loaded reactively by the activeLocation useEffect listener!
      }

      const custs = await EasyRewardService.getCustomers(biz.id);
      setCustomers(custs);

      const ulist = await EasyRewardService.getTollaUsers();
      setTollaUsers(ulist);

      const refs = await EasyRewardService.getReferrals(biz.id);
      setReferrals(refs);

      const proms = await EasyRewardService.getPromotions(biz.id);
      setPromotions(proms);

       const mLinks = await EasyRewardService.getAllManagerLinks();
      setManagerLinks(mLinks);

      try {
        const config = await EasyRewardService.getSystemSetting('invoice_details');
        if (config) {
          setInvoiceConfig({
            companyName: config.companyName || 'Tolla (Pty) Ltd',
            companyAddress: config.companyAddress || '124 Rivonia Road, Sandton, Johannesburg, South Africa, 2196',
            bankName: config.bankName || 'First National Bank (FNB)',
            accountHolder: config.accountHolder || 'Tolla (Pty) Ltd',
            accountNumber: config.accountNumber || '62901234567',
            branchCode: config.branchCode || '250655'
          });
        }
      } catch (err) {
        console.error("Failed to load invoice settings:", err);
      }
    } catch (err) {
      console.error("Dashboard error loading data", err);
    }
  };

  useEffect(() => {
    loadData();
  // Only re-run when the logged-in user changes — NOT on activeLocation
  // (activeLocation is set BY loadData, so including it causes an infinite loop)
  }, [authUser]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setImageError(false);
  }, [newServiceImage]);

  useEffect(() => {
    setPromoImageError(false);
  }, [promoImg]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Fallback for iOS detection to help managers add to home screen
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIOS && !isStandalone) {
      setShowInstallBanner(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA install outcome: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } else {
      // iOS / Safari instruction fallback toast
      showToast("To install Tolla: Tap the Safari Share icon (up arrow box) at the bottom, then scroll and select 'Add to Home Screen'.", "info");
    }
  };

  // Handle Preview Lookup
  const handlePreviewLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode || !activeLocation || !business) return;
    setRedemptionError('');
    setLookupResult(null);
    setLookupLoading(true);

    try {
      let codeClean = redeemCode.trim();
      if (!/[a-zA-Z]/.test(codeClean)) {
        let clean = codeClean.replace(/\D/g, '');
        if (clean.startsWith('27') && clean.length > 9) {
          clean = '0' + clean.slice(2);
        }
        if (clean.length > 0 && !clean.startsWith('0')) {
          clean = '0' + clean;
        }
        codeClean = clean;
      }
      const codeCleanUpper = codeClean.toUpperCase();
      
      // 1. Try to find a referral (referee/friend discount) by discount code first
      const { data: refByCode } = await supabase
        .from('referrals')
        .select('*, customer_businesses(*, tolla_users(*))')
        .eq('discount_code', codeCleanUpper)
        .is('deleted_at', null)
        .maybeSingle();

      let referral = refByCode;

      // 2. If not found by code, try to find a referral by phone number
      if (!referral) {
        const cleanPhone = codeClean.replace(/\D/g, '');
        const phoneConditions = [];
        if (codeClean) phoneConditions.push(`referee_phone.eq.${codeClean}`);
        if (cleanPhone) phoneConditions.push(`referee_phone.eq.${cleanPhone}`);
        
        if (phoneConditions.length > 0) {
          const { data: refByPhone } = await supabase
            .from('referrals')
            .select('*, customer_businesses(*, tolla_users(*))')
            .or(phoneConditions.join(','))
            .is('deleted_at', null)
            .maybeSingle();
            
          if (refByPhone) {
            referral = refByPhone;
          }
        }
      }

      if (referral) {
        if (referral.status === 'redeemed') {
          setRedemptionError("This discount code has already been redeemed and cannot be used again.");
          setLookupLoading(false);
          return;
        }
        if (referral.status === 'pending_approval') {
          setRedemptionError("This discount code has already been submitted and is currently pending manager approval.");
          setLookupLoading(false);
          return;
        }
        if (referral.status === 'rejected') {
          setRedemptionError("This discount code was rejected by the manager.");
          setLookupLoading(false);
          return;
        }

        // If a pending referral is found, construct a virtual lookup result for the referee
        const uProfile = {
          id: referral.id,
          name: 'Anonymous Friend',
          phoneNumber: referral.referee_phone || undefined,
          emailAddress: referral.referee_email || undefined,
          referralCode: referral.discount_code
        };

        setLookupResult({
          customer: referral.customer_businesses, // The advocate who referred them
          user: uProfile,
          wallets: [],
          vouchers: [
            {
              id: referral.id,
              customerBusinessId: referral.customer_business_id,
              refereePhone: referral.referee_phone || undefined,
              refereeEmail: referral.referee_email || undefined,
              discountCode: referral.discount_code,
              locationId: referral.location_id,
              status: referral.status,
              createdAt: referral.created_at
            }
          ]
        });
        setLookupLoading(false);
        return;
      }

      // 3. Fallback: Search for a registered customer/advocate (by referral code or phone number)
      let cust = await EasyRewardService.getCustomerByReferralCode(codeClean);
      
      if (!cust) {
        const cleanPhone = codeClean.replace(/\D/g, '');
        const phoneConditions = [];
        if (codeClean) phoneConditions.push(`phone_number.eq.${codeClean}`);
        if (cleanPhone) phoneConditions.push(`phone_number.eq.${cleanPhone}`);
        
        if (phoneConditions.length > 0) {
          const { data: matchedUser } = await supabase
            .from('tolla_users')
            .select('*')
            .or(phoneConditions.join(','));
            
          if (matchedUser && matchedUser.length > 0) {
            const { data: cb } = await supabase
              .from('customer_businesses')
              .select('*')
              .eq('tolla_user_id', matchedUser[0].id)
              .eq('business_id', business.id)
              .maybeSingle();
            if (cb) {
              cust = {
                id: cb.id,
                tollaUserId: cb.tolla_user_id,
                businessId: cb.business_id,
                locationId: cb.location_id,
                customIdentifier: cb.custom_identifier,
                referralScore: cb.referral_score,
                createdAt: cb.created_at
              };
            }
          }
        }
      }

      if (!cust) {
        setRedemptionError("No active customer profile or referral link found matching this code/number.");
        setLookupLoading(false);
        return;
      }

      // Fetch user profile info
      const uProfile = await EasyRewardService.getTollaUser(cust.tollaUserId);
      
      // Fetch active wallet balances
      const userWallets = await EasyRewardService.getWallets(cust.id);
      
      // Fetch successful referrals (unredeemed invites)
      const allRefs = await EasyRewardService.getReferrals(business.id);
      const custRefs = allRefs.filter(r => r.customerBusinessId === cust.id);
      const availableVouchers = custRefs.filter(r => r.status === 'pending' || r.status === 'pending_approval');

      setLookupResult({
        customer: cust,
        user: uProfile,
        wallets: userWallets,
        vouchers: availableVouchers
      });
    } catch (err) {
      console.error(err);
      setRedemptionError("An error occurred during lookup.");
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Redemption Lookups
  const handleRedemptionLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode || !activeLocation) return;
    setRedemptionError('');
    setRedemptionResult(null);

    const spendNum = validationSpend ? parseFloat(validationSpend) : undefined;
    let codeToRedeem = redeemCode.trim();
    if (lookupResult?.vouchers && lookupResult.vouchers.length > 0) {
      codeToRedeem = lookupResult.vouchers[0].discountCode || codeToRedeem;
    }

    const res = await EasyRewardService.redeemCode(
      codeToRedeem, 
      authUser.id, 
      activeLocation.id, 
      validationMode === 'whatsapp' ? (validationPhone || undefined) : undefined, 
      validationIdentifier || undefined,
      spendNum,
      validationMode === 'email' ? (validationEmail || undefined) : undefined
    );
    if (res.error) {
      setRedemptionError(res.error);
      showToast(res.error, 'error');
    } else {
      setRedemptionResult(res);
      const isPendingApproval = res.referral?.status === 'pending_approval';
      if (isPendingApproval) {
        showToast('Referral submitted to pending approval queue!', 'success');
      } else {
        showToast('Referral code redeemed successfully!', 'success');
      }
      setValidationPhone('');
      setValidationEmail('');
      setValidationIdentifier('');
      setValidationSpend('');
      setSelectedCheckoutServiceId('');
      loadData();
    }
  };

  const handleRedeemWallet = async () => {
    if (!lookupResult?.customer || !activeLocation || !amountToRedeem) return;
    const amount = parseFloat(amountToRedeem);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount to redeem.', 'error');
      return;
    }

    setRedeemLoading(true);
    try {
      const res = await EasyRewardService.redeemWalletBalance(
        lookupResult.customer.id,
        activeLocation.id,
        amount,
        authUser.id
      );

      if (res.success) {
        showToast(`Successfully redeemed R${amount.toFixed(2)} from customer wallet!`, 'success');
        setAmountToRedeem('');
        
        // Refresh the search result data to show updated wallet balance
        const updatedWallets = await EasyRewardService.getWallets(lookupResult.customer.id);
        setLookupResult((prev: any) => prev ? { ...prev, wallets: updatedWallets } : null);
        loadData();
      } else {
        showToast(res.error || 'Failed to redeem wallet balance.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred during wallet redemption.', 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  const getCalculatedEarnings = () => {
    if (!validationSpend || !business?.referrerReward) return '0.00';
    const spend = parseFloat(validationSpend);
    if (isNaN(spend) || spend <= 0) return '0.00';
    const earned = EasyRewardService.calculateReferralReward(business.referrerReward, spend);
    return earned.toFixed(2);
  };

  // Handle Referral Approvals Queue
  const handleApproveReferral = async (referralId: string) => {
    try {
      const res = await EasyRewardService.approveReferral(referralId, authUser.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Referral approved successfully!', 'success');
        loadData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to approve referral.', 'error');
    }
  };

  const handleRejectReferral = async (referralId: string) => {
    try {
      const res = await EasyRewardService.rejectReferral(referralId, authUser.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Referral marked as rejected.', 'info');
        loadData();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to reject referral.', 'error');
    }
  };

  const handleDeleteCustomer = async (customerId: string, label: string) => {
    const confirmation = window.confirm(
      `POPIA Data Deletion Request:\n\nAre you sure you want to delete customer ${label} and erase all their PII? This cannot be undone.`
    );
    if (confirmation) {
      try {
        await EasyRewardService.deleteCustomer(customerId);
        showToast("Customer database record scrubbed and anonymized in compliance with POPIA.", "info");
        loadData();
      } catch (err) {
        console.error(err);
        showToast("Failed to delete customer.", "error");
      }
    }
  };

  const handleOpenTimeline = async (cust: CustomerBusiness) => {
    setSelectedTimelineCust(cust);
    const events = await EasyRewardService.getTimelineEvents(cust.id);
    setSelectedTimelineEvents(events);
    const relatedUser = tollaUsers.find(u => u.id === cust.tollaUserId);
    if (relatedUser) setSelectedTimelineUser(relatedUser);
  };

  // Handle Review Approval
  const handleApproveReview = async (reviewId: string, currentStatus: boolean) => {
    if (!activeLocation) return;
    
    const res = await EasyRewardService.updateReviewStatus(reviewId, !currentStatus);
    if (res.error) {
      // Trigger upgrade modal since limit of 2 was reached!
      showToast(res.error, 'warning');
      setShowUpgradeModal(true);
    } else {
      showToast(currentStatus ? 'Review unapproved.' : 'Review approved & live on link!', 'success');
      loadData();
    }
  };

  // Handle Promotion Creation
  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !promoTitle || !promoDesc) return;
    setPromoError('');

    const res = await EasyRewardService.createPromotion({
      businessId: business.id,
      title: promoTitle,
      description: promoDesc,
      imageUrl: promoImg || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&fit=crop&q=80',
      expiryDate: promoExpiry || undefined,
      locationIds: selectedPromoLocationIds
    });

    if (res.error) {
      setPromoError(res.error);
      showToast(res.error, 'warning');
      setShowUpgradeModal(true);
    } else {
      setShowPromoModal(false);
      setPromoTitle('');
      setPromoDesc('');
      setPromoImg('');
      setPromoExpiry('');
      showToast('Promotion created successfully!', 'success');
      loadData();
    }
  };

  // Handle Promo Activation for Location
  const handleSetPromoForLocation = async (promoId: string | undefined) => {
    if (!activeLocation) return;
    await EasyRewardService.updateLocation(activeLocation.id, {
      currentPromotionId: promoId
    });
    showToast(promoId ? 'Promotion activated for branch!' : 'Promotion deactivated.', 'success');
    loadData();
  };

  // Handle Delete Promotion
  const handleDeletePromotion = async (promoId: string) => {
    if (!window.confirm("Are you sure you want to delete this special deal? This action cannot be undone.")) return;
    try {
      if (activeLocation && activeLocation.currentPromotionId === promoId) {
        await EasyRewardService.updateLocation(activeLocation.id, {
          currentPromotionId: null
        });
      }
      await EasyRewardService.deletePromotion(promoId);
      showToast('Special deal deleted successfully!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete special deal.', 'error');
    }
  };

  // Helper to calculate promotional discounts dynamically
  const calculateDiscount = (price: number, promo: Promotion) => {
    // Look for percentage e.g. "20%"
    const pctMatch = promo.title.match(/(\d+)\s*%/);
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1]);
      const discount = (price * pct) / 100;
      return {
        discounted: Math.max(0, price - discount),
        savings: discount,
        text: `${pct}% Off`
      };
    }
    // Look for flat Rand e.g. "R50"
    const randMatch = promo.title.match(/R\s*(\d+)/i) || promo.description.match(/R\s*(\d+)/i);
    if (randMatch) {
      const amt = parseFloat(randMatch[1]);
      return {
        discounted: Math.max(0, price - amt),
        savings: amt,
        text: `R${amt} Off`
      };
    }
    // Default fallback: 15%
    const defaultPct = 15;
    const discount = (price * defaultPct) / 100;
    return {
      discounted: Math.max(0, price - discount),
      savings: discount,
      text: `${defaultPct}% Off`
    };
  };

  // Drag & Drop handlers for Service Image Upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Check if a file was dropped
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
      return;
    }

    // Check if a URL was dropped (dragged from another website)
    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text');
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
      setNewServiceImage(url);
      showToast('Image link loaded successfully!', 'success');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File, isBanner: boolean = false) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isImgExt = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
    
    // Explicitly reject non-images like PDFs, MP4 videos, etc.
    if (!file.type.startsWith('image/') && !isImgExt) {
      showToast('Error: PDFs, MP4 videos, and non-image files are not allowed. Please upload an image.', 'error');
      return;
    }
    // Limit to 1.5MB for localStorage safety
    if (file.size > 1.5 * 1024 * 1024) {
      showToast('Image size exceeds 1.5MB limit.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isBanner) {
          setPromoImg(reader.result);
        } else {
          setNewServiceImage(reader.result);
        }
        showToast('Image uploaded and processed successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & Drop handlers for Promotion Banner Image Upload
  const handleDragOverPromo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPromo(true);
  };

  const handleDragLeavePromo = () => {
    setIsDraggingPromo(false);
  };

  const handleDropPromo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPromo(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, true);
      return;
    }

    const url = e.dataTransfer.getData('URL') || e.dataTransfer.getData('text');
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/'))) {
      setPromoImg(url);
      showToast('Image link loaded successfully!', 'success');
    }
  };

  const handleFileSelectPromo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, true);
    }
  };

  // Service Catalog Actions
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLocation || !newServiceName || !newServicePrice) return;
    try {
      const price = parseFloat(newServicePrice);
      if (isNaN(price)) {
        showToast('Please enter a valid numeric price.', 'error');
        return;
      }
      await EasyRewardService.addService(activeLocation.id, {
        name: newServiceName,
        price,
        imageUrl: newServiceImage || undefined
      });
      showToast(`Service "${newServiceName}" added successfully!`, 'success');
      setNewServiceName('');
      setNewServicePrice('');
      setNewServiceImage('');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to add service.', 'error');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!activeLocation) return;
    if (window.confirm('Are you sure you want to delete this service?')) {
      await EasyRewardService.deleteService(activeLocation.id, serviceId);
      showToast('Service deleted.', 'info');
      loadData();
    }
  };

  const handleStartEditService = (service: any) => {
    setEditingServiceId(service.id);
    setEditServiceName(service.name);
    setEditServicePrice(String(service.price));
    setEditServiceImage(service.imageUrl || '');
  };

  const handleSaveEditService = async (serviceId: string) => {
    if (!activeLocation || !editServiceName || !editServicePrice) return;
    try {
      const price = parseFloat(editServicePrice);
      if (isNaN(price)) {
        showToast('Please enter a valid numeric price.', 'error');
        return;
      }
      await EasyRewardService.updateService(activeLocation.id, serviceId, {
        name: editServiceName,
        price,
        imageUrl: editServiceImage || undefined
      });
      showToast('Service updated successfully!', 'success');
      setEditingServiceId(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update service.', 'error');
    }
  };

  const handleTogglePromoForService = async (serviceId: string, promoId: string) => {
    if (!activeLocation) return;
    await EasyRewardService.togglePromoForService(activeLocation.id, serviceId, promoId);
    showToast('Service promotion updated.', 'success');
    loadData();
  };

  // Handle Settings Update
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      const minSpendVal = minimumSpend ? parseFloat(minimumSpend) : null;
      const expiryDaysVal = rewardExpiryDays ? parseInt(rewardExpiryDays, 10) : null;

      let referrerRewardValue = referrerReward;
      let friendRewardValue = hasFriendReward ? friendReward : 'none';

      await EasyRewardService.updateBusiness(business.id, {
        name: bizName,
        logoUrl: bizLogoUrl || '',
        referrerReward: referrerRewardValue,
        friendReward: friendRewardValue,
        redeemableLocationIds: selectedRedeemableLocationIds,
        eligibleServiceIds: selectedEligibleServiceIds,
        verificationMethod,
        customIdentifierLabel,
        limitOnePerFriend,
        requirePurchase,
        minimumSpend: isNaN(minSpendVal as number) ? null : minSpendVal,
        rewardExpiryDays: isNaN(expiryDaysVal as number) ? null : expiryDaysVal,
        limitOnePerDay,
        firstTimeOnly,
        blockSelfReferral
      });
      showToast('Settings saved successfully!', 'success');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings.', 'error');
    }
  };

  // Handle Upgrade Plan (Mock operation)
  const handleUpgradePlan = () => {
    setShowUpgradeModal(false);
    setShowInvoiceModal(true);
  };

  // Generate a live feed of storefront events for easy reading
  const getActivityFeed = () => {
    const feed: { id: string; time: Date; text: string; icon: string; warnings?: string }[] = [];
    
    customers.forEach(c => {
      const u = tollaUsers.find(tu => tu.id === c.tollaUserId);
      const contactLabel = u ? (u.phoneNumber || u.emailAddress || 'Anonymous') : 'Anonymous';
      feed.push({
        id: `c_${c.id}`,
        time: new Date(c.connectedAt),
        text: `Customer registered: ${contactLabel}`,
        icon: 'user'
      });
    });

    referrals.forEach(r => {
      if (r.redeemedAt || r.status === 'redeemed' || r.status === 'pending_approval' || r.status === 'rejected') {
        const timeVal = r.redeemedAt ? new Date(r.redeemedAt) : new Date(r.createdAt);
        let statusText = r.status;
        if (r.status === 'pending_approval') statusText = 'Pending Approval';
        feed.push({
          id: `r_${r.id}`,
          time: timeVal,
          text: `Referral validation [${statusText}]: ${r.discountCode} (Friend: ${r.refereePhone || 'Walk-in'})`,
          icon: 'gift',
          warnings: r.verificationNotes
        });
      }
    });

    reviews.forEach(rev => {
      feed.push({
        id: `rev_${rev.id}`,
        time: new Date(rev.createdAt),
        text: `New review by ${rev.customerName}: "${rev.comment}"`,
        icon: 'star'
      });
    });

    // Sort by time descending
    return feed.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10);
  };

  // Generate analytics graph history (last 7 days helper)
  const chartData = useMemo(() => {
    if (weeklyTraffic && weeklyTraffic.length > 0) return weeklyTraffic;
    
    // Default fallback with 0s if database query is pending/empty
    const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return daysShort.map(name => ({ name, Scans: 0, PageViews: 0, Shares: 0 }));
  }, [weeklyTraffic]);

  // Require business & location before rendering (analytics initializes with defaults, never null)
  if (!business || !activeLocation) {
    return (
      <div className="min-h-screen bg-canvas text-txtprimary flex flex-col md:flex-row transition-colors duration-200">
        {/* Sidebar Skeleton */}
        <aside className="hidden md:block w-64 bg-panel border-r border-divider h-screen p-6 space-y-6">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-hover" />
            <div className="w-24 h-4 rounded-lg bg-hover" />
          </div>
          <div className="space-y-4 pt-10">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 rounded bg-hover" />
                <div className="w-32 h-3.5 rounded bg-hover" />
              </div>
            ))}
          </div>
        </aside>

        {/* Main Panel Skeleton */}
        <main className="flex-grow p-6 md:p-10 space-y-8">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center pb-4 border-b border-divider animate-pulse">
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-hover" />
              <div className="w-32 h-3.5 rounded-lg bg-hover" />
            </div>
            <div className="w-36 h-10 rounded-xl bg-hover" />
          </div>

          {/* Grid Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl border border-divider space-y-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-hover" />
                <div className="w-16 h-3 rounded bg-hover" />
                <div className="w-24 h-6 rounded bg-hover" />
              </div>
            ))}
          </div>

          {/* Bottom Columns Skeleton */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel p-8 rounded-2xl border border-divider space-y-4 animate-pulse">
              <div className="w-36 h-5 rounded bg-hover" />
              <div className="w-full h-4 rounded bg-hover" />
              <div className="w-full h-12 rounded-xl bg-hover" />
              <div className="w-full h-14 rounded-xl bg-hover" />
            </div>
            <div className="glass-panel p-8 rounded-2xl border border-divider space-y-4 animate-pulse">
              <div className="w-36 h-5 rounded bg-hover" />
              <div className="w-full h-44 rounded-xl bg-hover" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-txtprimary flex flex-col md:flex-row selection:bg-accent-primary selection:text-white transition-colors duration-200">
      
      {/* Mobile Top Header Bar */}
      <header className="md:hidden w-full bg-panel border-b border-divider px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Logo className="w-5 h-5" />
          <span className="font-black text-sm text-accent-primary">Tolla</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleInstallPWA}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/20 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95"
          >
            📱 Install App
          </button>

          {/* Branch selector on mobile */}
          {authUser.role === 'owner' && locations.length > 1 ? (
            <select 
              value={activeLocation.id}
              onChange={(e) => {
                const loc = locations.find(l => l.id === e.target.value);
                if (loc) setActiveLocation(loc);
              }}
              className="px-2 py-1.5 rounded-lg bg-hover border border-divider text-[10px] font-bold text-txtprimary focus:border-[#10b981] outline-none max-w-[140px]"
            >
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-[10px] text-txtsecondary font-bold bg-hover px-2.5 py-1 rounded-lg border border-divider truncate max-w-[120px]">{activeLocation.name}</span>
          )}
        </div>
      </header>

      {/* Sidebar Navigation (Desktop only) */}
      <aside className="hidden md:flex md:flex-col md:h-screen md:sticky md:top-0 left-0 z-50 w-64 bg-panel border-r border-divider justify-between shrink-0 overflow-hidden">
        <div>
          {/* Header */}
          <div className="px-5 py-4 border-b border-divider flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo className="w-6 h-6" />
              <span className="font-extrabold text-lg text-accent-primary">
                Tolla
              </span>
            </div>
            <div className="flex items-center gap-2">
              {business.subscriptionPlan === 'free' && (
                <span className="px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[9px] font-bold uppercase tracking-wider">
                  Free
                </span>
              )}
              {business.subscriptionPlan === 'premium' && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                  Premium
                </span>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-hover text-txtsecondary hover:text-txtprimary transition-all"
                aria-label="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Badge */}
          <div className="px-5 py-2.5 bg-hover/50 border-b border-divider">
            <p className="text-xs font-bold text-txtprimary truncate">{bizName || business.name}</p>
            <p className="text-[10px] text-txtsecondary capitalize mt-0.5">
              Role: {authUser.role} ({activeLocation.name})
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full px-4 py-2 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary hover:bg-hover hover:text-txtprimary'}`}
            >
              <LayoutGrid className="w-5 h-5 shrink-0" /> Redeem &amp; Overview
            </button>

            {authUser.role === 'owner' && (
              <>
                <button 
                  onClick={() => setActiveTab('customers')}
                  className={`w-full px-4 py-2 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'customers' ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary hover:bg-hover hover:text-txtprimary'}`}
                >
                  <Users className="w-5 h-5 shrink-0" /> Advocates &amp; Tree
                </button>

                <button 
                  onClick={() => setActiveTab('marketing')}
                  className={`w-full px-4 py-2 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'marketing' ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary hover:bg-hover hover:text-txtprimary'}`}
                >
                  <Megaphone className="w-5 h-5 shrink-0" /> Marketing
                </button>

                <button 
                  onClick={() => setActiveTab('growth')}
                  className={`w-full px-4 py-2 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'growth' ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary hover:bg-hover hover:text-txtprimary'}`}
                >
                  <Flame className="w-5 h-5 shrink-0" /> My Store
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full px-4 py-2 rounded-xl text-left text-sm font-bold transition-all flex items-center gap-3 ${activeTab === 'settings' ? 'bg-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary hover:bg-hover hover:text-txtprimary'}`}
                >
                  <Settings className="w-5 h-5 shrink-0" /> Store Settings
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-divider space-y-2 bg-panel">
          {business.subscriptionPlan === 'free' && (
            <div className="p-2 bg-accent-primary/5 border border-accent-primary/10 rounded-xl">
              <p className="text-[9px] text-accent-primary font-bold uppercase tracking-wider mb-0.5">Free Limit Stats</p>
              <p className="text-[10px] text-txtsecondary font-semibold">Registrations: {analytics.customersRegistered} / 5</p>
              {analytics.customersRegistered >= 5 && (
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full mt-1.5 py-1 rounded bg-accent-primary hover:opacity-90 text-white font-bold text-[8px] uppercase tracking-wider transition-all"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}
          
          {authUser.role === 'owner' && (
            <button 
              onClick={() => {
                setActiveTab('billing');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-4 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-2 border ${activeTab === 'billing' ? 'bg-[#10b981] border-[#10b981] text-white shadow-md shadow-emerald-500/10' : 'text-txtsecondary border-divider hover:bg-hover hover:text-txtprimary'}`}
            >
              <CreditCard className="w-4 h-4 shrink-0" /> Billing &amp; Plan
            </button>
          )}
          
          
          <button 
            onClick={handleInstallPWA}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/25 border border-[#10b981]/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 mb-1"
          >
            📱 Install Tolla App
          </button>

          <button 
            onClick={onLogout}
            className="w-full py-2 rounded-xl text-xs font-semibold border border-divider hover:bg-hover text-txtsecondary hover:text-txtprimary transition-all text-center flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-grow p-6 md:p-10 pb-28 md:pb-10 space-y-8 overflow-y-auto md:max-h-screen">
        
        {/* PWA INSTALL PROMOTION BANNER */}
        {showInstallBanner && (
          <div className="animate-fade-in p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-2.5 rounded-xl bg-[#10b981]/10 text-[#10b981] font-sans text-lg shrink-0">
                📱
              </div>
              <div>
                <h4 className="text-xs font-black text-txtprimary uppercase tracking-wider">Install Tolla App</h4>
                <p className="text-[11px] text-txtsecondary mt-0.5">Add to your home screen for fast counter code validations and scan lookup.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleInstallPWA}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#06b6d4] hover:opacity-90 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer transform active:scale-95"
              >
                Install Now
              </button>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="px-3 py-2 rounded-xl border border-divider hover:bg-hover text-txtsecondary text-xs transition-all cursor-pointer font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-divider">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-txtprimary">
              {activeTab === 'dashboard' && "Counter & Overview"}
              {activeTab === 'customers' && "Advocates & Tree"}
              {activeTab === 'marketing' && "Marketing Campaign Panel"}
              {activeTab === 'growth' && "Advertise and reviews"}
              {activeTab === 'settings' && "Store Settings"}
              {activeTab === 'billing' && "Billing & Plan"}
            </h2>
            <p className="text-xs text-txtsecondary mt-1">Managing Tolla for {activeLocation.name}.</p>
          </div>

          {/* Location Selector (Only for Owners) */}
          {authUser.role === 'owner' && locations.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-txtsecondary">Switch Branch:</span>
              <select 
                value={activeLocation.id}
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setActiveLocation(loc);
                }}
                className="px-3 py-1.5 rounded-lg glass-input text-xs bg-panel font-semibold"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Render Tab Contents */}

        {/* Tab 1: DASHBOARD (Overview & Redemptions) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Free Plan Progress Banner */}
            {business.subscriptionPlan === 'free' && (
              <div className="p-4 rounded-2xl bg-panel border border-divider flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary font-bold text-sm shrink-0">
                    📊
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-txtprimary">Free Plan Usage Limit</h4>
                    <p className="text-[11px] text-txtsecondary mt-0.5">
                      You have used <strong>{analytics.customersRegistered}</strong> of your <strong>5</strong> free monthly customer registrations.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Visual Progress Bar */}
                  <div className="h-2 w-32 bg-hover rounded-full overflow-hidden shrink-0 hidden sm:block">
                    <div 
                      className="h-full bg-accent-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (analytics.customersRegistered / 5) * 100)}%` }}
                    />
                  </div>
                  <button 
                    onClick={() => setActiveTab('billing')}
                    className="w-full sm:w-auto px-4 py-2 bg-accent-primary hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-brand-500/10 text-center"
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>
            )}

            {/* Upgrade Banner for Free Accounts hitting limit */}
            {business.subscriptionPlan === 'free' && analytics.customersRegistered >= 5 && (
              <div className="p-6 rounded-2xl bg-accent-amber/10 border border-accent-amber/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-accent-amber flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-accent-amber" /> Free Plan Registration Limit Reached!
                  </h3>
                  <p className="text-xs text-txtsecondary leading-relaxed max-w-xl">
                    You reached your monthly free limit of **5** customer registrations. 
                    **{analytics.registrationAttempts}** additional people attempted to scan and join this month! Upgrade now to continue converting visitors.
                  </p>
                </div>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white text-xs shadow-lg shadow-emerald-500/20 transition-all shrink-0 flex items-center gap-1.5"
                >
                  Upgrade Account R289/mo <Sparkles className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">QR Code Scans</span>
                <p className="text-3xl font-black text-txtprimary font-sans">{dynamicStats.scanners}</p>
                <span className="text-[10px] text-txtsecondary block">Customers who scanned QR</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Registered Customers</span>
                <p className="text-3xl font-black text-txtprimary font-sans">{dynamicStats.registeredCustomers}</p>
                <span className="text-[10px] text-txtsecondary block">Advocates with referral codes</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Scanners Who Share</span>
                <p className="text-3xl font-black text-txtprimary font-sans">{dynamicStats.scannersWhoShare}</p>
                <span className="text-[10px] text-txtsecondary block">Active advocates sharing links</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Shares to Visits</span>
                <p className="text-3xl font-black text-txtprimary font-sans">{dynamicStats.sharesThatBecomeVisits}</p>
                <span className="text-[10px] text-[#10b981] flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10b981]" /> Referral conversions
                </span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Cost of Rewards</span>
                <p className="text-3xl font-black text-rose-500 font-sans">R{dynamicStats.costOfRewards}</p>
                <span className="text-[10px] text-txtsecondary block">Payouts &amp; customer discounts</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">New Revenue</span>
                <p className="text-3xl font-black text-emerald-500 font-sans">R{dynamicStats.newRevenue}</p>
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Growth generated
                </span>
              </div>
            </div>

            {/* Redemption & QR Code */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Giant Redeem Discount Code Card */}
              <div className="glass-panel p-8 rounded-2xl border border-divider space-y-6">
                <div>
                  <h3 className="text-xl font-bold font-sans text-txtprimary">Validate Customer Code</h3>
                  <p className="text-xs text-txtsecondary mt-1">Type in a customer's R50 or 15% discount code when checking them out.</p>
                </div>

                {redemptionError && (
                  <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-center gap-1.5 animate-shake">
                    <AlertTriangle className="w-4.5 h-4.5 text-accent-red" /> {redemptionError}
                  </div>
                )}

                {lookupResult ? (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-xl bg-hover border border-divider text-xs space-y-3">
                      <div className="flex justify-between items-start border-b border-divider pb-2">
                        <div>
                          <p className="text-[10px] text-txtsecondary font-bold uppercase">Customer Profile</p>
                          <h4 className="text-sm font-extrabold text-txtprimary">{lookupResult.user?.name || 'Anonymous Advocate'}</h4>
                          <p className="text-[10px] text-txtsecondary font-mono mt-0.5">{lookupResult.user?.phoneNumber || lookupResult.user?.emailAddress || 'No contact info'}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-mono">
                          {lookupResult.customer?.tollaUserId}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-txtsecondary font-bold uppercase">Active Balances</p>
                        {lookupResult.wallets && lookupResult.wallets.length > 0 ? (
                          <div className="space-y-1">
                            {lookupResult.wallets.map((w: any) => (
                              <div key={w.id} className="flex justify-between items-center bg-panel p-2 rounded-lg border border-divider font-bold text-txtprimary">
                                <span className="capitalize">{w.rewardType} Wallet</span>
                                <span className="text-emerald-500 font-black">
                                  {w.rewardType === 'cash' ? `R${w.balance}` : w.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-txtsecondary font-semibold italic">No active wallet balances for this business.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] text-txtsecondary font-bold uppercase">Referrals &amp; Claim Status</p>
                        {lookupResult.vouchers && lookupResult.vouchers.length > 0 ? (
                          <div className="space-y-1">
                            {lookupResult.vouchers.map((v: any) => (
                              <div key={v.id} className="flex justify-between items-center bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-bold text-txtprimary">
                                <span>Friend Referral Claim</span>
                                <span className="text-amber-500 font-extrabold text-[10px] uppercase">{v.status}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-txtsecondary font-semibold italic">No pending referral claims to validate.</p>
                        )}
                      </div>
                    </div>

                    {/* Wallet Balance Redemption Form */}
                    {lookupResult.wallets && lookupResult.wallets.map((w: any) => {
                      if (w.rewardType === 'cash' && w.balance > 0) {
                        return (
                          <div key={w.id} className="p-3.5 bg-hover rounded-xl border border-divider space-y-2.5 animate-fade-in">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-txtsecondary font-bold uppercase">Redeem Customer Wallet Balance</span>
                              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">
                                Available: R{w.balance.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-2 text-xs text-txtsecondary font-bold">R</span>
                                <input
                                  type="number"
                                  value={amountToRedeem}
                                  onChange={(e) => setAmountToRedeem(e.target.value)}
                                  max={w.balance}
                                  placeholder="Amount to claim"
                                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-divider text-xs text-txtprimary bg-panel focus:border-[#10b981] outline-none font-semibold"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleRedeemWallet}
                                disabled={redeemLoading || !amountToRedeem || parseFloat(amountToRedeem) <= 0 || parseFloat(amountToRedeem) > w.balance}
                                className="px-3.5 py-2 rounded-lg font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white disabled:opacity-50 transition-all text-xs shrink-0 flex items-center gap-1"
                              >
                                {redeemLoading ? 'Claims...' : 'Confirm Claim'}
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}

                    <form onSubmit={handleRedemptionLookup} className="space-y-4">
                      {activeLocation?.services && activeLocation.services.length > 0 && (
                        <div className="space-y-1.5 animate-fade-in">
                          <label className="block text-xs text-txtsecondary font-bold">Catalog Product / Service</label>
                          <select
                            value={selectedCheckoutServiceId}
                            onChange={(e) => {
                              const svcId = e.target.value;
                              setSelectedCheckoutServiceId(svcId);
                              const selectedSvc = activeLocation.services.find((s: any) => s.id === svcId);
                              if (selectedSvc) {
                                const isEligible = business?.eligibleServiceIds?.includes(svcId);
                                if (isEligible) {
                                  const matches = business.friendReward.match(/(\d+)%/);
                                  const pct = matches ? parseInt(matches[1], 10) : 0;
                                  const discount = selectedSvc.price * (pct / 100);
                                  setValidationSpend(String(selectedSvc.price - discount));
                                } else {
                                  setValidationSpend(String(selectedSvc.price));
                                }
                              } else {
                                setValidationSpend('');
                              }
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                          >
                            <option value="">-- Choose Catalog Service (Optional) --</option>
                            {activeLocation.services.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name} (R{s.price})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedCheckoutServiceId && (
                        (() => {
                          const isEligible = business?.eligibleServiceIds?.includes(selectedCheckoutServiceId);
                          const selectedSvc = activeLocation?.services?.find((s: any) => s.id === selectedCheckoutServiceId);
                          if (!selectedSvc) return null;
                          const matches = business?.friendReward?.match(/(\d+)%/);
                          const pct = matches ? parseInt(matches[1], 10) : 0;
                          const discount = selectedSvc.price * (pct / 100);
                          
                          return isEligible ? (
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1 animate-fade-in font-bold font-sans">
                              <p className="flex items-center gap-1.5 text-[#10b981]">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Discount applies to this catalog service!</span>
                              </p>
                              <div className="text-[10px] text-txtsecondary font-medium pl-6 space-y-0.5 mt-1 font-sans">
                                <p>Standard Price: R{selectedSvc.price.toFixed(2)}</p>
                                <p>Campaign Discount ({pct}%): -R{discount.toFixed(2)}</p>
                                <p className="text-emerald-500 font-bold">Checkout Bill: R{(selectedSvc.price - discount).toFixed(2)}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs space-y-1 animate-fade-in font-bold font-sans">
                              <p className="flex items-center gap-1.5 text-rose-500">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Discount does not apply to this catalog service.</span>
                              </p>
                              <div className="text-[10px] text-txtsecondary font-medium pl-6 space-y-0.5 mt-1 font-sans">
                                <p>Standard Price: R{selectedSvc.price.toFixed(2)}</p>
                                <p className="text-rose-500 font-bold">Checkout Bill: R{selectedSvc.price.toFixed(2)} (Full Price)</p>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      <div className="animate-fade-in space-y-2">
                        <label className="block text-xs text-txtsecondary font-bold">Checkout Bill Spend (Rands) *</label>
                        <div className="relative">
                          <span className="absolute left-4 top-3 text-xs text-txtsecondary font-bold">R</span>
                          <input 
                            type="number" 
                            value={validationSpend} 
                            onChange={(e) => setValidationSpend(e.target.value)}
                            placeholder="e.g. 250"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                            required
                          />
                        </div>

                        {validationSpend && parseFloat(validationSpend) > 0 && (
                          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between animate-fade-in">
                            <span>Auto-Calculated Referrer Reward:</span>
                            <span className="text-sm font-black">R{getCalculatedEarnings()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2.5">
                        <button 
                          type="button"
                          onClick={() => {
                            setLookupResult(null);
                            setRedeemCode('');
                            setValidationSpend('');
                            setSelectedCheckoutServiceId('');
                          }}
                          className="flex-1 py-3.5 rounded-xl font-bold bg-hover hover:bg-divider text-txtprimary border border-divider transition-all text-xs"
                        >
                          Clear Search
                        </button>
                        <button 
                          type="submit" 
                          className="flex-1 py-3.5 rounded-xl font-extrabold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/10 transition-all text-xs flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4 stroke-[3px]" /> Complete Checkout
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <form onSubmit={handlePreviewLookup} className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-txtsecondary uppercase tracking-wider mb-2 font-bold">Discount Code or Phone Number (One of the 2)</label>
                        <input 
                          type="text" 
                          value={redeemCode} 
                          onChange={(e) => setRedeemCode(e.target.value)}
                          placeholder="e.g. 07898988980 or TR-E3FN34"
                          className="w-full px-5 py-4 rounded-2xl border-2 border-divider focus:border-[#10b981] outline-none text-xl font-mono text-center font-bold text-txtprimary bg-hover transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={lookupLoading}
                      className="w-full py-5 rounded-2xl font-extrabold bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-xl transition-all text-sm flex items-center justify-center gap-2"
                    >
                      {lookupLoading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Lookup Customer &amp; Rewards</span>
                      )}
                    </button>
                  </form>
                )}

                {redemptionResult && (
                  <div className="p-5 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 text-sm space-y-3">
                    <p className="font-extrabold text-[#10b981] flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-[#10b981]" /> Code Approved!
                    </p>
                    <div className="text-xs space-y-1.5 text-txtprimary font-semibold">
                      <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[#10b981]" /> **Friend Discount:** {redemptionResult.friendReward}</p>
                      <p className="flex items-center gap-1.5"><Award className="w-4 h-4 text-[#10b981]" /> **Referrer Payout:** {redemptionResult.referrerReward}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Giant QR Display Block */}
              <div className="glass-panel p-8 rounded-2xl border border-divider flex flex-col items-center justify-center text-center space-y-6">
                <h3 className="text-xl font-bold font-sans text-txtprimary">Customer Signup QR Code</h3>
                {activeLocation.address === 'Default Store Address, South Africa' ? (
                  <div className="flex flex-col items-center justify-center space-y-4 py-4">
                    <div className="w-16 h-16 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-txtprimary">Connect Your Business Location</p>
                      <p className="text-xs text-txtsecondary max-w-xs leading-relaxed">
                        To activate your storefront QR code, please configure your store address, WhatsApp number, and branch hours.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('growth')}
                      className="px-6 py-3 rounded-xl bg-[#10b981] hover:bg-[#0e9f6e] text-white font-bold text-xs shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" /> Configure Location Address
                    </button>
                  </div>
                ) : (
                  <>
                    <img 
                      src={activeLocation.qrCodeUrl} 
                      alt="Storefront QR Code" 
                      className="w-48 h-48 rounded-2xl border border-divider bg-white p-3 shadow-md"
                    />
                    
                    {authUser.role === 'owner' && (
                      <div className="w-full space-y-2 px-4 text-left">
                        <label className="block text-[10px] text-txtsecondary font-extrabold uppercase tracking-wider">QR Code Poster Text (Editable)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={qrPosterText}
                            onChange={(e) => setQrPosterText(e.target.value)}
                            placeholder="e.g. Scan to get 15% discount! 🎁"
                            className="flex-grow px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-bold shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await EasyRewardService.updateLocation(activeLocation.id, { qrPosterText: qrPosterText });
                                showToast('QR poster text saved successfully!', 'success');
                                // Sync state with local lists
                                setActiveLocation(prev => prev ? { ...prev, qrPosterText: qrPosterText } : null);
                                setLocations(prev => prev.map(l => l.id === activeLocation.id ? { ...l, qrPosterText: qrPosterText } : l));
                              } catch (err) {
                                console.error(err);
                                showToast('Failed to save QR poster text.', 'error');
                              }
                            }}
                            className="px-4 py-2.5 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0 transform active:scale-95"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handlePrintPoster}
                      className="w-full md:w-auto px-6 py-3 rounded-xl bg-hover hover:bg-divider text-txtprimary border border-divider font-bold text-xs transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <ExternalLink className="w-4 h-4" /> Print A4 Poster (PDF)
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Pending Referrals Approvals Queue */}
            {referrals.filter(r => r.status === 'pending_approval' && r.locationId === activeLocation.id).length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-4 bg-panel/40 animate-fade-in">
                <div className="flex justify-between items-center border-b border-divider pb-3">
                  <div>
                    <h3 className="text-base font-bold text-txtprimary flex items-center gap-2 font-sans">
                      <Clock className="w-5 h-5 text-accent-amber animate-pulse" /> Pending Referrals Approval Queue
                    </h3>
                    <p className="text-xs text-txtsecondary mt-0.5">Please review and approve or reject checkout discount requests.</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-xs font-bold font-mono">
                    {referrals.filter(r => r.status === 'pending_approval' && r.locationId === activeLocation.id).length} Pending
                  </span>
                </div>

                <div className="divide-y divide-divider">
                  {referrals.filter(r => r.status === 'pending_approval' && r.locationId === activeLocation.id).map(ref => {
                    const advocate = customers.find(c => c.id === ref.referrerId);
                    return (
                      <div key={ref.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-txtprimary">
                            Discount Code: <span className="font-mono text-[#10b981] font-extrabold">{ref.discountCode}</span>
                          </p>
                          <div className="text-xs text-txtsecondary space-y-1 mt-1 font-medium">
                            <p className="flex items-center gap-1.5">• Friend's Phone: <span className="font-bold text-txtprimary">{ref.refereePhone || 'Walk-in'}</span></p>
                            {ref.refereeIdentifier && (
                              <p className="flex items-center gap-1.5">• {business.customIdentifierLabel || 'Identifier'}: <span className="font-bold text-txtprimary">{ref.refereeIdentifier}</span></p>
                            )}
                            {advocate && (
                              <p className="flex items-center gap-1.5">• Advocate Ref: <span className="font-bold text-txtprimary">{advocate.phoneNumber}</span></p>
                            )}
                            {ref.verificationNotes && (
                              <div className="text-accent-amber font-semibold flex items-start gap-1.5 mt-2 bg-accent-amber/5 px-3 py-1.5 rounded-xl border border-accent-amber/10 max-w-md">
                                <AlertTriangle className="w-4 h-4 text-accent-amber shrink-0 mt-0.5" />
                                <span className="text-[10px] leading-relaxed">Alert Flags: {ref.verificationNotes}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleRejectReferral(ref.id)}
                            className="px-4 py-2 bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/25 rounded-xl text-xs font-bold transition-all"
                          >
                            ❌ Reject
                          </button>
                          <button
                            onClick={() => handleApproveReferral(ref.id)}
                            className="px-4 py-2 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                          >
                            ✅ Approve
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storefront Activity Feed */}
            <div className="glass-panel p-6 rounded-2xl border border-divider space-y-6">
              <div>
                <h3 className="text-base font-bold font-sans text-txtprimary">Recent Storefront Activity</h3>
                <p className="text-xs text-txtsecondary mt-1">Real-time log of customer signups, reviews, and claimed discount visits.</p>
              </div>

              <div className="space-y-4">
                {(showAllActivity ? getActivityFeed() : getActivityFeed().slice(0, 4)).map(feedItem => (
                  <div key={feedItem.id} className="p-4 rounded-xl bg-hover border border-divider flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-panel border border-divider flex items-center justify-center text-txtsecondary shrink-0">
                        {feedItem.icon === 'user' && <Users className="w-5 h-5 text-accent-primary" />}
                        {feedItem.icon === 'gift' && <Award className="w-5 h-5 text-[#10b981]" />}
                        {feedItem.icon === 'star' && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-txtprimary leading-relaxed">{feedItem.text}</p>
                          {feedItem.warnings && (
                            <span 
                              title={`Suspicious Activity: ${feedItem.warnings}`}
                              className="px-2 py-0.5 rounded bg-accent-amber/10 border border-accent-amber/25 text-accent-amber text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-help shrink-0"
                            >
                              <AlertTriangle className="w-3 h-3" /> Review recommended
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-txtsecondary block mt-0.5">
                          {feedItem.time.toLocaleDateString()} at {feedItem.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {getActivityFeed().length === 0 && (
                  <p className="text-center py-8 text-txtsecondary italic text-sm">No activity recorded yet today.</p>
                )}
                {getActivityFeed().length > 4 && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllActivity(!showAllActivity)}
                      className="px-5 py-2.5 rounded-xl bg-hover border border-divider text-xs font-bold text-txtprimary hover:bg-divider transition-all"
                    >
                      {showAllActivity ? 'Show Less Activity' : `View More Activity (${getActivityFeed().length - 4} items)`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Simple Performance Trend line chart */}
            <div className="glass-panel p-6 rounded-2xl border border-divider">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-txtprimary">Weekly Visitor Traffic</h4>
                <p className="text-[11px] text-txtsecondary mt-0.5">Scans vs customer referral views over the last week.</p>
              </div>
              <div className="h-56 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--divider)', color: 'var(--text-primary)', borderRadius: '12px' }} />
                    <Legend iconType="circle" />
                    <Area type="monotone" name="Referral Page Views" dataKey="PageViews" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                    <Area type="monotone" name="QR Code Scans" dataKey="Scans" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: CUSTOMERS & CONNECTIONS */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            
            {/* Top Sub-toggles */}
            <div className="flex border-b border-divider gap-4 pb-0.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button 
                onClick={() => setCustomersSubTab('list')}
                className={`pb-3 text-xs font-bold transition-all relative ${customersSubTab === 'list' ? 'text-[#10b981]' : 'text-txtsecondary hover:text-txtprimary'}`}
              >
                Customer Registry ({customers.filter(c => c.locationId === activeLocation.id).length})
                {customersSubTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981] rounded-full" />}
              </button>
              <button 
                onClick={() => setCustomersSubTab('networks')}
                className={`pb-3 text-xs font-bold transition-all relative ${customersSubTab === 'networks' ? 'text-[#10b981]' : 'text-txtsecondary hover:text-txtprimary'}`}
              >
                Customer Networks
                {customersSubTab === 'networks' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981] rounded-full" />}
              </button>
              <button 
                onClick={() => setCustomersSubTab('referrals')}
                className={`pb-3 text-xs font-bold transition-all relative ${customersSubTab === 'referrals' ? 'text-[#10b981]' : 'text-txtsecondary hover:text-txtprimary'}`}
              >
                Friend Redemptions ({referrals.filter(r => r.locationId === activeLocation.id).length})
                {customersSubTab === 'referrals' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981] rounded-full" />}
              </button>
              {authUser.role === 'owner' && (
                <button 
                  onClick={() => setCustomersSubTab('analytics')}
                  className={`pb-3 text-xs font-bold transition-all relative ${customersSubTab === 'analytics' ? 'text-[#10b981]' : 'text-txtsecondary hover:text-txtprimary'}`}
                >
                  Referral Analytics
                  {customersSubTab === 'analytics' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981] rounded-full" />}
                </button>
              )}
            </div>

            {/* Subtab 1: Customers list */}
            {customersSubTab === 'list' && (
              <div className="glass-panel rounded-2xl border border-divider overflow-hidden">
                <div className="p-6 border-b border-divider flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-bold font-sans text-txtprimary">Sharing Customers</h3>
                    <p className="text-xs text-txtsecondary mt-1">Customers who scanned the storefront QR code and are actively sharing.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (business.subscriptionPlan === 'free') {
                        showToast('CSV Export is disabled on the Free Plan. Upgrade to a premium tier to download your customers database.', 'warning');
                      } else {
                        showToast('Audit Log Created: Customer contact registry successfully compiled and downloaded.', 'success');
                      }
                    }}
                    className="px-4 py-2.5 bg-hover hover:bg-divider border border-divider text-txtprimary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Customers CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-txtprimary">
                    <thead className="bg-hover uppercase text-[10px] tracking-wider text-txtsecondary border-b border-divider">
                      <tr>
                        <th className="p-4">Customer Contact</th>
                        <th className="p-4">POPIA Marketing Consent</th>
                        <th className="p-4">Tolla ID</th>
                        <th className="p-4">Identifier Field</th>
                        <th className="p-4">Activity Logs</th>
                        <th className="p-4 text-center">Referrals (PV)</th>
                        <th className="p-4 text-center">Referral Score</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider font-semibold text-xs">
                      {customers.filter(c => c.locationId === activeLocation.id).map(cust => {
                        // Look up universal user profile
                        const relatedUser = tollaUsers.find(u => u.id === cust.tollaUserId);
                        
                        const custReferrals = referrals.filter(r => r.customerBusinessId === cust.id);
                        const redemptions = custReferrals.filter(r => r.status === 'redeemed').length;
                        const pvPoints = redemptions * 1000;

                        // Contact Masking Helpers
                        const maskPhone = (phone?: string) => {
                          if (!phone) return '';
                          const clean = phone.trim();
                          if (clean.length < 8) return clean;
                          return `${clean.substring(0, 6)} *** **${clean.substring(clean.length - 2)}`;
                        };

                        const maskEmail = (email?: string) => {
                          if (!email) return '';
                          const clean = email.trim();
                          const parts = clean.split('@');
                          if (parts.length !== 2) return clean;
                          const local = parts[0];
                          const domain = parts[1];
                          const maskedLocal = local.length <= 2 ? `${local.substring(0, 1)}***` : `${local.substring(0, 2)}***`;
                          return `${maskedLocal}@${domain}`;
                        };

                        const contactLabel = relatedUser ? (relatedUser.phoneNumber || relatedUser.emailAddress || "[POPIA Deleted]") : "[POPIA Deleted]";
                        const maskedPhoneVal = maskPhone(relatedUser?.phoneNumber);
                        const maskedEmailVal = maskEmail(relatedUser?.emailAddress);

                        return (
                          <tr key={cust.id} className="hover:bg-hover/30">
                            <td className="p-4">
                              <div className="flex flex-col space-y-0.5">
                                {relatedUser?.name && (
                                  <span className="font-bold text-txtprimary block">{relatedUser.name}</span>
                                )}
                                {relatedUser?.phoneNumber && (
                                  <span className="font-extrabold text-txtprimary">{maskedPhoneVal}</span>
                                )}
                                {relatedUser?.emailAddress && (
                                  <span className="text-[10px] text-txtsecondary">{maskedEmailVal}</span>
                                )}
                                {!relatedUser && (
                                  <span className="text-red-500 font-bold italic">[POPIA Deleted]</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              {relatedUser?.marketingConsent ? (
                                <div className="flex flex-col space-y-0.5">
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 font-black uppercase tracking-wide w-fit">
                                    Opted In ✓
                                  </span>
                                  {relatedUser.consentTimestamp && (
                                    <span className="text-[9px] text-txtsecondary block">
                                      {new Date(relatedUser.consentTimestamp).toLocaleDateString()} @ {relatedUser.consentIp || "127.0.0.1"}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-divider text-txtsecondary font-bold uppercase w-fit">
                                  No Consent
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-mono text-rose-500 font-extrabold">{cust.tollaUserId}</td>
                            <td className="p-4 text-txtsecondary">{cust.customIdentifier || '—'}</td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleOpenTimeline(cust)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/25 border border-[#10b981]/25 text-[#10b981] text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                View Timeline
                              </button>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-extrabold text-txtprimary">{redemptions}</span>
                                <span className="text-[9px] text-[#10b981] font-black">{pvPoints} PV</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border whitespace-nowrap inline-flex items-center gap-1.5 ${
                                cust.referralScore >= 80 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : cust.referralScore >= 50
                                  ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'
                                  : 'bg-txtsecondary/10 border-divider text-txtsecondary'
                              }`}>
                                <span>{cust.referralScore}/100</span>
                                <span className="opacity-30">•</span>
                                <span>{cust.referralScore >= 80 ? 'VIP' : (cust.referralScore >= 50 ? 'Active' : 'Member')}</span>
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Marketing Delivery Action Buttons */}
                                <button
                                  onClick={() => showToast(`Opening WhatsApp Broadcast Composer for ${relatedUser?.name || 'Customer'}...`, 'info')}
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 border border-divider hover:border-emerald-500/30 text-txtsecondary hover:text-emerald-500 transition-all cursor-pointer"
                                  title="Send WhatsApp Campaign"
                                >
                                  📲
                                </button>
                                <button
                                  onClick={() => showToast(`Opening Email Broadcast Composer for ${relatedUser?.name || 'Customer'}...`, 'info')}
                                  className="p-1.5 rounded-lg hover:bg-blue-500/10 border border-divider hover:border-blue-500/30 text-txtsecondary hover:text-blue-500 transition-all cursor-pointer"
                                  title="Send Email Campaign"
                                >
                                  ✉️
                                </button>
                                <button
                                  onClick={() => showToast(`Birthday Promo voucher code generated and queued for delivery.`, 'success')}
                                  className="p-1.5 rounded-lg hover:bg-amber-500/10 border border-divider hover:border-amber-500/30 text-txtsecondary hover:text-amber-500 transition-all cursor-pointer"
                                  title="Send Birthday Reward"
                                >
                                  🎁
                                </button>

                                <a 
                                  href={`/r/${cust.tollaUserId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-hover border border-divider text-[10px] font-bold text-txtprimary hover:bg-divider inline-flex items-center gap-0.5 transition-all"
                                  title="Open Customer Sharing Link"
                                >
                                  Link <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <button
                                  onClick={() => handleDeleteCustomer(cust.id, contactLabel)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 border border-divider hover:border-red-500/30 text-txtsecondary hover:text-red-500 transition-all cursor-pointer"
                                  title="Delete Customer Profile & Scrub PII (POPIA Compliance)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {customers.filter(c => c.locationId === activeLocation.id).length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-txtsecondary italic text-xs">
                            No customers registered in this branch database yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subtab 2: Referrals */}
            {customersSubTab === 'referrals' && (
              <div className="glass-panel rounded-2xl border border-divider overflow-hidden">
                <div className="p-6 border-b border-divider">
                  <h3 className="text-base font-bold font-sans text-txtprimary">Redemption History</h3>
                  <p className="text-xs text-txtsecondary mt-1">Log of friend redemptions and referrer payouts.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-txtprimary">
                    <thead className="bg-hover uppercase text-[10px] tracking-wider text-txtsecondary border-b border-divider">
                      <tr>
                        <th className="p-4">Advocate Code</th>
                        <th className="p-4">Referee Client</th>
                        <th className="p-4">Redemption Date</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {referrals.filter(r => r.locationId === activeLocation.id).map(ref => (
                        <tr key={ref.id} className="hover:bg-hover/50">
                          <td className="p-4 font-mono font-bold text-txtprimary">{ref.discountCode}</td>
                          <td className="p-4">
                            <div className="font-bold text-txtprimary">{ref.refereePhone || 'Walk-in'}</div>
                            {ref.refereeIdentifier && (
                              <div className="text-[10px] text-txtsecondary mt-0.5 font-semibold">
                                {business.customIdentifierLabel || 'Identifier'}: {ref.refereeIdentifier}
                              </div>
                            )}
                            {ref.verificationNotes && (
                              <span 
                                title={`Suspicious: ${ref.verificationNotes}`}
                                className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-accent-amber/10 border border-accent-amber/25 text-accent-amber text-[9px] font-bold uppercase tracking-wider cursor-help"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> Review recommended
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-txtsecondary">
                            {ref.redeemedAt ? new Date(ref.redeemedAt).toLocaleString() : '—'}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              ref.status === 'redeemed' 
                                ? 'bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981]' 
                                : ref.status === 'rejected'
                                ? 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
                                : 'bg-accent-amber/10 border border-accent-amber/20 text-accent-amber'
                            }`}>
                              {ref.status === 'pending_approval' ? 'Pending Approval' : ref.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {referrals.filter(r => r.locationId === activeLocation.id).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-txtsecondary italic">No redemptions logged yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subtab 3: Customer Networks (Expandable list directory) */}
            {customersSubTab === 'networks' && (
              <div className="glass-panel p-6 rounded-2xl border border-divider">
                <div className="mb-6">
                  <h3 className="text-base font-bold font-sans text-txtprimary">Customer Referral Networks</h3>
                  <p className="text-xs text-txtsecondary mt-1">Trace direct first-party referral connections and see customer invite cascades.</p>
                </div>
                <ReferralTree 
                  customers={customers.filter(c => c.locationId === activeLocation.id)}
                  referrals={referrals.filter(r => r.locationId === activeLocation.id)}
                  referrerReward={business.referrerReward}
                  onRefresh={loadData}
                />
              </div>
            )}

            {/* Subtab 4: Referral Analytics (Marketing Insights) */}
            {customersSubTab === 'analytics' && authUser.role === 'owner' && (() => {
              // Calculate Analytics data
              const topAmbassadors = customers.map(cust => {
                const custRefs = referrals.filter(r => r.referrerId === cust.id);
                const successful = custRefs.filter(r => r.status === 'redeemed');
                const spend = successful.reduce((sum, r) => sum + (r.spendAmount || 0), 0);
                return {
                  customer: cust,
                  invites: custRefs.length,
                  successful: successful.length,
                  spend
                };
              }).sort((a, b) => b.successful - a.successful).slice(0, 5);

              const conversionLeakage = customers.map(cust => {
                const custRefs = referrals.filter(r => r.referrerId === cust.id);
                const unredeemed = custRefs.filter(r => r.status !== 'redeemed').length;
                return {
                  customer: cust,
                  totalInvited: custRefs.length,
                  unredeemed
                };
              }).filter(x => x.unredeemed > 0 && x.totalInvited >= 1)
                .sort((a, b) => b.unredeemed - a.unredeemed).slice(0, 5);

              const branchPerformance = locations.map(loc => {
                const locCustomers = customers.filter(c => c.locationId === loc.id);
                const locRefs = referrals.filter(r => r.locationId === loc.id && r.status === 'redeemed');
                const spend = locRefs.reduce((sum, r) => sum + (r.spendAmount || 0), 0);
                return {
                  location: loc,
                  members: locCustomers.length,
                  visits: locRefs.length,
                  spend
                };
              }).sort((a, b) => b.spend - a.spend);

              return (
                <div className="space-y-6">
                  {/* Row 1: Insights & Opportunities */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Ambassadors Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-divider space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-txtprimary">Top 5 Brand Ambassadors</h4>
                        <p className="text-[11px] text-txtsecondary mt-0.5">Customers who generated the most successful visits.</p>
                      </div>
                      <div className="space-y-3">
                        {topAmbassadors.map((amb, idx) => {
                          const contact = amb.customer.phoneNumber || amb.customer.emailAddress || "[POPIA Deleted]";
                          return (
                            <div key={amb.customer.id} className="flex items-center justify-between p-3 rounded-xl bg-hover border border-divider">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-[#10b981]">#{idx + 1}</span>
                                <div className="text-xs font-semibold text-txtprimary">{contact}</div>
                              </div>
                              <div className="text-right text-[10px] font-bold">
                                <span className="text-txtprimary">{amb.successful} visits</span>
                                <span className="text-[#10b981] block">R{amb.spend} spent</span>
                              </div>
                            </div>
                          );
                        })}
                        {topAmbassadors.length === 0 && (
                          <p className="text-xs text-txtsecondary italic py-4 text-center">No referral data logged yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Conversion Leakage Card */}
                    <div className="glass-panel p-6 rounded-2xl border border-divider space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-txtprimary">Conversion Leakage (Unredeemed Invites)</h4>
                        <p className="text-[11px] text-txtsecondary mt-0.5">Ambassadors whose friends haven't redeemed yet (Target for marketing nudges!).</p>
                      </div>
                      <div className="space-y-3">
                        {conversionLeakage.map((leak) => {
                          const contact = leak.customer.phoneNumber || leak.customer.emailAddress || "[POPIA Deleted]";
                          return (
                            <div key={leak.customer.id} className="flex items-center justify-between p-3 rounded-xl bg-hover border border-divider">
                              <div className="text-xs font-semibold text-txtprimary">{contact}</div>
                              <div className="text-right text-[10px] font-bold text-txtsecondary">
                                <span className="text-rose-500 font-extrabold">{leak.unredeemed} unredeemed</span>
                                <span className="block text-[9px] font-medium mt-0.5">out of {leak.totalInvited} total invites</span>
                              </div>
                            </div>
                          );
                        })}
                        {conversionLeakage.length === 0 && (
                          <p className="text-xs text-txtsecondary italic py-4 text-center">All invited friends have successfully visited! 100% conversion.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Branch Performance Rankings */}
                  <div className="glass-panel rounded-2xl border border-divider overflow-hidden">
                    <div className="p-6 border-b border-divider">
                      <h4 className="text-sm font-bold text-txtprimary">Branch Performance & Attributed Revenue</h4>
                      <p className="text-[11px] text-txtsecondary mt-0.5">Breakdown of customer database size and customer spend generated per branch location.</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-txtprimary">
                        <thead className="bg-hover uppercase text-[10px] tracking-wider text-txtsecondary border-b border-divider">
                          <tr>
                            <th className="p-4">Branch Location</th>
                            <th className="p-4 text-center">Database Size</th>
                            <th className="p-4 text-center">Successful Referrals</th>
                            <th className="p-4 text-right">Revenue Generated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-divider font-semibold">
                          {branchPerformance.map((item) => (
                            <tr key={item.location.id} className="hover:bg-hover/30">
                              <td className="p-4 font-bold text-txtprimary">{item.location.name}</td>
                              <td className="p-4 text-center text-txtsecondary">{item.members} customer(s)</td>
                              <td className="p-4 text-center text-txtprimary">{item.visits} visit(s)</td>
                              <td className="p-4 text-right text-emerald-500 font-extrabold">R{item.spend}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Tab: MARKETING AUTOMATION */}
        {activeTab === 'marketing' && authUser.role === 'owner' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top overview metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Marketing Audience</span>
                <p className="text-3xl font-black text-txtprimary font-sans">{customers.filter(c => c.locationId === activeLocation.id).length} Subscriber(s)</p>
                <p className="text-xs text-txtsecondary">Opted-in profiles ready for broadcasts</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">WhatsApp Channels</span>
                <p className="text-3xl font-black text-txtsecondary font-sans">0 Active</p>
                <p className="text-xs text-txtsecondary">Pending API connection</p>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-2">
                <span className="text-[10px] uppercase font-bold text-txtsecondary tracking-wider block">Email Channels</span>
                <p className="text-3xl font-black text-txtsecondary font-sans">0 Active</p>
                <p className="text-xs text-txtsecondary">SMTP relay configuration</p>
              </div>
            </div>

            {/* Main Coming Soon Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-divider bg-gradient-to-br from-panel via-panel to-[#10b981]/5 p-8 md:p-12 text-center shadow-xl space-y-6">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="relative z-10 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-[#06b6d4] text-slate-950 flex items-center justify-center mx-auto text-2xl shadow-lg">
                  🚀
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-txtprimary tracking-tight uppercase">Email &amp; WhatsApp Marketing</h3>
                <p className="text-xs md:text-sm text-txtsecondary leading-relaxed font-semibold">
                  Send targeted bulk broadcasts and trigger automated customer birthday discount coupons. Build referral loyalty flows directly via SMS, WhatsApp and Email.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Coming Soon
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => showToast('You will be notified as soon as marketing tools are live!', 'success')}
                    className="px-6 py-4 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/10 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Notify Me When Ready <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="px-6 py-4 rounded-xl font-bold border border-divider bg-panel hover:bg-hover text-txtprimary text-xs transition-all cursor-pointer"
                  >
                    Back to Counter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: CATALOG, ADVISE & REVIEWS */}
        {activeTab === 'growth' && authUser.role === 'owner' && (
          <div className="space-y-12">
            
            {/* Section 1: Specials & Deals */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-txtprimary">Active Specials & Deals</h3>
                  <p className="text-sm text-txtsecondary mt-1">Select which active discount or promo is shown on customer share links.</p>
                </div>
                <button 
                  onClick={() => setShowPromoModal(true)}
                  className="px-5 py-3 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5 stroke-[2.5px]" /> Create New Special Deal
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {promotions.map(promo => {
                  const isActive = activeLocation.currentPromotionId === promo.id;
                  return (
                    <div key={promo.id} className={`glass-panel rounded-2xl overflow-hidden border-2 transition-all ${isActive ? 'border-[#10b981] shadow-lg shadow-emerald-500/5' : 'border-divider'}`}>
                      {promo.imageUrl && (
                        <img src={promo.imageUrl} alt={promo.title} className="w-full h-44 object-cover" />
                      )}
                      <div className="p-6 space-y-4">
                        <div>
                          <h4 className="text-lg font-bold text-txtprimary">{promo.title}</h4>
                          <p className="text-sm text-txtsecondary mt-1 leading-relaxed">{promo.description}</p>
                        </div>

                        {/* Promo Linker to Services */}
                        <div className="border-t border-divider pt-4 space-y-2">
                          <p className="text-[10px] font-bold text-txtprimary uppercase tracking-wider">Link Promo to Services:</p>
                          {activeLocation.services && activeLocation.services.length > 0 ? (
                            <div className="space-y-1.5">
                              {activeLocation.services.map(svc => {
                                const isLinked = svc.applicablePromoIds.includes(promo.id);
                                const calc = calculateDiscount(svc.price, promo);
                                return (
                                  <div key={svc.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-hover border border-divider">
                                    <div>
                                      <p className="font-bold text-txtprimary">{svc.name}</p>
                                      <p className="text-[10px] text-txtsecondary">
                                        {isLinked ? (
                                          <span>
                                            <span className="line-through mr-1 text-txtsecondary">R{svc.price}</span> 
                                            <span className="text-[#10b981] font-bold">R{calc.discounted.toFixed(0)}</span>
                                          </span>
                                        ) : (
                                          <span>Base: R{svc.price}</span>
                                        )}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePromoForService(svc.id, promo.id)}
                                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${isLinked ? 'bg-[#10b981] text-white shadow-sm' : 'bg-panel border border-divider text-txtsecondary hover:text-txtprimary'}`}
                                    >
                                      {isLinked ? 'Linked' : 'Link Deal'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-txtsecondary italic">No storefront services added yet. Add some in settings!</p>
                          )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-xs text-txtsecondary">
                            Created: {new Date(promo.createdAt).toLocaleDateString()}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeletePromotion(promo.id)}
                              className="p-2.5 rounded-xl border border-divider hover:border-rose-500/35 hover:bg-rose-500/10 text-txtsecondary hover:text-rose-500 transition-all cursor-pointer"
                              title="Delete Special Deal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {isActive ? (
                              <button 
                                onClick={() => handleSetPromoForLocation(undefined)}
                                className="px-4 py-2.5 rounded-xl bg-[#10b981] text-white text-xs font-bold transition-all uppercase tracking-wider"
                              >
                                Active Now
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleSetPromoForLocation(promo.id)}
                                className="px-4 py-2.5 rounded-xl bg-hover border-2 border-divider text-txtprimary hover:bg-divider text-xs font-bold transition-all"
                              >
                                Show on Page
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="border-divider" />

            {/* Section 2: Service Catalog Menu */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-txtprimary">My Store Service Catalog</h3>
                <p className="text-sm text-txtsecondary mt-1">List the services or products you sell. These will automatically appear on your customer sharing pages!</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Current Services List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-txtprimary uppercase tracking-wider font-sans">Active Services List</h4>
                  <div className="space-y-3">
                    {activeLocation.services && activeLocation.services.length > 0 ? (
                      (showAllServices ? activeLocation.services : activeLocation.services.slice(0, 4)).map(svc => {
                        const isEditing = editingServiceId === svc.id;
                        return (
                          <div key={svc.id} className="glass-panel p-4 rounded-2xl border border-divider flex flex-col gap-3 bg-panel">
                            {isEditing ? (
                              <div className="space-y-3 w-full">
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-txtsecondary font-semibold uppercase">Edit Service Name</label>
                                  <input 
                                    type="text" 
                                    value={editServiceName} 
                                    onChange={(e) => setEditServiceName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-txtsecondary font-semibold uppercase">Edit Price (Rands)</label>
                                  <input 
                                    type="number" 
                                    value={editServicePrice} 
                                    onChange={(e) => setEditServicePrice(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                                    required
                                  />
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingServiceId(null)}
                                    className="px-3.5 py-2 bg-hover hover:bg-divider border border-divider text-txtsecondary rounded-xl text-xs font-bold transition-all"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditService(svc.id)}
                                    className="px-4 py-2 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={svc.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop&q=80'} 
                                    alt={svc.name} 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop&q=80';
                                    }}
                                    className="w-12 h-12 rounded-xl object-cover border border-divider"
                                  />
                                  <div>
                                    <p className="font-bold text-txtprimary text-sm">{svc.name}</p>
                                    <p className="text-xs text-[#10b981] font-bold">Base Price: R{svc.price}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditService(svc)}
                                    className="px-3 py-2 bg-hover hover:bg-divider border border-divider text-txtsecondary hover:text-txtprimary rounded-xl text-xs font-bold transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteService(svc.id)}
                                    className="px-3 py-2 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red border border-accent-red/20 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-txtsecondary italic py-6 text-center border border-dashed border-divider rounded-2xl">
                        No catalog items created. Use the form to list your first service!
                      </p>
                    )}
                    {activeLocation.services && activeLocation.services.length > 4 && (
                      <div className="flex justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAllServices(!showAllServices)}
                          className="px-5 py-2.5 rounded-xl bg-hover border border-divider text-xs font-bold text-txtprimary hover:bg-divider transition-all"
                        >
                          {showAllServices ? 'Show Less Services' : `View More Services (${activeLocation.services.length - 4} items)`}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Service Form */}
                <div className="glass-panel p-6 rounded-2xl border border-divider space-y-4 bg-panel">
                  <h4 className="text-sm font-bold text-txtprimary uppercase tracking-wider font-sans">Add Service to Menu</h4>
                  <form onSubmit={handleAddService} className="space-y-4">
                    <div>
                      <label className="block text-xs text-txtsecondary mb-1 font-semibold">Service Name</label>
                      <input 
                        type="text" 
                        value={newServiceName} 
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Hair Styling or Full Car Wash"
                        className="w-full px-4 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-txtsecondary mb-1 font-semibold">Base Price (Rands)</label>
                      <input 
                        type="number" 
                        value={newServicePrice} 
                        onChange={(e) => setNewServicePrice(e.target.value)}
                        placeholder="e.g. 450"
                        className="w-full px-4 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs text-txtsecondary font-semibold">Service Image (File Upload or Presets)</label>
                      
                      {/* Drag and Drop Container */}
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('service-img-file-tab3')?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden ${
                          isDragging ? 'border-[#10b981] bg-[#10b981]/5' : 'border-divider hover:border-[#10b981]/60 bg-hover'
                        }`}
                      >
                        <input 
                          id="service-img-file-tab3"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        {newServiceImage && !imageError ? (
                          <div className="w-full h-full absolute inset-0 group">
                            <img 
                              src={newServiceImage} 
                              alt="Uploaded Preview" 
                              className="w-full h-full object-cover"
                              onError={() => setImageError(true)}
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <span className="text-white text-xs font-bold bg-[#10b981] px-3 py-1.5 rounded-xl shadow">Change Image</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewServiceImage('');
                                }}
                                className="text-white text-xs font-bold bg-accent-red px-3 py-1.5 rounded-xl shadow animate-slide-in"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : newServiceImage && imageError ? (
                          <div className="space-y-2 p-4 text-center">
                            <AlertTriangle className="w-6 h-6 text-accent-amber mx-auto" />
                            <p className="text-xs font-bold text-txtprimary">Image Link Broken / Load Failed</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewServiceImage('');
                              }}
                              className="text-[10px] bg-accent-red/20 text-accent-red px-2.5 py-1 rounded-lg border border-accent-red/25"
                            >
                              Reset Image
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center">
                            <Upload className="w-6 h-6 text-txtsecondary" />
                            <p className="text-xs font-bold text-txtprimary">Drag & drop photo here</p>
                            <p className="text-[10px] text-txtsecondary">or click to browse local files (max 1.5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Images */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-txtsecondary uppercase font-bold">Or click a demo preset photo:</p>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewServiceImage("https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300")}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold ${newServiceImage.includes('562322140') ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                        >
                          💇‍♀️ Hair
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewServiceImage("https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=300")}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold ${newServiceImage.includes('152034035') ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                        >
                          🚗 Wash
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewServiceImage("https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300")}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold ${newServiceImage.includes('1509042239') ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                        >
                          ☕ Cafe
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewServiceImage("https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300")}
                          className={`p-1.5 rounded-lg border text-[10px] font-bold ${newServiceImage.includes('1540555700') ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                        >
                          💆‍♀️ Spa
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                    >
                      Add Service to Menu
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <hr className="border-divider" />

            {/* Section 2: Customer Reviews */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-txtprimary">Customer Reviews</h3>
                <p className="text-sm text-txtsecondary mt-1">
                  Approve customer feedback stars to show them live on your referral links. 
                  {business.subscriptionPlan === 'free' && ' (Free plan limit: max 2 live reviews).'}
                </p>
              </div>

              <div className="space-y-4">
                {(showAllReviews ? reviews : reviews.slice(0, 3)).map(rev => (
                  <div key={rev.id} className="glass-panel p-6 rounded-2xl border border-divider flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-txtprimary text-base">{rev.customerName}</span>
                        {renderStars(rev.rating)}
                      </div>
                      {rev.comment && <p className="text-sm text-txtsecondary leading-relaxed italic">"{rev.comment}"</p>}
                      <span className="text-xs text-txtsecondary block">Date: {new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="shrink-0">
                      <button 
                        onClick={() => handleApproveReview(rev.id, rev.isApproved)}
                        className={`px-5 py-3 rounded-xl text-xs font-bold transition-all ${rev.isApproved ? 'bg-[#10b981]/15 border-2 border-[#10b981]/30 text-[#10b981]' : 'bg-hover border-2 border-divider text-txtprimary hover:bg-divider'}`}
                      >
                        {rev.isApproved ? 'Live on Page' : 'Approve & Show'}
                      </button>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center py-12 text-txtsecondary italic text-sm glass-panel rounded-2xl border border-divider">
                    No customer reviews submitted yet.
                  </p>
                )}
                {reviews.length > 3 && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="px-5 py-2.5 rounded-xl bg-hover border border-divider text-xs font-bold text-txtprimary hover:bg-divider transition-all"
                    >
                      {showAllReviews ? 'Show Less Reviews' : `View More Reviews (${reviews.length - 3} items)`}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: SETTINGS & BILLING */}
        {activeTab === 'settings' && authUser.role === 'owner' && (
          <div className="space-y-12">
            
            {/* Section 1: Reward Configurations */}
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-xl font-bold text-txtprimary">Configure Program Rewards</h3>
                <p className="text-sm text-txtsecondary mt-1">Configure rewards for referrers and friends. Changes instantly sync to all share links.</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-divider space-y-6">
                <form onSubmit={handleUpdateSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm text-txtprimary font-bold mb-1.5">Business Name</label>
                    <input 
                      type="text" 
                      value={bizName} 
                      onChange={(e) => setBizName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-divider text-sm text-txtprimary focus:border-[#10b981] outline-none bg-hover font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-txtprimary font-bold mb-1.5 font-sans">Business Logo / Image</label>
                    <input 
                      id="logo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileInput}
                      className="hidden"
                    />
                    {bizLogoUrl ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-divider bg-hover">
                        <div className="w-16 h-16 rounded-xl border border-divider overflow-hidden bg-panel flex items-center justify-center shrink-0">
                          <img src={bizLogoUrl} alt="Business Logo Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-txtprimary font-sans">Active storefront image loaded</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('logo-file-input')?.click()}
                              className="px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/25 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Change Image
                            </button>
                            <button
                              type="button"
                              onClick={() => setBizLogoUrl('')}
                              className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/25 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDraggingLogo(true); }}
                        onDragLeave={() => setIsDraggingLogo(false)}
                        onDrop={handleLogoDrop}
                        onClick={() => document.getElementById('logo-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                          isDraggingLogo
                            ? 'border-[#10b981] bg-[#10b981]/10'
                            : 'border-divider hover:border-[#10b981]/50 hover:bg-hover/50'
                        }`}
                      >
                        <Upload className="w-5 h-5 text-txtsecondary mx-auto mb-2" />
                        <p className="text-xs text-txtsecondary font-semibold">Drag & drop your logo here, or <span className="text-[#10b981]">click to browse</span></p>
                        <p className="text-[10px] text-txtsecondary mt-0.5 font-medium">PNG, JPG, WEBP or SVG up to 5MB. If you don't have a logo, upload any storefront picture.</p>
                      </div>
                    )}
                  </div>

                  {/* Referrer Reward Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm text-txtprimary font-bold">Referrer Customer Reward Payout</label>
                    
                    {/* Tabs */}
                    <div className="flex border border-divider rounded-xl overflow-hidden bg-hover">
                      <button
                        type="button"
                        onClick={() => {
                          setReferrerRewardType('cash');
                          setReferrerReward('R50 discount on checkout');
                        }}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${referrerRewardType === 'cash' ? 'bg-[#10b981] text-white' : 'text-txtsecondary hover:text-txtprimary'}`}
                      >
                        💰 Cash Discount
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReferrerRewardType('percent');
                          setReferrerReward('2% of every sale value');
                        }}
                        className={`flex-1 py-2 text-xs font-bold transition-all ${referrerRewardType === 'percent' ? 'bg-[#10b981] text-white' : 'text-txtsecondary hover:text-txtprimary'}`}
                      >
                        🏷️ Percentage %
                      </button>
                    </div>

                    {/* Preset buttons based on Type */}
                    {referrerRewardType === 'cash' && (
                      <div className="grid grid-cols-3 gap-2">
                        {['R20', 'R50', 'R100'].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setReferrerReward(`${amt} discount on checkout`)}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${referrerReward.startsWith(amt) ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                          >
                            {amt} Discount
                          </button>
                        ))}
                      </div>
                    )}

                    {referrerRewardType === 'percent' && (
                      <div className="grid grid-cols-4 gap-2">
                        {['2%', '5%', '10%', '15%'].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setReferrerReward(`${pct} of every sale value`)}
                            className={`py-2 rounded-xl border text-xs font-bold transition-all ${referrerReward.startsWith(pct) ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                          >
                            {pct} Sale
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl bg-hover border border-divider text-xs space-y-2 text-txtsecondary">
                      {referrerRewardType === 'cash' ? (
                        <>
                          <p className="font-bold text-txtprimary flex items-center gap-1">💡 Cash Discount Mode (Flat Reward)</p>
                          <p className="text-[11px] leading-relaxed">
                            <strong>Example:</strong> If you set this to <strong>R5 discount on checkout</strong>, the ambassador who referred a friend gets a flat <strong>R5.00</strong> voucher added to their wallet every time their friend buys from your shop.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-txtprimary flex items-center gap-1">💡 Percentage % Mode (Share of Spend)</p>
                          <p className="text-[11px] leading-relaxed">
                            <strong>Example:</strong> If you set this to <strong>5% of every sale value</strong>, the ambassador gets <strong>5% of whatever their friend spends</strong> (e.g. if the friend spends R200, the ambassador earns R10.00).
                          </p>
                        </>
                      )}
                    </div>

                    <input 
                      type="text" 
                      value={referrerReward} 
                      onChange={(e) => setReferrerReward(e.target.value)}
                      placeholder="Write details of the reward here"
                      className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary focus:border-[#10b981] outline-none bg-hover font-medium"
                      required
                    />
                  </div>

                  {/* Friend Discount Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-hover rounded-xl border border-divider">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-txtprimary font-sans">Enable Friend Reward Discount</span>
                        <p className="text-[10px] text-txtsecondary font-sans">Give referred friends a discount/reward on checkout</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasFriendReward}
                          onChange={(e) => setHasFriendReward(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-divider rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-divider after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
                      </label>
                    </div>

                    {hasFriendReward ? (
                      <div className="space-y-3 pt-1">
                        <label className="block text-xs text-txtprimary font-bold">Friend Reward Discount</label>
                        
                        {/* Tabs */}
                        <div className="flex border border-divider rounded-xl overflow-hidden bg-hover">
                          <button
                            type="button"
                            onClick={() => {
                              setFriendRewardType('cash');
                              setFriendReward('R50 off checkout');
                            }}
                            className={`flex-1 py-2 text-xs font-bold transition-all ${friendRewardType === 'cash' ? 'bg-[#10b981] text-white' : 'text-txtsecondary hover:text-txtprimary'}`}
                          >
                            💰 Cash Off
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFriendRewardType('percent');
                              setFriendReward('15% discount on checkout');
                            }}
                            className={`flex-1 py-2 text-xs font-bold transition-all ${friendRewardType === 'percent' ? 'bg-[#10b981] text-white' : 'text-txtsecondary hover:text-txtprimary'}`}
                          >
                            🏷️ Percentage %
                          </button>
                        </div>

                        {/* Presets */}
                        {friendRewardType === 'cash' && (
                          <div className="grid grid-cols-3 gap-2">
                            {['R20', 'R50', 'R100'].map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setFriendReward(`${amt} off checkout`)}
                                className={`py-2 rounded-xl border text-xs font-bold transition-all ${friendReward.startsWith(amt) ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                              >
                                {amt} Off
                              </button>
                            ))}
                          </div>
                        )}

                        {friendRewardType === 'percent' && (
                          <div className="grid grid-cols-4 gap-2">
                            {['10%', '15%', '20%', '25%'].map(pct => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => setFriendReward(`${pct} discount on checkout`)}
                                className={`py-2 rounded-xl border text-xs font-bold transition-all ${friendReward.startsWith(pct) ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]' : 'border-divider bg-panel text-txtsecondary'}`}
                              >
                                {pct} Off
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="p-3.5 rounded-xl bg-hover border border-divider text-xs space-y-2 text-txtsecondary">
                          {friendRewardType === 'cash' ? (
                            <>
                              <p className="font-bold text-txtprimary flex items-center gap-1">💡 Cash Off Mode (Flat Discount)</p>
                              <p className="text-[11px] leading-relaxed">
                                <strong>Example:</strong> If you set this to <strong>R50 off checkout</strong>, the referred friend receives a flat coupon for <strong>R50.00 off</strong> their bill when they checkout.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-bold text-txtprimary flex items-center gap-1">💡 Percentage % Mode (Discount off bill)</p>
                              <p className="text-[11px] leading-relaxed">
                                <strong>Example:</strong> If you set this to <strong>15% discount on checkout</strong>, the referred friend gets a <strong>15% discount</strong> on their checkout transaction.
                              </p>
                            </>
                          )}
                        </div>

                        <input 
                          type="text" 
                          value={friendReward} 
                          onChange={(e) => setFriendReward(e.target.value)}
                          placeholder="Write details of the discount here"
                          className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary focus:border-[#10b981] outline-none bg-hover font-medium"
                          required
                        />

                        {/* Catalog-Specific Selection Checklist */}
                        <div className="space-y-2.5 pt-1">
                          <label className="block text-[11px] text-txtsecondary font-semibold uppercase">Eligible Catalog Services / Products</label>
                          <p className="text-[10px] text-txtsecondary leading-normal">Check which of your services from the "My Store" catalog this discount applies to. Unchecked services will be charged at standard price during cashier validation.</p>
                          <div className="p-3.5 rounded-xl border border-divider bg-hover/50 space-y-2 max-h-[160px] overflow-y-auto">
                            {allCatalogServices.length > 0 ? (
                              allCatalogServices.map(svc => {
                                const isChecked = selectedEligibleServiceIds.includes(svc.id);
                                return (
                                  <label key={svc.id} className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedEligibleServiceIds(prev => [...prev, svc.id]);
                                        } else {
                                          setSelectedEligibleServiceIds(prev => prev.filter(id => id !== svc.id));
                                        }
                                      }}
                                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                                    />
                                    <div>
                                      <p className="text-xs font-bold text-txtprimary">{svc.name}</p>
                                      <p className="text-[10px] text-txtsecondary">Base Price: R{svc.price}</p>
                                    </div>
                                  </label>
                                );
                              })
                            ) : (
                              <p className="text-[10px] text-txtsecondary italic">No services registered in your catalog yet. Add them in the "My Store" tab first.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-txtsecondary italic pl-1">Referred friends won't receive a specific reward discount on signing up, but they can register to refer other friends and start earning.</p>
                    )}
                  </div>

                  <hr className="border-divider" />

                  {/* Verification Method Section */}
                  <div className="space-y-4">
                    <label className="block text-sm text-txtprimary font-bold">How to Check Referrals</label>
                    <p className="text-xs text-txtsecondary leading-relaxed">Choose how you want to confirm referrals when friends visit.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Code Only */}
                      <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${verificationMethod === 'code' ? 'border-[#10b981] bg-[#10b981]/5 text-txtprimary' : 'border-divider bg-hover/40 text-txtsecondary hover:bg-hover'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-txtprimary">Option 1: Code Only</span>
                          <input 
                            type="radio" 
                            name="verificationMethod" 
                            value="code"
                            checked={verificationMethod === 'code'} 
                            onChange={() => setVerificationMethod('code')}
                            className="accent-emerald-500 w-4 h-4" 
                          />
                        </div>
                        <span className="text-[10px] text-txtsecondary leading-relaxed">Confirm the discount code. Cashier only needs to type in the code.</span>
                      </label>

                      {/* Code + Phone */}
                      <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${verificationMethod === 'code_phone' ? 'border-[#10b981] bg-[#10b981]/5 text-txtprimary' : 'border-divider bg-hover/40 text-txtsecondary hover:bg-hover'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-txtprimary">Option 2: Code + Phone</span>
                          <input 
                            type="radio" 
                            name="verificationMethod" 
                            value="code_phone"
                            checked={verificationMethod === 'code_phone'} 
                            onChange={() => setVerificationMethod('code_phone')}
                            className="accent-emerald-500 w-4 h-4" 
                          />
                        </div>
                        <span className="text-[10px] text-txtsecondary leading-relaxed">Check the code and the friend's phone number. Cashier enters both.</span>
                      </label>

                      {/* Code + Custom Identifier */}
                      <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${verificationMethod === 'code_identifier' ? 'border-[#10b981] bg-[#10b981]/5 text-txtprimary' : 'border-divider bg-hover/40 text-txtsecondary hover:bg-hover'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-txtprimary">Option 3: Code + Extra Detail</span>
                          <input 
                            type="radio" 
                            name="verificationMethod" 
                            value="code_identifier"
                            checked={verificationMethod === 'code_identifier'} 
                            onChange={() => setVerificationMethod('code_identifier')}
                            className="accent-emerald-500 w-4 h-4" 
                          />
                        </div>
                        <span className="text-[10px] text-txtsecondary leading-relaxed">Ask for an extra detail (like a license plate or appointment name).</span>
                      </label>

                      {/* Manager Approval Queue */}
                      <label className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${verificationMethod === 'manager_approval' ? 'border-[#10b981] bg-[#10b981]/5 text-txtprimary' : 'border-divider bg-hover/40 text-txtsecondary hover:bg-hover'}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-txtprimary">Option 4: Approval Queue</span>
                          <input 
                            type="radio" 
                            name="verificationMethod" 
                            value="manager_approval"
                            checked={verificationMethod === 'manager_approval'} 
                            onChange={() => setVerificationMethod('manager_approval')}
                            className="accent-emerald-500 w-4 h-4" 
                          />
                        </div>
                        <span className="text-[10px] text-txtsecondary leading-relaxed">Send referrals to a list where you can approve or reject them.</span>
                      </label>
                    </div>

                    {/* Custom Identifier Label field */}
                    {verificationMethod === 'code_identifier' && (
                      <div className="p-4 rounded-2xl bg-hover border border-divider space-y-2 animate-fade-in">
                        <label className="block text-xs text-txtsecondary font-semibold uppercase">Label for Extra Detail</label>
                        <input 
                          type="text" 
                          value={customIdentifierLabel}
                          onChange={(e) => setCustomIdentifierLabel(e.target.value)}
                          placeholder="e.g. Plate Number, Student ID, Pet Name"
                          className="w-full px-4 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-panel focus:border-[#10b981] outline-none"
                          required
                        />
                        <span className="text-[10px] text-txtsecondary block">The name of the detail cashiers and customers will see.</span>
                      </div>
                    )}
                  </div>

                  <hr className="border-divider" />

                  {/* Anti-Fraud Policies */}
                  <div className="space-y-4">
                    <label className="block text-sm text-txtprimary font-bold">Rules and Safeguards</label>
                    <p className="text-xs text-txtsecondary leading-relaxed">Turn on rules to stop people from claiming rewards they shouldn't.</p>
                    
                    <div className="space-y-3">
                      {/* Self referral block */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-hover/50 border border-divider cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-txtprimary">Stop Self-Referrals</p>
                          <p className="text-[10px] text-txtsecondary">Stop customers from using their own referral codes.</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={blockSelfReferral}
                          onChange={(e) => setBlockSelfReferral(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </label>

                      {/* Limit one per friend */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-hover/50 border border-divider cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-txtprimary">One Discount Per Friend</p>
                          <p className="text-[10px] text-txtsecondary">Only let a friend get a discount once.</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={limitOnePerFriend}
                          onChange={(e) => setLimitOnePerFriend(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </label>

                      {/* First time customer check */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-hover/50 border border-divider cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-txtprimary">New Customers Only</p>
                          <p className="text-[10px] text-txtsecondary">Only give discounts to new customers.</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={firstTimeOnly}
                          onChange={(e) => setFirstTimeOnly(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </label>

                      {/* Limit one per day */}
                      <label className="flex items-center justify-between p-3 rounded-xl bg-hover/50 border border-divider cursor-pointer">
                        <div>
                          <p className="text-xs font-bold text-txtprimary">One Discount Per Day</p>
                          <p className="text-[10px] text-txtsecondary">Only allow one discount per friend each day.</p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={limitOnePerDay}
                          onChange={(e) => setLimitOnePerDay(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </label>

                      {/* Spend Threshold */}
                      <div className="p-3 rounded-xl bg-hover/50 border border-divider space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-txtprimary">Minimum Spend</p>
                            <p className="text-[10px] text-txtsecondary">Friends must spend this much money to get the discount.</p>
                          </div>
                          <input 
                            type="checkbox"
                            checked={requirePurchase}
                            onChange={(e) => {
                              setRequirePurchase(e.target.checked);
                              if (!e.target.checked) setMinimumSpend('');
                            }}
                            className="w-4 h-4 accent-emerald-500"
                          />
                        </div>
                        {requirePurchase && (
                          <div className="flex items-center gap-2 max-w-[150px] animate-fade-in pl-1">
                            <span className="text-xs text-txtsecondary">R</span>
                            <input 
                              type="number"
                              value={minimumSpend}
                              onChange={(e) => setMinimumSpend(e.target.value)}
                              placeholder="e.g. 200"
                              className="glass-input px-3 py-1.5 text-xs rounded-lg w-full"
                              required
                            />
                          </div>
                        )}
                      </div>

                      {/* Expiry Days */}
                      <div className="p-3 rounded-xl bg-hover/50 border border-divider space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-txtprimary">Expiry Limit</p>
                            <p className="text-[10px] text-txtsecondary">How many days the discount code is valid after they join.</p>
                          </div>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={rewardExpiryDays !== ''}
                              onChange={(e) => setRewardExpiryDays(e.target.checked ? '30' : '')}
                              className="w-4 h-4 accent-emerald-500"
                            />
                          </label>
                        </div>
                        {rewardExpiryDays !== '' && (
                          <div className="flex items-center gap-2 max-w-[150px] animate-fade-in pl-1">
                            <input 
                              type="number"
                              value={rewardExpiryDays}
                              onChange={(e) => setRewardExpiryDays(e.target.value)}
                              placeholder="e.g. 30"
                              className="glass-input px-3 py-1.5 text-xs rounded-lg w-full"
                              required
                            />
                            <span className="text-xs text-txtsecondary">Days</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  <hr className="border-divider" />

                  {/* Eligible Redemption Locations */}
                  <div className="space-y-4">
                    <label className="block text-sm text-txtprimary font-bold">Eligible Redemption Locations</label>
                    <p className="text-xs text-txtsecondary leading-relaxed">Select which of your branch locations can accept and redeem customer rewards. Friends can only claim codes at the locations checked below.</p>
                    <div className="space-y-2.5 p-4 rounded-xl bg-hover border border-divider">
                      {locations.map(loc => {
                        const isChecked = selectedRedeemableLocationIds.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-3 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRedeemableLocationIds(prev => [...prev, loc.id]);
                                } else {
                                  setSelectedRedeemableLocationIds(prev => prev.filter(id => id !== loc.id));
                                }
                              }}
                              className="w-4 h-4 accent-emerald-500 rounded"
                            />
                            <div>
                              <p className="text-xs font-bold text-txtprimary">{loc.name}</p>
                              <p className="text-[10px] text-txtsecondary">{loc.address}</p>
                            </div>
                          </label>
                        );
                      })}
                      {locations.length === 0 && (
                        <p className="text-xs text-txtsecondary italic">No branch locations found.</p>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-4 rounded-xl font-extrabold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl transition-all text-xs"
                  >
                    Save Settings &amp; Referral Rules
                  </button>
                </form>
              </div>
            </div>



            {/* Section 3: Branch Location details */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-txtprimary">Branch Locations</h3>
                  <p className="text-sm text-txtsecondary mt-1">Configure your physical store coordinates and contact numbers.</p>
                </div>
                <button 
                  onClick={() => {
                    if (business?.subscriptionPlan === 'free' && locations.length >= 1) {
                      showToast("Adding extra branch locations requires upgrading to the Premium Plan.", "warning");
                      setShowUpgradeModal(true);
                    } else {
                      const limit = business?.activeLocationsCount || 1;
                      if (locations.length >= limit && business?.subscriptionPlan !== 'free') {
                        showToast(`You have reached your Premium plan limit of ${limit} branch(es). Please update your branch quota under the Billing tab to add more.`, "warning");
                      } else {
                        // Open the Configure Location Modal in Create Mode!
                        setIsCreatingLocation(true);
                        setConfigureLocId(null);
                        
                        // Seed with clean default values
                        setConfigLocName(`Branch Location #${locations.length + 1}`);
                        setConfigLocAddress('');
                        setConfigLocPhone('');
                        setConfigLocWhatsapp('');
                        setConfigLocIdentifier('');
                        setConfigLocVerificationMethod('code');
                        setConfigLocCategory('beauty');
                        setConfigLocSubIndustry('Hair Salon');
                        setConfigLocCustomVal('');
                        setConfigLocCustomType('Service');
                        setConfigGallery([]);
                        setConfigLocBannerUrl('');
                        
                        // Default hours
                        const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
                        DAYS.forEach(day => {
                          defaultHours[day] = {
                            open: '08:00',
                            close: '17:00',
                            closed: day === 'Sunday'
                          };
                        });
                        setConfigHours(defaultHours);
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10"
                >
                  + Add Location
                </button>
              </div>

              <div className="space-y-4">
                {locations.map(loc => (
                  <div key={loc.id} className="glass-panel p-6 rounded-2xl border border-divider grid md:grid-cols-3 gap-6 items-center hover:border-accent-primary/45 transition-all group">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-txtprimary text-base">{loc.name}</h4>
                        <button 
                          onClick={() => openConfigureModal(loc)}
                          title="Edit branch name and details"
                          className="p-1 rounded text-txtsecondary hover:text-[#10b981] hover:bg-hover opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <p className="text-xs text-txtsecondary flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-txtsecondary" /> {loc.address}
                      </p>
                      
                      <div className="text-xs text-txtsecondary flex flex-wrap items-center gap-3.5 font-semibold pt-1">
                        <span className="flex items-center gap-1"><Phone className="w-4 h-4 text-txtsecondary" /> {loc.phoneNumber}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4 text-txtsecondary" /> {loc.whatsappNumber}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {business && (business.redeemableLocationIds ?? []).includes(loc.id) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                            ✓ Redeemable Here
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-500/15 border border-slate-500/25 text-txtsecondary text-[10px] font-bold">
                            ✕ Rewards Disabled
                          </span>
                        )}

                        {promotions.filter(p => p.locationIds?.includes(loc.id)).map(p => (
                          <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold">
                            🏷️ Special: {p.title}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="text-center">
                        <p className="text-xs text-txtsecondary uppercase font-bold mb-2">Identifier Required</p>
                        <span className="px-3.5 py-1.5 rounded-xl bg-hover border border-divider text-xs font-semibold text-txtprimary">
                          {((loc.verificationMethod || business.verificationMethod) === 'code') && 'Code Only'}
                          {((loc.verificationMethod || business.verificationMethod) === 'code_phone') && 'Code + Phone'}
                          {((loc.verificationMethod || business.verificationMethod) === 'code_identifier') && `Code + ${(loc.customIdentifierName || business.customIdentifierLabel || 'Identifier')}`}
                          {((loc.verificationMethod || business.verificationMethod) === 'manager_approval') && 'Manager Approval'}
                        </span>
                        <span className="block text-[9px] text-txtsecondary mt-1.5 font-medium">Click Edit Details &amp; Hours to change</span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => openConfigureModal(loc)}
                        className="px-4 py-2.5 bg-[#10b981] hover:bg-[#0e9f6e] text-white rounded-xl text-xs font-bold border-2 border-[#10b981] transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Details &amp; Hours
                      </button>
                    </div>

                    {/* Row 2: Manager Cashier Access Link Controls */}
                    <div className="md:col-span-3 border-t border-divider pt-4 mt-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-txtprimary flex items-center gap-1.5">
                            🔑 Cashier Access Link (No Login)
                          </h5>
                          <p className="text-[10px] text-txtsecondary">
                            Send this link to your branch staff. Clicking it logs them in automatically as a Cashier so they can validate discount codes.
                          </p>
                        </div>
                        
                        {(() => {
                          const activeLink = managerLinks.find(l => l.locationId === loc.id);
                          
                          if (activeLink) {
                            const cleanUrl = `${window.location.origin}/m/${activeLink.id}`;
                            const isExpired = activeLink.expiresAt && new Date() > new Date(activeLink.expiresAt);
                            
                            return (
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="px-3 py-2 rounded-xl bg-hover border border-divider flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-bold text-accent-primary select-all">{cleanUrl}</span>
                                  <button 
                                    onClick={() => {
                                      navigator.clipboard.writeText(cleanUrl);
                                      showToast('Copied manager link to clipboard!', 'success');
                                    }}
                                    className="p-1 rounded text-txtsecondary hover:text-white hover:bg-panel transition-all"
                                    title="Copy Link to Clipboard"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                
                                <div className="text-[10px] text-txtsecondary font-semibold">
                                  {activeLink.expiresAt ? (
                                    <span className={isExpired ? 'text-accent-red font-bold' : 'text-txtsecondary'}>
                                      Expires: {new Date(activeLink.expiresAt).toLocaleDateString()}
                                    </span>
                                  ) : (
                                    <span>Never Expires</span>
                                  )}
                                </div>
                                
                                <button 
                                  onClick={() => handleRevokeManagerLink(activeLink.id)}
                                  className="p-2.5 rounded-xl bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red font-bold text-xs flex items-center gap-1 transition-all"
                                  title="Revoke Access Link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Revoke
                                </button>
                              </div>
                            );
                          } else {
                            return (
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-[10px] text-txtsecondary font-semibold">Link Expiration:</span>
                                <select 
                                  value={selectedLinkExpiry[loc.id] || '30'}
                                  onChange={(e) => setSelectedLinkExpiry(prev => ({ ...prev, [loc.id]: e.target.value as any }))}
                                  className="px-2.5 py-1.5 rounded-lg border border-divider text-xs bg-panel text-txtprimary outline-none animate-none"
                                >
                                  <option value="30">30 Days</option>
                                  <option value="90">90 Days</option>
                                  <option value="never">Never Expire</option>
                                </select>
                                
                                <button 
                                  onClick={() => handleGenerateManagerLink(loc.id)}
                                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                                >
                                  ➕ Create Link
                                </button>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: BILLING */}
        {activeTab === 'billing' && (
          <div className="space-y-8 animate-fade-in">
            
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-xl font-bold text-txtprimary">Subscription &amp; Billing</h3>
                <p className="text-sm text-txtsecondary mt-1">Choose the perfect plan for your business. Upgrades take effect immediately.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {(() => {
                  const locCount = locations.length || 1;
                  const ratePerLocation = locCount >= 3 ? 249 : 289;
                  const totalCost = locCount * ratePerLocation;
                  const isFree = business.subscriptionPlan === 'free';

                  return (
                    <>
                      {/* Card 1: Free Tier */}
                      <div className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between space-y-6 relative ${isFree ? 'border-emerald-500/50 bg-emerald-500/[0.02] shadow-emerald-500/5 shadow-2xl' : 'border-divider'}`}>
                        {isFree && (
                          <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#10b981] text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                            Current Active Plan
                          </span>
                        )}
                        <div className="space-y-4 flex-1">
                          <div>
                            <h4 className="text-base font-black text-txtprimary">Free Tier</h4>
                            <p className="text-xs text-txtsecondary mt-1">Perfect for testing and small businesses starting out.</p>
                          </div>
                          
                          <div className="py-2">
                            <span className="text-3xl font-black text-txtprimary">R0</span>
                            <span className="text-xs text-txtsecondary font-semibold"> / month</span>
                          </div>

                          <hr className="border-divider" />

                          <div className="space-y-3">
                            <p className="text-xs font-bold text-txtprimary">What you get:</p>
                            <ul className="space-y-2.5 text-xs text-txtsecondary">
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Get up to 5 new customer signups a month
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Share up to 2 special deals
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Show up to 2 customer reviews
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Block people from referring themselves
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Get a signup QR code to print for your shop counter
                              </li>
                            </ul>
                          </div>

                          {isFree && (
                            <div className="border border-divider rounded-xl p-3 bg-panel/60 space-y-1 text-[11px] mt-2">
                              <p className="font-bold text-txtprimary">Monthly Progress:</p>
                              <p className="text-txtsecondary">• Customer registrations: {analytics.customersRegistered} / 5 scans</p>
                              <p className="text-accent-amber font-semibold">• Missed customer signups: {analytics.registrationAttempts}</p>
                            </div>
                          )}
                        </div>

                        {!isFree ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (window.confirm("Are you sure you want to downgrade to the Free Tier? The Free Tier only supports exactly 1 branch location. Extra locations will be automatically removed from your dashboard settings.")) {
                                await EasyRewardService.updateBusiness(business.id, { subscriptionPlan: 'free' });
                                
                                // Purge all locations except the first/primary location
                                if (locations.length > 1) {
                                  const keepLoc = locations[0];
                                  for (let i = 1; i < locations.length; i++) {
                                    await EasyRewardService.deleteLocation(locations[i].id);
                                  }
                                  setActiveLocation(keepLoc);
                                }

                                showToast('Downgraded to Free Plan. Extra locations were removed.', 'info');
                                loadData();
                              }
                            }}
                            className="w-full py-3 rounded-xl border border-divider text-xs text-txtsecondary font-bold hover:bg-hover transition-all text-center mt-4"
                          >
                            Downgrade to Free (Demo)
                          </button>
                        ) : (
                          <div className="py-2.5 px-4 rounded-xl bg-hover border border-divider text-[10px] text-center font-bold text-txtsecondary mt-4">
                            Active plan
                          </div>
                        )}
                      </div>

                      {/* Card 2: Premium Tier */}
                      <div className={`glass-panel p-6 rounded-2xl border flex flex-col justify-between space-y-6 relative ${!isFree ? 'border-emerald-500/50 bg-[#10b981]/5 shadow-emerald-500/5 shadow-2xl' : 'border-divider'}`}>
                        {!isFree && (
                          <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-[#10b981] text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20">
                            Current Active Plan
                          </span>
                        )}
                        <div className="space-y-4 flex-1">
                          <div>
                            <h4 className="text-base font-black text-txtprimary">Premium Plan</h4>
                            <p className="text-xs text-txtsecondary mt-1">Best for growing storefronts with active customer sharing.</p>
                          </div>
                          
                          <div className="py-2 space-y-1">
                            <div>
                              <span className="text-3xl font-black text-txtprimary">R{ratePerLocation}</span>
                              <span className="text-xs text-txtsecondary font-semibold"> / month per location</span>
                            </div>
                            <div className="text-[11px] text-[#10b981] font-extrabold flex items-center gap-1">
                              <span>🔥</span> R249 / month per location from 3 locations!
                            </div>
                          </div>

                          <hr className="border-divider" />

                          <div className="space-y-3">
                            <p className="text-xs font-bold text-txtprimary">What you get:</p>
                            <ul className="space-y-2.5 text-xs text-txtsecondary">
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Get unlimited customer signups
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Share unlimited special deals
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Show unlimited customer reviews
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="text-[#10b981] font-bold">✓</span> Add more store locations and see metrics
                              </li>
                              {(isFree ? (previewLocCount ?? locCount) : locCount) >= 3 ? (
                                <li className="flex items-center gap-2 text-[#10b981] font-black">
                                  <span>✓</span> R249 bulk rate is currently active!
                                </li>
                              ) : (
                                <li className="flex items-center gap-2 text-[#10b981] font-black">
                                  <span>✓</span> Get R249 rate automatically from 3 shops!
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Locations Adjuster with + / - buttons */}
                          <div className="p-3.5 rounded-xl bg-hover border border-divider flex items-center justify-between gap-4 mt-2">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-txtprimary">Total Locations</span>
                              <p className="text-[10px] text-txtsecondary">
                                Adjust branch count &amp; quota
                              </p>
                            </div>
                            <div className="flex items-center gap-2 bg-canvas border border-divider rounded-xl p-1 shrink-0">
                              <button 
                                type="button"
                                onClick={() => setSelectedBranchCount(prev => Math.max(1, prev - 1))}
                                className="w-7 h-7 rounded-lg bg-panel hover:bg-hover border border-divider text-txtprimary font-black text-sm flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
                                title="Decrease location quota"
                              >
                                -
                              </button>
                              <span className="text-xs font-black px-2 text-txtprimary min-w-[20px] text-center">
                                {selectedBranchCount}
                              </span>
                              <button 
                                type="button"
                                onClick={() => setSelectedBranchCount(prev => prev + 1)}
                                className="w-7 h-7 rounded-lg bg-[#10b981] hover:bg-[#0e9f6e] text-white font-black text-sm flex items-center justify-center transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
                                title="Increase location quota"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Dynamic breakdown total summary */}
                          {(() => {
                            const currentRate = selectedBranchCount >= 3 ? 249 : 289;
                            const currentTotal = selectedBranchCount * currentRate;

                            return (
                              <div className="border border-divider rounded-xl p-3 bg-panel/40 space-y-1.5 text-[11px] font-semibold mt-2">
                                <div className="flex justify-between text-txtprimary">
                                  <span>Monthly Rate:</span>
                                  <span>R{currentRate} / location</span>
                                </div>
                                <div className="flex justify-between text-txtprimary border-t border-divider pt-1.5 font-bold">
                                  <span>Total Monthly Cost:</span>
                                  <span>R{currentTotal} / month</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {isFree ? (
                          <button
                            type="button"
                            onClick={handleUpgradePlan}
                            className="w-full py-3 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-1.5 mt-4 cursor-pointer"
                          >
                            Upgrade to Premium <Sparkles className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="space-y-2 mt-4">
                            {selectedBranchCount !== locations.length ? (
                              <button
                                type="button"
                                onClick={() => setShowInvoiceModal(true)}
                                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                Update Branch Quota <Sparkles className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="py-2.5 px-4 rounded-xl bg-hover border border-divider text-[10px] text-center font-bold text-txtsecondary">
                                Active at {locations.length} location(s)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Promotion Creator Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-md bg-panel p-6 rounded-3xl border border-divider shadow-2xl relative my-8 md:my-auto">
            <button 
              onClick={() => setShowPromoModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg bg-hover text-txtsecondary hover:text-txtprimary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-lg font-black tracking-tight text-txtprimary">Create Special Advert</h3>
              <p className="text-xs text-txtsecondary mt-0.5">Publish a promotional offer across your store locations.</p>
            </div>

            {promoError && (
              <div className="mb-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-accent-red shrink-0" /> {promoError}
              </div>
            )}

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-txtprimary mb-1.5">Promotion Title *</label>
                <input 
                  type="text" 
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  placeholder="e.g. Winter blowout special"
                  className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txtprimary mb-1.5">Description *</label>
                <textarea 
                  value={promoDesc}
                  onChange={(e) => setPromoDesc(e.target.value)}
                  placeholder="Write clear, outcome-focused offer details..."
                  className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none h-20 resize-none font-semibold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-txtprimary mb-1.5">Banner Image (File Upload or Link)</label>
                
                {/* Drag and Drop Container for Promotion */}
                <div 
                  onDragOver={handleDragOverPromo}
                  onDragLeave={handleDragLeavePromo}
                  onDrop={handleDropPromo}
                  onClick={() => document.getElementById('promo-img-file')?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] relative overflow-hidden bg-hover ${
                    isDraggingPromo ? 'border-[#10b981] bg-[#10b981]/5' : 'border-divider hover:border-[#10b981]/60 bg-hover'
                  }`}
                >
                  <input 
                    id="promo-img-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelectPromo}
                    className="hidden"
                  />
                  
                  {promoImg && !promoImageError ? (
                    <div className="w-full h-full absolute inset-0 group">
                      <img 
                        src={promoImg} 
                        alt="Promo Preview" 
                        className="w-full h-full object-cover"
                        onError={() => setPromoImageError(true)}
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="text-white text-[10px] font-bold bg-[#10b981] px-2.5 py-1 rounded-lg shadow">Change Image</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPromoImg('');
                          }}
                          className="text-white text-[10px] font-bold bg-accent-red px-2.5 py-1 rounded-lg shadow"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : promoImg && promoImageError ? (
                    <div className="space-y-1.5 p-2 text-center">
                      <AlertTriangle className="w-5 h-5 text-accent-amber mx-auto" />
                      <p className="text-[10px] font-bold text-txtprimary">Image Load Failed</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPromoImg('');
                        }}
                        className="text-[9px] bg-accent-red/20 text-accent-red px-2 py-0.5 rounded border border-accent-red/25"
                      >
                        Reset Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 flex flex-col items-center">
                      <Upload className="w-5 h-5 text-txtsecondary" />
                      <p className="text-[11px] font-bold text-txtprimary">Drag & drop promo banner</p>
                      <p className="text-[9px] text-txtsecondary font-medium">or click to browse local files (max 1.5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-txtprimary mb-1.5">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={promoExpiry}
                  onChange={(e) => setPromoExpiry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold transition-all"
                />
              </div>

              {/* Selected Locations for this Promotion */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-txtprimary">Active Locations *</label>
                  <p className="text-[10px] text-txtsecondary mt-0.5">Select which branches this special offer applies to.</p>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {locations.map(loc => {
                    const isSelected = selectedPromoLocationIds.includes(loc.id);
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPromoLocationIds(prev => prev.filter(id => id !== loc.id));
                          } else {
                            setSelectedPromoLocationIds(prev => [...prev, loc.id]);
                          }
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected 
                            ? 'border-[#10b981] bg-[#10b981]/5 shadow-sm' 
                            : 'border-divider bg-panel hover:bg-hover'
                        }`}
                      >
                        <div className="space-y-0.5 pr-2">
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#10b981]' : 'text-txtprimary'}`}>{loc.name}</p>
                          <p className="text-[9px] text-txtsecondary truncate max-w-[280px]">{loc.address || "No address configured"}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                          isSelected 
                            ? 'bg-[#10b981] border-[#10b981] text-white' 
                            : 'border-divider bg-canvas text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3px]" />
                        </div>
                      </button>
                    );
                  })}
                  {locations.length === 0 && (
                    <p className="text-xs text-txtsecondary italic text-center py-4 bg-hover rounded-xl border border-divider">
                      No locations found.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-4 rounded-xl font-extrabold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-lg shadow-emerald-500/20 transition-all text-xs"
                >
                  Create Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade Subscription Dialog Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-divider text-center space-y-6 relative my-8 md:my-auto">
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-txtsecondary hover:text-txtprimary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-16 h-16 bg-accent-primary/10 border border-accent-primary/20 text-accent-primary rounded-full flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black font-sans text-txtprimary">Upgrade to Tolla Premium</h3>
              <p className="text-xs text-txtsecondary mt-2 max-w-sm mx-auto leading-relaxed">
                Unlock unlimited customer advocates, promotions, and approved reviews to grow your storefront business.
              </p>
            </div>

            {/* Simulated checkout card stats */}
            <div className="p-4 rounded-xl bg-canvas border border-divider text-left text-xs space-y-2">
              <p className="font-bold text-txtprimary">Upgrade summary:</p>
              <p className="text-txtsecondary">• Unlimited monthly advocates (currently capped at 5)</p>
              <p className="text-txtsecondary">• Missed referral signups recovered: {analytics.registrationAttempts}</p>
              <p className="text-txtsecondary">• Unlimited approved reviews on links (currently capped at 2)</p>
              <p className="text-txtsecondary">• Unlimited active branch promotions (currently capped at 2)</p>
              <hr className="border-divider my-2" />
              <div className="flex justify-between font-bold text-txtprimary">
                <span>Monthly Plan Fee:</span>
                <span>R289 / month</span>
              </div>
            </div>

            <button 
              onClick={handleUpgradePlan}
              className="w-full py-4 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              Complete Upgrade <CreditCard className="w-4 h-4" /> (Mock Checkout)
            </button>
          </div>
        </div>
      )}
      {/* Configure Hours & Photos Modal */}
      {(configureLocId || isCreatingLocation) && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-divider shadow-2xl overflow-hidden my-8 md:my-auto">
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-divider flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-txtprimary">{isNewMerchantAccount ? "Setup Your Store Location" : (isCreatingLocation ? 'Add New Branch Location' : 'Configure Location')}</h3>
                <p className="text-xs text-txtsecondary mt-0.5">{isNewMerchantAccount ? "Please enter your store details to unlock your dashboard" : (isCreatingLocation ? 'Set up coordinates, contact info and industry category' : configLocName)}</p>
              </div>
              {!isNewMerchantAccount && (
                <button onClick={() => { setConfigureLocId(null); setIsCreatingLocation(false); }} className="p-2 rounded-xl hover:bg-hover text-txtsecondary hover:text-txtprimary transition-all">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Location Details Editor */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-txtprimary flex items-center gap-2">
                  <Settings className="w-4 h-4 text-accent-primary" /> Location Settings
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">Branch Name *</label>
                    <input 
                      type="text" 
                      value={configLocName}
                      onChange={(e) => setConfigLocName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">Referral Verification Method</label>
                    <select
                      value={configLocVerificationMethod}
                      onChange={(e) => setConfigLocVerificationMethod(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                    >
                      <option value="code">Discount Code Only</option>
                      <option value="code_phone">Discount Code + Phone Number</option>
                      <option value="code_identifier">Discount Code + Business Identifier</option>
                      <option value="manager_approval">Manager Approval Queue</option>
                    </select>
                  </div>

                  {configLocVerificationMethod === 'code_identifier' && (
                    <div className="md:col-span-2 animate-fade-in space-y-1.5 p-3.5 rounded-xl border border-[#10b981]/20 bg-[#10b981]/5">
                      <label className="block text-[10px] text-[#10b981] font-bold uppercase">Identifier Required (e.g. License Plate, Student Name, Table Number)</label>
                      <input 
                        type="text" 
                        value={configLocIdentifier}
                        onChange={(e) => setConfigLocIdentifier(e.target.value)}
                        placeholder="e.g. Table Number, Room Number"
                        className="w-full px-3 py-2 rounded-xl border-2 border-[#10b981]/30 text-xs text-txtprimary bg-canvas focus:border-[#10b981] outline-none font-bold"
                        required
                      />
                      <span className="text-[9px] text-txtsecondary block">The referred customer will be prompted to provide this detail when claiming their discount.</span>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">Street Address *</label>
                    <input 
                      ref={addressInputRef}
                      type="text" 
                      value={configLocAddress}
                      onChange={(e) => setConfigLocAddress(e.target.value)}
                      placeholder="e.g. Shop 42, West Mall, Johannesburg"
                      className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                      required
                    />
                  </div>

                  {/* Location Specific Category & Sub-Industry */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-1.5">
                    <div>
                      <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1 font-medium">Industry Category *</label>
                      <select 
                        value={configLocCategory} 
                        onChange={(e) => {
                          const cat = e.target.value;
                          setConfigLocCategory(cat);
                          const defaultSub = INDUSTRY_CATEGORIES[cat]?.items[0]?.name || '';
                          setConfigLocSubIndustry(defaultSub);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                      >
                        {Object.entries(INDUSTRY_CATEGORIES).map(([key, value]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1 font-medium">Business Sub-Type *</label>
                      <select 
                        value={configLocSubIndustry} 
                        onChange={(e) => setConfigLocSubIndustry(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                      >
                        {INDUSTRY_CATEGORIES[configLocCategory]?.items.map(item => (
                          <option key={item.name} value={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Category Fields */}
                    {(configLocSubIndustry === 'Other (Custom)' || configLocCategory === 'other') && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-panel/30 border border-divider rounded-xl">
                        <div>
                          <label className="block text-[9px] text-txtsecondary font-semibold uppercase mb-1">Custom Industry Name *</label>
                          <input 
                            type="text" 
                            value={configLocCustomVal} 
                            onChange={(e) => setConfigLocCustomVal(e.target.value)}
                            placeholder="e.g. Pet Hotel"
                            className="w-full px-3 py-2 rounded-lg border border-divider text-xs text-txtprimary bg-hover outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-txtsecondary font-semibold uppercase mb-1">Business Type *</label>
                          <select 
                            value={configLocCustomType} 
                            onChange={(e) => setConfigLocCustomType(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-divider text-xs text-txtprimary bg-hover outline-none"
                          >
                            {["Service", "Food", "Retail", "Distribution", "Professional", "Membership", "Education", "Manufacturing", "Other"].map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">Phone Number *</label>
                    <input 
                      type="text" 
                      value={configLocPhone}
                      onChange={(e) => setConfigLocPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">WhatsApp Number *</label>
                    <input 
                      type="text" 
                      value={configLocWhatsapp}
                      onChange={(e) => setConfigLocWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] text-txtsecondary font-semibold uppercase mb-1">Background Banner Image</label>
                    <input 
                      id="banner-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileInput}
                      className="hidden"
                    />
                    {configLocBannerUrl ? (
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-divider bg-hover">
                        <div className="w-24 h-12 rounded-lg border border-divider overflow-hidden bg-panel flex items-center justify-center shrink-0 animate-fade-in">
                          <img src={configLocBannerUrl} alt="Background Banner Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-txtprimary font-sans">Active location banner image loaded</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById('banner-file-input')?.click()}
                              className="px-2 py-0.5 rounded bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/25 text-[9px] font-bold transition-all cursor-pointer font-sans"
                            >
                              Change Banner
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfigLocBannerUrl('')}
                              className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/25 text-[9px] font-bold transition-all cursor-pointer font-sans"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDraggingBanner(true); }}
                        onDragLeave={() => setIsDraggingBanner(false)}
                        onDrop={handleBannerDrop}
                        onClick={() => document.getElementById('banner-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                          isDraggingBanner
                            ? 'border-[#10b981] bg-[#10b981]/10'
                            : 'border-divider hover:border-[#10b981]/50 hover:bg-hover/50'
                        }`}
                      >
                        <Upload className="w-4.5 h-4.5 text-txtsecondary mx-auto mb-1.5" />
                        <p className="text-[11px] text-txtsecondary font-semibold">Drag & drop your banner here, or <span className="text-[#10b981]">click to browse</span></p>
                        <p className="text-[9px] text-txtsecondary mt-0.5 font-medium">PNG, JPG, WEBP, SVG up to 5MB. Shows as the hero background on referral landing pages.</p>
                      </div>
                    )}

                    {/* Custom URL and presets picker */}
                    <div className="mt-3.5 space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] text-txtsecondary font-semibold uppercase">Or paste a direct image URL</label>
                        <input 
                          type="text"
                          value={configLocBannerUrl}
                          onChange={(e) => setConfigLocBannerUrl(e.target.value)}
                          placeholder="e.g. https://images.unsplash.com/photo-..."
                          className="w-full px-3 py-2 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-sans"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] text-txtsecondary font-semibold uppercase">Or choose from premium presets</label>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {PRESET_BANNERS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setConfigLocBannerUrl(preset.url)}
                              className={`relative px-3 py-1.5 rounded-lg border text-[10px] font-bold shrink-0 transition-all font-sans cursor-pointer ${
                                configLocBannerUrl === preset.url
                                  ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/5'
                                  : 'border-divider text-txtsecondary bg-hover hover:text-txtprimary hover:border-divider-strong'
                              }`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-divider" />

              {/* Opening Hours */}
              <div>
                <h4 className="text-sm font-bold text-txtprimary mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent-primary" /> Opening Hours
                </h4>
                <div className="space-y-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-3 p-3 rounded-xl bg-hover/50 border border-divider">
                      <span className="text-xs font-bold text-txtprimary w-8 shrink-0">{day.slice(0,3)}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!configHours[day]?.closed}
                          onChange={e => setConfigHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !e.target.checked } }))}
                          className="w-4 h-4 accent-emerald-500"
                        />
                        <span className="text-[11px] text-txtsecondary w-10">{configHours[day]?.closed ? 'Closed' : 'Open'}</span>
                      </label>
                      {!configHours[day]?.closed && (
                        <>
                          <input
                            type="time"
                            value={configHours[day]?.open ?? '08:00'}
                            onChange={e => setConfigHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                            className="glass-input px-2 py-1.5 rounded-lg text-xs flex-1 min-w-0"
                          />
                          <span className="text-txtsecondary text-xs shrink-0">–</span>
                          <input
                            type="time"
                            value={configHours[day]?.close ?? '17:00'}
                            onChange={e => setConfigHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                            className="glass-input px-2 py-1.5 rounded-lg text-xs flex-1 min-w-0"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gallery Photos */}
              <div>
                <h4 className="text-sm font-bold text-txtprimary mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-accent-primary" /> Gallery Photos
                </h4>
                <div
                  onDragOver={e => { e.preventDefault(); setIsDraggingGallery(true); }}
                  onDragLeave={() => setIsDraggingGallery(false)}
                  onDrop={handleGalleryDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDraggingGallery
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-divider hover:border-accent-primary/50 hover:bg-hover/50'
                  }`}
                  onClick={() => document.getElementById('gallery-file-input')?.click()}
                >
                  <Upload className="w-6 h-6 text-txtsecondary mx-auto mb-2" />
                  <p className="text-xs text-txtsecondary">Drag & drop photos or <span className="text-accent-primary font-semibold">click to browse</span></p>
                  <p className="text-[10px] text-txtsecondary mt-1">PNG, JPG, GIF, WEBP or SVG only — no PDFs or videos</p>
                  <input
                    id="gallery-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryFileInput}
                  />
                </div>
                {configGallery.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {configGallery.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-divider">
                        <img src={url} alt={`Gallery ${i+1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setConfigGallery(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-accent-red/90 text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-divider flex justify-between items-center bg-panel/30">
              <div>
                {!isCreatingLocation && (
                  <button
                    type="button"
                    onClick={handleDeleteLocation}
                    className="px-4 py-2.5 bg-accent-red/10 hover:bg-accent-red/25 border border-accent-red/20 text-accent-red rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Location
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                {!isNewMerchantAccount && (
                  <button
                    onClick={() => { setConfigureLocId(null); setIsCreatingLocation(false); }}
                    className="px-5 py-2.5 rounded-xl border border-divider text-xs font-bold text-txtsecondary hover:bg-hover transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveLocationConfig}
                  className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#0e9f6e] text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {isCreatingLocation ? 'Create Branch' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Sitting Bottom Navigation Bar (Mobile only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1e2230]/95 backdrop-blur-md border-t border-slate-800/80 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] h-16 flex items-center justify-around px-2 selection:bg-transparent text-white">
        
        {/* Tab 1: Overview */}
        <button 
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-[#10b981]' : 'text-slate-400 hover:text-white'}`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Overview</span>
        </button>

        {/* Tab 2: My Store */}
        <button 
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'growth' ? 'text-[#10b981]' : 'text-slate-400 hover:text-white'}`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">My Store</span>
        </button>

        {/* Central circular Validate button */}
        <button 
          type="button"
          onClick={() => setShowMobileQuickActions(true)}
          className="w-12 h-12 rounded-full bg-[#10b981] hover:bg-[#0e9f6e] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transform -translate-y-3 transition-all duration-200 active:scale-95 border-4 border-[#1e2230]"
          title="Quick Actions Menu"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
        </button>

        {/* Tab 4: Settings */}
        <button 
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'settings' ? 'text-[#10b981]' : 'text-slate-400 hover:text-white'}`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Settings</span>
        </button>

        {/* Tab 5: Advocates */}
        <button 
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all ${activeTab === 'customers' ? 'text-[#10b981]' : 'text-slate-400 hover:text-white'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">Advocates</span>
        </button>

      </div>

      {/* Mobile Quick Actions Slide-up Menu Sheet */}
      {showMobileQuickActions && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm md:hidden flex items-end justify-center animate-fade-in"
          onClick={() => setShowMobileQuickActions(false)}
        >
          <div 
            className="w-full bg-[#1e2230] border-t border-slate-800 rounded-t-3xl p-6 space-y-6 animate-slide-up max-h-[85vh] overflow-y-auto text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white">Quick Actions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Choose an action to manage your store</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowMobileQuickActions(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-4 pb-8">
              
              {/* Action 1: Validate Code */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setShowMobileValidateModal(true);
                }}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 text-left flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 text-[#10b981] flex items-center justify-center font-black">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Validate Code</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Verify customer coupons</p>
                </div>
              </button>

              {/* Action 2: Create Special Deal / Advert */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setShowPromoModal(true);
                }}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 text-left flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center font-black">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Create Advert</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Add new special deals</p>
                </div>
              </button>

              {/* Action 3: Add Catalog Service */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setActiveTab('growth');
                  showToast("Add your service catalog menu items here!", "info");
                }}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 text-left flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Add Service</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Add items to catalog menu</p>
                </div>
              </button>

              {/* Action 4: Display Customer QR Scan */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileQuickActions(false);
                  setShowMobileQRModal(true);
                }}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 text-left flex flex-col justify-between space-y-3 group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-black">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Show QR Code</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Customer signup scan</p>
                </div>
              </button>

              {/* Action 5: Subscription & Billing */}
              {authUser.role === 'owner' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileQuickActions(false);
                    setActiveTab('billing');
                  }}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-800 text-left flex flex-col justify-between space-y-3 group transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-black">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Billing & Plan</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Upgrade or update plan</p>
                  </div>
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Mobile Customer QR Modal */}
      {showMobileQRModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm md:hidden flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm bg-[#1e2230] border border-slate-800 p-6 rounded-3xl relative text-center space-y-6">
            <button 
              onClick={() => setShowMobileQRModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-white">Signup QR Code</h3>
            <img 
              src={activeLocation.qrCodeUrl} 
              alt="Signup QR Code" 
              className="w-48 h-48 rounded-2xl border border-slate-800 bg-white p-3 shadow-md mx-auto"
            />
            <div>
              <p className="text-sm font-bold text-white">Scan at Cash Counter</p>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Have customers scan this QR code to join your referral program.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Validate Quick Action Modal */}
      {showMobileValidateModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm md:hidden flex items-end justify-center animate-fade-in">
          <div className="w-full bg-panel border-t border-divider rounded-t-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-divider">
              <div>
                <h3 className="text-lg font-bold text-txtprimary">Validate Referral Code</h3>
                <p className="text-xs text-txtsecondary mt-0.5">Enter code details below to validate</p>
              </div>
              <button 
                onClick={() => {
                  setShowMobileValidateModal(false);
                  setRedemptionResult(null);
                  setRedemptionError('');
                }}
                className="p-1.5 rounded-lg bg-hover text-txtsecondary hover:text-txtprimary transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Validation Form */}
            <form onSubmit={handleRedemptionLookup} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-txtsecondary mb-1.5 font-bold">Referral Code *</label>
                  <input 
                    type="text" 
                    value={redeemCode} 
                    onChange={(e) => setRedeemCode(e.target.value)}
                    placeholder="e.g. AB1234"
                    className="w-full px-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-bold uppercase"
                    required
                  />
                </div>


                {activeLocation?.services && activeLocation.services.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="block text-xs text-txtsecondary mb-1.5 font-bold font-sans">Catalog Product / Service</label>
                    <select
                      value={selectedCheckoutServiceId}
                      onChange={(e) => {
                        const svcId = e.target.value;
                        setSelectedCheckoutServiceId(svcId);
                        const selectedSvc = activeLocation.services.find((s: any) => s.id === svcId);
                        if (selectedSvc) {
                          const isEligible = business?.eligibleServiceIds?.includes(svcId);
                          if (isEligible) {
                            const matches = business.friendReward.match(/(\d+)%/);
                            const pct = matches ? parseInt(matches[1], 10) : 0;
                            const discount = selectedSvc.price * (pct / 100);
                            setValidationSpend(String(selectedSvc.price - discount));
                          } else {
                            setValidationSpend(String(selectedSvc.price));
                          }
                        } else {
                          setValidationSpend('');
                        }
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                    >
                      <option value="">-- Choose Catalog Service (Optional) --</option>
                      {activeLocation.services.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (R{s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedCheckoutServiceId && (
                  (() => {
                    const isEligible = business?.eligibleServiceIds?.includes(selectedCheckoutServiceId);
                    const selectedSvc = activeLocation?.services?.find((s: any) => s.id === selectedCheckoutServiceId);
                    if (!selectedSvc) return null;
                    const matches = business?.friendReward?.match(/(\d+)%/);
                    const pct = matches ? parseInt(matches[1], 10) : 0;
                    const discount = selectedSvc.price * (pct / 100);
                    
                    return isEligible ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1 animate-fade-in font-bold font-sans">
                        <p className="flex items-center gap-1.5 text-[#10b981]">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Discount applies to this catalog service!</span>
                        </p>
                        <div className="text-[10px] text-txtsecondary font-medium pl-6 space-y-0.5 mt-1 font-sans">
                          <p>Standard Price: R{selectedSvc.price.toFixed(2)}</p>
                          <p>Campaign Discount ({pct}%): -R{discount.toFixed(2)}</p>
                          <p className="text-emerald-500 font-bold">Checkout Bill: R{(selectedSvc.price - discount).toFixed(2)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs space-y-1 animate-fade-in font-bold font-sans">
                        <p className="flex items-center gap-1.5 text-rose-500">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Discount does not apply to this catalog service.</span>
                        </p>
                        <div className="text-[10px] text-txtsecondary font-medium pl-6 space-y-0.5 mt-1 font-sans">
                          <p>Standard Price: R{selectedSvc.price.toFixed(2)}</p>
                          <p className="text-rose-500 font-bold">Checkout Bill: R{selectedSvc.price.toFixed(2)} (Full Price)</p>
                        </div>
                      </div>
                    );
                  })()
                )}

                {business.requirePurchase && (
                  <div>
                    <label className="block text-xs text-txtsecondary mb-1.5 font-bold">Checkout Bill Spend (Rands) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-xs text-txtsecondary font-bold">R</span>
                      <input 
                        type="number" 
                        value={validationSpend} 
                        onChange={(e) => setValidationSpend(e.target.value)}
                        placeholder="e.g. 250"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-divider text-xs text-txtprimary bg-hover focus:border-[#10b981] outline-none font-semibold"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {redemptionError && (
                <div className="p-3 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {redemptionError}
                </div>
              )}

              {redemptionResult && (
                <div className="p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-xs space-y-2">
                  <p className="font-extrabold text-[#10b981] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Code Approved!
                  </p>
                  <p className="font-semibold text-txtprimary">✓ Friend Discount: {redemptionResult.friendReward}</p>
                  <p className="font-semibold text-txtprimary">✓ Referrer Payout: {redemptionResult.referrerReward}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-4 rounded-xl font-extrabold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-lg shadow-emerald-500/20 transition-all text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Validate Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Customer Timeline Event History Modal */}
      {selectedTimelineCust && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-divider shadow-2xl overflow-hidden bg-panel flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-divider flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold font-sans text-txtprimary">Customer Interaction Timeline</h3>
                <p className="text-xs text-txtsecondary mt-0.5">POI compliance history &amp; event logs</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTimelineCust(null);
                  setSelectedTimelineEvents([]);
                  setSelectedTimelineUser(null);
                }}
                className="p-1 rounded-lg hover:bg-hover border border-divider text-txtsecondary hover:text-txtprimary transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer summary */}
              <div className="p-4 rounded-xl bg-hover border border-divider flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-txtprimary text-xs uppercase tracking-wider">{selectedTimelineUser?.name || 'Customer Profile'}</h4>
                  <p className="text-[11px] text-txtsecondary mt-0.5">{selectedTimelineUser?.phoneNumber || selectedTimelineUser?.emailAddress || '[PII scrubbed]'}</p>
                  <p className="text-[10px] text-txtsecondary font-mono mt-1 text-[#10b981] font-bold">Tolla ID: {selectedTimelineCust.tollaUserId}</p>
                </div>
                <div className="text-center shrink-0">
                  <p className="text-[9px] text-txtsecondary font-black uppercase tracking-wider">Referral Score</p>
                  <span className="text-base font-black text-[#10b981] block mt-0.5">{selectedTimelineCust.referralScore}/100</span>
                </div>
              </div>

              {/* Timeline feed */}
              <div className="space-y-4 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-divider">
                {selectedTimelineEvents.length === 0 ? (
                  <p className="text-xs text-txtsecondary italic pl-2">No activity events recorded yet.</p>
                ) : (
                  selectedTimelineEvents.map((evt, idx) => (
                    <div key={evt.id} className="relative space-y-1 pl-4">
                      {/* Timeline dot */}
                      <span className="absolute left-[-13.5px] top-1.5 w-2 h-2 rounded-full bg-[#10b981] ring-4 ring-[#10b981]/15" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-hover border border-divider text-txtsecondary font-black uppercase tracking-wider">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-txtsecondary font-semibold">
                          {new Date(evt.createdAt).toLocaleDateString()} @ {new Date(evt.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-txtprimary font-semibold">{evt.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-divider bg-hover/50 flex justify-end">
              <button 
                onClick={() => {
                  setSelectedTimelineCust(null);
                  setSelectedTimelineEvents([]);
                  setSelectedTimelineUser(null);
                }}
                className="px-4 py-2 bg-panel hover:bg-hover border border-divider text-txtprimary rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Invoice Preview Modal */}
      {showInvoiceModal && business && (() => {
        const rate = selectedBranchCount >= 3 ? 249 : 289;
        const totalVal = selectedBranchCount * rate;

        return (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6 print:bg-white print:p-0">
            <div className="w-full max-w-2xl bg-panel rounded-3xl border border-divider shadow-2xl overflow-hidden my-8 md:my-auto print:border-none print:shadow-none print:my-0">
              {/* Modal Header Controls (hidden on print) */}
              <div className="px-6 py-4 border-b border-divider bg-hover/20 flex items-center justify-between print:hidden">
                <span className="text-xs font-bold text-[#10b981] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" /> Manual EFT Payment Mode
                </span>
                <button 
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1.5 rounded-lg hover:bg-hover text-txtsecondary hover:text-txtprimary transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Invoice Sheet */}
              <div className="p-8 space-y-6 print:p-0 bg-panel text-txtprimary print:bg-white print:text-black">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-divider pb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Logo className="w-6 h-6" />
                      <span className="font-black text-xl text-accent-primary print:text-black">Tolla</span>
                    </div>
                    <p className="text-[10px] text-txtsecondary mt-1.5 print:text-gray-500 whitespace-pre-line">
                      {invoiceConfig.companyName}<br />
                      {invoiceConfig.companyAddress}
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black uppercase tracking-wider text-txtprimary print:text-black">Tax Invoice</h2>
                    <p className="text-xs text-txtsecondary mt-1 font-mono print:text-gray-500">
                      Invoice #: INV-2026-{business.id.substring(0, 4).toUpperCase() || "8802"}<br />
                      Date: {new Date().toLocaleDateString()}<br />
                      Due Date: Upon Receipt
                    </p>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                  <div>
                    <h4 className="font-bold text-txtsecondary uppercase tracking-wider text-[10px] mb-1.5 print:text-gray-600">Billed To</h4>
                    <p className="font-extrabold text-txtprimary print:text-black">{business.name}</p>
                    <p className="text-txtsecondary mt-0.5 print:text-gray-500">Owner Contact: {authUser.whatsappNumber}</p>
                    <p className="text-txtsecondary print:text-gray-500">Business ID: {business.id}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-txtsecondary uppercase tracking-wider text-[10px] mb-1.5 print:text-gray-600">Payment Method</h4>
                    <p className="font-extrabold text-[#10b981] print:text-black">Manual EFT / Bank Transfer</p>
                    <p className="text-[11px] text-txtsecondary print:text-gray-500">Status: <span className="text-accent-amber font-extrabold uppercase">Pending Activation</span></p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-divider rounded-2xl overflow-hidden print:border-gray-300">
                  <table className="w-full text-left text-xs text-txtprimary print:text-black">
                    <thead className="bg-hover/50 border-b border-divider uppercase text-[9px] tracking-wider text-txtsecondary print:bg-gray-100 print:border-gray-300">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Period</th>
                        <th className="p-3 text-right">Amount (ZAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider font-semibold print:divide-gray-200">
                      <tr>
                        <td className="p-3">
                          <p className="font-extrabold">Tolla Premium Subscription Plan - {selectedBranchCount} Store Location(s)</p>
                          <p className="text-[10px] text-txtsecondary mt-0.5 print:text-gray-500">
                            Unlocks advanced metrics, customer privacy masking controls, CSV logs export, and timeline events logs for {selectedBranchCount} branches.
                          </p>
                        </td>
                        <td className="p-3 text-center font-mono">30 Days</td>
                        <td className="p-3 text-right font-bold">R{totalVal.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-hover/20 font-bold print:bg-gray-50">
                        <td colSpan={2} className="p-3 text-right text-txtsecondary print:text-gray-600">Subtotal:</td>
                        <td className="p-3 text-right">R{totalVal.toFixed(2)}</td>
                      </tr>
                      <tr className="font-bold">
                        <td colSpan={2} className="p-3 text-right text-txtsecondary print:text-gray-600">VAT (0%):</td>
                        <td className="p-3 text-right">R0.00</td>
                      </tr>
                      <tr className="bg-hover/40 border-t border-divider font-black text-sm print:bg-gray-100 print:border-gray-300">
                        <td colSpan={2} className="p-3 text-right text-txtprimary print:text-black">Total Due:</td>
                        <td className="p-3 text-right text-[#10b981] print:text-black">R{totalVal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Banking Transfer details */}
                <div className="p-5 rounded-2xl bg-hover/40 border border-divider text-xs space-y-2.5 print:border-gray-300 print:bg-gray-50">
                  <h4 className="font-black text-txtprimary uppercase tracking-wider text-[10px] print:text-black">🏦 Official Banking Details</h4>
                  <div className="grid grid-cols-2 gap-y-1.5 text-txtsecondary print:text-gray-700">
                    <div>Bank Name: <span className="font-bold text-txtprimary print:text-black">{invoiceConfig.bankName}</span></div>
                    <div>Account Holder: <span className="font-bold text-txtprimary print:text-black">{invoiceConfig.accountHolder}</span></div>
                    <div>Account Number: <span className="font-bold text-txtprimary print:text-black font-mono">{invoiceConfig.accountNumber}</span></div>
                    <div>Branch Code: <span className="font-bold text-txtprimary print:text-black font-mono">{invoiceConfig.branchCode}</span></div>
                    <div className="col-span-2 mt-1.5 p-2 bg-[#10b981]/5 border border-[#10b981]/25 text-[#10b981] rounded-lg font-bold print:border-none">
                      Reference: <span className="font-black font-mono text-sm tracking-wider select-all">Tolla-{business.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-txtsecondary italic text-center leading-relaxed print:text-gray-500">
                  Please make bank transfer utilizing the reference above. Email proof of payment or message the Admin on WhatsApp for instant counter activation.
                </div>
              </div>

              {/* Modal Actions (hidden on print) */}
              <div className="px-6 py-5 border-t border-divider bg-hover/20 flex flex-col sm:flex-row gap-3 justify-end print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-3 rounded-xl border border-divider bg-panel hover:bg-hover text-txtprimary text-xs font-bold transition-all cursor-pointer"
                >
                  Print / Download Invoice PDF
                </button>
                <a 
                  href={`https://api.whatsapp.com/send?phone=+27823456789&text=${encodeURIComponent(
                    `Hello Tolla Admin! I want to activate the Premium Plan for my business: "${business.name}" (Slug: ${business.slug}) configuration to ${selectedBranchCount} branch locations (R${totalVal}/mo). Phone Contact: ${authUser.whatsappNumber}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl font-bold bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  Send Payment Proof on WhatsApp
                </a>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notification Alert Overlay */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in flex items-center gap-3 px-4.5 py-3 rounded-2xl border border-divider bg-panel shadow-2xl max-w-sm">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-accent-primary shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-accent-red shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />}
          <p className="text-xs font-semibold text-txtprimary leading-relaxed">{toast.message}</p>
        </div>
      )}

    </div>
  );
};
