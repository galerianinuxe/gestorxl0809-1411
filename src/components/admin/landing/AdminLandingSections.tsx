import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, GripVertical, Eye, EyeOff } from 'lucide-react';

interface SectionItem {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  display_order: number;
}

const sectionIcons: Record<string, string> = {
  hero: '🎯',
  how_it_works: '⚙️',
  requirements: '✅',
  problems: '⚠️',
  kpis: '📈',
  videos: '🎬',
  testimonials: '💬',
  plans: '💳',
  faq: '❓',
  cta_final: '🚀',
};

export function AdminLandingSections() {
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['admin-landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_sections').select('*').order('display_order');
      if (error) throw error;
      return data as SectionItem[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from('landing_sections').update({ is_visible }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-sections'] });
      queryClient.invalidateQueries({ queryKey: ['landing-sections'] });
      toast.success('Visibilidade atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Controle de Seções</h3>
        <p className="text-slate-400 text-sm">Ative ou desative seções da landing page. A ordem é definida pelo display_order no banco.</p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <Card key={section.id} className={`bg-slate-800 border-slate-700 ${!section.is_visible ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-slate-500" />
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-2xl">
                {sectionIcons[section.section_key] || '📄'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white">{section.title}</h4>
                  <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{section.section_key}</span>
                </div>
                {section.subtitle && <p className="text-sm text-slate-400">{section.subtitle}</p>}
              </div>
              <div className="flex items-center gap-3">
                {section.is_visible ? (
                  <Eye className="w-5 h-5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-slate-500" />
                )}
                <Switch
                  checked={section.is_visible}
                  onCheckedChange={(checked) => toggleMutation.mutate({ id: section.id, is_visible: checked })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-slate-400 text-sm">
          💡 <strong>Dica:</strong> A seção "Hero" não pode ser desativada pois é essencial para a página.
          Para reordenar as seções, edite o campo <code className="bg-slate-700 px-1 rounded">display_order</code> no banco de dados.
        </p>
      </div>
    </div>
  );
}
