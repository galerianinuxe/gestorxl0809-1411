import React, { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, TrendingDown, Loader2, FileText, Tag, Percent } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getCashRegisters, calculateCashSummary } from '@/utils/localStorage';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';

// Interface tipada para item de despesa analítico
interface ExpenseItem {
  id: string;
  timestamp: number;
  registerId: string;
  origin: 'PDV' | 'Manual';
  description: string;
  category: string;
  details: string;
  amount: number;
}

// Parser para extrair categoria da descrição (formato: "Categoria - Detalhe")
const parseExpenseDescription = (description: string): { category: string; details: string } => {
  const parts = description.split(' - ');
  if (parts.length >= 2) {
    return {
      category: parts[0].trim(),
      details: parts.slice(1).join(' - ').trim()
    };
  }
  return {
    category: 'Outros',
    details: description.trim()
  };
};

const Expenses = () => {
  const [searchParams] = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlPeriod = searchParams.get('period');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlPeriod) setSelectedPeriod(urlPeriod as FilterPeriod);
  }, [searchParams]);

  const [expensesData, setExpensesData] = useState<ExpenseItem[]>([]);

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
          // FIX: Usar 'T00:00:00' para forçar parsing como horário local (evita bug de timezone)
          filterStartDate = new Date(startDate + 'T00:00:00');
          filterEndDate = new Date(endDate + 'T23:59:59.999');
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

        const allExpenses: ExpenseItem[] = [];

        await Promise.all(
          filteredRegisters.map(async (register) => {
            const summary = await calculateCashSummary(register);
            summary.expenses.forEach(expense => {
              const parsed = parseExpenseDescription(expense.description);
              allExpenses.push({
                id: expense.id,
                timestamp: expense.timestamp,
                registerId: register.id,
                origin: 'PDV',
                description: expense.description,
                category: parsed.category,
                details: parsed.details,
                amount: expense.amount
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

  // Categorias únicas para o filtro
  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(expensesData.map(e => e.category))];
    return categories.sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [expensesData]);

  // TOTAIS DO PERÍODO (fixos, não mudam com filtro de categoria)
  const periodTotals = useMemo(() => ({
    totalAmount: expensesData.reduce((sum, e) => sum + e.amount, 0),
    totalCount: expensesData.length
  }), [expensesData]);

  // Itens filtrados por categoria
  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'all') return expensesData;
    return expensesData.filter(e => e.category === selectedCategory);
  }, [expensesData, selectedCategory]);

  // TOTAIS FILTRADOS (só da categoria selecionada)
  const filteredTotals = useMemo(() => {
    if (selectedCategory === 'all') return null;
    
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = periodTotals.totalAmount > 0 
      ? (totalAmount / periodTotals.totalAmount) * 100 
      : 0;
    
    return {
      totalAmount,
      totalCount: filteredExpenses.length,
      percentage: percentage.toFixed(1)
    };
  }, [filteredExpenses, selectedCategory, periodTotals]);

  const hasFilter = selectedCategory !== 'all';

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

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate, selectedCategory, itemsPerPage]);

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
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
        {/* Filtro Padronizado com Filtro de Categoria */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-slate-300 text-sm">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="all" className="text-white hover:bg-slate-600">
                      Todas as categorias
                    </SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-600">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label className="text-slate-300 text-sm">Por Página</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="20" className="text-white hover:bg-slate-600">20</SelectItem>
                    <SelectItem value="50" className="text-white hover:bg-slate-600">50</SelectItem>
                    <SelectItem value="100" className="text-white hover:bg-slate-600">100</SelectItem>
                    <SelectItem value="200" className="text-white hover:bg-slate-600">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        {/* Totais do Período (sempre visíveis) */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <MetricCard
            icon={TrendingDown}
            iconColor="text-rose-500"
            label="Total Despesas (Período)"
            value={formatCurrency(periodTotals.totalAmount)}
          />
          <MetricCard
            icon={FileText}
            iconColor="text-emerald-500"
            label="Nº de Lançamentos"
            value={periodTotals.totalCount}
          />
        </div>

        {/* Totais da Categoria Filtrada (só aparece com filtro ativo) */}
        {filteredTotals && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <MetricCard
              icon={Tag}
              iconColor="text-amber-500"
              label={`Categoria: ${selectedCategory}`}
              value={formatCurrency(filteredTotals.totalAmount)}
              className="bg-amber-900/20 border-amber-700/30"
            />
            <MetricCard
              icon={FileText}
              iconColor="text-amber-500"
              label="Lançamentos (Filtro)"
              value={filteredTotals.totalCount}
              className="bg-amber-900/20 border-amber-700/30"
            />
            <MetricCard
              icon={Percent}
              iconColor="text-amber-500"
              label="Participação"
              value={`${filteredTotals.percentage}%`}
              className="bg-amber-900/20 border-amber-700/30"
            />
          </div>
        )}

        {/* Lista de Despesas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">
              {hasFilter ? `Despesas: ${selectedCategory}` : 'Lista de Despesas'}
            </CardTitle>
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
                        <TableHead className="text-slate-300 text-sm p-2 hidden md:table-cell">ID</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">Origem</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Categoria</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Descrição</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Valor</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2 hidden lg:table-cell">Caixa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExpenses.map((expense) => (
                        <TableRow key={expense.id} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div>{formatDate(expense.timestamp)}</div>
                            <div className="text-xs text-slate-500">{formatTime(expense.timestamp)}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs p-2 hidden md:table-cell">
                            {expense.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 hidden sm:table-cell">
                            <span className="px-2 py-1 rounded text-xs bg-blue-900/50 text-blue-300">
                              {expense.origin}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">
                            <span className="px-2 py-1 rounded text-xs bg-slate-600 text-slate-200">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 max-w-[150px] truncate">
                            {expense.details}
                          </TableCell>
                          <TableCell className="text-rose-400 font-semibold text-sm p-2">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs p-2 hidden lg:table-cell">
                            {expense.registerId.substring(0, 8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4">
                    <div className="text-sm text-slate-400 text-center mb-3">
                      Exibindo {startIndex + 1} a {Math.min(endIndex, filteredExpenses.length)} de {filteredExpenses.length} despesas
                    </div>
                    <div className="flex justify-center">
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
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma despesa encontrada no período selecionado.</p>
                {hasFilter && (
                  <p className="text-sm mt-1">Tente remover o filtro de categoria.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Expenses;
