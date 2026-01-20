import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ShoppingCart, Search, X, DollarSign, Scale, Filter, Tag, Package } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials, getMaterialCategories } from '@/utils/supabaseStorage';
import { Order, Material, MaterialCategory } from '@/types/pdv';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface para item de compra individual (padrão ERP)
interface PurchaseItem {
  orderId: string;
  orderDate: number;
  materialId: string;
  materialName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  weight: number;
  unitPrice: number;
  totalPrice: number;
}

const PurchaseOrders = () => {
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const isMobile = useIsMobile();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, materialsData, categoriesData] = await Promise.all([
          getOrders(),
          getMaterials(),
          getMaterialCategories()
        ]);
        setOrders(ordersData);
        setMaterials(materialsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [startDate, endDate]);

  // Calcular range de datas baseado no período
  const dateRange = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);
    filterEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      // FIX: Usar 'T00:00:00' para forçar parsing como horário local (evita bug de timezone)
      filterStart = new Date(filterStartDate + 'T00:00:00');
      filterEnd = new Date(filterEndDate + 'T23:59:59');
    } else {
      switch (selectedPeriod) {
        case 'daily':
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        case 'last30':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 30);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last60':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 60);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last90':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 90);
          filterStart.setHours(0, 0, 0, 0);
          break;
        case 'last365':
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 365);
          filterStart.setHours(0, 0, 0, 0);
          break;
        default:
          filterStart = new Date(now);
          filterStart.setDate(now.getDate() - 30);
          filterStart.setHours(0, 0, 0, 0);
      }
    }

    return { filterStart, filterEnd };
  }, [selectedPeriod, filterStartDate, filterEndDate]);

  // TODOS OS ITENS DO PERÍODO (sem filtro de material/categoria)
  const allPeriodItems = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;

    // Filtrar pedidos de compra válidos no período
    const ordersInPeriod = orders.filter(order => 
      order.type === 'compra' && 
      order.status === 'completed' &&
      order.items && order.items.length > 0 &&
      !order.cancelled
    ).filter(order => {
      const orderDate = new Date(order.timestamp);
      return orderDate >= filterStart && orderDate <= filterEnd;
    });

    // Flatten: converter pedidos em itens individuais
    const items: PurchaseItem[] = [];
    ordersInPeriod.forEach(order => {
      order.items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        const category = material?.category_id 
          ? categories.find(c => c.id === material.category_id) 
          : null;
        
        items.push({
          orderId: order.id,
          orderDate: order.timestamp,
          materialId: item.materialId,
          materialName: item.materialName,
          categoryId: category?.id || null,
          categoryName: category?.name || null,
          categoryColor: category?.hex_color || category?.color || null,
          weight: item.quantity,
          unitPrice: item.price,
          totalPrice: item.total
        });
      });
    });

    return items;
  }, [orders, materials, categories, dateRange]);

  // ITENS FILTRADOS por material/categoria
  const filteredItems = useMemo(() => {
    let items = [...allPeriodItems];

    // Filtro por material - agora filtra ITENS, não pedidos
    if (selectedMaterials.length > 0) {
      items = items.filter(item => 
        selectedMaterials.some(selected => 
          item.materialName.toLowerCase().includes(selected.toLowerCase())
        )
      );
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.categoryId === selectedCategory);
    }

    return items.sort((a, b) => b.orderDate - a.orderDate);
  }, [allPeriodItems, selectedMaterials, selectedCategory]);

  // TOTAIS GERAIS DO PERÍODO (não afetados por filtro de material)
  const periodTotals = useMemo(() => ({
    orderCount: new Set(allPeriodItems.map(item => item.orderId)).size,
    totalWeight: allPeriodItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: allPeriodItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }), [allPeriodItems]);

  // TOTAIS DO MATERIAL FILTRADO (somente quando há filtro)
  const filteredTotals = useMemo(() => ({
    itemCount: filteredItems.length,
    orderCount: new Set(filteredItems.map(item => item.orderId)).size,
    totalWeight: filteredItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: filteredItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }), [filteredItems]);

  // Flag para saber se há filtro ativo
  const hasFilter = selectedMaterials.length > 0 || selectedCategory !== 'all';

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, filterStartDate, filterEndDate, selectedMaterials, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

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
    setSelectedPeriod('last30');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedMaterials([]);
    setSelectedCategory('all');
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
        {/* Filtro Padronizado com Seleção de Materiais e Categorias */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="flex flex-wrap gap-2 items-end">
              {/* Category Filter */}
              {categories.length > 0 && (
                <div className={isMobile ? "" : "min-w-[150px]"}>
                  {!isMobile && <Label className="text-slate-300 text-sm mb-1 block">Categoria</Label>}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-10 bg-slate-800 border-slate-600 text-white">
                      <Tag className="h-4 w-4 mr-2 text-emerald-500" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.filter(c => c.is_active !== false).map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: cat.hex_color || cat.color || '#6b7280' }}
                            />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Material Filter */}
              {isMobile ? (
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
              )}
            </div>
          }
        />

        {/* TOTAIS GERAIS DO PERÍODO - Sempre visíveis */}
        <div className="mb-3">
          <p className="text-slate-400 text-xs mb-2">Totais do Período</p>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard
              icon={ShoppingCart}
              iconColor="text-emerald-500"
              label="Compras"
              value={periodTotals.orderCount}
            />
            <MetricCard
              icon={DollarSign}
              iconColor="text-emerald-500"
              label="Total"
              value={formatCurrency(periodTotals.totalAmount)}
            />
            <MetricCard
              icon={Scale}
              iconColor="text-emerald-500"
              label="Peso Total"
              value={formatWeight(periodTotals.totalWeight)}
            />
          </div>
        </div>

        {/* TOTAIS DO FILTRO - Somente quando há filtro ativo */}
        {hasFilter && (
          <div className="mb-3">
            <p className="text-amber-400 text-xs mb-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Totais Filtrados
              {selectedMaterials.length > 0 && `: ${selectedMaterials.join(', ')}`}
              {selectedCategory !== 'all' && (
                <>
                  {selectedMaterials.length > 0 && ' | '}
                  Categoria: {categories.find(c => c.id === selectedCategory)?.name}
                </>
              )}
            </p>
            <div className="grid grid-cols-4 gap-2">
              <MetricCard
                icon={Package}
                iconColor="text-amber-500"
                label="Itens"
                value={filteredTotals.itemCount}
              />
              <MetricCard
                icon={ShoppingCart}
                iconColor="text-amber-500"
                label="Pedidos"
                value={filteredTotals.orderCount}
              />
              <MetricCard
                icon={Scale}
                iconColor="text-amber-500"
                label="Peso"
                value={formatWeight(filteredTotals.totalWeight)}
              />
              <MetricCard
                icon={DollarSign}
                iconColor="text-amber-500"
                label="Valor"
                value={formatCurrency(filteredTotals.totalAmount)}
              />
            </div>
          </div>
        )}

        {/* Lista de Itens de Compra */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">
              {hasFilter ? 'Itens Filtrados' : 'Todos os Itens de Compra'}
              <span className="text-slate-400 text-sm font-normal ml-2">
                ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'itens'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {filteredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300 text-sm p-2">Data/Hora</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Pedido</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Material</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden lg:table-cell">Categoria</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">Peso</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item, index) => {
                      const { date, time } = formatDateTime(item.orderDate);
                      return (
                        <TableRow key={`${item.orderId}-${index}`} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div>{date}</div>
                            <div className="text-xs text-slate-500">{time}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs p-2 font-mono">
                            #{item.orderId.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2">
                            {item.materialName}
                          </TableCell>
                          <TableCell className="p-2 hidden lg:table-cell">
                            {item.categoryName ? (
                              <Badge 
                                variant="outline"
                                className="text-xs border-0"
                                style={{ 
                                  backgroundColor: `${item.categoryColor || '#6b7280'}20`,
                                  color: item.categoryColor || '#9ca3af'
                                }}
                              >
                                {item.categoryName}
                              </Badge>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 hidden sm:table-cell">
                            {formatWeight(item.weight)}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-sm p-2">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma compra encontrada</h3>
                <p className="text-slate-400 text-sm">
                  {hasFilter 
                    ? 'Nenhum item corresponde aos filtros selecionados.' 
                    : 'As compras registradas no PDV aparecerão aqui.'
                  }
                </p>
              </div>
            )}

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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PurchaseOrders;
