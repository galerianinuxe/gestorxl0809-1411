import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, DollarSign, Filter, ChevronDown, Scale, FileText, TrendingUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import { Order } from '@/types/pdv';
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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const period = searchParams.get('period') || 'mensal';
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadData = async () => {
      if (!selectedPeriod) {
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
  }, [selectedPeriod]);

  const salesData = useMemo(() => {
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

    const salesOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return order.type === 'venda' && 
             order.status === 'completed' &&
             orderDate >= filterStartDate && 
             orderDate <= filterEndDate;
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
  }, [orders, materials, startDate, endDate, selectedPeriod]);

  const totalPages = Math.ceil(salesData.salesItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSalesData = salesData.salesItems.slice(startIndex, endIndex);

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

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Vendas Realizadas</h1>
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
            <DollarSign className="h-6 w-6 text-emerald-500" />
            Vendas Realizadas
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {/* Filtros */}
        <Card className="mb-6 bg-slate-700 border-slate-600">
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
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-400">Período</label>
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
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Total em Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-500" />
                Peso Total Vendido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatWeight(totalWeight)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                Transações de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {salesData.salesOrdersCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Lucro Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vendas */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.salesItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600">
                    <TableHead className="text-slate-300">Data</TableHead>
                    <TableHead className="text-slate-300">Material</TableHead>
                    <TableHead className="text-slate-300">Peso</TableHead>
                    <TableHead className="text-slate-300">Preço Compra</TableHead>
                    <TableHead className="text-slate-300">Preço Venda</TableHead>
                    <TableHead className="text-slate-300">Total Venda</TableHead>
                    <TableHead className="text-slate-300">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesData.map((item, index) => (
                    <TableRow key={`${item.orderId}-${index}`} className="border-slate-600 hover:bg-slate-600/30">
                      <TableCell className="text-slate-300">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {item.materialName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatWeight(item.quantity)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(item.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {formatCurrency(item.salePrice)}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        {formatCurrency(item.saleTotal)}
                      </TableCell>
                      <TableCell className={`font-semibold ${item.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(item.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-slate-400">
                {!selectedPeriod
                  ? "Selecione um período para carregar os dados."
                  : "Nenhuma venda encontrada no período selecionado."
                }
              </div>
            )}
            
            {/* Paginação */}
            {salesData.salesItems.length > itemsPerPage && (
              <div className="mt-6 flex justify-center">
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
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    ))}
                    
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
