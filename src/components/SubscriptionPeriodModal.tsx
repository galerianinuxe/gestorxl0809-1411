import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Calendar, Check, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  plan_id: string;
  name: string;
  price: number;
  period: string;
  is_active: boolean;
  is_popular?: boolean;
  is_promotional?: boolean;
  display_order?: number;
  period_days: number;
}

interface SubscriptionPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (days: number) => void;
  userName: string;
  userId?: string;
}

const SubscriptionPeriodModal: React.FC<SubscriptionPeriodModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  userName,
  userId
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [currentSubscriptionDays, setCurrentSubscriptionDays] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadPlans();
      if (userId) {
        loadCurrentSubscription();
      }
    }
  }, [open, userId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // Convert plans to include period_days
      const plansWithDays = (data || []).map(plan => ({
        ...plan,
        period_days: getPlanDays(plan.plan_id)
      }));
      
      setPlans(plansWithDays);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Erro ao carregar planos",
        description: "Não foi possível carregar os planos disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDays = (planId: string): number => {
    switch (planId) {
      case 'mensal': return 30;
      case 'trimestral': return 90;
      case 'anual': return 365;
      case 'trienal': return 1095;
      case 'promocional': return 90;
      default: return 30;
    }
  };

  const loadCurrentSubscription = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        const diffTime = expiresAt.getTime() - now.getTime();
        const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setCurrentSubscriptionDays(remainingDays > 0 ? remainingDays : 0);
      }
    } catch (error: any) {
      // Se não houver assinatura ativa, não mostrar erro
      if (error.code !== 'PGRST116') {
        console.error('Error loading current subscription:', error);
      }
    }
  };

  const handleConfirm = () => {
    const days = showCustomInput && customDays ? customDays : selectedPeriod;
    if (days) {
      onConfirm(days);
      onOpenChange(false);
      setSelectedPeriod(null);
      setCustomDays(null);
      setShowCustomInput(false);
    }
  };

  const selectedPlan = plans.find(p => p.period_days === selectedPeriod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Ativar Assinatura para {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {currentSubscriptionDays !== null && currentSubscriptionDays > 0 && (
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700 mb-4">
              <p className="text-blue-200 text-sm flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>
                  <strong>Assinatura Atual:</strong> {currentSubscriptionDays} dias restantes
                </span>
              </p>
            </div>
          )}

          <p className="text-gray-300 text-sm">
            Selecione o período de assinatura que deseja ativar:
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            </div>
          ) : (
            <div className="grid gap-3">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedPeriod === plan.period_days && !showCustomInput
                      ? 'border-yellow-400 bg-yellow-400/10' 
                      : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                  }`}
                  onClick={() => {
                    setSelectedPeriod(plan.period_days);
                    setShowCustomInput(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedPeriod === plan.period_days && !showCustomInput ? 'bg-yellow-400' : 'bg-gray-600'
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-medium">{plan.period_days} Dias</h3>
                            {plan.is_popular && (
                              <Badge className="bg-purple-600 text-white text-xs">
                                Mais Popular
                              </Badge>
                            )}
                            {plan.is_promotional && (
                              <Badge className="bg-green-600 text-white text-xs">
                                Promocional
                              </Badge>
                            )}
                          </div>
                          <p className="text-white text-sm">{plan.name}</p>
                          <p className="text-gray-400 text-sm">R$ {plan.price.toFixed(2)}/{plan.period}</p>
                        </div>
                      </div>
                      {selectedPeriod === plan.period_days && !showCustomInput && (
                        <Check className="h-5 w-5 text-yellow-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Opção de Período Manual */}
              <Card 
                className={`cursor-pointer transition-all border-2 ${
                  showCustomInput
                    ? 'border-blue-400 bg-blue-400/10' 
                    : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                }`}
                onClick={() => {
                  setShowCustomInput(true);
                  setSelectedPeriod(customDays || 0);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Período Personalizado</h3>
                      {showCustomInput && (
                        <div className="mt-2">
                          <Label className="text-gray-400 text-sm mb-1 block">Quantidade de Dias</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Digite a quantidade de dias"
                            value={customDays || ''}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setCustomDays(value);
                              setSelectedPeriod(value);
                            }}
                            className="bg-gray-700 border-gray-600 text-white"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {selectedPlan && !showCustomInput && (
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">
              <p className="text-sm text-blue-200">
                ℹ️ <strong>Resumo:</strong> Você está ativando um {selectedPlan.name} ({selectedPlan.period_days} dias) 
                para {userName}. A assinatura será válida até {new Date(Date.now() + selectedPlan.period_days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.
              </p>
            </div>
          )}
          
          {showCustomInput && customDays && customDays > 0 && (
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">
              <p className="text-sm text-blue-200">
                ℹ️ <strong>Resumo:</strong> Você está ativando um período personalizado de {customDays} dias 
                para {userName}. A assinatura será válida até {new Date(Date.now() + customDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedPeriod || selectedPeriod <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              Confirmar Ativação
            </Button>
            
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPeriodModal;
