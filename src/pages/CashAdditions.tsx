import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, Plus, Search, Calendar, Filter, DollarSign, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getCashRegisters } from '@/utils/supabaseStorage';
import { CashRegister } from '@/types/pdv';

interface CashAddition {
  id: string;
  amount: number;
  description: string;
  timestamp: string;
  cashRegisterId: string;
  cashRegisterDate: string;
}

const CashAdditions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [cashAdditions, setCashAdditions] = useState<CashAddition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlPeriod = searchParams.get('period');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlPeriod) setSelectedPeriod(urlPeriod);
  }, [searchParams]);

  useEffect(() => {
    const loadCashAdditions = async () => {
      if (!selectedPeriod && !startDate && !endDate) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const cashRegisters = await getCashRegisters();
        
        const additions: CashAddition[] = [];
        
        cashRegisters.forEach(register => {
          if (register.transactions) {
            register.transactions
              .filter(transaction => transaction.type === 'addition')
              .forEach(transaction => {
                additions.push({
                  id: `${register.id}-${transaction.timestamp}`,
                  amount: transaction.amount,
                  description: transaction.description || 'Adição de saldo',
                  timestamp: new Date(transaction.timestamp).toISOString(),
                  cashRegisterId: register.id,
                  cashRegisterDate: new Date(register.openingTimestamp).toISOString()
                });
              });
          }
        });

        additions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setCashAdditions(additions);
      } catch (error) {
        console.error('Error loading cash additions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCashAdditions();
  }, [selectedPeriod, startDate, endDate]);

  const filteredAdditions = useMemo(() => {
    let filtered = cashAdditions;

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
          filterStartDate.setMonth(now.getMonth() - 1);
          filterStartDate.setHours(0, 0, 0, 0);
      }
    }

    filtered = filtered.filter(addition => {
      const additionDate = new Date(addition.timestamp);
      const additionDateOnly = new Date(additionDate.getFullYear(), additionDate.getMonth(), additionDate.getDate());
      const filterStartDateOnly = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());
      const filterEndDateOnly = new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate());
      
      return additionDateOnly >= filterStartDateOnly && additionDateOnly <= filterEndDateOnly;
    });

    if (searchTerm) {
      filtered = filtered.filter(addition =>
        addition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addition.amount.toString().includes(searchTerm)
      );
    }

    return filtered;
  }, [cashAdditions, selectedPeriod, startDate, endDate, searchTerm]);

  const totalPages = Math.ceil(filteredAdditions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdditions = filteredAdditions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (timestamp: string) => {
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const totalAdditions = filteredAdditions.reduce((sum, addition) => sum + addition.amount, 0);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Adições de Saldo</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando adições de saldo...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-emerald-500" />
            Adições de Saldo
          </h1>
        </div>
        
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 bg-emerald-600/20 px-3 py-1 rounded-lg">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm">
              Filtrado: {startDate && format(new Date(startDate), 'dd/MM/yyyy')} 
              {startDate && endDate && ' - '}
              {endDate && format(new Date(endDate), 'dd/MM/yyyy')}
            </span>
          </div>
        )}
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

        {/* Summary Card */}
        <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Resumo das Adições de Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="text-center">
                <div className="text-2xl md:text-3xl xl:text-4xl font-bold text-emerald-400">
                  {formatCurrency(totalAdditions)}
                </div>
                <div className="text-xs md:text-sm text-slate-400">Total Adicionado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl xl:text-4xl font-bold text-white">
                  {filteredAdditions.length}
                </div>
                <div className="text-xs md:text-sm text-slate-400">Número de Adições</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="bg-slate-700 border-slate-600 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-500" />
              Buscar Adições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por descrição ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
              <Button
                onClick={() => setSearchTerm('')}
                variant="outline"
                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cash Additions List */}
        {paginatedAdditions.length === 0 ? (
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-8 text-center">
              <Plus className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma adição de saldo encontrada
              </h3>
              <p className="text-slate-400">
                {searchTerm || startDate || endDate
                  ? 'Tente ajustar os filtros para encontrar as adições desejadas.'
                  : !selectedPeriod && !startDate && !endDate
                    ? 'Selecione um período para carregar os dados.'
                    : 'Ainda não foram registradas adições de saldo.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedAdditions.map((addition) => (
              <Card key={addition.id} className="bg-slate-700 border-slate-600 hover:border-emerald-500/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-600/20 p-2 rounded-lg">
                          <Plus className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-emerald-400">
                            {formatCurrency(addition.amount)}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {formatDateTime(addition.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-11">
                        <p className="text-slate-300 mb-2">
                          {addition.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Caixa aberto em: {formatDateTime(addition.cashRegisterDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="secondary" className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
                        Adição de Saldo
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
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
          </div>
        )}
      </main>
    </div>
  );
};

export default CashAdditions;
