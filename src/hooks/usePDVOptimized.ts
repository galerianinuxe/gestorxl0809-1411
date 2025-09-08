
import { useState, useCallback, useMemo, useRef } from 'react';
import { Customer, Order, Material, OrderItem } from '../types/pdv';
import { toast } from './use-toast';

// Hook otimizado para gerenciar estado do PDV
export const usePDVOptimized = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isSaleMode, setIsSaleMode] = useState<boolean>(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  // Usar useRef para evitar re-renders desnecessários em callbacks
  const customersRef = useRef(customers);
  customersRef.current = customers;

  // Memoizar funções utilitárias
  const formatPeso = useCallback((value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', { 
      minimumFractionDigits: 3, 
      maximumFractionDigits: 3 
    }).replace('.', ',') + "/kg";
  }, []);

  const generateUUID = useCallback(() => {
    return crypto.randomUUID();
  }, []);

  const isValidUUID = useCallback((uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }, []);

  // Otimizar seleção de cliente com useCallback
  const selectCustomer = useCallback((customer: Customer | null) => {
    setCurrentCustomer(customer);
    if (customer) {
      const openOrder = customer.orders.find(o => o.status === 'open');
      setActiveOrder(openOrder || null);
    } else {
      setActiveOrder(null);
    }
  }, []);

  // Otimizar adição de item ao pedido
  const addItemToOrder = useCallback(async (
    material: Material, 
    quantity: number, 
    tara: number = 0,
    adjustedPrice?: number
  ) => {
    if (!currentCustomer || !activeOrder) {
      toast({
        title: "Erro",
        description: "Cliente ou pedido não selecionado",
        variant: "destructive",
        duration: 2000,
      });
      return false;
    }

    const netWeight = Math.max(0, quantity - tara);
    const price = adjustedPrice !== undefined 
      ? adjustedPrice 
      : (isSaleMode ? material.salePrice : material.price);

    const newItem: OrderItem = {
      materialId: material.id,
      materialName: material.name.trim(),
      quantity: netWeight,
      price: price,
      total: price * netWeight,
      tara: tara > 0 ? tara : undefined
    };

    // Atualizar estado imediatamente para melhor responsividade
    const updatedOrder = {
      ...activeOrder,
      items: [...activeOrder.items, newItem],
      total: activeOrder.total + newItem.total,
      type: isSaleMode ? 'venda' as const : 'compra' as const
    };

    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o =>
        o.id === updatedOrder.id ? updatedOrder : o
      )
    };

    // Atualizar estado local primeiro
    setActiveOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));

    return true;
  }, [currentCustomer, activeOrder, isSaleMode]);

  // Otimizar remoção de item
  const removeItemFromOrder = useCallback((index: number) => {
    if (!currentCustomer || !activeOrder) return false;

    const itemToRemove = activeOrder.items[index];
    const updatedItems = [...activeOrder.items];
    updatedItems.splice(index, 1);

    const updatedOrder = {
      ...activeOrder,
      items: updatedItems,
      total: activeOrder.total - itemToRemove.total
    };

    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o => 
        o.id === updatedOrder.id ? updatedOrder : o
      )
    };

    // Atualizar estado local imediatamente
    setActiveOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));

    return true;
  }, [currentCustomer, activeOrder]);

  // Memoizar valores computados
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    totalItems: activeOrder?.items.length || 0,
    orderTotal: activeOrder?.total || 0,
    hasActiveOrder: !!activeOrder && activeOrder.items.length > 0
  }), [customers.length, activeOrder]);

  return {
    // Estado
    customers,
    materials,
    currentCustomer,
    activeOrder,
    isSaleMode,
    currentBalance,
    stats,

    // Setters otimizados
    setCustomers: useCallback(setCustomers, []),
    setMaterials: useCallback(setMaterials, []),
    setIsSaleMode: useCallback(setIsSaleMode, []),
    setCurrentBalance: useCallback(setCurrentBalance, []),

    // Ações otimizadas
    selectCustomer,
    addItemToOrder,
    removeItemFromOrder,
    formatPeso,
    generateUUID,
    isValidUUID,
  };
};
