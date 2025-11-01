
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Check } from 'lucide-react';

interface SubscriptionPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (days: number) => void;
  userName: string;
}

const SubscriptionPeriodModal: React.FC<SubscriptionPeriodModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  userName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  const periods = [
    { days: 30, label: '30 Dias', price: 'R$ 147,90', color: 'bg-blue-600', subtitle: 'Plano Mensal' },
    { days: 90, label: '90 Dias', price: 'R$ 387,90', color: 'bg-purple-600', popular: true, subtitle: 'Plano Trimestral' },
    { days: 1095, label: '3 Anos', price: 'R$ 4.497,90', color: 'bg-green-600', subtitle: 'Plano Trienal' }
  ];

  const handleConfirm = () => {
    if (selectedPeriod) {
      onConfirm(selectedPeriod);
      onOpenChange(false);
      setSelectedPeriod(null);
    }
  };

  const selectedPlan = periods.find(p => p.days === selectedPeriod);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-400" />
            Ativar Assinatura para {userName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-gray-300 text-sm">
            Selecione o período de assinatura que deseja ativar:
          </p>
          
          <div className="grid gap-3">
            {periods.map((period) => (
              <Card 
                key={period.days}
                className={`cursor-pointer transition-all border-2 ${
                  selectedPeriod === period.days 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                }`}
                onClick={() => setSelectedPeriod(period.days)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedPeriod === period.days ? 'bg-yellow-400' : 'bg-gray-600'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{period.label}</h3>
                          {period.popular && (
                            <Badge className="bg-purple-600 text-white text-xs">
                              Mais Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-white text-sm">{period.subtitle}</p>
                        <p className="text-gray-400 text-sm">{period.price}/período</p>
                      </div>
                    </div>
                    {selectedPeriod === period.days && (
                      <Check className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedPlan && (
            <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-700">
              <p className="text-sm text-blue-200">
                ℹ️ <strong>Resumo:</strong> Você está ativando um {selectedPlan.subtitle} ({selectedPlan.days} dias) 
                para {userName}. A assinatura será válida até {new Date(Date.now() + selectedPlan.days * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={!selectedPeriod}
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
