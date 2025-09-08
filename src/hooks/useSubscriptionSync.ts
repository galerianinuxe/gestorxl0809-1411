
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSubscriptionSync = () => {
  const { user } = useAuth();

  const syncSubscriptionData = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar assinatura mais recente do Supabase com dados mais detalhados
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar assinatura:', error);
        return;
      }

      if (subscription) {
        // Verificar se ainda está válida
        const isValid = subscription.is_active && new Date(subscription.expires_at) > new Date();
        
        if (isValid) {
          // Validate plan_type before using it
          const validPlanTypes = ['trial', 'monthly', 'quarterly', 'annual'];
          const planType = validPlanTypes.includes(subscription.plan_type) ? subscription.plan_type : 'trial';
          
          // Sincronização completa e silenciosa
          const subscriptionData = {
            is_active: subscription.is_active,
            expires_at: subscription.expires_at,
            plan_type: planType,
            activated_at: subscription.activated_at,
            activation_method: planType === 'trial' ? 'trial' : 'admin_manual',
            period_days: getPeriodDays(planType),
            user_id: user.id,
            sync_timestamp: new Date().toISOString()
          };

          localStorage.setItem(`subscription_${user.id}`, JSON.stringify(subscriptionData));
          
          const userSubscriptionData = {
            hasActiveSubscription: true,
            subscriptionType: planType,
            expiresAt: subscription.expires_at,
            isTrialUsed: planType === 'trial',
            activatedBy: planType === 'trial' ? 'user' : 'admin',
            activatedAt: subscription.activated_at,
            periodDays: getPeriodDays(planType),
            sync_timestamp: new Date().toISOString()
          };
          
          localStorage.setItem(`user_subscription_${user.id}`, JSON.stringify(userSubscriptionData));
          
          localStorage.setItem(`subscription_status_${user.id}`, JSON.stringify({
            isActive: true,
            type: planType,
            expiresAt: subscription.expires_at,
            periodDays: getPeriodDays(planType),
            sync_timestamp: new Date().toISOString()
          }));

          if (planType === 'trial') {
            localStorage.setItem(`trial_used_${user.id}`, 'true');
          }

          // Disparar evento personalizado para componentes que precisam reagir
          window.dispatchEvent(new CustomEvent('subscriptionSynced', {
            detail: { 
              userId: user.id, 
              subscription: subscriptionData,
              userEmail: user.email 
            }
          }));
          
        } else {
          console.error('❌ Assinatura expirada ou inativa para:', user.email);
          clearSubscriptionData(user.id);
          
          window.dispatchEvent(new CustomEvent('subscriptionCleared', {
            detail: { userId: user.id, userEmail: user.email }
          }));
        }
      } else {
        console.error('❌ Nenhuma assinatura ativa encontrada para:', user.email);
        clearSubscriptionData(user.id);
        
        window.dispatchEvent(new CustomEvent('subscriptionCleared', {
          detail: { userId: user.id, userEmail: user.email }
        }));
      }
    } catch (error) {
      console.error('💥 Erro ao sincronizar assinatura para', user.email, ':', error);
    }
  }, [user]);

  // Função auxiliar para obter período em dias baseado no tipo de plano
  const getPeriodDays = (planType: string): number => {
    switch (planType) {
      case 'trial': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'annual': return 365;
      default: return 7;
    }
  };

  // Função auxiliar para limpar dados de assinatura
  const clearSubscriptionData = (userId: string) => {
    localStorage.removeItem(`subscription_${userId}`);
    localStorage.removeItem(`user_subscription_${userId}`);
    localStorage.removeItem(`subscription_status_${userId}`);
    console.log('🧹 Dados de assinatura limpos para usuário:', userId);
  };

  // Sincronizar automaticamente quando o hook é usado
  useEffect(() => {
    if (user) {
      // Sincronização inicial
      syncSubscriptionData();
      
      // Sincronizar periodicamente (a cada 5 minutos - reduzido para performance)
      const interval = setInterval(() => {
        syncSubscriptionData();
      }, 300000); // 5 minutos
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user, syncSubscriptionData]);

  return { syncSubscriptionData };
};
