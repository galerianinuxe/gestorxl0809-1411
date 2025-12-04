import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Zap
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
      description: "Iniciar novo caixa ou continuar operação",
      icon: ShoppingCart,
      iconClass: "icon-container-green",
      btnClass: "action-btn-green",
      action: onOpenCashRegister
    },
    {
      title: "Dashboard",
      description: "Visualizar métricas e relatórios",
      icon: BarChart3,
      iconClass: "icon-container-blue",
      btnClass: "action-btn-blue",
      action: () => onNavigate('/dashboard')
    },
    {
      title: "Estoque",
      description: "Gerenciar materiais em estoque",
      icon: Archive,
      iconClass: "icon-container-orange",
      btnClass: "action-btn-orange",
      action: () => onNavigate('/current-stock')
    },
    {
      title: "Configurações",
      description: "Personalizar sistema",
      icon: Settings,
      iconClass: "icon-container-gray",
      btnClass: "action-btn-gray",
      action: () => onNavigate('/configuracoes')
    },
  ];

  const systemFeatures = [
    {
      title: "Segurança e Privacidade",
      description: "Autenticação segura com dados protegidos",
      icon: Shield,
      items: [
        "Autenticação segura",
        "Backup automático",
        "Dados criptografados"
      ]
    },
    {
      title: "Recursos Disponíveis",
      description: "Ferramentas completas para gestão",
      icon: Settings,
      items: [
        "Controle de caixa completo",
        "Gestão de estoque em tempo real",
        "Relatórios detalhados"
      ]
    }
  ];

  const supportOptions = [
    {
      title: "Suporte WhatsApp",
      description: "Fale conosco pelo WhatsApp",
      icon: PhoneCall,
      iconClass: "icon-container-green",
      btnClass: "action-btn-green",
      action: () => {
        const message = encodeURIComponent('Olá, preciso de suporte relacionado ao sistema XLATA.');
        window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      }
    },
    {
      title: "Relatar Erro",
      description: "Reportar problemas do sistema",
      icon: AlertCircle,
      iconClass: "icon-container-red",
      btnClass: "action-btn-red",
      action: onShowErrorReportModal
    },
    {
      title: "Guia Completo",
      description: "Tutorial completo do sistema",
      icon: BookOpen,
      iconClass: "icon-container-purple",
      btnClass: "action-btn-purple",
      action: onNavigateToGuide
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8 bg-[hsl(220,16%,13%)]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mb-2">
          Bem-vindo ao Sistema PDV
        </h1>
        <p className="text-slate-400">
          {profile?.name ? `Olá, ${profile.name}!` : 'Olá!'} 
          {' '}Sistema completo de gestão de compra e venda para depósitos de ferro velho.
        </p>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickAccessCards.map((card, index) => (
          <div key={index} className="quick-access-card group cursor-pointer" onClick={card.action}>
            <div className={`icon-container ${card.iconClass} mb-4`}>
              <card.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">{card.title}</h3>
            <p className="text-sm text-slate-400 mb-4">{card.description}</p>
            <button className={`action-btn ${card.btnClass}`}>
              Acessar
            </button>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <div className="dashboard-card-static lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="icon-container icon-container-blue">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Meu Perfil</h2>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-sm mb-2 block">Nome</Label>
                <Input
                  value={profile?.name || ""}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-sm mb-2 block">Empresa</Label>
                <Input
                  value={profile?.company || ""}
                  onChange={(e) => onUpdateProfile({ company: e.target.value })}
                  className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-sm mb-2 block">WhatsApp</Label>
                <Input
                  value={profile?.whatsapp || ""}
                  onChange={(e) => onUpdateProfile({ whatsapp: e.target.value })}
                  className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-[hsl(220,13%,26%)]">
              <div className="flex items-center gap-2 mb-4">
                <Key className="h-4 w-4 text-slate-400" />
                <Label className="text-slate-400 text-sm">Senha</Label>
              </div>
              
              {!isEditingPassword ? (
                <div className="flex items-center gap-3">
                  <Input
                    type="password"
                    value="********"
                    disabled
                    className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-400 h-11 flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => onSetIsEditingPassword(true)}
                    className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-300 hover:bg-[hsl(220,16%,26%)] h-11"
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
                    className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => onSetNewPassword(e.target.value)}
                    className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => onSetConfirmPassword(e.target.value)}
                    className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-100 h-11"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={onPasswordChange}
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400"
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onSetIsEditingPassword(false)}
                      className="bg-[hsl(220,16%,22%)] border-[hsl(220,13%,26%)] text-slate-300 hover:bg-[hsl(220,16%,26%)]"
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
                className="w-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 h-11"
              >
                Salvar Perfil
              </Button>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="dashboard-card-static p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="icon-container icon-container-purple">
              <Crown className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">
              {isAdmin ? 'Acesso Admin' : 'Assinatura'}
            </h2>
          </div>
          
          {isAdmin ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Shield className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-purple-300 font-medium">Acesso Administrativo</p>
                  <p className="text-purple-400/80 text-sm mt-1">Acesso total ao sistema sem limitações.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/covildomal')}
                className="action-btn action-btn-purple w-full"
              >
                Acessar Painel Admin
              </button>
            </div>
          ) : subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
                  {getPlanDisplayName(subscription.plan_type)}
                </Badge>
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="space-y-2 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Expira em</span>
                  <span className="text-slate-200">{new Date(subscription.expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dias restantes</span>
                  <span className="text-emerald-400 font-medium">{calculateRemainingDays(subscription.expires_at)}</span>
                </div>
              </div>
              <button
                onClick={onNavigateToPlans}
                className="action-btn action-btn-green w-full"
              >
                Gerenciar Plano
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Você precisa de uma assinatura ativa para acessar todas as funcionalidades.
              </p>
              <button
                onClick={onNavigateToPlans}
                className="action-btn action-btn-green w-full"
              >
                Ver Planos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* System Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {systemFeatures.map((feature, index) => (
          <div key={index} className="dashboard-card-static p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className={`icon-container ${index === 0 ? 'icon-container-blue' : 'icon-container-purple'}`}>
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">{feature.title}</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">{feature.description}</p>
            <ul className="space-y-2.5">
              {feature.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Support Options */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Suporte e Recursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportOptions.map((option, index) => (
            <div key={index} className="quick-access-card group cursor-pointer" onClick={option.action}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`icon-container ${option.iconClass}`}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-100">{option.title}</h3>
                  <p className="text-sm text-slate-400">{option.description}</p>
                </div>
              </div>
              <button className={`action-btn ${option.btnClass}`}>
                Acessar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
