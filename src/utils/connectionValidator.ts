
// Utility para validar conexão com Supabase de forma REAL
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionStatus {
  isConnected: boolean;
  error?: string;
}

// VALIDAÇÃO REAL: Testa se consegue fazer uma query real no Supabase
export const validateSupabaseConnection = async (timeout = 3000): Promise<ConnectionStatus> => {
  try {
    console.log('🔍 Testando conexão REAL com Supabase...');
    
    // Cria uma promise que tenta fazer uma query real
    const queryPromise = supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    // Cria timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout - Supabase inacessível')), timeout)
    );
    
    // Executa a query com timeout
    const { error } = await Promise.race([queryPromise, timeoutPromise]);
    
    if (error) {
      console.error('❌ Erro na query Supabase:', error);
      return {
        isConnected: false,
        error: 'Supabase inacessível - erro na consulta'
      };
    }
    
    console.log('✅ Supabase conectado e funcionando');
    return { isConnected: true };
    
  } catch (error: any) {
    console.error('❌ Falha na conexão com Supabase:', error.message);
    return {
      isConnected: false,
      error: `Supabase desconectado: ${error.message}`
    };
  }
};

// VALIDAÇÃO AUTH: Testa se auth está funcionando
export const validateAuthConnection = async (): Promise<ConnectionStatus> => {
  try {
    console.log('🔐 Testando serviços de autenticação...');
    
    // Primeiro valida conexão básica
    const connectionStatus = await validateSupabaseConnection(2000);
    if (!connectionStatus.isConnected) {
      return connectionStatus;
    }
    
    // Testa se consegue acessar sessão
    const { error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Erro ao acessar sessão:', sessionError);
      return {
        isConnected: false,
        error: 'Serviços de autenticação indisponíveis'
      };
    }
    
    console.log('✅ Autenticação funcionando');
    return { isConnected: true };
    
  } catch (error: any) {
    console.error('❌ Falha na validação de auth:', error.message);
    return {
      isConnected: false,
      error: `Auth indisponível: ${error.message}`
    };
  }
};

// Limpa dados locais quando há problemas
export const clearAllLocalData = (): void => {
  try {
    console.log('🧹 Limpando dados locais...');
    
    // Limpa localStorage relacionado ao Supabase
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Dados locais limpos');
  } catch (error) {
    console.error('Erro na limpeza:', error);
  }
};

export const clearAllAuthData = clearAllLocalData;
export const forceSupabaseCacheClear = clearAllLocalData;
export const checkNetworkStatus = () => navigator.onLine;
