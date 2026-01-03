import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const isProcessingRef = useRef(false);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  const checkForDirectMessages = useCallback(async () => {
    if (isProcessingRef.current) return;
    
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
        
        // Evitar processar mensagem já em processamento
        if (processedMessagesRef.current.has(message.id)) {
          return;
        }
        
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
  }, []);

  const markMessageAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
      return false;
    }
  }, []);

  const handleCloseMessage = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    try {
      if (currentMessage) {
        // Marcar como processada para evitar re-exibição
        processedMessagesRef.current.add(currentMessage.id);
        
        // Fechar o modal imediatamente
        setIsModalOpen(false);
        setCurrentMessage(null);
        
        // Aguardar a marcação como lida
        await markMessageAsRead(currentMessage.id);
        
        // Pequena pausa para garantir que o banco atualizou
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verificar se há mais mensagens
        await checkForDirectMessages();
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [currentMessage, markMessageAsRead, checkForDirectMessages]);

  useEffect(() => {
    checkForDirectMessages();

    const interval = setInterval(() => {
      if (!isProcessingRef.current && !isModalOpen) {
        checkForDirectMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [checkForDirectMessages, isModalOpen]);

  return {
    currentMessage,
    isModalOpen,
    handleCloseMessage
  };
};
