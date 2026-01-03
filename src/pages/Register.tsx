declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowLeft, CheckCircle, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateSupabaseConnection } from '@/utils/connectionValidator';
import EmailConfirmationModal from '@/components/EmailConfirmationModal';
import LoginLogo from '@/components/LoginLogo';
import { supabase } from '@/integrations/supabase/client';

interface ReferralInfo {
  name: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const referralKey = searchParams.get('ref');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [showEmailConfirmationModal, setShowEmailConfirmationModal] = useState(false);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);

  // Verificar se há uma chave de referência válida
  useEffect(() => {
    if (referralKey) {
      checkReferralKey(referralKey);
    }
  }, [referralKey]);

  const checkReferralKey = async (refKey: string) => {
    try {
      console.log('🔗 Verificando chave de referência:', refKey);
      
      // Tentar buscar por ref_key primeiro (novo formato curto)
      let { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('ref_key', refKey)
        .single();

      // Se não encontrou por ref_key, tentar por ID (formato antigo UUID)
      if (error || !data) {
        const { data: dataById, error: errorById } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', refKey)
          .single();
        
        if (!errorById && dataById) {
          data = dataById;
          error = null;
        }
      }

      if (!error && data) {
        setReferralInfo(data);
        console.log('✅ Chave de referência válida:', data.name);
        toast({
          title: "Link de indicação detectado!",
          description: `Você foi indicado por ${data.name}. Ao criar sua conta, vocês serão conectados automaticamente.`,
        });
      } else {
        console.log('❌ Chave de referência inválida');
        toast({
          title: "Link de indicação inválido",
          description: "A chave de referência não foi encontrada, mas você ainda pode se cadastrar normalmente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('💥 Erro ao verificar chave de referência:', error);
    }
  };

  // Verifica status do Supabase ao carregar a página
  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const checkSupabaseStatus = async () => {
    setSupabaseStatus('checking');
    const status = await validateSupabaseConnection();
    setSupabaseStatus(status.isConnected ? 'connected' : 'disconnected');
  };

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a formatação (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'whatsapp') {
      const formatted = formatWhatsApp(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  // Validações iniciais
  if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
    toast({ title: "❌ Erro no cadastro", description: "Por favor, preencha todos os campos obrigatórios", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  if (!acceptTerms) {
    toast({ title: "❌ Erro no cadastro", description: "Você deve aceitar os termos de uso e condições para continuar", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  if (formData.password.length < 6) {
    toast({ title: "❌ Erro no cadastro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    toast({ title: "❌ Erro no cadastro", description: "As senhas não coincidem", variant: "destructive" });
    setIsLoading(false);
    return;
  }

  try {
    console.log('📝 Iniciando processo de cadastro...');

    const connectionStatus = await validateSupabaseConnection();
    if (!connectionStatus.isConnected) {
      toast({ title: "🚫 Supabase Desconectado", description: connectionStatus.error || "Não é possível fazer cadastro sem conexão com o banco de dados", variant: "destructive" });
      setSupabaseStatus('disconnected');
      setIsLoading(false);
      return;
    }

    const result = await signUp(formData.email, formData.password, {
      name: formData.name,
      whatsapp: formData.whatsapp,
      indicador_id: referralKey || null
    });

    if (result.error) {
      console.error('❌ Erro no cadastro:', result.error);
      toast({ title: "❌ Erro no cadastro", description: result.error.message || "Erro inesperado. Tente novamente.", variant: "destructive" });
    } else if (result.data?.user) {
      console.log('✅ Cadastro realizado com sucesso');

      // 🔥 Dispara conversão do Google Ads
      if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: 'AW-17214693640/k7iUCJTo1-saEIjCzZBA'
        });
      }

      setShowEmailConfirmationModal(true);

      if (referralKey && referralInfo) {
        toast({ title: "✅ Cadastro realizado!", description: `Sua conta foi criada e vinculada à indicação de ${referralInfo.name}.` });
      }
    }
  } catch (error: any) {
    console.error('💥 Erro crítico no cadastro:', error);
    toast({ title: "💥 Erro crítico", description: "Falha na comunicação com o servidor. Tente novamente.", variant: "destructive" });
  } finally {
    setIsLoading(false);
  }
};

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmationModal(false);
    navigate('/login');
  };

  const getConnectionDisplay = () => {
    switch (supabaseStatus) {
      case 'checking':
        return (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
            <span className="text-yellow-400 text-sm">Verificando Servidor...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center justify-center gap-2 mt-2">
            <Wifi className="h-4 w-4 text-green-400" />
            <span className="text-green-400 text-sm">Servidor Online</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center justify-center gap-2 mt-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">Servidor Offline</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkSupabaseStatus}
              className="text-red-400 hover:text-red-300 p-1 h-auto"
            >
              Tentar novamente
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/landing')}
            className="text-white hover:text-gray-300 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <LoginLogo />
          <h1 className="text-2xl font-bold text-white">Crie sua conta</h1>
          <p className="text-gray-400">
            {referralInfo ? `🎉 Indicado por ${referralInfo.name}! ` : ''}
            Ative seu teste grátis de 7 dias no primeiro login após confirmar o email
          </p>
          
          {/* Status de conexão REAL com Supabase */}
          {getConnectionDisplay()}
        </div>

        <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Registro</CardTitle>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                {referralInfo ? '🎉 Indicação detectada • ' : ''}7 dias grátis • Sem cartão de crédito
              </span>
            </div>
            {referralInfo && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3 mt-2">
                <p className="text-green-300 text-sm text-center">
                  ✨ Você foi indicado por <strong>{referralInfo.name}</strong>
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nome *</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="Seu nome"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">WhatsApp</Label>
                <Input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="(XX) XXXXX-XXXX"
                  disabled={isLoading}
                  maxLength={15}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Senha *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-gray-900 border-gray-600 text-white pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Confirmar Senha *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-gray-900 border-gray-600 text-white pr-10"
                    placeholder="Repita sua senha"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Checkbox de Termos de Uso */}
              <div className="flex items-start space-x-2 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  disabled={isLoading}
                  className="border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    Aceito os{' '}
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => navigate('/termos-de-uso')}
                      className="text-green-400 hover:text-green-300 p-0 h-auto text-sm underline"
                      disabled={isLoading}
                    >
                      Termos de Uso e Condições
                    </Button>{' '}
                    do SISTEMA XLATA.SITE *
                  </label>
                  <p className="text-xs text-gray-500">
                    Você deve aceitar nossos termos para criar uma conta.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || supabaseStatus === 'disconnected' || !acceptTerms}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50 mt-6"
              >
                {isLoading ? "🔄 Criando conta..." : "Criar Conta e Começar Teste"}
              </Button>
              
              {supabaseStatus === 'disconnected' && (
                <div className="text-center text-red-400 text-sm">
                  ⚠️ Cadastro bloqueado - Servidor desconectado
                </div>
              )}

              {!acceptTerms && (
                <div className="text-center text-yellow-400 text-sm">
                  ⚠️ É necessário aceitar os termos para continuar
                </div>
              )}
            </form>

            <div className="mt-6">
              <Separator className="bg-gray-600" />
              <div className="text-center mt-4">
                <p className="text-gray-400 text-sm">
                  Já tem uma conta?{' '}
                  <Button
                    variant="link"
                    onClick={() => navigate('/login')}
                    className="text-green-400 hover:text-green-300 p-0 h-auto"
                    disabled={isLoading}
                  >
                    Entre aqui
                  </Button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Precisa de ajuda?{' '}
            <Button
              variant="link"
              className="text-green-400 hover:text-green-300 p-0 h-auto text-sm"
            >
              Entre em contato
            </Button>
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de E-mail */}
      <EmailConfirmationModal
        open={showEmailConfirmationModal}
        onClose={handleEmailConfirmationClose}
        email={formData.email}
      />
    </div>
  );
};

export default Register;
