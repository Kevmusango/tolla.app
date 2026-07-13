import React, { useState, useEffect } from 'react';
import { EasyRewardService } from '../services/EasyRewardService';
import { 
  Sparkles, Award, MapPin, Phone, MessageCircle, Copy, Share2, 
  Clock, Coins, CheckCircle2 
} from 'lucide-react';

interface CustomerHubProps {
  referralCode: string;
  onNavigate: (route: string, params?: Record<string, string>) => void;
}

export const CustomerHub: React.FC<CustomerHubProps> = ({ referralCode, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHubData = async () => {
      try {
        const hubData = await EasyRewardService.getCustomerHubData(referralCode);
        if (!hubData) {
          setError('Tolla Rewards profile not found. Please scan a QR code at one of our stores to register.');
        } else {
          setData(hubData);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load your rewards hub. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHubData();
  }, [referralCode]);

  const handleShare = async (biz: any) => {
    const shareUrl = `${window.location.origin}/b/${biz.slug}/r/${referralCode}`;
    const hasFriendDisc = biz.friendReward && biz.friendReward !== 'none' && biz.friendReward !== 'No special reward';
    const text = hasFriendDisc
      ? `Hey! Check out ${biz.name}. Highly recommended! Use this link to get ${biz.friendReward}:`
      : `Hey! Check out ${biz.name}. Highly recommended! Join their rewards program here:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${biz.name} Referral`,
          text: text,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log("Web Share dismissed", err);
      }
    }

    // Fallback: Copy to Clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedBizId(biz.id);
      setTimeout(() => setCopiedBizId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <span className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin block mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Loading Rewards Hub...</h3>
            <p className="text-xs text-slate-400">Assembling your universal rewards card...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl font-bold">
            ⚠️
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-800">Account Not Found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => onNavigate('home')}
            className="w-full py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-850 text-white text-xs transition-all cursor-pointer"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const { user, relationships } = data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Top Banner Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center text-white font-black text-sm">T</div>
            <span className="font-black text-lg text-slate-900 tracking-tight">Tolla Hub</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
            ID: {user.referralCode}
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* User Card Profile Header */}
        <section className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px] font-black pointer-events-none select-none">T</div>
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100">Universal Rewards Card</span>
            <h2 className="text-2xl font-black">{user.name || 'Valued Advocate'}</h2>
            <p className="text-xs text-emerald-50 mt-1">{user.phoneNumber || user.emailAddress}</p>
          </div>
        </section>

        {/* Section 1: Active Wallets Grid */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-500" /> Active Rewards Balance
          </h3>
          
          <div className="space-y-3">
            {relationships.map((rel: any) => {
              const cashWallet = rel.wallets.find((w: any) => w.rewardType === 'cash' || w.currency === 'ZAR');
              const balance = cashWallet ? cashWallet.balance : 0;
              return (
                <div key={rel.relationshipId} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4 hover:border-emerald-500/30 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {rel.business.logoUrl ? (
                        <img src={rel.business.logoUrl} alt={rel.business.name} className="w-6 h-6 rounded-md object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center uppercase">
                          {rel.business.name[0]}
                        </div>
                      )}
                      <h4 className="font-extrabold text-sm text-slate-900">{rel.business.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">{rel.business.industry}</span>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Balance Available</p>
                    <span className="text-lg font-black text-slate-900">R{balance.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}

            {relationships.length === 0 && (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 space-y-2">
                <span className="text-3xl block">🏷️</span>
                <p className="text-xs font-semibold">No connected business reward balances yet.</p>
                <p className="text-[10px] text-slate-400">Scan a QR code at one of our partner storefronts to join their program.</p>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Active Recommendable Deals Feed */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500" /> Recommend &amp; Earn
          </h3>

          <div className="space-y-4">
            {relationships.map((rel: any) => {
              const hasFriendDisc = rel.business.friendReward && rel.business.friendReward !== 'none' && rel.business.friendReward !== 'No special reward';
              return (
                <div key={rel.relationshipId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Business Hero Banner info */}
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="font-black text-base text-slate-900">{rel.business.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" /> 
                        {rel.location?.name || 'Main Branch'}
                      </p>
                    </div>
                    {rel.business.logoUrl && (
                      <img src={rel.business.logoUrl} alt={rel.business.name} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" />
                    )}
                  </div>

                  {/* Program Description */}
                  <div className="p-5 space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 block">Your Reward</span>
                        <span className="text-xs font-bold text-slate-950 mt-0.5 block">{rel.business.referrerReward}</span>
                      </div>
                      <div className="bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 block">Friend's Reward</span>
                        <span className="text-xs font-bold text-slate-950 mt-0.5 block">
                          {hasFriendDisc ? rel.business.friendReward : 'Free entry/No coupon'}
                        </span>
                      </div>
                    </div>

                    {/* Extended business details */}
                    <div className="space-y-2 text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-3">
                      {rel.location?.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Phone: {rel.location.phoneNumber}</span>
                        </div>
                      )}
                      {rel.location?.whatsappNumber && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                          <span>WhatsApp: {rel.location.whatsappNumber}</span>
                        </div>
                      )}
                      {rel.location?.openingHours && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="block font-bold text-slate-700">Opening Hours:</span>
                            <span className="text-[10px] text-slate-400 leading-normal whitespace-pre-line">{rel.location.openingHours}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Share Action Button */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={() => handleShare(rel.business)}
                      className="w-full py-3.5 rounded-xl font-extrabold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-md shadow-emerald-500/10 transition-all text-xs flex items-center justify-center gap-1.5 transform active:scale-98 cursor-pointer select-none border-none outline-none"
                    >
                      {copiedBizId === rel.business.id ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white animate-fade-in" />
                          Referral Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-white" />
                          Recommend Business
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
