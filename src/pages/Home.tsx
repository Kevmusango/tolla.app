import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { 
  Smartphone, MessageCircle, BarChart3, Scissors, Droplets, Dumbbell, 
  Sparkles, Coffee, Dog, Wrench, ArrowDown, ChevronDown, CheckCircle2 
} from 'lucide-react';

interface HomeProps {
  onNavigate: (route: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const getIndustryIcon = (iconStr: string) => {
    const props = { className: "w-6 h-6 text-brand-400" };
    switch (iconStr) {
      case "💇‍♀️": return <Scissors {...props} />;
      case "🚿": return <Droplets {...props} />;
      case "💪": return <Dumbbell {...props} />;
      case "💆‍♀️": return <Sparkles {...props} />;
      case "☕": return <Coffee {...props} />;
      case "🐶": return <Dog {...props} />;
      case "🚗": return <Wrench {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  // Automated slideshow steps for the interactive product demo
  const demoSteps = [
    {
      title: "1. Customer Scans QR Code",
      desc: "A customer visits your business and scans a permanent QR code displayed at the reception counter or till.",
      preview: (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center space-y-3">
          <div className="w-28 h-28 bg-white p-2.5 rounded-2xl border-4 border-emerald-500 shadow-lg shadow-emerald-500/20 relative animate-pulse-slow">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://tolla.app/scan" 
              alt="QR Code" 
              className="w-full h-full"
            />
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-bold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Scan Me
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-[220px] leading-relaxed">
            "Scan while you wait or pay to receive your personalized referral discount code."
          </p>
        </div>
      )
    },
    {
      title: "2. Quick Registration",
      desc: "The customer enters their WhatsApp number and custom identifier (like license plate or pet name) on their phone.",
      preview: (
        <div className="w-full max-w-[240px] mx-auto p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3 shadow-xl">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-[#27272a]">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[9px] text-[#71717a] font-mono">tolla.app</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <label className="block text-[8px] text-[#a1a1aa] mb-1">WhatsApp Number</label>
              <input 
                type="text" 
                readOnly 
                value="+27 82 123 4567" 
                className="w-full px-2.5 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-[10px] text-[#f4f4f5]"
              />
            </div>
            <button className="w-full py-1.5 bg-[#22c55e] text-[#09090b] rounded font-bold text-[10px]">
              Generate My Referral Code
            </button>
          </div>
        </div>
      )
    },
    {
      title: "3. Personalized Share Page",
      desc: "Within seconds, they get their unique sharing hub with a direct 'Share on WhatsApp' action.",
      preview: (
        <div className="w-full max-w-[240px] mx-auto p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3 shadow-xl">
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 p-2.5 rounded text-center">
            <p className="text-[8px] uppercase tracking-wider text-[#22c55e] font-semibold">Your Referral Reward</p>
            <p className="text-[10px] font-bold text-[#f4f4f5]">Free blowout on your next visit</p>
          </div>
          <div className="bg-[#09090b] p-2 rounded border border-[#27272a] text-center">
            <span className="text-xs font-mono tracking-widest font-extrabold text-white">ER9823</span>
          </div>
          <button className="w-full py-2 bg-[#25D366] text-white rounded font-bold text-[10px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10">
            <MessageCircle className="w-3.5 h-3.5 fill-current" /> Share via WhatsApp
          </button>
        </div>
      )
    },
    {
      title: "4. Friend Receives Discount Link",
      desc: "A friend clicks the shared link, sees your business promo/reviews, and visits to redeem the code.",
      preview: (
        <div className="w-full max-w-[240px] mx-auto space-y-3">
          {/* WhatsApp message bubble */}
          <div className="p-2.5 rounded-xl bg-[#056162] text-[#f4f4f5] text-[10px] max-w-[85%] ml-auto shadow-md relative">
            <p className="leading-relaxed">
              Hey! Try Silk & Shears. Use my discount code **ER9823** to get 15% off your first hair styling!
            </p>
            <span className="text-[7px] text-[#cbd5e1] block text-right mt-0.5">20:25 ✓✓</span>
          </div>
          
          {/* Friend Referral Page */}
          <div className="p-3 rounded-xl bg-[#18181b] border border-[#27272a] space-y-1 text-center shadow-xl">
            <span className="text-[8px] uppercase tracking-wider text-[#71717a]">Your Friend's Discount Code</span>
            <p className="text-sm font-black tracking-widest text-[#22c55e] font-mono">ER9823</p>
            <p className="text-[9px] text-[#a1a1aa]">Present this code at checkout for 15% off!</p>
          </div>
        </div>
      )
    },
    {
      title: "5. Redemption & Double Payout",
      desc: "Cashier inputs the code in the dashboard. The friend gets 15% off, and the original customer earns their reward.",
      preview: (
        <div className="w-full max-w-[240px] mx-auto p-3.5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-3 shadow-xl">
          <h4 className="text-[9px] uppercase font-bold text-[#71717a] tracking-wider">Manager Redemption Console</h4>
          <input 
            type="text" 
            readOnly 
            value="ER9823" 
            className="w-full px-2.5 py-1.5 rounded bg-[#09090b] border border-[#27272a] text-[10px] font-mono text-center font-bold tracking-widest text-[#f4f4f5]"
          />
          <div className="p-2 rounded bg-[#22c55e]/10 border border-[#22c55e]/20 text-[9px] text-[#22c55e] space-y-1">
            <p className="font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#22c55e]" /> Payout successful!
            </p>
            <p className="text-[8px] text-[#a1a1aa]">Friend: 15% Off styling applied.</p>
            <p className="text-[8px] text-[#a1a1aa]">Referrer: Free blowout added.</p>
          </div>
        </div>
      )
    }
  ];

  // Auto-play demo simulation
  useEffect(() => {
    let interval: any;
    if (isPlayingDemo) {
      interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % demoSteps.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlayingDemo]);

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-canvas text-txtprimary flex flex-col selection:bg-accent-primary selection:text-white transition-colors duration-200">
      
      {/* SECTION 1: HERO (Above the fold) */}
      <section className="h-screen snap-start flex flex-col shrink-0 relative overflow-hidden">
        {/* Header */}
        <header className="border-b border-divider bg-canvas/80 backdrop-blur sticky top-0 z-50 h-16 flex items-center shrink-0">
          <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <Logo className="w-7 h-7" />
              <span className="font-extrabold text-xl text-accent-primary font-sans">
                Tolla
              </span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => onNavigate('login')}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-divider bg-panel hover:bg-hover text-txtsecondary hover:text-txtprimary transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={() => onNavigate('onboard')}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
              >
                Get Started
              </button>
            </div>
          </div>
        </header>

        {/* Hero split layout */}
        <div className="flex-1 max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-12 gap-8 items-center py-4">
          {/* Left Column: Product copy */}
          <div className="lg:col-span-7 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 text-[#10b981] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" /> B2B Customer Referral Platform
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] font-sans">
              Turn happy customers into your{' '}
              <span className="text-[#10b981]">
                best salespeople.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-txtsecondary leading-relaxed max-w-xl">
              A local business displays a permanent QR code. Customers scan it, receive a personalized referral page in seconds, and share unique discount codes with friends on WhatsApp. Every referral is tracked, paid out, and visualized instantly.
            </p>

            <div className="flex flex-wrap gap-4 text-[10px] text-txtsecondary font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> No Apps to Download
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> WhatsApp Integrated
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[#10b981]" /> Start Free
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button 
                onClick={() => onNavigate('onboard')}
                className="px-6 py-3 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-lg shadow-emerald-500/20 transition-all text-xs transform hover:-translate-y-0.5"
              >
                Start Free (5 referrals/mo)
              </button>
            </div>
          </div>

          {/* Right Column: Premium video simulator / mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel p-1 rounded-3xl border border-divider shadow-2xl relative group overflow-hidden">
              
              {/* Visual glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/5 to-emerald-500/10 -z-10 group-hover:opacity-100 transition-opacity" />

              {!isPlayingDemo ? (
                
                /* VIDEO THUMBNAIL STATE */
                <div 
                  className="h-64 sm:h-72 md:h-[320px] w-full rounded-2xl bg-cover bg-center relative flex flex-col justify-between p-5 cursor-pointer overflow-hidden border border-divider"
                  style={{ backgroundImage: `url('/hero_video_thumbnail.png')` }}
                  onClick={() => setIsPlayingDemo(true)}
                >
                  {/* Soft backdrop overlay */}
                  <div className="absolute inset-0 bg-canvas/60 group-hover:bg-canvas/50 transition-colors" />

                  {/* Floating tags */}
                  <div className="z-10 self-start glass-card px-2.5 py-1 rounded-lg border border-divider text-[10px] font-semibold text-txtprimary">
                    ⚡ Watch How It Works (2 Mins)
                  </div>

                  {/* Pulsing Play Button */}
                  <div className="z-10 self-center flex items-center justify-center w-12 h-12 rounded-full bg-[#10b981] text-white hover:bg-[#0e9f6e] transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/30">
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>

                  {/* Bottom title info */}
                  <div className="z-10 text-left">
                    <h3 className="font-bold text-txtprimary text-sm">The Customer Referral Loop</h3>
                    <p className="text-[10px] text-txtsecondary mt-0.5">Interactive Step-by-Step Vision Simulator</p>
                  </div>
                </div>

              ) : (
                /* VIDEO PLAYING STATE */
                <div className="h-64 sm:h-72 md:h-[320px] w-full rounded-2xl bg-slate-950 border border-divider relative overflow-hidden flex items-center justify-center shadow-2xl">
                  <video 
                    src="https://res.cloudinary.com/dnnwvmh3n/video/upload/v1784018517/ec9fe433-4975-44c1-8850-7130e13de241_eytncq.mp4" 
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={() => setIsPlayingDemo(false)}
                    className="absolute top-3 right-3 text-[10px] text-white/80 hover:text-white px-2 py-1 rounded bg-black/60 hover:bg-black/80 transition-all font-sans font-bold z-10 cursor-pointer shadow-lg"
                  >
                    Close Video
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce text-[10px] text-txtsecondary">
          <span>Scroll down for details</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </div>
      </section>

      {/* SECTION 2: DETAILS & FOOTER */}
      <section className="h-screen snap-start bg-canvas flex flex-col justify-between shrink-0 border-t border-divider">
        
        {/* Features marquee container */}
        <div className="flex-1 max-w-7xl mx-auto px-6 w-full flex flex-col justify-center py-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold font-sans mb-2 text-txtprimary">Designed for Repeat-Customer Storefronts</h2>
            <p className="text-txtsecondary text-xs leading-relaxed">
              Automated client-to-client referral structures work perfectly for local service businesses that rely on word-of-mouth.
            </p>
          </div>

          {/* Marquee Ticker */}
          <div className="relative overflow-hidden w-full py-4">
            {/* Left and Right Edge Fades */}
            <div className="absolute inset-y-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />
            
            <div className="animate-marquee flex gap-6 hover:[animation-play-state:paused] py-2">
              {[
                { icon: "💇‍♀️", name: "Salons & Barbers", desc: "Reward clients with blowouts when friends book hair stylings." },
                { icon: "🚿", name: "Car Washes", desc: "Reward clients with detailed washes when friends claim detailing discounts." },
                { icon: "💪", name: "Gyms & Studios", desc: "Reward members with class passes when referred friends join." },
                { icon: "💆‍♀️", name: "Spas & Wellness", desc: "Reward advocates with hot stone upgrades. Friends receive massage vouchers." },
                { icon: "☕", name: "Restaurants & Cafes", desc: "Reward diners with free appetizers. Friends receive bill discounts." },
                { icon: "🐶", name: "Pet Groomers", desc: "Reward pet parents with wash treatments. Friends claim grooming vouchers." },
                { icon: "🚗", name: "Auto Repair", desc: "Reward car owners with wheel alignments. Friends get R100 service off." },
                { icon: "🧹", name: "Cleaning Services", desc: "Reward clients with free service hours. Friends claim trial discounts." }
              ].concat([
                { icon: "💇‍♀️", name: "Salons & Barbers", desc: "Reward clients with blowouts when friends book hair stylings." },
                { icon: "🚿", name: "Car Washes", desc: "Reward clients with detailed washes when friends claim detailing discounts." },
                { icon: "💪", name: "Gyms & Studios", desc: "Reward members with class passes when referred friends join." },
                { icon: "💆‍♀️", name: "Spas & Wellness", desc: "Reward advocates with hot stone upgrades. Friends receive massage vouchers." },
                { icon: "☕", name: "Restaurants & Cafes", desc: "Reward diners with free appetizers. Friends receive bill discounts." },
                { icon: "🐶", name: "Pet Groomers", desc: "Reward pet parents with wash treatments. Friends claim grooming vouchers." },
                { icon: "🚗", name: "Auto Repair", desc: "Reward car owners with wheel alignments. Friends get R100 service off." },
                { icon: "🧹", name: "Cleaning Services", desc: "Reward clients with free service hours. Friends claim trial discounts." }
              ]).map((ind, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel p-6 rounded-2xl border border-divider w-72 shrink-0 flex flex-col justify-between space-y-3 cursor-pointer hover:border-accent-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getIndustryIcon(ind.icon)}
                    <h3 className="text-sm font-bold font-sans text-txtprimary">{ind.name}</h3>
                  </div>
                  <p className="text-xs text-txtsecondary leading-relaxed font-sans">{ind.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-divider bg-panel py-8 shrink-0">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5" />
              <span className="font-bold text-txtprimary text-sm">EasyReward</span>
            </div>
            <p className="text-[10px] text-txtsecondary">
              &copy; 2026 EasyReward. All rights reserved. Designed for local retail & beauty industries.
            </p>
          </div>
        </footer>
      </section>

      {/* Floating WhatsApp CTA */}
      <a
        href="https://wa.me/27789992503?text=Hi%20Tolla%20Team!%20I%20have%20a%20question."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25d366] hover:bg-[#20ba5a] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all group duration-300 cursor-pointer"
        title="Chat with us on WhatsApp"
      >
        <span className="absolute right-16 scale-0 group-hover:scale-100 transition-all origin-right bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border border-white/10 whitespace-nowrap shadow-xl">
          Need help? Chat with us!
        </span>
        <svg 
          className="w-7 h-7 fill-white stroke-none" 
          viewBox="0 0 24 24"
        >
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.028L2 22l5.135-1.348a9.97 9.97 0 004.877 1.28h.005c5.507 0 9.99-4.479 9.99-9.986 0-2.67-1.037-5.178-2.92-7.062A9.925 9.925 0 0012.012 2zm5.72 13.972c-.25.707-1.42 1.3-1.95 1.385-.48.077-1.11.13-3.23-.75-2.7-1.12-4.44-3.87-4.575-4.053-.13-.18-1.09-1.453-1.09-2.775 0-1.322.685-1.97.93-2.23.25-.26.54-.325.72-.325.18 0 .36.002.51.01.16.007.375-.062.587.45.22.53.75 1.83.81 1.96.06.13.1.28.01.46-.09.18-.14.28-.28.45-.14.17-.3.38-.43.51-.15.15-.31.32-.13.63.18.31.81 1.346 1.74 2.176.93.83 1.72 1.09 2.03 1.25.31.16.49.13.68-.09.19-.22.81-.94 1.03-1.27.22-.33.44-.28.74-.17.3.11 1.9.9 2.23 1.07.33.17.55.25.63.39.08.14.08.82-.17 1.528z" />
        </svg>
      </a>

    </div>
  );
};
