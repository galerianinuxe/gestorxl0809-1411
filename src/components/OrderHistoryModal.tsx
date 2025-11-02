import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Clock, Package, DollarSign, Eye, Calendar, Trash2, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-0 bg-pdv-dark border-gray-700 rounded-none flex flex-col">
        <DialogHeader className="p-6 border-b border-gray-700">
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Histórico de Pedidos
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Consulte e gerencie seus pedidos anteriores
          </DialogDescription>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 p-6 bg-gray-800 border-b border-gray-700">
          {/* Filtros de Status e Tipo */}
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'all' 
                    ? 'bg-pdv-green text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('open')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'open' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Em Aberto
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 rounded text-sm ${
                  filterStatus === 'completed' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Finalizados
              </button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded text-sm ${
                  filterType === 'all' 
                    ? 'bg-pdv-green text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Todos Tipos
              </button>
              <button
                onClick={() => setFilterType('venda')}
                className={`px-3 py-1 rounded text-sm ${
                  filterType === 'venda' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Vendas
              </button>
              <button
                onClick={() => setFilterType('compra')}
                className={`px-3 py-1 rounded text-sm ${
                  filterType === 'compra' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                Compras
              </button>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Filtro de Período */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <Label htmlFor="startDate" className="text-gray-300 text-sm">De:</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="endDate" className="text-gray-300 text-sm">Até:</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white w-40"
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
                className="text-gray-400 border-gray-600 hover:bg-gray-700"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Botões de Exclusão */}
          {openOrdersStats.totalOpen > 0 && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex gap-2 items-center">
                <div className="text-gray-400 text-sm">
                  Em aberto: {openOrdersStats.totalOpen} 
                  {openOrdersStats.emptyOpen > 0 && ` (${openOrdersStats.emptyOpen} vazios)`}
                </div>
                {openOrdersStats.emptyOpen > 0 && (
                  <Button
                    onClick={() => setShowDeleteEmptyConfirm(true)}
                    disabled={deleting}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
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

        {/* Lista de Pedidos */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-white">Carregando histórico...</div>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Nenhum pedido encontrado</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Data/Hora</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Tipo</TableHead>
                  <TableHead className="text-gray-300">Itens</TableHead>
                  <TableHead className="text-gray-300">Total</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="border-gray-700">
                    <TableCell className="text-white font-medium">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div>{order.formattedDate}</div>
                      <div className="text-sm text-gray-400">{order.formattedTime}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className={
                          order.status === 'completed' 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }
                      >
                        {order.status === 'completed' ? 'Finalizado' : 'Em Aberto'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.type === 'venda' ? 'default' : 'secondary'}
                        className={
                          order.type === 'venda' 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
                      >
                        {order.type === 'venda' ? 'Venda' : 'Compra'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {order.items.length}
                      </div>
                      <div className="text-sm text-gray-400">
                        {order.items.slice(0, 2).map(item => item.materialName).join(', ')}
                        {order.items.length > 2 && '...'}
                      </div>
                    </TableCell>
                    <TableCell className="text-green-400 font-bold">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R$ {order.total.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleViewOrder(order.id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div className="text-gray-400 text-sm">
              Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} pedidos
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="bg-white text-gray-900 border-white hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Números das páginas */}
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
                          ? "bg-pdv-green text-white hover:bg-pdv-green/90 border-pdv-green" 
                          : "bg-white text-gray-900 border-white hover:bg-gray-100"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="bg-white text-gray-900 border-white hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Modal de Confirmação - Excluir Pedidos Vazios */}
      <AlertDialog open={showDeleteEmptyConfirm} onOpenChange={setShowDeleteEmptyConfirm}>
        <AlertDialogContent className="bg-pdv-dark border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-orange-500" />
              Excluir Pedidos Vazios
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Tem certeza que deseja excluir todos os {openOrdersStats.emptyOpen} pedidos em aberto que não possuem itens?
              <br /><br />
              <strong className="text-orange-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteEmptyConfirm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEmptyOpenOrders}
              disabled={deleting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {deleting ? 'Excluindo...' : `Excluir ${openOrdersStats.emptyOpen} Vazios`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação - Excluir Todos os Pedidos Em Aberto */}
      <AlertDialog open={showDeleteAllOpenConfirm} onOpenChange={setShowDeleteAllOpenConfirm}>
        <AlertDialogContent className="bg-pdv-dark border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Excluir Todos os Pedidos Em Aberto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              <strong className="text-red-400">ATENÇÃO!</strong> Você está prestes a excluir TODOS os {openOrdersStats.totalOpen} pedidos em aberto do sistema.
              <br /><br />
              Isso incluirá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Pedidos com itens ({openOrdersStats.totalOpen - openOrdersStats.emptyOpen})</li>
                <li>Pedidos vazios ({openOrdersStats.emptyOpen})</li>
                <li>Todos os itens associados</li>
                <li>Clientes sem outros pedidos</li>
              </ul>
              <br />
              <strong className="text-red-400">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteAllOpenConfirm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
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