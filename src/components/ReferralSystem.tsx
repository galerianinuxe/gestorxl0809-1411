import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Users, Gift, TrendingUp, Calendar, Key, RefreshCw, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ReferralData {
  indicado_id: string;
  indicado_name: string;
  indicado_email: string;
  plan_type: string;
  is_active: boolean;
  dias_recompensa: number;
  data_recompensa: string;
  ref_key_used: string;
}

interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_bonus_days: number;
  ref_key: string;
}

const ReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);

  const referralLink = stats?.ref_key ? `https://xlata.site/register?ref=${stats.ref_key}` : '';

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar perfil do usuário atual primeiro
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, indicador_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        // Criar um perfil básico se não existir
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: user.id, 
            name: user.email?.split('@')[0] || 'Usuário',
            email: user.email 
          }])
          .select();
        
        if (insertError) {
          console.error('Erro ao criar perfil:', insertError);
        }
      }

      // Usar o ID do usuário como fallback se não houver ref_key
      const userRefKey = user.id;

      // Buscar indicações diretamente da tabela profiles (temporariamente)
      const { data: referralsData, error: referralsError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at')
        .eq('indicador_id', user.id);

      if (referralsError) {
        console.error('Erro ao buscar indicações:', referralsError);
      }

      // Processar dados das indicações
      const formattedReferrals: ReferralData[] = referralsData?.map((referral: any) => ({
        indicado_id: referral.id,
        indicado_name: referral.name || 'Usuário',
        indicado_email: referral.email || '',
        plan_type: '',
        is_active: false,
        dias_recompensa: 0,
        data_recompensa: '',
        ref_key_used: user.id
      })) || [];

      // Definir estatísticas básicas temporariamente
      setStats({
        total_referrals: formattedReferrals.length,
        active_referrals: 0,
        total_bonus_days: 0,
        ref_key: userRefKey
      });

      setReferrals(formattedReferrals);
    } catch (error) {
      console.error('Erro ao buscar dados de indicação:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRefKey = async () => {
    if (!user) return;

    try {
      setGeneratingKey(true);
      
      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const userName = profileData?.name || user.email?.split('@')[0] || 'Usuario';

      // Gerar nova chave usando a função do banco
      const { data: newKey, error } = await supabase
        .rpc('generate_ref_key', { user_name: userName });

      if (error) {
        throw error;
      }

      // Atualizar o perfil com a nova chave (temporariamente desabilitado até resolver o tipo)
      // const { error: updateError } = await supabase
      //   .from('profiles')
      //   .update({ ref_key: newKey })
      //   .eq('id', user.id);

      // if (updateError) {
      //   throw updateError;
      // }

      toast({
        title: "Chave gerada!",
        description: `Sua nova chave de referência: ${newKey}`,
      });

      // Faster data reload
      setTimeout(fetchReferralData, 300);
    } catch (error) {
      console.error('Erro ao gerar chave:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar chave. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingKey(false);
    }
  };

  const regenerateOldKeys = async () => {
    try {
      const { data: count, error } = await supabase
        .rpc('regenerate_all_ref_keys');

      if (error) {
        throw error;
      }

      toast({
        title: "Chaves regeneradas!",
        description: `${count} chaves longas foram atualizadas para o novo formato.`,
      });

      fetchReferralData();
    } catch (error) {
      console.error('Erro ao regenerar chaves:', error);
      toast({
        title: "Erro",
        description: "Erro ao regenerar chaves antigas.",
        variant: "destructive",
      });
    }
  };

  const copyReferralLink = async () => {
    if (!referralLink) return;

    try {
      setCopying(true);
      await navigator.clipboard.writeText(referralLink);
      toast({
        title: "Link copiado!",
        description: "Seu link de indicação foi copiado para a área de transferência.",
      });
    } catch (error) {
      // Fallback para browsers que não suportam clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = referralLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        
        toast({
          title: "Link copiado!",
          description: "Seu link de indicação foi copiado para a área de transferência.",
        });
      } catch (fallbackError) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setCopying(false);
    }
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return 'Não definido';
    }
  };

  const getStatusBadge = (isActive: boolean, planType: string) => {
    if (isActive && planType) {
      return <Badge className="bg-green-600">Ativo</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="h-32 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Sistema de Indicações</h2>
        <p className="text-gray-400">Indique amigos e ganhe dias extras na sua assinatura!</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Indicações</p>
                <p className="text-2xl font-bold text-white">{stats?.total_referrals || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Indicações Ativas</p>
                <p className="text-2xl font-bold text-green-400">{stats?.active_referrals || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Dias Ganhos</p>
                <p className="text-2xl font-bold text-purple-400">{stats?.total_bonus_days || 0}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nova seção de informação sobre o novo formato */}
      <Card className="bg-blue-900/30 border-blue-700">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-blue-200 font-medium mb-2">Novo Formato de Chaves</h4>
              <p className="text-sm text-blue-100 mb-2">
                As chaves de referência agora são mais curtas e amigáveis!
              </p>
              <p className="text-xs text-blue-200">
                Exemplo: "Rodrigo Galvão Souza" cadastrado em "05/07/2025 às 11:25" = <strong>ROD0507112</strong>
              </p>
              {stats?.ref_key && stats.ref_key.length > 15 && (
                <Button
                  onClick={regenerateOldKeys}
                  size="sm"
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  Atualizar Chaves Antigas
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geração/Exibição da Chave de Referência */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sua Chave de Referência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats?.ref_key ? (
            <div>
              <div className="flex gap-2 mb-4">
                <Input
                  value={stats.ref_key}
                  readOnly
                  className="bg-gray-900 border-gray-600 text-white flex-1"
                />
                <Button
                  onClick={generateRefKey}
                  disabled={generatingKey}
                  variant="outline"
                  className="border-gray-600"
                  title="Gerar nova chave"
                >
                  <RefreshCw className={`h-4 w-4 ${generatingKey ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Chave ativa e pronta para compartilhar
                {stats.ref_key.length > 15 && (
                  <span className="text-yellow-400">(formato antigo - clique em atualizar)</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">Você ainda não tem uma chave de referência</p>
              <Button
                onClick={generateRefKey}
                disabled={generatingKey}
                className="bg-green-600 hover:bg-green-700"
              >
                {generatingKey ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Minha Chave
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link de indicação */}
      {stats?.ref_key && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Seu Link de Indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-gray-900 border-gray-600 text-white flex-1"
              />
              <Button
                onClick={copyReferralLink}
                disabled={copying}
                className="bg-green-600 hover:bg-green-700"
              >
                {copying ? 'Copiando...' : 'Copiar'}
              </Button>
            </div>
            
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
              <h4 className="text-blue-200 font-medium mb-2">Como funciona?</h4>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• Compartilhe seu link com amigos</li>
                <li>• Quando eles se cadastrarem, você será creditado como indicador</li>
                <li>• Ganhe dias extras quando a assinatura deles for ativada:</li>
                <li className="ml-4">→ Plano Mensal: +7 dias</li>
                <li className="ml-4">→ Plano Trimestral: +14 dias</li>
                <li className="ml-4">→ Plano Anual: +30 dias</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de indicações */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Suas Indicações</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma indicação ainda</p>
              <p className="text-sm text-gray-500 mt-2">
                Compartilhe seu link de indicação para começar a ganhar recompensas!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div key={referral.indicado_id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-300" />
                    </div>
                    
                    <div>
                      <p className="font-medium text-white">
                        {referral.indicado_name || 'Usuário'}
                      </p>
                      <p className="text-sm text-gray-400">{referral.indicado_email}</p>
                      {referral.plan_type && (
                        <p className="text-xs text-gray-500">
                          Plano: {getPlanName(referral.plan_type)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {referral.dias_recompensa > 0 && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-400">
                          <Gift className="h-3 w-3" />
                          <span className="text-sm font-medium">+{referral.dias_recompensa} dias</span>
                        </div>
                        {referral.data_recompensa && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(referral.data_recompensa).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {getStatusBadge(referral.is_active, referral.plan_type)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem;
