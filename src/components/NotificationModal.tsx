import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface Notification {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
}
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const NotificationModal = ({
  isOpen,
  onClose
}: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    toast
  } = useToast();
  const fetchNotifications = async () => {
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
        .select(`
          id,
          title,
          message,
          sender_name,
          created_at
        `)
        .eq('is_active', true)
        .gte('created_at', user.created_at)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (readIds.length > 0) {
        query = query.not('id', 'in', `(${readIds.map(id => `'${id}'`).join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as notificações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const markAsRead = async (notificationId: string) => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Inserir registro de leitura
      const {
        error
      } = await supabase.from('global_notification_recipients').insert({
        notification_id: notificationId,
        user_id: user?.id
      });
      // Remover da lista local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Sucesso",
        description: "Notificação marcada como lida."
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };
  const markAllAsRead = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      const insertData = notifications.map(notification => ({
        notification_id: notification.id,
        user_id: user?.id
      }));
      const {
        error
      } = await supabase.from('global_notification_recipients').insert(insertData);
      if (error) throw error;
      setNotifications([]);
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas."
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas.",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Configurar real-time para atualizações
  useEffect(() => {
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_notifications'
        },
        () => {
          if (isOpen) {
            fetchNotifications();
          }
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
          if (isOpen) {
            fetchNotifications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              Notificações
              {notifications.length > 0 && <Badge variant="secondary" className="bg-yellow-600 text-white">
                  {notifications.length}
                </Badge>}
            </div>
            {notifications.length > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300">
                Marcar todas como lidas
              </Button>}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Visualize e gerencie suas notificações
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div> : notifications.length === 0 ? <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma notificação nova</p>
            </div> : <div className="space-y-3">
              {notifications.map(notification => <div key={notification.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative">
                  <button onClick={() => markAsRead(notification.id)} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors" title="Marcar como lida">
                    <X className="h-4 w-4" />
                  </button>

                  <div className="pr-8">
                    <h3 className="font-semibold text-white mb-2">
                      {notification.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {notification.sender_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>

        
      </DialogContent>
    </Dialog>;
};