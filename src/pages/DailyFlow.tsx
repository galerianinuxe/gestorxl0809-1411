
import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, DollarSign, Printer, Trash2, ShoppingCart, TrendingDown, FileText, TrendingUp } from 'lucide-react';
import { getCashRegisters, calculateCashSummary } from '@/utils/localStorage';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import { toast } from '@/hooks/use-toast';

const DailyFlow = () => {
  const { getCurrentFormatSettings } = useReceiptFormatSettings();
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [selectedPeriod, setSelectedPeriod] = useState('diario');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyFlowData, setDailyFlowData] = useState<Array<{
    id: string;
    openingDate: Date;
    closingDate: Date | null;
    openingAmount: number;
    finalAmount: number;
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    expectedAmount: number;
    difference: number;
  }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Carregar configurações do sistema
  useEffect(() => {
    const loadSystemSettings = async () => {
      if (!user) return;
      
      try {
        const { data: systemSettings } = await supabase
          .from('system_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (systemSettings) {
          setSettings(systemSettings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    if (user) {
      loadSystemSettings();
    }
  }, [user]);

  useEffect(() => {
    const loadDailyFlowData = async () => {
      // Não carregar dados automaticamente - só quando necessário
      if (!selectedPeriod && !startDate && !endDate) {
        setDailyFlowData([]);
        return;
      }
      
      try {
        const cashRegisters = await getCashRegisters();
        
        // Filtrar apenas registros fechados
        const closedRegisters = cashRegisters.filter(register => register.status === 'closed');
        
        const flowData = await Promise.all(
          closedRegisters.map(async (register) => {
            const summary = await calculateCashSummary(register);
            return {
              id: register.id,
              openingDate: new Date(register.openingTimestamp),
              closingDate: register.closingTimestamp ? new Date(register.closingTimestamp) : null,
              openingAmount: register.initialAmount,
              finalAmount: summary.finalAmount || 0,
              totalSales: summary.totalSales,
              totalPurchases: summary.totalPurchases || 0,
              totalExpenses: summary.expenses.reduce((sum, expense) => sum + expense.amount, 0),
              expectedAmount: summary.expectedAmount,
              difference: (summary.finalAmount || 0) - summary.expectedAmount
            };
          })
        );

        const sortedData = flowData.sort((a, b) => b.openingDate.getTime() - a.openingDate.getTime());
        setDailyFlowData(sortedData);
      } catch (error) {
        console.error('Error loading daily flow data:', error);
        setDailyFlowData([]);
      }
    };

    loadDailyFlowData();
  }, [selectedPeriod, startDate, endDate]);

  const filteredDailyFlowData = useMemo(() => {
    const now = new Date();
    let filterStartDate: Date;
    let filterEndDate: Date = new Date(now);

    if (startDate && endDate) {
      filterStartDate = new Date(startDate);
      filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
    } else {
      switch (selectedPeriod) {
        case 'diario':
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'semanal':
          filterStartDate = new Date(now);
          filterStartDate.setDate(now.getDate() - 7);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'mensal':
          filterStartDate = new Date(now);
          filterStartDate.setMonth(now.getMonth() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'anual':
          filterStartDate = new Date(now);
          filterStartDate.setFullYear(now.getFullYear() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        default:
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now);
          filterEndDate.setHours(23, 59, 59, 999);
      }
    }

    return dailyFlowData.filter(item => {
      return item.openingDate >= filterStartDate && item.openingDate <= filterEndDate;
    });
  }, [dailyFlowData, selectedPeriod, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR');
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredDailyFlowData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredDailyFlowData.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate]);

  const totalSales = filteredDailyFlowData.reduce((sum, item) => sum + item.totalSales, 0);
  const totalPurchases = filteredDailyFlowData.reduce((sum, item) => sum + item.totalPurchases, 0);
  const totalExpenses = filteredDailyFlowData.reduce((sum, item) => sum + item.totalExpenses, 0);
  const totalDifference = filteredDailyFlowData.reduce((sum, item) => sum + item.difference, 0);

  const handleDeleteCashRegister = async () => {
    if (!itemToDelete || !user) return;

    try {
      // Deletar do Supabase
      const { error } = await supabase
        .from('cash_registers')
        .delete()
        .eq('id', itemToDelete)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao deletar fechamento:', error);
        toast({
          title: "Erro ao excluir",
          description: "Erro ao excluir fechamento de caixa.",
          variant: "destructive"
        });
        return;
      }

      // Remover do localStorage também
      const storedRegisters = localStorage.getItem(`cash_registers_${user.id}`);
      if (storedRegisters) {
        const registers = JSON.parse(storedRegisters);
        const updatedRegisters = registers.filter((reg: any) => reg.id !== itemToDelete);
        localStorage.setItem(`cash_registers_${user.id}`, JSON.stringify(updatedRegisters));
      }

      // Atualizar estado local
      setDailyFlowData(prev => prev.filter(item => item.id !== itemToDelete));

      toast({
        title: "Fechamento excluído",
        description: "Fechamento de caixa excluído com sucesso.",
      });

      setShowPasswordModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar fechamento:', error);
      toast({
        title: "Erro ao excluir",
        description: "Erro inesperado ao excluir fechamento.",
        variant: "destructive"
      });
    }
  };

  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setShowPasswordModal(true);
  };

  const printCashClosingReceipt = (item: any) => {
    const { logo, whatsapp1, whatsapp2, address } = settings;
    const formatSettings = getCurrentFormatSettings();

    const printContent = `
      <div style="
        width: ${formatSettings.container_width};
        max-width: ${formatSettings.container_width};
        margin: 0;
        padding: ${formatSettings.padding};
        font-family: 'Roboto', Arial, sans-serif;
        font-size: ${formatSettings.table_font_size};
        line-height: 1.3;
        color: #000 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      ">
        <!-- Header com logo e informações -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${formatSettings.margins};">
          ${logo ? `
            <div style="width: 30%; flex: 0 0 30%; margin: 0; padding: 0;">
              <img src="${logo}" alt="Logo" style="
                max-width: ${formatSettings.logo_max_width};
                max-height: ${formatSettings.logo_max_height};
                margin: 0;
                padding: 0;
                filter: contrast(200%) brightness(0);
                -webkit-filter: contrast(200%) brightness(0);
              " />
            </div>
          ` : `<div style="width: 30%; flex: 0 0 30%;"></div>`}
          
          <div style="width: 70%; flex: 0 0 70%; text-align: center;">
            <div style="font-size: ${formatSettings.phone_font_size}; font-weight: bold;">
              ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
              ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
            </div>
            ${address ? `
              <div style="font-size: ${formatSettings.address_font_size}; margin-top: 3mm; font-weight: bold; text-align: center; word-wrap: break-word; overflow-wrap: break-word;">
                ${address}
              </div>
            ` : ""}
          </div>
        </div>
        
        <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: ${formatSettings.margins};">
          COMPROVANTE DE FECHAMENTO DE CAIXA
        </div>
        
        <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
        
        <div style="text-align: center; margin-bottom: ${formatSettings.margins}; font-size: ${formatSettings.datetime_font_size}; font-weight: bold;">
          ${formatDate(item.openingDate)} - ${formatDate(item.closingDate || new Date())}
        </div>
        
        <table style="
          width: 100%;
          border-collapse: collapse;
          font-size: ${formatSettings.table_font_size};
          margin-bottom: ${formatSettings.margins};
          font-weight: bold;
        ">
          <tbody>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Abertura:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatDate(item.openingDate)} ${formatTime(item.openingDate)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Fechamento:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${item.closingDate ? formatDate(item.closingDate) + ' ' + formatTime(item.closingDate) : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Valor Inicial:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatCurrency(item.openingAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Total Compras:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatCurrency(item.totalPurchases)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Total Vendas:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatCurrency(item.totalSales)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Total Despesas:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatCurrency(item.totalExpenses)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 2px solid #000;">Valor Esperado:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 2px solid #000;">${formatCurrency(item.expectedAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">Valor Final:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; border-bottom: 1px solid #ddd;">${formatCurrency(item.finalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 2mm 0; font-weight: bold; font-size: ${formatSettings.final_total_font_size};">DIFERENÇA:</td>
              <td style="text-align: right; padding: 2mm 0; font-weight: bold; font-size: ${formatSettings.final_total_font_size}; color: ${item.difference >= 0 ? '#10B981' : '#EF4444'};">
                ${formatCurrency(item.difference)}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: ${formatSettings.margins}; font-size: ${formatSettings.datetime_font_size}; color: #666;">
          Impresso em: ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Comprovante de Fechamento de Caixa</title>
            <style>
              @media print {
                @page { margin: 0; }
                body { margin: 0; padding: 0; }
              }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-emerald-500" />
            Fluxo Diário
          </h1>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-6 overflow-auto">
        {/* Filtros de Período */}
        <Card className="mb-6 bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Período de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period" className="text-slate-400 text-base">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate" className="text-slate-400 text-base">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white text-base [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-slate-400 text-base">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white text-base [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>
              <div>
                <Button 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  variant="outline"
                  className="w-full bg-slate-600 border-slate-500 text-white hover:bg-slate-500 text-base"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Total em Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-emerald-400">
                {formatCurrency(totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                Total em Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-white">
                {formatCurrency(totalPurchases)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                Total em Despesas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-rose-400">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                Fechamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-white">
                {filteredDailyFlowData.length}
              </div>
            </CardContent>
          </Card>

          <Card className={`${totalDifference >= 0 ? 'bg-emerald-900 border-emerald-700' : 'bg-red-900 border-red-700'}`}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${totalDifference >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                Diferença Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`text-xl font-bold ${totalDifference >= 0 ? 'text-emerald-100' : 'text-red-100'}`}>
                {formatCurrency(totalDifference)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Fechamentos */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Histórico de Fechamentos Diários</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDailyFlowData.length > 0 ? (
              <>
                <div className="overflow-x-auto md:overflow-x-visible">
                  <div className="md:hidden">
                    {/* Mobile View - Cards verticalmente */}
                    <div className="space-y-4">
                      {paginatedData.map((item) => (
                        <div key={item.id} className="w-full bg-gray-700 rounded-lg p-4 border border-gray-600">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-white font-semibold">{formatDate(item.openingDate)}</div>
                                <div className="text-xs text-gray-400">{formatTime(item.openingDate)}</div>
                              </div>
                              <div className="text-right">
                                {item.closingDate ? (
                                  <div>
                                    <div className="text-white text-sm">{formatDate(item.closingDate)}</div>
                                    <div className="text-xs text-gray-400">{formatTime(item.closingDate)}</div>
                                  </div>
                                ) : (
                                  <span className="text-yellow-400 text-sm">Em aberto</span>
                                )}
                              </div>
                            </div>
                            
                           <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                               <div className="text-gray-400 text-xs">Valor Inicial</div>
                               <div className="text-white font-semibold">{formatCurrency(item.openingAmount)}</div>
                             </div>
                             <div>
                               <div className="text-gray-400 text-xs">Valor Final</div>
                               <div className="text-white font-semibold">{formatCurrency(item.finalAmount)}</div>
                             </div>
                             <div>
                               <div className="text-gray-400 text-xs">Compras</div>
                               <div className="text-white font-semibold">{formatCurrency(item.totalPurchases)}</div>
                             </div>
                             <div>
                               <div className="text-gray-400 text-xs">Vendas</div>
                               <div className="text-white font-semibold">{formatCurrency(item.totalSales)}</div>
                             </div>
                             <div>
                               <div className="text-gray-400 text-xs">Despesas</div>
                               <div className="text-white font-semibold">{formatCurrency(item.totalExpenses)}</div>
                             </div>
                             <div>
                               <div className="text-gray-400 text-xs">Diferença</div>
                               <div className={`font-semibold ${
                                 item.difference >= 0 ? 'text-green-400' : 'text-red-400'
                               }`}>
                                 {formatCurrency(item.difference)}
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex gap-2 mt-3">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => printCashClosingReceipt(item)}
                               className="flex-1 bg-green-700 border-green-600 text-white hover:bg-green-600 text-xs flex items-center justify-center gap-2"
                             >
                               <Printer className="h-3 w-3" />
                               Imprimir
                             </Button>
                             <Button
                               onClick={() => confirmDelete(item.id)}
                               variant="outline"
                               size="sm"
                               className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop View - Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-white">Data Abertura</TableHead>
                          <TableHead className="text-white">Data Fechamento</TableHead>
                          <TableHead className="text-white">Valor Inicial</TableHead>
                          <TableHead className="text-white">Compras</TableHead>
                          <TableHead className="text-white">Vendas</TableHead>
                          <TableHead className="text-white">Despesas</TableHead>
                          <TableHead className="text-white">Esperado</TableHead>
                          <TableHead className="text-white">Final</TableHead>
                          <TableHead className="text-white">Diferença</TableHead>
                          <TableHead className="text-white">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((item) => (
                          <TableRow key={item.id} className="border-gray-600">
                            <TableCell className="text-gray-300">
                              <div>
                                <div>{formatDate(item.openingDate)}</div>
                                <div className="text-sm text-gray-400">{formatTime(item.openingDate)}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {item.closingDate ? (
                                <div>
                                  <div>{formatDate(item.closingDate)}</div>
                                  <div className="text-sm text-gray-400">{formatTime(item.closingDate)}</div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.openingAmount)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.totalPurchases)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.totalSales)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.totalExpenses)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.expectedAmount)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {formatCurrency(item.finalAmount)}
                            </TableCell>
                            <TableCell className={`font-semibold ${item.difference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatCurrency(item.difference)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => printCashClosingReceipt(item)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-700 border-green-600 text-white hover:bg-green-600"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => confirmDelete(item.id)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-700 border-red-600 text-white hover:bg-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {selectedPeriod === '' && !startDate && !endDate
                  ? "Selecione um período para carregar os dados."
                  : "Nenhum fechamento de caixa encontrado no período selecionado."
                }
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and one page before/after current
                        return page === 1 || 
                               page === totalPages || 
                               (page >= currentPage - 1 && page <= currentPage + 1);
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && array[index - 1] < page - 1;
                        
                        return (
                          <React.Fragment key={page}>
                            {showEllipsisBefore && (
                              <PaginationItem>
                                <span className="px-4 py-2 text-gray-400">...</span>
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          </React.Fragment>
                        );
                      })
                    }
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmação de senha */}
        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={(open) => {
            setShowPasswordModal(open);
            if (!open) {
              setItemToDelete(null);
            }
          }}
          onAuthenticated={handleDeleteCashRegister}
          title="Confirmar Exclusão"
          description="Digite sua senha para confirmar a exclusão deste fechamento de caixa."
        />
      </main>
    </div>
  );
};

export default DailyFlow;
