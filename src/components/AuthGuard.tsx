import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NoSubscriptionBlocker from './NoSubscriptionBlocker';
import { SubscriptionExpiredModal } from './SubscriptionExpiredModal';
import { createLogger } from '@/utils/logger';
import { useEmployee } from '@/contexts/EmployeeContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

const logger = createLogger('[AuthGuard]');

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isEmployee, hasActiveSubscription: employeeHasSubscription, loading: employeeLoading } = useEmployee();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [showSubscriptionBlocker, setShowSubscriptionBlocker] = useState(false);
  const [showSubscriptionExpiredModal, setShowSubscriptionExpiredModal] = useState(false);
  const [subscriptionCheckTrigger, setSubscriptionCheckTrigger] = useState(0);

  // Cache de verificações de role
  const roleCache = React.useRef<Map<string, { isAdmin: boolean, timestamp: number }>>(new Map());
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  useEffect(() => {
    // Timeout de segurança para evitar loading infinito
    const timeoutId = setTimeout(() => {
      if (dataLoading) {
        setDataLoading(false);
      }
    }, 5000);

    // Aguardar carregamento do contexto de funcionário
    if (employeeLoading) {
      return () => clearTimeout(timeoutId);
    }

    if (user && !loading) {
      fetchUserData();
    } else if (!loading) {
      setDataLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [user, loading, subscriptionCheckTrigger, employeeLoading]);

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

      // Se é funcionário, usar assinatura do dono (já verificada no EmployeeContext)
      if (isEmployee) {
        setIsSubscriptionActive(employeeHasSubscription);
        logger.debug('Employee using owner subscription:', employeeHasSubscription);
      } else {
        // SEGURANÇA: Verificar assinatura ativa via RPC (server-side validation)
        // A função validate_subscription_access já verifica se é funcionário e usa assinatura do dono
        const { data: subscriptionActive, error: subError } = await supabase
          .rpc('validate_subscription_access', { target_user_id: user.id });
        
        if (!subError && subscriptionActive !== null) {
          setIsSubscriptionActive(subscriptionActive);
          logger.debug('Subscription validated server-side');
        }
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
    if (loading || dataLoading || employeeLoading) return;

    logger.debug('AuthGuard checking route:', {
      pathname: location.pathname,
      user: user?.email,
      isAdmin,
      isSubscriptionActive,
      isEmployee
    });

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

    // Funcionários não podem acessar página de planos ou funcionários
    if (isEmployee && (location.pathname === '/planos' || location.pathname === '/funcionarios')) {
      logger.debug('Employee cannot access plans or employees page, redirecting to home');
      navigate('/');
      return;
    }
    
    if (!user && !isPublicRoute) {
      // User not authenticated and trying to access protected content
      // Redirect to landing (silent in production)
      setTimeout(() => {
        navigate('/landing', { replace: true });
      }, 10);
    } else if (user && isPublicRoute && location.pathname !== '/planos' && location.pathname !== '/landing') {
      if (!isAdmin) {
        logger.debug('User authenticated, redirecting from public page to home');
        navigate('/');
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
        logger.debug('User without active subscription, showing expired modal');
        setShowSubscriptionExpiredModal(true);
        navigate('/');
        return;
      }
      
      logger.debug('User has active subscription, accessing protected route');
    } else if (user && isAuthOnlyRoute) {
      // Permitir acesso à home sem assinatura - o WelcomeScreen/FirstLoginModal
      // vai guiar o usuário para ativar o teste grátis
      logger.debug('Auth-only route access granted');
      setShowSubscriptionBlocker(false);
    }
  }, [user, loading, dataLoading, employeeLoading, navigate, location.pathname, isSubscriptionActive, isAdmin, isEmployee]);

  // Show loading while checking authentication
  if (loading || dataLoading || employeeLoading) {
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

  return (
    <>
      {children}
      <SubscriptionExpiredModal
        open={showSubscriptionExpiredModal}
        onClose={() => setShowSubscriptionExpiredModal(false)}
      />
    </>
  );
};

export default AuthGuard;