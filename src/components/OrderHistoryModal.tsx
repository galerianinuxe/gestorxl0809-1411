import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Clock, Package, DollarSign, Eye, Calendar, Trash2, AlertTriangle, X, Filter, ChevronDown } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { Order, Customer } from '../types/pdv';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/utils/logger';
import PasswordPromptModal from '@/components/PasswordPromptModal';

const logger = createLogger('[OrderHistory]');

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryOrder extends Order {
  customerName: string;
  formattedDate: string;
  formattedTime: string;
}

const ITEMS_PER_PAGE = 10;

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'completed'>('all');
  const [filterType, setFilterType] = useState<'all' | 'compra' | 'venda'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDeleteEmptyConfirm, setShowDeleteEmptyConfirm] = useState(false);
  const [showDeleteAllOpenConfirm, setShowDeleteAllOpenConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Carregar histórico de pedidos
  const loadOrderHistory = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Buscar pedidos do Supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          total,
          created_at,
          status,
          type,
          customers (
            id,
            name
          ),
          order_items (
            id,
            material_id,
            material_name,
            quantity,
            price,
            total,
            tara
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        logger.error('Error loading orders:', ordersError);
        return;
      }

      // Transformar dados para o formato esperado
      const formattedOrders: HistoryOrder[] = (ordersData || []).map(order => {
        const orderDate = new Date(order.created_at);
        return {
          id: order.id,
          customerId: order.customer_id,
          customerName: order.customers?.name || 'Cliente Removido',
          items: (order.order_items || []).map(item => ({
            materialId: item.material_id,
            materialName: item.material_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            tara: item.tara || undefined
          })),
          total: order.total,
          timestamp: orderDate.getTime(),
          formattedDate: orderDate.toLocaleDateString('pt-BR'),
          formattedTime: orderDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: order.status as 'open' | 'completed',
          type: order.type as 'compra' | 'venda'
        };
      });

      // Buscar pedidos salvos localmente que podem não estar no Supabase
      const localOrders = getLocalOrderHistory();
      
      // Combinar e remover duplicatas
      const allOrders = [...formattedOrders];
      localOrders.forEach(localOrder => {
        const exists = formattedOrders.some(o => o.id === localOrder.id);
        if (!exists) {
          allOrders.push(localOrder);
        }
      });

      // Ordenar por timestamp
      allOrders.sort((a, b) => b.timestamp - a.timestamp);
      
      setOrders(allOrders);
    } catch (error) {
      logger.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter pedidos salvos localmente
  const getLocalOrderHistory = (): HistoryOrder[] => {
    try {
      const localHistory = localStorage.getItem(`order_history_${user?.id}`);
      if (!localHistory) return [];
      
      const parsedHistory = JSON.parse(localHistory);
      return parsedHistory.map((order: any) => ({
        ...order,
        formattedDate: new Date(order.timestamp).toLocaleDateString('pt-BR'),
        formattedTime: new Date(order.timestamp).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
    } catch (error) {
      logger.error('Error loading local history:', error);
      return [];
    }
  };

  // Filtrar pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filterStatus === 'all' || order.status === filterStatus;
      const typeMatch = filterType === 'all' || order.type === filterType;
      
      // Filtro de período - comparação apenas de datas (ignorando horário)
      let dateMatch = true;
      if (startDate || endDate) {
        const orderDate = new Date(order.timestamp);
        const orderDateString = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (startDate) {
          const startDateString = new Date(startDate).toISOString().split('T')[0];
          dateMatch = dateMatch && orderDateString >= startDateString;
        }
        if (endDate) {
          const endDateString = new Date(endDate).toISOString().split('T')[0];
          dateMatch = dateMatch && orderDateString <= endDateString;
        }
      }
      
      return statusMatch && typeMatch && dateMatch;
    });
  }, [orders, filterStatus, filterType, startDate, endDate]);

  // Paginação
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (isOpen) {
      loadOrderHistory();
      setCurrentPage(1);
    }
  }, [isOpen, user?.id]);

  // Reset da página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, startDate, endDate]);

  // Função para ver detalhes do pedido
  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowPasswordModal(true);
  };

  // Função chamada após autenticação bem-sucedida
  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    setSelectedOrderId(null);
    onClose();
    navigate('/transactions');
  };

  // Função para excluir pedidos em aberto sem itens
  const handleDeleteEmptyOpenOrders = async () => {
    if (!user?.id || deleting) return;
    
    logger.debug('Starting empty orders cleanup...');
    setDeleting(true);
    
    try {
      // Buscar todos os pedidos em aberto do usuário atual
      const { data: openOrders, error: findError } = await supabase
        .from('orders')
        .select('id, customer_id')
        .eq('user_id', user.id)
        .eq('status', 'open');

      if (findError) {
        logger.error('Error fetching open orders:', findError);
        toast({
          title: "Erro",
          description: "Erro ao buscar pedidos em aberto. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      logger.debug(`Found ${openOrders?.length || 0} open orders`);

      // Filtrar pedidos realmente vazios (sem itens)
      const emptyOrderIds: string[] = [];
      const customerIdsToCheck: string[] = [];

      if (openOrders && openOrders.length > 0) {
        for (const order of openOrders) {
          // Checking order (removed verbose logging)
          
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', order.id)
            .eq('user_id', user.id); // Adicionar filtro por usuário para segurança

          if (itemsError) {
            logger.error(`Error fetching items for order ${order.id}:`, itemsError);
            continue;
          }

          if (!items || items.length === 0) {
            emptyOrderIds.push(order.id);
            customerIdsToCheck.push(order.customer_id);
          }
        }
      }

      logger.debug(`Total empty orders found: ${emptyOrderIds.length}`);

      if (emptyOrderIds.length === 0) {
        toast({
          title: "Informação",
          description: "Nenhum pedido em aberto vazio encontrado.",
          variant: "default",
        });
        return;
      }

      // Excluir os pedidos vazios
      logger.debug('Deleting empty orders...');
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .in('id', emptyOrderIds)
        .eq('user_id', user.id);

      if (deleteError) {
        logger.error('Error deleting empty orders:', deleteError);
        alert('Erro ao excluir pedidos vazios. Tente novamente.');
        return;
      }

      logger.success('Empty orders deleted successfully');

      // Verificar e remover clientes que ficaram sem pedidos
      const uniqueCustomerIds = [...new Set(customerIdsToCheck)];
      logger.debug(`Checking ${uniqueCustomerIds.length} customers for removal...`);
      
      for (const customerId of uniqueCustomerIds) {
        const { data: remainingOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', customerId)
          .eq('user_id', user.id);

        if (!remainingOrders || remainingOrders.length === 0) {
          logger.debug(`Removing orphan customer: ${customerId}`);
          await supabase
            .from('customers')
            .delete()
            .eq('id', customerId)
            .eq('user_id', user.id);
        }
      }

      // Limpar também do localStorage
      try {
        const historyKey = `order_history_${user.id}`;
        const existingHistory = localStorage.getItem(historyKey);
        if (existingHistory) {
          const history = JSON.parse(existingHistory);
          const filteredHistory = history.filter((order: any) => 
            !emptyOrderIds.includes(order.id)
          );
          localStorage.setItem(historyKey, JSON.stringify(filteredHistory));
          logger.debug('Local history cleaned');
        }
      } catch (localError) {
        logger.error('Error cleaning local history:', localError);
      }

      logger.debug('Reloading orders list...');
      await loadOrderHistory();
      
      toast({
        title: "Sucesso!",
        description: `${emptyOrderIds.length} pedidos vazios foram excluídos`,
        variant: "default",
      });
      logger.success('Empty orders deletion completed');
      
    } catch (error) {
      logger.error('Error deleting empty orders:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao excluir pedidos vazios. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteEmptyConfirm(false);
    }
  };

  // Função para excluir todos os pedidos em aberto
  const handleDeleteAllOpenOrders = async () => {
    if (!user?.id || deleting) return;
    
    setDeleting(true);
    try {
      // Buscar todos os pedidos em aberto
      const { data: openOrders, error: findError } = await supabase
        .from('orders')
        .select('id, customer_id')
        .eq('user_id', user.id)
        .eq('status', 'open');

      if (findError) {
        logger.error('Error fetching open orders:', findError);
        return;
      }

      if (!openOrders || openOrders.length === 0) {
        alert('Nenhum pedido em aberto encontrado.');
        return;
      }

      const orderIds = openOrders.map(order => order.id);
      const customerIds = [...new Set(openOrders.map(order => order.customer_id))];

      // Excluir itens dos pedidos primeiro
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) {
        logger.error('Error deleting order items:', itemsError);
      }

      // Excluir os pedidos
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orderIds);

      if (ordersError) {
        logger.error('Error deleting orders:', ordersError);
        return;
      }

      // Verificar e remover clientes que ficaram sem pedidos
      for (const customerId of customerIds) {
        const { data: remainingOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', customerId)
          .eq('user_id', user.id);

        if (!remainingOrders || remainingOrders.length === 0) {
          await supabase
            .from('customers')
            .delete()
            .eq('id', customerId);
        }
      }

      await loadOrderHistory();
      alert(`${orderIds.length} pedidos em aberto foram excluídos.`);
    } catch (error) {
      logger.error('Error deleting all open orders:', error);
    } finally {
      setDeleting(false);
      setShowDeleteAllOpenConfirm(false);
    }
  };

  // Calcular estatísticas dos pedidos em aberto
  const openOrdersStats = useMemo(() => {
    const openOrders = orders.filter(order => order.status === 'open');
    const emptyOrders = openOrders.filter(order => order.items.length === 0);
    return {
      totalOpen: openOrders.length,
      emptyOpen: emptyOrders.length
    };
  }, [orders]);

  const isMobileOrTablet = isMobile || isTablet;

  // Render mobile/tablet card layout
  const renderMobileOrderCard = (order: HistoryOrder) => (
    <div 
      key={order.id}
      className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-3"
    >
      {/* Header: Cliente e Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            # {order.customerName}
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            {order.formattedDate} • {order.formattedTime}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 ml-2">
          <Badge 
            className={`text-xs px-2 py-0.5 ${
              order.status === 'completed' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-amber-600 text-white'
            }`}
          >
            {order.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
          </Badge>
          <Badge 
            className={`text-xs px-2 py-0.5 ${
              order.type === 'venda' 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {order.type === 'venda' ? 'Venda' : 'Compra'}
          </Badge>
        </div>
      </div>

      {/* Info: Itens e Total */}
      <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</p>
            <p className="text-slate-400 text-xs truncate max-w-[140px]">
              {order.items.slice(0, 2).map(item => item.materialName).join(', ')}
              {order.items.length > 2 && '...'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-bold text-lg">
            R$ {order.total.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Botão Ver Pedido */}
      <button
        onClick={() => handleViewOrder(order.id)}
        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium"
      >
        <Eye className="w-4 h-4" />
        Ver Detalhes
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className={`${isMobileOrTablet ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none' : 'w-screen h-screen max-w-none max-h-none m-0 rounded-none'} p-0 bg-slate-900 border-slate-700 flex flex-col`}>
        {/* Header */}
        <DialogHeader className={`${isMobileOrTablet ? 'px-4 py-3' : 'p-6'} border-b border-slate-700 bg-slate-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={`${isMobileOrTablet ? 'h-5 w-5' : 'h-6 w-6'} text-emerald-400`} />
              <DialogTitle className={`${isMobileOrTablet ? 'text-lg' : 'text-2xl'} text-white`}>
                Histórico de Pedidos
              </DialogTitle>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <DialogDescription className={`text-slate-400 ${isMobileOrTablet ? 'text-xs' : 'text-sm'} mt-1`}>
            Consulte e gerencie seus pedidos anteriores
          </DialogDescription>
        </DialogHeader>

        {/* Filtros Mobile/Tablet */}
        {isMobileOrTablet ? (
          <div className="bg-slate-800 border-b border-slate-700">
            {/* Quick Filter Pills */}
            <div className="px-4 py-3">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'all' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('open')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'open' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Em Aberto
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterStatus === 'completed' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Finalizados
                </button>
                <div className="w-px bg-slate-600 mx-1" />
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === 'all' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Todos Tipos
                </button>
                <button
                  onClick={() => setFilterType('venda')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === 'venda' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Vendas
                </button>
                <button
                  onClick={() => setFilterType('compra')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === 'compra' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Compras
                </button>
              </div>
            </div>

            {/* Expandable Filters */}
            <div className="px-4 pb-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-slate-400 text-xs"
              >
                <Filter className="w-3 h-3" />
                <span>Mais filtros</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="mt-3 space-y-3">
                  {/* Date Filters */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-slate-400 text-xs mb-1 block">De:</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white text-xs h-9"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-slate-400 text-xs mb-1 block">Até:</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white text-xs h-9"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  {openOrdersStats.totalOpen > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-slate-400 text-xs w-full">
                        Em aberto: {openOrdersStats.totalOpen} {openOrdersStats.emptyOpen > 0 && `(${openOrdersStats.emptyOpen} vazios)`}
                      </span>
                      {openOrdersStats.emptyOpen > 0 && (
                        <button
                          onClick={() => setShowDeleteEmptyConfirm(true)}
                          disabled={deleting}
                          className="flex items-center gap-1 bg-amber-600/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir Vazios ({openOrdersStats.emptyOpen})
                        </button>
                      )}
                      <button
                        onClick={() => setShowDeleteAllOpenConfirm(true)}
                        disabled={deleting}
                        className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Excluir Todos ({openOrdersStats.totalOpen})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Desktop Filters */
          <div className="flex flex-wrap gap-4 p-6 bg-slate-800 border-b border-slate-700">
            {/* Filtros de Status e Tipo */}
            <div className="flex flex-wrap gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterStatus === 'all' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('open')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterStatus === 'open' 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Em Aberto
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterStatus === 'completed' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Finalizados
                </button>
              </div>

              <Separator orientation="vertical" className="h-8 bg-slate-600" />

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === 'all' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Todos Tipos
                </button>
                <button
                  onClick={() => setFilterType('venda')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === 'venda' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Vendas
                </button>
                <button
                  onClick={() => setFilterType('compra')}
                  className={`px-3 py-1 rounded text-sm ${
                    filterType === 'compra' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Compras
                </button>
              </div>
            </div>

            <Separator orientation="vertical" className="h-8 bg-slate-600" />

            {/* Filtro de Período */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <Label htmlFor="startDate" className="text-slate-300 text-sm">De:</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="endDate" className="text-slate-300 text-sm">Até:</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white w-40"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  variant="outline"
                  size="sm"
                  className="text-slate-400 border-slate-600 hover:bg-slate-700"
                >
                  Limpar
                </Button>
              )}
            </div>

            {/* Botões de Exclusão */}
            {openOrdersStats.totalOpen > 0 && (
              <>
                <Separator orientation="vertical" className="h-8 bg-slate-600" />
                <div className="flex gap-2 items-center">
                  <div className="text-slate-400 text-sm">
                    Em aberto: {openOrdersStats.totalOpen} 
                    {openOrdersStats.emptyOpen > 0 && ` (${openOrdersStats.emptyOpen} vazios)`}
                  </div>
                  {openOrdersStats.emptyOpen > 0 && (
                    <Button
                      onClick={() => setShowDeleteEmptyConfirm(true)}
                      disabled={deleting}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir Vazios ({openOrdersStats.emptyOpen})
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowDeleteAllOpenConfirm(true)}
                    disabled={deleting}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Excluir Todos ({openOrdersStats.totalOpen})
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Lista de Pedidos */}
        <ScrollArea className="flex-1">
          <div className={isMobileOrTablet ? 'p-4' : 'p-6'}>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-white">Carregando histórico...</div>
              </div>
            ) : paginatedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Package className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-slate-400">Nenhum pedido encontrado</p>
                <p className="text-slate-500 text-sm mt-1">Tente ajustar os filtros</p>
              </div>
            ) : isMobileOrTablet ? (
              /* Mobile/Tablet Card Layout */
              <div>
                {paginatedOrders.map(renderMobileOrderCard)}
              </div>
            ) : (
              /* Desktop Table Layout */
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-300">Cliente</TableHead>
                    <TableHead className="text-slate-300">Data/Hora</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Itens</TableHead>
                    <TableHead className="text-slate-300">Total</TableHead>
                    <TableHead className="text-slate-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div>{order.formattedDate}</div>
                        <div className="text-sm text-slate-400">{order.formattedTime}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            order.status === 'completed' 
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                              : 'bg-amber-600 text-white hover:bg-amber-700'
                          }
                        >
                          {order.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            order.type === 'venda' 
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }
                        >
                          {order.type === 'venda' ? 'Venda' : 'Compra'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.items.length}
                        </div>
                        <div className="text-sm text-slate-400">
                          {order.items.slice(0, 2).map(item => item.materialName).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-400 font-bold">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          R$ {order.total.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleViewOrder(order.id)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Pedido
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </ScrollArea>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between ${isMobileOrTablet ? 'px-4 py-3' : 'p-6'} border-t border-slate-700 bg-slate-800`}>
            <div className={`text-slate-400 ${isMobileOrTablet ? 'text-xs' : 'text-sm'}`}>
              {isMobileOrTablet ? (
                `${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de ${filteredOrders.length}`
              ) : (
                `Mostrando ${startIndex + 1} a ${Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de ${filteredOrders.length} pedidos`
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Números das páginas */}
              {!isMobileOrTablet && (
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className={
                          currentPage === pageNum 
                            ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" 
                            : "bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
              )}

              {isMobileOrTablet && (
                <span className="text-white text-sm font-medium">
                  {currentPage}/{totalPages}
                </span>
              )}
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Modal de Confirmação - Excluir Pedidos Vazios */}
      <AlertDialog open={showDeleteEmptyConfirm} onOpenChange={setShowDeleteEmptyConfirm}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-amber-500" />
              Excluir Pedidos Vazios
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-sm">
              Tem certeza que deseja excluir todos os {openOrdersStats.emptyOpen} pedidos em aberto que não possuem itens?
              <br /><br />
              <strong className="text-amber-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setShowDeleteEmptyConfirm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmptyOpenOrders}
              disabled={deleting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {deleting ? 'Excluindo...' : `Excluir ${openOrdersStats.emptyOpen} Vazios`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação - Excluir Todos os Pedidos Em Aberto */}
      <AlertDialog open={showDeleteAllOpenConfirm} onOpenChange={setShowDeleteAllOpenConfirm}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Todos Em Aberto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 text-sm">
              <strong className="text-red-400">ATENÇÃO!</strong> Você está prestes a excluir TODOS os {openOrdersStats.totalOpen} pedidos em aberto.
              <br /><br />
              <span className="text-slate-400">Isso incluirá:</span>
              <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                <li>Pedidos com itens ({openOrdersStats.totalOpen - openOrdersStats.emptyOpen})</li>
                <li>Pedidos vazios ({openOrdersStats.emptyOpen})</li>
                <li>Todos os itens associados</li>
              </ul>
              <br />
              <strong className="text-red-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              onClick={() => setShowDeleteAllOpenConfirm(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllOpenOrders}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Excluindo...' : `Excluir Todos (${openOrdersStats.totalOpen})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Senha para Ver Pedido */}
      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={(open) => {
          setShowPasswordModal(open);
          if (!open) {
            setSelectedOrderId(null);
          }
        }}
        onAuthenticated={handlePasswordAuthenticated}
        title="Autenticação Necessária"
        description="Digite sua senha para visualizar os detalhes do pedido."
      />
    </Dialog>
  );
};

// Função para salvar pedidos localmente para backup
export const saveOrderToLocalHistory = (order: Order, customerName: string) => {
  try {
    // Obter ID do usuário do token de autenticação ou usar ID padrão
    let userId = 'guest';
    try {
      const authData = localStorage.getItem('sb-jqrtnhqxkwdfcjgdbzyj-auth-token');
      if (authData) {
        const parsedAuth = JSON.parse(authData);
        if (parsedAuth.user?.id) {
          userId = parsedAuth.user.id;
        }
      }
    } catch (authError) {
      console.log('Usando ID padrão para histórico local');
    }
    
    const historyKey = `order_history_${userId}`;
    
    const existingHistory = localStorage.getItem(historyKey);
    const history = existingHistory ? JSON.parse(existingHistory) : [];
    
    const historyOrder: HistoryOrder = {
      ...order,
      customerName,
      formattedDate: new Date(order.timestamp).toLocaleDateString('pt-BR'),
      formattedTime: new Date(order.timestamp).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    // Verificar se o pedido já existe
    const existingIndex = history.findIndex((h: HistoryOrder) => h.id === order.id);
    if (existingIndex >= 0) {
      history[existingIndex] = historyOrder;
    } else {
      history.unshift(historyOrder);
    }
    
    // Manter apenas os últimos 1000 pedidos no localStorage
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history));
    console.log('Pedido salvo no histórico local:', order.id);
  } catch (error) {
    console.error('Erro ao salvar pedido no histórico local:', error);
  }
};

export default OrderHistoryModal;