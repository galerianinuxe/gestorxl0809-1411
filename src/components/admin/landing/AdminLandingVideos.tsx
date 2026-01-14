import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2, Play } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminLandingVideos() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<VideoItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-landing-videos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('landing_videos').select('*').order('display_order');
      if (error) throw error;
      return data as VideoItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<VideoItem>) => {
      if (item.id) {
        const { error } = await supabase.from('landing_videos').update(item).eq('id', item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('landing_videos').insert({ title: item.title, description: item.description, video_url: item.video_url, thumbnail_url: item.thumbnail_url, duration: item.duration, is_active: item.is_active, display_order: items.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-videos'] });
      queryClient.invalidateQueries({ queryKey: ['landing-videos'] });
      toast.success('Salvo!');
      setEditingItem(null);
    },
    onError: () => toast.error('Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('landing_videos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-landing-videos'] });
      queryClient.invalidateQueries({ queryKey: ['landing-videos'] });
      toast.success('Removido!');
    },
  });

  const handleNew = () => {
    setEditingItem({ id: '', title: '', description: null, video_url: '', thumbnail_url: null, duration: null, is_active: true, display_order: items.length + 1 });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Vídeos Demonstrativos</h3>
        <Button onClick={handleNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-2" /> Adicionar</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className={`bg-slate-800 border-slate-700 ${!item.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="aspect-video bg-slate-700 rounded-lg mb-3 flex items-center justify-center">
                <Play className="w-12 h-12 text-slate-500" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white truncate">{item.title}</h4>
                <Switch checked={item.is_active} onCheckedChange={() => saveMutation.mutate({ id: item.id, is_active: !item.is_active })} />
              </div>
              {item.duration && <p className="text-xs text-slate-400 mb-2">{item.duration}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>Editar</Button>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <Card className="bg-slate-800 border-emerald-500">
          <CardHeader><CardTitle className="text-white">{editingItem.id ? 'Editar' : 'Novo'} Vídeo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Título</label>
                <Input value={editingItem.title} onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)} placeholder="Como Pesar Materiais" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Duração (opcional)</label>
                <Input value={editingItem.duration || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, duration: e.target.value } : null)} placeholder="2:30" className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL do Vídeo (YouTube ou Vimeo)</label>
              <Input value={editingItem.video_url} onChange={(e) => setEditingItem(prev => prev ? { ...prev, video_url: e.target.value } : null)} placeholder="https://youtube.com/watch?v=..." className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Descrição (opcional)</label>
              <Textarea value={editingItem.description || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" rows={2} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">URL da Thumbnail (opcional)</label>
              <Input value={editingItem.thumbnail_url || ''} onChange={(e) => setEditingItem(prev => prev ? { ...prev, thumbnail_url: e.target.value } : null)} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate(editingItem)} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
