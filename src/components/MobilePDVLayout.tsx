import React, { useState, memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Printer, MessageSquare, DollarSign, Receipt, Calculator, X, Clock, Wifi, Server, ChevronRight, Settings } from 'lucide-react';
import MobileBottomNav, { MobileTab } from './MobileBottomNav';
import { Customer, Order, Material } from '@/types/pdv';
import { useNavigate } from 'react-router-dom';

// Lazy loaded components
const OrderList = React.lazy(() => import('./OrderList'));
const OrderDetails = React.lazy(() => import('./OrderDetails'));
const MaterialGrid = React.lazy(() => import('./MaterialGrid'));
const NumberPad = React.lazy(() => import('./NumberPad'));
const Footer = React.lazy(() => import('./Footer'));

// Memoized versions
const MemoizedOrderList = memo(OrderList);
const MemoizedOrderDetails = memo(OrderDetails);
const MemoizedMaterialGrid = memo(MaterialGrid);
const MemoizedNumberPad = memo(NumberPad);

interface MobilePDVLayoutProps {
  // Data
  customers: Customer[];
  currentCustomer: Customer | null;
  activeOrder: Order | null;
  materials: Material[];
  pesoInput: string;
  currentBalance: number;
  isSaleMode: boolean;
  unreadCount: number;
  
  // Handlers
  handleSelectCustomer: (customer: Customer | null) => void;
  setCurrentOrder: (order: Order | null) => void;
  handleCustomerDeleted: () => void;
  handleOrderDeleted: (customerId: string, orderId: string) => void;
  handleNumberPadSubmit: (value: number) => void;
  setPesoInput: (value: string) => void;
  handleSelectMaterial: (material: Material) => void;
  handleNewOrderRequest: () => void;
  handleInitiateCompleteOrder: () => void;
  formatPeso: (value: string | number) => string;
  handleDeleteOrderItem: (index: number) => void;
  handleSaleModeToggle: (checked: boolean) => void;
  setShowNotificationsModal: (show: boolean) => void;
  setShowErrorReportModal: (show: boolean) => void;
  updateCashRegisterBalance: () => Promise<void>;
  handleMenuClick: () => void;
}

const MobilePDVLayout: React.FC<MobilePDVLayoutProps> = ({
  customers,
  currentCustomer,
  activeOrder,
  materials,
  pesoInput,
  currentBalance,
  isSaleMode,
  unreadCount,
  handleSelectCustomer,
  setCurrentOrder,
  handleCustomerDeleted,
  handleOrderDeleted,
  handleNumberPadSubmit,
  setPesoInput,
  handleSelectMaterial,
  handleNewOrderRequest,
  handleInitiateCompleteOrder,
  formatPeso,
  handleDeleteOrderItem,
  handleSaleModeToggle,
  setShowNotificationsModal,
  setShowErrorReportModal,
  updateCashRegisterBalance,
  handleMenuClick
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('scale');
  const navigate = useNavigate();

  // Contagem de pedidos em aberto
  const openOrdersCount = customers.reduce((count, customer) => {
    return count + customer.orders.filter(o => o.status === 'open').length;
  }, 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'scale':
        return (
          <div className="flex flex-col h-full">
            {/* Header compacto */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={isSaleMode} 
                  onCheckedChange={handleSaleModeToggle} 
                  id="modo-venda-switch" 
                  className="data-[state=checked]:bg-amber-500 scale-90" 
                />
                <Label 
                  htmlFor="modo-venda-switch" 
                  className={`text-xs font-semibold select-none ${isSaleMode ? 'text-amber-400' : 'text-slate-400'}`}
                >
                  {isSaleMode ? "Venda" : "Compra"}
                </Label>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowNotificationsModal(true)}
                  className={`p-1.5 rounded-md transition-all ${
                    unreadCount > 0 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setShowErrorReportModal(true)}
                  className="p-1.5 rounded-md text-emerald-400 hover:bg-slate-700 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Teclado Numérico - Ocupa a maior parte da tela */}
            <div className="flex-1 min-h-0">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4 flex items-center justify-center h-full">Carregando...</div>}>
                <MemoizedNumberPad 
                  onSubmit={handleNumberPadSubmit} 
                  onClear={() => setPesoInput("")} 
                  value={pesoInput} 
                />
              </React.Suspense>
            </div>

            {/* Preview do pedido atual - Compacto */}
            {activeOrder && activeOrder.items.length > 0 && (
              <div className="bg-slate-800 border-t border-slate-700 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs">{activeOrder.items.length} itens</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      R$ {activeOrder.total.toFixed(2)}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="flex items-center gap-1 text-emerald-400 text-xs"
                  >
                    Ver pedido
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'materials':
        return (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <h2 className="text-white font-semibold text-sm">Materiais</h2>
              <span className="text-slate-400 text-xs">{materials.length} cadastrados</span>
            </div>

            {/* Grid de Materiais */}
            <ScrollArea className="flex-1">
              <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                <MemoizedMaterialGrid 
                  materials={materials} 
                  onMaterialSelect={handleSelectMaterial} 
                  onManualInsert={() => {}} 
                  isSaleMode={isSaleMode} 
                  hasActiveOrder={!!activeOrder} 
                  onNewOrderRequest={handleNewOrderRequest} 
                />
              </React.Suspense>
            </ScrollArea>

            {/* Info do peso atual */}
            {pesoInput && parseFloat(pesoInput) > 0 && (
              <div className="bg-emerald-900/30 border-t border-emerald-500/30 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-xs">Peso na balança:</span>
                  <span className="text-emerald-400 font-bold">
                    {parseFloat(pesoInput).toFixed(3)} kg
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 'orders':
        return (
          <div className="flex flex-col h-full">
            {/* Lista de Pedidos */}
            <div className={activeOrder ? 'h-2/5' : 'flex-1'}>
              <ScrollArea className="h-full">
                <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                  <MemoizedOrderList 
                    customers={customers} 
                    activeCustomer={currentCustomer} 
                    setCurrentCustomer={handleSelectCustomer} 
                    setCurrentOrder={setCurrentOrder} 
                    onCustomerDeleted={handleCustomerDeleted} 
                    onOrderDeleted={handleOrderDeleted} 
                  />
                </React.Suspense>
              </ScrollArea>
            </div>

            {/* Detalhes do Pedido Ativo */}
            {activeOrder && (
              <div className="flex-1 border-t border-slate-700">
                <ScrollArea className="h-full">
                  <React.Suspense fallback={<div className="bg-slate-900 text-slate-300 p-4">Carregando...</div>}>
                    <MemoizedOrderDetails 
                      customer={currentCustomer} 
                      activeOrder={activeOrder} 
                      onCompleteOrder={handleInitiateCompleteOrder} 
                      formatPeso={formatPeso} 
                      onDeleteItem={handleDeleteOrderItem} 
                    />
                  </React.Suspense>
                </ScrollArea>
              </div>
            )}
          </div>
        );

      case 'menu':
        return (
          <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
              <h2 className="text-white font-semibold">Menu</h2>
            </div>

            {/* Menu Items */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {/* Saldo */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Saldo atual</p>
                        <p className="text-emerald-400 font-bold text-lg">
                          R$ {currentBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                  <MenuItem 
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Adicionar Saldo"
                    onClick={() => handleMenuClick()}
                  />
                  <MenuItem 
                    icon={<Receipt className="w-5 h-5" />}
                    label="Adicionar Despesa"
                    onClick={() => handleMenuClick()}
                  />
                  <MenuItem 
                    icon={<Calculator className="w-5 h-5" />}
                    label="Calculadora"
                    onClick={() => handleMenuClick()}
                  />
                  <MenuItem 
                    icon={<Printer className="w-5 h-5" />}
                    label="Imprimir Tabela"
                    onClick={() => {}}
                  />
                  <MenuItem 
                    icon={<Settings className="w-5 h-5" />}
                    label="Configurações"
                    onClick={() => navigate('/settings')}
                  />
                </div>

                {/* Fechar Dia */}
                <button 
                  onClick={() => handleMenuClick()}
                  className="w-full bg-red-600/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 hover:bg-red-600/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-red-400 font-medium">Fechar Dia</span>
                </button>

                {/* Status */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-400">Servidor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-400">Internet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Conteúdo principal com padding para bottom nav */}
      <div className="flex-1 pb-16 overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        orderCount={openOrdersCount}
        isSaleMode={isSaleMode}
      />
    </div>
  );
};

// Componente auxiliar para itens do menu
const MenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 border-b border-slate-700 last:border-b-0 transition-colors ${
      danger ? 'hover:bg-red-600/10' : 'hover:bg-slate-700/50'
    }`}
  >
    <span className={danger ? 'text-red-400' : 'text-slate-400'}>{icon}</span>
    <span className={`font-medium ${danger ? 'text-red-400' : 'text-white'}`}>{label}</span>
    <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
  </button>
);

export default MobilePDVLayout;
