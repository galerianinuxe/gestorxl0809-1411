import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, FileText, ShoppingCart, DollarSign, Printer, CreditCard, Banknote, RefreshCw, Filter, X, Trash2, ChevronDown } from 'lucide-react';
import { getOrders, getCustomerById } from '@/utils/supabaseStorage';
import { Order } from '@/types/pdv';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { supabase } from '@/integrations/supabase/client';
import { getRandomMotivationalQuote } from '@/utils/motivationalQuotes';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<{
    logo: string | null;
    whatsapp1: string;
    whatsapp2: string;
    address: string;
    company: string;
  }>({ logo: null, whatsapp1: "", whatsapp2: "", address: "", company: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [orderToReprint, setOrderToReprint] = useState<Order | null>(null);
  const [orderPayments, setOrderPayments] = useState<{[orderId: string]: any}>({});
  
  // Receipt format settings hook
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  // Filter states - Default to "diario"
  const [filters, setFilters] = useState({
    period: 'diario',
    startDate: '',
    endDate: '',
    transactionType: 'todas',
    showFilters: false
  });

  // Transaction details modal state
  const [selectedTransaction, setSelectedTransaction] = useState<Order | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useAuth();

  // Load system settings from Supabase
  const loadSystemSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings({
          logo: data.logo,
          whatsapp1: data.whatsapp1 || "",
          whatsapp2: data.whatsapp2 || "",
          address: data.address || "",
          company: data.company || ""
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Load order payments from Supabase
  const loadOrderPayments = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('order_payments')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar pagamentos:', error);
        return;
      }

      if (data) {
        const paymentsMap = data.reduce((acc, payment) => {
          acc[payment.order_id] = payment;
          return acc;
        }, {});
        setOrderPayments(paymentsMap);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    }
  };

  // Load data function with refresh capability
  const loadData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [ordersData] = await Promise.all([
        getOrders(),
        loadSystemSettings(),
        loadOrderPayments()
      ]);
      setOrders(ordersData);
      console.log('Loaded orders:', ordersData.length);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, [user]);

  // Auto-refresh data every 30 seconds to get latest transactions
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Manual refresh function
  const handleRefresh = () => {
    loadData(true);
  };

  // Handle period filter change
  const handlePeriodChange = (newPeriod: string) => {
    console.log('Changing period to:', newPeriod);
    
    setFilters(prev => ({
      ...prev,
      period: newPeriod,
      startDate: '',
      endDate: ''
    }));
  };

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filterStartDate: Date;
    let filterEndDate: Date;

    console.log('Current filters:', filters);

    // Determine date range based on filters
    if (filters.period === 'personalizado' && filters.startDate && filters.endDate) {
      // Custom date range - use the exact dates specified
      // Parse dates and ensure they're in the local timezone
      filterStartDate = new Date(filters.startDate + 'T00:00:00');
      filterEndDate = new Date(filters.endDate + 'T23:59:59');
      
      console.log('Using custom dates:', {
        startDate: filters.startDate,
        endDate: filters.endDate,
        filterStartDate: filterStartDate.toISOString(),
        filterEndDate: filterEndDate.toISOString()
      });
    } else {
      // Predefined period filters
      switch (filters.period) {
        case 'diario':
          // Today only
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'semanal':
          // Current week (Monday to Sunday)
          const today = new Date(now);
          const dayOfWeek = today.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          
          filterStartDate = new Date(today);
          filterStartDate.setDate(today.getDate() + mondayOffset);
          filterStartDate.setHours(0, 0, 0, 0);
          
          filterEndDate = new Date(filterStartDate);
          filterEndDate.setDate(filterStartDate.getDate() + 6);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'mensal':
          // Current month
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        case 'anual':
          // Current year
          filterStartDate = new Date(now.getFullYear(), 0, 1);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now.getFullYear(), 11, 31);
          filterEndDate.setHours(23, 59, 59, 999);
          break;
        default:
          // Default to today
          filterStartDate = new Date(now);
          filterStartDate.setHours(0, 0, 0, 0);
          filterEndDate = new Date(now);
          filterEndDate.setHours(23, 59, 59, 999);
      }
    }

    console.log('Filter dates:', {
      start: filterStartDate.toISOString(),
      end: filterEndDate.toISOString(),
      period: filters.period,
      startDateFormatted: filterStartDate.toLocaleDateString('pt-BR'),
      endDateFormatted: filterEndDate.toLocaleDateString('pt-BR')
    });

    const filtered = orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      
      // Check if order is completed and within date range
      const isCompleted = order.status === 'completed';
      
      // For custom date filtering, compare dates more carefully
      let isInDateRange = false;
      if (filters.period === 'personalizado' && filters.startDate && filters.endDate) {
        // Extract just the date part for comparison (YYYY-MM-DD)
        const orderDateString = orderDate.toISOString().split('T')[0];
        const startDateString = filters.startDate;
        const endDateString = filters.endDate;
        
        isInDateRange = orderDateString >= startDateString && orderDateString <= endDateString;
        
        console.log('Custom date comparison:', {
          orderId: order.id.substring(0, 8),
          orderDateString,
          startDateString,
          endDateString,
          isInDateRange
        });
      } else {
        // Use timestamp comparison for predefined periods
        isInDateRange = orderDate >= filterStartDate && orderDate <= filterEndDate;
      }
      
      console.log('Order check:', {
        orderId: order.id.substring(0, 8),
        orderDate: orderDate.toISOString(),
        orderDateFormatted: orderDate.toLocaleDateString('pt-BR'),
        isCompleted,
        isInDateRange,
        filterStart: filterStartDate.toISOString(),
        filterEnd: filterEndDate.toISOString()
      });
      
      if (!isCompleted || !isInDateRange) return false;

      // Filter by transaction type
      if (filters.transactionType === 'vendas' && order.type !== 'venda') return false;
      if (filters.transactionType === 'compras' && order.type !== 'compra') return false;

      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);

    console.log('Filtered transactions:', {
      total: filtered.length,
      period: filters.period,
      dateRange: `${filterStartDate.toLocaleDateString('pt-BR')} - ${filterEndDate.toLocaleDateString('pt-BR')}`
    });

    return filtered;
  }, [orders, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const getTypeIcon = (type: string) => {
    return type === 'compra' ? <ShoppingCart className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'compra' ? 'text-blue-400' : 'text-green-400';
  };

  const getPaymentMethodIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix':
        return <CreditCard className="h-4 w-4" />;
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'debito':
      case 'credito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix':
        return 'PIX';
      case 'dinheiro':
        return 'Dinheiro';
      case 'debito':
        return 'Débito';
      case 'credito':
        return 'Crédito';
      default:
        return 'Dinheiro';
    }
  };

  const totalTransactions = filteredTransactions.length;
  const totalSales = filteredTransactions.filter(t => t.type === 'venda').reduce((sum, t) => sum + t.total, 0);
  const totalPurchases = filteredTransactions.filter(t => t.type === 'compra').reduce((sum, t) => sum + t.total, 0);

  // Handle reprint button click - show password modal
  const handleReprintClick = (order: Order) => {
    setOrderToReprint(order);
    setShowPasswordModal(true);
  };

  // Handle password authentication success
  const handlePasswordAuthenticated = () => {
    if (orderToReprint) {
      handleReprint(orderToReprint);
    }
  };

  // Handle transaction click
  const handleTransactionClick = (transaction: Order) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  // Handle delete button click
  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  // Delete order function
  const handleDeleteOrder = async () => {
    if (!orderToDelete || !user?.id) return;

    setIsDeleting(true);
    try {
      // Delete from orders table
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete.id)
        .eq('user_id', user.id);

      if (orderError) throw orderError;

      // Delete from order_payments table
      const { error: paymentError } = await supabase
        .from('order_payments')
        .delete()
        .eq('order_id', orderToDelete.id)
        .eq('user_id', user.id);

      if (paymentError) console.error('Erro ao deletar pagamento:', paymentError);

      // Delete from cash_transactions table
      const { error: transactionError } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('order_id', orderToDelete.id)
        .eq('user_id', user.id);

      if (transactionError) console.error('Erro ao deletar transação de caixa:', transactionError);

      toast({
        title: "Pedido excluído",
        description: `Pedido ${orderToDelete.id.substring(0, 8)} foi excluído com sucesso.`,
        duration: 3000,
      });

      // Refresh data
      loadData();
      setShowDeleteModal(false);
      setOrderToDelete(null);

    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear filters function
  const clearFilters = () => {
    setFilters({
      period: 'diario',
      startDate: '',
      endDate: '',
      transactionType: 'todas',
      showFilters: false
    });
  };

  // Simplified reprint function that opens print preview in same tab
  const handleReprint = async (order: Order) => {
    console.log('Reimprimindo pedido:', order.id);
    
    try {
      // Get customer data
      const customer = await getCustomerById(order.customerId);
      if (!customer) {
        console.error('Customer not found');
        alert('Cliente não encontrado');
        return;
      }

      // Get current format settings from user configuration
      const currentFormat = getCurrentFormat();
      const formatSettings = getCurrentFormatSettings();

      const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
      const netWeight = totalWeight - totalTara;
      const motivationalQuote = getRandomMotivationalQuote();
      const { logo, whatsapp1, whatsapp2, address } = settings;

      // Create complete print content with user's format settings
      const printContent = `
        <div style="
          width: ${formatSettings.container_width};
          max-width: ${formatSettings.container_width};
          margin: 0;
          padding: ${formatSettings.padding};
          font-family: 'Roboto', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        ">
          <!-- Header com logo 30% à esquerda e WhatsApp/Endereço 70% à direita -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${formatSettings.margins};">
            ${logo ? `
              <div style="width: 30%; flex: 0 0 30%; margin: 0; padding: 0;">
                <img src="${logo}" alt="Logo" style="
                  max-width: ${formatSettings.logo_max_width};
                  max-height: ${formatSettings.logo_max_height};
                  margin: 0;
                  padding: 0;
                  filter: contrast(200%) brightness(0);
                  -webkit-filter: contrast(200%) brightness(0);
                " />
              </div>
            ` : `<div style="width: 30%; flex: 0 0 30%;"></div>`}
            
            <div style="width: 70%; flex: 0 0 70%; text-align: center;">
              <div style="font-size: ${formatSettings.phone_font_size}; font-weight: bold;">
                ${whatsapp1 ? `<div style="word-wrap: break-word;">${whatsapp1}</div>` : ""}
                ${whatsapp2 ? `<div style="margin-top: 2px; word-wrap: break-word;">${whatsapp2}</div>` : ""}
              </div>
              ${address ? `
                <div style="font-size: ${formatSettings.address_font_size}; margin-top: 3mm; font-weight: bold; text-align: center; word-wrap: break-word; overflow-wrap: break-word;">
                  ${address}
                </div>
              ` : ""}
            </div>
          </div>
          
          <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 1.05mm;">
            ${order.type === 'venda' ? "COMPROVANTE DE VENDA" : "COMPROVANTE DE PEDIDO"}
          </div>
          
          <div style="text-align: center; margin-bottom: 3.6mm; font-size: ${formatSettings.customer_font_size}; font-weight: bold;">
            Cliente: ${customer.name}
          </div>
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: ${formatSettings.table_font_size};
            margin-bottom: 3mm;
            font-weight: bold;
          ">
            <thead>
              <tr>
                <th style="text-align: left; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Material</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Peso</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">R$/kg</th>
                <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => {
                const pesoLiquido = item.quantity - (item.tara || 0);
                return `
                  <tr>
                    <td style="padding: 1mm 0; vertical-align: top; font-weight: bold; word-wrap: break-word;">
                      ${item.materialName}
                      ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${currentFormat === '50mm' ? '6px' : '10px'}; font-weight: bold;">Tara: ${item.tara.toFixed(3)} kg</span>` : ""}
                      ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${currentFormat === '50mm' ? '6px' : '10px'}; font-weight: bold;">P. Líquido: ${pesoLiquido.toFixed(3)} kg</span>` : ""}
                    </td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.quantity.toFixed(3)}</td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.total.toFixed(2)}</td>
                  </tr>
                `}).join("")}
            </tbody>
          </table>
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Peso Bruto:</span>
            <span>${totalWeight.toFixed(3)} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Total Tara:</span>
            <span>${totalTara.toFixed(3)} kg</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${formatSettings.totals_font_size}; font-weight: bold;">
            <span>Peso Líquido:</span>
            <span>${netWeight.toFixed(3)} kg</span>
          </div>
          
          <div style="border-bottom: 2px solid #000; margin: ${formatSettings.margins};"></div>
          
          <div style="text-align: right; font-weight: bold; font-size: ${formatSettings.final_total_font_size}; margin: 2.16mm 0;">
            ${order.type === 'venda' ? "Total a Receber: " : "Total: "} R$ ${order.total.toFixed(2)}
          </div>
          
          <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: ${formatSettings.margins}; font-weight: bold;">
            ${new Date(order.timestamp).toLocaleString('pt-BR')}
          </div>
          
          <div style="text-align: center; font-size: ${formatSettings.quote_font_size}; margin-top: 4mm; font-weight: bold; font-style: italic; word-wrap: break-word;">
            ${motivationalQuote}
          </div>
        </div>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Reimpressão - Comprovante</title>
              <meta charset="utf-8">
              <style>
                @page { size: ${formatSettings.container_width} auto; margin: 0; }
                @media print {
                  html, body {
                    width: ${formatSettings.container_width};
                    margin: 0;
                    padding: 0;
                    background: #fff !important;
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: 'Roboto', Arial, sans-serif;
                  }
                  * {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-family: 'Roboto', Arial, sans-serif;
                  }
                }
                body { 
                  font-family: 'Roboto', Arial, sans-serif;
                  margin: 0; 
                  padding: 0; 
                  background: #fff; 
                  color: #000; 
                }
              </style>
            </head>
            <body>
              ${printContent}
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                  }, 500);
                  
                  setTimeout(function() {
                    window.close();
                  }, 3000);
                };
                
                window.onafterprint = function() {
                  setTimeout(function() {
                    window.close();
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Erro ao reimprimir:', error);
      alert('Erro ao reimprimir comprovante');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <header className="bg-pdv-dark text-white p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Sistema PDV</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando transações...</div>
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
            <FileText className="h-6 w-6" />
            Todas as Transações
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {refreshing && (
            <div className="flex items-center gap-2 text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Atualizando...</span>
            </div>
          )}
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-3 md:p-6 overflow-auto">
        {/* Filtros */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <Collapsible open={filters.showFilters} onOpenChange={(open) => setFilters(prev => ({ ...prev, showFilters: open }))}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-750 transition-colors">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${filters.showFilters ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Período</label>
                    <Select value={filters.period} onValueChange={handlePeriodChange}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.period === 'personalizado' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-400 block mb-2">Data Inicial</label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-400 block mb-2">Data Final</label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Tipo de Transação</label>
                    <Select 
                      value={filters.transactionType} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, transactionType: value }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="vendas">Vendas</SelectItem>
                        <SelectItem value="compras">Compras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Itens por Página</label>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="10 por página" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white z-50">
                        <SelectItem value="10">10 por página</SelectItem>
                        <SelectItem value="30">30 por página</SelectItem>
                        <SelectItem value="100">100 por página</SelectItem>
                        <SelectItem value="500">500 por página</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      className="bg-transparent border-gray-600 text-white hover:bg-gray-700 w-full flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 mb-6">
          <Card className="bg-purple-900 border-purple-700 md:col-span-2 xl:col-span-1">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-purple-100">
                Total de Transações
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-purple-100">
                {totalTransactions}
              </div>
              <div className="text-xs md:text-sm text-purple-200">
                Mostrando {Math.min(itemsPerPage, totalTransactions)} de {totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900 border-green-700">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-green-100">
                Total em Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-green-100">
                {formatCurrency(totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-900 border-blue-700">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-100">
                Total em Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl md:text-2xl xl:text-3xl font-bold text-blue-100">
                {formatCurrency(totalPurchases)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Transações */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Lista de Transações (Página {currentPage} de {totalPages})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedTransactions.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {paginatedTransactions.map((transaction) => {
                    const payment = orderPayments[transaction.id];
                    return (
                      <Card 
                        key={transaction.id} 
                        className="bg-gray-700 border-gray-600 cursor-pointer hover:bg-gray-650 transition-colors"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-white font-medium">
                              {formatCurrency(transaction.total)}
                            </div>
                            <div className={`text-sm px-2 py-1 rounded ${transaction.type === 'compra' ? 'bg-blue-600/20 text-blue-300' : 'bg-green-600/20 text-green-300'}`}>
                              {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300 mb-1">
                            {formatDate(transaction.timestamp)} - {formatTime(transaction.timestamp)}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {transaction.id.substring(0, 8)} • {transaction.items.length} item(s)
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-white">Data/Hora</TableHead>
                        <TableHead className="text-white">Tipo</TableHead>
                        <TableHead className="text-white">ID</TableHead>
                        <TableHead className="text-white">Materiais</TableHead>
                        <TableHead className="text-white">Pagamento</TableHead>
                        <TableHead className="text-white">Valor Total</TableHead>
                        <TableHead className="text-white">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => {
                        const payment = orderPayments[transaction.id];
                        return (
                          <TableRow key={transaction.id} className="border-gray-600">
                            <TableCell className="text-gray-300">
                              <div>
                                <div>{formatDate(transaction.timestamp)}</div>
                                <div className="text-sm text-gray-400">{formatTime(transaction.timestamp)}</div>
                              </div>
                            </TableCell>
                            <TableCell className={`font-medium ${getTypeColor(transaction.type)}`}>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(transaction.type)}
                                {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-300 font-mono">
                              {transaction.id.substring(0, 8)}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {transaction.items.length} item(s)
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {payment ? (
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodIcon(payment.payment_method)}
                                  {getPaymentMethodText(payment.payment_method)}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Banknote className="h-4 w-4" />
                                  Dinheiro
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-gray-300 font-semibold">
                              {formatCurrency(transaction.total)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleTransactionClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-700 border-blue-600 text-white hover:bg-blue-600"
                                >
                                  Ver Detalhes
                                </Button>
                                
                                <Button
                                  onClick={() => handleReprintClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-700 border-green-600 text-white hover:bg-green-600 flex items-center gap-1"
                                  title="Reimprimir comprovante"
                                >
                                  <Printer className="h-3 w-3" />
                                  Reimprimir
                                </Button>

                                <Button
                                  onClick={() => handleDeleteClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-700 border-red-600 text-white hover:bg-red-600 flex items-center gap-1"
                                  title="Excluir pedido"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Excluir
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginação */}
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
                            // Show first page, last page, current page, and one page before/after current
                            return page === 1 || 
                                   page === totalPages || 
                                   (page >= currentPage - 1 && page <= currentPage + 1);
                          })
                          .map((page, index, array) => {
                            // Add ellipsis if there's a gap
                            const showEllipsisBefore = index > 0 && array[index - 1] < page - 1;
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
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
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhuma transação encontrada no período selecionado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Prompt Modal */}
        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          onAuthenticated={handlePasswordAuthenticated}
        />

        {/* Transaction Details Modal */}
        <TransactionDetailsModal
          isOpen={showTransactionDetails}
          onClose={() => setShowTransactionDetails(false)}
          transaction={selectedTransaction}
          onReprint={handleReprint}
          onDelete={handleDeleteClick}
          orderPayment={selectedTransaction ? orderPayments[selectedTransaction.id] : null}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {orderToDelete && (
              <div className="space-y-2 text-sm">
                <div><strong>ID:</strong> {orderToDelete.id.substring(0, 8)}</div>
                <div><strong>Tipo:</strong> {orderToDelete.type === 'compra' ? 'Compra' : 'Venda'}</div>
                <div><strong>Valor:</strong> {formatCurrency(orderToDelete.total)}</div>
                <div><strong>Data:</strong> {formatDate(orderToDelete.timestamp)}</div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Pedido'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Transactions;