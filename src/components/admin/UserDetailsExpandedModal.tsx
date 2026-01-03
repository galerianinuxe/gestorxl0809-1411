import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, Mail, Calendar, CreditCard, Clock, Shield, Activity, 
  Trash2, Download, Phone, Globe, Monitor, Smartphone, Tablet,
  LogIn, MapPin, X, Power, AlertTriangle, CheckCircle, XCircle,
  History, Laptop, Key, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  whatsapp?: string | null;
  company?: string | null;
  created_at: string;
  subscription_status: 'trial' | 'paid' | 'expired' | 'inactive';
  subscription_type: string | null;
  expires_at: string | null;
  is_active: boolean;
  remaining_days: number | null;
  plan_display_name: string | null;
  user_status: 'active' | 'inactive';
  last_login_at?: string | null;
  status?: 'admin' | 'user';
}

interface AccessLog {
  id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  success: boolean;
  created_at: string;
}

interface ActiveSession {
  id: string;
  session_token: string;
  ip_address: string;
  device_type: string;
  browser: string;
  os: string;
  country: string;
  city: string;
  last_activity: string;
  created_at: string;
  is_active: boolean;
}

interface SubscriptionHistory {
  id: string;
  plan_type: string;
  is_active: boolean;
  activated_at: string;
  expires_at: string;
  activation_method?: string | null;
  period_days?: number | null;
  payment_method?: string | null;
}

interface UserDetailsExpandedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  onRefresh?: () => void;
}

const UserDetailsExpandedModal: React.FC<UserDetailsExpandedModalProps> = ({
  open,
  onOpenChange,
  user,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
  const [uniqueIPs, setUniqueIPs] = useState<{ ip: string; country: string; city: string; lastUsed: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user, activeTab]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch access logs
      const { data: logs } = await supabase
        .from('admin_access_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logs) {
        setAccessLogs(logs.map(log => ({
          ...log,
          ip_address: String(log.ip_address || ''),
        })));

        // Calculate unique IPs
        const ipMap = new Map<string, { country: string; city: string; lastUsed: string; count: number }>();
        logs.forEach(log => {
          const ip = String(log.ip_address || '');
          if (ip) {
            const existing = ipMap.get(ip);
            if (existing) {
              existing.count++;
              if (new Date(log.created_at) > new Date(existing.lastUsed)) {
                existing.lastUsed = log.created_at;
              }
            } else {
              ipMap.set(ip, {
                country: log.country || 'Desconhecido',
                city: log.city || 'Desconhecido',
                lastUsed: log.created_at,
                count: 1
              });
            }
          }
        });

        setUniqueIPs(Array.from(ipMap.entries()).map(([ip, data]) => ({ ip, ...data })));
      }

      // Fetch active sessions
      const { data: sessions } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (sessions) {
        setActiveSessions(sessions.map(session => ({
          ...session,
          ip_address: String(session.ip_address || ''),
        })));
      }

      // Fetch subscription history
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptions) {
        setSubscriptionHistory(subscriptions);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Sessão encerrada",
        description: "A sessão foi encerrada com sucesso.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({
        title: "Erro",
        description: "Não foi possível encerrar a sessão.",
        variant: "destructive",
      });
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Sessões encerradas",
        description: "Todas as sessões do usuário foram encerradas.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast({
        title: "Erro",
        description: "Não foi possível encerrar as sessões.",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Laptop className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial':
        return <Badge className="bg-cyan-500 text-white">Teste Grátis</Badge>;
      case 'paid':
        return <Badge className="bg-green-600 text-white">Assinatura Ativa</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="outline">Inativo</Badge>;
    }
  };

  const getPlanTypeName = (planType: string) => {
    switch (planType) {
      case 'trial': return 'Teste Grátis';
      case 'monthly': return 'Mensal';
      case 'quarterly': return 'Trimestral';
      case 'annual': return 'Anual';
      default: return planType;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-background border-border overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {user.name || 'Usuário sem nome'}
                {getStatusBadge(user.subscription_status)}
                {user.status === 'admin' && (
                  <Badge className="bg-amber-500 text-white">Admin</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5 bg-muted">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informações</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="logins" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="ips" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">IPs</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Sessões</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Nome</span>
                      <span className="font-medium">{user.name || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Email</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">WhatsApp</span>
                      <span className="font-medium">{user.whatsapp || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Empresa</span>
                      <span className="font-medium">{user.company || 'Não informado'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Atividade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Cadastro</span>
                      <span className="font-medium">
                        {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Último Login</span>
                      <span className="font-medium">
                        {user.last_login_at 
                          ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })
                          : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Status da Conta</span>
                      <Badge variant={user.is_active ? "default" : "destructive"}>
                        {user.is_active ? 'Ativa' : 'Desativada'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Tipo</span>
                      <Badge variant={user.status === 'admin' ? "default" : "secondary"}>
                        {user.status === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Assinatura */}
            <TabsContent value="subscription" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Plano</span>
                    <span className="font-medium">{user.plan_display_name || 'Sem plano'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Status</span>
                    {getStatusBadge(user.subscription_status)}
                  </div>
                  {user.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">Expira em</span>
                      <span className="font-medium">
                        {format(new Date(user.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        {user.remaining_days !== null && user.remaining_days > 0 && (
                          <span className="text-muted-foreground ml-2">({user.remaining_days} dias)</span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Histórico de Assinaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhuma assinatura encontrada
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ativação</TableHead>
                          <TableHead>Expiração</TableHead>
                          <TableHead>Método</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionHistory.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>{getPlanTypeName(sub.plan_type)}</TableCell>
                            <TableCell>
                              <Badge variant={sub.is_active ? "default" : "secondary"}>
                                {sub.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.activated_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="capitalize">{sub.activation_method || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Histórico de Login */}
            <TabsContent value="logins" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-primary" />
                    Últimos 50 Logins
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchUserData} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {accessLogs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhum log de acesso encontrado
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>IP</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accessLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">
                              {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="capitalize">{log.action}</TableCell>
                            <TableCell className="font-mono text-xs">{log.ip_address}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(log.device_type)}
                                <span className="text-sm">{log.browser || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.city && log.country ? `${log.city}, ${log.country}` : 'Desconhecido'}
                            </TableCell>
                            <TableCell>
                              {log.success ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: IPs Utilizados */}
            <TabsContent value="ips" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    IPs Únicos ({uniqueIPs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {uniqueIPs.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhum IP registrado
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Último Uso</TableHead>
                          <TableHead>Acessos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueIPs.map((ip, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{ip.ip}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {ip.city}, {ip.country}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDistanceToNow(new Date(ip.lastUsed), { addSuffix: true, locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{ip.count}x</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Sessões Ativas */}
            <TabsContent value="sessions" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    Sessões Ativas ({activeSessions.length})
                  </CardTitle>
                  {activeSessions.length > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleTerminateAllSessions}
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Encerrar Todas
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {activeSessions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Nenhuma sessão ativa
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div 
                          key={session.id} 
                          className="flex items-center justify-between p-4 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            {getDeviceIcon(session.device_type)}
                            <div>
                              <p className="font-medium">
                                {session.browser} em {session.os}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {session.ip_address} • {session.city}, {session.country}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Ativo {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Encerrar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsExpandedModal;
