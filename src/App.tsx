
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { SubscriptionSyncProvider } from "./components/SubscriptionSyncProvider";
import { useSEO } from "./hooks/useSEO";
import AuthGuard from "./components/AuthGuard";
import WhatsAppSupportButton from "./components/WhatsAppSupportButton";
import { RealtimeMessageModal } from "./components/RealtimeMessageModal";
import { useRealtimeMessages } from "./hooks/useRealtimeMessages";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Materials from './pages/Materials';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import PurchaseOrders from './pages/PurchaseOrders';
import CurrentStock from './pages/CurrentStock';
import SalesOrders from './pages/SalesOrders';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import DailyFlow from './pages/DailyFlow';
import CashAdditions from './pages/CashAdditions';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import GuiaCompleto from './pages/GuiaCompleto';
import UserHomeScreen from './components/UserHomeScreen';
import Planos from './pages/Planos';
import PromoXlata01 from './pages/PromoXlata01';
import Covildomal from './pages/Covildomal';
import TermsOfService from './pages/TermsOfService';
import ErrorReport from './pages/ErrorReport';
import ReferralSystemPage from './pages/ReferralSystem';
import { MainLayout } from './components/MainLayout';

import { useEffect } from "react";

const queryClient = new QueryClient();

const AppContent = () => {
  // SEO global
  useSEO();

  // Hook para mensagens em tempo real
  const { currentMessage, dismissCurrentMessage } = useRealtimeMessages();

  // Anti-debugging básico (devtools, F12, clique direito)
  // Temporariamente removido para o remix funcionar corretamente
  /*
  useEffect(() => {
    const blockActions = (e: KeyboardEvent | MouseEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+U, Ctrl+Shift+J, etc
      if (
        (e as KeyboardEvent).key === "F12" ||
        ((e as KeyboardEvent).ctrlKey && (e as KeyboardEvent).shiftKey && (e as KeyboardEvent).key === "I") ||
        ((e as KeyboardEvent).ctrlKey && (e as KeyboardEvent).key === "U") ||
        ((e as KeyboardEvent).ctrlKey && (e as KeyboardEvent).shiftKey && (e as KeyboardEvent).key === "J")
      ) {
        e.preventDefault();
        alert("Função desativada.");
        return false;
      }
    };

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Função desativada.");
      return false;
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockActions);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockActions);
    };
  }, []);
  */

  return (
    <>
      <Routes>
        {/* Rotas públicas - não precisam de autenticação */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/termos-de-uso" element={<TermsOfService />} />
        <Route path="/guia-completo" element={<GuiaCompleto />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/covildomal" element={<Covildomal />} />
        
        {/* Rotas protegidas - precisam passar pelo AuthGuard */}
        <Route path="/" element={
          <AuthGuard>
            <Index />
          </AuthGuard>
        } />
        <Route path="/materiais" element={
          <AuthGuard>
            <MainLayout>
              <Materials />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/configuracoes" element={
          <AuthGuard>
            <MainLayout>
              <Settings />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/dashboard" element={
          <AuthGuard>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/purchase-orders" element={
          <AuthGuard>
            <MainLayout>
              <PurchaseOrders />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/current-stock" element={
          <AuthGuard>
            <MainLayout>
              <CurrentStock />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/sales-orders" element={
          <AuthGuard>
            <MainLayout>
              <SalesOrders />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/transactions" element={
          <AuthGuard>
            <MainLayout>
              <Transactions />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/expenses" element={
          <AuthGuard>
            <MainLayout>
              <Expenses />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/daily-flow" element={
          <AuthGuard>
            <MainLayout>
              <DailyFlow />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/cash-additions" element={
          <AuthGuard>
            <MainLayout>
              <CashAdditions />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/relatar-erro" element={
          <AuthGuard>
            <MainLayout>
              <ErrorReport />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/sistema-indicacoes" element={
          <AuthGuard>
            <MainLayout>
              <ReferralSystemPage />
            </MainLayout>
          </AuthGuard>
        } />
        <Route path="/promocao-xlata01" element={
          <AuthGuard>
            <PromoXlata01 />
          </AuthGuard>
        } />
        
        {/* Rota de erro 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <WhatsAppSupportButton />
      
      {/* Modal de mensagem em tempo real */}
      {currentMessage && (
        <RealtimeMessageModal
          open={true}
          title={currentMessage.title}
          message={currentMessage.message}
          senderName={currentMessage.sender_name}
          onClose={dismissCurrentMessage}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionSyncProvider>
            <Toaster />
            <Sonner position="top-center" richColors closeButton duration={0} />
            <AppContent />
          </SubscriptionSyncProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
