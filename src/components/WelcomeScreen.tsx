import React, { memo, useCallback, useState, useEffect } from 'react';
import { HomeLayout } from './HomeLayout';
import { FirstLoginModal } from './FirstLoginModal';
import { OnboardingWizard } from './onboarding/OnboardingWizard';
import SubscriptionManagementModal from './SubscriptionManagementModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { hasUserUsedTrial, hasActiveSubscription } from '@/utils/subscriptionStorage';
import { useEmployee } from '@/contexts/EmployeeContext';

interface WelcomeScreenProps {
  onOpenCashRegister: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = memo(({ onOpenCashRegister }) => {
  const { user } = useAuth();
  const { isEmployee, hasActiveSubscription: employeeHasSubscription, loading: employeeLoading } = useEmployee();
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [isCheckingFirstLogin, setIsCheckingFirstLogin] = useState(true);

  // Verificar se é o primeiro login do usuário
  useEffect(() => {
    const checkFirstLogin = async () => {
      if (!user || employeeLoading) {
        return;
      }

      // Se é funcionário, NÃO mostrar modal de trial - usar assinatura do dono
      if (isEmployee) {
        console.log('✅ Funcionário detectado, pulando modal de primeiro login');
        setIsCheckingFirstLogin(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_login_completed, name, onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao verificar primeiro login:', error);
          setIsCheckingFirstLogin(false);
          return;
        }

        if (profile) {
          setUserName(profile.name || '');
          
          // Se não completou o primeiro login
          if (!profile.first_login_completed) {
            // PRIMEIRO: Verificar se já tem assinatura ativa (paga ou trial)
            const hasActive = await hasActiveSubscription(user.id);
            
            if (hasActive) {
              // Já tem assinatura ativa → marcar como completo e não mostrar modal
              console.log('✅ Usuário já tem assinatura ativa, não exibir modal de trial');
              await supabase
                .from('profiles')
                .update({ first_login_completed: true })
                .eq('id', user.id);
            } else {
              // Não tem assinatura ativa → verificar se já usou o teste grátis
              const trialUsed = await hasUserUsedTrial(user.id);
              
              if (trialUsed) {
                // Já usou teste → mostrar modal de planos
                setShowPlansModal(true);
                // Marcar primeiro login como concluído
                await supabase
                  .from('profiles')
                  .update({ first_login_completed: true })
                  .eq('id', user.id);
              } else {
                // Nunca usou teste e não tem assinatura → mostrar modal de ativação
                setShowFirstLoginModal(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar primeiro login:', error);
      } finally {
        setIsCheckingFirstLogin(false);
      }
    };

    checkFirstLogin();
  }, [user, isEmployee, employeeLoading]);

  // Callback quando o trial é ativado no FirstLoginModal
  const handleTrialActivated = useCallback(async () => {
    if (!user) return;

    try {
      // Marcar primeiro login como concluído
      await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', user.id);

      // Mostrar o wizard de onboarding
      setShowOnboardingWizard(true);
    } catch (error) {
      console.error('Erro ao marcar primeiro login como concluído:', error);
    }
  }, [user]);

  // Fechar o modal de primeiro login sem ativar trial
  const handleCloseFirstLoginModal = useCallback(async () => {
    if (!user) return;

    try {
      // Marcar primeiro login como concluído mesmo sem ativar trial
      await supabase
        .from('profiles')
        .update({ first_login_completed: true })
        .eq('id', user.id);

      setShowFirstLoginModal(false);
    } catch (error) {
      console.error('Erro ao marcar primeiro login como concluído:', error);
      setShowFirstLoginModal(false);
    }
  }, [user]);

  // Otimizar callback para evitar re-renders desnecessários
  const handleOpenCashRegister = useCallback(() => {
    // Usar requestAnimationFrame para garantir transição suave
    requestAnimationFrame(() => {
      onOpenCashRegister();
    });
  }, [onOpenCashRegister]);

  if (isCheckingFirstLogin) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HomeLayout onOpenCashRegister={handleOpenCashRegister} />
      
      {/* Modal de primeiro login - apenas se nunca usou teste */}
      <FirstLoginModal
        open={showFirstLoginModal}
        onClose={handleCloseFirstLoginModal}
        userName={userName}
        onTrialActivated={handleTrialActivated}
      />

      {/* Modal de planos - se já usou teste grátis */}
      <SubscriptionManagementModal
        open={showPlansModal}
        onClose={() => setShowPlansModal(false)}
      />

      {/* Wizard de onboarding */}
      <OnboardingWizard
        open={showOnboardingWizard}
        onClose={() => setShowOnboardingWizard(false)}
        userName={userName}
      />
    </>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

export default WelcomeScreen;
