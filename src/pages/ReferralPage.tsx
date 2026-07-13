import React, { useState, useEffect } from 'react';
import { EasyRewardService } from '../services/EasyRewardService';
import { Business, Location, Customer, Promotion, Review } from '../types';
import { Logo } from '../components/Logo';
import { 
  Sparkles, Award, MapPin, Phone, MessageCircle, Star, 
  AlertTriangle, X, CheckCircle2, Copy, Clock, ExternalLink, Share2
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

interface ReferralPageProps {
  referralCode: string;
  businessSlug?: string;
  initialView?: 'referrer' | 'friend';
  onNavigate: (route: string) => void;
}

const formatPhoneDisplay = (numStr: string) => {
  if (!numStr) return '';
  const clean = numStr.replace(/\D/g, '');
  if (clean.startsWith('27') && clean.length === 11) {
    return `+27 ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  if (clean.startsWith('0') && clean.length === 10) {
    return `+27 ${clean.slice(1, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  if (numStr.startsWith('+')) return numStr;
  return `+${numStr}`;
};

const formatTelUrl = (numStr: string) => {
  if (!numStr) return '';
  const clean = numStr.replace(/\D/g, '');
  if (clean.startsWith('0') && clean.length === 10) {
    return `+27${clean.slice(1)}`;
  }
  return clean.startsWith('27') ? `+${clean}` : `+27${clean}`;
};

const formatWaUrl = (numStr: string) => {
  if (!numStr) return '';
  const clean = numStr.replace(/\D/g, '');
  if (clean.startsWith('0') && clean.length === 10) {
    return `27${clean.slice(1)}`;
  }
  return clean.startsWith('27') ? clean : `27${clean}`;
};

export const ReferralPage: React.FC<ReferralPageProps> = ({ referralCode, businessSlug, initialView = 'referrer', onNavigate }) => {
  const [view, setView] = useState<'referrer' | 'friend'>(initialView);
  const [visitedStores, setVisitedStores] = useState<Array<{
    relationship: CustomerBusiness;
    business: Business;
    location: Location;
    wallets: Wallet[];
    promotions: Promotion[];
  }>>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tollaUser, setTollaUser] = useState<TollaUser | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [copied, setCopied] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Unboxing animations for premium specials spill
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const [isUnwrapping, setIsUnwrapping] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // For referee visit pre-registration
  const [refereePhone, setRefereePhone] = useState('');
  const [refereeEmail, setRefereeEmail] = useState('');
  const [refereeMode, setRefereeMode] = useState<'whatsapp' | 'email'>('whatsapp');
  const [refereeIdValue, setRefereeIdValue] = useState('');
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [customerReferrals, setCustomerReferrals] = useState<Referral[]>([]);

  // For review submission form
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const businesses = await EasyRewardService.getBusinesses();
        let biz = null;
        if (businessSlug) {
          biz = businesses.find(b => b.slug.toLowerCase() === businessSlug.toLowerCase());
        }

        let cust = null;
        if (biz) {
          cust = await EasyRewardService.getCustomerByReferralCodeAndBusiness(referralCode, biz.id);
        }
        
        if (!cust) {
          cust = await EasyRewardService.getCustomerByReferralCode(referralCode);
        }

        if (!cust) return;
        setCustomer(cust);

        // Fetch universal user profile
        const uProfile = await EasyRewardService.getTollaUser(cust.tollaUserId);
        if (uProfile) setTollaUser(uProfile);

        // Fetch wallets for this customer business relationship
        const userWallets = await EasyRewardService.getWallets(cust.id);
        setWallets(userWallets);

        if (!biz) {
          biz = businesses.find(b => b.id === cust.businessId);
        }
        if (!biz) return;
        setBusiness(biz);

        const locations = await EasyRewardService.getLocations(biz.id);
        const urlParams = new URLSearchParams(window.location.search);
        const locParam = urlParams.get('loc');
        const loc = locations.find(l => l.id === locParam) || locations.find(l => l.id === cust.locationId) || locations[0];
        setLocation(loc);
        setAllLocations(locations);

        const promos = await EasyRewardService.getPromotions(biz.id);
        const locPromo = promos.find(p => p.locationIds?.includes(loc.id)) || promos[0] || null;
        setPromotion(locPromo);

        const revs = await EasyRewardService.getReviews(loc.id);
        setApprovedReviews(revs.filter(r => r.isApproved));

        // Fetch referrals to compile stats
        const allRefs = await EasyRewardService.getReferrals(cust.businessId);
        const custRefs = allRefs.filter(r => r.customerBusinessId === cust.id);
        setCustomerReferrals(custRefs);

        // Fetch all customer relationships across all businesses
        const allCusts = await EasyRewardService.getAllCustomerBusinesses();
        const userRelationships = allCusts.filter(c => c.tollaUserId === cust.tollaUserId);
        
        const allBizs = await EasyRewardService.getBusinesses();
        const allLocs = await EasyRewardService.getLocations();
        
        const storesData = [];
        for (const rel of userRelationships) {
          const storeBiz = allBizs.find(b => b.id === rel.businessId);
          if (!storeBiz) continue;
          
          const storeLoc = allLocs.find(l => l.id === rel.locationId) || allLocs.find(l => l.businessId === storeBiz.id);
          if (!storeLoc) continue;
          
          const storeWallets = await EasyRewardService.getWallets(rel.id);
          const storePromotions = await EasyRewardService.getPromotions(storeBiz.id);
          
          storesData.push({
            relationship: rel,
            business: storeBiz,
            location: storeLoc,
            wallets: storeWallets,
            promotions: storePromotions
          });
        }
        setVisitedStores(storesData);

        // Determine view mode dynamically
        const savedUserId = localStorage.getItem('easyreward_tolla_user_id');
        if (savedUserId && (savedUserId === cust.tollaUserId || savedUserId === cust.id)) {
          setView('referrer');
        } else {
          setView('friend');
        }

        // Track page view event
        await EasyRewardService.trackEvent(loc.id, 'page_view', cust.id);
      } catch (err) {
        console.error("Error loading referral page details", err);
      }
    };
    loadDetails();
  }, [referralCode]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/r/${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!business || !location) return;
    
    if (location) {
      await EasyRewardService.trackEvent(location.id, 'share_click', customer?.id);
    }

    const shareUrl = `${window.location.origin}/r/${referralCode}`;
    const hasFriendDisc = business.friendReward && business.friendReward !== 'none' && business.friendReward !== 'No special reward';
    const text = hasFriendDisc
      ? `Hey! Check out ${business.name} (${location.name}). Highly recommended! Here is a discount code for ${business.friendReward}: ${referralCode}. See details and directions here:`
      : `Hey! Check out ${business.name} (${location.name}). Highly recommended! Join the rewards program to start earning. See details and directions here:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Referral Discount for ${business.name}`,
          text: text,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log("Web Share dismissed or blocked", err);
      }
    }

    // Direct WhatsApp fallback: opens WhatsApp directly rather than silently copying to clipboard
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !location || !business) return;

    setClaimError('');

    // Pre-validations
    const activeMethod = location.verificationMethod || business.verificationMethod || 'code';
    const activeLabel = location.customIdentifierName || business.customIdentifierLabel || 'Identifier';

    if (activeMethod === 'code_phone' || activeMethod === 'code_identifier') {
      if (refereeMode === 'whatsapp' && !refereePhone.trim()) {
        setClaimError("WhatsApp number is required to claim the discount.");
        return;
      }
      if (refereeMode === 'email' && !refereeEmail.trim()) {
        setClaimError("Email address is required to claim the discount.");
        return;
      }
    }
    if (activeMethod === 'code_identifier' && !refereeIdValue.trim()) {
      setClaimError(`${activeLabel} is required to claim the discount.`);
      return;
    }

    try {
      await EasyRewardService.createReferral({
        customerBusinessId: customer.id,
        refereePhone: refereeMode === 'whatsapp' ? refereePhone.trim() : undefined,
        refereeEmail: refereeMode === 'email' ? refereeEmail.trim() : undefined,
        refereeIdentifier: refereeIdValue.trim() || undefined,
        discountCode: referralCode,
        locationId: location.id
      });
      setClaimSubmitted(true);
    } catch (err) {
      console.error(err);
      setClaimError("Failed to claim the discount code. Please try again.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !newReviewName) return;

    await EasyRewardService.createReview({
      locationId: location.id,
      customerName: newReviewName,
      rating: newReviewRating,
      comment: newReviewComment
    });

    setReviewSubmitted(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSubmitted(false);
      setNewReviewName('');
      setNewReviewComment('');
    }, 2500);
  };

  // Helper to calculate promotional discounts dynamically
  const calculateDiscount = (price: number, promo: Promotion) => {
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
    const randMatch = promo.title.match(/R\s*(\d+)/i) || promo.description.match(/R\s*(\d+)/i);
    if (randMatch) {
      const amt = parseFloat(randMatch[1]);
      return {
        discounted: Math.max(0, price - amt),
        savings: amt,
        text: `R${amt} Off`
      };
    }
    const defaultPct = 15;
    const discount = (price * defaultPct) / 100;
    return {
      discounted: Math.max(0, price - discount),
      savings: discount,
      text: `${defaultPct}% Off`
    };
  };

  if (!business || !location || !customer) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-6 rounded-2xl max-w-sm border border-divider space-y-4">
          <AlertTriangle className="w-8 h-8 text-accent-red mx-auto" />
          <p className="text-txtsecondary text-sm">Referral code not found or invalid.</p>
          <button 
            onClick={() => onNavigate('home')}
            className="px-4 py-2 bg-panel hover:bg-hover rounded-lg text-xs border border-divider text-txtprimary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-txtprimary flex flex-col justify-between selection:bg-accent-primary selection:text-white">
      
      {/* Test / Preview Mode Switcher */}
      <div className="bg-panel/80 border-b border-divider px-4 py-2 flex justify-between items-center text-xs sticky top-0 z-50 backdrop-blur">
        <span className="text-txtsecondary font-mono">Demo View Switch:</span>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('referrer')}
            className={`px-3 py-1 rounded-md transition-all ${view === 'referrer' ? 'bg-accent-primary text-white font-bold' : 'bg-canvas hover:bg-hover border border-divider text-txtsecondary'}`}
          >
            Referrer View (Sharing)
          </button>
          <button 
            onClick={() => setView('friend')}
            className={`px-3 py-1 rounded-md transition-all ${view === 'friend' ? 'bg-accent-primary text-white font-bold' : 'bg-canvas hover:bg-hover border border-divider text-txtsecondary'}`}
          >
            Friend View (Redeeming)
          </button>
        </div>
      </div>

      {/* Hero Banner with Glass Overlays */}
      <div 
        className="h-64 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${location.bannerUrl || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
        
        {/* Business details floating on banner */}
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div className="flex items-center gap-4">
            {business.logoUrl ? (
              <img 
                src={business.logoUrl} 
                alt={business.name} 
                className="w-16 h-16 rounded-xl border border-divider object-cover bg-panel"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl border border-divider bg-hover flex items-center justify-center">
                <Logo className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-white">{business.name}</h1>
              <p className="text-xs text-brand-400 font-semibold">{location.name} • {business.industry}</p>
            </div>
          </div>

          <div className="hidden sm:block glass-card px-3 py-1.5 rounded-lg text-xs border border-white/15">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Open Now
          </div>
        </div>
      </div>

      {/* Active Promotion Hero - Prominently Displayed at the Top */}
      {promotion && (
        <div className="max-w-4xl w-full mx-auto px-6 pt-8 animate-fade-in relative z-20">
          <style>{`
            @keyframes box-shake {
              0%, 100% { transform: rotate(0deg) scale(1); }
              15%, 45%, 75% { transform: rotate(-2deg) scale(1.01); }
              30%, 60%, 90% { transform: rotate(2deg) scale(1.01); }
            }
            @keyframes float-box {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
            @keyframes lid-lift {
              0% { transform: translateY(0) rotate(0); opacity: 1; }
              100% { transform: translateY(-40px) rotate(-8deg); opacity: 0; }
            }
            @keyframes spill-card {
              0% { transform: scale(0.9) translateY(20px); opacity: 0; filter: blur(4px); }
              100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
            }
            @keyframes glow-reveal {
              0% { opacity: 0; transform: scale(0.8) rotate(0deg); }
              50% { opacity: 0.7; }
              100% { opacity: 0; transform: scale(1.4) rotate(180deg); }
            }
            @keyframes confetti-fall {
              0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
              100% { transform: translate(var(--tw-x), var(--tw-y)) rotate(var(--tw-r)); opacity: 0; }
            }
            @keyframes balloon-float {
              0% { transform: translateY(100vh) translateX(0) scale(0.5); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(-120vh) translateX(var(--tw-x)) scale(1.1); opacity: 0; }
            }
            .animate-float-box { animation: float-box 3s ease-in-out infinite; }
            .animate-shake-box { animation: box-shake 0.5s ease-in-out; }
            .animate-lid-lift { animation: lid-lift 0.6s forwards cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            .animate-spill-card { animation: spill-card 0.7s 0.1s forwards cubic-bezier(0.175, 0.885, 0.32, 1.15); }
            .animate-glow-reveal { animation: glow-reveal 1s forwards ease-out; }
            .animate-confetti { animation: confetti-fall var(--tw-d, 1.5s) forwards cubic-bezier(0.1, 0.8, 0.3, 1); }
            .animate-balloon { animation: balloon-float var(--tw-d, 4s) forwards cubic-bezier(0.2, 0.6, 0.4, 1); }
          `}</style>

          {!isUnwrapped ? (
            <div 
              onClick={() => {
                if (isUnwrapping) return;
                setIsUnwrapping(true);
                setTimeout(() => {
                  setIsUnwrapped(true);
                  setShowCelebration(true);
                  setTimeout(() => {
                    setShowCelebration(false);
                  }, 4500); // end celebration particles render after 4.5s
                }, 600); // Wait for open & reveal animations to finish
              }}
              className={`cursor-pointer max-w-lg mx-auto p-8 rounded-3xl border border-amber-500/35 bg-gradient-to-b from-[#1b1c24]/90 via-[#181920]/95 to-[#13141a]/98 text-center shadow-2xl relative overflow-hidden transition-all duration-300 group hover:border-amber-400 ${
                isUnwrapping ? 'animate-shake-box' : 'animate-float-box'
              }`}
            >
              {/* Golden circular glow backdrops */}
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent -z-10 group-hover:from-amber-500/15 transition-all duration-500" />
              
              {/* Sparkles / Gold Core backdrop when opening */}
              {isUnwrapping && (
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                  <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 filter blur-xl animate-glow-reveal" />
                </div>
              )}

              {/* Dynamic Gift Box Rendering */}
              <div className="w-36 h-36 mx-auto relative mb-6 flex flex-col items-center justify-center">
                {/* Lid container */}
                <div className={`w-32 h-10 absolute top-4 z-20 transition-all ${isUnwrapping ? 'animate-lid-lift' : 'group-hover:translate-y-[-4px]'}`}>
                  {/* Golden Bow Ribbon Loop Left */}
                  <div className="absolute left-[36%] bottom-[80%] w-7 h-8 rounded-full border-[3px] border-amber-400 bg-gradient-to-br from-amber-500 to-yellow-300 origin-bottom-right transform rotate-[-35deg]" />
                  {/* Golden Bow Ribbon Loop Right */}
                  <div className="absolute right-[36%] bottom-[80%] w-7 h-8 rounded-full border-[3px] border-amber-400 bg-gradient-to-bl from-amber-500 to-yellow-300 origin-bottom-left transform rotate-[35deg]" />
                  
                  {/* Lid Lid */}
                  <div className="w-full h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 rounded-lg shadow-md border border-amber-500/40 relative overflow-hidden">
                    {/* Horizontal ribbon band */}
                    <div className="absolute top-0 bottom-0 left-[45%] right-[45%] bg-gradient-to-r from-amber-500 to-yellow-400 border-x border-amber-600/30" />
                  </div>
                </div>

                {/* Box body */}
                <div className="w-28 h-20 bg-gradient-to-r from-amber-700 via-amber-500 to-yellow-400 rounded-b-xl border border-amber-600/30 relative overflow-hidden shadow-lg z-10 mt-10">
                  {/* Cross ribbon band */}
                  <div className="absolute top-0 bottom-0 left-[43%] right-[43%] bg-gradient-to-r from-amber-500 to-yellow-400 border-x border-amber-600/30" />
                  
                  {/* Soft inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                </div>
              </div>

              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[10px] font-black uppercase tracking-wider animate-pulse">
                  🎁 Unwrapped gift shared
                </span>
                <h3 className="text-lg font-black text-white tracking-tight">You received a special offer!</h3>
                <p className="text-xs text-txtsecondary max-w-sm mx-auto leading-relaxed">
                  A premium promotional reward has been unlocked by your friend. Tap the box above to unwrap the details.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-extrabold text-[#10b981] group-hover:underline">
                    Tap to open & reveal ➔
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Open box: Spills out the promo details with pop scale entry */
            <div className="animate-spill-card">
              <div className="glass-panel overflow-hidden border border-amber-500/35 rounded-3xl bg-gradient-to-tr from-amber-950/10 via-slate-900/40 to-slate-950/70 flex flex-col md:flex-row items-center gap-6 p-6 shadow-2xl relative group">
                {promotion.imageUrl && (
                  <img 
                    src={promotion.imageUrl} 
                    alt={promotion.title} 
                    className="w-full md:w-44 h-32 object-cover rounded-2xl border border-amber-500/20 shrink-0 bg-slate-900 shadow-md"
                  />
                )}
                <div className="space-y-2.5 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-500 text-[9px] font-black uppercase tracking-wider">
                      ✨ Golden Premium Deal
                    </span>
                    {promotion.expiryDate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[8px] font-bold">
                        🕒 Active Offer
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight leading-snug">{promotion.title}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-xl">{promotion.description}</p>
                  {promotion.expiryDate && (
                    <p className="text-[9px] text-slate-500 font-semibold">
                      Offer valid until: {new Date(promotion.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {/* Action Badge & Google Maps Location Link */}
                <div className="flex flex-col items-center md:items-end justify-center gap-2.5 shrink-0 w-full md:w-auto mt-2 md:mt-0 select-none">
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 border border-amber-300/45 text-center w-full md:w-auto">
                    Claim Unlocked
                  </span>
                  
                  <a 
                    href={location.googleMapsLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-hover hover:bg-slate-800/80 border border-divider hover:border-amber-500/45 text-txtprimary hover:text-white transition-all text-[10px] font-bold group/loc shadow-lg w-full md:w-auto"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-500 group-hover/loc:scale-110 transition-transform" />
                    <span>Location: {location.name}</span>
                    <ExternalLink className="w-3 h-3 text-txtsecondary group-hover/loc:text-white transition-all" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Balloons & Confetti Burst Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Balloons */}
          {[
            { color: 'bg-red-500', x: -80, delay: '0s', duration: '3.8s', left: '15%' },
            { color: 'bg-yellow-400', x: 60, delay: '0.3s', duration: '4.2s', left: '30%' },
            { color: 'bg-emerald-500', x: -40, delay: '0.1s', duration: '4s', left: '45%' },
            { color: 'bg-blue-500', x: 80, delay: '0.5s', duration: '3.6s', left: '60%' },
            { color: 'bg-purple-500', x: -50, delay: '0.2s', duration: '4.5s', left: '75%' },
            { color: 'bg-pink-500', x: 30, delay: '0.4s', duration: '3.9s', left: '85%' },
          ].map((b, i) => (
            <div 
              key={`b-${i}`}
              className={`fixed bottom-[-100px] w-10 h-14 rounded-full ${b.color} shadow-lg shadow-black/10 flex flex-col items-center justify-end animate-balloon`}
              style={{
                left: b.left,
                '--tw-x': `${b.x}px`,
                '--tw-d': b.duration,
                animationDelay: b.delay,
              } as React.CSSProperties}
            >
              {/* Balloon knot */}
              <div className={`w-3.5 h-3.5 ${b.color} rotate-45 transform translate-y-1.5 rounded-sm`} />
              {/* Balloon string */}
              <div className="w-[1.5px] h-12 bg-white/40 transform translate-y-14" />
            </div>
          ))}

          {/* Confetti Sparks */}
          {[
            { color: 'bg-red-500', x: 120, y: -240, r: 360, delay: '0s' },
            { color: 'bg-yellow-400', x: -140, y: -280, r: -180, delay: '0.05s' },
            { color: 'bg-emerald-500', x: 80, y: -320, r: 240, delay: '0.1s' },
            { color: 'bg-blue-400', x: -100, y: -200, r: -360, delay: '0.02s' },
            { color: 'bg-purple-500', x: 180, y: -180, r: 180, delay: '0.15s' },
            { color: 'bg-pink-400', x: -60, y: -300, r: 540, delay: '0.08s' },
            { color: 'bg-amber-400', x: 150, y: -290, r: -240, delay: '0.12s' },
            { color: 'bg-cyan-400', x: -180, y: -220, r: 120, delay: '0.03s' },
            
            { color: 'bg-red-400', x: 60, y: -190, r: -180, delay: '0.2s' },
            { color: 'bg-yellow-300', x: -70, y: -210, r: 360, delay: '0.18s' },
            { color: 'bg-emerald-400', x: 110, y: -260, r: -120, delay: '0.22s' },
            { color: 'bg-blue-300', x: -120, y: -250, r: 240, delay: '0.25s' },
          ].map((c, i) => (
            <div 
              key={`c-${i}`}
              className={`absolute left-1/2 top-1/2 w-2.5 h-2.5 rounded-sm ${c.color} animate-confetti`}
              style={{
                '--tw-x': `${c.x}px`,
                '--tw-y': `${c.y}px`,
                '--tw-r': `${c.r}deg`,
                '--tw-d': '1.8s',
                animationDelay: c.delay,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 grid md:grid-cols-5 gap-8">
        
        {/* Left/Middle Column (Primary Referral UI) */}
        <div className="md:col-span-3 space-y-6">
          
          {/* View Mode 1: REFERRER VIEW (Sharing Dashboard) */}
          {view === 'referrer' ? (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="glass-panel p-6 rounded-2xl shadow-xl border border-divider space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/25 flex items-center justify-center font-extrabold text-brand-400 text-sm">
                      👤
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-txtprimary">Tolla Rewards Wallet</h3>
                      <p className="text-[10px] text-txtsecondary">{tollaUser?.phoneNumber || tollaUser?.emailAddress || 'My Profile'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-txtsecondary uppercase tracking-widest block">Universal ID</span>
                    <span className="text-xs font-mono font-extrabold text-brand-400 select-all">{tollaUser?.id || referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Visited Businesses & Wallets list */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-txtsecondary tracking-wider">My Joined Businesses &amp; Wallets</h3>
                
                {visitedStores.length === 0 ? (
                  <div className="glass-panel p-6 text-center text-xs text-txtsecondary border border-divider rounded-2xl">
                    🎁 You haven't visited any businesses yet. Scan a store QR code to earn rewards!
                  </div>
                ) : (
                  visitedStores.map((store, idx) => {
                    const cashWallet = store.wallets.find(w => w.rewardType === 'cash');
                    const cashBal = cashWallet ? cashWallet.balance : 0;
                    
                    const otherWallet = store.wallets.find(w => w.rewardType !== 'cash' && w.balance > 0);
                    
                    return (
                      <div key={idx} className="glass-panel p-6 rounded-2xl border border-divider space-y-4">
                        
                        {/* Store info header */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-txtprimary">{store.business.name}</h4>
                            <p className="text-[10px] text-txtsecondary flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> {store.location.address}
                            </p>
                          </div>
                          
                          {/* Wallet Badge */}
                          <div className="text-right shrink-0">
                            <span className="text-[8px] font-bold text-txtsecondary uppercase block tracking-wider">My Balance</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[#10b981] text-xs font-black">
                              {cashBal > 0 ? `R${cashBal}` : (otherWallet ? otherWallet.description : 'R0')}
                            </span>
                          </div>
                        </div>

                        {/* Direct Directions button based on Address */}
                        <div className="flex gap-2">
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.location.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-100 border border-divider text-[10px] font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 flex items-center gap-1 transition-all"
                          >
                            <MapPin className="w-3 h-3 text-emerald-500" /> Get Directions
                          </a>
                          <a 
                            href={`tel:${store.location.phoneNumber}`}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 border border-divider text-[10px] font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-900 flex items-center gap-1 transition-all"
                          >
                            <Phone className="w-3 h-3 text-slate-400" /> Call Store
                          </a>
                        </div>

                        {/* List of active specials & sharing CTAs for this business */}
                        <div className="space-y-3 pt-2.5 border-t border-divider">
                          <p className="text-[9px] uppercase tracking-wider font-extrabold text-txtsecondary">Specials You Can Share &amp; Earn:</p>
                          
                          {store.promotions.length === 0 ? (
                            <div className="p-4 rounded-xl bg-hover border border-divider flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-txtprimary">Invite Friends</p>
                                <p className="text-[10px] text-txtsecondary">Get {store.business.referrerReward} when they join.</p>
                              </div>
                              <button 
                                onClick={handleShare}
                                className="px-3.5 py-2 rounded-xl bg-[#10b981] hover:bg-[#0e9f6e] text-white text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all shadow-md"
                              >
                                <Share2 className="w-3.5 h-3.5" /> Share Invite
                              </button>
                            </div>
                          ) : (
                            store.promotions.map((promo, pIdx) => {
                              const shareText = `Hey! Grab this awesome deal at ${store.business.name}: "${promo.title}". Claim your reward using my link: ${window.location.origin}/r/${referralCode}`;
                              return (
                                <div key={pIdx} className="p-4 rounded-xl bg-hover border border-divider flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="space-y-1">
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] bg-brand-500/10 border border-brand-500/20 text-[#10b981] font-bold uppercase">
                                      🎁 Unlocked Special
                                    </span>
                                    <p className="text-xs font-black text-txtprimary">{promo.title}</p>
                                    <p className="text-[10px] text-txtsecondary font-medium leading-relaxed max-w-md">{promo.description}</p>
                                  </div>
                                  <a 
                                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f72] text-white text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md select-none decoration-transparent shrink-0"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" /> Share on WhatsApp
                                  </a>
                                </div>
                              );
                            })
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : (
            
            <div className="glass-panel p-6 rounded-2xl shadow-xl border border-divider space-y-6">
              {refereeMode !== 'code' ? (
                <div className="space-y-5 text-center">
                  <Award className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                  <h2 className="text-xl font-bold font-sans text-white">
                    {business.friendReward === 'none' || business.friendReward === 'No special reward' ? 'Join Rewards Program' : 'Claim Your Reward'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {business.friendReward === 'none' || business.friendReward === 'No special reward'
                      ? `Join **${business.name}** Rewards program on WhatsApp and start earning rewards for referring friends!`
                      : `Join **${business.name}** Rewards program on WhatsApp to claim your discount.`}
                  </p>

                  {/* Reward Info */}
                  <div className="bg-brand-500/10 border border-brand-500/20 p-5 rounded-xl text-center space-y-1">
                    {business.friendReward === 'none' || business.friendReward === 'No special reward' ? (
                      <>
                        <p className="text-xs font-semibold uppercase text-brand-400 tracking-wider">Advocate Reward</p>
                        <p className="text-sm font-bold text-white">Earn {business.referrerReward} for every friend checkout!</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase text-brand-400 tracking-wider">Your Discount Choice</p>
                        {business.friendReward.includes(' | ') ? (
                          <div className="flex flex-col gap-1.5 pt-1.5 items-center">
                            {business.friendReward.split(' | ').map((gift, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-400/10 border border-brand-400/25 text-brand-300 text-xs font-bold font-sans">
                                🎁 Option #{idx + 1}: {gift}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xl font-black text-white">{business.friendReward}</p>
                        )}
                      </>
                    )}
                  </div>

                  <a 
                    href={`https://wa.me/27829990000?text=Start%20${encodeURIComponent(business.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-xl font-bold bg-[#00a884] hover:bg-[#008f72] text-white shadow-xl transition-all text-xs flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer decoration-transparent select-none"
                  >
                    <MessageCircle className="w-4 h-4 fill-white stroke-none" />
                    Claim Reward on WhatsApp
                  </a>

                  <button 
                    type="button"
                    onClick={() => setRefereeMode('code')}
                    className="w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-all cursor-pointer font-bold bg-transparent border-none outline-none mt-2"
                  >
                    Or generate local web redemption code
                  </button>
                </div>
              ) : !claimSubmitted ? (
                // Claim Form Mode
                <form onSubmit={handleClaimReferral} className="space-y-5">
                  <div className="text-center">
                    <Award className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                    <h2 className="text-xl font-bold font-sans text-white">Get Your Discount Code</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your details to get your discount code for **{business.name}**.
                    </p>
                  </div>

                  {claimError && (
                    <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs text-center animate-shake">
                      {claimError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Mode selection tabs */}
                    {(((location && location.verificationMethod) || business.verificationMethod) !== 'code') && (
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setRefereeMode('whatsapp')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            refereeMode === 'whatsapp' ? 'bg-brand-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => setRefereeMode('email')}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            refereeMode === 'email' ? 'bg-brand-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Email
                        </button>
                      </div>
                    )}

                    {/* WhatsApp Input */}
                    {refereeMode === 'whatsapp' ? (
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-400 font-semibold text-left">Your WhatsApp Number *</label>
                        <input 
                          type="tel" 
                          value={refereePhone}
                          onChange={(e) => setRefereePhone(e.target.value)}
                          placeholder="e.g. +27821234567"
                          className="w-full px-4 py-3 rounded-xl glass-input text-xs text-center"
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-400 font-semibold text-left">Your Email Address *</label>
                        <input 
                          type="email" 
                          value={refereeEmail}
                          onChange={(e) => setRefereeEmail(e.target.value)}
                          placeholder="e.g. friend@domain.com"
                          className="w-full px-4 py-3 rounded-xl glass-input text-xs text-center"
                          required
                        />
                      </div>
                    )}

                    {/* Option 3 Custom Identifier input */}
                    {(((location && location.verificationMethod) || business.verificationMethod) === 'code_identifier') && (
                      <div className="space-y-1">
                        <label className="block text-xs text-slate-400 font-semibold text-left">Your {(location && location.customIdentifierName) || business.customIdentifierLabel || 'Identifier'} *</label>
                        <input 
                          type="text" 
                          value={refereeIdValue}
                          onChange={(e) => setRefereeIdValue(e.target.value)}
                          placeholder={`Enter your ${((location && location.customIdentifierName) || business.customIdentifierLabel || 'identifier').toLowerCase()}`}
                          className="w-full px-4 py-3 rounded-xl glass-input text-xs text-center"
                          required
                        />
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-xl transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    Get Discount Code <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                // Code Display Mode
                <>
                  <div className="text-center">
                    <Award className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                    <h2 className="text-xl font-bold font-sans text-white">
                      {business.friendReward === 'none' || business.friendReward === 'No special reward' ? 'Join Rewards Program' : 'You Got a Discount!'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {business.friendReward === 'none' || business.friendReward === 'No special reward'
                        ? 'Join the rewards program to start referring friends and earning rewards!'
                        : claimSubmitted 
                          ? 'Discount code ready! Show this code when you pay.' 
                          : 'Your friend shared a discount code. Show this when you pay to get your discount.'}
                    </p>
                  </div>

                  {/* Reward Info */}
                  <div className="bg-brand-500/10 border border-brand-500/20 p-5 rounded-xl text-center space-y-1">
                    {business.friendReward === 'none' || business.friendReward === 'No special reward' ? (
                      <>
                        <p className="text-xs font-semibold uppercase text-brand-400 tracking-wider">Advocate Reward</p>
                        <p className="text-sm font-bold text-white">Earn {business.referrerReward} for every friend checkout!</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase text-brand-400 tracking-wider">Your Discount Choice</p>
                        {business.friendReward.includes(' | ') ? (
                          <div className="flex flex-col gap-1.5 pt-1.5 items-center">
                            {business.friendReward.split(' | ').map((gift, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-400/10 border border-brand-400/25 text-brand-300 text-xs font-bold font-sans">
                                🎁 Option #{idx + 1}: {gift}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xl font-black text-white">{business.friendReward}</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Discount Code Activation Panel */}
                  <div className="bg-[#10b981]/5 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative">
                    <CheckCircle2 className="w-10 h-10 text-[#10b981] mb-2" />
                    <p className="text-[10px] text-[#10b981] uppercase tracking-widest font-bold mb-1">Discount Activated!</p>
                    <span className="text-sm font-black text-txtprimary leading-normal">
                      {refereePhone ? `Mobile Number Registered: ${refereePhone}` : (refereeEmail ? `Email Registered: ${refereeEmail}` : 'Your contact has been registered!')}
                    </span>
                    <span className="text-[10px] text-txtsecondary mt-3 leading-relaxed max-w-sm">
                      Simply mention your registered phone/email to the cashier when checking out at the storefront to claim your discount.
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <a 
                      href={location.googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700/50"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" /> Get Directions
                    </a>
                    <a 
                      href={`tel:${location.phoneNumber}`}
                      className="flex-1 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 text-center text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-700/50"
                    >
                      <Phone className="w-4 h-4 text-slate-400" /> Call Business
                    </a>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dynamic Service Catalog Storefront Menu */}
          {location.services && location.services.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold font-sans text-slate-100">Our Services & Price List</h3>
                <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider">Store Menu</span>
              </div>

              <div className="grid sm:grid-cols-1 gap-3">
                {location.services.map(svc => {
                  const isLinkedToPromo = promotion && svc.applicablePromoIds.includes(promotion.id);
                  const calc = promotion ? calculateDiscount(svc.price, promotion) : null;

                  return (
                    <div key={svc.id} className="p-4 rounded-xl bg-slate-950/40 border border-slate-850/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={svc.imageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop&q=80'} 
                          alt={svc.name} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop&q=80';
                          }}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
                        />
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{svc.name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {isLinkedToPromo && calc ? (
                              <span className="flex items-center gap-1.5">
                                <span className="line-through text-slate-500">R{svc.price}</span>
                                <span className="text-[#10b981] font-bold">R{calc.discounted.toFixed(0)}</span>
                              </span>
                            ) : (
                              <span>R{svc.price}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {isLinkedToPromo && calc && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold uppercase tracking-wide">
                          {calc.text} Deal
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location Gallery & Promotions */}
          {location.galleryUrls && location.galleryUrls.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-sans text-slate-200">Gallery Photos</h3>
              <div className="grid grid-cols-3 gap-3">
                {location.galleryUrls.map((url, index) => (
                  <img 
                    key={index} 
                    src={url} 
                    alt={`Location gallery ${index}`}
                    className="w-full h-24 object-cover rounded-xl border border-slate-800/60 hover:opacity-85 transition-all cursor-pointer"
                  />
                ))}
              </div>
            </div>
          )}


        </div>

        {/* Right Column (Reviews, Hours, Maps Side Panel) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Redeemable Locations */}
          <div className="space-y-4">
            <h3 className="text-sm font-black font-sans text-txtsecondary uppercase tracking-wider">Redeemable Locations</h3>
            
            <div className="space-y-4">
              {allLocations.filter(loc => {
                const ids = business?.redeemableLocationIds ?? [];
                return ids.length === 0 || ids.includes(loc.id);
              }).map(loc => {
                const isSpecialActive = promotion && promotion.locationIds?.includes(loc.id);
                return (
                  <div key={loc.id} className="glass-panel p-5 rounded-2xl border border-divider space-y-4 hover:border-brand-500/30 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-txtprimary text-sm">{loc.name}</h4>
                        {isSpecialActive && (
                          <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/30 text-brand-400 text-[9px] font-black uppercase tracking-wider">
                            🏷️ Special Active
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2.5 text-xs text-txtsecondary pt-1">
                        <div className="flex gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-txtsecondary leading-relaxed">{loc.address}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <a 
                            href={`tel:${formatTelUrl(loc.phoneNumber)}`}
                            className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> 
                            {formatPhoneDisplay(loc.phoneNumber)}
                          </a>
                          <a 
                            href={`https://wa.me/${formatWaUrl(loc.whatsappNumber)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#00a884]" /> 
                            {formatPhoneDisplay(loc.whatsappNumber)}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(loc.address)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-center text-xs transition-all flex items-center justify-center gap-1.5 border border-divider"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Google Map Directions
                      </a>
                    </div>

                    {/* Collapsible Opening Hours */}
                    <details className="group pt-1">
                      <summary className="text-[10px] text-txtsecondary group-hover:text-txtprimary font-bold uppercase tracking-wider cursor-pointer list-none flex items-center justify-between transition-colors">
                        <span>Show Opening Hours</span>
                        <span className="transition-transform group-open:rotate-180 text-[8px]">▼</span>
                      </summary>
                      <div className="mt-2 space-y-1.5 pt-2 border-t border-divider text-[11px] animate-fade-in">
                        {Object.entries(loc.openingHours || {}).map(([day, hrs]) => (
                          <div key={day} className="flex justify-between text-txtsecondary">
                            <span>{day}</span>
                            <span className={hrs.closed ? 'text-red-500 font-medium' : 'text-txtprimary'}>
                              {hrs.closed ? 'Closed' : `${hrs.open} - ${hrs.close}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approved Reviews List */}
          <div className="glass-panel p-6 rounded-2xl border border-divider space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold font-sans text-txtprimary">Customer Reviews</h3>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="text-[10px] text-[#10b981] hover:text-[#0e9f6e] font-semibold bg-transparent border-none cursor-pointer"
              >
                + Write Review
              </button>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {approvedReviews.length === 0 ? (
                <p className="text-xs text-txtsecondary text-center py-4 italic">No approved reviews yet.</p>
              ) : (
                approvedReviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-hover border border-divider space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-txtprimary">{rev.customerName}</span>
                      {renderStars(rev.rating)}
                    </div>
                    {rev.comment && <p className="text-[11px] text-txtsecondary leading-relaxed italic">"{rev.comment}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-divider relative shadow-2xl text-slate-800">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h3 className="text-lg font-bold font-sans mb-1 text-slate-900">Write a Review</h3>
            <p className="text-xs text-slate-500 mb-6">Share your feedback with us! All reviews are reviewed by the business owner.</p>

            {reviewSubmitted ? (
              <div className="py-6 text-center text-brand-400 font-medium space-y-2">
                <CheckCircle2 className="w-8 h-8 text-brand-400 mx-auto" />
                <p>Thank you! Your review has been submitted for owner approval.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Your Name *</label>
                  <input 
                    type="text" 
                    value={newReviewName}
                    onChange={(e) => setNewReviewName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Rating (1 to 5 stars) *</label>
                  <select 
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs bg-dark-900"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                    <option value={3}>⭐⭐⭐ (3/5)</option>
                    <option value={2}>⭐⭐ (2/5)</option>
                    <option value={1}>⭐ (1/5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Your Review *</label>
                  <textarea 
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs h-24 resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full py-3 rounded-xl font-bold bg-brand-500 hover:bg-brand-600 text-slate-950 shadow-xl transition-all text-xs"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="py-6 text-center border-t border-slate-900/60 bg-dark-950/40">
        <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
          Powered by <Logo className="w-3.5 h-3.5 inline" /> <span className="font-semibold text-slate-400">Tolla</span>
        </p>
      </div>
    </div>
  );
};
