import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShoppingCart, Search, X, DollarSign, Scale, Filter } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import { Order, Material } from '@/types/pdv';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';

const PurchaseOrders = () => {
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const isMobile = useIsMobile();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('monthly');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadData = async () => {
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
  }, [startDate, endDate]);

  const purchaseOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.type === 'compra' && order.status === 'completed'
    );

    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      filterStart = new Date(filterStartDate);
      filterEnd = new Date(filterEndDate);
      filterEnd.setHours(23, 59, 59, 999);
    } else {
      switch (selectedPeriod) {
        case 'daily':
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          filterStart = new Date(now);
          filterStart.setMonth(now.getMonth() - 1);
          break;
        case 'yearly':
          filterStart = new Date(now);
          filterStart.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterStart = new Date(now);
          filterStart.setMonth(now.getMonth() - 1);
      }
    }

    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= filterStart && orderDate <= filterEnd;
    });

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
  }, [orders, selectedPeriod, filterStartDate, filterEndDate, selectedMaterials]);

  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = purchaseOrders.slice(startIndex, endIndex);

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
    setSelectedPeriod('monthly');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedMaterials([]);
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Materiais Comprados</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

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
              <ShoppingCart className="h-5 w-5 text-emerald-500" />
              Materiais Comprados
            </h1>
          </div>
          <ContextualHelpButton module="compra" />
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Seleção de Materiais */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          extraFilters={
            isMobile ? (
              // Mobile: Botão compacto sem label
              <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 px-3 rounded-xl bg-slate-800 border-slate-600 text-white hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">Material</span>
                    {selectedMaterials.length > 0 && (
                      <Badge variant="secondary" className="bg-emerald-600 text-white text-xs px-1.5 py-0 h-5">
                        {selectedMaterials.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 bg-slate-800 border-slate-600">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar material..." 
                      value={materialSearchValue}
                      onValueChange={setMaterialSearchValue}
                      className="text-white"
                    />
                    <CommandList>
                      <CommandEmpty className="text-slate-400 text-sm p-2">Nenhum material.</CommandEmpty>
                      <CommandGroup>
                        {uniqueMaterials
                          .filter(material => 
                            material.toLowerCase().includes(materialSearchValue.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((material) => (
                            <CommandItem
                              key={material}
                              value={material}
                              onSelect={() => {
                                if (!selectedMaterials.includes(material)) {
                                  setSelectedMaterials(prev => [...prev, material]);
                                }
                                setMaterialSearchValue('');
                                setMaterialSearchOpen(false);
                              }}
                              className="text-white hover:bg-slate-700"
                            >
                              {material}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  {selectedMaterials.length > 0 && (
                    <div className="p-2 border-t border-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {selectedMaterials.map((material) => (
                          <span
                            key={material}
                            className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1"
                          >
                            {material.substring(0, 12)}
                            <button onClick={() => removeMaterial(material)} className="hover:text-white">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            ) : (
              // Desktop: Estrutura completa com Label
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1 min-w-[200px]">
                  <Label className="text-slate-300 text-sm mb-1 block">Filtrar por Material</Label>
                  <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-slate-800 border-slate-600 text-white hover:bg-slate-700 h-10"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {selectedMaterials.length > 0 
                          ? `${selectedMaterials.length} selecionado(s)`
                          : "Selecionar materiais"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0 bg-slate-800 border-slate-600">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar..." 
                          value={materialSearchValue}
                          onValueChange={setMaterialSearchValue}
                          className="text-white"
                        />
                        <CommandList>
                          <CommandEmpty className="text-slate-400 text-sm p-2">Nenhum material.</CommandEmpty>
                          <CommandGroup>
                            {uniqueMaterials
                              .filter(material => 
                                material.toLowerCase().includes(materialSearchValue.toLowerCase())
                              )
                              .slice(0, 10)
                              .map((material) => (
                                <CommandItem
                                  key={material}
                                  value={material}
                                  onSelect={() => {
                                    if (!selectedMaterials.includes(material)) {
                                      setSelectedMaterials(prev => [...prev, material]);
                                    }
                                    setMaterialSearchValue('');
                                    setMaterialSearchOpen(false);
                                  }}
                                  className="text-white hover:bg-slate-700"
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
                {selectedMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterials.map((material) => (
                      <span
                        key={material}
                        className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1"
                      >
                        {material.substring(0, 15)}
                        <button onClick={() => removeMaterial(material)} className="hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          }
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MetricCard
            icon={ShoppingCart}
            iconColor="text-emerald-500"
            label="Pedidos"
            value={purchaseOrders.length}
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Valor Total"
            value={formatCurrency(totalAmount)}
          />
          <MetricCard
            icon={Scale}
            iconColor="text-emerald-500"
            label="Peso Total"
            value={formatWeight(totalWeight)}
          />
        </div>

        {/* Lista de Pedidos */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Lista de Compras</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {paginatedOrders.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-sm p-2">Data</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">ID</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Materiais</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">Peso</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.map((order) => (
                        <TableRow key={order.id} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-sm p-2">
                            {formatDate(order.timestamp)}
                          </TableCell>
                          <TableCell className="text-slate-400 font-mono text-xs p-2 hidden sm:table-cell">
                            {order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 max-w-[100px] truncate">
                            {order.items.map(item => item.materialName).join(', ')}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 hidden sm:table-cell">
                            {formatWeight(order.items.reduce((sum, item) => sum + item.quantity, 0))}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-sm p-2">
                            {formatCurrency(order.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
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
                Nenhuma compra encontrada no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PurchaseOrders;
