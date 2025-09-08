import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addExpenseToCashRegister, getActiveCashRegister } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { CashRegister } from '../types/pdv';
import { TrendingDown, X } from 'lucide-react';
import PasswordPromptModal from './PasswordPromptModal';

const formSchema = z.object({
  amount: z
    .number({ required_error: "Valor é obrigatório" })
    .positive("O valor deve ser maior que zero"),
  description: z
    .string()
    .min(1, "Descrição é obrigatória"),
  category: z
    .string()
    .min(1, "Categoria é obrigatória")
});

interface ExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (register: CashRegister) => void;
}

const ExpenseModal: React.FC<ExpenseModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState<{amount: number, description: string, category: string} | null>(null);
  const [displayValue, setDisplayValue] = useState('R$ 0,00');
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      description: "",
      category: ""
    }
  });

  // Format currency input with mask
  const formatCurrency = (inputValue: string) => {
    // Remove all non-numeric characters
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    if (!numericValue) {
      return 'R$ 0,00';
    }
    
    // Convert to cents and format
    const cents = parseInt(numericValue);
    const reais = cents / 100;
    
    return `R$ ${reais.toFixed(2).replace('.', ',')}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrency(inputValue);
    setDisplayValue(formatted);
    
    // Extract numeric value for form
    const numericValue = formatted.replace('R$ ', '').replace(',', '.');
    const amount = parseFloat(numericValue);
    form.setValue('amount', amount);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Store the expense data and show password modal
    setPendingExpenseData({
      amount: data.amount,
      description: data.description,
      category: data.category
    });
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    if (pendingExpenseData && pendingExpenseData.amount && pendingExpenseData.description && pendingExpenseData.category) {
      executeAddExpense(pendingExpenseData);
      setPendingExpenseData(null);
    }
  };

  const executeAddExpense = async (data: {amount: number, description: string, category: string}) => {
    try {
      const updatedRegister = await addExpenseToCashRegister(data.amount, `${data.category} - ${data.description}`);
      
      if (updatedRegister) {
        toast({
          title: "Despesa adicionada",
          description: `R$ ${data.amount.toFixed(2)} - ${data.category} - ${data.description}`,
          duration: 3000,
        });
        onOpenChange(false);
        form.reset();
        setDisplayValue('R$ 0,00');
        if (onComplete) {
          onComplete(updatedRegister);
        }
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível adicionar despesa. Verifique se o caixa está aberto.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar despesa ao caixa.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      form.reset();
      setDisplayValue('R$ 0,00');
    }
  }, [open, form]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-[500px] bg-pdv-dark text-white border-gray-700 p-0"
          hideCloseButton={true}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Adicionar Despesa</h2>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form */}
          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Description field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a despesa"
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {/* Category field */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="Almoço" className="text-white hover:bg-gray-700">Almoço</SelectItem>
                          <SelectItem value="Vale" className="text-white hover:bg-gray-700">Vale</SelectItem>
                          <SelectItem value="Despesa Geral" className="text-white hover:bg-gray-700">Despesa Geral</SelectItem>
                          <SelectItem value="Diária" className="text-white hover:bg-gray-700">Diária</SelectItem>
                          <SelectItem value="Pgto Semana" className="text-white hover:bg-gray-700">Pgto Semana</SelectItem>
                          <SelectItem value="Café" className="text-white hover:bg-gray-700">Café</SelectItem>
                          <SelectItem value="Comissão" className="text-white hover:bg-gray-700">Comissão</SelectItem>
                          <SelectItem value="Combustível" className="text-white hover:bg-gray-700">Combustível</SelectItem>
                          <SelectItem value="Ajudante Geral" className="text-white hover:bg-gray-700">Ajudante Geral</SelectItem>
                          <SelectItem value="Estorno" className="text-white hover:bg-gray-700">Estorno</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                {/* Amount field with currency mask */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-base">Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="R$ 0,00" 
                          type="text"
                          value={displayValue}
                          onChange={handleAmountChange}
                          className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 h-16 text-center font-bold"
                          style={{ 
                            fontSize: '1.68em',
                            color: '#2DCC68'
                          }}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                {/* Action buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-0"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-pdv-green hover:bg-pdv-green/90 text-white"
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Despesa"
        description="Digite sua senha para confirmar a adição da despesa"
      />
    </>
  );
};

export default ExpenseModal;
