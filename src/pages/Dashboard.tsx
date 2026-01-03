import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, ptBR } from '@/utils/optimizedImports';
import { DollarSign, Archive, ShoppingCart, FileText, TrendingDown, CalendarIcon, ArrowLeft, ClipboardList, Wallet, Filter, Eye, User, Shield, Plus, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOrders, getCashRegisters, getMaterials, getActiveCashRegister } from '@/utils/supabaseStorage';
import { getOrdersForUser, getCashRegistersForUser, getMaterialsForUser, getActiveCashRegisterForUser } from '@/utils/adminDataAccess';
import { Order, CashRegister } from '@/types/pdv';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardMetrics {
  totalPurchases: number;
  grossWeight: number;
  totalSales: number;
  totalTransactions: number;
  totalExpenses: number;
  totalCashAdditions: number;
  salesData: Array<{ date: string; sales: number; purchases: number }>;
  materialsData: Array<{ name: string; quantity: number; value: number }>;
  currentStock: { [materialName: string]: number };
}

// Tipos de período
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPasswordAuthenticated, setUserPasswordAuthenticated] = useState(false);

  // Check if we're viewing as another user (admin mode)
  const adminViewingUser = location.state?.adminViewingUser;
  const adminViewingUserName = location.state?.adminViewingUserName;
  const isAdminView = !!adminViewingUser;

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [periodType, setPeriodType] = useState<PeriodType>('daily');

  // Ajusta as datas com base no tipo de período selecionado
  const updateDatesByPeriodType = (type: PeriodType) => {
    const today = new Date();
    
    switch(type) {
      case 'daily':
        setFilterStartDate(startOfDay(today));
        setFilterEndDate(endOfDay(today));
        break;
      case 'weekly':
        setFilterStartDate(startOfWeek(today, { weekStartsOn: 0 }));
        setFilterEndDate(endOfWeek(today, { weekStartsOn: 0 }));
        break;
      case 'monthly':
        setFilterStartDate(startOfMonth(today));
        setFilterEndDate(endOfMonth(today));
        break;
      case 'yearly':
        setFilterStartDate(startOfYear(today));
        setFilterEndDate(endOfYear(today));
        break;
      case 'custom':
        // Manter as datas selecionadas pelo usuário
        break;
    }
  };

  // Atualiza o período ao alterar o tipo de período
  useEffect(() => {
    updateDatesByPeriodType(periodType);
  }, [periodType]);

  // Load data from Supabase - modified to support admin viewing other users
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        let ordersData, materialsData, cashRegistersData, activeCashRegisterData;
        
        if (isAdminView && adminViewingUser) {
          // Load data for the specific user being viewed by admin
          [ordersData, materialsData, cashRegistersData, activeCashRegisterData] = await Promise.all([
            getOrdersForUser(adminViewingUser),
            getMaterialsForUser(adminViewingUser),
            getCashRegistersForUser(adminViewingUser),
            getActiveCashRegisterForUser(adminViewingUser)
          ]);
        } else {
          // Load data for the current user
          [ordersData, materialsData, cashRegistersData, activeCashRegisterData] = await Promise.all([
            getOrders(),
            getMaterials(),
            getCashRegisters(),
            getActiveCashRegister()
          ]);
        }
        
        setOrders(ordersData);
        setMaterials(materialsData);
        setCashRegisters(cashRegistersData);
        setActiveCashRegister(activeCashRegisterData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdminView, adminViewingUser]);

  const calculateMetrics = useMemo((): DashboardMetrics => {
    // Add null checks to prevent forEach on undefined
    if (!orders || !cashRegisters) {
      return {
        totalPurchases: 0,
        grossWeight: 0,
        totalSales: 0,
        totalTransactions: 0,
        totalExpenses: 0,
        totalCashAdditions: 0,
        salesData: [],
        materialsData: [],
        currentStock: {}
      };
    }

    const now = new Date();
    let filterStartDateFinal: Date;
    let filterEndDateFinal: Date;

    if (filterStartDate || filterEndDate) {
      // Use custom filter dates
      if (filterStartDate && filterEndDate) {
        filterStartDateFinal = new Date(filterStartDate);
        filterStartDateFinal.setHours(0, 0, 0, 0);
        filterEndDateFinal = new Date(filterEndDate);
        filterEndDateFinal.setHours(23, 59, 59, 999);
      } else if (filterStartDate && !filterEndDate) {
        // Se só a data inicial foi selecionada, usar o mesmo dia como final
        filterStartDateFinal = new Date(filterStartDate);
        filterStartDateFinal.setHours(0, 0, 0, 0);
        filterEndDateFinal = new Date(filterStartDate);
        filterEndDateFinal.setHours(23, 59, 59, 999);
      } else {
        // Se só a data final foi selecionada, usar o mesmo dia como inicial
        filterStartDateFinal = new Date(filterEndDate!);
        filterStartDateFinal.setHours(0, 0, 0, 0);
        filterEndDateFinal = new Date(filterEndDate!);
        filterEndDateFinal.setHours(23, 59, 59, 999);
      }
    } else {
      // Default to last 30 days if no filters
      filterStartDateFinal = new Date(now);
      filterStartDateFinal.setDate(now.getDate() - 30);
      filterStartDateFinal.setHours(0, 0, 0, 0);
      filterEndDateFinal = new Date(now);
      filterEndDateFinal.setHours(23, 59, 59, 999);
    }

    console.log('Filter dates:', {
      start: filterStartDateFinal.toISOString(),
      end: filterEndDateFinal.toISOString(),
      filterStartDate,
      filterEndDate
    });

    // Filtrar pedidos pelo período PRIMEIRO
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      return order.status === 'completed' &&
             orderDate >= filterStartDateFinal && 
             orderDate <= filterEndDateFinal;
    });

    // Processar todas as ordens para calcular estoque atual real
    const materialStocks: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.status === 'completed' && order.items) {
        order.items.forEach(item => {
          if (!materialStocks[item.materialName]) {
            materialStocks[item.materialName] = 0;
          }
          
          if (order.type === 'compra') {
            materialStocks[item.materialName] += item.quantity;
          } else if (order.type === 'venda') {
            materialStocks[item.materialName] -= item.quantity;
          }
        });
      }
    });

    // CORRIGIDO: Calcular peso bruto do estoque atual (não do período filtrado)
    let grossWeight = 0;
    Object.values(materialStocks).forEach(stock => {
      if (stock > 0) {
        grossWeight += stock;
      }
    });

    let totalPurchases = 0;
    let totalSales = 0;
    let totalTransactions = filteredOrders.length;
    let totalExpenses = 0;
    let totalCashAdditions = 0;

    filteredOrders.forEach(order => {
      if (order.type === 'compra') {
        totalPurchases += order.total;
      } else if (order.type === 'venda') {
        totalSales += order.total;
      }
    });

    // Processar despesas e adições de saldo dos registros de caixa
    const filteredRegisters = cashRegisters.filter(register => {
      const registerDate = new Date(register.openingTimestamp);
      return registerDate >= filterStartDateFinal && registerDate <= filterEndDateFinal;
    });

    filteredRegisters.forEach(register => {
      if (register.transactions) {
        register.transactions.forEach(transaction => {
          if (transaction.type === 'expense') {
            totalExpenses += transaction.amount;
          } else if (transaction.type === 'addition') {
            totalCashAdditions += transaction.amount;
          }
        });
      }
    });

    // Dados para gráficos - agrupados por dia
    const salesData: { [key: string]: { sales: number; purchases: number } } = {};
    
    // Garantir que pelo menos o dia atual apareça no gráfico
    const currentDateKey = now.toISOString().split('T')[0];
    salesData[currentDateKey] = { sales: 0, purchases: 0 };
    
    filteredOrders.forEach(order => {
      const orderDate = new Date(order.timestamp);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (!salesData[dateKey]) {
        salesData[dateKey] = { sales: 0, purchases: 0 };
      }
      
      if (order.type === 'venda') {
        salesData[dateKey].sales += order.total;
      } else if (order.type === 'compra') {
        salesData[dateKey].purchases += order.total;
      }
    });

    const chartData = Object.entries(salesData)
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        purchases: data.purchases
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Dados de materiais mais vendidos
    const materialsQuantity: { [key: string]: { quantity: number; value: number } } = {};
    
    filteredOrders.forEach(order => {
      if (order.type === 'venda' && order.items) {
        order.items.forEach(item => {
          if (!materialsQuantity[item.materialName]) {
            materialsQuantity[item.materialName] = { quantity: 0, value: 0 };
          }
          materialsQuantity[item.materialName].quantity += item.quantity;
          materialsQuantity[item.materialName].value += item.total;
        });
      }
    });

    const materialsData = Object.entries(materialsQuantity)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        value: data.value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalPurchases,
      grossWeight, // Agora representa o peso real do estoque atual
      totalSales,
      totalTransactions,
      totalExpenses,
      totalCashAdditions,
      salesData: chartData,
      materialsData,
      currentStock: materialStocks
    };
  }, [filterStartDate, filterEndDate, orders, cashRegisters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const chartConfig = {
    sales: {
      label: "Vendas",
      color: "#10B981",
    },
    purchases: {
      label: "Compras",
      color: "#3B82F6",
    },
  };

  const pieColors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  const handleCardClick = (type: string) => {
    const params = new URLSearchParams();
    if (filterStartDate) params.set('startDate', filterStartDate.toISOString().split('T')[0]);
    if (filterEndDate) params.set('endDate', filterEndDate.toISOString().split('T')[0]);
    
    const queryString = params.toString();
    
    // Prepare navigation state to maintain admin view context
    const navigationState: any = {};
    if (isAdminView) {
      navigationState.adminViewingUser = adminViewingUser;
      navigationState.adminViewingUserName = adminViewingUserName;
    }
    
    // Navigate with admin view context preserved
    switch (type) {
      case 'purchases':
        navigate(`/purchase-orders?${queryString}`, { state: navigationState });
        break;
      case 'stock':
        navigate('/current-stock', { state: navigationState });
        break;
      case 'sales':
        navigate(`/sales-orders?${queryString}`, { state: navigationState });
        break;
      case 'expenses':
        navigate(`/expenses?${queryString}`, { state: navigationState });
        break;
      case 'daily-flow':
        navigate('/daily-flow', { state: navigationState });
        break;
      case 'cash-additions':
        navigate(`/cash-additions?${queryString}`, { state: navigationState });
        break;
      case 'transactions':
        navigate(`/transactions?${queryString}`, { state: navigationState });
        break;
    }
  };

  const handlePasswordAuthenticated = () => {
    setUserPasswordAuthenticated(true);
    setShowPasswordModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriodType(value as PeriodType);
    // Para o tipo 'custom', não atualizamos as datas automaticamente
    if (value !== 'custom') {
      updateDatesByPeriodType(value as PeriodType);
    }
  };

  const applyFilters = () => {
    // Se selecionou filtro personalizado, manter as datas escolhidas
    if (periodType === 'custom') {
      console.log('Filtros personalizados aplicados:', { filterStartDate, filterEndDate });
    } else {
      // Para outros tipos de período, atualizamos as datas automaticamente
      updateDatesByPeriodType(periodType);
    }
  };

  const clearFilters = () => {
    setPeriodType('daily');
    setFilterStartDate(startOfDay(new Date()));
    setFilterEndDate(endOfDay(new Date()));
  };

  const handleExitAdminView = () => {
    navigate('/dashboard', { replace: true });
  };

  const handleBackToAdmin = () => {
    navigate('/covildomal');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-400 text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-800">
      {/* Header simplificado */}
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isAdminView ? (
              <Button
                onClick={handleBackToAdmin}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin
              </Button>
            ) : (
              <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
            )}
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {activeCashRegister && activeCashRegister.status === 'open' ? (
              <div className="hidden sm:flex items-center gap-2 bg-emerald-600/20 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-emerald-400 text-sm font-medium">
                  Caixa: {formatCurrency(activeCashRegister.currentAmount)}
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 bg-amber-600/20 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-amber-400 text-sm">Sem dados</span>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-rose-600/20 border-rose-600/50 text-rose-400 hover:bg-rose-600/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
        
        {/* Admin view indicator */}
        {isAdminView && (
          <div className="mt-3 flex items-center gap-2 bg-purple-600/20 px-3 py-2 rounded-lg">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">
              Visualizando: <strong>{adminViewingUserName}</strong>
            </span>
            <Button
              onClick={handleExitAdminView}
              variant="ghost"
              size="sm"
              className="ml-auto text-purple-300 hover:text-white text-xs"
            >
              Sair
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Seção 1: Filtro de Período - Simplificado */}
        <Card className="bg-slate-900 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[140px]">
                <Label className="text-slate-400 text-xs mb-1.5 block">Período</Label>
                <Select value={periodType} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="daily">Hoje</SelectItem>
                    <SelectItem value="weekly">Esta Semana</SelectItem>
                    <SelectItem value="monthly">Este Mês</SelectItem>
                    <SelectItem value="yearly">Este Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[130px]">
                <Label className="text-slate-400 text-xs mb-1.5 block">De</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-slate-800 border-slate-600 text-white h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {filterStartDate ? format(filterStartDate, "dd/MM/yy", { locale: ptBR }) : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={(date) => { setFilterStartDate(date); setPeriodType('custom'); }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex-1 min-w-[130px]">
                <Label className="text-slate-400 text-xs mb-1.5 block">Até</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-slate-800 border-slate-600 text-white h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {filterEndDate ? format(filterEndDate, "dd/MM/yy", { locale: ptBR }) : "Data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={(date) => { setFilterEndDate(date); setPeriodType('custom'); }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button 
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white h-10"
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Resumo Principal - Cards claros e bem organizados */}
        <div className="mb-6">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Resumo do Período
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card Compras */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all group"
              onClick={() => handleCardClick('purchases')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">COMPRAS</span>
                  <ShoppingCart className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculateMetrics.totalPurchases)}
                </div>
                <div className="text-xs text-slate-500 mt-1 group-hover:text-emerald-400">
                  Clique para detalhes →
                </div>
              </CardContent>
            </Card>

            {/* Card Vendas */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all group"
              onClick={() => handleCardClick('sales')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">VENDAS</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400">
                  {formatCurrency(calculateMetrics.totalSales)}
                </div>
                <div className="text-xs text-slate-500 mt-1 group-hover:text-emerald-400">
                  Clique para detalhes →
                </div>
              </CardContent>
            </Card>

            {/* Card Despesas */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all group"
              onClick={() => handleCardClick('expenses')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">DESPESAS</span>
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                </div>
                <div className="text-xl font-bold text-rose-400">
                  {formatCurrency(calculateMetrics.totalExpenses)}
                </div>
                <div className="text-xs text-slate-500 mt-1 group-hover:text-emerald-400">
                  Clique para detalhes →
                </div>
              </CardContent>
            </Card>

            {/* Card Transações */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all group"
              onClick={() => handleCardClick('transactions')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">TRANSAÇÕES</span>
                  <FileText className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {calculateMetrics.totalTransactions}
                </div>
                <div className="text-xs text-slate-500 mt-1 group-hover:text-emerald-400">
                  Clique para detalhes →
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção 3: Estoque e Operações */}
        <div className="mb-6">
          <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Archive className="h-5 w-5 text-emerald-500" />
            Estoque & Operações
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Estoque Atual */}
            <Card 
              className="bg-gradient-to-br from-emerald-900/50 to-slate-800 border-emerald-700/50 cursor-pointer hover:border-emerald-500 transition-all"
              onClick={() => handleCardClick('stock')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-emerald-300 text-xs font-medium">ESTOQUE ATUAL</span>
                  <Archive className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatWeight(calculateMetrics.grossWeight)}
                </div>
                <div className="text-xs text-emerald-400 mt-1">
                  Ver materiais →
                </div>
              </CardContent>
            </Card>

            {/* Adições */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all"
              onClick={() => handleCardClick('cash-additions')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs font-medium">ADIÇÕES CAIXA</span>
                  <Plus className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculateMetrics.totalCashAdditions)}
                </div>
              </CardContent>
            </Card>

            {/* Fluxo de Caixa */}
            <Card 
              className="bg-slate-700 border-slate-600 cursor-pointer hover:bg-slate-600/80 transition-all col-span-2"
              onClick={() => handleCardClick('daily-flow')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs font-medium block mb-1">FLUXO DE CAIXA</span>
                    <span className="text-white text-lg font-medium">Ver fechamentos de caixa</span>
                  </div>
                  <ClipboardList className="h-6 w-6 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção 4: Lucro Resumido - Destaque visual */}
        {orders.length > 0 && (
          <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700 mb-6">
            <CardContent className="p-5">
              <h3 className="text-slate-400 text-sm font-medium mb-4">Resumo Financeiro</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className={`text-2xl font-bold ${(calculateMetrics.totalSales - calculateMetrics.totalPurchases) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(calculateMetrics.totalSales - calculateMetrics.totalPurchases)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Lucro Bruto</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-2xl font-bold text-white">
                    {calculateMetrics.totalSales > 0 ? ((calculateMetrics.totalSales - calculateMetrics.totalPurchases) / calculateMetrics.totalSales * 100).toFixed(0) : 0}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Margem</div>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <div className={`text-2xl font-bold ${((calculateMetrics.totalSales - calculateMetrics.totalPurchases) - calculateMetrics.totalExpenses) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency((calculateMetrics.totalSales - calculateMetrics.totalPurchases) - calculateMetrics.totalExpenses)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Lucro Líquido</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção 5: Gráficos lado a lado */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Vendas vs Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculateMetrics.salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 border border-slate-600 rounded p-2 shadow-lg">
                                <p className="text-white text-xs mb-1">{new Date(label).toLocaleDateString('pt-BR')}</p>
                                {payload.map((entry, index) => (
                                  <p key={index} className="text-xs" style={{ color: entry.color }}>
                                    {entry.dataKey === 'sales' ? 'Vendas' : 'Compras'}: {formatCurrency(Number(entry.value))}
                                  </p>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="sales" fill="#10B981" name="Vendas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="purchases" fill="#3B82F6" name="Compras" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium">Top 5 Materiais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  {calculateMetrics.materialsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={calculateMetrics.materialsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }) => `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {calculateMetrics.materialsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 border border-slate-600 rounded p-2 shadow-lg">
                                  <p className="text-white text-xs">{payload[0].name}</p>
                                  <p className="text-xs text-emerald-400">
                                    {formatCurrency(Number(payload[0].value))}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      Nenhuma venda no período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensagem quando não há dados */}
        {orders.length === 0 && (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="p-8 text-center">
              <Archive className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum dado encontrado</h3>
              <p className="text-slate-500 text-sm">
                Cadastre materiais e faça transações para ver os dados aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Acesso Restrito"
        description="Digite sua senha para acessar"
      />
    </div>
  );
};

export default Dashboard;
