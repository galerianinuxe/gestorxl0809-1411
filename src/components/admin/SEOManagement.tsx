import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Globe, 
  FileCode, 
  Image,
  Save,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_image: string;
  twitter_handle: string;
  favicon_url: string;
  robots_txt: string;
  sitemap_url: string;
  google_analytics_id: string;
  google_search_console_id: string;
}

export const SEOManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SEOSettings>({
    site_title: 'XLata - Sistema para Depósito de Reciclagem',
    site_description: 'Sistema completo de gestão para ferro velho e depósitos de reciclagem. Controle estoque, vendas e compras com facilidade.',
    site_keywords: 'sistema reciclagem, ferro velho, pdv reciclagem, gestão depósito, controle estoque reciclagem, software reciclagem',
    og_image: '/lovable-uploads/XLATALOGO.png',
    twitter_handle: '@xlatasite',
    favicon_url: '/favicon.ico',
    robots_txt: `User-agent: *
Allow: /

# Impede indexação de arquivos internos
Disallow: /src/
Disallow: /node_modules/
Disallow: /api/

# Sitemap
Sitemap: https://xlata.site/sitemap.xml`,
    sitemap_url: 'https://xlata.site/sitemap.xml',
    google_analytics_id: '',
    google_search_console_id: ''
  });

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.seo_config) {
        const seoConfig = typeof data.seo_config === 'string' 
          ? JSON.parse(data.seo_config) 
          : data.seo_config;
        setSettings(prev => ({ ...prev, ...seoConfig }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update({ seo_config: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([{ user_id: user.id, seo_config: JSON.parse(JSON.stringify(settings)) }]);
        if (error) throw error;
      }

      toast({ title: "Sucesso", description: "Configurações SEO salvas" });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({ title: "Erro", description: "Falha ao salvar configurações", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
  };

  const seoScore = () => {
    let score = 0;
    if (settings.site_title && settings.site_title.length >= 30 && settings.site_title.length <= 60) score += 20;
    if (settings.site_description && settings.site_description.length >= 120 && settings.site_description.length <= 160) score += 20;
    if (settings.site_keywords && settings.site_keywords.split(',').length >= 5) score += 15;
    if (settings.og_image) score += 15;
    if (settings.robots_txt) score += 15;
    if (settings.sitemap_url) score += 15;
    return score;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SEO Score Card */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Pontuação SEO</h3>
              <p className="text-gray-400 text-sm">Baseado nas configurações atuais</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${seoScore() >= 80 ? 'text-green-400' : seoScore() >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {seoScore()}%
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="meta" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Search className="h-4 w-4 mr-2" />
            Meta Tags
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <Globe className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="technical" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <FileCode className="h-4 w-4 mr-2" />
            Técnico
          </TabsTrigger>
        </TabsList>

        {/* Meta Tags Tab */}
        <TabsContent value="meta" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Meta Tags Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Título do Site</Label>
                  <Badge className={settings.site_title.length >= 30 && settings.site_title.length <= 60 ? 'bg-green-600' : 'bg-yellow-600'}>
                    {settings.site_title.length}/60 caracteres
                  </Badge>
                </div>
                <Input
                  value={settings.site_title}
                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Título do site para SEO"
                />
                <p className="text-xs text-gray-400 mt-1">Recomendado: 30-60 caracteres</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Meta Descrição</Label>
                  <Badge className={settings.site_description.length >= 120 && settings.site_description.length <= 160 ? 'bg-green-600' : 'bg-yellow-600'}>
                    {settings.site_description.length}/160 caracteres
                  </Badge>
                </div>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
                <p className="text-xs text-gray-400 mt-1">Recomendado: 120-160 caracteres</p>
              </div>

              <div>
                <Label>Palavras-chave</Label>
                <Textarea
                  value={settings.site_keywords}
                  onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="palavra1, palavra2, palavra3"
                  rows={2}
                />
                <p className="text-xs text-gray-400 mt-1">Separe as palavras-chave por vírgula. Recomendado: 5-10 palavras-chave</p>
              </div>

              {/* Preview */}
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                <p className="text-xs text-gray-400 mb-2">Prévia no Google:</p>
                <div className="space-y-1">
                  <p className="text-blue-400 text-lg hover:underline cursor-pointer">{settings.site_title || 'Título do Site'}</p>
                  <p className="text-green-500 text-sm">https://xlata.site</p>
                  <p className="text-gray-300 text-sm">{settings.site_description || 'Descrição do site aparecerá aqui...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Open Graph & Social
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Imagem OG (Open Graph)</Label>
                <Input
                  value={settings.og_image}
                  onChange={(e) => setSettings({ ...settings, og_image: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="URL da imagem para compartilhamento"
                />
                <p className="text-xs text-gray-400 mt-1">Tamanho recomendado: 1200x630 pixels</p>
                {settings.og_image && (
                  <div className="mt-2 border border-gray-600 rounded p-2">
                    <img src={settings.og_image} alt="OG Preview" className="max-h-32 object-cover rounded" />
                  </div>
                )}
              </div>

              <div>
                <Label>Twitter Handle</Label>
                <Input
                  value={settings.twitter_handle}
                  onChange={(e) => setSettings({ ...settings, twitter_handle: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="@seuhandle"
                />
              </div>

              <div>
                <Label>Favicon URL</Label>
                <Input
                  value={settings.favicon_url}
                  onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="/favicon.ico"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Tab */}
        <TabsContent value="technical" className="mt-4">
          <div className="grid gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  robots.txt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={settings.robots_txt}
                  onChange={(e) => setSettings({ ...settings, robots_txt: e.target.value })}
                  className="bg-gray-900 border-gray-600 text-green-400 font-mono text-sm"
                  rows={10}
                />
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(settings.robots_txt)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/robots.txt', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Atual
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sitemap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>URL do Sitemap</Label>
                  <Input
                    value={settings.sitemap_url}
                    onChange={(e) => setSettings({ ...settings, sitemap_url: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/sitemap.xml', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Sitemap
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Google Analytics ID</Label>
                  <Input
                    value={settings.google_analytics_id}
                    onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label>Google Search Console ID</Label>
                  <Input
                    value={settings.google_search_console_id}
                    onChange={(e) => setSettings({ ...settings, google_search_console_id: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Código de verificação"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SEOManagement;
