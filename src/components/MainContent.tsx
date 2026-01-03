import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Key, 
  BarChart3, 
  Archive, 
  ShoppingCart, 
  Shield,
  Settings,
  BookOpen,
  PhoneCall,
  AlertCircle,
  Crown,
  CheckCircle,
  Zap,
  ChevronRight
} from 'lucide-react';

interface MainContentProps {
  profile: any;
  subscription: any;
  isAdmin: boolean;
  isEditingPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  hasUnsavedChanges: boolean;
  onUpdateProfile: (updates: any) => void;
  onSaveProfile: () => void;
  onPasswordChange: () => void;
  onSetIsEditingPassword: (editing: boolean) => void;
  onSetCurrentPassword: (password: string) => void;
  onSetNewPassword: (password: string) => void;
  onSetConfirmPassword: (password: string) => void;
  onNavigateToPlans: () => void;
  onNavigateToGuide: () => void;
  onShowReferralSystem: () => void;
  onShowErrorReportModal: () => void;
  onOpenCashRegister: () => void;
  onNavigate: (path: string) => void;
}

export function MainContent({
  profile,
  subscription,
  isAdmin,
  isEditingPassword,
  currentPassword,
  newPassword,
  confirmPassword,
  hasUnsavedChanges,
  onUpdateProfile,
  onSaveProfile,
  onPasswordChange,
  onSetIsEditingPassword,
  onSetCurrentPassword,
  onSetNewPassword,
  onSetConfirmPassword,
  onNavigateToPlans,
  onNavigateToGuide,
  onShowReferralSystem,
  onShowErrorReportModal,
  onOpenCashRegister,
  onNavigate
}: MainContentProps) {
  
  const calculateRemainingDays = (expiresAt: string): number => {
    const expirationDate = new Date(expiresAt);
    const currentDate = new Date();
    const timeDiff = expirationDate.getTime() - currentDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return Math.max(0, daysDiff);
  };

  const getPlanDisplayName = (planType: string): string => {
    switch (planType) {
      case 'trial': return 'Teste Gratuito';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return 'Plano';
    }
  };

  const quickAccessCards = [
    {
      title: "Abrir Caixa",
      description: "Iniciar ou continuar operação",
      icon: ShoppingCart,
      action: onOpenCashRegister
    },
    {
      title: "Dashboard",
      description: "Métricas e relatórios",
      icon: BarChart3,
      action: () => onNavigate('/dashboard')
    },
    {
      title: "Estoque",
      description: "Gerenciar materiais",
      icon: Archive,
      action: () => onNavigate('/current-stock')
    },
    {
      title: "Configurações",
      description: "Personalizar sistema",
      icon: Settings,
      action: () => onNavigate('/configuracoes')
    },
  ];

  const systemFeatures = [
    {
      title: "Segurança",
      items: ["Autenticação segura", "Backup automático", "Dados criptografados"]
    },
    {
      title: "Recursos",
      items: ["Controle de caixa", "Gestão de estoque", "Relatórios detalhados"]
    }
  ];

  const supportOptions = [
    {
      title: "WhatsApp",
      description: "Suporte direto",
      icon: PhoneCall,
      action: () => {
        const message = encodeURIComponent('Olá, preciso de suporte relacionado ao sistema XLATA.');
        window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      }
    },
    {
      title: "Relatar Erro",
      description: "Reportar problemas",
      icon: AlertCircle,
      action: onShowErrorReportModal
    },
    {
      title: "Guia",
      description: "Tutorial completo",
      icon: BookOpen,
      action: onNavigateToGuide
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-950">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Sistema PDV
        </h1>
        <p className="text-gray-500 text-sm">
          {profile?.name ? `Olá, ${profile.name}` : 'Bem-vindo'} — Gestão completa para seu negócio
        </p>
      </div>

      {/* Quick Access Grid - Monocromático */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {quickAccessCards.map((card, index) => (
          <Card 
            key={index} 
            className="bg-gray-900 border-gray-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer group"
            onClick={card.action}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-gray-800 text-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                  <card.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{card.title}</h3>
              <p className="text-xs text-gray-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Section */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-gray-500" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 text-xs">Nome</Label>
                <Input
                  value={profile?.name || ""}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1.5 h-9 text-sm"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label className="text-gray-500 text-xs">Empresa</Label>
                <Input
                  value={profile?.company || ""}
                  onChange={(e) => onUpdateProfile({ company: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1.5 h-9 text-sm"
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-500 text-xs">WhatsApp</Label>
                <Input
                  value={profile?.whatsapp || ""}
                  onChange={(e) => onUpdateProfile({ whatsapp: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1.5 h-9 text-sm"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-3.5 w-3.5 text-gray-500" />
                <Label className="text-gray-500 text-xs">Senha</Label>
              </div>
              
              {!isEditingPassword ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value="********"
                    disabled
                    className="bg-gray-800 border-gray-700 text-gray-500 h-9 text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => onSetIsEditingPassword(true)}
                    className="bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white h-9 text-sm"
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Senha atual"
                    value={currentPassword}
                    onChange={(e) => onSetCurrentPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => onSetNewPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => onSetConfirmPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white h-9 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={onPasswordChange}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onSetIsEditingPassword(false)}
                      className="bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 h-9 text-sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {hasUnsavedChanges && (
              <Button
                onClick={onSaveProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
              >
                Salvar Perfil
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Status / Admin Card */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-gray-500" />
              {isAdmin ? 'Administrador' : 'Assinatura'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-emerald-400 font-medium text-sm">Acesso Total</p>
                    <p className="text-gray-500 text-xs">Sem limitações</p>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate('/covildomal')}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 h-9 text-sm"
                >
                  Painel Admin
                </Button>
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-emerald-500 text-xs font-medium">
                      {getPlanDisplayName(subscription.plan_type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Expira em</span>
                  <span className="text-white text-xs">
                    {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Dias restantes</span>
                  <span className="text-white text-xs font-medium">
                    {calculateRemainingDays(subscription.expires_at)}
                  </span>
                </div>
                <Button
                  onClick={onNavigateToPlans}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
                >
                  Gerenciar Plano
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Você precisa de uma assinatura ativa para acessar todas as funcionalidades.
                </p>
                <Button
                  onClick={onNavigateToPlans}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-sm"
                >
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {systemFeatures.map((feature, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <h3 className="text-white font-medium text-sm mb-3">{feature.title}</h3>
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2 text-gray-400 text-xs">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Options */}
      <div className="mt-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Suporte</h2>
        <div className="grid grid-cols-3 gap-3">
          {supportOptions.map((option, index) => (
            <Card 
              key={index} 
              className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
              onClick={option.action}
            >
              <CardContent className="p-3 text-center">
                <div className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-800 text-gray-400 mb-2">
                  <option.icon className="h-4 w-4" />
                </div>
                <h3 className="font-medium text-white text-xs">{option.title}</h3>
                <p className="text-[10px] text-gray-500">{option.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
