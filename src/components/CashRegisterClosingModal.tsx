
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { closeActiveCashRegister, calculateCashSummary, getActiveCashRegister } from '../utils/localStorage';
import { scheduleUltraTask } from '../utils/ultraPerformanceUtils';
import { getOrders } from '../utils/supabaseStorage';
import { toast } from '@/hooks/use-toast';
import { Clock } from 'lucide-react';
import PasswordPromptModal from './PasswordPromptModal';
import CashRegisterSummaryCard from './cash-register/CashRegisterSummaryCard';
import CashRegisterStatus from './cash-register/CashRegisterStatus';
import CashRegisterFinalAmount from './cash-register/CashRegisterFinalAmount';
import CashRegisterExportModal from './CashRegisterExportModal';
import { CashRegister, CashSummary } from '../types/pdv';
import { 
  calculatePurchasePaymentBreakdown,
  calculateSalesPaymentBreakdown, 
  calculatePurchaseWeight,
  calculateSalesWeight,
  calculateSalesTransactionsCount,
  formatCurrencyInput, 
  parseCurrencyInput,
  PaymentBreakdown 
} from '../utils/cashRegisterCalculations';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  finalAmount: z
    .number({ required_error: "Valor final é obrigatório" })
    .min(0, "O valor não pode ser negativo")
});

interface CashRegisterClosingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CashRegisterClosingModal: React.FC<CashRegisterClosingModalProps> = ({ 
  open, 
  onOpenChange,
  onComplete
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  const { user } = useAuth();
  
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [cashSummary, setCashSummary] = useState<CashSummary | null>(null);
  const [realTimeDifference, setRealTimeDifference] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrintConfirmation, setShowPrintConfirmation] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingFinalAmount, setPendingFinalAmount] = useState<number | null>(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [purchaseBreakdown, setPurchaseBreakdown] = useState<PaymentBreakdown>({
    cashAmount: 0,
    pixAmount: 0,
    debitAmount: 0,
    creditAmount: 0
  });
  const [salesBreakdown, setSalesBreakdown] = useState<PaymentBreakdown>({
    cashAmount: 0,
    pixAmount: 0,
    debitAmount: 0,
    creditAmount: 0
  });
  const [purchaseWeight, setPurchaseWeight] = useState(0);
  const [salesWeight, setSalesWeight] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [receiptFormat, setReceiptFormat] = useState<'50mm' | '80mm'>('80mm');
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      finalAmount: 0
    }
  });

  const finalAmountValue = form.watch('finalAmount');

  // Load receipt format preference from localStorage
  useEffect(() => {
    const savedFormat = localStorage.getItem('receiptFormat') as '50mm' | '80mm' | null;
    if (savedFormat) {
      setReceiptFormat(savedFormat);
    }
  }, []);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData();
      if (user) {
        loadSystemSettings();
      }
    }
  }, [open, user]);

  const loadData = async () => {
    try {
      const register = await getActiveCashRegister();
      if (register) {
        setActiveCashRegister(register);
        const summary = await calculateCashSummary(register);
        setCashSummary(summary);
        
        // Calculate total relevant transactions
        const relevantTransactions = register.transactions.filter(transaction => 
          transaction.type === 'sale' || 
          transaction.type === 'purchase' || 
          transaction.type === 'expense' || 
          transaction.type === 'addition'
        );
        setTotalTransactions(relevantTransactions.length);

        // Calculate payment breakdown for both purchases and sales
        const purchaseBD = await calculatePurchasePaymentBreakdown(register, getOrders);
        setPurchaseBreakdown(purchaseBD);
        
        const salesBD = await calculateSalesPaymentBreakdown(register, getOrders);
        setSalesBreakdown(salesBD);
        
        // Calculate weights for purchases and sales
        const purchaseW = await calculatePurchaseWeight(register, getOrders);
        setPurchaseWeight(purchaseW);
        
        const salesW = await calculateSalesWeight(register, getOrders);
        setSalesWeight(salesW);
        
        // Calculate sales transactions count
        const salesC = await calculateSalesTransactionsCount(register, getOrders);
        setSalesCount(salesC);
        
        console.log('Purchase breakdown calculated:', purchaseBD);
        console.log('Sales breakdown calculated:', salesBD);
        console.log('Purchase weight calculated:', purchaseW);
        console.log('Sales weight calculated:', salesW);
        console.log('Sales count calculated:', salesC);
      }
    } catch (error) {
      console.error('Error loading cash register data:', error);
    }
  };

  // Load system settings from Supabase
  const loadSystemSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Calculate total opening amount (initial + additions) and fund additions count
  const getOpeningAmountAndAdditions = () => {
    if (!activeCashRegister) return { totalOpening: 0, additionsCount: 0 };
    
    const additionTransactions = activeCashRegister.transactions.filter(
      transaction => transaction.type === 'addition'
    );
    
    const totalAdditions = additionTransactions.reduce(
      (sum, transaction) => sum + transaction.amount, 0
    );
    
    return {
      totalOpening: activeCashRegister.initialAmount + totalAdditions,
      additionsCount: additionTransactions.length
    };
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setInputValue('');
      form.setValue('finalAmount', 0);
      setRealTimeDifference(0);
    }
  }, [open, form]);

  // Update real-time difference whenever final amount changes
  useEffect(() => {
    if (cashSummary && finalAmountValue !== undefined) {
      const difference = finalAmountValue - cashSummary.expectedAmount;
      setRealTimeDifference(difference);
    }
  }, [finalAmountValue, cashSummary]);

  // Handle input change with currency formatting
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Format the input value
    const formattedValue = formatCurrencyInput(value);
    setInputValue(formattedValue);
    
    // Parse and set the numeric value
    const numericValue = parseCurrencyInput(formattedValue);
    form.setValue('finalAmount', numericValue);
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Validate that final amount is at least 0
    if (!inputValue || inputValue.trim() === '' || data.finalAmount < 0) {
      form.setError('finalAmount', {
        type: 'manual',
        message: 'Informe o valor final (mínimo R$ 0,00)'
      });
      return;
    }

    // Store the final amount and show print confirmation
    setPendingFinalAmount(data.finalAmount);
    setShowPrintConfirmation(true);
  };

  const handlePrintConfirmation = (shouldPrint: boolean) => {
    setShowPrintConfirmation(false);
    
    if (shouldPrint) {
      printCashRegisterSummary();
    }
    
    // Show export modal after print decision
    setShowExportModal(true);
  };

  const handleExportComplete = () => {
    setShowExportModal(false);
    // Show password modal after export modal
    setShowPasswordModal(true);
  };

  const printCashRegisterSummary = () => {
    if (!activeCashRegister || !cashSummary || pendingFinalAmount === null) return;

    const { totalOpening, additionsCount } = getOpeningAmountAndAdditions();
    const totalExpenses = cashSummary.expenses ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
    const { logo, whatsapp1, whatsapp2, address } = settings;

    // Get format styles based on receipt format preference
    const getFormatStyles = () => {
      if (receiptFormat === '50mm') {
        return {
          pageSize: '46mm auto',
          containerWidth: '46mm',
          logoMaxWidth: '100%',
          logoMaxHeight: '20mm',
          headerLogoWidth: '25%',
          headerInfoWidth: '75%',
          phoneFontSize: '12px',
          addressFontSize: '10px',
          titleFontSize: '12px',
          customerFontSize: '10px',
          tableFontSize: '10px',
          totalsFontSize: '12px',
          finalTotalFontSize: '14px',
          datetimeFontSize: '9px',
          padding: '0',
          margins: '1mm 0'
        };
      } else {
        return {
          pageSize: '80mm auto',
          containerWidth: '80mm',
          logoMaxWidth: '110%',
          logoMaxHeight: '55mm',
          headerLogoWidth: '30%',
          headerInfoWidth: '70%',
          phoneFontSize: '22px',
          addressFontSize: '13.25px',
          titleFontSize: '22.176px',
          customerFontSize: '19.327px',
          tableFontSize: '12.834px',
          totalsFontSize: '20.625px',
          finalTotalFontSize: '28.08px',
          datetimeFontSize: '20.124px',
          padding: '2mm',
          margins: '3mm 0'
        };
      }
    };

    const formatStyles = getFormatStyles();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resumo do Fechamento de Caixa</title>
        <style>
          @page {
            size: ${formatStyles.pageSize};
            margin: 0;
          }
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          
          body {
            font-family: 'Roboto', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            margin: 0;
            padding: ${formatStyles.padding};
            width: ${formatStyles.containerWidth};
            max-width: ${formatStyles.containerWidth};
            color: #000 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: ${formatStyles.margins};
          }
          
          .logo-container {
            width: ${formatStyles.headerLogoWidth};
            flex: 0 0 ${formatStyles.headerLogoWidth};
            margin: 0;
            padding: 0;
          }
          
          .logo-container img {
            max-width: ${formatStyles.logoMaxWidth};
            max-height: ${formatStyles.logoMaxHeight};
            margin: 0;
            padding: 0;
            filter: contrast(200%) brightness(0);
            -webkit-filter: contrast(200%) brightness(0);
          }
          
          .info-container {
            width: ${formatStyles.headerInfoWidth};
            flex: 0 0 ${formatStyles.headerInfoWidth};
            text-align: center;
          }
          
          .phone-numbers {
            font-size: ${formatStyles.phoneFontSize};
            font-weight: bold;
          }
          
          .address {
            font-size: ${formatStyles.addressFontSize};
            font-weight: bold;
            margin-top: ${formatStyles.margins};
            text-align: center;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .title {
            text-align: center;
            font-weight: bold;
            font-size: ${formatStyles.titleFontSize};
            margin-bottom: 1.05mm;
          }
          
          .customer {
            text-align: center;
            margin-bottom: 3.6mm;
            font-size: ${formatStyles.customerFontSize};
            font-weight: bold;
          }
          
          .separator {
            border-bottom: 2px solid #000;
            margin: ${formatStyles.margins};
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${formatStyles.tableFontSize};
            margin-bottom: 3mm;
            font-weight: bold;
          }
          
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 2mm 0;
            font-weight: bold;
          }
          
          th:nth-child(2), th:nth-child(3), th:nth-child(4) {
            text-align: right;
          }
          
          td {
            padding: 1mm 0;
            vertical-align: top;
            font-weight: bold;
            word-wrap: break-word;
          }
          
          td:nth-child(2), td:nth-child(3), td:nth-child(4) {
            text-align: right;
          }
          
          .totals {
            display: flex;
            justify-content: space-between;
            margin: 1.4mm 0;
            font-size: ${formatStyles.totalsFontSize};
            font-weight: bold;
          }
          
          .final-total {
            text-align: right;
            font-weight: bold;
            font-size: ${formatStyles.finalTotalFontSize};
            margin: 2.16mm 0;
          }
          
          .datetime {
            text-align: center;
            font-size: ${formatStyles.datetimeFontSize};
            margin: ${formatStyles.margins};
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${logo ? `
            <div class="logo-container">
              <img src="${logo}" alt="Logo" />
            </div>
          ` : `<div class="logo-container"></div>`}
          
          <div class="info-container">
            <div class="phone-numbers">
              ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
              ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
            </div>
            ${address ? `
              <div class="address">
                <div style="word-wrap: break-word; overflow-wrap: break-word;">
                  ${address}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
        
        <div class="title">
          RESUMO DO FECHAMENTO DE CAIXA
        </div>
        
        <div class="customer">
          Data: ${new Date(activeCashRegister.openingTimestamp).toLocaleDateString('pt-BR')}
        </div>
        
        <div class="separator"></div>
        
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Abertura</td>
              <td>R$ ${activeCashRegister.initialAmount.toFixed(2)}</td>
            </tr>
            
            ${additionsCount > 0 ? `
            <tr>
              <td>Adições (${additionsCount})</td>
              <td>R$ ${(totalOpening - activeCashRegister.initialAmount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Abertura</td>
              <td>R$ ${totalOpening.toFixed(2)}</td>
            </tr>
            ` : ''}
            
            <tr>
              <td>Total Vendas</td>
              <td>R$ ${cashSummary.totalSales.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Compras Dinheiro</td>
              <td>R$ ${purchaseBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Compras PIX</td>
              <td>R$ ${purchaseBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas Dinheiro</td>
              <td>R$ ${salesBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas PIX</td>
              <td>R$ ${salesBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Total Despesas</td>
              <td>R$ ${totalExpenses.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Total Peso Compras</td>
              <td>${purchaseWeight.toFixed(3)} kg</td>
            </tr>
            
            <tr>
              <td>Total Peso Vendas</td>
              <td>${salesWeight.toFixed(3)} kg</td>
            </tr>
            
            <tr>
              <td>Vendas Dinheiro</td>
              <td>R$ ${salesBreakdown.cashAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Vendas PIX</td>
              <td>R$ ${salesBreakdown.pixAmount.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td>Transações de Vendas</td>
              <td>${salesCount}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="separator"></div>
        
        <div class="totals">
          <span>Saldo Esperado:</span>
          <span>R$ ${cashSummary.expectedAmount.toFixed(2)}</span>
        </div>
        
        <div class="final-total">
          Saldo Final: R$ ${pendingFinalAmount.toFixed(2)}
        </div>
        
        <div class="totals" style="color: ${realTimeDifference === 0 ? 'green' : realTimeDifference > 0 ? 'blue' : 'red'}">
          <span>Diferença:</span>
          <span>
            ${realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'} 
            R$ ${Math.abs(realTimeDifference).toFixed(2)}
          </span>
        </div>
        
        <div class="separator"></div>
        
        <div class="totals">
          <span>Total Transações:</span>
          <span>${totalTransactions}</span>
        </div>
        
        <div class="datetime">
          *** FECHAMENTO DE CAIXA ***
        </div>
        
        <div class="datetime">
          ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const handlePasswordAuthenticated = () => {
    if (pendingFinalAmount !== null) {
      executeCloseCashRegister(pendingFinalAmount);
      setPendingFinalAmount(null);
    }
  };

  const executeCloseCashRegister = async (finalAmount: number) => {
    try {
      const closedRegister = await closeActiveCashRegister(finalAmount);
      
      if (closedRegister) {
        toast({
          title: "Caixa fechado com sucesso",
          description: `Saldo final: R$ ${finalAmount.toFixed(2)}`,
          duration: 3000,
        });
        onOpenChange(false);
        onComplete();
      } else {
        toast({
          title: "Erro ao fechar caixa",
          description: "Ocorreu um erro ao fechar o caixa. Tente novamente.",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error closing cash register:', error);
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro ao fechar o caixa. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Handle cancel closing
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!cashSummary || !activeCashRegister) {
    return null;
  }

  // Calculate total expenses if they exist in cashSummary
  const totalExpenses = cashSummary.expenses ? cashSummary.expenses.reduce((sum, expense) => sum + expense.amount, 0) : 0;
  const { totalOpening, additionsCount } = getOpeningAmountAndAdditions();

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={onOpenChange}
      >
        <DialogContent className={`${
          isMobileOrTablet 
            ? "w-[100vw] h-[100vh] max-w-none" 
            : "!w-[95vw] !max-w-[1730px] h-auto max-h-[85vh]"
        } bg-gray-900 text-white border-gray-800 overflow-hidden flex flex-col`}>
          <DialogHeader className="pb-3 shrink-0">
            <DialogTitle className="text-center text-white flex items-center justify-center gap-2 text-lg font-semibold">
              <Clock className="h-5 w-5" /> Fechamento de Caixa
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400 text-sm">
              Resumo do dia {new Date(activeCashRegister.openingTimestamp).toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>
          
          {isMobileOrTablet ? (
            // Mobile/Tablet Layout - Vertical stacked cards
            <div className="flex flex-col space-y-1.5 overflow-y-auto px-2 pb-4 flex-1">
              <CashRegisterSummaryCard
                title="Valor de Abertura"
                value={`R$ ${totalOpening.toFixed(2)}`}
                subtitle={additionsCount > 0 ? `(+${additionsCount} ${additionsCount > 1 ? 'adições' : 'adição'} de saldo)` : undefined}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Vendas"
                value={`R$ ${cashSummary.totalSales.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Compras em Dinheiro"
                value={`R$ ${purchaseBreakdown.cashAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Compras em PIX"
                value={`R$ ${purchaseBreakdown.pixAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Vendas em Dinheiro"
                value={`R$ ${salesBreakdown.cashAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Vendas em PIX"
                value={`R$ ${salesBreakdown.pixAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Despesas"
                value={`R$ ${totalExpenses.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Peso"
                value={`${purchaseWeight.toFixed(3)} kg`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Saldo Esperado"
                value={`R$ ${cashSummary.expectedAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Saldo Atual"
                value={`R$ ${cashSummary.currentAmount.toFixed(2)}`}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Total de Transações"
                value={totalTransactions}
                isMobileOrTablet={isMobileOrTablet}
              />
              <CashRegisterSummaryCard
                title="Adições de Saldo"
                value={additionsCount}
                isMobileOrTablet={isMobileOrTablet}
              />
              
              {/* Status do Caixa */}
              <div className="bg-gray-800 px-3 py-2 rounded-sm">
                <div className="flex justify-between items-center">
                  <div className="text-gray-300 text-[10px]">Status do Caixa</div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-base ${
                      realTimeDifference === 0 
                        ? "text-pdv-green" 
                        : realTimeDifference > 0 
                          ? "text-blue-400" 
                          : "text-pdv-red"
                    }`}>
                      {realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'}
                    </span>
                    <span className={`font-semibold text-sm ${
                      realTimeDifference === 0 
                        ? "text-pdv-green" 
                        : realTimeDifference > 0 
                          ? "text-blue-400" 
                          : "text-pdv-red"
                    }`}>
                      R$ {Math.abs(realTimeDifference).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Saldo Final */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                  <FormField
                    control={form.control}
                    name="finalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <div className="bg-gray-800 rounded-sm px-3 py-2">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-gray-300 text-[10px]">Saldo Final (R$)</div>
                          </div>
                          <div className="w-full mx-auto">
                            <CashRegisterFinalAmount
                              inputValue={inputValue}
                              onInputChange={handleInputChange}
                              autoFocus={true}
                            />
                          </div>
                        </div>
                        <FormMessage className="text-pdv-red text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-3 pt-1">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={handleCancel}
                      className="bg-transparent hover:bg-gray-700 text-white border-gray-600 text-base w-full h-11"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-pdv-red hover:bg-red-700 text-base w-full h-11"
                    >
                      Fechar Caixa
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          ) : (
            // Desktop Layout - Professional grid with 4 columns
            <div className="flex flex-col gap-4 px-4 pb-4 overflow-y-auto flex-1">
              {/* Main Summary Grid - 4 columns */}
              <div className="grid grid-cols-4 gap-3">
                <CashRegisterSummaryCard
                  title="Valor de Abertura"
                  value={`R$ ${totalOpening.toFixed(2)}`}
                  subtitle={additionsCount > 0 ? `(+${additionsCount} ${additionsCount > 1 ? 'adições' : 'adição'} de saldo)` : undefined}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Total de Vendas"
                  value={`R$ ${cashSummary.totalSales.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Compras em Dinheiro"
                  value={`R$ ${purchaseBreakdown.cashAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Compras em PIX"
                  value={`R$ ${purchaseBreakdown.pixAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Vendas em Dinheiro"
                  value={`R$ ${salesBreakdown.cashAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Vendas em PIX"
                  value={`R$ ${salesBreakdown.pixAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Total de Despesas"
                  value={`R$ ${totalExpenses.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Total de Peso"
                  value={`${purchaseWeight.toFixed(3)} kg`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Saldo Esperado"
                  value={`R$ ${cashSummary.expectedAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Saldo Atual"
                  value={`R$ ${cashSummary.currentAmount.toFixed(2)}`}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Total de Transações"
                  value={totalTransactions}
                  isMobileOrTablet={false}
                />
                <CashRegisterSummaryCard
                  title="Adições de Saldo"
                  value={additionsCount}
                  isMobileOrTablet={false}
                />
              </div>
              
              {/* Bottom Section - Status and Final Amount */}
              <div className="grid grid-cols-3 gap-4">
                {/* Status do Caixa */}
                <div className="bg-gray-800 p-4 rounded-lg text-center flex flex-col justify-center">
                  <div className="text-gray-400 text-sm mb-2">Status do Caixa</div>
                  <div className={`font-bold text-3xl ${
                    realTimeDifference === 0 
                      ? "text-pdv-green" 
                      : realTimeDifference > 0 
                        ? "text-blue-400" 
                        : "text-pdv-red"
                  }`}>
                    {realTimeDifference === 0 ? 'CONFERE' : realTimeDifference > 0 ? 'SOBRA' : 'FALTA'}
                  </div>
                  <div className={`font-semibold text-lg mt-1 ${
                    realTimeDifference === 0 
                      ? "text-pdv-green" 
                      : realTimeDifference > 0 
                        ? "text-blue-400" 
                        : "text-pdv-red"
                  }`}>
                    R$ {Math.abs(realTimeDifference).toFixed(2)}
                  </div>
                </div>
                
                {/* Saldo Final Input */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="col-span-2 flex flex-col gap-4">
                    <FormField
                      control={form.control}
                      name="finalAmount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col justify-center">
                            <div className="text-gray-400 text-sm mb-2 text-center">Saldo Final (R$)</div>
                            <CashRegisterFinalAmount
                              inputValue={inputValue}
                              onInputChange={handleInputChange}
                              autoFocus={true}
                            />
                          </div>
                          <FormMessage className="text-pdv-red text-sm mt-1" />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handleCancel}
                        className="bg-transparent hover:bg-gray-700 text-white border-gray-600 text-base flex-1 h-12"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-pdv-red hover:bg-red-700 text-base flex-1 h-12"
                      >
                        Fechar Caixa
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Confirmation Dialog */}
      <Dialog open={showPrintConfirmation} onOpenChange={setShowPrintConfirmation}>
        <DialogContent className="bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-center text-white">Deseja imprimir resumo?</DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              Imprimir o resumo do fechamento de caixa antes de finalizar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 justify-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handlePrintConfirmation(false)}
              className="bg-transparent hover:bg-gray-700 text-white border-gray-600"
            >
              Não
            </Button>
            <Button 
              type="button" 
              onClick={() => handlePrintConfirmation(true)}
              className="bg-pdv-red hover:bg-red-700"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <CashRegisterExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        onComplete={handleExportComplete}
        cashRegister={activeCashRegister}
        cashSummary={cashSummary}
        pendingFinalAmount={pendingFinalAmount}
        purchaseBreakdown={purchaseBreakdown}
        salesBreakdown={salesBreakdown}
        purchaseWeight={purchaseWeight}
        salesWeight={salesWeight}
        salesCount={salesCount}
        totalTransactions={totalTransactions}
        totalOpening={totalOpening}
        additionsCount={additionsCount}
        realTimeDifference={realTimeDifference}
        userWhatsapp={settings.whatsapp1}
        companyName={settings.company}
      />

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Confirmar Fechamento"
        description="Digite sua senha para confirmar o fechamento do caixa"
      />
    </>
  );
};

export default CashRegisterClosingModal;
