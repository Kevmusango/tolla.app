import React, { useState, useEffect } from 'react';
import { EasyRewardService } from '../services/EasyRewardService';
import { Business, Location } from '../types';
import { Logo } from '../components/Logo';
import { MapPin, AlertTriangle, Award, ArrowRight } from 'lucide-react';

interface CustomerScanProps {
  businessSlug: string;
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export const CustomerScan: React.FC<CustomerScanProps> = ({ businessSlug, onNavigate }) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [regMode, setRegMode] = useState<'whatsapp' | 'email'>('whatsapp');
  const [optInWhatsApp, setOptInWhatsApp] = useState(true);
  const [optInEmail, setOptInEmail] = useState(false);
  const [consent, setConsent] = useState(false);
  const [customId, setCustomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const businesses = await EasyRewardService.getBusinesses();
        const biz = businesses.find(b => b.slug === businessSlug) || businesses[0]; // fallback
        setBusiness(biz);

        const locations = await EasyRewardService.getLocations(biz.id);
        const queryParams = new URLSearchParams(window.location.search);
        const queryLocId = queryParams.get('loc');
        const loc = locations.find(l => l.id === queryLocId) || locations[0];
        setLocation(loc);

        // Check if registration limit is reached
        const limitCheck = await EasyRewardService.checkLimitEnforced(loc.id, 'registration');
        setIsLimitReached(!limitCheck.allowed);

        // Returning User recognition check
        const savedUserId = localStorage.getItem('easyreward_tolla_user_id');
        if (savedUserId) {
          const existingCust = await EasyRewardService.getCustomerByReferralCode(savedUserId);
          if (existingCust && existingCust.businessId === biz.id) {
            // Instantly transition returning user
            onNavigate('referral-page', { code: savedUserId });
            return;
          }
        }

        // Track Scan view
        await EasyRewardService.trackEvent(loc.id, 'qr_scan');
      } catch (err) {
        console.error("Failed to load business details for scan", err);
      }
    };
    loadDetails();
  }, [businessSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !location) return;

    if (regMode === 'whatsapp' && !phone.trim()) {
      setError('Please enter your WhatsApp number.');
      return;
    }
    if (regMode === 'email' && !email.trim()) {
      setError('Please enter your Email address.');
      return;
    }
    if (!consent) {
      setError('Please check the box to agree to the marketing consent.');
      return;
    }
    if (!optInWhatsApp && !optInEmail) {
      setError('Please select at least one channel to receive updates (WhatsApp or Email).');
      return;
    }

    setIsLoading(true);
    setError('');

    const preferredChannels: ('whatsapp' | 'email')[] = [];
    if (optInWhatsApp) preferredChannels.push('whatsapp');
    if (optInEmail) preferredChannels.push('email');

    try {
      const res = await EasyRewardService.createCustomer({
        businessId: business.id,
        locationId: location.id,
        phoneNumber: regMode === 'whatsapp' ? phone.trim() : undefined,
        emailAddress: regMode === 'email' ? email.trim() : undefined,
        customIdentifier: customId.trim() || undefined,
        marketingConsent: consent,
        preferredChannels
      });

      if (res.error) {
        setError(res.error);
        setIsLimitReached(true);
      } else if (res.customer && res.tollaUser) {
        // Save Tolla User ID to localStorage to auto-recognize them next time!
        localStorage.setItem('easyreward_tolla_user_id', res.tollaUser.id);
        
        // Dispatch Welcome/Invite WhatsApp message automatically using Meta Cloud API
        if (regMode === 'whatsapp' && phone.trim()) {
          const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
          const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
          
          if (phoneId && accessToken) {
            // Normalize phone: remove non-digits, check SA standard prefix if needed
            let cleanedPhone = phone.trim().replace(/\D/g, '');
            if (cleanedPhone.startsWith('0') && cleanedPhone.length === 10) {
              cleanedPhone = '27' + cleanedPhone.substring(1);
            }
            
            const referralLink = `${window.location.origin}/r/${res.tollaUser.id}`;
            console.log(`[EasyReward Meta API] Dispatching welcome invite template to ${cleanedPhone}...`);
            
            try {
              // Note: Make sure the template name "advocate_invite" is active in your Meta WhatsApp Manager
              await fetch(
                `https://graph.facebook.com/v18.0/${phoneId}/messages`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: cleanedPhone,
                    type: "template",
                    template: {
                      name: "advocate_invite",
                      language: { code: "en" },
                      components: [
                        {
                          type: "body",
                          parameters: [
                            { type: "text", text: location.name },
                            { type: "text", text: referralLink }
                          ]
                        }
                      ]
                    }
                  })
                }
              );
            } catch (wErr) {
              console.error("Failed to dispatch WhatsApp welcome template message:", wErr);
            }
          }
        }

        // Redirect to referral page with the permanent Tolla ID code
        onNavigate('referral-page', { code: res.tollaUser.id });
      }
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!business || !location) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-txtprimary flex flex-col justify-between selection:bg-accent-primary selection:text-white">
      {/* Background Banner Graphic */}
      <div 
        className="h-44 w-full bg-cover bg-center relative"
        style={{ backgroundImage: `url(${location.bannerUrl || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&h=400&fit=crop&q=80'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-md w-full mx-auto px-6 -mt-16 relative z-10 pb-16">
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          {business.logoUrl ? (
            <img 
              src={business.logoUrl} 
              alt={business.name} 
              className="w-20 h-20 rounded-2xl border-2 border-divider shadow-xl object-cover mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl border-2 border-divider shadow-xl bg-hover flex items-center justify-center mb-4">
              <Logo className="w-10 h-10" />
            </div>
          )}
          <h1 className="text-2xl font-bold font-sans text-txtprimary">{business.name}</h1>
          <p className="text-xs text-txtsecondary mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-accent-primary" /> {location.name}
          </p>
        </div>

        {/* Action Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-xl border border-divider">
          <div className="bg-accent-primary/10 border border-accent-primary/20 text-accent-primary p-4 rounded-xl text-center mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" /> Scan Reward
            </p>
            <p className="text-sm font-bold">{business.referrerReward}</p>
          </div>

          <h2 className="text-lg font-bold mb-1 text-txtprimary">Share & Earn Rewards</h2>
          <p className="text-xs text-txtsecondary mb-6 leading-relaxed">
            Enter your details below to get your personal referral page and share {business.friendReward} with your friends!
          </p>

          {isLimitReached ? (
            <div className="p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-sm leading-relaxed mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
              <span>
                **Notice:** This location's referral program is currently at capacity for this month. 
                Existing referrals still work, but new registrations are paused. Please let our reception/till staff know!
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs animate-shake">
                  {error}
                </div>
              )}

              {/* Contact Mode Selection Tabs */}
              <div className="flex bg-hover p-1 rounded-xl border border-divider">
                <button
                  type="button"
                  onClick={() => { setRegMode('whatsapp'); setOptInWhatsApp(true); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    regMode === 'whatsapp' ? 'bg-accent-primary text-white shadow-md' : 'text-txtsecondary hover:text-txtprimary'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => { setRegMode('email'); setOptInEmail(true); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    regMode === 'email' ? 'bg-accent-primary text-white shadow-md' : 'text-txtsecondary hover:text-txtprimary'
                  }`}
                >
                  Email
                </button>
              </div>

              {regMode === 'whatsapp' ? (
                <div>
                  <label className="block text-xs text-txtsecondary mb-1.5 font-medium text-left">WhatsApp Number *</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +27821234567"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-txtsecondary mb-1.5 font-medium text-left">Email Address *</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hello@domain.com"
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center"
                    required
                  />
                </div>
              )}

              {location.customIdentifierName && (
                <div>
                  <label className="block text-xs text-txtsecondary mb-1.5 font-medium text-left">
                    {location.customIdentifierName}
                  </label>
                  <input 
                    type="text" 
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder={`Enter your ${location.customIdentifierName.toLowerCase()}`}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm text-center"
                  />
                </div>
              )}

              {/* Preferred Communication Channel Checkboxes */}
              <div className="bg-hover/30 p-4 rounded-xl border border-divider space-y-2.5 text-left">
                <p className="text-[10px] font-black text-txtsecondary uppercase tracking-widest">Receive updates via:</p>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-txtprimary font-bold cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={optInWhatsApp}
                      onChange={(e) => setOptInWhatsApp(e.target.checked)}
                      className="rounded border-divider text-accent-primary focus:ring-accent-primary"
                    />
                    WhatsApp
                  </label>
                  <label className="flex items-center gap-2 text-xs text-txtprimary font-bold cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={optInEmail}
                      onChange={(e) => setOptInEmail(e.target.checked)}
                      className="rounded border-divider text-accent-primary focus:ring-accent-primary"
                    />
                    Email
                  </label>
                </div>
              </div>

              {/* Marketing Consent Checkbox */}
              <div className="flex items-start gap-2.5 text-left p-1">
                <input 
                  type="checkbox"
                  id="marketing-consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="rounded border-divider text-accent-primary focus:ring-accent-primary mt-0.5 cursor-pointer"
                  required
                />
                <label htmlFor="marketing-consent" className="text-[10px] text-txtsecondary leading-normal font-medium cursor-pointer select-none">
                  I agree to receive reward updates, promotions and special offers from <span className="font-bold text-txtprimary">{business.name}</span>.
                </label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 rounded-xl font-bold bg-accent-primary hover:opacity-90 text-white shadow-xl shadow-accent-primary/20 transition-all text-sm flex items-center justify-center gap-1.5 transform active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Get My Share Link <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="py-6 text-center border-t border-divider bg-panel/40">
        <p className="text-[10px] text-txtsecondary flex items-center justify-center gap-1">
          Powered by <Logo className="w-3.5 h-3.5 inline" /> <span className="font-semibold text-txtprimary">Tolla</span>
        </p>
      </div>
    </div>
  );
};
