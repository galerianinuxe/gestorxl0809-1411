import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, ArrowLeft, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { validateSupabaseConnection } from '@/utils/connectionValidator';
import LoginLogo from '@/components/LoginLogo';
import { useRateLimit } from '@/hooks/useRateLimit';
import { SEOHead } from '@/components/portal/SEOHead';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  // Rate limiting for login attempts
  const { checkRateLimit, recordAttempt, resetRateLimit } = useRateLimit('login', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  });

  // Redirecionar usuários logados
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ User is logged in, redirecting from login page to home');
      navigate('/');
    }
  }, [user, loading, navigate]);

  const checkSupabaseStatus = async () => {
    setSupabaseStatus('checking');
    const status = await validateSupabaseConnection();
    setSupabaseStatus(status.isConnected ? 'connected' : 'disconnected');
  };

  // Verifica status do Supabase ao carregar a página
  useEffect(() => {
    checkSupabaseStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit before attempting login
    const rateLimitStatus = checkRateLimit();
    if (!rateLimitStatus.allowed) {
      toast({
        title: "🚫 Muitas tentativas",
        description: `Aguarde ${rateLimitStatus.remainingTime} minutos antes de tentar novamente.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('🔐 Iniciando processo de login...');
      
      // Verifica conexão ANTES de tentar login
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        toast({
          title: "🚫 Supabase Desconectado",
          description: connectionStatus.error || "Não é possível fazer login sem conexão com o banco de dados",
          variant: "destructive"
        });
        setSupabaseStatus('disconnected');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await signIn(email, password);
      
      if (error) {
        // Record failed attempt
        const attemptResult = recordAttempt();
        
        console.error('❌ Erro no login:', error);
        
        let description = error.message || "Erro inesperado. Tente novamente.";
        if (attemptResult.blocked) {
          description = `Muitas tentativas falhas. Aguarde ${attemptResult.remainingTime} minutos.`;
        } else {
          const remaining = checkRateLimit().attemptsLeft;
          if (remaining <= 2) {
            description += ` (${remaining} tentativas restantes)`;
          }
        }
        
        toast({
          title: "❌ Erro no login",
          description,
          variant: "destructive"
        });
      } else if (data?.session) {
        // Reset rate limit on successful login
        resetRateLimit();
        
        console.log('✅ Login realizado com sucesso');
        toast({
          title: "✅ Login realizado com sucesso!",
          description: "Bem-vindo ao Sistema PDV",
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('💥 Erro crítico no login:', error);
      toast({
        title: "💥 Erro crítico",
        description: "Falha na comunicação com o servidor. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Login - XLata"
        description="Acesse sua conta XLata - Sistema para Depósito de Reciclagem"
        allowIndexing={false}
      />
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-bold text-white">Entre na sua conta</h1>
          <p className="text-gray-400">Acesse o Sistema PDV</p>
          
          {/* Status de conexão REAL com Supabase */}
          {getConnectionDisplay()}
        </div>

        <Card className="bg-gray-800/90 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="seu@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-900 border-gray-600 text-white pr-10"
                    placeholder="Sua senha"
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

              <Button
                type="submit"
                disabled={isLoading || supabaseStatus === 'disconnected'}
                className="w-full bg-green-600 hover:bg-green-700 text-[#202020] font-semibold disabled:opacity-50"
              >
                {isLoading ? "🔄 Entrando..." : "Entrar"}
              </Button>
              
              {supabaseStatus === 'disconnected' && (
                <div className="text-center text-red-400 text-sm">
                  ⚠️ Login bloqueado - Supabase desconectado
                </div>
              )}
            </form>

            <div className="mt-6">
              <Separator className="bg-gray-600" />
              <div className="text-center mt-4">
                <p className="text-gray-400 text-sm">
                  Não tem uma conta?{' '}
                  <Button
                    variant="link"
                    onClick={() => navigate('/register')}
                    className="text-green-400 hover:text-green-300 p-0 h-auto"
                    disabled={isLoading}
                  >
                    Registre-se aqui
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
      </div>
    </>
  );
};

export default Login;
