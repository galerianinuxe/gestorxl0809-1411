
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { openCashRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { CashRegister } from '../types/pdv';
import { Wallet, ArrowLeft, Clock, User, CheckCircle2 } from 'lucide-react';
import NumericKeyboardInput from './NumericKeyboardInput';
import PasswordPromptModal from './PasswordPromptModal';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  initialAmount: z
    .number({ required_error: "Valor inicial é obrigatório" })
    .min(0, "O valor não pode ser negativo")
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
  const { user } = useAuth();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialAmount: 0
    }
  });

  // Atualizar horário a cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Extrair nome do usuário
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleOpenCash = () => {
    if (!isAuthenticated) {
      setShowPasswordPrompt(true);
      return;
    }
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
    onSubmit();
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (newOpen === false) return;
        onOpenChange(newOpen);
      }}
    >
      <DialogContent 
        className="w-full max-w-md bg-gray-900 text-white border-gray-800 p-0 overflow-hidden max-h-[95vh] md:max-h-[90vh]" 
        hideCloseButton={true}
      >
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-pdv-green/20 to-gray-900 p-6 pb-4">
          {/* Ícone principal */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-pdv-green/20 border border-pdv-green/30 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-pdv-green" />
            </div>
            <h1 className="text-xl font-bold text-white">Abertura de Caixa</h1>
          </div>

          {/* Card do usuário */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pdv-green flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-white font-medium text-sm truncate">{userName}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-gray-400 text-xs">
                    {format(currentTime, "dd/MM/yyyy '•' HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleOpenCash)} className="space-y-4">
              <FormField
                control={form.control}
                name="initialAmount"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-center text-gray-400 text-sm mb-2">Valor Inicial do Caixa</p>
                    <FormControl>
                      <NumericKeyboardInput
                        value={field.value}
                        onChange={(num) => field.onChange(num)}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-center" />
                  </FormItem>
                )}
              />
              
              {/* Botões */}
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-pdv-green hover:bg-pdv-green/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Abrir Caixa
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={handleBack}
                  className="w-full h-10 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao Início
                </Button>
              </div>
            </form>
          </Form>
        </div>

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
