import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

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
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Seção Hero</CardTitle>
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
            <label className="text-sm text-slate-300">Subtítulo</label>
            <Input
              value={settings.hero_subtitle}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
              placeholder="Sem erro. Sem fila. Sem discussão."
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
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

        <div className="grid gap-4 md:grid-cols-2">
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
            <label className="text-sm text-slate-300">Badge (ex: ✨ 7 dias grátis)</label>
            <Input
              value={settings.hero_badge_text}
              onChange={(e) => setSettings(prev => ({ ...prev, hero_badge_text: e.target.value }))}
              placeholder="✨ 7 dias grátis • Sem cartão"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </div>

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

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Hero
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
