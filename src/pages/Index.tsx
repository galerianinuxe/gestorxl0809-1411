import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { Printer, Bell } from 'lucide-react';
import { NotificationModal } from '@/components/NotificationModal';
import { useNotifications } from '@/hooks/useNotifications';
import { useStockCalculation } from '@/hooks/useStockCalculation';
import { isGreaterThanOrEqual, formatWeight } from '@/utils/numericComparison';
import { cleanMaterialName } from '@/utils/materialNameCleaner';
import { saveOrderToLocalHistory } from '../components/OrderHistoryModal';
import { setupAutoCleanup } from '../utils/cleanupEmptyOrders';
import { useAuth } from '@/hooks/useAuth';

// Componentes críticos com import direto para melhor performance
import OrderList from '../components/OrderList';
import OrderDetails from '../components/OrderDetails';
import MaterialGrid from '../components/MaterialGrid';
import NumberPadOptimized from '../components/NumberPadOptimized';
import Footer from '../components/Footer';

// Componentes secundários com lazy loading
const OrderCompletionModal = React.lazy(() => import('../components/OrderCompletionModal'));
const MaterialModal = React.lazy(() => import('../components/MaterialModal'));
const AlertModal = React.lazy(() => import('../components/AlertModal'));
const CashRegisterOpeningModal = React.lazy(() => import('../components/CashRegisterOpeningModal'));
const CashRegisterAddFundsModal = React.lazy(() => import('../components/CashRegisterAddFundsModal'));
const CashRegisterClosingModal = React.lazy(() => import('../components/CashRegisterClosingModal'));
const ExpenseModal = React.lazy(() => import('../components/ExpenseModal'));
const WelcomeScreen = React.lazy(() => import('../components/WelcomeScreen'));
const PasswordPromptModal = React.lazy(() => import('@/components/PasswordPromptModal'));
const ErrorReportModal = React.lazy(() => import('../components/ErrorReportModal'));
const MobilePDVLayout = React.lazy(() => import('../components/MobilePDVLayout'));
import { PrintConfirmationModal } from '../components/PrintConfirmationModal';
import { MaterialsPrintModal } from '../components/MaterialsPrintModal';
import { Customer, Order, Material, OrderItem } from '../types/pdv';
import { getCustomers, getMaterials, getActiveCustomer, getActiveOrder, setActiveCustomer, setActiveOrder, saveOrder, saveCustomer, getActiveCashRegister, hasSufficientFunds, getOrders, openCashRegister, addCashToRegister, addExpenseToCashRegister, removeCustomer } from '../utils/supabaseStorage';
import { createLogger } from '../utils/logger';
import { autoSaveSessionData, restoreSessionData } from '../utils/localStorage';
const LOW_BALANCE_THRESHOLD = 50;

// Helper function to generate proper UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// **CORREÇÃO**: Função movida para fora do componente para se tornar uma função utilitária pura e estável.
// Helper para normalizar entrada de peso (vírgula para ponto)
const parseWeight = (weightInput: string): number => {
  if (!weightInput || weightInput.trim() === '') return 0;
  const normalized = weightInput.replace(',', '.');
  const weight = Number(normalized);
  return isNaN(weight) ? 0 : weight;
};

// Componentes memoizados para evitar re-renders desnecessários
const MemoizedOrderList = memo(OrderList);
const MemoizedOrderDetails = memo(OrderDetails);
const MemoizedMaterialGrid = memo(MaterialGrid);
const MemoizedNumberPad = memo(NumberPadOptimized);
const MemoizedFooter = memo(Footer);
const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Create logger for this component
  const logger = createLogger('[PDV]');

  // Stock calculation hook
  const { calculateMaterialStock, isLoadingStock } = useStockCalculation();

  // Hooks de responsividade
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // TODOS OS HOOKS DEVEM SER DECLARADOS PRIMEIRO, ANTES DE QUALQUER RETURN CONDICIONAL
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [activeOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedMaterialModal, setSelectedMaterialModal] = useState<Material | null>(null);
  const [pesoInput, setPesoInput] = useState("");
  const [showWeightAlert, setShowWeightAlert] = useState(false);
  const [showOrderCompletionModal, setShowOrderCompletionModal] = useState(false);
  const [isSaleMode, setIsSaleMode] = useState<boolean>(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);
  const [showPrintConfirmModal, setShowPrintConfirmModal] = useState(false);
  const [showMaterialsPrintModal, setShowMaterialsPrintModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  const { unreadCount } = useNotifications();

  // Cash register states
  const [showCashRegisterOpeningModal, setShowCashRegisterOpeningModal] = useState(false);
  const [showCashRegisterAddFundsModal, setShowCashRegisterAddFundsModal] = useState(false);
  const [showCashRegisterClosingModal, setShowCashRegisterClosingModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState<boolean>(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCheckingCashRegister, setIsCheckingCashRegister] = useState(true);
  const [pendingOrderForInsufficientFunds, setPendingOrderForInsufficientFunds] = useState<Order | null>(null);
  const [insufficientFundsDetails, setInsufficientFundsDetails] = useState<{
    required: number;
    current: number;
    missing: number;
  } | null>(null);
  const { user } = useAuth();
  
  // Ref para controlar a aba do mobile layout
  const mobileTabSetterRef = useRef<((tab: 'scale' | 'materials' | 'orders' | 'menu') => void) | null>(null);
  
  // Listener global de teclado para inserir números na balança
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar se há modal aberto
      const hasOpenModal = document.querySelector('[role="dialog"]');
      if (hasOpenModal) return;
      
      // Ignorar se o foco está em um input ou textarea
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      )) {
        return;
      }
      
      // Processar apenas dígitos numéricos
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPesoInput(prevPeso => {
          const currentStr = (parseFloat(prevPeso || '0') * 1000).toFixed(0).padStart(6, '0');
          const newStr = (currentStr + e.key).slice(-9);
          return (parseInt(newStr) / 1000).toString();
        });
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPesoInput(prevPeso => {
          const currentStr = (parseFloat(prevPeso || '0') * 1000).toFixed(0).padStart(6, '0');
          const newStr = ('0' + currentStr.slice(0, -1)).slice(-9);
          return (parseInt(newStr) / 1000).toString();
        });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPesoInput('');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
  
  // Callback para navegar para a aba da balança (usado pelo MaterialModal)
  const handleNavigateToScale = useCallback(() => {
    if (mobileTabSetterRef.current) {
      mobileTabSetterRef.current('scale');
    }
  }, []);
  
  // Callback para navegar para a aba de pedidos (usado pelo MaterialModal)
  const handleNavigateToOrders = useCallback(() => {
    if (mobileTabSetterRef.current) {
      mobileTabSetterRef.current('orders');
    }
  }, []);
  
  // Callback para armazenar o setter da aba mobile
  const setMobileTabSetter = useCallback((setter: (tab: 'scale' | 'materials' | 'orders' | 'menu') => void) => {
    mobileTabSetterRef.current = setter;
  }, []);

  // Memoized calculations para melhor performance
  const totalMaterial = useMemo(() => {
    if (!selectedMaterialModal || !pesoInput) return 0;
    return selectedMaterialModal.price * (Number(pesoInput) || 0);
  }, [selectedMaterialModal, pesoInput]);
  const pesoModal = useMemo(() => pesoInput || "0", [pesoInput]);

  // Helper function to validate UUID format - otimizada com useCallback
  const isValidUUID = useCallback((uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }, []);

  // Otimizar carregamento de dados com Promise.all e restauração de sessão
  const loadData = useCallback(async () => {
    try {
      console.log('Loading data with session restoration...');
      setCustomers([]);
      setCurrentCustomer(null);
      setCurrentOrder(null);

      // Paralelizar requests para melhor performance
      const [materialsFromSupabase, sessionData] = await Promise.all([getMaterials(), restoreSessionData()]);
      setMaterials(materialsFromSupabase);
      if (sessionData) {
        const {
          customers,
          activeCustomer,
          activeOrder
        } = sessionData;
        console.log('Restored session data:', {
          customersCount: customers.length,
          activeCustomer: activeCustomer?.name || 'none',
          activeOrder: activeOrder?.id || 'none',
          activeOrderItems: activeOrder?.items.length || 0
        });
        
        // Import cleanMaterialName to clean restored data
        const { cleanMaterialName } = await import('@/utils/materialNameCleaner');
        
        // Clean material names in all customer orders
        const cleanedCustomers = customers.map(customer => ({
          ...customer,
          orders: customer.orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
              ...item,
              materialName: cleanMaterialName(item.materialName)
            }))
          }))
        }));
        
        // Clean activeOrder if it exists
        const cleanedActiveOrder = activeOrder ? {
          ...activeOrder,
          items: activeOrder.items.map(item => ({
            ...item,
            materialName: cleanMaterialName(item.materialName)
          }))
        } : null;
        
        setCustomers(cleanedCustomers);
        setCurrentCustomer(activeCustomer);
        setCurrentOrder(cleanedActiveOrder);

        // Set active states for UI sync
        if (activeCustomer) {
          setActiveCustomer(activeCustomer);
        }
        if (cleanedActiveOrder) {
          setActiveOrder(cleanedActiveOrder);
        }
      }
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsDataLoaded(true);
    }
  }, []);

  // CORRIGIDO: Verificação de caixa simplificada
  const checkCashRegister = useCallback(async () => {
    try {
      setIsCheckingCashRegister(true);
      console.log('Checking cash register status...');
      const activeCashRegister = await getActiveCashRegister();
      console.log('Active cash register:', activeCashRegister);
      if (activeCashRegister && activeCashRegister.status === 'open') {
        console.log('Active cash register found, opening PDV');
        setIsCashRegisterOpen(true);
        setShowWelcomeScreen(false);
        setCurrentBalance(activeCashRegister.currentAmount);
      } else {
        console.log('No active cash register found, showing welcome screen');
        setIsCashRegisterOpen(false);
        setShowWelcomeScreen(true);
        setCurrentBalance(0);
      }
    } catch (error) {
      console.error('Error checking cash register:', error);
      // Em caso de erro, permitir que o usuário abra o caixa
      setIsCashRegisterOpen(false);
      setShowWelcomeScreen(true);
      setCurrentBalance(0);
    } finally {
      setIsCheckingCashRegister(false);
    }
  }, []);

  // Function to update cash register balance - otimizada
  const updateCashRegisterBalance = useCallback(async () => {
    try {
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister) {
        setCurrentBalance(activeCashRegister.currentAmount);
      }
    } catch (error) {
      console.error('Error updating cash register balance:', error);
    }
  }, []);
  

  // Função para abrir o modal de novo pedido quando não há pedido ativo
  const handleNewOrderRequest = useCallback(() => {
    setShowNewOrderModal(true);
  }, []);

  // Função para criar um novo pedido a partir do modal
  const handleCreateNewOrder = useCallback(async (customerName?: string) => {
    const customerId = generateUUID();
    const orderId = generateUUID();

    // Criar novo cliente se nome foi fornecido, senão usar um cliente padrão
    const newCustomer: Customer = {
      id: customerId,
      name: customerName || "# Nome Cliente",
      orders: []
    };
    const newOrder: Order = {
      id: orderId,
      customerId: customerId,
      items: [],
      total: 0,
      timestamp: Date.now(),
      status: 'open',
      type: isSaleMode ? "venda" : "compra"
    };
    const updatedCustomer = {
      ...newCustomer,
      orders: [newOrder]
    };
    try {
      console.log('Creating new customer and order:', updatedCustomer);
      await saveCustomer(updatedCustomer);
      await saveOrder(newOrder);
      console.log('New customer and order created successfully');
    } catch (error) {
      console.error('Error creating new customer and order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar novo pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentCustomer(updatedCustomer);
    setCurrentOrder(newOrder);
    setCustomers(prev => [...prev, updatedCustomer]);

    // Auto-save session data for new order
    await autoSaveSessionData(updatedCustomer, newOrder);
    setShowNewOrderModal(false);
    toast({
      title: "Novo pedido criado",
      description: `Pedido criado para ${updatedCustomer.name}`,
      duration: 2000
    });
  }, [isSaleMode]);

  // Handlers otimizados com useCallback
  const handleOpenRegisterClick = useCallback(() => {
    console.log('Opening cash register...');
    setShowWelcomeScreen(false);
    setShowCashRegisterOpeningModal(true);
  }, []);
  const handleCustomerDeleted = useCallback(async () => {
    console.log('Customer deleted, reloading data...');
    await loadData();
  }, [loadData]);
  const handleOrderDeleted = useCallback(async (customerId: string, orderId: string) => {
    logger.debug('Order deleted, reloading data...');
    await loadData();
  }, [loadData]);
  const handleCashRegisterOpened = useCallback(async (register: any) => {
    console.log('Cash register opened successfully:', register);
    setIsCashRegisterOpen(true);
    setShowCashRegisterOpeningModal(false);
    setShowWelcomeScreen(false);
    setCurrentBalance(register.currentAmount);
    await loadData();
  }, [loadData]);
  const handleNumberPadSubmit = useCallback((value: number) => {
    setPesoInput(String(value));
  }, []);
  const handleMenuClick = useCallback(() => {
    // Handled in Footer component
  }, []);

  // Otimizar formatação de peso
  const formatPeso = useCallback((value: string | number) => {
    if (!value) return "0,000/kg";
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).replace('.', ',') + "/kg";
  }, []);
  const createNewOrder = async (customer: Customer) => {
    const orderId = generateUUID();
    const newOrder: Order = {
      id: orderId,
      customerId: customer.id,
      items: [],
      total: 0,
      timestamp: Date.now(),
      status: 'open',
      type: isSaleMode ? "venda" : "compra"
    };
    const updatedCustomer = {
      ...customer,
      orders: [...customer.orders.filter(o => o.status !== 'open'), newOrder]
    };
    try {
      console.log('Creating new order for customer:', updatedCustomer);
      await saveCustomer(updatedCustomer);
      await saveOrder(newOrder);
      console.log('New order created and saved successfully');
    } catch (error) {
      console.error('Error creating new order:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar novo pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentCustomer(updatedCustomer);
    setCurrentOrder(newOrder);
    setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));

    // Auto-save session data for new order
    await autoSaveSessionData(updatedCustomer, newOrder);
  };
  const handleSelectCustomer = async (customer: Customer | null) => {
    if (!customer) {
      setCurrentCustomer(null);
      setCurrentOrder(null);
      loadData(); // Reload the data to get the updated list of customers
      return;
    }
    let targetCustomer = customers.find(c => c.id === customer.id);
    if (!targetCustomer) {
      // Ensure the customer has a valid UUID
      const validCustomer = {
        ...customer,
        id: isValidUUID(customer.id) ? customer.id : generateUUID()
      };
      targetCustomer = validCustomer;
      try {
        console.log('Saving new customer to Supabase:', targetCustomer);
        await saveCustomer(targetCustomer);
        console.log('New customer saved successfully');
        setCustomers(prev => [...prev, targetCustomer!]);
      } catch (error) {
        console.error('Error saving new customer:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar cliente. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
    }
    setCurrentCustomer(targetCustomer);
    const openOrder = targetCustomer.orders.find(o => o.status === 'open');
    if (openOrder) {
      // Import cleanMaterialName to clean material names when selecting customer
      const { cleanMaterialName } = await import('@/utils/materialNameCleaner');
      const cleanedOrder = {
        ...openOrder,
        items: openOrder.items.map(item => ({
          ...item,
          materialName: cleanMaterialName(item.materialName)
        }))
      };
      setCurrentOrder(cleanedOrder);
    } else {
      await createNewOrder(targetCustomer);
    }
  };

  // **CORREÇÃO**: Função envolvida em useCallback para evitar 'stale closures'.
  // Agora ela sempre terá acesso ao `pesoInput` mais recente.
  const handleSelectMaterial = useCallback(async (material: Material) => {
    // 1. Validação de peso unificada no início da função
    const peso = parseWeight(pesoInput);
    console.log('🔍 Validando peso no início:', { pesoInput, peso, isValid: peso > 0 });

    

    // A partir daqui, o peso é considerado válido.
    let orderToUse = activeOrder;
    let customerToUse = currentCustomer;
    
    
    // 2. Cria um pedido automaticamente se não houver um ativo
    if (!customerToUse || !orderToUse) {
      console.log('Nenhum pedido ativo. Criando um novo automaticamente...');
      try {
        const newCustomerId = generateUUID();
        const newOrderId = generateUUID();
        
        const newCustomer: Customer = {
          id: newCustomerId,
          name: "# Nome Cliente",
          orders: []
        };

        const newOrder: Order = {
          id: newOrderId,
          customerId: newCustomerId,
          items: [],
          total: 0,
          status: 'open' as const,
          timestamp: Date.now(),
          type: isSaleMode ? 'venda' as const : 'compra' as const
        };

        newCustomer.orders = [newOrder];
        
        // Salva e atualiza o estado
        await saveCustomer(newCustomer);
        await saveOrder(newOrder);
        
        setCustomers(prev => [...prev, newCustomer]);
        setCurrentCustomer(newCustomer);
        setCurrentOrder(newOrder);
        setActiveCustomer(newCustomer);
        setActiveOrder(newOrder);
        
        // Atualiza as variáveis locais para o restante da função
        customerToUse = newCustomer;
        orderToUse = newOrder;

        await autoSaveSessionData(newCustomer, newOrder);
        console.log('Pedido automático criado com sucesso.');

      } catch (error) {
        console.error('Erro ao criar pedido automaticamente:', error);
        toast({
          title: "Erro",
          description: "Não foi possível criar o pedido automaticamente. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return; // Para a execução em caso de falha
      }
    }
    
    // 3. Verifica a compatibilidade do tipo de operação (compra/venda)
    if (orderToUse.items.length > 0) {
      const existingType = orderToUse.type;
      const currentType = isSaleMode ? 'venda' : 'compra';
      if (existingType && existingType !== currentType) {
        toast({
          title: "Tipo de operação incompatível",
          description: `Não é possível misturar itens de ${existingType} com ${currentType} no mesmo pedido.`,
          variant: "destructive",
          duration: 4000
        });
        return;
      }
    }
    
    // 4. Se tudo estiver certo, abre o modal do material
    console.log('Peso válido e pedido OK. Abrindo modal do material.');
    setSelectedMaterialModal(material);
  }, [activeOrder, currentCustomer, isSaleMode, pesoInput]);
  
  const handleAddMaterialToOrder = async (taraValue: number = 0, adjustedPrice?: number, netWeight?: number) => {
    // Use netWeight if provided (from MaterialModal), otherwise calculate from pesoInput
    const weight = netWeight !== undefined ? netWeight : Number(pesoInput);
    
    if (!selectedMaterialModal || !currentCustomer || !activeOrder || weight <= 0) {
      toast({
        title: "Erro",
        description: "Peso inválido ou cliente não selecionado",
        variant: "destructive",
        duration: 2000
      });
      return;
    }

    // Use the provided netWeight or calculate net weight (gross - tare)
    const finalNetWeight = netWeight !== undefined ? weight : Math.max(0, weight - taraValue);

    // Use the adjusted price if provided, otherwise use default price based on mode
    const price = adjustedPrice !== undefined ? adjustedPrice : isSaleMode ? selectedMaterialModal.salePrice : selectedMaterialModal.price;
    console.log('CREATING ORDER ITEM - Selected material details:', {
      id: selectedMaterialModal.id,
      name: selectedMaterialModal.name,
      nameType: typeof selectedMaterialModal.name,
      nameLength: selectedMaterialModal.name?.length
    });

    // CRITICAL: Use the EXACT material name from the selected modal without any modification
    const exactMaterialName = String(selectedMaterialModal.name).trim();
    console.log('EXACT MATERIAL NAME TO BE USED:', {
      original: selectedMaterialModal.name,
      exact: exactMaterialName,
      isChanged: selectedMaterialModal.name !== exactMaterialName
    });
    const newItem: OrderItem = {
      materialId: selectedMaterialModal.id,
      materialName: exactMaterialName,
      // CRITICAL: Use the exact trimmed material name
      quantity: finalNetWeight,
      price: price,
      total: price * finalNetWeight,
      tara: taraValue > 0 ? taraValue : undefined
    };
    console.log('NEW ORDER ITEM CREATED:', {
      materialId: newItem.materialId,
      materialName: newItem.materialName,
      materialNameType: typeof newItem.materialName,
      materialNameLength: newItem.materialName?.length,
      quantity: newItem.quantity,
      price: newItem.price,
      total: newItem.total
    });
    const updatedOrder = {
      ...activeOrder,
      items: [...activeOrder.items, newItem],
      total: activeOrder.total + newItem.total,
      type: isSaleMode ? 'venda' as const : 'compra' as const
    };
    const updatedCustomer = {
      ...currentCustomer,
      orders: currentCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    };
    try {
      console.log('SAVING UPDATED ORDER WITH NEW ITEM:', updatedOrder);
      console.log('NEW ITEM MATERIAL NAME BEING SAVED:', newItem.materialName);
      await saveOrder(updatedOrder);
      await saveCustomer(updatedCustomer);
      
      // Save to local history for backup
      saveOrderToLocalHistory(updatedOrder, updatedCustomer.name);
      
      console.log('Order and customer updated successfully');
    } catch (error) {
      console.error('Error saving order with new item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item no pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setSelectedMaterialModal(null);
    setActiveOrder(updatedOrder);
    setActiveCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));

    // Auto-save session data after adding item
    await autoSaveSessionData(updatedCustomer, updatedOrder);
    setPesoInput("");
    toast({
      title: "Item adicionado",
      description: `${exactMaterialName} - ${formatPeso(netWeight)} - R$ ${(price * netWeight).toFixed(2)}`,
      duration: 2000
    });
  };
  const handleDeleteOrderItem = async (index: number) => {
    if (!currentCustomer || !activeOrder) return;
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
      orders: currentCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    };
    try {
      console.log('Saving updated order after item deletion:', updatedOrder);
      await saveOrder(updatedOrder);
      await saveCustomer(updatedCustomer);
      
      // Save to local history for backup
      saveOrderToLocalHistory(updatedOrder, updatedCustomer.name);
      
      console.log('Order updated after deletion successfully');
    } catch (error) {
      console.error('Error saving order after deletion:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item do pedido. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    setCurrentOrder(updatedOrder);
    setCurrentCustomer(updatedCustomer);
    setActiveOrder(updatedOrder);
    setActiveCustomer(updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));

    // Auto-save session data after removing item
    await autoSaveSessionData(updatedCustomer, updatedOrder);
    toast({
      title: "Item removido",
      description: `${itemToRemove.materialName} removido do pedido`,
      duration: 2000
    });
  };

  // Function to calculate current stock for a material using unified approach
  const getCurrentStock = async (materialName: string): Promise<number> => {
    try {
      // Use the unified stock calculation from the hook
      return await calculateMaterialStock(materialName);
    } catch (error) {
      console.error('Error calculating current stock:', error);
      return 0;
    }
  };

  // MODIFICADO: Nova lógica para verificação de saldo insuficiente
  const handleInitiateCompleteOrder = async () => {
    if (!currentCustomer || !activeOrder || activeOrder.items.length === 0) {
      return;
    }

    // Check stock for sales mode with improved validation
    if (isSaleMode) {
      for (const item of activeOrder.items) {
        const cleanItemName = cleanMaterialName(item.materialName);
        const currentStock = await calculateMaterialStock(cleanItemName);
        
        console.log('Stock validation:', {
          material: cleanItemName,
          currentStock,
          requiredQuantity: item.quantity,
          hasEnoughStock: isGreaterThanOrEqual(currentStock, item.quantity)
        });
        
        // Use safe numeric comparison that allows exact equality
        if (!isGreaterThanOrEqual(currentStock, item.quantity)) {
          toast({
            title: "Estoque insuficiente",
            description: `Material "${cleanItemName}" não possui estoque suficiente. Estoque atual: ${formatWeight(currentStock)}kg, Necessário: ${formatWeight(item.quantity)}kg`,
            variant: "destructive",
            duration: 5000
          });
          return;
        }
      }
    }

    // Verificar saldo apenas para pedidos de compra (não para vendas)
    if (!isSaleMode) {
      const orderType = 'compra';
      const hasFunds = await hasSufficientFunds(activeOrder.total, orderType);
      if (!hasFunds) {
        // NOVO FLUXO: Não mostrar modal de saldo insuficiente, solicitar senha imediatamente
        const activeCashRegister = await getActiveCashRegister();
        const currentAmount = activeCashRegister?.currentAmount || 0;
        const required = activeOrder.total;
        const missing = required - currentAmount;

        // Salvar detalhes do saldo insuficiente
        setPendingOrderForInsufficientFunds(activeOrder);
        setInsufficientFundsDetails({
          required: required,
          current: currentAmount,
          missing: missing
        });

        // Solicitar senha imediatamente
        setShowPasswordModal(true);
        return;
      }
    }

    // Se chegou até aqui, pode prosseguir com a finalização
    setShowOrderCompletionModal(true);
  };

  // NOVO: Função para lidar com autenticação de senha para saldo insuficiente
  const handlePasswordAuthenticatedForInsufficientFunds = () => {
    setShowPasswordModal(false);

    // Abrir modal de adicionar saldo com as informações detalhadas
    setShowCashRegisterAddFundsModal(true);
  };
  const handleCompleteOrder = async () => {
    if (!currentCustomer || !activeOrder || activeOrder.items.length === 0) {
      console.log('Cannot complete order: missing customer or order');
      return;
    }
    try {
      console.log('Starting order completion process...');

      // Final stock check for sales mode with improved validation
      if (isSaleMode) {
        for (const item of activeOrder.items) {
          const cleanItemName = cleanMaterialName(item.materialName);
          const currentStock = await calculateMaterialStock(cleanItemName);
          
          console.log('Final stock validation:', {
            material: cleanItemName,
            currentStock,
            requiredQuantity: item.quantity,
            hasEnoughStock: isGreaterThanOrEqual(currentStock, item.quantity)
          });
          
          // Use safe numeric comparison that allows exact equality
          if (!isGreaterThanOrEqual(currentStock, item.quantity)) {
            toast({
              title: "Estoque insuficiente",
              description: `Material "${cleanItemName}" não possui estoque suficiente. Estoque atual: ${formatWeight(currentStock)}kg, Necessário: ${formatWeight(item.quantity)}kg`,
              variant: "destructive",
              duration: 5000
            });
            return;
          }
        }
      }

      // Final check for sufficient funds only for purchase orders
      const orderType = isSaleMode ? 'venda' : 'compra';
      const hasFunds = await hasSufficientFunds(activeOrder.total, orderType);
      if (!hasFunds && !isSaleMode) {
        // Se não há fundos suficientes, não deve chegar aqui, mas como segurança
        toast({
          title: "Saldo insuficiente",
          description: "Adicione saldo ao caixa antes de finalizar o pedido.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }

      // Ensure all IDs are valid UUIDs before saving
      const validatedOrder = {
        ...activeOrder,
        id: isValidUUID(activeOrder.id) ? activeOrder.id : generateUUID(),
        customerId: isValidUUID(activeOrder.customerId) ? activeOrder.customerId : currentCustomer.id,
        status: 'completed' as const,
        type: isSaleMode ? 'venda' as const : 'compra' as const
      };
      const validatedCustomer = {
        ...currentCustomer,
        id: isValidUUID(currentCustomer.id) ? currentCustomer.id : generateUUID(),
        orders: currentCustomer.orders.map(o => o.id === validatedOrder.id ? validatedOrder : o)
      };
      console.log('Attempting to save completed order to Supabase...');
      console.log('Validated Order:', validatedOrder);
      console.log('Validated Customer:', validatedCustomer);
      console.log('Step 1: Saving customer...');
      await saveCustomer(validatedCustomer);
      console.log('Customer saved successfully');
      console.log('Step 2: Saving completed order...');
      await saveOrder(validatedOrder);
      console.log('Order saved successfully');

      // Save to local history for backup
      saveOrderToLocalHistory(validatedOrder, validatedCustomer.name);

      // Update cash register balance after order completion
      await updateCashRegisterBalance();

      // Remove the completed customer from local state since they no longer have open orders
      const updatedCustomers = customers.filter(c => c.id !== validatedCustomer.id);
      setCustomers(updatedCustomers);

      // Clear current selection - no automatic creation of default orders
      setCurrentCustomer(null);
      setCurrentOrder(null);
      setActiveCustomer(null);
      setActiveOrder(null);
      setShowOrderCompletionModal(false);
      toast({
        title: "Pedido concluído",
        description: `Total: R$ ${validatedOrder.total.toFixed(2)} - Salvo no banco de dados`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Erro ao salvar",
        description: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Tente novamente.`,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  const handlePrintOrder = () => {
    // Implementa impressão direta do pedido
    if (!currentCustomer || !activeOrder) return;
    
    // Chama handleCompleteOrder primeiro para salvar
    handleCompleteOrder().then(() => {
      // Fecha o modal após salvar
      setShowOrderCompletionModal(false);
    });
  };
  const handleSaleModeToggle = async (checked: boolean) => {
    setIsSaleMode(checked);
    localStorage.setItem('pdv_sale_mode', String(checked));

    // Don't reset current order & customer when toggling mode
    // Just update the order type if there's an active order
    if (activeOrder && currentCustomer) {
      const updatedOrder = {
        ...activeOrder,
        type: checked ? 'venda' as const : 'compra' as const
      };
      const updatedCustomer = {
        ...currentCustomer,
        orders: currentCustomer.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      };
      try {
        console.log('Saving order after mode toggle:', updatedOrder);
        await saveOrder(updatedOrder);
        await saveCustomer(updatedCustomer);
        console.log('Order updated after mode toggle successfully');
      } catch (error) {
        console.error('Error saving order after mode toggle:', error);
        toast({
          title: "Erro",
          description: "Erro ao alterar modo. Tente novamente.",
          variant: "destructive",
          duration: 3000
        });
        return;
      }
      setCurrentOrder(updatedOrder);
      setCurrentCustomer(updatedCustomer);
      setActiveOrder(updatedOrder);
      setActiveCustomer(updatedCustomer);
      setCustomers(prev => prev.map(c => c.id === currentCustomer.id ? updatedCustomer : c));
    }
  };
  const handlePasswordAuthenticated = () => {
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    } else if (pendingOrderForInsufficientFunds) {
      // Se há um pedido pendente por saldo insuficiente, abrir modal de adicionar saldo
      handlePasswordAuthenticatedForInsufficientFunds();
    }
  };

  // NOVO: Função para lidar com adição de saldo após saldo insuficiente
  const handleAddFundsForInsufficientBalance = useCallback(async (addedAmount?: number) => {
    setShowCashRegisterAddFundsModal(false);

    // Atualizar saldo do caixa
    await updateCashRegisterBalance();

    // Limpar estados relacionados ao saldo insuficiente
    setPendingOrderForInsufficientFunds(null);
    setInsufficientFundsDetails(null);

    // Mostrar toast de sucesso apenas se addedAmount for fornecido
    if (addedAmount !== undefined) {
      toast({
        title: "Saldo adicionado",
        description: `R$ ${addedAmount.toFixed(2)} adicionado ao caixa com sucesso`,
        duration: 3000
      });
    }

    // Tentar finalizar o pedido novamente se ainda houver um pedido pendente
    if (pendingOrderForInsufficientFunds) {
      setShowOrderCompletionModal(true);
    }
  }, [updateCashRegisterBalance, pendingOrderForInsufficientFunds]);

  // CORRIGIDO: useEffect para verificação inicial do caixa
  useEffect(() => {
    console.log('Index component mounted, checking cash register...');
    checkCashRegister();
    const savedSaleMode = localStorage.getItem('pdv_sale_mode');
    if (savedSaleMode !== null) {
      setIsSaleMode(savedSaleMode === 'true');
    }

    // Limpar dados de sessão corrompidos
    console.log('Clearing any potentially corrupted session data on mount');
    localStorage.removeItem('pdv_temp_session');
    localStorage.removeItem('pdv_active_order');
    localStorage.removeItem('pdv_active_customer');
    setCustomers([]);
    setCurrentCustomer(null);
    setCurrentOrder(null);
    setIsDataLoaded(false);
    
    // Configurar limpeza automática de pedidos vazios
    const cleanup = setupAutoCleanup();
    
    // Cleanup function para cancelar a limpeza automática quando o componente for desmontado
    return () => {
      cleanup();
    };
  }, []);

  // CORRIGIDO: useEffect para carregar dados quando o caixa estiver aberto
  useEffect(() => {
    if (isCashRegisterOpen && !isDataLoaded && !isCheckingCashRegister) {
      console.log('Cash register is open and data not loaded yet, loading fresh data from database');
      loadData();
    }
  }, [isCashRegisterOpen, isDataLoaded, isCheckingCashRegister, loadData]);

  // CORRIGIDO: Mostrar tela de carregamento enquanto verifica o caixa
  if (isCheckingCashRegister) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verificando status do caixa...</p>
        </div>
      </div>;
  }

  // Show welcome screen when needed - MOVED AFTER ALL HOOKS
  if (showWelcomeScreen) {
    return <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-white">Carregando...</div>}>
        <WelcomeScreen onOpenCashRegister={handleOpenRegisterClick} />
        <React.Suspense fallback={null}>
          <CashRegisterOpeningModal open={showCashRegisterOpeningModal} onOpenChange={setShowCashRegisterOpeningModal} onComplete={handleCashRegisterOpened} />
        </React.Suspense>
      </React.Suspense>;
  }

  // Layout responsivo baseado no dispositivo - Mobile/Tablet usa novo componente
  const renderMobileTabletLayout = () => (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-slate-900 text-slate-300">Carregando...</div>}>
      <MobilePDVLayout
        customers={customers}
        currentCustomer={currentCustomer}
        activeOrder={activeOrder}
        materials={materials}
        pesoInput={pesoInput}
        currentBalance={currentBalance}
        isSaleMode={isSaleMode}
        unreadCount={unreadCount}
        handleSelectCustomer={handleSelectCustomer}
        setCurrentOrder={setCurrentOrder}
        handleCustomerDeleted={handleCustomerDeleted}
        handleOrderDeleted={handleOrderDeleted}
        handleNumberPadSubmit={handleNumberPadSubmit}
        setPesoInput={setPesoInput}
        handleSelectMaterial={handleSelectMaterial}
        handleNewOrderRequest={handleNewOrderRequest}
        handleInitiateCompleteOrder={handleInitiateCompleteOrder}
        formatPeso={formatPeso}
        handleDeleteOrderItem={handleDeleteOrderItem}
        handleSaleModeToggle={handleSaleModeToggle}
        setShowNotificationsModal={setShowNotificationsModal}
        setShowErrorReportModal={setShowErrorReportModal}
        updateCashRegisterBalance={updateCashRegisterBalance}
        handleMenuClick={handleMenuClick}
        setShowAddFundsModal={setShowCashRegisterAddFundsModal}
        setShowMaterialsPrintModal={setShowMaterialsPrintModal}
        setShowExpenseModal={setShowExpenseModal}
        setShowClosingModal={setShowCashRegisterClosingModal}
        setActiveTabRef={setMobileTabSetter}
      />
    </React.Suspense>
  );
  const renderDesktopLayout = () => <>
      <div className="flex items-center justify-between p-2 bg-slate-800 border-b border-slate-700 gap-3">
        <div className="flex items-center gap-3">
          <Switch checked={isSaleMode} onCheckedChange={handleSaleModeToggle} id="modo-venda-switch" className="data-[state=checked]:bg-amber-500" />
          <Label htmlFor="modo-venda-switch" className={`font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-300'}`}>
            {isSaleMode ? "Modo Venda ATIVADO" : "Modo Venda"}
          </Label>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowNotificationsModal(true)}
            className={`p-1 border transition-all duration-300 text-white rounded-md relative ${
              unreadCount > 0 
                ? 'border-amber-500 hover:border-amber-400 animate-pulse bg-amber-500/20 shadow-lg shadow-amber-500/30' 
                : 'border-slate-600 hover:border-slate-500 bg-transparent'
            }`}
            title={unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : "Notificações"}
          >
            <Bell className={`w-4 h-4 transition-colors duration-300 ${
              unreadCount > 0 ? 'text-amber-300' : 'text-slate-400'
            }`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-fade-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setShowPrintConfirmModal(true)} 
            className="p-1 border border-slate-600 hover:border-emerald-500 bg-transparent text-slate-300 hover:text-white rounded-md transition-colors duration-200"
            title="Imprimir tabela"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={() => setShowErrorReportModal(true)} className="text-xs bg-emerald-900/50 hover:bg-emerald-800/50 px-2 py-1 rounded-md transition-colors duration-200 border border-emerald-500/30 text-emerald-300">Dar Sugestão</button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-slate-900">
        <div className="w-1/4 flex flex-col border-r border-slate-700">
          <div className="shrink-0">
            <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
              <MemoizedNumberPad onSubmit={handleNumberPadSubmit} onClear={() => setPesoInput("")} value={pesoInput} />
            </React.Suspense>
          </div>
          <div className="flex-1 border-t border-slate-700 min-h-0">
            <ScrollArea className="h-full touch-auto">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedOrderList customers={customers} activeCustomer={currentCustomer} setCurrentCustomer={handleSelectCustomer} setCurrentOrder={setCurrentOrder} onCustomerDeleted={handleCustomerDeleted} onOrderDeleted={handleOrderDeleted} />
              </React.Suspense>
            </ScrollArea>
          </div>
        </div>
        
        <div className="w-3/4 flex flex-col">
          <div className="h-1/2">
            <ScrollArea className="h-full touch-auto">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedMaterialGrid materials={materials} onMaterialSelect={handleSelectMaterial} onManualInsert={() => {}} isSaleMode={isSaleMode} hasActiveOrder={!!activeOrder} onNewOrderRequest={handleNewOrderRequest} />
              </React.Suspense>
            </ScrollArea>
          </div>
          
          <div className="h-1/2 border-t border-slate-700">
            <ScrollArea className="h-full touch-auto">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedOrderDetails customer={currentCustomer} activeOrder={activeOrder} onCompleteOrder={handleInitiateCompleteOrder} formatPeso={formatPeso} onDeleteItem={handleDeleteOrderItem} />
              </React.Suspense>
            </ScrollArea>
          </div>
        </div>
      </div>
      
      <React.Suspense fallback={<div className="bg-slate-800 text-slate-300 p-2">Carregando...</div>}>
        <MemoizedFooter onMenuClick={handleMenuClick} currentBalance={currentBalance} onBalanceUpdate={updateCashRegisterBalance} />
      </React.Suspense>
    </>;
  return <div className="flex flex-col h-screen touch-auto bg-slate-900">
      <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-2">Carregando...</div>}>
        <CashRegisterOpeningModal open={showCashRegisterOpeningModal} onOpenChange={setShowCashRegisterOpeningModal} onComplete={handleCashRegisterOpened} />
      </React.Suspense>
      
      {isCashRegisterOpen ? <>
          {/* Renderização condicional baseada no dispositivo */}
          {(isMobile || isTablet) ? renderMobileTabletLayout() : renderDesktopLayout()}
          
          {/* Modals com Suspense para carregamento assíncrono */}
          <React.Suspense fallback={null}>
            {selectedMaterialModal && <MaterialModal open={!!selectedMaterialModal} material={selectedMaterialModal} peso={pesoModal} total={totalMaterial} onAdd={handleAddMaterialToOrder} onCancel={() => setSelectedMaterialModal(null)} isSaleMode={isSaleMode} onRequestWeight={handleNavigateToScale} onNavigateToOrders={handleNavigateToOrders} />}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showWeightAlert && <AlertModal open={showWeightAlert} onClose={() => setShowWeightAlert(false)} title="CALMA AI..." description="VOCÊ ESQUECEU DO PESO NA BALANÇA!" />}
          </React.Suspense>

          {/* Modal de Novo Pedido */}
          <React.Suspense fallback={null}>
            {showNewOrderModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg w-96">
                  <h2 className="text-white text-xl font-bold mb-4">Novo Pedido</h2>
                  <div className="mb-4">
                    <label className="text-white block mb-2">Nome do Cliente (opcional)</label>
                    <input type="text" placeholder="# Nome Cliente" className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-green-500 focus:outline-none" onKeyDown={e => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  handleCreateNewOrder(target.value || undefined);
                }
              }} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowNewOrderModal(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                      Cancelar
                    </button>
                    <button onClick={() => {
                const input = document.querySelector('input[placeholder="# Nome Cliente"]') as HTMLInputElement;
                handleCreateNewOrder(input?.value || undefined);
              }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                      Criar Pedido
                    </button>
                  </div>
                </div>
              </div>}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showOrderCompletionModal && <OrderCompletionModal open={showOrderCompletionModal} onClose={() => setShowOrderCompletionModal(false)} onSave={handleCompleteOrder} onPrint={handlePrintOrder} customer={currentCustomer} order={activeOrder} formatPeso={formatPeso} isSaleMode={isSaleMode} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showCashRegisterAddFundsModal && <CashRegisterAddFundsModal open={showCashRegisterAddFundsModal} onOpenChange={setShowCashRegisterAddFundsModal} onComplete={handleAddFundsForInsufficientBalance} insufficientFundsDetails={insufficientFundsDetails} />}
          </React.Suspense>
          
          <React.Suspense fallback={null}>
            {showPasswordModal && <PasswordPromptModal open={showPasswordModal} onOpenChange={setShowPasswordModal} onAuthenticated={handlePasswordAuthenticated} title={pendingOrderForInsufficientFunds ? "Saldo Insuficiente" : "Acesso ao Menu"} description={pendingOrderForInsufficientFunds ? "Digite sua senha para adicionar saldo ao caixa" : "Digite sua senha para acessar o menu"} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showErrorReportModal && <ErrorReportModal open={showErrorReportModal} onClose={() => setShowErrorReportModal(false)} />}
          </React.Suspense>

          <NotificationModal
            isOpen={showNotificationsModal}
            onClose={() => setShowNotificationsModal(false)}
          />

          {showPrintConfirmModal && <PrintConfirmationModal isOpen={showPrintConfirmModal} onClose={() => setShowPrintConfirmModal(false)} onConfirm={() => {
        setShowPrintConfirmModal(false);
        setShowMaterialsPrintModal(true);
      }} />}

          {showMaterialsPrintModal && <MaterialsPrintModal onPrintComplete={() => {
        setShowMaterialsPrintModal(false);
        // Retornar automaticamente ao PDV após impressão
      }} />}

          <React.Suspense fallback={null}>
            {showCashRegisterClosingModal && <CashRegisterClosingModal open={showCashRegisterClosingModal} onOpenChange={setShowCashRegisterClosingModal} onComplete={() => {
              setShowCashRegisterClosingModal(false);
              window.location.reload();
            }} />}
          </React.Suspense>

          <React.Suspense fallback={null}>
            {showExpenseModal && <ExpenseModal open={showExpenseModal} onOpenChange={async (open) => {
              setShowExpenseModal(open);
              if (!open) {
                await updateCashRegisterBalance();
              }
            }} />}
          </React.Suspense>
        </> : null}
    </div>;
};
export default Index;

