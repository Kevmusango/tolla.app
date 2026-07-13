import React, { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Onboard } from './pages/Onboard';
import { Login } from './pages/Login';
import { CustomerScan } from './pages/CustomerScan';
import { ReferralPage } from './pages/ReferralPage';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { EasyRewardService } from './services/EasyRewardService';
import { supabase } from './services/supabase';

interface AuthUser {
  id: string;
  role: 'owner' | 'manager';
  businessId: string;
  locationId: string | null;
}

export default function App() {
  const [route, setRoute] = useState<string>('home');
  const [businessSlug, setBusinessSlug] = useState<string>('');
  const [referralCode, setReferralCode] = useState<string>('');
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authLoadingMessage, setAuthLoadingMessage] = useState('Checking authentication session...');

  const handleSetAuthUser = (user: AuthUser | null) => {
    setAuthUser(user);
  };

  // Verify Supabase session and fetch permissions on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Supabase Auth event]: ${event}`);

      if (session?.user) {
        setIsAuthLoading(true);
        setAuthLoadingMessage('Resolving partner profile...');

        try {
          // Resolve profile
          let profileVerified = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              profileVerified = true;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 300));
          }

          if (!profileVerified) {
            console.error('Trigger profile creation failed on auth signup.');
            setAuthUser(null);
            setIsAuthLoading(false);
            return;
          }

          setAuthLoadingMessage('Verifying account permissions...');
          const { data: association } = await supabase
            .from('profile_businesses')
            .select('business_id, role, location_id')
            .eq('profile_id', session.user.id)
            .maybeSingle();

          if (!association) {
            setAuthUser(null);
            setIsAuthLoading(false);
            setRoute('onboard');
            return;
          }

          setAuthUser({
            id: session.user.id,
            role: association.role as 'owner' | 'manager',
            businessId: association.business_id,
            locationId: association.location_id
          });
        } catch (err) {
          console.error('Failed to resolve account authorizations:', err);
          setAuthUser(null);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setAuthUser(null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [managerBypassError, setManagerBypassError] = useState<string | null>(null);

  const handleManagerBypass = async (token: string) => {
    try {
      const link = await EasyRewardService.validateManagerLink(token);
      if (link) {
        // Authenticate automatically as a manager!
        handleSetAuthUser({
          id: `manager_${link.locationId}`,
          role: 'manager',
          businessId: link.businessId,
          locationId: link.locationId
        });
        setManagerBypassError(null);
        setRoute('dashboard');
      } else {
        setManagerBypassError("This cashier access link has expired or has been revoked by the business owner. Please contact them for a new link.");
      }
    } catch (err) {
      console.error(err);
      setManagerBypassError("Invalid manager link validation error.");
    }
  };

  // URL Parsing Router
  useEffect(() => {
    const parseUrl = () => {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;

      // 1. Subdomain Check: e.g., "silkandshears.tolla.app" or "admin.tolla.app"
      let slug = '';
      const hostParts = hostname.split('.');
      
      // If we are on local development lvh.me or production tolla.app
      if (hostParts.length > 2 && (hostname.includes('lvh.me') || hostname.includes('tolla.app') || hostname.includes('easyreward.co.za'))) {
        slug = hostParts[0];
      }

      // Ignore "www" as a business slug
      if (slug === 'www') {
        slug = '';
      }

      // If accessing via the admin subdomain
      if (slug === 'admin') {
        if (pathname === '/login') {
          setRoute('login');
        } else {
          setRoute('admin');
        }
        return;
      }

      // 2. Path-based check fallback: e.g. /b/silkandshears/scan
      const pathParts = pathname.split('/');
      if (pathParts[1] === 'b' && pathParts[2]) {
        slug = pathParts[2];
        
        // Adjust paths when using the fallback slug path
        if (pathParts[3] === 'scan') {
          setBusinessSlug(slug);
          setRoute('scan');
          return;
        }
        if (pathParts[3] === 'r' && pathParts[4]) {
          setBusinessSlug(slug);
          setReferralCode(pathParts[4]);
          setRoute('referral-page');
          return;
        }
      }

      // If we have a subdomain slug but normal routing
      if (slug) {
        setBusinessSlug(slug);
        if (pathname === '/scan' || pathname === '/') {
          setRoute('scan');
          return;
        }
      }

      // Standard Routing by pathname
      if (pathname.startsWith('/m/')) {
        const token = pathname.substring(3);
        setRoute('manager-bypass');
        handleManagerBypass(token);
      } else if (pathname.startsWith('/r/')) {
        const code = pathname.substring(3);
        setReferralCode(code);
        setRoute('referral-page');
      } else if (pathname === '/scan') {
        setRoute('scan');
      } else if (pathname === '/onboard') {
        setRoute('onboard');
      } else if (pathname === '/login') {
        setRoute('login');
      } else if (pathname === '/admin') {
        setRoute('admin');
      } else if (pathname === '/dashboard') {
        setRoute('dashboard');
      } else {
        setRoute('home');
      }
    };

    parseUrl();

    // Listen for back/forward buttons
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, []);

  // Navigate Helper (updates window history to make URL bar reactively look correct)
  const navigate = (newRoute: string, params?: Record<string, string>) => {
    const hostname = window.location.hostname;
    const isCustomAdminDomain = hostname.startsWith('admin.');
    let url = '/';
    
    if (newRoute === 'home') {
      if (isCustomAdminDomain) {
        // Redirect to main site
        window.location.href = hostname.includes('lvh.me') ? 'http://lvh.me:5173/' : 'https://tolla.app/';
        return;
      }
      url = '/';
    }
    else if (newRoute === 'onboard') url = '/onboard';
    else if (newRoute === 'login') url = '/login';
    else if (newRoute === 'dashboard') url = '/dashboard';
    else if (newRoute === 'admin') {
      url = isCustomAdminDomain ? '/' : '/admin';
    }
    else if (newRoute === 'manager-bypass') {
      const token = params?.token || '';
      url = `/m/${token}`;
    }
    else if (newRoute === 'scan') {
      const slug = businessSlug || 'silkandshears';
      url = `/b/${slug}/scan`;
    }
    else if (newRoute === 'referral-page') {
      const code = params?.code || referralCode;
      const slug = businessSlug || 'silkandshears';
      url = `/b/${slug}/r/${code}`;
      setReferralCode(code);
    }

    // Use replaceState for dashboard to avoid back-button loop
    if (newRoute === 'dashboard') {
      window.history.replaceState({}, '', url);
    } else {
      window.history.pushState({}, '', url);
    }
    setRoute(newRoute);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    handleSetAuthUser(null);
    navigate('home');
  };

  // Render Screens
  return (
    <div className="min-h-screen bg-canvas text-txtprimary antialiased font-sans transition-colors duration-200">
      {route === 'home' && <Home onNavigate={navigate} />}
      
      {route === 'onboard' && (
        <Onboard 
          onNavigate={navigate} 
          onSetAuthUser={handleSetAuthUser} 
        />
      )}
      
      {route === 'login' && (
        <Login 
          onNavigate={navigate} 
          onSetAuthUser={handleSetAuthUser} 
        />
      )}
      
      {route === 'scan' && (
        <div className="mobile-theme min-h-screen bg-canvas text-txtprimary">
          <CustomerScan 
            businessSlug={businessSlug || 'silkandshears'} 
            onNavigate={navigate} 
          />
        </div>
      )}
      
      {route === 'referral-page' && (
        <div className="mobile-theme min-h-screen bg-canvas text-txtprimary">
          <ReferralPage 
            referralCode={referralCode} 
            onNavigate={navigate} 
          />
        </div>
      )}
      
      {route === 'dashboard' && (
        isAuthLoading ? (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-divider shadow-2xl space-y-6 animate-pulse">
              <span className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin block mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-txtprimary">{authLoadingMessage}</h3>
                <p className="text-xs text-txtsecondary">Verifying partner permissions & active session status...</p>
              </div>
            </div>
          </div>
        ) : authUser ? (
          <Dashboard 
            authUser={authUser} 
            onLogout={handleLogout} 
          />
        ) : (
          <Login 
            onNavigate={navigate} 
            onSetAuthUser={handleSetAuthUser} 
          />
        )
      )}
      
      {route === 'admin' && (
        <AdminDashboard 
          onNavigate={navigate} 
        />
      )}

      {route === 'manager-bypass' && (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-divider shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-accent-red/10 border border-accent-red/20 rounded-full flex items-center justify-center mx-auto text-accent-red">
              <span className="text-2xl font-bold">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-txtprimary">Access Link Problem</h3>
              <p className="text-sm text-txtsecondary leading-relaxed">
                {managerBypassError || "Validating your cashier access token..."}
              </p>
            </div>
            
            <button 
              onClick={() => navigate('home')}
              className="w-full py-3.5 rounded-xl font-bold bg-hover hover:bg-hover/80 text-txtprimary text-xs transition-all border border-divider cursor-pointer"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
