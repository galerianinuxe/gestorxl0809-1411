import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, Loader2, Users, Star, Shield, Image as ImageIcon, Monitor, Tablet, Smartphone } from 'lucide-react';
import { ImageUploader } from '@/components/ui/ImageUploader';

// Helper function to get preview size classes
const getPreviewSizeClasses = (size: string) => {
  switch (size) {
    case 'small': return 'max-w-[80px] max-h-[50px]';
    case 'medium': return 'max-w-[120px] max-h-[70px]';
    case 'large': return 'max-w-[160px] max-h-[100px]';
    case 'full': return 'max-w-[200px] max-h-[120px]';
    default: return 'max-w-[120px] max-h-[70px]';
  }
};

export function AdminLandingHero() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    id: '',
    hero_main_title: 'Pese, Calcule e Imprima em',
    hero_subtitle: 'Sem erro. Sem fila. Sem discussão.',
    hero_description: 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro.',
    hero_button_text: 'Começar Teste Grátis',
    hero_badge_text: '✨ 7 dias grátis • Sem cartão',
    hero_highlight_text: '3 Minutos',
    hero_secondary_button_text: 'Ver Como Funciona',
    hero_social_proof_users: '130+',
    hero_social_proof_users_label: 'depósitos ativos',
    hero_social_proof_rating: '4.9',
    hero_social_proof_rating_label: 'de satisfação',
    hero_security_label: 'Dados **100% seguros**',
    background_image_url: '',
    video_url: '',
    hero_image_url: '',
    hero_image_size_desktop: 'medium',
    hero_image_size_tablet: 'medium',
    hero_image_size_mobile: 'small',
    hero_image_alt: 'Imagem do Hero',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('landing_page_settings')
          .update({
            hero_main_title: settings.hero_main_title,
            hero_subtitle: settings.hero_subtitle,
            hero_description: settings.hero_description,
            hero_button_text: settings.hero_button_text,
            hero_badge_text: settings.hero_badge_text,
            hero_highlight_text: settings.hero_highlight_text,
            hero_secondary_button_text: settings.hero_secondary_button_text,
            hero_social_proof_users: settings.hero_social_proof_users,
            hero_social_proof_users_label: settings.hero_social_proof_users_label,
            hero_social_proof_rating: settings.hero_social_proof_rating,
            hero_social_proof_rating_label: settings.hero_social_proof_rating_label,
            hero_security_label: settings.hero_security_label,
            background_image_url: settings.background_image_url,
            video_url: settings.video_url,
            hero_image_url: settings.hero_image_url || null,
            hero_image_size_desktop: settings.hero_image_size_desktop,
            hero_image_size_tablet: settings.hero_image_size_tablet,
            hero_image_size_mobile: settings.hero_image_size_mobile,
            hero_image_alt: settings.hero_image_alt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('landing_page_settings')
          .insert({
            user_id: user.id,
            hero_main_title: settings.hero_main_title,
            hero_subtitle: settings.hero_subtitle,
            hero_description: settings.hero_description,
            hero_button_text: settings.hero_button_text,
            hero_badge_text: settings.hero_badge_text,
            hero_highlight_text: settings.hero_highlight_text,
            hero_secondary_button_text: settings.hero_secondary_button_text,
            hero_social_proof_users: settings.hero_social_proof_users,
            hero_social_proof_users_label: settings.hero_social_proof_users_label,
            hero_social_proof_rating: settings.hero_social_proof_rating,
            hero_social_proof_rating_label: settings.hero_social_proof_rating_label,
            hero_security_label: settings.hero_security_label,
            background_image_url: settings.background_image_url,
            video_url: settings.video_url,
            hero_image_url: settings.hero_image_url || null,
            hero_image_size_desktop: settings.hero_image_size_desktop,
            hero_image_size_tablet: settings.hero_image_size_tablet,
            hero_image_size_mobile: settings.hero_image_size_mobile,
            hero_image_alt: settings.hero_image_alt,
          });

        if (error) throw error;
      }

      toast.success('Hero salvo com sucesso!');
      window.dispatchEvent(new CustomEvent('landingConfigUpdated'));
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Hero Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Seção Hero - Textos Principais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Título Principal</label>
              <Input
                value={settings.hero_main_title}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_main_title: e.target.value }))}
                placeholder="Pese, Calcule e Imprima em"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Texto Destacado (em verde)</label>
              <Input
                value={settings.hero_highlight_text}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_highlight_text: e.target.value }))}
                placeholder="3 Minutos"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Subtítulo</label>
            <Input
              value={settings.hero_subtitle}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
              placeholder="Sem erro. Sem fila. Sem discussão."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300">Descrição</label>
            <Textarea
              value={settings.hero_description}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_description: e.target.value }))}
              placeholder="Sistema completo para depósitos..."
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Texto do Botão CTA</label>
              <Input
                value={settings.hero_button_text}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_button_text: e.target.value }))}
                placeholder="Começar Teste Grátis"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Botão Secundário</label>
              <Input
                value={settings.hero_secondary_button_text}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_secondary_button_text: e.target.value }))}
                placeholder="Ver Como Funciona"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Badge</label>
              <Input
                value={settings.hero_badge_text}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                placeholder="✨ 7 dias grátis • Sem cartão"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Image Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            Imagem do Hero
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Imagem (aparece acima do badge)</label>
            <ImageUploader 
              value={settings.hero_image_url || null}
              onChange={(url) => setSettings(prev => ({ ...prev, hero_image_url: url || '' }))}
              bucket="landing-images"
              folder="hero"
            />
          </div>

          {/* Alt Text */}
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Texto Alternativo (SEO/Acessibilidade)</label>
            <Input
              value={settings.hero_image_alt}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_image_alt: e.target.value }))}
              placeholder="Descrição da imagem"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Size Selectors */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Desktop */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Desktop
              </label>
              <Select 
                value={settings.hero_image_size_desktop} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, hero_image_size_desktop: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="small">Pequeno (200px)</SelectItem>
                  <SelectItem value="medium">Médio (350px)</SelectItem>
                  <SelectItem value="large">Grande (500px)</SelectItem>
                  <SelectItem value="full">Extra Grande (700px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Tablet */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <Tablet className="w-4 h-4" /> Tablet
              </label>
              <Select 
                value={settings.hero_image_size_tablet} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, hero_image_size_tablet: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="small">Pequeno (200px)</SelectItem>
                  <SelectItem value="medium">Médio (300px)</SelectItem>
                  <SelectItem value="large">Grande (400px)</SelectItem>
                  <SelectItem value="full">Extra Grande (500px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Mobile */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Mobile
              </label>
              <Select 
                value={settings.hero_image_size_mobile} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, hero_image_size_mobile: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="small">Pequeno (150px)</SelectItem>
                  <SelectItem value="medium">Médio (200px)</SelectItem>
                  <SelectItem value="large">Grande (250px)</SelectItem>
                  <SelectItem value="full">Extra Grande (300px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsive Preview */}
          {settings.hero_image_url && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Preview Responsivo:</p>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Desktop Preview */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> Desktop
                  </p>
                  <div className="flex justify-center items-center min-h-[80px]">
                    <img 
                      src={settings.hero_image_url} 
                      alt="Preview Desktop"
                      className={`object-contain ${getPreviewSizeClasses(settings.hero_image_size_desktop)}`}
                    />
                  </div>
                </div>
                
                {/* Tablet Preview */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Tablet className="w-3 h-3" /> Tablet
                  </p>
                  <div className="flex justify-center items-center min-h-[80px]">
                    <img 
                      src={settings.hero_image_url}
                      alt="Preview Tablet"
                      className={`object-contain ${getPreviewSizeClasses(settings.hero_image_size_tablet)}`}
                    />
                  </div>
                </div>
                
                {/* Mobile Preview */}
                <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Mobile
                  </p>
                  <div className="flex justify-center items-center min-h-[80px]">
                    <img 
                      src={settings.hero_image_url}
                      alt="Preview Mobile"
                      className={`object-contain ${getPreviewSizeClasses(settings.hero_image_size_mobile)}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Proof Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Social Proof (Prova Social)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Número de Usuários
              </label>
              <Input
                value={settings.hero_social_proof_users}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_social_proof_users: e.target.value }))}
                placeholder="130+"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Label dos Usuários</label>
              <Input
                value={settings.hero_social_proof_users_label}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_social_proof_users_label: e.target.value }))}
                placeholder="depósitos ativos"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Nota de Satisfação
              </label>
              <Input
                value={settings.hero_social_proof_rating}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_social_proof_rating: e.target.value }))}
                placeholder="4.9"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Label da Nota</label>
              <Input
                value={settings.hero_social_proof_rating_label}
                onChange={(e) => setSettings(prev => ({ ...prev, hero_social_proof_rating_label: e.target.value }))}
                placeholder="de satisfação"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Label de Segurança (use **texto** para negrito)
            </label>
            <Input
              value={settings.hero_security_label}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_security_label: e.target.value }))}
              placeholder="Dados **100% seguros**"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Preview */}
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-600">
            <p className="text-xs text-slate-500 mb-3">Preview:</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span><strong className="text-white">{settings.hero_social_proof_users}</strong> {settings.hero_social_proof_users_label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <span><strong className="text-white">{settings.hero_social_proof_rating}</strong> {settings.hero_social_proof_rating_label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span dangerouslySetInnerHTML={{ __html: settings.hero_security_label.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Mídia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL da Imagem de Fundo</label>
              <Input
                value={settings.background_image_url}
                onChange={(e) => setSettings(prev => ({ ...prev, background_image_url: e.target.value }))}
                placeholder="/lovable-uploads/..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL do Vídeo (opcional)</label>
              <Input
                value={settings.video_url || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, video_url: e.target.value }))}
                placeholder="https://youtube.com/..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Hero
        </Button>
      </div>
    </div>
  );
}
