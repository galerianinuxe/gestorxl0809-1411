
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
    if (user) {
      // Sincronização inicial imediata
      syncSubscriptionData();
      
      // Escutar mudanças em tempo real do Supabase 
      const channel = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            // Sincronizar dados imediatamente após mudança
            syncSubscriptionData();
          }
        )
        .subscribe();

      // Escutar eventos personalizados de outras partes da aplicação
      const handleSubscriptionUpdate = () => {
        syncSubscriptionData();
      };

      // Escutar mudanças de foco da página para re-sincronizar
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          syncSubscriptionData();
        }
      };

      window.addEventListener('subscriptionUpdate', handleSubscriptionUpdate);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('subscriptionUpdate', handleSubscriptionUpdate);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user, syncSubscriptionData]);

  return <>{children}</>;
};
