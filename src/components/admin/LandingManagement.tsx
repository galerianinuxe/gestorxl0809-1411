import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Edit3, 
  Save, 
  Eye, 
  Image, 
  Type, 
  Palette, 
  Globe,
  Phone,
  Mail,
  FileText,
  Search,
  ExternalLink,
  Upload,
  X,
  Star,
  Plus,
  Trash2,
  User,
  Video
} from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  location: string;
  rating: number;
  text: string;
  revenue: string;
  icon: string;
  profileImage?: string;
}

interface LandingSettings {
  id?: string;
  user_id: string;
  hero_badge_text: string;
  hero_main_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_button_text: string;
  logo_url: string;
  background_image_url: string;
  company_name: string;
  company_phone: string;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  testimonials?: string | Testimonial[];
  video_enabled?: boolean;
  video_title?: string;
  video_subtitle?: string;
  video_url?: string;
  video_poster_url?: string;
  video_bullets?: string;
}

const LandingManagement: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<LandingSettings>({
    user_id: user?.id || '',
    hero_badge_text: '🔥 REVOLUÇÃO NO SEU FERRO VELHO',
    hero_main_title: 'Chega de Papel, Caneta e Calculadora!',
    hero_subtitle: 'Saia da bolha e use a tecnologia a seu favor,',
    hero_description: 'ganhe tempo na balança e aumente seus lucros em até 300%.',
    hero_button_text: 'TESTAR GRÁTIS 7 DIAS',
    logo_url: '/lovable-uploads/4cc4e180-67e9-45c2-b2df-4256b1effba9.png',
    background_image_url: '/lovable-uploads/7e573df6-43ec-4eac-a025-777ac1ecdd0f.png',
    company_name: 'AIRK Soluções Digitais',
    company_phone: '(11) 96351-2105',
    footer_text: '© 2024 AIRK Soluções Digitais. Todos os direitos reservados.',
    seo_title: 'Sistema PDV para Ferro Velho - AIRK Soluções',
    seo_description: 'Sistema completo de gestão para ferro velho e depósitos de reciclagem',
    seo_keywords: 'sistema pdv, ferro velho, reciclagem, gestão',
    testimonials: [
      {
        id: '1',
        name: 'Gabriel Celestino',
        company: 'JMT Sucata',
        location: 'São Bernardo do Campo - SP',
        rating: 5,
        text: 'Cara, triplicou minha produtividade! O que levava 15 minutos agora levo 5. Fila acabou!',
        revenue: '+R$ 8.000/mês',
        icon: 'Rocket',
        profileImage: '/lovable-uploads/1af37044-78da-4b18-8466-6293327acf0d.png'
      },
      {
        id: '2',
        name: 'Felipe Nunes',
        company: 'BH Sucatas',
        location: 'Guarulhos - SP',
        rating: 5,
        text: 'Acabaram os erros de conta e as brigas com cliente. Sistema perfeito, recomendo!',
        revenue: '+R$ 12.000/mês',
        icon: 'Award',
        profileImage: '/lovable-uploads/a78d66b6-8157-4447-bf53-0cb7059cd522.png'
      },
      {
        id: '3',
        name: 'Hélio Machado',
        company: 'HJM Recicla',
        location: 'Três Corações - MG',
        rating: 5,
        text: 'Paguei o sistema em 1 mês só com o que parei de perder. Melhor investimento da vida!',
        revenue: '+R$ 15.000/mês',
        icon: 'TrendingUp',
        profileImage: '/lovable-uploads/f87ec770-b866-4d36-9776-78aea3d79c36.png'
      },
      {
        id: '4',
        name: 'Roberto Fernandes',
        company: 'Ferro & Aço Nordeste',
        location: 'Fortaleza - CE',
        rating: 5,
        text: 'Sistema revolucionou meu negócio! Agora controlo tudo pelo celular e o lucro aumentou muito.',
        revenue: '+R$ 10.500/mês',
        icon: 'Star',
        profileImage: '/lovable-uploads/8e5a9dbe-dc8a-4bd7-97db-71cd4208e0df.png'
      },
      {
        id: '5',
        name: 'Marcos Pereira',
        company: 'Recicla Sul',
        location: 'Curitiba - PR',
        rating: 5,
        text: 'Antes perdia muito tempo com papelada. Hoje em dia é só pesar, apertar botão e pronto! Fantástico!',
        revenue: '+R$ 9.200/mês',
        icon: 'Award',
        profileImage: '/lovable-uploads/26493bd1-904d-490c-bf16-47e7fdddaa15.png'
      },
      {
        id: '6',
        name: 'Eduardo Costa',
        company: 'Metais do Centro-Oeste',
        location: 'Campo Grande - MS',
        rating: 5,
        text: 'Meus clientes adoraram a agilidade no atendimento. Recomendo demais, vale cada centavo!',
        revenue: '+R$ 13.800/mês',
        icon: 'TrendingUp',
        profileImage: '/lovable-uploads/058597f6-445c-43fa-a3f6-473d9ed233f1.png'
      }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Carregando configurações para o usuário:', user.id);
      
      // Buscar a configuração mais recente
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar configurações da landing page",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        console.log('Configurações carregadas:', data);
        // Parse testimonials if they exist
        let parsedTestimonials = settings.testimonials;
        if (data.testimonials) {
          try {
            parsedTestimonials = typeof data.testimonials === 'string' 
              ? JSON.parse(data.testimonials) 
              : data.testimonials;
          } catch (parseError) {
            console.error('Erro ao fazer parse dos depoimentos:', parseError);
          }
        }
        
        setSettings({
          ...data,
          testimonials: parsedTestimonials
        });
      } else {
        console.log('Nenhuma configuração encontrada, usando padrões');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const showModal = (success: boolean, message: string) => {
    setModalMessage(message);
    if (success) {
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 1500);
    } else {
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 1500);
    }
  };

  const uploadImage = async (file: File, type: 'logo' | 'background') => {
    if (!user) {
      showModal(false, 'Usuário não autenticado');
      return;
    }

    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingBackground;
    setUploading(true);

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        showModal(false, 'Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        showModal(false, 'A imagem deve ter no máximo 5MB');
        return;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;

      console.log('Fazendo upload da imagem:', fileName);

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('landing-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        showModal(false, 'Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('landing-images')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;
      console.log('URL da imagem:', imageUrl);

      // Atualizar o estado local
      const fieldName = type === 'logo' ? 'logo_url' : 'background_image_url';
      setSettings(prev => ({
        ...prev,
        [fieldName]: imageUrl
      }));

      showModal(true, `${type === 'logo' ? 'Logo' : 'Imagem de fundo'} carregada com sucesso!`);

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showModal(false, 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file, type);
    }
  };

  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string | number) => {
    const testimonials = Array.isArray(settings.testimonials) 
      ? settings.testimonials 
      : [];
    
    setSettings(prev => ({
      ...prev,
      testimonials: testimonials.map((testimonial, i) => 
        i === index ? { ...testimonial, [field]: value } : testimonial
      )
    }));
  };

  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: '',
      company: '',
      location: '',
      rating: 5,
      text: '',
      revenue: '',
      icon: 'Star',
      profileImage: ''
    };
    
    const currentTestimonials = Array.isArray(settings.testimonials) 
      ? settings.testimonials 
      : [];
    
    setSettings(prev => ({
      ...prev,
      testimonials: [...currentTestimonials, newTestimonial]
    }));
  };

  const removeTestimonial = (index: number) => {
    const testimonials = Array.isArray(settings.testimonials) 
      ? settings.testimonials 
      : [];
    
    setSettings(prev => ({
      ...prev,
      testimonials: testimonials.filter((_, i) => i !== index)
    }));
  };

  const handleProfileImageUpload = async (file: File, testimonialIndex: number) => {
    if (!user) {
      showModal(false, 'Usuário não autenticado');
      return;
    }

    try {
      // Validar arquivo
      if (!file.type.startsWith('image/')) {
        showModal(false, 'Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        showModal(false, 'A imagem deve ter no máximo 2MB');
        return;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `testimonial_${testimonialIndex}_${user.id}_${Date.now()}.${fileExt}`;

      console.log('Fazendo upload da foto de perfil:', fileName);

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('landing-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        showModal(false, 'Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública da imagem
      const { data: publicUrlData } = supabase.storage
        .from('landing-images')
        .getPublicUrl(fileName);

      const imageUrl = publicUrlData.publicUrl;
      console.log('URL da imagem de perfil:', imageUrl);

      // Atualizar o estado local
      handleTestimonialChange(testimonialIndex, 'profileImage', imageUrl);

      showModal(true, 'Foto de perfil carregada com sucesso!');

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showModal(false, 'Erro ao fazer upload da imagem');
    }
  };

  const saveSettings = async () => {
    if (!user) {
      showModal(false, 'Usuário não autenticado');
      return;
    }

    setSaving(true);
    try {
      console.log('Salvando configurações:', settings);
      
      const testimonials = Array.isArray(settings.testimonials) 
        ? settings.testimonials 
        : [];
      
      const settingsData = {
        ...settings,
        user_id: user.id,
        testimonials: JSON.stringify(testimonials)
      };

      if (settings.id) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('landing_page_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) {
          console.error('Erro ao atualizar:', error);
          throw error;
        }
        
        console.log('Configurações atualizadas com sucesso!');
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('landing_page_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir:', error);
          throw error;
        }
        
        setSettings({ 
          ...data, 
          testimonials: JSON.parse(data.testimonials || '[]') 
        });
        console.log('Configurações criadas com sucesso:', data);
      }

      showModal(true, 'Configurações salvas com sucesso! As alterações já estão ativas na landing page principal.');

      // Disparar evento personalizado para notificar outras páginas sobre a atualização
      window.dispatchEvent(new CustomEvent('landingConfigUpdated', { 
        detail: settingsData 
      }));

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      showModal(false, 'Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof LandingSettings, value: string) => {
    console.log(`Alterando ${field}:`, value);
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreview = () => {
    // Abrir em nova aba a landing page para ver as alterações
    window.open('/', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <span className="ml-2 text-white">Carregando configurações...</span>
      </div>
    );
  }

  const testimonials = Array.isArray(settings.testimonials) 
    ? settings.testimonials 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuração da Landing Page</h1>
          <p className="text-gray-400">Personalize a página inicial do seu sistema</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePreview}
            className="border-gray-600 text-gray-300 hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm flex items-center">
          <Globe className="h-4 w-4 mr-2" />
          <strong>Dica:</strong> Após salvar, as alterações serão aplicadas automaticamente na landing page principal. 
          Use o botão "Visualizar" para ver as mudanças em tempo real.
        </p>
      </div>

      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 bg-gray-800 border-gray-700">
          <TabsTrigger value="hero" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Type className="h-4 w-4 mr-1" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="video" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Video className="h-4 w-4 mr-1" />
            Vídeo
          </TabsTrigger>
          <TabsTrigger value="branding" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Image className="h-4 w-4 mr-1" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Star className="h-4 w-4 mr-1" />
            Depoimentos
          </TabsTrigger>
          <TabsTrigger value="company" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Phone className="h-4 w-4 mr-1" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="footer" className="text-gray-300 data-[state=active]:text-white text-xs">
            <FileText className="h-4 w-4 mr-1" />
            Footer
          </TabsTrigger>
          <TabsTrigger value="seo" className="text-gray-300 data-[state=active]:text-white text-xs">
            <Search className="h-4 w-4 mr-1" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Type className="h-5 w-5" />
                Seção Principal (Hero)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_badge_text" className="text-gray-300">Texto do Badge</Label>
                <Input
                  id="hero_badge_text"
                  value={settings.hero_badge_text}
                  onChange={(e) => handleInputChange('hero_badge_text', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="🔥 REVOLUÇÃO NO SEU FERRO VELHO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_main_title" className="text-gray-300">Título Principal</Label>
                <Textarea
                  id="hero_main_title"
                  value={settings.hero_main_title}
                  onChange={(e) => handleInputChange('hero_main_title', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={3}
                  placeholder="Chega de Papel, Caneta e Calculadora!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle" className="text-gray-300">Subtítulo</Label>
                <Textarea
                  id="hero_subtitle"
                  value={settings.hero_subtitle}
                  onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={2}
                  placeholder="Saia da bolha e use a tecnologia a seu favor,"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_description" className="text-gray-300">Descrição</Label>
                <Textarea
                  id="hero_description"
                  value={settings.hero_description}
                  onChange={(e) => handleInputChange('hero_description', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={2}
                  placeholder="ganhe tempo na balança e aumente seus lucros em até 300%."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_button_text" className="text-gray-300">Texto do Botão</Label>
                <Input
                  id="hero_button_text"
                  value={settings.hero_button_text}
                  onChange={(e) => handleInputChange('hero_button_text', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="TESTAR GRÁTIS 7 DIAS"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                Seção de Vídeo Demonstrativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="video_enabled"
                  checked={settings.video_enabled || false}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_enabled: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <Label htmlFor="video_enabled" className="text-gray-300">Habilitar seção de vídeo na landing page</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_title" className="text-gray-300">Título da Seção</Label>
                <Input
                  id="video_title"
                  value={settings.video_title || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_title: e.target.value }))}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="Veja como funciona em 60 segundos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_subtitle" className="text-gray-300">Subtítulo (opcional)</Label>
                <Input
                  id="video_subtitle"
                  value={settings.video_subtitle || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_subtitle: e.target.value }))}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="Assista a uma demonstração rápida do sistema"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url" className="text-gray-300">URL do Vídeo (YouTube ou Vimeo)</Label>
                <Input
                  id="video_url"
                  value={settings.video_url || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_url: e.target.value }))}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-500">Cole a URL completa do YouTube ou Vimeo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_poster_url" className="text-gray-300">URL da Thumbnail (opcional)</Label>
                <Input
                  id="video_poster_url"
                  value={settings.video_poster_url || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, video_poster_url: e.target.value }))}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500">Se vazio, será usada a thumbnail do YouTube automaticamente</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_bullets" className="text-gray-300">Bullets (um por linha, máx 5)</Label>
                <Textarea
                  id="video_bullets"
                  value={(() => {
                    try {
                      const bullets = settings.video_bullets ? JSON.parse(settings.video_bullets) : [];
                      return bullets.join('\n');
                    } catch { return ''; }
                  })()}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').slice(0, 5);
                    setSettings(prev => ({ ...prev, video_bullets: JSON.stringify(lines) }));
                  }}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={5}
                  placeholder="Pesagem automática e precisa&#10;Controle total de materiais&#10;Relatórios financeiros"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Image className="h-5 w-5" />
                Marca e Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label htmlFor="logo_upload" className="text-gray-300 text-base font-medium">Logo da Empresa</Label>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        id="logo_upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <Button
                        onClick={() => document.getElementById('logo_upload')?.click()}
                        disabled={uploadingLogo}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingLogo ? 'Enviando...' : 'Fazer Upload do Logo'}
                      </Button>
                    </div>
                    
                    <span className="text-sm text-gray-400">
                      Formatos: JPG, PNG, WebP | Máximo: 5MB
                    </span>
                  </div>

                  {/* Logo Preview */}
                  {settings.logo_url && (
                    <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
                      <img 
                        src={settings.logo_url} 
                        alt="Logo preview" 
                        className="max-h-20 max-w-40 object-contain rounded border border-gray-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-2">URL atual:</p>
                        <Input
                          value={settings.logo_url}
                          onChange={(e) => handleInputChange('logo_url', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white text-sm"
                          placeholder="URL do logo"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Image Upload Section */}
              <div className="space-y-4">
                <Label htmlFor="background_upload" className="text-gray-300 text-base font-medium">Imagem de Fundo</Label>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        id="background_upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'background')}
                        className="hidden"
                        disabled={uploadingBackground}
                      />
                      <Button
                        onClick={() => document.getElementById('background_upload')?.click()}
                        disabled={uploadingBackground}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingBackground ? 'Enviando...' : 'Fazer Upload da Imagem'}
                      </Button>
                    </div>
                    
                    <span className="text-sm text-gray-400">
                      Formatos: JPG, PNG, WebP | Máximo: 5MB
                    </span>
                  </div>

                  {/* Background Preview */}
                  {settings.background_image_url && (
                    <div className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-600">
                      <img 
                        src={settings.background_image_url} 
                        alt="Background preview" 
                        className="max-h-32 max-w-48 object-cover rounded border border-gray-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-300 mb-2">URL atual:</p>
                        <Input
                          value={settings.background_image_url}
                          onChange={(e) => handleInputChange('background_image_url', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white text-sm"
                          placeholder="URL da imagem de fundo"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Depoimentos de Clientes
                </div>
                <Button
                  onClick={addTestimonial}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Depoimento
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {testimonials.map((testimonial, index) => (
                <Card key={testimonial.id} className="bg-gray-900 border-gray-600">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-gray-300">
                        Depoimento #{index + 1}
                      </Badge>
                      <Button
                        onClick={() => removeTestimonial(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Foto de Perfil */}
                    <div className="space-y-2">
                      <Label className="text-gray-300">Foto de Perfil do Cliente</Label>
                      <div className="flex items-center gap-4">
                        {testimonial.profileImage && (
                          <img 
                            src={testimonial.profileImage} 
                            alt={`Foto de ${testimonial.name}`}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
                          />
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleProfileImageUpload(file, index);
                              }
                            }}
                            className="hidden"
                            id={`profile-upload-${index}`}
                          />
                          <Button
                            onClick={() => document.getElementById(`profile-upload-${index}`)?.click()}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {testimonial.profileImage ? 'Alterar Foto' : 'Adicionar Foto'}
                          </Button>
                          {testimonial.profileImage && (
                            <Button
                              onClick={() => handleTestimonialChange(index, 'profileImage', '')}
                              variant="outline"
                              size="sm"
                              className="ml-2 border-red-600 text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Formatos: JPG, PNG, WebP | Máximo: 2MB | Recomendado: foto quadrada
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Nome do Cliente</Label>
                        <Input
                          value={testimonial.name}
                          onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Empresa</Label>
                        <Input
                          value={testimonial.company}
                          onChange={(e) => handleTestimonialChange(index, 'company', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Ex: Ferro Velho Recanto"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Localização</Label>
                        <Input
                          value={testimonial.location}
                          onChange={(e) => handleTestimonialChange(index, 'location', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Ex: São Paulo - SP"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Aumento de Receita</Label>
                        <Input
                          value={testimonial.revenue}
                          onChange={(e) => handleTestimonialChange(index, 'revenue', e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Ex: +R$ 8.000/mês"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Avaliação (1-5 estrelas)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={testimonial.rating}
                          onChange={(e) => handleTestimonialChange(index, 'rating', parseInt(e.target.value))}
                          className="bg-gray-800 border-gray-600 text-white w-20"
                        />
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-5 w-5 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Depoimento</Label>
                      <Textarea
                        value={testimonial.text}
                        onChange={(e) => handleTestimonialChange(index, 'text', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        rows={3}
                        placeholder="Digite o depoimento do cliente..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Ícone (Nome do ícone Lucide)</Label>
                      <Input
                        value={testimonial.icon}
                        onChange={(e) => handleTestimonialChange(index, 'icon', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        placeholder="Ex: Rocket, Award, TrendingUp, Star"
                      />
                      <p className="text-xs text-gray-500">
                        Ícones disponíveis: Rocket, Award, TrendingUp, Star, User, Target, etc.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {testimonials.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum depoimento cadastrado</p>
                  <p className="text-gray-500 text-sm">Clique em "Adicionar Depoimento" para começar</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-gray-300">Nome da Empresa</Label>
                <Input
                  id="company_name"
                  value={settings.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="AIRK Soluções Digitais"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_phone" className="text-gray-300">Telefone da Empresa</Label>
                <Input
                  id="company_phone"
                  value={settings.company_phone}
                  onChange={(e) => handleInputChange('company_phone', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="(11) 96351-2105"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rodapé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footer_text" className="text-gray-300">Texto do Footer</Label>
                <Textarea
                  id="footer_text"
                  value={settings.footer_text}
                  onChange={(e) => handleInputChange('footer_text', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={3}
                  placeholder="© 2024 AIRK Soluções Digitais. Todos os direitos reservados."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Configurações SEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title" className="text-gray-300">Título SEO</Label>
                <Input
                  id="seo_title"
                  value={settings.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="Sistema PDV para Ferro Velho - AIRK Soluções"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_description" className="text-gray-300">Descrição SEO</Label>
                <Textarea
                  id="seo_description"
                  value={settings.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  rows={3}
                  placeholder="Sistema completo de gestão para ferro velho e depósitos de reciclagem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo_keywords" className="text-gray-300">Palavras-chave SEO</Label>
                <Input
                  id="seo_keywords"
                  value={settings.seo_keywords}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                  className="bg-gray-900 border-gray-600 text-white"
                  placeholder="sistema pdv, ferro velho, reciclagem, gestão"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="border-green-500">
          <DialogHeader>
            <DialogTitle>✅ Sucesso!</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="border-red-500">
          <DialogHeader>
            <DialogTitle>❌ Erro!</DialogTitle>
            <DialogDescription>{modalMessage}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingManagement;
