import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, DollarSign, Filter, ChevronDown } from 'lucide-react';
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
  
  // Filtros e paginação
  const [selectedPeriod, setSelectedPeriod] = useState('mensal');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  useEffect(() => {
    const loadData = async () => {
      // Não carregar dados automaticamente - só quando necessário  
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
    // Filtrar por período
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

    // Criar lista de itens vendidos com informações detalhadas
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
      salesOrders: salesOrders, // Adicionar pedidos também para contagem
      salesOrdersCount: salesOrders.length // Contagem correta de transações
    };
  }, [orders, materials, startDate, endDate, selectedPeriod]);

  // Cálculos de paginação
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
      <div className="flex flex-col h-screen bg-gray-900">
        <header className="bg-pdv-dark text-white p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Vendas Realizadas</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando dados...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-pdv-dark text-white p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft className="h-5 w-5" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Vendas Realizadas
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        {/* Filtros */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-750 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
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
          <Card className="bg-green-900 border-green-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Total em Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-100">
                {formatCurrency(totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900 border-blue-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Peso Total Vendido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-100">
                {formatWeight(totalWeight)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900 border-purple-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Transações de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-100">
                {salesData.salesOrdersCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900 border-yellow-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">
                Lucro Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-100">
                {formatCurrency(totalProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-indigo-900 border-indigo-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">
                Itens Vendidos (Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-100">
                {salesData.salesItems.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Vendas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.salesItems.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white">Data</TableHead>
                    <TableHead className="text-white">Material</TableHead>
                    <TableHead className="text-white">Peso</TableHead>
                    <TableHead className="text-white">Preço Compra</TableHead>
                    <TableHead className="text-white">Preço Venda</TableHead>
                    <TableHead className="text-white">Total Venda</TableHead>
                    <TableHead className="text-white">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSalesData.map((item, index) => (
                    <TableRow key={`${item.orderId}-${index}`} className="border-gray-600">
                      <TableCell className="text-gray-300">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {item.materialName}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatWeight(item.quantity)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatCurrency(item.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatCurrency(item.salePrice)}
                      </TableCell>
                      <TableCell className="text-gray-300 font-semibold">
                        {formatCurrency(item.saleTotal)}
                      </TableCell>
                      <TableCell className={`font-semibold ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(item.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400">
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
