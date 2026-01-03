
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShoppingCart, CalendarIcon, Search, X, Filter, ChevronDown, DollarSign, Scale } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import { Order, Material } from '@/types/pdv';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const PurchaseOrders = () => {
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const period = searchParams.get('period') || 'mensal';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadData = async () => {
      // Não carregar dados automaticamente - só quando necessário
      if (!selectedPeriod && !filterStartDate && !filterEndDate) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [ordersData, materialsData] = await Promise.all([
          getOrders(),
          getMaterials()
        ]);
        setOrders(ordersData);
        setMaterials(materialsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPeriod, filterStartDate, filterEndDate]);

  const purchaseOrders = useMemo(() => {
    // Start with purchase orders only
    let filteredOrders = orders.filter(order => 
      order.type === 'compra' && order.status === 'completed'
    );

    // Apply date filters
    if (filterStartDate || filterEndDate) {
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        
        if (filterStartDate && orderDate < filterStartDate) {
          return false;
        }
        
        if (filterEndDate) {
          const endOfDay = new Date(filterEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (orderDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    } else {
      // Apply default period filter if no custom dates
      const now = new Date();
      let defaultStartDate: Date;

      switch (selectedPeriod) {
        case 'diario':
          defaultStartDate = new Date(now);
          defaultStartDate.setHours(0, 0, 0, 0);
          break;
        case 'semanal':
          defaultStartDate = new Date(now);
          defaultStartDate.setDate(now.getDate() - 7);
          break;
        case 'mensal':
          defaultStartDate = new Date(now);
          defaultStartDate.setMonth(now.getMonth() - 1);
          break;
        case 'anual':
          defaultStartDate = new Date(now);
          defaultStartDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          defaultStartDate = new Date(now);
          defaultStartDate.setMonth(now.getMonth() - 1);
      }

      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= defaultStartDate && orderDate <= now;
      });
    }

    // Apply material filters
    if (selectedMaterials.length > 0) {
      filteredOrders = filteredOrders.filter(order => 
        order.items.some(item => 
          selectedMaterials.some(selectedMaterial => 
            item.materialName.toLowerCase().includes(selectedMaterial.toLowerCase())
          )
        )
      );
    }

    return filteredOrders.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, startDate, endDate, selectedPeriod, filterStartDate, filterEndDate, selectedMaterials]);

  // Pagination logic
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = purchaseOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, filterStartDate, filterEndDate, selectedMaterials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const totalAmount = purchaseOrders.reduce((sum, order) => sum + order.total, 0);
  const totalWeight = purchaseOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // Get unique materials from orders for suggestions
  const uniqueMaterials = useMemo(() => {
    const materialNames = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => {
        materialNames.add(item.materialName);
      });
    });
    return Array.from(materialNames).sort();
  }, [orders]);

  const clearFilters = () => {
    setSelectedPeriod('mensal');
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setSelectedMaterials([]);
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Materiais Comprados</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando dados...</div>
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
            <ShoppingCart className="h-6 w-6 text-emerald-500" />
            Materiais Comprados
          </h1>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-6 overflow-auto">
        {/* Filtros */}
        <Card className="bg-slate-700 border-slate-600 mb-6">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-600/50 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-emerald-500" />
                    Filtros
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
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
              <div className="space-y-2">
                <Label className="text-slate-400">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-600 border-slate-500 text-white hover:bg-slate-500",
                        !filterStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-600 border-slate-500 text-white hover:bg-slate-500",
                        !filterEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400">Materiais</Label>
                <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={materialSearchOpen}
                      className="w-full justify-between bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {selectedMaterials.length > 0 
                        ? `${selectedMaterials.length} material(is) selecionado(s)`
                        : "Selecionar materiais"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar material..." 
                        value={materialSearchValue}
                        onValueChange={setMaterialSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                        <CommandGroup>
                          {uniqueMaterials
                            .filter(material => 
                              material.toLowerCase().includes(materialSearchValue.toLowerCase())
                            )
                            .map((material) => (
                              <CommandItem
                                key={material}
                                value={material}
                                onSelect={() => {
                                  if (!selectedMaterials.includes(material)) {
                                    setSelectedMaterials(prev => [...prev, material]);
                                  }
                                  setMaterialSearchValue('');
                                }}
                              >
                                {material}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400">Ações</Label>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {selectedMaterials.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-400">Materiais Selecionados:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterials.map((material) => (
                    <div
                      key={material}
                      className="bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {material}
                      <button
                        onClick={() => removeMaterial(material)}
                        className="hover:bg-emerald-600/30 rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                Total de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white">
                {purchaseOrders.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white">
                {formatCurrency(totalAmount)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-500" />
                Peso Total
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-white">
                {formatWeight(totalWeight)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pedidos */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Lista de Materiais Comprados</CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedOrders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table className="table-responsive">
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-xs md:text-sm">Data</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm table-hide-mobile">ID do Pedido</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm">Materiais</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm table-hide-mobile">Peso Total</TableHead>
                        <TableHead className="text-slate-300 text-xs md:text-sm">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-xs md:text-sm p-2 md:p-4">
                            {formatDate(order.timestamp)}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs md:text-sm p-2 md:p-4 table-hide-mobile">
                            {order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs md:text-sm p-2 md:p-4">
                            <div className="truncate max-w-[120px] md:max-w-none">
                              {order.items.map(item => item.materialName).join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs md:text-sm p-2 md:p-4 table-hide-mobile">
                            {formatWeight(order.items.reduce((sum, item) => sum + item.quantity, 0))}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-xs md:text-sm p-2 md:p-4">
                            {formatCurrency(order.total)}
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
              </>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {selectedMaterials.length > 0 || filterStartDate || filterEndDate
                  ? "Nenhum material encontrado com os filtros aplicados."
                  : loading ? "Selecione um período para carregar os dados." : "Nenhum material comprado encontrado no período selecionado."
                }
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PurchaseOrders;
