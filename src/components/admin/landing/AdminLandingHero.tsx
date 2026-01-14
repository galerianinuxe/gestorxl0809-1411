import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2, Users, Star, Shield } from 'lucide-react';

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
