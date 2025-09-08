import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar IDs das notificações já lidas pelo usuário
      const { data: readNotifications } = await supabase
        .from('global_notification_recipients')
        .select('notification_id')
        .eq('user_id', user.id);

      const readIds = readNotifications?.map(item => item.notification_id) || [];

      // Buscar notificações ativas que não foram lidas
      let query = supabase
        .from('global_notifications')
        .select('id')
        .eq('is_active', true)
        .gte('created_at', user.created_at)
        .gt('expires_at', new Date().toISOString());

      if (readIds.length > 0) {
        query = query.not('id', 'in', `(${readIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data: notifications, error } = await query;
      
      if (error) throw error;
      
      setUnreadCount(notifications?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Configurar real-time para notificações globais
    const notificationsChannel = supabase
      .channel('global-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_notifications'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_notification_recipients'
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  return {
    unreadCount,
    isLoading,
    refetch: fetchUnreadCount,
  };
};