import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowLeft, FileText, ShoppingCart, DollarSign, Printer, CreditCard, Banknote, RefreshCw, Trash2 } from 'lucide-react';
import { getOrders, getCustomerById } from '@/utils/supabaseStorage';
import { Order } from '@/types/pdv';
import { useAuth } from '@/hooks/useAuth';
import { useReceiptFormatSettings } from '@/hooks/useReceiptFormatSettings';
import { supabase } from '@/integrations/supabase/client';
import { getRandomMotivationalQuote } from '@/utils/motivationalQuotes';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { toast } from '@/hooks/use-toast';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Label } from '@/components/ui/label';
import { cleanMaterialName } from '@/utils/materialNameCleaner';

const Transactions = () => {
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
  
  const { getCurrentFormat, getCurrentFormatSettings } = useReceiptFormatSettings();
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionType, setTransactionType] = useState('todas');

  const [selectedTransaction, setSelectedTransaction] = useState<Order | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user } = useAuth();

  const loadSystemSettings = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
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

  const loadOrderPayments = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('order_payments')
        .select('*')
        .eq('user_id', user.id);
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    // Atualizar a cada 60 segundos (otimizado de 30s para 60s)
    const interval = setInterval(() => {
      loadData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefresh = () => {
    loadData(true);
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let filterStart: Date;
    let filterEnd: Date = new Date(now);

    if (selectedPeriod === 'custom' && startDate && endDate) {
      filterStart = new Date(startDate + 'T00:00:00');
      filterEnd = new Date(endDate + 'T23:59:59');
    } else {
      switch (selectedPeriod) {
        case 'daily':
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          const today = new Date(now);
          const dayOfWeek = today.getDay();
          const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          filterStart = new Date(today);
          filterStart.setDate(today.getDate() + mondayOffset);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(filterStart);
          filterEnd.setDate(filterStart.getDate() + 6);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        case 'yearly':
          filterStart = new Date(now.getFullYear(), 0, 1);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now.getFullYear(), 11, 31);
          filterEnd.setHours(23, 59, 59, 999);
          break;
        default:
          filterStart = new Date(now);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd = new Date(now);
          filterEnd.setHours(23, 59, 59, 999);
      }
    }

    return orders.filter(order => {
      const orderDate = new Date(order.timestamp);
      const isCompleted = order.status === 'completed';
      const isInDateRange = orderDate >= filterStart && orderDate <= filterEnd;
      
      if (!isCompleted || !isInDateRange) return false;
      if (transactionType === 'vendas' && order.type !== 'venda') return false;
      if (transactionType === 'compras' && order.type !== 'compra') return false;
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, selectedPeriod, startDate, endDate, transactionType]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, startDate, endDate, transactionType, itemsPerPage]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeColor = (type: string) => {
    return type === 'compra' ? 'text-blue-400' : 'text-emerald-400';
  };

  const getPaymentMethodIcon = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix':
      case 'debito':
      case 'credito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getPaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix': return 'PIX';
      case 'dinheiro': return 'Dinheiro';
      case 'debito': return 'Débito';
      case 'credito': return 'Crédito';
      default: return 'Dinheiro';
    }
  };

  const totalTransactions = filteredTransactions.length;
  const totalSales = filteredTransactions.filter(t => t.type === 'venda').reduce((sum, t) => sum + t.total, 0);
  const totalPurchases = filteredTransactions.filter(t => t.type === 'compra').reduce((sum, t) => sum + t.total, 0);

  const handleReprintClick = (order: Order) => {
    setOrderToReprint(order);
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    if (orderToReprint) {
      handleReprint(orderToReprint);
    }
  };

  const handleTransactionClick = (transaction: Order) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete || !user?.id) return;
    setIsDeleting(true);
    try {
      await supabase.from('orders').delete().eq('id', orderToDelete.id).eq('user_id', user.id);
      await supabase.from('order_payments').delete().eq('order_id', orderToDelete.id).eq('user_id', user.id);
      await supabase.from('cash_transactions').delete().eq('order_id', orderToDelete.id).eq('user_id', user.id);
      toast({ title: "Pedido excluído", description: `Pedido ${orderToDelete.id.substring(0, 8)} foi excluído.` });
      loadData();
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir pedido.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSelectedPeriod('daily');
    setStartDate('');
    setEndDate('');
    setTransactionType('todas');
  };

  const handleReprint = async (order: Order) => {
    try {
      const customer = await getCustomerById(order.customerId);
      if (!customer) return;
      const currentFormat = getCurrentFormat();
      const formatSettings = getCurrentFormatSettings();
      const totalWeight = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalTara = order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
      const netWeight = totalWeight - totalTara;
      const motivationalQuote = getRandomMotivationalQuote();
      const { logo, whatsapp1, whatsapp2, address } = settings;

      const printContent = `<div style="width: ${formatSettings.container_width}; padding: ${formatSettings.padding}; font-family: Arial; font-size: 12px; color: #000; background: #fff;">
        ${logo ? `<div style="text-align: center; margin-bottom: 10px;"><img src="${logo}" style="max-width: ${formatSettings.logo_max_width}; max-height: ${formatSettings.logo_max_height};" /></div>` : ''}
        <div style="text-align: center; font-weight: bold; font-size: ${formatSettings.title_font_size}; margin-bottom: 5px;">${order.type === 'venda' ? "COMPROVANTE DE VENDA" : "COMPROVANTE DE COMPRA"}</div>
        <div style="text-align: center; margin-bottom: 10px;">Cliente: ${customer.name}</div>
        <div style="border-bottom: 2px solid #000; margin: 10px 0;"></div>
        <table style="width: 100%; border-collapse: collapse; font-size: ${formatSettings.table_font_size};">
          <thead><tr><th style="text-align: left;">Material</th><th style="text-align: right;">Peso</th><th style="text-align: right;">R$/kg</th><th style="text-align: right;">Total</th></tr></thead>
          <tbody>${order.items.map(item => `<tr><td>${cleanMaterialName(item.materialName)}</td><td style="text-align: right;">${item.quantity.toFixed(3)}</td><td style="text-align: right;">${item.price.toFixed(2)}</td><td style="text-align: right;">${item.total.toFixed(2)}</td></tr>`).join("")}</tbody>
        </table>
        <div style="border-bottom: 2px solid #000; margin: 10px 0;"></div>
        <div style="text-align: right; font-weight: bold; font-size: ${formatSettings.final_total_font_size};">Total: R$ ${order.total.toFixed(2)}</div>
        <div style="text-align: center; font-size: ${formatSettings.datetime_font_size}; margin: 10px 0;">${new Date(order.timestamp).toLocaleString('pt-BR')}</div>
      </div>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Reimpressão</title></head><body onload="window.print(); setTimeout(() => window.close(), 1000);">${printContent}</body></html>`);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Erro ao reimprimir:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Transações</h1>
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
              <FileText className="h-5 w-5 text-emerald-500" />
              Transações
            </h1>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Tipo de Transação */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onClear={clearFilters}
          extraFilters={
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">Tipo</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="todas" className="text-white">Todas</SelectItem>
                    <SelectItem value="vendas" className="text-white">Vendas</SelectItem>
                    <SelectItem value="compras" className="text-white">Compras</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">Por Página</Label>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="10" className="text-white">10</SelectItem>
                    <SelectItem value="30" className="text-white">30</SelectItem>
                    <SelectItem value="100" className="text-white">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          }
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MetricCard
            icon={FileText}
            iconColor="text-purple-500"
            label="Transações"
            value={totalTransactions}
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-emerald-500"
            label="Vendas"
            value={formatCurrency(totalSales)}
          />
          <MetricCard
            icon={ShoppingCart}
            iconColor="text-blue-500"
            label="Compras"
            value={formatCurrency(totalPurchases)}
          />
        </div>

        {/* Lista de Transações */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">
              Lista ({currentPage}/{totalPages || 1})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {paginatedTransactions.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="md:hidden space-y-2">
                  {paginatedTransactions.map((transaction) => {
                    const payment = orderPayments[transaction.id];
                    return (
                      <Card 
                        key={transaction.id} 
                        className="bg-slate-800 border-slate-600 cursor-pointer"
                        onClick={() => handleTransactionClick(transaction)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-white font-medium">{formatCurrency(transaction.total)}</div>
                            <div className={`text-xs px-2 py-1 rounded ${transaction.type === 'compra' ? 'bg-blue-600/20 text-blue-300' : 'bg-emerald-600/20 text-emerald-300'}`}>
                              {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatDate(transaction.timestamp)} {formatTime(transaction.timestamp)} • {transaction.items.length} item(s)
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300 text-sm p-2">Data/Hora</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Tipo</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">ID</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Itens</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Pagamento</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Valor</TableHead>
                        <TableHead className="text-slate-300 text-sm p-2">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => {
                        const payment = orderPayments[transaction.id];
                        return (
                          <TableRow key={transaction.id} className="border-slate-600 hover:bg-slate-600/30">
                            <TableCell className="text-slate-300 text-sm p-2">
                              <div>{formatDate(transaction.timestamp)}</div>
                              <div className="text-xs text-slate-500">{formatTime(transaction.timestamp)}</div>
                            </TableCell>
                            <TableCell className={`text-sm p-2 font-medium ${getTypeColor(transaction.type)}`}>
                              {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                            </TableCell>
                            <TableCell className="text-slate-400 font-mono text-xs p-2">
                              {transaction.id.substring(0, 8)}
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm p-2">
                              {transaction.items.length}
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm p-2">
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(payment?.payment_method || 'dinheiro')}
                                <span className="text-xs">{getPaymentMethodText(payment?.payment_method || 'dinheiro')}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-white font-semibold text-sm p-2">
                              {formatCurrency(transaction.total)}
                            </TableCell>
                            <TableCell className="p-2">
                              <div className="flex gap-1">
                                <Button
                                  onClick={() => handleTransactionClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-700 border-blue-600 text-white hover:bg-blue-600 h-8 text-xs"
                                >
                                  Ver
                                </Button>
                                <Button
                                  onClick={() => handleReprintClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-emerald-700 border-emerald-600 text-white hover:bg-emerald-600 h-8 w-8 p-0"
                                >
                                  <Printer className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteClick(transaction)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-rose-700 border-rose-600 text-white hover:bg-rose-600 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                Nenhuma transação encontrada no período.
              </div>
            )}
          </CardContent>
        </Card>

        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          onAuthenticated={handlePasswordAuthenticated}
        />

        <TransactionDetailsModal
          isOpen={showTransactionDetails}
          onClose={() => setShowTransactionDetails(false)}
          transaction={selectedTransaction}
          onReprint={(order) => {
            setShowTransactionDetails(false);
            handleReprintClick(order);
          }}
          onDelete={(order) => {
            setShowTransactionDetails(false);
            handleDeleteClick(order);
          }}
          orderPayment={selectedTransaction ? orderPayments[selectedTransaction.id] : null}
        />

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-rose-400 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Tem certeza? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {orderToDelete && (
              <div className="text-sm space-y-1">
                <div><strong>ID:</strong> {orderToDelete.id.substring(0, 8)}</div>
                <div><strong>Tipo:</strong> {orderToDelete.type === 'compra' ? 'Compra' : 'Venda'}</div>
                <div><strong>Valor:</strong> {formatCurrency(orderToDelete.total)}</div>
              </div>
            )}
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteOrder} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700">
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Transactions;
