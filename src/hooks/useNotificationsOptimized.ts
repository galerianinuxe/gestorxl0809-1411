import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
}

export const useNotificationsOptimized = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return;
      }

      // Buscar IDs das notificações já lidas
      const { data: readNotifications } = await supabase
        .from('global_notification_recipients')
        .select('notification_id')
        .eq('user_id', user.id);

      const readIds = readNotifications?.map(item => item.notification_id) || [];

      // Buscar todas as notificações ativas
      const { data: allNotifications, error } = await supabase
        .from('global_notifications')
        .select('id, title, message, sender_name, created_at')
        .eq('is_active', true)
        .gte('created_at', user.created_at)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrar notificações não lidas
      const unreadNotifications = allNotifications?.filter(
        notification => !readIds.includes(notification.id)
      ) || [];

      setNotifications(unreadNotifications);
      setUnreadCount(unreadNotifications.length);

    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('global_notification_recipients')
        .insert({
          notification_id: notificationId,
          user_id: user.id
        });

      if (error && error.code !== '23505') { // Ignorar erro de duplicata
        throw error;
      }

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || notifications.length === 0) return;

      const insertData = notifications.map(notification => ({
        notification_id: notification.id,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('global_notification_recipients')
        .upsert(insertData, { 
          onConflict: 'notification_id,user_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);

    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    // Configurar listener em tempo real
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_notifications'
        },
        () => {
          fetchNotifications();
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
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};