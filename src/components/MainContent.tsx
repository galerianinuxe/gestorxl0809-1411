import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Key, 
  Calendar, 
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
  Clock,
  Zap,
  CreditCard,
  Globe,
  Users,
  TrendingUp
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
      color: "bg-green-600 hover:bg-green-700",
      action: onOpenCashRegister
    },
    {
      title: "Dashboard",
      description: "Visualizar métricas e relatórios",
      icon: BarChart3,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => onNavigate('/dashboard')
    },
    {
      title: "Estoque",
      description: "Gerenciar materiais em estoque",
      icon: Archive,
      color: "bg-orange-600 hover:bg-orange-700",
      action: () => onNavigate('/current-stock')
    },
    {
      title: "Configurações",
      description: "Personalizar sistema",
      icon: Settings,
      color: "bg-gray-600 hover:bg-gray-700",
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
      color: "bg-green-600 hover:bg-green-700",
      action: () => {
        const message = encodeURIComponent('Olá, preciso de suporte relacionado ao sistema XLATA.');
        window.open(`https://wa.me/5511963512105?text=${message}`, '_blank');
      }
    },
    {
      title: "Relatar Erro",
      description: "Reportar problemas do sistema",
      icon: AlertCircle,
      color: "bg-red-600 hover:bg-red-700",
      action: onShowErrorReportModal
    },
    {
      title: "Guia Completo",
      description: "Tutorial completo do sistema",
      icon: BookOpen,
      color: "bg-purple-600 hover:bg-purple-700",
      action: onNavigateToGuide
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Bem-vindo ao Sistema PDV
        </h1>
        <p className="text-gray-400">
          {profile?.name ? `Olá, ${profile.name}!` : 'Olá, Administrador!'} 
          {' '}Você está usando o sistema completo de gestão de compra e venda para depósitos de ferro velho.
        </p>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickAccessCards.map((card, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color} text-white transition-all duration-200 group-hover:scale-110`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400 mb-4">{card.description}</p>
              <Button
                onClick={card.action}
                className={`w-full ${card.color} text-white font-semibold transition-all duration-200`}
              >
                Acessar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Section */}
        <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Nome</Label>
                <Input
                  value={profile?.name || ""}
                  onChange={(e) => onUpdateProfile({ name: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <Label className="text-gray-300">Empresa</Label>
                <Input
                  value={profile?.company || ""}
                  onChange={(e) => onUpdateProfile({ company: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Nome da sua empresa"
                />
              </div>
              <div>
                <Label className="text-gray-300">WhatsApp</Label>
                <Input
                  value={profile?.whatsapp || ""}
                  onChange={(e) => onUpdateProfile({ whatsapp: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
            </div>

            {/* Password Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-gray-400" />
                <Label className="text-gray-300">Senha</Label>
              </div>
              
              {!isEditingPassword ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value="********"
                    disabled
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Button
                    variant="outline"
                    onClick={() => onSetIsEditingPassword(true)}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
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
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={(e) => onSetNewPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={(e) => onSetConfirmPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={onPasswordChange}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onSetIsEditingPassword(false)}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Salvar Perfil
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5" />
              {isAdmin ? 'Acesso Administrativo' : 'Painel Administrativo'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-purple-600/20 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-purple-300 font-semibold">Acesso Administrativo</p>
                    <p className="text-purple-400 text-sm">Você possui acesso total ao sistema sem limitações de tempo.</p>
                  </div>
                </div>
                <Button
                  onClick={() => onNavigate('/covildomal')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Acessar Painel Admin
                </Button>
              </div>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {getPlanDisplayName(subscription.plan_type)}
                  </Badge>
                  <Zap className="h-4 w-4 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Expira em: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm text-gray-400">
                    Dias restantes: {calculateRemainingDays(subscription.expires_at)}
                  </p>
                </div>
                <Button
                  onClick={onNavigateToPlans}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Gerenciar Plano
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Você precisa de uma assinatura ativa para acessar todas as funcionalidades.
                </p>
                <Button
                  onClick={onNavigateToPlans}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {systemFeatures.map((feature, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <feature.icon className="h-5 w-5" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Support Options */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Suporte e Recursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {supportOptions.map((option, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${option.color} text-white`}>
                    <option.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
                <Button
                  onClick={option.action}
                  className={`w-full ${option.color} text-white`}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}