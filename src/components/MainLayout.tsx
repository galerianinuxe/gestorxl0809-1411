import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MainLayoutProps {
  children: React.ReactNode;
  onOpenCashRegister?: () => void;
}

export function MainLayout({ children, onOpenCashRegister }: MainLayoutProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Check if user is admin
  const isAdmin = profile?.status === 'admin';

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    // Buscar assinatura do Supabase primeiro
    const { data: supabaseSubscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (supabaseSubscription && supabaseSubscription.is_active && new Date(supabaseSubscription.expires_at) > new Date()) {
      setSubscription(supabaseSubscription);
      return;
    }

    // Verificar localStorage
    const adminActivatedSubscription = localStorage.getItem(`subscription_${user.id}`);
    if (adminActivatedSubscription) {
      try {
        const subscription = JSON.parse(adminActivatedSubscription);
        if (subscription.is_active && new Date(subscription.expires_at) > new Date()) {
          setSubscription(subscription);
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao parsear assinatura:', error);
      }
    }

    setSubscription(null);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-900">
        {/* Sidebar */}
        <AppSidebar
          isAdmin={isAdmin}
          subscription={subscription}
          onOpenCashRegister={onOpenCashRegister}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with mobile menu trigger */}
          <header className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-white hover:bg-gray-700" />
              <h1 className="text-white font-bold text-lg">Sistema PDV</h1>
            </div>
            {profile?.name && (
              <span className="text-gray-300 text-sm">
                Olá, {profile.name}!
              </span>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}