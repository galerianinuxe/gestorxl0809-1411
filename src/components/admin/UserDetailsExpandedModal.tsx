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
  History, Laptop, Key, RefreshCw, ShoppingCart, Package, Users, BarChart3
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

interface Order {
  id: string;
  type: string;
  total: number;
  status: string;
  customer_id: string | null;
  created_at: string;
}

interface Material {
  id: string;
  name: string;
  price: number;
  sale_price: number;
  unit: string | null;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  created_at: string;
}

interface UserStats {
  totalSales: number;
  totalPurchases: number;
  totalOrders: number;
  totalMaterials: number;
  totalCustomers: number;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<UserStats>({ totalSales: 0, totalPurchases: 0, totalOrders: 0, totalMaterials: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserData();
    }
  }, [open, user, activeTab]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [logsResult, sessionsResult, subscriptionsResult, ordersResult, materialsResult, customersResult] = await Promise.all([
        supabase.from('admin_access_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('active_sessions').select('*').eq('user_id', user.id).eq('is_active', true).order('last_activity', { ascending: false }),
        supabase.from('user_subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, type, total, status, customer_id, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('materials').select('id, name, price, sale_price, unit, created_at').eq('user_id', user.id).order('name'),
        supabase.from('customers').select('id, name, created_at').eq('user_id', user.id).order('name')
      ]);

      // Process access logs
      if (logsResult.data) {
        setAccessLogs(logsResult.data.map(log => ({
          ...log,
          ip_address: String(log.ip_address || ''),
        })));

        const ipMap = new Map<string, { country: string; city: string; lastUsed: string; count: number }>();
        logsResult.data.forEach(log => {
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

      // Set sessions
      if (sessionsResult.data) {
        setActiveSessions(sessionsResult.data.map(session => ({
          ...session,
          ip_address: String(session.ip_address || ''),
        })));
      }

      // Set subscriptions
      if (subscriptionsResult.data) {
        setSubscriptionHistory(subscriptionsResult.data);
      }

      // Set orders and calculate stats
      if (ordersResult.data) {
        setOrders(ordersResult.data);
        const totalSales = ordersResult.data.filter(o => o.type === 'venda' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        const totalPurchases = ordersResult.data.filter(o => o.type === 'compra' && o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0);
        setStats(prev => ({ ...prev, totalSales, totalPurchases, totalOrders: ordersResult.data.length }));
      }

      // Set materials
      if (materialsResult.data) {
        setMaterials(materialsResult.data);
        setStats(prev => ({ ...prev, totalMaterials: materialsResult.data.length }));
      }

      // Set customers
      if (customersResult.data) {
        setCustomers(customersResult.data);
        setStats(prev => ({ ...prev, totalCustomers: customersResult.data.length }));
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.from('active_sessions').update({ is_active: false }).eq('id', sessionId);
      if (error) throw error;
      toast({ title: "Sessão encerrada", description: "A sessão foi encerrada com sucesso." });
      fetchUserData();
    } catch (error) {
      console.error('Error terminating session:', error);
      toast({ title: "Erro", description: "Não foi possível encerrar a sessão.", variant: "destructive" });
    }
  };

  const handleTerminateAllSessions = async () => {
    try {
      const { error } = await supabase.from('active_sessions').update({ is_active: false }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: "Sessões encerradas", description: "Todas as sessões do usuário foram encerradas." });
      fetchUserData();
    } catch (error) {
      console.error('Error terminating sessions:', error);
      toast({ title: "Erro", description: "Não foi possível encerrar as sessões.", variant: "destructive" });
    }
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Laptop className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trial': return <Badge className="bg-cyan-600 text-white border-0">Teste Grátis</Badge>;
      case 'paid': return <Badge className="bg-emerald-600 text-white border-0">Assinatura Ativa</Badge>;
      case 'expired': return <Badge className="bg-red-600 text-white border-0">Expirado</Badge>;
      default: return <Badge className="bg-gray-600 text-white border-0">Inativo</Badge>;
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-[hsl(220,13%,13%)] border-[hsl(220,13%,26%)] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-[hsl(220,13%,26%)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[hsl(220,13%,22%)] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-white">
                {user.name || 'Usuário sem nome'}
                {getStatusBadge(user.subscription_status)}
                {user.status === 'admin' && (
                  <Badge className="bg-amber-500 text-white border-0">Admin</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white hover:bg-[hsl(220,13%,22%)]">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-8 bg-[hsl(220,13%,18%)] border border-[hsl(220,13%,26%)] rounded-lg p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <CreditCard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <ShoppingCart className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <Package className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Materiais</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="logins" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <History className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logins</span>
            </TabsTrigger>
            <TabsTrigger value="ips" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <Globe className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">IPs</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-gray-400">
              <Monitor className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sessões</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4 pr-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-400">Vendas</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.totalSales)}</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-400">Compras</p>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(stats.totalPurchases)}</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-400">Pedidos</p>
                  <p className="text-lg font-bold text-white">{stats.totalOrders}</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-400">Materiais</p>
                  <p className="text-lg font-bold text-white">{stats.totalMaterials}</p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardContent className="p-3">
                  <p className="text-xs text-gray-400">Clientes</p>
                  <p className="text-lg font-bold text-white">{stats.totalCustomers}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tab: Informações */}
            <TabsContent value="info" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-white">
                      <User className="h-4 w-4 text-emerald-400" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Nome</span>
                      <span className="font-medium text-white">{user.name || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Email</span>
                      <span className="font-medium text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">WhatsApp</span>
                      <span className="font-medium text-white">{user.whatsapp || 'Não informado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Empresa</span>
                      <span className="font-medium text-white">{user.company || 'Não informado'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-white">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      Atividade
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Cadastro</span>
                      <span className="font-medium text-white">
                        {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Último Login</span>
                      <span className="font-medium text-white">
                        {user.last_login_at 
                          ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })
                          : 'Nunca'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Status da Conta</span>
                      <Badge className={user.is_active ? "bg-emerald-600 text-white border-0" : "bg-red-600 text-white border-0"}>
                        {user.is_active ? 'Ativa' : 'Desativada'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Tipo</span>
                      <Badge className={user.status === 'admin' ? "bg-amber-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                        {user.status === 'admin' ? 'Administrador' : 'Usuário'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Assinatura */}
            <TabsContent value="subscription" className="space-y-4 mt-0">
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Plano</span>
                    <span className="font-medium text-white">{user.plan_display_name || 'Sem plano'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Status</span>
                    {getStatusBadge(user.subscription_status)}
                  </div>
                  {user.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Expira em</span>
                      <span className="font-medium text-white">
                        {format(new Date(user.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                        {user.remaining_days !== null && user.remaining_days > 0 && (
                          <span className="text-gray-400 ml-2">({user.remaining_days} dias)</span>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <History className="h-4 w-4 text-emerald-400" />
                    Histórico de Assinaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionHistory.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhuma assinatura encontrada</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">Plano</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Ativação</TableHead>
                          <TableHead className="text-gray-400">Expiração</TableHead>
                          <TableHead className="text-gray-400">Método</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptionHistory.map((sub) => (
                          <TableRow key={sub.id} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                            <TableCell className="text-white">{getPlanTypeName(sub.plan_type)}</TableCell>
                            <TableCell>
                              <Badge className={sub.is_active ? "bg-emerald-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                                {sub.is_active ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">{format(new Date(sub.activated_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell className="text-white">{format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell className="capitalize text-white">{sub.activation_method || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Pedidos */}
            <TabsContent value="orders" className="space-y-4 mt-0">
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    Últimos Pedidos ({orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido encontrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">Data</TableHead>
                          <TableHead className="text-gray-400">Tipo</TableHead>
                          <TableHead className="text-gray-400">Cliente</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.slice(0, 20).map((order) => {
                          const customer = customers.find(c => c.id === order.customer_id);
                          return (
                            <TableRow key={order.id} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                              <TableCell className="text-white text-sm">{format(new Date(order.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                              <TableCell>
                                <Badge className={order.type === 'venda' ? "bg-emerald-600 text-white border-0" : "bg-amber-600 text-white border-0"}>
                                  {order.type === 'venda' ? 'Venda' : 'Compra'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white">{customer?.name || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge className={order.status === 'completed' ? "bg-emerald-600 text-white border-0" : "bg-gray-600 text-white border-0"}>
                                  {order.status === 'completed' ? 'Concluído' : order.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-medium text-white">{formatCurrency(order.total || 0)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Materiais */}
            <TabsContent value="materials" className="space-y-4 mt-0">
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Package className="h-4 w-4 text-emerald-400" />
                    Materiais Cadastrados ({materials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {materials.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum material cadastrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">Nome</TableHead>
                          <TableHead className="text-gray-400">Unidade</TableHead>
                          <TableHead className="text-gray-400 text-right">Preço Compra</TableHead>
                          <TableHead className="text-gray-400 text-right">Preço Venda</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material) => (
                          <TableRow key={material.id} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                            <TableCell className="text-white font-medium">{material.name}</TableCell>
                            <TableCell className="text-white">{material.unit || 'kg'}</TableCell>
                            <TableCell className="text-right text-amber-400">{formatCurrency(material.price || 0)}</TableCell>
                            <TableCell className="text-right text-emerald-400">{formatCurrency(material.sale_price || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Clientes */}
            <TabsContent value="customers" className="space-y-4 mt-0">
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Clientes Cadastrados ({customers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customers.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum cliente cadastrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">Nome</TableHead>
                          <TableHead className="text-gray-400">Cadastrado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                            <TableCell className="text-white font-medium">{customer.name}</TableCell>
                            <TableCell className="text-white">{format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
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
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <LogIn className="h-4 w-4 text-emerald-400" />
                    Últimos 50 Logins
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={fetchUserData} disabled={loading} className="border-[hsl(220,13%,26%)] text-white hover:bg-[hsl(220,13%,22%)]">
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </CardHeader>
                <CardContent>
                  {accessLogs.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum log de acesso encontrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">Data</TableHead>
                          <TableHead className="text-gray-400">Ação</TableHead>
                          <TableHead className="text-gray-400">IP</TableHead>
                          <TableHead className="text-gray-400">Dispositivo</TableHead>
                          <TableHead className="text-gray-400">Local</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accessLogs.map((log) => (
                          <TableRow key={log.id} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                            <TableCell className="text-sm text-white">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</TableCell>
                            <TableCell className="capitalize text-white">{log.action}</TableCell>
                            <TableCell className="font-mono text-xs text-white">{log.ip_address}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-white">
                                {getDeviceIcon(log.device_type)}
                                <span className="text-sm">{log.browser || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-white">{log.city && log.country ? `${log.city}, ${log.country}` : 'Desconhecido'}</TableCell>
                            <TableCell>
                              {log.success ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
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
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    IPs Únicos ({uniqueIPs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {uniqueIPs.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhum IP registrado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[hsl(220,13%,26%)] hover:bg-transparent">
                          <TableHead className="text-gray-400">IP</TableHead>
                          <TableHead className="text-gray-400">Localização</TableHead>
                          <TableHead className="text-gray-400">Último Uso</TableHead>
                          <TableHead className="text-gray-400">Acessos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueIPs.map((ip, index) => (
                          <TableRow key={index} className="border-[hsl(220,13%,26%)] hover:bg-[hsl(220,13%,22%)]">
                            <TableCell className="font-mono text-white">{ip.ip}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-white">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                {ip.city}, {ip.country}
                              </div>
                            </TableCell>
                            <TableCell className="text-white">{formatDistanceToNow(new Date(ip.lastUsed), { addSuffix: true, locale: ptBR })}</TableCell>
                            <TableCell><Badge className="bg-gray-600 text-white border-0">{ip.count}x</Badge></TableCell>
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
              <Card className="bg-[hsl(220,13%,18%)] border-[hsl(220,13%,26%)]">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Monitor className="h-4 w-4 text-emerald-400" />
                    Sessões Ativas ({activeSessions.length})
                  </CardTitle>
                  {activeSessions.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleTerminateAllSessions} className="bg-red-600 hover:bg-red-700">
                      <Power className="h-4 w-4 mr-2" />
                      Encerrar Todas
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {activeSessions.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhuma sessão ativa</p>
                  ) : (
                    <div className="space-y-3">
                      {activeSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-[hsl(220,13%,22%)] rounded-lg border border-[hsl(220,13%,26%)]">
                          <div className="flex items-center gap-4">
                            <div className="text-emerald-400">{getDeviceIcon(session.device_type)}</div>
                            <div>
                              <p className="font-medium text-white">{session.browser} em {session.os}</p>
                              <p className="text-sm text-gray-400">{session.ip_address} • {session.city}, {session.country}</p>
                              <p className="text-xs text-gray-500">Ativo {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: ptBR })}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleTerminateSession(session.id)} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
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