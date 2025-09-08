import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, User, X } from 'lucide-react';
import { useNotificationsOptimized } from '@/hooks/useNotificationsOptimized';
import { useToast } from '@/hooks/use-toast';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationModalOptimized = ({
  isOpen,
  onClose
}: NotificationModalProps) => {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationsOptimized();
  
  const { toast } = useToast();

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    toast({
      title: "Sucesso",
      description: "Notificação marcada como lida."
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast({
      title: "Sucesso",
      description: "Todas as notificações foram marcadas como lidas."
    });
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              Notificações
              {notifications.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-600 text-white">
                  {notifications.length}
                </Badge>
              )}
            </div>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead} 
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Marcar todas como lidas
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Visualize e gerencie suas notificações
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma notificação nova</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative"
                >
                  <button 
                    onClick={() => handleMarkAsRead(notification.id)} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors" 
                    title="Marcar como lida"
                  >
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
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};