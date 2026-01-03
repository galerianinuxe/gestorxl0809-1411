import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, Plus, Edit, Trash2, Search, Eye, FolderOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  status: 'draft' | 'published';
  category_id: string | null;
  module: string | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number | null;
  created_at: string;
}

interface HelpCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  module: string | null;
}

type SystemModule = 'assinatura' | 'caixa' | 'compra' | 'despesas' | 'estoque' | 'geral' | 'relatorios' | 'transacoes' | 'venda';

const MODULES: { value: SystemModule; label: string }[] = [
  { value: 'venda', label: 'PDV / Vendas' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'compra', label: 'Compras' },
  { value: 'despesas', label: 'Despesas' },
  { value: 'relatorios', label: 'Relatórios' },
  { value: 'transacoes', label: 'Transações' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'geral', label: 'Geral' }
];

export const HelpArticlesManagement = () => {
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingArticle, setEditingArticle] = useState<HelpArticle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_md: '',
    status: 'draft' as 'draft' | 'published',
    category_id: '',
    module: '' as SystemModule | '',
    seo_title: '',
    seo_description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        supabase.from('help_articles').select('*').order('created_at', { ascending: false }),
        supabase.from('help_categories').select('*').order('sort_order', { ascending: true })
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const typedArticles = (articlesRes.data || []).map(a => ({
        ...a,
        status: (a.status === 'draft' || a.status === 'published') ? a.status : 'draft'
      })) as HelpArticle[];

      setArticles(typedArticles);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const handleSave = async () => {
    try {
      const data = {
        title: form.title,
        slug: form.slug || generateSlug(form.title),
        excerpt: form.excerpt || null,
        content_md: form.content_md || null,
        status: form.status,
        category_id: form.category_id || null,
        module: (form.module || null) as SystemModule | null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        reading_time_minutes: Math.ceil((form.content_md?.split(' ').length || 0) / 200)
      };

      if (editingArticle) {
        const { error } = await supabase.from('help_articles').update(data).eq('id', editingArticle.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Artigo atualizado" });
      } else {
        const { error } = await supabase.from('help_articles').insert([data]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Artigo criado" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro:', error);
      toast({ title: "Erro", description: "Falha ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    try {
      const { error } = await supabase.from('help_articles').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Artigo excluído" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const editArticle = (article: HelpArticle) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content_md: article.content_md || '',
      status: article.status,
      category_id: article.category_id || '',
      module: (article.module || '') as SystemModule | '',
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingArticle(null);
    setForm({
      title: '', slug: '', excerpt: '', content_md: '', status: 'draft',
      category_id: '', module: '', seo_title: '', seo_description: ''
    });
  };

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || 'Sem categoria';
  const getModuleName = (value: string | null) => MODULES.find(m => m.value === value)?.label || value || 'N/A';

  if (loading) {
    return <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div></div>;
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Artigos de Ajuda ({articles.length})
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white w-48"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Artigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>{editingArticle ? 'Editar Artigo' : 'Novo Artigo'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Título *</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-gray-700 border-gray-600" />
                  </div>
                  <div>
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="bg-gray-700 border-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Módulo</Label>
                    <Select value={form.module} onValueChange={(v: SystemModule) => setForm({ ...form, module: v })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {MODULES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v: 'draft' | 'published') => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Resumo</Label>
                  <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} />
                </div>
                <div>
                  <Label>Conteúdo (Markdown)</Label>
                  <Textarea value={form.content_md} onChange={(e) => setForm({ ...form, content_md: e.target.value })} className="bg-gray-700 border-gray-600 font-mono text-sm" rows={10} />
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">SEO</h4>
                  <div className="grid gap-3">
                    <div><Label>Título SEO</Label><Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} className="bg-gray-700 border-gray-600" /></div>
                    <div><Label>Meta Descrição</Label><Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} className="bg-gray-700 border-gray-600" rows={2} /></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">{editingArticle ? 'Atualizar' : 'Criar'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredArticles.map(article => (
            <div key={article.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white">{article.title}</h4>
                  <Badge className={article.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}>
                    {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{getModuleName(article.module)}</span>
                  <span>•</span>
                  <span>{getCategoryName(article.category_id)}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.view_count || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => editArticle(article)} className="text-gray-400 hover:text-white"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {filteredArticles.length === 0 && <div className="text-center py-8 text-gray-400">Nenhum artigo encontrado</div>}
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpArticlesManagement;
