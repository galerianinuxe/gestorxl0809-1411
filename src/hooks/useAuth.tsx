
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearUserSessionData } from '../utils/supabaseStorage';
import { validateSupabaseConnection, clearAllLocalData } from '../utils/connectionValidator';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // CRITICAL: Clear session data when user logs out or session expires
        if (event === 'SIGNED_OUT' || !session) {
          clearUserSessionData();
          clearAllLocalData();
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão:', error);
          clearAllLocalData();
          setSession(null);
          setUser(null);
        } else if (session) {
          setSession(session);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        
      } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        clearAllLocalData();
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Iniciando cadastro
      
      // VALIDAÇÃO: Supabase deve estar funcionando
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        const error = connectionStatus.error || 'Supabase inacessível';
        console.error('❌ Cadastro BLOQUEADO:', error);
        return { data: null, error: { message: error } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      return { data, error };

    } catch (networkError: any) {
      console.error('❌ Erro no cadastro:', networkError);
      clearAllLocalData();
      return { data: null, error: { message: 'Erro de conectividade' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Iniciando login
      
      // VALIDAÇÃO: Supabase deve estar funcionando
      const connectionStatus = await validateSupabaseConnection();
      if (!connectionStatus.isConnected) {
        const error = connectionStatus.error || 'Supabase inacessível';
        console.error('❌ Login BLOQUEADO:', error);
        return { data: null, error: { message: error } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      return { data, error };

    } catch (networkError: any) {
      console.error('❌ Erro no login:', networkError);
      clearAllLocalData();
      return { data: null, error: { message: 'Erro de conectividade' } };
    }
  };

  const signOut = async () => {
    try {
      // Fazendo logout
      
      // Limpa dados locais
      clearUserSessionData();
      clearAllLocalData();
      
      // Tenta logout no servidor
      await supabase.auth.signOut();
      
    } catch (error) {
      console.error('Erro durante logout:', error);
      // Mesmo com erro, SEMPRE limpa dados locais
      clearUserSessionData();
      clearAllLocalData();
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
