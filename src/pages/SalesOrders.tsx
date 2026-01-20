import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, Scale, FileText, TrendingUp, Tag, Package, Filter } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials, getMaterialCategories } from '@/utils/supabaseStorage';
import { Order, MaterialCategory } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const SalesOrders = () => {
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const isMobile = useIsMobile();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('last30');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  interface SaleItem {
    orderId: string;
    orderDate: number;
    materialId: string;
    materialName: string;
    categoryId: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    weight: number;
    salePrice: number;
    purchasePrice: number;
    saleTotal: number;
    profit: number;
  }

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


  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);
    filterEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      filterStart = new Date(filterStartDate);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd = new Date(filterEndDate);
      filterEnd.setHours(23, 59, 59, 999);
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

  // All items in the period (for general totals - not affected by category filter)
  const allPeriodItems = useMemo(() => {
    const { filterStart, filterEnd } = dateRange;

    const salesOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return order.type === 'venda' && 
             order.status === 'completed' &&
             order.items && order.items.length > 0 &&
             orderDate >= filterStart && 
             orderDate <= filterEnd;
    });

    const items: SaleItem[] = [];
    salesOrders.forEach(order => {
      order.items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        const category = material?.category_id 
          ? categories.find(c => c.id === material.category_id) 
          : null;
        const purchasePrice = material?.price || 0;
        const profit = item.total - (purchasePrice * item.quantity);
        
        items.push({
          orderId: order.id,
          orderDate: order.timestamp,
          materialId: item.materialId,
          materialName: item.materialName,
          categoryId: category?.id || null,
          categoryName: category?.name || null,
          categoryColor: category?.hex_color || category?.color || null,
          weight: item.quantity,
          salePrice: item.price,
          purchasePrice,
          saleTotal: item.total,
          profit
        });
      });
    });

    return items.sort((a, b) => b.orderDate - a.orderDate);
  }, [orders, materials, categories, dateRange]);

  // Items filtered by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return allPeriodItems;
    }
    return allPeriodItems.filter(item => item.categoryId === selectedCategory);
  }, [allPeriodItems, selectedCategory]);

  // GENERAL PERIOD TOTALS (not affected by category filter)
  const periodTotals = useMemo(() => ({
    orderCount: new Set(allPeriodItems.map(item => item.orderId)).size,
    totalWeight: allPeriodItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: allPeriodItems.reduce((sum, item) => sum + item.saleTotal, 0),
    totalProfit: allPeriodItems.reduce((sum, item) => sum + item.profit, 0)
  }), [allPeriodItems]);

  // FILTERED TOTALS (only when category filter is active)
  const filteredTotals = useMemo(() => ({
    itemCount: filteredItems.length,
    orderCount: new Set(filteredItems.map(item => item.orderId)).size,
    totalWeight: filteredItems.reduce((sum, item) => sum + item.weight, 0),
    totalAmount: filteredItems.reduce((sum, item) => sum + item.saleTotal, 0),
    totalProfit: filteredItems.reduce((sum, item) => sum + item.profit, 0)
  }), [filteredItems]);

  const hasFilter = selectedCategory !== 'all';

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, filterStartDate, filterEndDate, selectedCategory]);

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

  const clearFilters = () => {
    setSelectedPeriod('last30');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedCategory('all');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Vendas Realizadas</h1>
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
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Vendas Realizadas
            </h1>
          </div>
          <ContextualHelpButton module="venda" />
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Categoria */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          extraFilters={
            categories.length > 0 ? (
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
            ) : undefined
          }
        />

        {/* Totais do Período (sempre visíveis) */}
        <div className="mb-3">
          <p className="text-slate-400 text-xs mb-2">Totais do Período</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <MetricCard
              icon={DollarSign}
              iconColor="text-emerald-500"
              label="Total Vendas"
              value={formatCurrency(periodTotals.totalAmount)}
            />
            <MetricCard
              icon={Scale}
              iconColor="text-emerald-500"
              label="Peso Vendido"
              value={formatWeight(periodTotals.totalWeight)}
            />
            <MetricCard
              icon={FileText}
              iconColor="text-emerald-500"
              label="Transações"
              value={periodTotals.orderCount}
            />
            <MetricCard
              icon={TrendingUp}
              iconColor={periodTotals.totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
              label="Lucro Total"
              value={formatCurrency(periodTotals.totalProfit)}
            />
          </div>
        </div>

        {/* Totais Filtrados (somente quando filtro ativo) */}
        {hasFilter && (
          <div className="mb-3">
            <p className="text-amber-400 text-xs mb-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Totais Filtrados: {categories.find(c => c.id === selectedCategory)?.name}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <MetricCard
                icon={Package}
                iconColor="text-amber-500"
                label="Itens"
                value={filteredTotals.itemCount}
              />
              <MetricCard
                icon={FileText}
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
                icon={TrendingUp}
                iconColor={filteredTotals.totalProfit >= 0 ? "text-amber-500" : "text-rose-500"}
                label="Lucro"
                value={formatCurrency(filteredTotals.totalProfit)}
              />
            </div>
          </div>
        )}

        {/* Lista de Vendas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Itens Vendidos</CardTitle>
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
                      <TableHead className="text-slate-300 text-sm p-2 hidden md:table-cell">Preço Compra</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden md:table-cell">Preço Venda</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Total</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item, index) => {
                      const dt = formatDateTime(item.orderDate);
                      return (
                        <TableRow key={`${item.orderId}-${index}`} className="border-slate-600 hover:bg-slate-600/30">
                          <TableCell className="text-slate-300 text-sm p-2">
                            <div>{dt.date}</div>
                            <div className="text-xs text-slate-500">{dt.time}</div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs p-2 font-mono">
                            #{item.orderId.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 max-w-[100px] truncate">
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
                          <TableCell className="text-slate-300 text-sm p-2 hidden md:table-cell">
                            {formatCurrency(item.purchasePrice)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm p-2 hidden md:table-cell">
                            {formatCurrency(item.salePrice)}
                          </TableCell>
                          <TableCell className="text-white font-semibold text-sm p-2">
                            {formatCurrency(item.saleTotal)}
                          </TableCell>
                          <TableCell className={`font-semibold text-sm p-2 ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCurrency(item.profit)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-3 text-slate-500" />
                <h3 className="text-white font-semibold mb-1">Nenhuma venda encontrada</h3>
                <p className="text-slate-400 text-sm">
                  As vendas registradas no PDV aparecerão aqui.
                </p>
              </div>
            )}
            
            {/* Paginação */}
            {filteredItems.length > itemsPerPage && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) setCurrentPage(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
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

export default SalesOrders;
