import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Clock, Users, Star, CheckCircle, BookOpen, Edit, Plus, Trash2, Settings, Cog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import VideoPlayerModal from '@/components/VideoPlayerModal';
import AdminVideoEditModal from '@/components/AdminVideoEditModal';
import GuidePageSettingsModal from '@/components/GuidePageSettingsModal';

interface GuideVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  category: string;
  difficulty: string;
  order_position: number;
  is_active: boolean;
  youtube_video_id?: string;
  cover_image_url?: string;
}

interface GuidePageSettings {
  id?: string;
  user_id: string;
  badge_text: string;
  main_title: string;
  subtitle: string;
  feature1_title: string;
  feature1_subtitle: string;
  feature2_title: string;
  feature2_subtitle: string;
  feature3_title: string;
  feature3_subtitle: string;
  cta_title: string;
  cta_subtitle: string;
  cta_button_text: string;
}

const GuiaCompleto: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<GuideVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<GuideVideo | null>(null);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isAdminEditOpen, setIsAdminEditOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<GuideVideo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pageSettings, setPageSettings] = useState<GuidePageSettings>({
    user_id: '',
    badge_text: 'GUIA COMPLETO EXCLUSIVO',
    main_title: 'Aprenda a Dominar o Sistema XLata',
    subtitle: 'Vídeos tutoriais exclusivos para você se tornar um expert no sistema',
    feature1_title: 'Vídeos Exclusivos',
    feature1_subtitle: 'Conteúdo completo e detalhado',
    feature2_title: 'Conteúdo Premium',
    feature2_subtitle: 'Aprenda no seu ritmo',
    feature3_title: 'Acesso ao Guia Vitalício',
    feature3_subtitle: 'Reveja quantas vezes quiser',
    cta_title: 'Pronto para Começar?',
    cta_subtitle: 'Acesse o sistema xlata completo e comece a transformar seu ferro velho hoje mesmo.',
    cta_button_text: 'ACESSAR SISTEMA COMPLETO'
  });

  useEffect(() => {
    checkAdminStatus();
    loadVideos();
    loadPageSettings();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(profile?.status === 'admin');
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
    }
  };

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('guide_videos')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar vídeos do guia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPageSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('guide_page_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setPageSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da página:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Iniciante': return 'bg-green-600';
      case 'Intermediário': return 'bg-yellow-600';
      case 'Avançado': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const openVideo = (video: GuideVideo) => {
    setSelectedVideo(video);
    setIsVideoPlayerOpen(true);
  };

  const openEditModal = (video?: GuideVideo) => {
    setEditingVideo(video || null);
    setIsAdminEditOpen(true);
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('guide_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vídeo excluído com sucesso"
      });

      loadVideos();
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir vídeo",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-black/70 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 text-white">
                <Settings className="h-3 w-3 mr-1" />
                Modo Admin
              </Badge>
              <Button
                onClick={() => setIsSettingsOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Cog className="h-4 w-4 mr-2" />
                Configurar Textos
              </Button>
              <Button
                onClick={() => openEditModal()}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Vídeo
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          {/* Logo Principal */}
          <div className="flex justify-center mb-12">
            <img
              src="/lovable-uploads/xlata.site_logotipo.png"
              alt="Logo XLata.site - Guia-Completo"
              className="h-32 w-auto drop-shadow-2xl"
            />
          </div>

          <div className="flex justify-center mb-8">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg px-8 py-3">
              <Play className="h-5 w-5 mr-3" />
              {pageSettings.badge_text}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {pageSettings.main_title}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 font-semibold">
            {pageSettings.subtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pageSettings.feature1_title}</h3>
              <p className="text-gray-400">{pageSettings.feature1_subtitle}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pageSettings.feature2_title}</h3>
              <p className="text-gray-400">{pageSettings.feature2_subtitle}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{pageSettings.feature3_title}</h3>
              <p className="text-gray-400">{pageSettings.feature3_subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando vídeos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((video, index) => (
                <Card 
                  key={video.id} 
                  className="bg-gradient-to-br from-gray-800/80 to-gray-900/90 border-2 border-gray-600/50 hover:border-green-500/70 transition-all duration-500 transform hover:scale-105 shadow-2xl relative group"
                >
                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(video);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 border-blue-600 text-white h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVideo(video.id);
                          }}
                          className="bg-red-600 hover:bg-red-700 border-red-600 text-white h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div 
                    className="relative cursor-pointer"
                    onClick={() => openVideo(video)}
                  >
                    <img
                      src={video.cover_image_url || video.thumbnail_url || "/lovable-uploads/7e573df6-43ec-4eac-a025-777ac1ecdd0f.png"}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-green-600/90 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                    {video.duration && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-black/70 text-white">
                          <Clock className="h-3 w-3 mr-1" />
                          {video.duration}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-green-600/90 text-white text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-600 text-white text-xs">
                        {video.category}
                      </Badge>
                      <Badge className={`${getDifficultyColor(video.difficulty)} text-white text-xs`}>
                        {video.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg font-bold leading-tight">
                      {video.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {video.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && videos.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold mb-2 text-gray-400">Nenhum vídeo disponível</h3>
              <p className="text-gray-500">Os vídeos do guia estão sendo preparados.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-black mb-8 text-white">
            {pageSettings.cta_title}
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto text-green-100">
            {pageSettings.cta_subtitle}
          </p>
          
          <Button
            size="lg"
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xl px-12 py-6 font-black shadow-2xl transform hover:scale-110 transition-all duration-300"
          >
            <CheckCircle className="mr-3 h-6 w-6" />
            {pageSettings.cta_button_text}
          </Button>
        </div>
      </section>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal
          isOpen={isVideoPlayerOpen}
          onClose={() => {
            setIsVideoPlayerOpen(false);
            setSelectedVideo(null);
          }}
          videoUrl={selectedVideo.video_url}
          title={selectedVideo.title}
        />
      )}

      {/* Admin Edit Modal */}
      {isAdmin && (
        <AdminVideoEditModal
          isOpen={isAdminEditOpen}
          onClose={() => {
            setIsAdminEditOpen(false);
            setEditingVideo(null);
          }}
          video={editingVideo}
          onVideoUpdated={loadVideos}
        />
      )}

      {/* Page Settings Modal */}
      {isAdmin && (
        <GuidePageSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSettingsUpdated={loadPageSettings}
          currentSettings={pageSettings}
        />
      )}
    </div>
  );
};

export default GuiaCompleto;
