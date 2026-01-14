import React, { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, Printer, Trash2, ShoppingCart, TrendingDown, FileText, TrendingUp, User } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getCashRegisters, calculateCashSummary } from '@/utils/localStorage';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import { toast } from '@/hooks/use-toast';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';

const DailyFlow = () => {
  const { getCurrentFormatSettings } = useReceiptFormatSettings();
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({});
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('daily');
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
    userName: string;
  }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string>('all');

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
    if (!user) return;
    
    const loadDailyFlowData = async () => {
      try {
        const cashRegisters = await getCashRegisters();
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
              difference: (summary.finalAmount || 0) - summary.expectedAmount,
              userName: register.userName || 'Usuário'
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
  }, [user]);

  const filteredDailyFlowData = useMemo(() => {
    const now = new Date();
    let filterStartDate: Date;
    let filterEndDate: Date = new Date(now);
    filterEndDate.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && startDate && endDate) {
      filterStartDate = new Date(startDate);
      filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999);
    } else {
      switch (selectedPeriod) {
        case 'daily':
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          filterStartDate = new Date(now);
          filterStartDate.setDate(now.getDate() - 7);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          filterStartDate = new Date(now);
          filterStartDate.setMonth(now.getMonth() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          filterStartDate = new Date(now);
          filterStartDate.setFullYear(now.getFullYear() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
          break;
        default:
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
      }
    }

    return dailyFlowData.filter(item => {
      const dateInRange = item.openingDate >= filterStartDate && item.openingDate <= filterEndDate;
      const operatorMatch = selectedOperator === 'all' || item.userName === selectedOperator;
      return dateInRange && operatorMatch;
    });
  }, [dailyFlowData, selectedPeriod, startDate, endDate, selectedOperator]);

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
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(filteredDailyFlowData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredDailyFlowData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate, selectedOperator]);

  const totalSales = filteredDailyFlowData.reduce((sum, item) => sum + item.totalSales, 0);
  const totalPurchases = filteredDailyFlowData.reduce((sum, item) => sum + item.totalPurchases, 0);
  const totalExpenses = filteredDailyFlowData.reduce((sum, item) => sum + item.totalExpenses, 0);
  const totalDifference = filteredDailyFlowData.reduce((sum, item) => sum + item.difference, 0);

  const handleDeleteCashRegister = async () => {
    if (!itemToDelete || !user) return;

    try {
      const { error } = await supabase
        .from('cash_registers')
        .delete()
        .eq('id', itemToDelete)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Erro ao excluir",
          description: "Erro ao excluir fechamento de caixa.",
          variant: "destructive"
        });
        return;
      }

      const storedRegisters = localStorage.getItem(`cash_registers_${user.id}`);
      if (storedRegisters) {
        const registers = JSON.parse(storedRegisters);
        const updatedRegisters = registers.filter((reg: any) => reg.id !== itemToDelete);
        localStorage.setItem(`cash_registers_${user.id}`, JSON.stringify(updatedRegisters));
      }

      setDailyFlowData(prev => prev.filter(item => item.id !== itemToDelete));

      toast({
        title: "Fechamento excluído",
        description: "Fechamento de caixa excluído com sucesso.",
      });

      setShowPasswordModal(false);
      setItemToDelete(null);
    } catch (error) {
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
      <div style="width: ${formatSettings.container_width}; max-width: ${formatSettings.container_width}; margin: 0; padding: ${formatSettings.padding}; font-family: Arial, sans-serif; font-size: ${formatSettings.table_font_size}; color: #000; background: #fff;">
        ${logo ? `<div style="text-align: center; margin-bottom: 10px;"><img src="${logo}" alt="Logo" style="max-width: ${formatSettings.logo_max_width}; max-height: ${formatSettings.logo_max_height};" /></div>` : ''}
        <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 10px;">FECHAMENTO DE CAIXA</div>
        <div style="border-bottom: 2px solid #000; margin: 10px 0;"></div>
        <div style="margin-bottom: 10px;">
          <div><strong>Abertura:</strong> ${formatDate(item.openingDate)} ${formatTime(item.openingDate)}</div>
          <div><strong>Fechamento:</strong> ${item.closingDate ? formatDate(item.closingDate) + ' ' + formatTime(item.closingDate) : '-'}</div>
        </div>
        <div style="border-bottom: 1px solid #000; margin: 10px 0;"></div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td>Valor Inicial:</td><td style="text-align: right;">${formatCurrency(item.openingAmount)}</td></tr>
          <tr><td>Compras:</td><td style="text-align: right;">${formatCurrency(item.totalPurchases)}</td></tr>
          <tr><td>Vendas:</td><td style="text-align: right;">${formatCurrency(item.totalSales)}</td></tr>
          <tr><td>Despesas:</td><td style="text-align: right;">${formatCurrency(item.totalExpenses)}</td></tr>
          <tr><td>Esperado:</td><td style="text-align: right;">${formatCurrency(item.expectedAmount)}</td></tr>
          <tr><td>Final:</td><td style="text-align: right;">${formatCurrency(item.finalAmount)}</td></tr>
          <tr><td><strong>DIFERENÇA:</strong></td><td style="text-align: right; font-weight: bold; color: ${item.difference >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(item.difference)}</td></tr>
        </table>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Fechamento</title></head><body onload="window.print(); window.close();">${printContent}</body></html>`);
      printWindow.document.close();
    }
  };

  const clearFilters = () => {
    setSelectedPeriod('daily');
    setStartDate('');
    setEndDate('');
    setSelectedOperator('all');
  };

  const uniqueOperators = useMemo(() => {
    const operators = dailyFlowData.map(item => item.userName);
    return [...new Set(operators)].sort();
  }, [dailyFlowData]);

  const OperatorFilter = (
    <div className="flex items-center gap-2">
      <Label className="text-slate-300 text-sm whitespace-nowrap">Operador:</Label>
      <Select value={selectedOperator} onValueChange={setSelectedOperator}>
        <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10 min-w-[150px]">
          <User className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600">
          <SelectItem value="all" className="text-white">Todos os Operadores</SelectItem>
          {uniqueOperators.map((operator) => (
            <SelectItem key={operator} value={operator} className="text-white">
              {operator}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Fluxo Diário
            </h1>
          </div>
          <ContextualHelpButton module="caixa" />
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
          extraFilters={OperatorFilter}
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Vendas"
            value={formatCurrency(totalSales)}
          />
          <MetricCard
            icon={ShoppingCart}
            iconColor="text-blue-500"
            label="Compras"
            value={formatCurrency(totalPurchases)}
          />
          <MetricCard
            icon={TrendingDown}
            iconColor="text-rose-500"
            label="Despesas"
            value={formatCurrency(totalExpenses)}
          />
          <MetricCard
            icon={FileText}
            iconColor="text-emerald-500"
            label="Fechamentos"
            value={filteredDailyFlowData.length}
          />
          <MetricCard
            icon={TrendingUp}
            iconColor={totalDifference >= 0 ? "text-emerald-500" : "text-rose-500"}
            label="Diferença"
            value={formatCurrency(totalDifference)}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {/* Lista de Fechamentos */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Histórico de Fechamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {filteredDailyFlowData.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-2">
                  {paginatedData.map((item) => (
                    <Card key={item.id} className="bg-slate-800 border-slate-600">
                      <CardContent className="p-3">
                        {/* Header com nome do usuário */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">
                              {item.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{item.userName}</p>
                            <p className="text-slate-400 text-xs">
                              {formatDate(item.openingDate)} às {formatTime(item.openingDate)}
                            </p>
                          </div>
                          <div className={`text-sm font-bold ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(item.difference)}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <div className="text-slate-400">Compras</div>
                            <div className="text-white">{formatCurrency(item.totalPurchases)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Vendas</div>
                            <div className="text-white">{formatCurrency(item.totalSales)}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Despesas</div>
                            <div className="text-white">{formatCurrency(item.totalExpenses)}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printCashClosingReceipt(item)}
                            className="flex-1 bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-600 text-xs"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Imprimir
                          </Button>
                          <Button
                            onClick={() => confirmDelete(item.id)}
                            variant="outline"
                            size="sm"
                            className="bg-rose-700 border-rose-600 text-white hover:bg-rose-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-sm p-2">Operador</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Abertura</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Fechamento</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Compras</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Vendas</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Despesas</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Diferença</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item) => (
                        <TableRow key={item.id} className="border-slate-600">
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs">
                                  {item.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="truncate max-w-[100px]">{item.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div>{formatDate(item.openingDate)}</div>
                            <div className="text-xs text-slate-500">{formatTime(item.openingDate)}</div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">
                            {item.closingDate ? (
                              <>
                                <div>{formatDate(item.closingDate)}</div>
                                <div className="text-xs text-slate-500">{formatTime(item.closingDate)}</div>
                              </>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">{formatCurrency(item.totalPurchases)}</TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">{formatCurrency(item.totalSales)}</TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">{formatCurrency(item.totalExpenses)}</TableCell>
                          <TableCell className={`text-sm p-2 font-semibold ${item.difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(item.difference)}
                          </TableCell>
                          <TableCell className="p-2">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => printCashClosingReceipt(item)}
                                variant="outline"
                                size="sm"
                                className="bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-600 h-8 w-8 p-0"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => confirmDelete(item.id)}
                                variant="outline"
                                size="sm"
                                className="bg-rose-700 border-rose-600 text-white hover:bg-rose-600 h-8 w-8 p-0"
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
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
              </>
            ) : (
              <div className="text-center py-6 text-slate-400">
                Nenhum fechamento encontrado no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>

        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={(open) => {
            setShowPasswordModal(open);
            if (!open) setItemToDelete(null);
          }}
          onAuthenticated={handleDeleteCashRegister}
          title="Confirmar Exclusão"
          description="Digite sua senha para confirmar a exclusão."
        />
      </main>
    </div>
  );
};

export default DailyFlow;
