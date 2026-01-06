import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign, Scale, FileText, TrendingUp } from 'lucide-react';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import { Order } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('monthly');
  const [filterStartDate, setFilterStartDate] = useState(startDate);
  const [filterEndDate, setFilterEndDate] = useState(endDate);
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

  const salesData = useMemo(() => {
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

    const salesOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return order.type === 'venda' && 
             order.status === 'completed' &&
             orderDate >= filterStart && 
             orderDate <= filterEnd;
    });

    const salesItems: Array<{
      orderId: string;
      date: number;
      materialName: string;
      quantity: number;
      salePrice: number;
      purchasePrice: number;
      saleTotal: number;
      profit: number;
    }> = [];

    salesOrders.forEach(order => {
      order.items.forEach(item => {
        const material = materials.find(m => m.id === item.materialId);
        const purchasePrice = material?.price || 0;
        const profit = item.total - (purchasePrice * item.quantity);
        
        salesItems.push({
          orderId: order.id,
          date: order.timestamp,
          materialName: item.materialName,
          quantity: item.quantity,
          salePrice: item.price,
          purchasePrice,
          saleTotal: item.total,
          profit
        });
      });
    });

    return {
      salesItems: salesItems.sort((a, b) => b.date - a.date),
      salesOrders: salesOrders,
      salesOrdersCount: salesOrders.length
    };
  }, [orders, materials, filterStartDate, filterEndDate, selectedPeriod]);

  const totalPages = Math.ceil(salesData.salesItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSalesData = salesData.salesItems.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, filterStartDate, filterEndDate]);

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

  const totalSales = salesData.salesItems.reduce((sum, item) => sum + item.saleTotal, 0);
  const totalWeight = salesData.salesItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalProfit = salesData.salesItems.reduce((sum, item) => sum + item.profit, 0);

  const clearFilters = () => {
    setSelectedPeriod('monthly');
    setFilterStartDate('');
    setFilterEndDate('');
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
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Total Vendas"
            value={formatCurrency(totalSales)}
          />
          <MetricCard
            icon={Scale}
            iconColor="text-emerald-500"
            label="Peso Vendido"
            value={formatWeight(totalWeight)}
          />
          <MetricCard
            icon={FileText}
            iconColor="text-emerald-500"
            label="Transações"
            value={salesData.salesOrdersCount}
          />
          <MetricCard
            icon={TrendingUp}
            iconColor={totalProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
            label="Lucro Total"
            value={formatCurrency(totalProfit)}
          />
        </div>

        {/* Lista de Vendas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {salesData.salesItems.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600">
                      <TableHead className="text-slate-300 text-sm p-2">Data</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Material</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden sm:table-cell">Peso</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden md:table-cell">Preço Compra</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2 hidden md:table-cell">Preço Venda</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Total</TableHead>
                      <TableHead className="text-slate-300 text-sm p-2">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSalesData.map((item, index) => (
                      <TableRow key={`${item.orderId}-${index}`} className="border-slate-600 hover:bg-slate-600/30">
                        <TableCell className="text-slate-300 text-sm p-2">
                          {formatDate(item.date)}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm p-2 max-w-[100px] truncate">
                          {item.materialName}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm p-2 hidden sm:table-cell">
                          {formatWeight(item.quantity)}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                Nenhuma venda encontrada no período selecionado.
              </div>
            )}
            
            {/* Paginação */}
            {salesData.salesItems.length > itemsPerPage && (
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
