
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { openCashRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { CashRegister } from '../types/pdv';
import { DollarSign, ArrowLeft } from 'lucide-react';
import NumericKeyboardInput from './NumericKeyboardInput';
import PasswordPromptModal from './PasswordPromptModal';

const formSchema = z.object({
  initialAmount: z
    .number({ required_error: "Valor inicial é obrigatório" })
    .positive("O valor deve ser maior que zero")
});

interface CashRegisterOpeningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (register: CashRegister) => void;
}

const CashRegisterOpeningModal: React.FC<CashRegisterOpeningModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialAmount: 0
    }
  });

  const handleOpenCash = () => {
    if (!isAuthenticated) {
      setShowPasswordPrompt(true);
      return;
    }
    // Se já está autenticado, continua normalmente
    onSubmit();
  };

  const onSubmit = async (data?: z.infer<typeof formSchema>) => {
    const formData = data || form.getValues();
    try {
      const register = await openCashRegister(formData.initialAmount);
      toast({
        title: "Caixa aberto com sucesso",
        description: `Valor inicial: R$ ${formData.initialAmount.toFixed(2)}`,
        duration: 3000,
      });
      onComplete(register);
    } catch (error) {
      toast({
        title: "Erro ao abrir caixa",
        description: "Ocorreu um erro ao abrir o caixa. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setShowPasswordPrompt(false);
    // Executar a abertura do caixa após autenticação
    onSubmit();
  };

  const handleBack = () => {
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Only allow closing when explicitly set to false by the parent component
        // This prevents user from closing with escape key or clicking outside
        if (newOpen === false) {
          // Don't close the modal
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-800" 
        hideCloseButton={true} // Hide the X button
      >
        <DialogHeader>
          <DialogTitle className="text-center text-white flex items-center justify-center gap-2">
            <DollarSign className="h-5 w-5" /> Abertura de Caixa
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Informe o valor inicial do caixa para começar o dia
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleOpenCash)} className="space-y-4">
            <FormField
              control={form.control}
              name="initialAmount"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center w-full">
                  <FormLabel className="text-white text-center w-full mb-1">Valor Inicial (R$)</FormLabel>
                  <FormControl>
                    <NumericKeyboardInput
                      value={field.value}
                      onChange={(num) => field.onChange(num)}
                    />
                  </FormControl>
                  <FormMessage className="text-pdv-red" />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={handleBack}
                className="bg-transparent hover:bg-gray-700 text-white border-gray-600 flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <Button type="submit" className="flex-1 bg-pdv-green hover:bg-green-700">
                Abrir Caixa
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <PasswordPromptModal
          open={showPasswordPrompt}
          onOpenChange={setShowPasswordPrompt}
          onAuthenticated={handleAuthenticated}
          title="Confirmar Abertura de Caixa"
          description="Digite sua senha para confirmar a abertura do caixa"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterOpeningModal;
