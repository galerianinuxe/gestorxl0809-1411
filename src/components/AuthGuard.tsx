import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NoSubscriptionBlocker from './NoSubscriptionBlocker';
import { createLogger } from '@/utils/logger';

interface AuthGuardProps {
  children: React.ReactNode;
}

const logger = createLogger('[AuthGuard]');

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);
  const [subscriptionCheckTrigger, setSubscriptionCheckTrigger] = useState(0);

  // Cache de verificações de role
  const roleCache = React.useRef<Map<string, { isAdmin: boolean, timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
        logger.debug('Subscription sync event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
      }
    };

    const handleTrialActivation = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        logger.debug('Trial activation event received, re-checking...');
        setSubscriptionCheckTrigger(prev => prev + 1);
        setShowSubscriptionBlocker(false);
      }
    };

    const handleAdminActions = (event: any) => {
      if (user && event.detail?.userId === user.id) {
        logger.debug('Admin subscription action event received, re-checking...');
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
      logger.debug('Fetching user data');
      
      // SEGURANÇA: Verificar se é admin via RPC com cache
      const cached = roleCache.current.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setIsAdmin(cached.isAdmin);
        logger.debug('Using cached admin status');
      } else {
        const { data: adminCheck, error: adminError } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });
        
        if (!adminError && adminCheck !== null) {
          setIsAdmin(adminCheck);
          roleCache.current.set(user.id, { isAdmin: adminCheck, timestamp: Date.now() });
          logger.debug('Admin check via RPC (cached)');
        }
      }

      // SEGURANÇA: Verificar assinatura ativa via RPC (server-side validation)
      const { data: subscriptionActive, error: subError } = await supabase
        .rpc('validate_subscription_access', { target_user_id: user.id });
      
      if (!subError && subscriptionActive !== null) {
        setIsSubscriptionActive(subscriptionActive);
        logger.debug('Subscription validated server-side');
      }

    } catch (error) {
      logger.error('Error fetching user data');
    } finally {
      setDataLoading(false);
    }
  };

  // REMOVIDA: Verificação de assinatura agora é feita via RPC no fetchUserData()
  // A função foi eliminada para seguir as melhores práticas de segurança

  useEffect(() => {
    if (loading || dataLoading) return;

    logger.debug('AuthGuard checking route:', {
      pathname: location.pathname,
      user: user?.email,
      isAdmin,
      isSubscriptionActive
    });

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/landing', '/login', '/register', '/planos'];
    const isPublicRoute = publicRoutes.includes(location.pathname);
    
    // Routes that require authentication but NOT subscription
    const authOnlyRoutes = ['/home', '/guia-completo'];
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
        navigate('/', { replace: true });
      }, 10);
    } else if (user && isPublicRoute && location.pathname !== '/planos' && location.pathname !== '/' && location.pathname !== '/landing') {
      if (!isAdmin) {
        logger.debug('User authenticated, redirecting from public page to home');
        navigate('/home');
      } else {
        logger.debug('Admin has free access to all pages including landing');
      }
    } else if (user && isAdminRoute) {
      if (!isAdmin) {
        logger.debug('User is not admin, redirecting to home');
        navigate('/');
        return;
      }
      logger.debug('Admin accessing admin panel');
    } else if (user && isSubscriptionProtectedRoute) {
      if (isAdmin) {
        logger.debug('Admin has direct access to protected routes');
        return;
      }
      
      if (!isSubscriptionActive) {
        logger.debug('User without active subscription, redirecting to home');
        navigate('/home');
        return;
      }
      
      logger.debug('User has active subscription, accessing protected route');
    } else if (user && isAuthOnlyRoute) {
      if (location.pathname === '/home' && !isAdmin && !isSubscriptionActive) {
        logger.debug('User on home page without subscription, showing subscription blocker');
        setShowSubscriptionBlocker(true);
        return;
      }
      logger.debug('Auth-only route access granted');
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

  // Show subscription blocker for users without subscription (usando verificação segura via RPC)
  if (showSubscriptionBlocker && user && !isAdmin && !isSubscriptionActive) {
    return (
      <NoSubscriptionBlocker 
        userName={user.email} 
        onTrialActivated={async () => {
          logger.debug('Trial activation callback triggered');
          setShowSubscriptionBlocker(false);
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