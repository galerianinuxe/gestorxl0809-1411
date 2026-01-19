import React, { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, TrendingDown, Loader2, FileText } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getCashRegisters, calculateCashSummary } from '@/utils/localStorage';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';

const Expenses = () => {
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
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
    if (urlPeriod) setSelectedPeriod(urlPeriod as FilterPeriod);
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
      setIsLoading(true);
      try {
        const cashRegisters = await getCashRegisters();
        
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
              filterEndDate = new Date(now);
              filterEndDate.setHours(23, 59, 59, 999);
              break;
            case 'last30':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 30);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last60':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 60);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last90':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 90);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            case 'last365':
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 365);
              filterStartDate.setHours(0, 0, 0, 0);
              break;
            default:
              filterStartDate = new Date(now);
              filterStartDate.setDate(now.getDate() - 30);
              filterStartDate.setHours(0, 0, 0, 0);
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
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(expensesData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = expensesData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate]);

  const totalExpenses = expensesData.reduce((sum, expense) => sum + expense.amount, 0);

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setStartDate('');
    setEndDate('');
  };

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
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Despesas Gerais
            </h1>
          </div>
          <ContextualHelpButton module="despesas" />
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
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetricCard
            icon={TrendingDown}
            iconColor="text-rose-500"
            label="Total Despesas"
            value={formatCurrency(totalExpenses)}
          />
          <MetricCard
            icon={FileText}
            iconColor="text-emerald-500"
            label="Nº de Despesas"
            value={expensesData.length}
          />
        </div>

        {/* Lista de Despesas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Lista de Despesas</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-400">Carregando...</span>
              </div>
            ) : paginatedExpenses.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-sm p-2">Data/Hora</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Descrição</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Valor</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">Caixa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExpenses.map((expense) => (
                        <TableRow key={expense.id} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div>{formatDate(expense.timestamp)}</div>
                            <div className="text-xs text-slate-500">{formatTime(expense.timestamp)}</div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 max-w-[150px] truncate">
                            {expense.description}
                          </TableCell>
                          <TableCell className="text-rose-400 font-semibold text-sm p-2">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs p-2 hidden sm:table-cell">
                            {expense.registerId.substring(0, 8)}
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
