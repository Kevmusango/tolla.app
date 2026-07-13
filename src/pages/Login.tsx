import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { AlertTriangle, CheckCircle2, ShieldCheck, MessageCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onNavigate: (route: string) => void;
  onSetAuthUser: (user: { id: string; role: 'owner' | 'manager'; businessId: string; locationId: string | null }) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onSetAuthUser }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    const pendingPhone = localStorage.getItem('tolla_pending_onboard_phone');
    const pendingOtp = localStorage.getItem('tolla_pending_otp');
    if (pendingPhone && pendingOtp) {
      setPhone(pendingPhone);
      setGeneratedOtp(pendingOtp);
      setStep('otp');
      setMessage('Account created! Enter the verification code sent to your WhatsApp.');
      
      localStorage.removeItem('tolla_pending_onboard_phone');
      localStorage.removeItem('tolla_pending_otp');
    }
  }, []);

  const normalizePhone = (num: string): string => {
    let cleaned = num.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter a WhatsApp number.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    const cleanedPhone = normalizePhone(phone);
    const targetEmail = `${cleanedPhone}@tolla.app`;

    try {

      // 2. Generate OTP and dispatch WhatsApp message
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      const phoneId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;

      if (phoneId && accessToken) {
        console.log(`[EasyReward OTP Service] Sending real WhatsApp OTP to ${cleanedPhone}...`);
        const response = await fetch(
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
                name: "tolla_otp",
                language: { code: "en_US" },
                components: [
                  {
                    type: "body",
                    parameters: [{ type: "text", text: code }]
                  },
                  {
                    type: "button",
                    sub_type: "url",
                    index: "0",
                    parameters: [{ type: "text", text: code }]
                  }
                ]
              }
            })
          }
        );

        if (!response.ok) {
          const errData = await response.json();
          console.warn("WhatsApp API failed, using fallback OTP info:", errData);
          setStep('otp');
          setMessage(`Demo Mode (API error): Enter code ${code} to proceed.`);
        } else {
          setStep('otp');
          setMessage(`Verification code sent to your WhatsApp!`);
        }
      } else {
        console.log(`[EasyReward OTP Service] Simulated WhatsApp OTP to ${cleanedPhone}: ${code}`);
        setStep('otp');
        setMessage(`Demo Mode (No Meta Credentials): Enter code ${code} to proceed.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to dispatch verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    if (otp !== generatedOtp) {
      setError('Invalid code. Please try again.');
      setIsLoading(false);
      return;
    }

    const cleanedPhone = normalizePhone(phone);
    const targetEmail = `${cleanedPhone}@tolla.app`;
    const targetPassword = `Tolla_OTP_Password_${cleanedPhone}`;

    try {
      // 1. Authenticate in Supabase Auth via deterministic credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: targetPassword
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('invalid login') || authError.message.toLowerCase().includes('credentials')) {
          setError('This WhatsApp number is not registered yet. Please click "Need an account? Sign Up" below to create your account.');
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      const sessionUser = authData.user;
      if (!sessionUser) {
        setError('Login failed. User session not initialized.');
        setIsLoading(false);
        return;
      }

      // 2. Fetch business role mapping details
      const { data: association, error: assocError } = await supabase
        .from('profile_businesses')
        .select('business_id, role, location_id')
        .eq('profile_id', sessionUser.id)
        .maybeSingle();

      if (assocError) {
        setError(`Failed to retrieve profile association: ${assocError.message}`);
        setIsLoading(false);
        return;
      }

      let finalAssociation = association;

      if (!finalAssociation) {
        const pendingStr = localStorage.getItem('tolla_pending_onboarding');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          const slug = pending.bizName.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Execute onboarding transaction RPC under authenticated user session!
          const { data: rpcData, error: rpcError } = await supabase.rpc('onboard_new_merchant', {
            biz_name: pending.bizName,
            biz_slug: slug,
            loc_name: 'Main Branch',
            loc_address: 'Default Store Address, South Africa',
            loc_whatsapp: pending.whatsappNumber,
            loc_phone: pending.whatsappNumber,
            loc_industry: pending.industry,
            loc_custom_industry: pending.customIndustry || '',
            loc_business_type: pending.businessType
          });

          if (rpcError) {
            setError(`Onboarding registration failed: ${rpcError.message}`);
            setIsLoading(false);
            return;
          }

          localStorage.removeItem('tolla_pending_onboarding');

          finalAssociation = {
            business_id: rpcData.business_id,
            role: 'owner',
            location_id: rpcData.location_id
          };
        } else {
          onNavigate('onboard');
          return;
        }
      }

      onSetAuthUser({
        id: sessionUser.id,
        role: finalAssociation.role as 'owner' | 'manager',
        businessId: finalAssociation.business_id,
        locationId: finalAssociation.location_id
      });

      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-txtprimary flex flex-col items-center justify-center p-6 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => onNavigate('home')}>
        <Logo className="w-9 h-9" />
        <span className="font-extrabold text-2xl text-accent-primary">
          Tolla
        </span>
      </div>

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 shadow-2xl relative border border-divider">
        <h2 className="text-2xl font-bold font-sans text-center mb-1 text-txtprimary">
          Partner Portal
        </h2>
        <p className="text-txtsecondary text-center mb-8 text-sm">
          {step === 'phone' ? 'Sign in using your WhatsApp number' : 'Enter the code sent to your WhatsApp'}
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm flex items-center gap-1.5 animate-shake">
            <AlertTriangle className="w-4 h-4 text-accent-red shrink-0" /> {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0" /> {message}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-xs text-txtsecondary mb-1.5 font-medium">WhatsApp Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +27821112222"
                className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Send Verification Code <MessageCircle className="w-4 h-4" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs text-txtsecondary mb-1.5 font-medium">Enter 6-Digit Verification Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp} 
                onChange={(e) => setOtp(e.target.value.trim().replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl glass-input text-center tracking-[0.5em] text-lg font-bold"
                required
              />
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setStep('phone')}
                className="flex-1 py-3.5 rounded-xl font-semibold border border-divider bg-panel hover:bg-hover text-txtsecondary text-sm transition-all"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 py-3.5 rounded-xl font-bold bg-[#10b981] hover:bg-[#0e9f6e] text-white shadow-xl shadow-emerald-500/20 transition-all text-sm flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify & Login <ShieldCheck className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 flex gap-4 text-xs text-txtsecondary">
        <button onClick={() => onNavigate('onboard')} className="hover:text-txtprimary underline">
          Need an account? Sign Up
        </button>
        <span>•</span>
        <button onClick={() => onNavigate('home')} className="hover:text-txtprimary underline">
          Back to Homepage
        </button>
      </div>
    </div>
  );
};
