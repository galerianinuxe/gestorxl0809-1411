import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  FolderOpen,
  Tag,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string | null;
  status: 'draft' | 'published';
  category_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  reading_time_minutes: number | null;
  view_count: number | null;
  created_at: string;
  updated_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
}

export const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const [postForm, setPostForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content_md: '',
    status: 'draft' as 'draft' | 'published',
    category_id: '',
    seo_title: '',
    seo_description: '',
    og_image: '',
    tags: '',
    is_featured: false
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    sort_order: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('blog_categories').select('*').order('sort_order', { ascending: true })
      ]);

      if (postsRes.error) throw postsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const typedPosts = (postsRes.data || []).map(post => ({
        ...post,
        status: (post.status === 'draft' || post.status === 'published') ? post.status : 'draft'
      })) as BlogPost[];

      setPosts(typedPosts);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleSavePost = async () => {
    try {
      const postData = {
        title: postForm.title,
        slug: postForm.slug || generateSlug(postForm.title),
        excerpt: postForm.excerpt || null,
        content_md: postForm.content_md || null,
        status: postForm.status,
        category_id: postForm.category_id || null,
        seo_title: postForm.seo_title || null,
        seo_description: postForm.seo_description || null,
        og_image: postForm.og_image || null,
        tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()) : null,
        is_featured: postForm.is_featured,
        reading_time_minutes: Math.ceil((postForm.content_md?.split(' ').length || 0) / 200)
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Post atualizado" });
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Post criado" });
      }

      setIsPostDialogOpen(false);
      resetPostForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      toast({ title: "Erro", description: "Falha ao salvar post", variant: "destructive" });
    }
  };

  const handleSaveCategory = async () => {
    try {
      const categoryData = {
        name: categoryForm.name,
        slug: categoryForm.slug || generateSlug(categoryForm.name),
        description: categoryForm.description || null,
        icon: categoryForm.icon || null,
        sort_order: categoryForm.sort_order
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('blog_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria atualizada" });
      } else {
        const { error } = await supabase
          .from('blog_categories')
          .insert([categoryData]);
        if (error) throw error;
        toast({ title: "Sucesso", description: "Categoria criada" });
      }

      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({ title: "Erro", description: "Falha ao salvar categoria", variant: "destructive" });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Excluir este post?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Post excluído" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Categoria excluída" });
      loadData();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir", variant: "destructive" });
    }
  };

  const editPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content_md: post.content_md || '',
      status: post.status,
      category_id: post.category_id || '',
      seo_title: post.seo_title || '',
      seo_description: post.seo_description || '',
      og_image: post.og_image || '',
      tags: post.tags?.join(', ') || '',
      is_featured: post.is_featured || false
    });
    setIsPostDialogOpen(true);
  };

  const editCategory = (category: BlogCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      sort_order: category.sort_order || 0
    });
    setIsCategoryDialogOpen(true);
  };

  const resetPostForm = () => {
    setEditingPost(null);
    setPostForm({
      title: '', slug: '', excerpt: '', content_md: '', status: 'draft',
      category_id: '', seo_title: '', seo_description: '', og_image: '', tags: '', is_featured: false
    });
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', description: '', icon: '', sort_order: 0 });
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryName = (id: string | null) => {
    if (!id) return 'Sem categoria';
    return categories.find(c => c.id === id)?.name || 'Sem categoria';
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
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="posts" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            <FolderOpen className="h-4 w-4 mr-2" />
            Categorias ({categories.length})
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerenciar Posts
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-gray-700 border-gray-600 text-white w-64"
                  />
                </div>
                <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetPostForm} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle>{editingPost ? 'Editar Post' : 'Novo Post'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Título *</Label>
                          <Input
                            value={postForm.title}
                            onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                        <div>
                          <Label>Slug</Label>
                          <Input
                            value={postForm.slug}
                            onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                            placeholder="Gerado automaticamente"
                            className="bg-gray-700 border-gray-600"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Categoria</Label>
                          <Select
                            value={postForm.category_id}
                            onValueChange={(value) => setPostForm({ ...postForm, category_id: value })}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select
                            value={postForm.status}
                            onValueChange={(value: 'draft' | 'published') => setPostForm({ ...postForm, status: value })}
                          >
                            <SelectTrigger className="bg-gray-700 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-700 border-gray-600">
                              <SelectItem value="draft">Rascunho</SelectItem>
                              <SelectItem value="published">Publicado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Resumo</Label>
                        <Textarea
                          value={postForm.excerpt}
                          onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                          className="bg-gray-700 border-gray-600"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Conteúdo (Markdown)</Label>
                        <Textarea
                          value={postForm.content_md}
                          onChange={(e) => setPostForm({ ...postForm, content_md: e.target.value })}
                          className="bg-gray-700 border-gray-600 font-mono text-sm"
                          rows={10}
                        />
                      </div>

                      <div>
                        <Label>Tags (separadas por vírgula)</Label>
                        <Input
                          value={postForm.tags}
                          onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                          placeholder="reciclagem, dicas, sustentabilidade"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>

                      <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">SEO</h4>
                        <div className="grid gap-3">
                          <div>
                            <Label>Título SEO</Label>
                            <Input
                              value={postForm.seo_title}
                              onChange={(e) => setPostForm({ ...postForm, seo_title: e.target.value })}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label>Meta Descrição</Label>
                            <Textarea
                              value={postForm.seo_description}
                              onChange={(e) => setPostForm({ ...postForm, seo_description: e.target.value })}
                              className="bg-gray-700 border-gray-600"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label>Imagem OG</Label>
                            <Input
                              value={postForm.og_image}
                              onChange={(e) => setPostForm({ ...postForm, og_image: e.target.value })}
                              placeholder="URL da imagem"
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSavePost} className="bg-green-600 hover:bg-green-700">
                        {editingPost ? 'Atualizar' : 'Criar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{post.title}</h4>
                        <Badge className={post.status === 'published' ? 'bg-green-600' : 'bg-yellow-600'}>
                          {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                        {post.is_featured && <Badge className="bg-purple-600">Destaque</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3 w-3" />
                          {getCategoryName(post.category_id)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.view_count || 0} views
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        className="text-gray-400 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editPost(post)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum post encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Categorias
              </CardTitle>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetCategoryForm} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input
                        value={categoryForm.slug}
                        onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                        placeholder="Gerado automaticamente"
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        className="bg-gray-700 border-gray-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ícone (Lucide)</Label>
                        <Input
                          value={categoryForm.icon}
                          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                          placeholder="ex: Recycle"
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                      <div>
                        <Label>Ordem</Label>
                        <Input
                          type="number"
                          value={categoryForm.sort_order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                          className="bg-gray-700 border-gray-600"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700">
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{category.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => editCategory(category)}
                          className="h-8 w-8 text-gray-400 hover:text-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{category.description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Tag className="h-3 w-3" />
                      /{category.slug}
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    Nenhuma categoria encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogManagement;
