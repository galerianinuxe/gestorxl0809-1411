
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RealtimeMessage {
  id: string;
  sender_name: string;
  title: string;
  message: string;
  created_at: string;
}

export const useRealtimeMessages = () => {
  const [unreadMessages, setUnreadMessages] = useState<RealtimeMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<RealtimeMessage | null>(null);
  const [processedMessages, setProcessedMessages] = useState<Set<string>>(new Set());

  // Buscar mensagens não lidas ao inicializar
  useEffect(() => {
    fetchUnreadMessages();
  }, []);

  // Configurar listener para mensagens em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('admin_realtime_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_realtime_messages'
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMessage = payload.new as any;
          
          // Verificar se a mensagem é para o usuário atual
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newMessage.target_user_id === user.id && !processedMessages.has(newMessage.id)) {
              const message: RealtimeMessage = {
                id: newMessage.id,
                sender_name: newMessage.sender_name,
                title: newMessage.title,
                message: newMessage.message,
                created_at: newMessage.created_at
              };
              
              setProcessedMessages(prev => new Set(prev).add(newMessage.id));
              setUnreadMessages(prev => [message, ...prev]);
              
              // Se não há mensagem sendo exibida, mostrar esta
              setCurrentMessage(prevCurrent => prevCurrent || message);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [processedMessages]);

  const fetchUnreadMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_realtime_messages')
        .select('id, sender_name, title, message, created_at')
        .eq('target_user_id', user.id)
        .eq('is_read', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('Mensagens não lidas encontradas:', data.length);
        const messages = data.map(msg => ({
          id: msg.id,
          sender_name: msg.sender_name,
          title: msg.title,
          message: msg.message,
          created_at: msg.created_at
        }));
        
        setUnreadMessages(messages);
        setCurrentMessage(messages[0]); // Mostrar a primeira mensagem não lida
        
        // Marcar mensagens como processadas
        const messageIds = new Set(messages.map(msg => msg.id));
        setProcessedMessages(messageIds);
      } else {
        console.log('Nenhuma mensagem não lida encontrada');
        setUnreadMessages([]);
        setCurrentMessage(null);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      console.log('Marcando mensagem como lida:', messageId);
      
      const { error } = await supabase
        .from('admin_realtime_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        throw error;
      }

      console.log('Mensagem marcada como lida com sucesso');

      // Remover mensagem da lista de não lidas
      setUnreadMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== messageId);
        return filtered;
      });
      
      // Se esta era a mensagem atual, mostrar a próxima ou limpar
      setCurrentMessage(prev => {
        if (prev?.id === messageId) {
          const remainingMessages = unreadMessages.filter(msg => msg.id !== messageId);
          return remainingMessages.length > 0 ? remainingMessages[0] : null;
        }
        return prev;
      });

      // Marcar como processada
      setProcessedMessages(prev => new Set(prev).add(messageId));
      
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar mensagem. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const dismissCurrentMessage = () => {
    console.log('Descartando mensagem atual:', currentMessage);
    if (currentMessage) {
      markAsRead(currentMessage.id);
    }
  };

  return {
    unreadMessages,
    currentMessage,
    dismissCurrentMessage,
    fetchUnreadMessages
  };
};
