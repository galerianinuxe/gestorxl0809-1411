
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./hooks/useAuth";
import { SubscriptionSyncProvider } from "./components/SubscriptionSyncProvider";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { EmployeeProvider } from "./contexts/EmployeeContext";
import { useSEO } from "./hooks/useSEO";
import AuthGuard from "./components/AuthGuard";
import WhatsAppSupportButton from "./components/WhatsAppSupportButton";
import { RealtimeMessageModal } from "./components/RealtimeMessageModal";
import { useRealtimeMessages } from "./hooks/useRealtimeMessages";
import SubscriptionRenewalAlert from "./components/SubscriptionRenewalAlert";
import { useUserPresence } from "./hooks/useUserPresence";
import { MainLayout } from "./components/MainLayout";
import { DirectMessageProvider } from "./components/DirectMessageProvider";
import { OnboardingChecklist } from "./components/onboarding/OnboardingChecklist";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

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
const DepotClients = lazy(() => import('./pages/DepotClients'));
const Employees = lazy(() => import('./pages/Employees'));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
      gcTime: 30 * 60 * 1000, // 30 minutos - tempo de cache
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Loading fallback otimizado
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-900">
    <div className="text-white text-xl">Carregando...</div>
  </div>
);

// Loading fallback para conteúdo dentro do MainLayout (menor)
const ContentLoader = () => (
  <div className="flex items-center justify-center h-full bg-gray-950">
    <div className="text-gray-400 text-lg">Carregando...</div>
  </div>
);

const AppContent = () => {
  useSEO();
  const { currentMessage, dismissCurrentMessage } = useRealtimeMessages();
  useUserPresence(); // Track user presence globally

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

        {/* Rota principal PDV - layout próprio (não usa MainLayout) */}
        <Route path="/" element={
          <Suspense fallback={<PageLoader />}>
            <AuthGuard>
              <Index />
            </AuthGuard>
          </Suspense>
        } />

        {/* Rotas protegidas com MainLayout compartilhado (navegação SPA) */}
        <Route element={
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        }>
          <Route path="/materiais" element={
            <Suspense fallback={<ContentLoader />}>
              <Materials />
            </Suspense>
          } />
          <Route path="/configuracoes" element={
            <Suspense fallback={<ContentLoader />}>
              <Settings />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={<ContentLoader />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/purchase-orders" element={
            <Suspense fallback={<ContentLoader />}>
              <PurchaseOrders />
            </Suspense>
          } />
          <Route path="/current-stock" element={
            <Suspense fallback={<ContentLoader />}>
              <CurrentStock />
            </Suspense>
          } />
          <Route path="/sales-orders" element={
            <Suspense fallback={<ContentLoader />}>
              <SalesOrders />
            </Suspense>
          } />
          <Route path="/transactions" element={
            <Suspense fallback={<ContentLoader />}>
              <Transactions />
            </Suspense>
          } />
          <Route path="/expenses" element={
            <Suspense fallback={<ContentLoader />}>
              <Expenses />
            </Suspense>
          } />
          <Route path="/daily-flow" element={
            <Suspense fallback={<ContentLoader />}>
              <DailyFlow />
            </Suspense>
          } />
          <Route path="/cash-additions" element={
            <Suspense fallback={<ContentLoader />}>
              <CashAdditions />
            </Suspense>
          } />
          <Route path="/relatar-erro" element={
            <Suspense fallback={<ContentLoader />}>
              <ErrorReport />
            </Suspense>
          } />
          <Route path="/sistema-indicacoes" element={
            <Suspense fallback={<ContentLoader />}>
              <ReferralSystemPage />
            </Suspense>
          } />
          <Route path="/clientes" element={
            <Suspense fallback={<ContentLoader />}>
              <DepotClients />
            </Suspense>
          } />
          <Route path="/funcionarios" element={
            <Suspense fallback={<ContentLoader />}>
              <Employees />
            </Suspense>
          } />
        </Route>

        {/* Rota promocional - layout próprio */}
        <Route path="/promocao-xlata01" element={
          <AuthGuard>
            <PromoXlata01 />
          </AuthGuard>
        } />
        
        {/* Rota de erro 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Checklist de onboarding flutuante */}
      <OnboardingChecklist />
      
      {/* Prompt de instalação PWA - só aparece em mobile/tablet */}
      <PWAInstallPrompt />
      
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
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <EmployeeProvider>
              <OnboardingProvider>
                <SubscriptionSyncProvider>
                  <DirectMessageProvider>
                    <Toaster />
                    <Sonner position="top-center" richColors closeButton duration={0} />
                    <AppContent />
                  </DirectMessageProvider>
                </SubscriptionSyncProvider>
              </OnboardingProvider>
            </EmployeeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
