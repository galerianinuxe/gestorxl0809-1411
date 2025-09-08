import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NoSubscriptionBlocker from './NoSubscriptionBlocker';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);
  const [subscriptionCheckTrigger, setSubscriptionCheckTrigger] = useState(0);

  // Check if user is admin - now based on profile status being 'admin'
  const isAdmin = profile?.status === 'admin';

  useEffect(() => {
    if (user && !loading) {
      fetchUserData();
    } else if (!loading) {
      setDataLoading(false);
    }
  }, [user, loading, subscriptionCheckTrigger]);

  // Listen for subscription events
  useEffect(() => {
    const handleSubscriptionSync = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        console.log('🔄 Subscription sync event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
      }
    };

    const handleTrialActivation = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        console.log('🎉 Trial activation event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
        setShowSubscriptionBlocker(false);
      }
    };

    const handleAdminActions = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        console.log('⚡ Admin subscription action event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('subscriptionSynced', handleSubscriptionSync);
    window.addEventListener('trialActivated', handleTrialActivation);
    window.addEventListener('adminSubscriptionCreated', handleAdminActions);
    window.addEventListener('adminSubscriptionDeactivated', handleAdminActions);

    return () => {
      window.removeEventListener('subscriptionSynced', handleSubscriptionSync);
      window.removeEventListener('trialActivated', handleTrialActivation);
      window.removeEventListener('adminSubscriptionCreated', handleAdminActions);
      window.removeEventListener('adminSubscriptionDeactivated', handleAdminActions);
    };
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Fetching user data (dev only)
      if (import.meta.env.DEV) console.log('🔍 Fetching user data for:', user.email);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        // Profile loaded (dev only)
        if (import.meta.env.DEV) console.log('👤 Profile loaded:', profileData);
      }

      // Check subscription status
      const subscriptionActive = checkActiveSubscriptionImproved(user.id);
      setIsSubscriptionActive(subscriptionActive);

      // Subscription check result (dev only)
      if (import.meta.env.DEV) {
        console.log('🔍 Subscription check result:', {
          userId: user.id,
          email: user.email,
          isActive: subscriptionActive,
          isAdmin: (profileData as any)?.status === 'admin'
        });
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const checkActiveSubscriptionImproved = (userId: string): boolean => {
    // Checking active subscription (dev only)
    if (import.meta.env.DEV) console.log('🔍 Verificando assinatura ativa para usuário:', userId);
    
    // 1. PRIMEIRA PRIORIDADE: Assinatura ativada pelo admin
    const adminSubscription = localStorage.getItem(`subscription_${userId}`);
    if (adminSubscription) {
      try {
        const sub = JSON.parse(adminSubscription);
        if (import.meta.env.DEV) console.log('📋 Admin subscription found:', sub);
        if (sub.is_active && new Date(sub.expires_at) > new Date()) {
          if (import.meta.env.DEV) console.log('✅ Admin subscription is active');
          return true;
        } else {
          if (import.meta.env.DEV) console.log('⚠️ Admin subscription found but expired or inactive');
          localStorage.removeItem(`subscription_${userId}`);
        }
      } catch (error) {
        console.error('❌ Error parsing admin subscription:', error);
        localStorage.removeItem(`subscription_${userId}`);
      }
    }
    
    // 2. SEGUNDA PRIORIDADE: Dados de usuário
    const userSubscription = localStorage.getItem(`user_subscription_${userId}`);
    if (userSubscription) {
      try {
        const sub = JSON.parse(userSubscription);
        if (import.meta.env.DEV) console.log('📋 User subscription found:', sub);
        if (sub.hasActiveSubscription && new Date(sub.expiresAt) > new Date()) {
          if (import.meta.env.DEV) console.log('✅ User subscription is active');
          return true;
        } else {
          if (import.meta.env.DEV) console.log('⚠️ User subscription found but expired or inactive');
          localStorage.removeItem(`user_subscription_${userId}`);
        }
      } catch (error) {
        console.error('❌ Error parsing user subscription:', error);
        localStorage.removeItem(`user_subscription_${userId}`);
      }
    }
    
    // 3. TERCEIRA PRIORIDADE: Status global
    const subscriptionStatus = localStorage.getItem(`subscription_status_${userId}`);
    if (subscriptionStatus) {
      try {
        const status = JSON.parse(subscriptionStatus);
        if (import.meta.env.DEV) console.log('📋 Subscription status found:', status);
        if (status.isActive && new Date(status.expiresAt) > new Date()) {
          if (import.meta.env.DEV) console.log('✅ Subscription status is active');
          return true;
        } else {
          if (import.meta.env.DEV) console.log('⚠️ Subscription status found but expired or inactive');
          localStorage.removeItem(`subscription_status_${userId}`);
        }
      } catch (error) {
        console.error('❌ Error parsing subscription status:', error);
        localStorage.removeItem(`subscription_status_${userId}`);
      }
    }
    
    if (import.meta.env.DEV) console.log('❌ No active subscription found');
    return false;
  };

  useEffect(() => {
    if (loading || dataLoading) return;

    // Auth guard route validation (logs only in dev)
    if (import.meta.env.DEV) {
      console.log('🛡️ AuthGuard checking route:', {
        pathname: location.pathname,
        user: user?.email,
        isAdmin,
        isSubscriptionActive
      });
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/landing', '/login', '/register', '/planos'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    
    // Routes that require authentication but NOT subscription
    const authOnlyRoutes = ['/', '/guia-completo'];
    const isAuthOnlyRoute = authOnlyRoutes.includes(location.pathname);
    
    // Protected routes that require both authentication AND active subscription
    const subscriptionProtectedRoutes = ['/dashboard', '/purchase-orders', '/current-stock', '/sales-orders', '/transactions', '/expenses', '/daily-flow', '/materiais', '/configuracoes'];
    const isSubscriptionProtectedRoute = subscriptionProtectedRoutes.includes(location.pathname);
    
    // Admin-only route
    const isAdminRoute = location.pathname === '/covildomal';
    
    if (!user && !isPublicRoute) {
      // User not authenticated and trying to access protected content
      // Redirect to landing (silent in production)
      setTimeout(() => {
        navigate('/landing', { replace: true });
      }, 10);
    } else if (user && isPublicRoute && location.pathname !== '/planos' && location.pathname !== '/landing') {
      // Admin can access landing freely, regular users are redirected unless on landing
      if (!isAdmin) {
        // User authenticated, redirecting (dev only)
        if (import.meta.env.DEV) console.log('✅ User authenticated, redirecting from public page to home');
        navigate('/');
      } else {
        // Admin has free access (dev only)
        if (import.meta.env.DEV) console.log('✅ Admin has free access to all pages including landing');
      }
    } else if (user && isAdminRoute) {
      // Check if user is admin for /covildomal route
      if (!isAdmin) {
        // User is not admin (dev only)
        if (import.meta.env.DEV) console.log('❌ User is not admin, redirecting to home');
        navigate('/');
        return;
      }
      // Admin accessing admin panel (dev only)
      if (import.meta.env.DEV) console.log('✅ Admin accessing admin panel');
    } else if (user && isSubscriptionProtectedRoute) {
      // For administrators: direct access without subscription verification
      if (isAdmin) {
        // Admin has direct access (dev only)
        if (import.meta.env.DEV) console.log('✅ Admin has direct access to protected routes');
        return;
      }
      
      // Re-verify subscription in real-time for protected routes
      const realtimeSubscriptionCheck = checkActiveSubscriptionImproved(user.id);
      
      // Real-time subscription check (logs only in dev)
      if (import.meta.env.DEV) {
        console.log('🔄 Real-time subscription check for protected route:', {
          route: location.pathname,
          isActive: realtimeSubscriptionCheck
        });
      }
      
      // For regular users: check subscription first
      if (!realtimeSubscriptionCheck) {
        // User without subscription (dev only)
        if (import.meta.env.DEV) console.log('❌ User without active subscription, redirecting to home');
        navigate('/');
        return;
      }
      
      // Update state if real-time verification is different
      if (realtimeSubscriptionCheck !== isSubscriptionActive) {
        // Updating subscription status (dev only)
        if (import.meta.env.DEV) console.log('🔄 Updating subscription status based on real-time check');
        setIsSubscriptionActive(realtimeSubscriptionCheck);
      }
      
      // User has active subscription (dev only)
      if (import.meta.env.DEV) console.log('✅ User has active subscription, accessing protected route');
    } else if (user && isAuthOnlyRoute) {
      // Routes that only need authentication, but check subscription for home page
      if (location.pathname === '/' && !isAdmin && !isSubscriptionActive) {
        // User on home without subscription (dev only)
        if (import.meta.env.DEV) console.log('❌ User on home page without subscription, showing subscription blocker');
        setShowSubscriptionBlocker(true);
        return;
      }
      // Auth-only route access (dev only)
      if (import.meta.env.DEV) console.log('✅ Auth-only route access granted');
      setShowSubscriptionBlocker(false);
    }
  }, [user, loading, dataLoading, navigate, location.pathname, isSubscriptionActive, isAdmin]);

  // Show loading while checking authentication
  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-pdv-dark flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // Show subscription blocker for users without subscription
  if (showSubscriptionBlocker && user && !isAdmin && !isSubscriptionActive) {
    return (
      <NoSubscriptionBlocker 
        userName={profile?.name} 
        onTrialActivated={async () => {
          console.log('🎯 Trial activation callback triggered');
          setShowSubscriptionBlocker(false);
          // Force immediate re-check with small delay to ensure data propagation
          setTimeout(() => {
            setSubscriptionCheckTrigger(prev => prev + 1);
          }, 500);
        }}
      />
    );
  }

  return <>{children}</>;
};

export default AuthGuard;