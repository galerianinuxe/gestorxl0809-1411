
import React, { useEffect } from 'react';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionSyncProviderProps {
  children: React.ReactNode;
}

export const SubscriptionSyncProvider: React.FC<SubscriptionSyncProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { syncSubscriptionData } = useSubscriptionSync();

  useEffect(() => {
    if (!user) return;

    // Sincronização inicial (apenas uma vez)
    syncSubscriptionData();
    
    // Canal Realtime único para mudanças de assinatura
    const channel = supabase
      .channel(`subscription-sync-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          syncSubscriptionData();
        }
      )
      .subscribe();

    // Evento de atualização manual
    const handleSubscriptionUpdate = () => syncSubscriptionData();
    window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
    };
  }, [user?.id]); // Usar user?.id em vez de user para evitar re-runs desnecessários

  return <>{children}</>;
};
