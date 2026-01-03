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
      <div className="flex flex-col h-screen bg-gray-950">
        <header className="bg-gray-950 text-white p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <header className="bg-gray-950 text-white p-3 md:p-4 border-b border-gray-800">
        {/* Mobile layout */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isAdminView ? (
                <Button
                  onClick={handleBackToAdmin}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 hover:text-gray-300 text-white p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs">Admin</span>
                </Button>
              ) : (
                <Link to="/" className="flex items-center gap-1 hover:text-gray-300 p-2">
                  <ArrowLeft className="h-4 w-4 text-white" />
                  <span className="text-xs">Voltar</span>
                </Link>
              )}
              <h1 className="text-lg font-bold">Dashboard</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-600 border-red-500 text-white hover:bg-red-700 flex items-center gap-1 px-2 py-1"
            >
              <LogOut className="w-3 h-3" />
              <span className="text-xs">Sair</span>
            </Button>
          </div>

          {/* Admin view indicator - mobile */}
          {isAdminView && (
            <div className="flex items-center gap-2 bg-purple-600/20 px-2 py-1 rounded-lg mb-2">
              <Shield className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300 text-xs font-semibold">
                Visualizando: {adminViewingUserName}
              </span>
            </div>
          )}

          {/* Status indicators - mobile */}
          <div className="flex flex-col gap-2">
            {isAdminView && (
              <Button
                onClick={handleExitAdminView}
                variant="outline"
                size="sm"
                className="bg-red-600 border-red-500 text-white hover:bg-red-700 flex items-center gap-2 self-start"
              >
                <Eye className="w-3 h-3" />
                <span className="text-xs">Sair da Visualização</span>
              </Button>
            )}
            
            {activeCashRegister && activeCashRegister.status === 'open' && (
              <div className="flex items-center gap-2 bg-green-600/20 px-2 py-1 rounded-lg">
                <Wallet className="w-3 h-3 text-green-400" />
                <span className="text-green-300 text-xs font-semibold">
                  Caixa: {formatCurrency(activeCashRegister.currentAmount)}
                </span>
              </div>
            )}
            
            {!activeCashRegister && (
              <div className="flex items-center gap-2 bg-yellow-600/20 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                <span className="text-yellow-300 text-xs">Nenhum dado cadastrado</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop/Tablet layout */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {isAdminView ? (
              <Button
                onClick={handleBackToAdmin}
                variant="ghost"
                className="flex items-center gap-2 hover:text-gray-300 text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden lg:inline">Voltar ao Painel Admin</span>
                <span className="lg:hidden">Admin</span>
              </Button>
            ) : (
              <Link to="/" className="flex items-center gap-2 hover:text-gray-300">
                <ArrowLeft className="h-5 w-5 text-white" />
                <span className="hidden lg:inline">Voltar</span>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
              {isAdminView && (
                <div className="flex items-center gap-2 bg-purple-600/20 px-3 py-1 rounded-lg">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-semibold hidden lg:inline">
                    Visualizando como: {adminViewingUserName}
                  </span>
                  <span className="text-purple-300 text-sm font-semibold lg:hidden">
                    {adminViewingUserName}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            {isAdminView && (
              <Button
                onClick={handleExitAdminView}
                variant="outline"
                size="sm"
                className="bg-red-600 border-red-500 text-white hover:bg-red-700 flex items-center gap-1 lg:gap-2"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden lg:inline">Sair da Visualização</span>
                <span className="lg:hidden text-xs">Sair</span>
              </Button>
            )}
            
            {activeCashRegister && activeCashRegister.status === 'open' && (
              <div className="flex items-center gap-2 bg-green-600/20 px-2 lg:px-3 py-1 rounded-lg">
                <Wallet className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-xs lg:text-sm font-semibold">
                  <span className="hidden lg:inline">Caixa aberto: </span>
                  {formatCurrency(activeCashRegister.currentAmount)}
                </span>
              </div>
            )}
            
            {!activeCashRegister && (
              <div className="flex items-center gap-2 bg-yellow-600/20 px-2 lg:px-3 py-1 rounded-lg">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-yellow-300 text-xs lg:text-sm hidden lg:inline">Nenhum dado cadastrado</span>
                <span className="text-yellow-300 text-xs lg:text-sm lg:hidden">Sem dados</span>
              </div>
            )}
            
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="bg-red-600 border-red-500 text-white hover:bg-red-700 flex items-center gap-1 lg:gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Deslogar</span>
              <span className="lg:hidden text-xs">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-950">
        {isAdminView && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-emerald-500" />
                <div>
                  <h3 className="text-base font-medium text-white">
                    Visualizando Dashboard
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Usuário: <span className="font-medium text-white">{adminViewingUserName}</span>
                  </p>
                  <p className="text-gray-500 text-xs font-mono mt-1">
                    ID: {adminViewingUser}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-gray-500" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Combobox para seleção de período */}
              <div className="space-y-2">
                <Label className="text-gray-300">Período</Label>
                <Select 
                  value={periodType} 
                  onValueChange={handlePeriodChange}
                >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 h-9 text-sm">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-gray-200">
                    <SelectGroup>
                      <SelectItem value="daily" className="text-gray-200 focus:bg-gray-800 focus:text-white text-sm">Diário</SelectItem>
                      <SelectItem value="weekly" className="text-gray-200 focus:bg-gray-800 focus:text-white text-sm">Semanal</SelectItem>
                      <SelectItem value="monthly" className="text-gray-200 focus:bg-gray-800 focus:text-white text-sm">Mensal</SelectItem>
                      <SelectItem value="yearly" className="text-gray-200 focus:bg-gray-800 focus:text-white text-sm">Anual</SelectItem>
                      <SelectItem value="custom" className="text-gray-200 focus:bg-gray-800 focus:text-white text-sm">Personalizado</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 h-9 text-sm",
                        !filterStartDate && "text-gray-500"
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
                      onSelect={(date) => {
                        setFilterStartDate(date);
                        setPeriodType('custom');
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 h-9 text-sm",
                        !filterEndDate && "text-gray-500"
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
                      onSelect={(date) => {
                        setFilterEndDate(date);
                        setPeriodType('custom');
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs">Ações</Label>
                <Button 
                  onClick={applyFilters}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
                >
                  Filtrar
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs">&nbsp;</Label>
                <Button 
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 h-9 text-sm"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Métricas */}
        <div className="space-y-6 mb-6">
          {/* Primeira linha - 4 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('purchases')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Total Comprado
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculateMetrics.totalPurchases)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('stock')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Peso Bruto Estoque
                </CardTitle>
                <Archive className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {formatWeight(calculateMetrics.grossWeight)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('sales')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Total Vendas
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculateMetrics.totalSales)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('transactions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Transações
                </CardTitle>
                <FileText className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {calculateMetrics.totalTransactions}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha - 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-red-500/50 transition-all"
              onClick={() => handleCardClick('expenses')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Despesas
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-400">
                  {formatCurrency(calculateMetrics.totalExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('cash-additions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Adições de Saldo
                </CardTitle>
                <Plus className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(calculateMetrics.totalCashAdditions)}
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gray-900 border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all"
              onClick={() => handleCardClick('daily-flow')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-500">
                  Fluxo de Caixa
                </CardTitle>
                <ClipboardList className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium text-gray-400 text-center">
                  Ver Fechamentos
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mostrar mensagem quando não há dados */}
        {orders.length === 0 && (
          <Card className="mb-6 bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="text-center text-gray-400">
                <Archive className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum dado encontrado</h3>
                <p className="text-gray-500 text-sm">
                  Comece cadastrando materiais e fazendo transações para ver os dados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos - apenas mostrar se há dados */}
        {orders.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Vendas vs Compras */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Vendas vs Compras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculateMetrics.salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-gray-900 border border-gray-700 rounded p-3 shadow-lg">
                                <p className="text-white text-sm mb-2">{new Date(label).toLocaleDateString('pt-BR')}</p>
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
                      <Bar dataKey="sales" fill="#10B981" name="Vendas" />
                      <Bar dataKey="purchases" fill="#3B82F6" name="Compras" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Materiais Mais Vendidos */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Top 5 Materiais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {calculateMetrics.materialsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={calculateMetrics.materialsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                                <div className="bg-gray-900 border border-gray-700 rounded p-3 shadow-lg">
                                  <p className="text-white text-sm">{payload[0].name}</p>
                                  <p className="text-xs" style={{ color: payload[0].color }}>
                                    Valor: {formatCurrency(Number(payload[0].value))}
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
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Nenhuma venda registrada no período
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Resumo Financeiro - apenas mostrar se há dados */}
        {orders.length > 0 && (
          <Card className="mt-6 bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-emerald-500">
                    {formatCurrency(calculateMetrics.totalSales - calculateMetrics.totalPurchases)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Lucro Bruto</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-white">
                    {calculateMetrics.totalSales > 0 ? ((calculateMetrics.totalSales - calculateMetrics.totalPurchases) / calculateMetrics.totalSales * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Margem de Lucro</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-xl font-bold text-emerald-500">
                    {formatCurrency((calculateMetrics.totalSales - calculateMetrics.totalPurchases) - calculateMetrics.totalExpenses)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Lucro Líquido</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estoque Atual por Material - apenas mostrar se há dados */}
        {orders.length > 0 && Object.keys(calculateMetrics.currentStock).length > 0 && (
          <Card className="mt-6 bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Estoque por Material</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calculateMetrics.currentStock)
                  .filter(([_, quantity]) => quantity > 0)
                  .sort(([,a], [,b]) => b - a)
                  .map(([materialName, quantity]) => (
                  <div key={materialName} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <div className="text-white font-medium text-sm">{materialName}</div>
                    <div className="text-gray-400 text-xs">{formatWeight(quantity)}</div>
                  </div>
                ))}
                {Object.entries(calculateMetrics.currentStock).filter(([_, quantity]) => quantity > 0).length === 0 && (
                  <div className="text-gray-500 col-span-full text-center py-4 text-sm">
                    Nenhum material em estoque
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Acesso Restrito"
        description="Digite sua senha para acessar esta seção"
      />
    </div>
  );
};

export default Dashboard;
