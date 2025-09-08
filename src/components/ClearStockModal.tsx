import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ClearStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockCleared: () => void;
}

const ClearStockModal: React.FC<ClearStockModalProps> = ({ 
  open, 
  onOpenChange,
  onStockCleared
}) => {
  const [isClearing, setIsClearing] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const { user } = useAuth();
  
  const CONFIRMATION_TEXT = 'ZERAR ESTOQUE';

  const handleClearStock = async () => {
    if (!user || confirmationText !== CONFIRMATION_TEXT) return;

    setIsClearing(true);

    try {
      // Deletar todos os pedidos do usuário (que são a base do cálculo de estoque)
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('user_id', user.id);

      if (ordersError) {
        console.error('Erro ao deletar pedidos:', ordersError);
        toast({
          title: "Erro ao zerar estoque",
          description: "Erro ao deletar os dados de estoque.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      // Deletar todos os order_items do usuário
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('user_id', user.id);

      if (itemsError) {
        console.error('Erro ao deletar itens:', itemsError);
        toast({
          title: "Erro ao zerar estoque",
          description: "Erro ao deletar os itens de estoque.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      toast({
        title: "Estoque zerado com sucesso",
        description: "Todo o histórico de estoque foi removido do sistema.",
        duration: 4000,
      });

      onStockCleared();
      onOpenChange(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Erro ao zerar estoque:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao zerar o estoque. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        handleCancel();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2 text-2xl text-red-400">
            <Trash2 className="h-7 w-7" /> 
            Zerar Estoque Completo
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-lg">
            Esta ação é irreversível e removerá TODOS os dados de estoque
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert className="border-red-600 bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <AlertDescription className="text-red-200 text-base">
              <strong>ATENÇÃO:</strong> Esta ação irá:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Deletar TODOS os pedidos de compra e venda</li>
                <li>Remover TODOS os itens de estoque</li>
                <li>Zerar completamente o histórico de movimentações</li>
                <li>Esta ação NÃO pode ser desfeita</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <label className="text-white font-medium">
              Para confirmar, digite exatamente: <span className="text-red-400 font-bold">{CONFIRMATION_TEXT}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Digite aqui para confirmar"
              className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-md focus:outline-none focus:border-red-400"
              autoFocus
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-transparent hover:bg-gray-700 text-white border-gray-600"
              disabled={isClearing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleClearStock}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isClearing || confirmationText !== CONFIRMATION_TEXT}
            >
              {isClearing ? "Zerando..." : "Zerar Estoque"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClearStockModal;