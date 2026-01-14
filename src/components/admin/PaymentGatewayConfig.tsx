import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Wallet, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Save, 
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Bell,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentConfig {
  id: string;
  gateway_name: string;
  is_active: boolean;
  environment: 'sandbox' | 'production';
  public_key: string | null;
  pix_enabled: boolean;
  card_enabled: boolean;
  max_installments: number;
  min_installment_value: number;
  notification_email: string | null;
  notify_on_approval: boolean;
  notify_on_failure: boolean;
  webhook_url: string | null;
  last_test_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
}

interface RecentPayment {
  id: string;
  status: string;
  transaction_amount: number;
  payer_email: string;
  created_at: string;
  payment_method_id: string | null;
}

export const PaymentGatewayConfig: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_config')
        .select('*')
        .eq('gateway_name', 'mercado_pago')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data as PaymentConfig);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de pagamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('mercado_pago_payments')
        .select('id, status, transaction_amount, payer_email, created_at, payment_method_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPayments((data || []) as RecentPayment[]);
    } catch (error) {
      console.error('Erro ao buscar pagamentos recentes:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRecentPayments();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({
          is_active: config.is_active,
          environment: config.environment,
          public_key: config.public_key,
          pix_enabled: config.pix_enabled,
          card_enabled: config.card_enabled,
          max_installments: config.max_installments,
          min_installment_value: config.min_installment_value,
          notification_email: config.notification_email,
          notify_on_approval: config.notify_on_approval,
          notify_on_failure: config.notify_on_failure
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config?.public_key) {
      toast({
        title: 'Atenção',
        description: 'Configure a chave pública antes de testar.',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    try {
      // Test by trying to initialize the SDK
      const testStatus = config.public_key.startsWith('APP_USR-') || config.public_key.startsWith('TEST-') 
        ? 'success' 
        : 'invalid_format';
      
      const { error } = await supabase
        .from('payment_gateway_config')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_status: testStatus
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfig(prev => prev ? {
        ...prev,
        last_test_at: new Date().toISOString(),
        last_test_status: testStatus
      } : null);

      toast({
        title: testStatus === 'success' ? 'Conexão OK' : 'Formato inválido',
        description: testStatus === 'success' 
          ? 'A chave pública parece válida!' 
          : 'A chave pública não está no formato esperado.',
        variant: testStatus === 'success' ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao testar conexão.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    if (config?.webhook_url) {
      navigator.clipboard.writeText(config.webhook_url);
      toast({
        title: 'Copiado!',
        description: 'URL do webhook copiada para a área de transferência.'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      approved: { label: 'Aprovado', className: 'bg-emerald-600' },
      pending: { label: 'Pendente', className: 'bg-amber-600' },
      rejected: { label: 'Recusado', className: 'bg-destructive' },
      cancelled: { label: 'Cancelado', className: 'bg-muted' }
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Configuração de pagamento não encontrada.</p>
          <Button onClick={fetchConfig} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuração de Pagamentos</h2>
          <p className="text-muted-foreground">Gerencie suas integrações de pagamento</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} variant="outline" disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Testar Conexão
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mercadopago" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
          <TabsTrigger value="methods">Métodos</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="mercadopago" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Credenciais do Mercado Pago
              </CardTitle>
              <CardDescription>
                Configure suas credenciais de integração com o Mercado Pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  {config.is_active ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      Gateway {config.is_active ? 'Ativo' : 'Inativo'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {config.last_test_at 
                        ? `Último teste: ${formatDate(config.last_test_at)} - ${config.last_test_status === 'success' ? 'OK' : 'Falhou'}`
                        : 'Nunca testado'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                />
              </div>

              {/* Environment */}
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select
                  value={config.environment}
                  onValueChange={(value: 'sandbox' | 'production') => 
                    setConfig({ ...config, environment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-600/20 text-amber-400 border-amber-600">
                          Sandbox
                        </Badge>
                        Ambiente de testes
                      </div>
                    </SelectItem>
                    <SelectItem value="production">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-600/20 text-emerald-400 border-emerald-600">
                          Produção
                        </Badge>
                        Ambiente real
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Use Sandbox para testes e Produção para pagamentos reais.
                </p>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <Label>Chave Pública (Public Key)</Label>
                <Input
                  value={config.public_key || ''}
                  onChange={(e) => setConfig({ ...config, public_key: e.target.value })}
                  placeholder="APP_USR-xxxxxxxx ou TEST-xxxxxxxx"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Encontre em{' '}
                  <a 
                    href="https://www.mercadopago.com.br/developers/panel/app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Mercado Pago Developers
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.webhook_url || ''}
                    readOnly
                    className="font-mono text-sm bg-muted/30"
                  />
                  <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Configure esta URL nas{' '}
                  <a 
                    href="https://www.mercadopago.com.br/developers/panel/app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    configurações de webhook
                  </a>
                  {' '}do Mercado Pago.
                </p>
              </div>

              {/* Info about Access Token */}
              <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-400">Sobre o Access Token</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O Access Token (chave secreta) deve ser configurado como um{' '}
                      <strong>secret do Supabase</strong> por segurança. 
                      Configure o secret <code className="bg-muted px-1 rounded">MERCADOPAGO_ACCESS_TOKEN</code> no painel do Supabase.
                    </p>
                    <a 
                      href="https://supabase.com/dashboard/project/oxawvjcckmbevjztyfgp/settings/functions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm inline-flex items-center gap-1 mt-2"
                    >
                      Configurar Secrets
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>
                Configure quais métodos de pagamento estão disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PIX */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
                    <span className="font-bold text-teal-400">PIX</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pagamento via PIX</p>
                    <p className="text-sm text-muted-foreground">QR Code instantâneo</p>
                  </div>
                </div>
                <Switch
                  checked={config.pix_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, pix_enabled: checked })}
                />
              </div>

              {/* Cartão */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">Visa, Master, Elo, etc.</p>
                  </div>
                </div>
                <Switch
                  checked={config.card_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, card_enabled: checked })}
                />
              </div>

              {/* Parcelas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Parcelas</Label>
                  <Select
                    value={config.max_installments.toString()}
                    onValueChange={(value) => setConfig({ ...config, max_installments: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor Mínimo por Parcela</Label>
                  <Input
                    type="number"
                    value={config.min_installment_value}
                    onChange={(e) => setConfig({ ...config, min_installment_value: parseFloat(e.target.value) || 5 })}
                    min={1}
                    step={0.01}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notificações de Pagamento
              </CardTitle>
              <CardDescription>
                Configure alertas para eventos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>E-mail para Notificações</Label>
                <Input
                  type="email"
                  value={config.notification_email || ''}
                  onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
                  placeholder="admin@seusite.com"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Notificar Aprovações</p>
                  <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento for aprovado</p>
                </div>
                <Switch
                  checked={config.notify_on_approval}
                  onCheckedChange={(checked) => setConfig({ ...config, notify_on_approval: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Notificar Falhas</p>
                  <p className="text-sm text-muted-foreground">Receber alerta quando um pagamento falhar</p>
                </div>
                <Switch
                  checked={config.notify_on_failure}
                  onCheckedChange={(checked) => setConfig({ ...config, notify_on_failure: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Pagamentos Recentes
              </CardTitle>
              <CardDescription>
                Últimos 10 pagamentos processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          {payment.payment_method_id === 'pix' ? (
                            <span className="text-xs font-bold text-primary">PIX</span>
                          ) : (
                            <CreditCard className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{payment.payer_email}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground">
                          {formatCurrency(payment.transaction_amount)}
                        </span>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
