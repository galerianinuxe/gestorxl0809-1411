
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeMessageModal } from '@/components/RealtimeMessageModal';

interface DirectMessage {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  created_at: string;
}

export const useDirectMessages = () => {
  const [currentMessage, setCurrentMessage] = useState<DirectMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkForDirectMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: messages, error } = await supabase
        .from('user_direct_messages')
        .select('*')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Erro ao verificar mensagens diretas:', error);
        return;
      }

      if (messages && messages.length > 0) {
        const message = messages[0];
        setCurrentMessage({
          id: message.id,
          title: message.title,
          message: message.message,
          sender_name: message.sender_name,
          created_at: message.created_at
        });
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens diretas:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('user_direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const handleCloseMessage = () => {
    if (currentMessage) {
      markMessageAsRead(currentMessage.id);
    }
    setIsModalOpen(false);
    setCurrentMessage(null);
    
    // Verificar se há mais mensagens após fechar a atual
    setTimeout(() => {
      checkForDirectMessages();
    }, 500);
  };

  useEffect(() => {
    const checkMessages = () => {
      checkForDirectMessages();
    };

    // Verificar mensagens ao carregar
    checkMessages();

    // Configurar intervalo para verificar periodicamente
    const interval = setInterval(checkMessages, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    currentMessage,
    isModalOpen,
    handleCloseMessage
  };
};
