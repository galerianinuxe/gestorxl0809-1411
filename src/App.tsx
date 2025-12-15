
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
import SubscriptionRenewalAlert from "./components/SubscriptionRenewalAlert";
import { useUserPresence } from "./hooks/useUserPresence";
import { MainLayout } from "./components/MainLayout";

// Code splitting: lazy load de todas as páginas
import { lazy, Suspense } from 'react';

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Materials = lazy(() => import('./pages/Materials'));
const Settings = lazy(() => import('./pages/Settings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const CurrentStock = lazy(() => import('./pages/CurrentStock'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Expenses = lazy(() => import('./pages/Expenses'));
const DailyFlow = lazy(() => import('./pages/DailyFlow'));
const CashAdditions = lazy(() => import('./pages/CashAdditions'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GuiaCompleto = lazy(() => import('./pages/GuiaCompleto'));
const UserHomeScreen = lazy(() => import('./components/UserHomeScreen'));
const Planos = lazy(() => import('./pages/Planos'));
const PromoXlata01 = lazy(() => import('./pages/PromoXlata01'));
const Covildomal = lazy(() => import('./pages/Covildomal'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const ErrorReport = lazy(() => import('./pages/ErrorReport'));
const ReferralSystemPage = lazy(() => import('./pages/ReferralSystem'));

// Portal de Conteúdo (páginas públicas SEO)
const Blog = lazy(() => import('./pages/portal/Blog'));
const BlogPost = lazy(() => import('./pages/portal/BlogPost'));
const HelpCenter = lazy(() => import('./pages/portal/HelpCenter'));
const HelpArticle = lazy(() => import('./pages/portal/HelpArticle'));
const Solutions = lazy(() => import('./pages/portal/Solutions'));
const Solution = lazy(() => import('./pages/portal/Solution'));
const Glossary = lazy(() => import('./pages/portal/Glossary'));
const GlossaryTerm = lazy(() => import('./pages/portal/GlossaryTerm'));

import { useEffect } from "react";

const queryClient = new QueryClient();

// Loading fallback otimizado
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="text-white text-xl">Carregando...</div>
  </div>
);

const AppContent = () => {
  useSEO();
  const { currentMessage, dismissCurrentMessage } = useRealtimeMessages();
  useUserPresence(); // Track user presence globally

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
      <SubscriptionRenewalAlert />
      <Routes>
        {/* Rotas públicas - não precisam de autenticação */}
        <Route path="/landing" element={
          <Suspense fallback={<PageLoader />}>
            <Landing />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        } />
        <Route path="/termos-de-uso" element={
          <Suspense fallback={<PageLoader />}>
            <TermsOfService />
          </Suspense>
        } />
        <Route path="/guia-completo" element={
          <Suspense fallback={<PageLoader />}>
            <GuiaCompleto />
          </Suspense>
        } />
        <Route path="/planos" element={
          <Suspense fallback={<PageLoader />}>
            <Planos />
          </Suspense>
        } />
        <Route path="/covildomal" element={
          <Suspense fallback={<PageLoader />}>
            <Covildomal />
          </Suspense>
        } />

        {/* Portal de Conteúdo - Rotas públicas SEO */}
        <Route path="/blog" element={
          <Suspense fallback={<PageLoader />}>
            <Blog />
          </Suspense>
        } />
        <Route path="/blog/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <BlogPost />
          </Suspense>
        } />
        <Route path="/ajuda" element={
          <Suspense fallback={<PageLoader />}>
            <HelpCenter />
          </Suspense>
        } />
        <Route path="/ajuda/artigo/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <HelpArticle />
          </Suspense>
        } />
        <Route path="/solucoes" element={
          <Suspense fallback={<PageLoader />}>
            <Solutions />
          </Suspense>
        } />
        <Route path="/solucoes/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <Solution />
          </Suspense>
        } />
        <Route path="/glossario" element={
          <Suspense fallback={<PageLoader />}>
            <Glossary />
          </Suspense>
        } />
        <Route path="/glossario/:slug" element={
          <Suspense fallback={<PageLoader />}>
            <GlossaryTerm />
          </Suspense>
        } />
        
        {/* Rotas protegidas - precisam passar pelo AuthGuard */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <AuthGuard>
              <Index />
            </AuthGuard>
          </Suspense>
        } />
        <Route path="/materiais" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <Materials />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/configuracoes" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <Settings />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/dashboard" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/purchase-orders" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <PurchaseOrders />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/current-stock" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <CurrentStock />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/sales-orders" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <SalesOrders />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/transactions" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <Transactions />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/expenses" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <Expenses />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/daily-flow" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <DailyFlow />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/cash-additions" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <CashAdditions />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/relatar-erro" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <ErrorReport />
              </MainLayout>
            </Suspense>
          </AuthGuard>
        } />
        <Route path="/sistema-indicacoes" element={
          <AuthGuard>
            <Suspense fallback={<PageLoader />}>
              <MainLayout>
                <ReferralSystemPage />
              </MainLayout>
            </Suspense>
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
