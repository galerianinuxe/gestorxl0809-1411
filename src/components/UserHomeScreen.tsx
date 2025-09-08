
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Key, Calendar, BarChart3, Archive, ShoppingCart, Shield, LogOut, Play, BookOpen, Zap, Crown, Settings, UserCog, Terminal, Users, Gift, ArrowLeft, MessageSquare, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getActiveCashRegister } from '@/utils/supabaseStorage';
import { hasUserUsedTrial } from '@/utils/subscriptionStorage';
import ReferralSystem from '@/components/ReferralSystem';
import ErrorReportModal from '@/components/ErrorReportModal';
import ProfileSection from '@/components/ProfileSection';

const getSystemLogo = (): string | null => {
  try {
    const localStorageKey = "system_settings_v1";
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.logo) return data.logo;
    return null;
  } catch {
    return null;
  }
};

interface UserHomeScreenProps {
  onOpenCashRegister: () => void;
}

const UserHomeScreen: React.FC<UserHomeScreenProps> = ({ onOpenCashRegister }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [logo, setLogo] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCashRegisterOpen, setIsCashRegisterOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  const [hasUsedTrialBefore, setHasUsedTrialBefore] = useState(false);
  const [showReferralSystem, setShowReferralSystem] = useState(false);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);

  // Check if user is admin - now based on profile status being 'admin'
  const isAdmin = profile?.status === 'admin';

  useEffect(() => {
    setLogo(getSystemLogo());
    const onStorage = () => setLogo(getSystemLogo());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
      checkCashRegisterStatus();
      checkTrialUsage();
    }
  }, [user]);

  // Check if user has used trial before
  const checkTrialUsage = async () => {
    if (!user) return;
    
    try {
      const trialUsed = await hasUserUsedTrial(user.id);
      setHasUsedTrialBefore(trialUsed);
      console.log('🔍 Verificação de uso do teste:', {
        userId: user.id,
        email: user.email,
        hasUsedTrial: trialUsed
      });
    } catch (error) {
      console.error('Erro ao verificar uso do teste:', error);
      // Fallback to localStorage check
      const localTrialUsed = localStorage.getItem(`trial_used_${user.id}`) === 'true';
      setHasUsedTrialBefore(localTrialUsed);
    }
  };

  // NOVO: Escutar eventos de sincronização de assinatura
  useEffect(() => {
    const handleSubscriptionSynced = (event: any) => {
      // Sync event received (dev only)
      if (import.meta.env.DEV) console.log('🔔 Evento de sincronização recebido no UserHomeScreen:', event.detail);
      if (event.detail.userId === user?.id) {
        fetchSubscription(); // Re-buscar dados da assinatura
      }
    };

    const handleSubscriptionCleared = (event: any) => {
      console.log('🗑️ Evento de limpeza de assinatura recebido:', event.detail);
      if (event.detail.userId === user?.id) {
        setSubscription(null); // Limpar assinatura
      }
    };

    window.addEventListener('subscriptionSynced', handleSubscriptionSynced);
    window.addEventListener('subscriptionCleared', handleSubscriptionCleared);

    return () => {
      window.removeEventListener('subscriptionSynced', handleSubscriptionSynced);
      window.removeEventListener('subscriptionCleared', handleSubscriptionCleared);
    };
  }, [user]);

  // Função para calcular dias restantes
  const calculateRemainingDays = (expiresAt: string): number => {
    const expirationDate = new Date(expiresAt);
    const currentDate = new Date();
    const timeDiff = expirationDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  };

  // Função para obter o nome do plano em português
  const getPlanDisplayName = (planType: string): string => {
    switch (planType) {
      case 'trial': return 'Teste Gratuito';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return 'Plano';
    }
  };

  // CORREÇÃO CRÍTICA: Função melhorada para verificar assinatura ativa
  const checkActiveSubscription = () => {
    if (isAdmin) return true;
    
    if (!user) return false;
    
    console.log('🔍 Verificando assinatura ativa para usuário:', user.email);
    
    // Verificar se existe assinatura válida do Supabase primeiro
    if (subscription && subscription.is_active && new Date(subscription.expires_at) > new Date()) {
      console.log('✅ Subscription from Supabase is active');
      return true;
    }
    
    // 1. PRIMEIRA PRIORIDADE: Assinatura ativada pelo admin
    const adminSubscription = localStorage.getItem(`subscription_${user.id}`);
    if (adminSubscription) {
      try {
        const sub = JSON.parse(adminSubscription);
        console.log('📋 Admin subscription found:', sub);
        if (sub.is_active && new Date(sub.expires_at) > new Date()) {
          console.log('✅ Admin subscription is active');
          return true;
        } else {
          console.log('⚠️ Admin subscription found but expired or inactive');
          // Remove subscription expirada
          localStorage.removeItem(`subscription_${user.id}`);
        }
      } catch (error) {
        console.error('❌ Error parsing admin subscription:', error);
        localStorage.removeItem(`subscription_${user.id}`);
      }
    }
    
    // 2. SEGUNDA PRIORIDADE: Dados de usuário
    const userSubscription = localStorage.getItem(`user_subscription_${user.id}`);
    if (userSubscription) {
      try {
        const sub = JSON.parse(userSubscription);
        console.log('📋 User subscription found:', sub);
        if (sub.hasActiveSubscription && new Date(sub.expiresAt) > new Date()) {
          console.log('✅ User subscription is active');
          return true;
        } else {
          console.log('⚠️ User subscription found but expired or inactive');
          // Remove subscription expirada
          localStorage.removeItem(`user_subscription_${user.id}`);
        }
      } catch (error) {
        console.error('❌ Error parsing user subscription:', error);
        localStorage.removeItem(`user_subscription_${user.id}`);
      }
    }
    
    // 3. TERCEIRA PRIORIDADE: Status global
    const subscriptionStatus = localStorage.getItem(`subscription_status_${user.id}`);
    if (subscriptionStatus) {
      try {
        const status = JSON.parse(subscriptionStatus);
        console.log('📋 Subscription status found:', status);
        if (status.isActive && new Date(status.expiresAt) > new Date()) {
          console.log('✅ Subscription status is active');
          return true;
        } else {
          console.log('⚠️ Subscription status found but expired or inactive');
          // Remove status expirado
          localStorage.removeItem(`subscription_status_${user.id}`);
        }
      } catch (error) {
        console.error('❌ Error parsing subscription status:', error);
        localStorage.removeItem(`subscription_status_${user.id}`);
      }
    }
    
    console.log('❌ No active subscription found');
    return false;
  };

  const checkCashRegisterStatus = async () => {
    try {
      const activeCashRegister = await getActiveCashRegister();
      setIsCashRegisterOpen(activeCashRegister !== null && activeCashRegister.status === 'open');
    } catch (error) {
      console.error('Error checking cash register status:', error);
      setIsCashRegisterOpen(false);
    }
  };

  // CORREÇÃO PRINCIPAL: Função corrigida para abrir caixa ou PDV
  const handleOpenCashOrPDV = () => {
    console.log('🔄 Tentando abrir caixa/PDV:', { isCashRegisterOpen });
    
    if (isCashRegisterOpen) {
      // Se o caixa está aberto, navegar diretamente para o PDV
      console.log('✅ Caixa aberto, redirecionando para PDV');
      navigate('/');
    } else {
      // Se o caixa está fechado, abrir modal de abertura de caixa
      console.log('🔓 Caixa fechado, abrindo modal de abertura');
      onOpenCashRegister();
    }
  };

  // CORREÇÃO: Navegação inteligente baseada na assinatura
  const handleNavigation = (path: string) => {
    const isSubscriptionActive = checkActiveSubscription();
    
    // Se for admin ou tiver assinatura ativa, navegar diretamente
    if (isAdmin || isSubscriptionActive) {
      console.log('✅ Navigation allowed - admin or active subscription');
      // Para usuários com assinatura ativa, manter autenticação
      if (isSubscriptionActive && !isAdmin) {
        localStorage.setItem('dashboard_authenticated', 'true');
      }
      navigate(path);
    } else {
      console.log('❌ Navigation blocked - no active subscription');
      toast({
        title: "Assinatura Necessária",
        description: "Você precisa de uma assinatura ativa para acessar esta funcionalidade.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

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
    
    console.log('🔍 Buscando assinatura para usuário:', user.email);
    
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
      console.log('✅ Assinatura ativa encontrada no Supabase:', supabaseSubscription);
      setSubscription(supabaseSubscription);
      
      // Sincronizar com localStorage para compatibilidade
      const subscriptionData = {
        is_active: supabaseSubscription.is_active,
        expires_at: supabaseSubscription.expires_at,
        plan_type: supabaseSubscription.plan_type || 'trial',
        activated_at: supabaseSubscription.activated_at,
        activation_method: 'user',
        period_days: getPeriodDays(supabaseSubscription.plan_type)
      };
      
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(subscriptionData));
      localStorage.setItem(`user_subscription_${user.id}`, JSON.stringify({
        hasActiveSubscription: true,
        subscriptionType: supabaseSubscription.plan_type || 'trial',
        expiresAt: supabaseSubscription.expires_at,
        isTrialUsed: supabaseSubscription.plan_type === 'trial',
        activatedBy: 'user',
        activatedAt: supabaseSubscription.activated_at,
        periodDays: getPeriodDays(supabaseSubscription.plan_type)
      }));
      
      return;
    }

    let foundSubscription = null;
    
    // CORREÇÃO PRINCIPAL: Buscar em todas as possíveis chaves de assinatura com prioridade correta
    
    // 1. PRIMEIRA PRIORIDADE: Assinatura ativada pelo admin (chave padrão)
    const adminActivatedSubscription = localStorage.getItem(`subscription_${user.id}`);
    if (adminActivatedSubscription) {
      try {
        const subscription = JSON.parse(adminActivatedSubscription);
        console.log('✅ Assinatura encontrada (ativada pelo admin):', subscription);
        
        // Verifica se a assinatura ainda está válida
        if (subscription.is_active && new Date(subscription.expires_at) > new Date()) {
          foundSubscription = subscription;
          console.log('🎯 Assinatura ativa definida no estado:', subscription);
        } else {
          console.log('⚠️ Assinatura expirada, removendo...');
          localStorage.removeItem(`subscription_${user.id}`);
        }
      } catch (error) {
        console.error('❌ Erro ao parsear assinatura do admin:', error);
        localStorage.removeItem(`subscription_${user.id}`);
      }
    }

    // 2. Segunda prioridade: Verificar dados de usuário (formato alternativo) - apenas se não há assinatura admin
    if (!foundSubscription) {
      const userSubscription = localStorage.getItem(`user_subscription_${user.id}`);
      if (userSubscription) {
        try {
          const subscription = JSON.parse(userSubscription);
          console.log('📋 Dados de assinatura de usuário encontrados:', subscription);
          
          if (subscription.hasActiveSubscription && new Date(subscription.expiresAt) > new Date()) {
            // Converte para o formato padrão
            foundSubscription = {
              is_active: subscription.hasActiveSubscription,
              expires_at: subscription.expiresAt,
              plan_type: subscription.subscriptionType || 'trial',
              activated_at: subscription.activatedAt || new Date().toISOString(),
              activation_method: subscription.activatedBy || 'user',
              period_days: subscription.periodDays || 7
            };
            console.log('🔄 Convertido para formato padrão:', foundSubscription);
          }
        } catch (error) {
          console.error('❌ Erro ao processar assinatura de usuário:', error);
        }
      }
    }

    // 3. Terceira prioridade: Status global de assinatura - apenas se não há outras assinaturas
    if (!foundSubscription) {
      const subscriptionStatus = localStorage.getItem(`subscription_status_${user.id}`);
      if (subscriptionStatus) {
        try {
          const status = JSON.parse(subscriptionStatus);
          console.log('📊 Status de assinatura encontrado:', status);
          
          if (status.isActive && new Date(status.expiresAt) > new Date()) {
            foundSubscription = {
              is_active: status.isActive,
              expires_at: status.expiresAt,
              plan_type: status.type || 'trial',
              activated_at: new Date().toISOString(),
              activation_method: 'admin',
              period_days: status.periodDays || 30
            };
            console.log('🔄 Status convertido para assinatura:', foundSubscription);
          }
        } catch (error) {
          console.error('❌ Erro ao processar status de assinatura:', error);
        }
      }
    }

    if (foundSubscription) {
      setSubscription(foundSubscription);
      console.log('🎉 Assinatura ativa encontrada e definida:', foundSubscription);
    } else {
      console.log('❌ Nenhuma assinatura ativa encontrada para o usuário');
      setSubscription(null);
    }
  };

  const getPeriodDays = (planType: string | null): number => {
    switch (planType) {
      case 'trial': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'annual': return 365;
      default: return 7;
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;

    setHasUnsavedChanges(true);
    setProfile({ ...profile, ...updates });
  };

  const saveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: profile.name,
        company: profile.company,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: "Erro ao salvar perfil",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setHasUnsavedChanges(false);
      toast({
        title: "Perfil salvo!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    }
  };

  const handlePasswordChange = async () => {
    // Validar se todos os campos estão preenchidos
    if (!currentPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "Digite sua senha atual",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro ao alterar senha",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erro ao alterar senha",
        description: "A nova senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    try {
      // Primeiro, verificar a senha atual tentando fazer login novamente
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        toast({
          title: "Erro ao alterar senha",
          description: "Senha atual incorreta",
          variant: "destructive"
        });
        return;
      }

      // Se a senha atual está correta, proceder com a alteração
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        toast({
          title: "Erro ao alterar senha",
          description: updateError.message,
          variant: "destructive"
        });
      } else {
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({
          title: "Senha alterada com sucesso!",
          description: "Sua senha foi atualizada.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('dashboard_authenticated');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema",
    });
    navigate('/landing');
  };

  // ENHANCED: Free trial activation with strict validation
  const handleActivateFreeTrial = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive"
      });
      return;
    }

    // Double check if trial was already used
    if (hasUsedTrialBefore) {
      toast({
        title: "Teste já utilizado",
        description: "Você já utilizou seu período de teste gratuito de 7 dias. Para continuar usando o sistema, contrate um dos nossos planos.",
        variant: "destructive"
      });
      return;
    }

    setIsActivatingTrial(true);

    try {
      console.log('🚀 Iniciando ativação do teste gratuito para:', user.email);

      // Verificar se já existe uma assinatura ativa
      const { data: existingSubscription, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar assinatura existente:', checkError);
        throw new Error('Erro ao verificar status da assinatura');
      }

      if (existingSubscription) {
        toast({
          title: "Teste já ativo",
          description: "Você já possui uma assinatura ativa.",
          variant: "destructive"
        });
        return;
      }

      // Verificar se já usou o teste antes
      const { data: usedTrial, error: trialError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_type', 'trial')
        .maybeSingle();

      if (trialError) {
        console.error('Erro ao verificar teste usado:', trialError);
      }

      if (usedTrial) {
        toast({
          title: "Teste já utilizado",
          description: "Você já utilizou seu período de teste gratuito de 7 dias. Para continuar usando o sistema, contrate um dos nossos planos.",
          variant: "destructive"
        });
        setHasUsedTrialBefore(true);
        localStorage.setItem(`trial_used_${user.id}`, 'true');
        return;
      }

      // Calcular data de expiração (7 dias)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7);
      const activatedAt = new Date();

      console.log('📝 Criando nova assinatura de teste:', {
        user_id: user.id,
        plan_type: 'trial',
        expires_at: expirationDate.toISOString(),
        activated_at: activatedAt.toISOString()
      });

      // Criar nova assinatura de teste - usando 'trial' como plan_type válido
      const { data: newSubscription, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          is_active: true,
          plan_type: 'trial', // Usando valor válido conforme constraint
          expires_at: expirationDate.toISOString(),
          activated_at: activatedAt.toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar assinatura de teste:', insertError);
        throw new Error(`Falha ao criar assinatura: ${insertError.message}`);
      }

      console.log('🎉 Teste gratuito ativado com sucesso:', newSubscription);

      // Atualizar estado local
      setSubscription(newSubscription);
      setHasUsedTrialBefore(true);

      // Sincronizar com localStorage para compatibilidade
      const trialSubscription = {
        is_active: true,
        expires_at: expirationDate.toISOString(),
        plan_type: 'trial',
        activated_at: activatedAt.toISOString(),
        activation_method: 'free_trial',
        period_days: 7
      };

      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(trialSubscription));
      
      const userSubscriptionData = {
        hasActiveSubscription: true,
        subscriptionType: 'trial',
        expiresAt: expirationDate.toISOString(),
        isTrialUsed: true,
        activatedBy: 'user',
        activatedAt: activatedAt.toISOString(),
        periodDays: 7
      };
      
      localStorage.setItem(`user_subscription_${user.id}`, JSON.stringify(userSubscriptionData));
      localStorage.setItem(`subscription_status_${user.id}`, JSON.stringify({
        isActive: true,
        type: 'trial',
        expiresAt: expirationDate.toISOString(),
        periodDays: 7
      }));

      // Mark trial as permanently used
      localStorage.setItem(`trial_used_${user.id}`, 'true');

      toast({
        title: "Teste gratuito ativado!",
        description: `Você tem 7 dias de acesso completo ao sistema até ${expirationDate.toLocaleDateString('pt-BR')}.`,
      });

    } catch (error: any) {
      console.error('Erro ao ativar teste gratuito:', error);
      toast({
        title: "Erro ao ativar teste",
        description: error.message || "Ocorreu um erro inesperado ao ativar o período de teste.",
        variant: "destructive"
      });
    } finally {
      setIsActivatingTrial(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-pdv-dark flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // CORREÇÃO CRÍTICA: Melhora a verificação de assinatura ativa usando a função melhorada
  const isSubscriptionActive = checkActiveSubscription();

  console.log('Estado da assinatura:', {
    isAdmin,
    subscription,
    isSubscriptionActive,
    hasUsedTrialBefore,
    user: user.email
  });

  // Se está mostrando o sistema de indicações
  if (showReferralSystem) {
    return (
      <div
        className="min-h-screen bg-pdv-dark flex flex-col"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%), url('/lovable-uploads/9cb14a9f-019f-4ecf-8d1d-28f3edcb5faa.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Header */}
        <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              {logo ? (
                <img
                  src={logo}
                  alt="Logo"
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-white">Sistema PDV</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setShowReferralSystem(false)}
                variant="outline"
                size="sm"
                className="bg-transparent border border-white text-gray-300 hover:bg-gray-700 hover:border-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Badge variant="default" className="text-sm">
                {isAdmin ? 'Administrador' : 'Usuário Autenticado'}
              </Badge>
              {isAdmin && (
                <Button
                  onClick={() => navigate('/covildomal')}
                  size="sm"
                  className="bg-red-800 hover:bg-red-900 text-white border border-red-600"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Caixa Preta
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="exit-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <ReferralSystem />
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-pdv-dark flex flex-col"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%), url('/lovable-uploads/9cb14a9f-019f-4ecf-8d1d-28f3edcb5faa.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {logo ? (
              <img
                src={logo}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-700 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">Sistema PDV</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-sm">
              {isAdmin ? 'Administrador' : 'Usuário Autenticado'}
            </Badge>
            {isAdmin && (
              <Button
                onClick={() => navigate('/covildomal')}
                size="sm"
                className="bg-red-800 hover:bg-red-900 text-white border border-red-600"
              >
                <Terminal className="h-4 w-4 mr-2" />
                Caixa Preta
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="exit-button"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          
          {/* Seção do Usuário */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Usar o ProfileSection moderno */}
            <ProfileSection />

            {/* Card de Assinatura - Different for Admin vs Regular User */}
            <Card className="bg-pdv-dark-light border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  {isAdmin ? (
                    <UserCog className="h-5 w-5 text-purple-400" />
                  ) : (
                    <Crown className="h-5 w-5 text-yellow-400" />
                  )}
                  {isAdmin ? 'Painel Administrativo' : 'Assinatura'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  {isAdmin ? (
                    <>
                      <Badge className="bg-purple-600 text-white mb-2">
                        Acesso Administrativo
                      </Badge>
                      <p className="text-gray-300 text-sm mb-4">
                        Você possui acesso total ao sistema sem limitações de tempo.
                      </p>
                    </>
                  ) : (
                    <>
                      {isSubscriptionActive ? (
                        <>
                          <Badge className="bg-pdv-green text-white mb-2">
                            Plano Ativo
                          </Badge>
                          <p className="text-gray-300 text-sm mb-2">
                            Sua assinatura está ativa até {subscription ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                          {subscription && (
                            <>
                              <p className="text-gray-400 text-xs mb-4">
                                Plano: {getPlanDisplayName(subscription.plan_type)} - {calculateRemainingDays(subscription.expires_at)} dias restantes
                              </p>
                              {(subscription.activation_method === 'admin' || subscription.activation_method === 'admin_manual') && (
                                <p className="text-blue-300 text-xs mb-4">
                                  ✅ Ativado pelo administrador
                                </p>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400 mb-2">
                            Plano Inativo
                          </Badge>
                          <p className="text-gray-300 text-sm mb-4">
                            {hasUsedTrialBefore 
                              ? "Seu teste gratuito expirou. Contrate um plano para continuar usando o sistema."
                              : "Aproveite todos os recursos do sistema PDV com nossos planos flexíveis."
                            }
                          </p>
                          
                          {/* Show trial activation only if user hasn't used it before */}
                          {!hasUsedTrialBefore && (
                            <div className="bg-green-900/30 p-3 rounded-lg border border-green-700 mb-4">
                              <p className="text-sm text-green-200 mb-3">
                                🎉 <strong>Teste Gratuito Disponível!</strong> Experimente o sistema por 7 dias grátis.
                              </p>
                              <Button
                                onClick={handleActivateFreeTrial}
                                disabled={isActivatingTrial}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                {isActivatingTrial ? 'Ativando...' : 'Ativar Teste Gratuito'}
                              </Button>
                            </div>
                          )}
                          
                          {/* Show message for users who already used trial */}
                          {hasUsedTrialBefore && (
                            <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-700 mb-4">
                              <p className="text-sm text-orange-200 mb-3">
                                ⚠️ <strong>Teste Gratuito Já Utilizado</strong><br />
                                Você já usou seu período de teste gratuito de 7 dias. Para continuar usando o sistema, contrate um dos nossos planos.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate('/planos')}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Ver Planos
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Seção de Indicações - Only for regular users */}
            {!isAdmin && (
              <Card className="bg-pdv-dark-light border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      Indique e Ganhe
                    </div>
                    <Badge variant="secondary" className="bg-yellow-600 text-white text-xs">
                      (Em desenvolvimento)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge className="bg-green-600 text-white mb-2">
                      Programa de Indicação
                    </Badge>
                    <p className="text-gray-300 text-sm mb-4">
                      Indique amigos e ganhe dias extras na sua assinatura quando eles ativarem um plano!
                    </p>
                    
                    <div className="bg-green-900/30 p-3 rounded-lg border border-green-700 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-green-200" />
                        <span className="text-sm text-green-200 font-medium">Recompensas</span>
                      </div>
                      <ul className="text-xs text-green-100 space-y-1">
                        <li>• Plano Mensal: +7 dias</li>
                        <li>• Plano Trimestral: +14 dias</li>
                        <li>• Plano Anual: +30 dias</li>
                      </ul>
                    </div>
                    
                    <Button
                      onClick={() => setShowReferralSystem(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Indique e Ganhe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Seção Principal - Acesso Rápido */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Alert for inactive subscription */}
            {!isSubscriptionActive && !isAdmin && (
              <Card className="bg-red-900/30 border-red-700 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="text-center">
                    <Crown className="h-8 w-8 text-red-400 mx-auto mb-2" />
                    <h3 className="text-white font-medium mb-2">Assinatura Inativa</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {hasUsedTrialBefore 
                        ? "Seu teste gratuito expirou. Para acessar todas as funcionalidades do sistema, contrate um de nossos planos."
                        : "Para acessar todas as funcionalidades do sistema, você precisa de uma assinatura ativa."
                      }
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => navigate('/planos')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        Ver Planos
                      </Button>
                      {!hasUsedTrialBefore && (
                        <Button
                          onClick={handleActivateFreeTrial}
                          disabled={isActivatingTrial}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          {isActivatingTrial ? 'Ativando...' : 'Teste Grátis'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Ações Rápidas */}
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Acesso Rápido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  
                  {/* Botão dinâmico - Abrir Caixa/PDV - 100% width */}
                  <Button
                    onClick={handleOpenCashOrPDV}
                    className="w-full h-20 bg-pdv-green hover:bg-green-600 text-white flex-col gap-2"
                    size="lg"
                    disabled={!isSubscriptionActive && !isAdmin}
                  >
                    <ShoppingCart className="h-6 w-6" />
                    <span className="text-sm">
                      {isCashRegisterOpen 
                        ? "Abrir PDV - (Caixa aberto)" 
                        : "Abrir Caixa - (Caixa fechado)"
                      }
                    </span>
                  </Button>
                  
                  {/* Row 1 - Dashboard and Estoque - 50% each */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleNavigation('/dashboard')}
                      className="h-20 bg-blue-600 hover:bg-blue-700 text-white flex-col gap-2"
                      size="lg"
                      disabled={!isSubscriptionActive && !isAdmin}
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-sm">Dashboard</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleNavigation('/current-stock')}
                      className="h-20 bg-amber-600 hover:bg-amber-700 text-white flex-col gap-2"
                      size="lg"
                      disabled={!isSubscriptionActive && !isAdmin}
                    >
                      <Archive className="h-6 w-6" />
                      <span className="text-sm">Estoque</span>
                    </Button>
                  </div>
                  
                  {/* Row 2 - Materiais and Configurações - 50% each */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleNavigation('/materiais')}
                      className="h-20 bg-purple-600 hover:bg-purple-700 text-white flex-col gap-2"
                      size="lg"
                      disabled={!isSubscriptionActive && !isAdmin}
                    >
                      <BookOpen className="h-6 w-6" />
                      <span className="text-sm">Materiais</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleNavigation('/configuracoes')}
                      className="h-20 bg-gray-600 hover:bg-gray-700 text-white flex-col gap-2"
                      size="lg"
                      disabled={!isSubscriptionActive && !isAdmin}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="text-sm">Configurações</span>
                    </Button>
                  </div>
                  
                  {/* Row 3 - Guia Completo do Sistema - 100% width */}
                  <Button
                    onClick={() => navigate('/guia-completo')}
                    className="w-full h-20 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white flex-col gap-2"
                    size="lg"
                  >
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">Guia Completo</span>
                  </Button>
                  
                  {/* Row 4 - Suporte WhatsApp and Relatar Erro - 50% each */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => {
                        const message = encodeURIComponent('Olá! Preciso de ajuda com o Sistema XLata.site. Podem me ajudar?');
                        window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
                      }}
                      className="h-16 bg-transparent border-2 border-solid border-green-600 text-green-400 hover:bg-green-600 hover:text-white flex-col gap-1"
                      size="lg"
                    >
                      <Phone className="h-5 w-5" />
                      <span className="text-xs">Suporte WhatsApp</span>
                    </Button>
                    
                    <Button
                      onClick={() => setShowErrorReportModal(true)}
                      className="h-16 bg-transparent border-2 border-solid border-red-600 text-red-400 hover:bg-red-600 hover:text-white flex-col gap-1"
                      size="lg"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-xs">Relatar Erro</span>
                    </Button>
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* Bem-vindo */}
            <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Bem-vindo ao Sistema PDV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Olá, {profile?.name || user.email}! Você está usando o sistema completo de gestão de compra e venda para depósitos de ferro velho.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Segurança e Privacidade
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Autenticação segura</li>
                      <li>• Backup automático na nuvem</li>
                      <li>• Acesso protegido por senha</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Recursos Disponíveis
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Controle de caixa completo</li>
                      <li>• Gestão de estoque em tempo real</li>
                      <li>• Relatórios detalhados</li>
                      <li>• Dashboard com métricas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Error Report Modal */}
      <ErrorReportModal
        open={showErrorReportModal}
        onClose={() => setShowErrorReportModal(false)}
      />
    </div>
  );
};

export default UserHomeScreen;
