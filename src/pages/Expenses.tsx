import React, { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, TrendingDown, Calendar, Loader2, ChevronDown, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getCashRegisters, calculateCashSummary } from '@/utils/localStorage';

const Expenses = () => {
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlPeriod = searchParams.get('period');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlPeriod) setSelectedPeriod(urlPeriod);
  }, [searchParams]);

  const [expensesData, setExpensesData] = useState<Array<{
    id: string;
    amount: number;
    description: string;
    timestamp: number;
    registerId: string;
  }>>([]);

  useEffect(() => {
    const loadExpensesData = async () => {
      if (!selectedPeriod && !startDate && !endDate) {
        setExpensesData([]);
        return;
      }

      setIsLoading(true);
      try {
        const cashRegisters = await getCashRegisters();
        
        const now = new Date();
        let filterStartDate: Date;
        let filterEndDate: Date = new Date(now);

        if (startDate && endDate) {
          filterStartDate = new Date(startDate);
          filterEndDate = new Date(endDate);
        } else {
          switch (selectedPeriod) {
            case 'diario':
              filterStartDate = new Date(now);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'semanal':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 7);
              break;
            case 'mensal':
              filterStartDate = new Date(now);
              filterStartDate.setMonth(now.getMonth() - 1);
              break;
            case 'anual':
              filterStartDate = new Date(now);
              filterStartDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              filterStartDate = new Date(now);
              filterStartDate.setMonth(now.getMonth() - 1);
          }
        }

        const filteredRegisters = cashRegisters.filter(register => {
          const registerDate = new Date(register.openingTimestamp);
          return registerDate >= filterStartDate && registerDate <= filterEndDate;
        });

        const allExpenses: Array<{
          id: string;
          amount: number;
          description: string;
          timestamp: number;
          registerId: string;
        }> = [];

        await Promise.all(
          filteredRegisters.map(async (register) => {
            const summary = await calculateCashSummary(register);
            summary.expenses.forEach(expense => {
              allExpenses.push({
                ...expense,
                registerId: register.id
              });
            });
          })
        );

        const sortedExpenses = allExpenses.sort((a, b) => b.timestamp - a.timestamp);
        setExpensesData(sortedExpenses);
      } catch (error) {
        console.error('Error loading expenses data:', error);
        setExpensesData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExpensesData();
  }, [selectedPeriod, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const totalPages = Math.ceil(expensesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = expensesData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate]);

  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6 text-emerald-500" />
            Despesas Gerais
          </h1>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-6 overflow-auto">
        {/* Filtros */}
        <Card className="mb-6 bg-slate-700 border-slate-600">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-600/50 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    Período de Análise
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="period" className="text-slate-400 text-base">Período</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-base">
                        <SelectValue placeholder="Selecione um período" />
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
                  <div className="flex items-end">
                    <Button 
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      variant="outline"
                      className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 text-base"
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                Total de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-rose-400">
                {formatCurrency(totalExpenses)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                Número de Despesas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white">
                {expensesData.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Despesas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Lista de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-400">Carregando despesas...</span>
              </div>
            ) : paginatedExpenses.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="table-responsive">
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-xs md:text-sm">Data/Hora</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm">Descrição</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm">Valor</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm table-hide-mobile">Registro de Caixa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExpenses.map((expense) => (
                        <TableRow key={expense.id} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-xs md:text-sm p-2 md:p-4">
                            <div>
                              <div>{formatDate(expense.timestamp)}</div>
                              <div className="text-xs md:text-sm text-slate-500">{formatTime(expense.timestamp)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs md:text-sm p-2 md:p-4">
                            <div className="truncate max-w-[100px] md:max-w-none">
                              {expense.description}
                            </div>
                          </TableCell>
                          <TableCell className="text-rose-400 font-semibold text-xs md:text-sm p-2 md:p-4">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs md:text-sm p-2 md:p-4 table-hide-mobile">
                            {expense.registerId.substring(0, 8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
                            return page === 1 || 
                                   page === totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, index, array) => {
                            const showEllipsisBefore = index > 0 && array[index - 1] < page - 1;
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <span className="px-4 py-2 text-slate-400">...</span>
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
              <div className="text-center py-8 text-slate-400">
                Nenhuma despesa encontrada no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Expenses;
