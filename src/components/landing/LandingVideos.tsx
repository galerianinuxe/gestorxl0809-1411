import { Clock } from 'lucide-react';
import { LandingVideo } from '@/hooks/useLandingData';
import { CustomVideoPlayer } from './CustomVideoPlayer';

interface LandingVideosProps {
  items: LandingVideo[];
}

export function LandingVideos({ items }: LandingVideosProps) {
  if (!items.length) return null;

  // Ordenar por display_order
  const sortedItems = [...items].sort((a, b) => a.display_order - b.display_order);

  // Determinar layout baseado na quantidade de vídeos
  const getGridClass = () => {
    if (sortedItems.length === 1) {
      return 'flex justify-center';
    }
    if (sortedItems.length === 2) {
      return 'grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto';
    }
    return 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto';
  };

  // Determinar classe da coluna para cada vídeo
  const getItemClass = (video: LandingVideo, index: number) => {
    // Se apenas 1 vídeo, centralizar com largura máxima
    if (sortedItems.length === 1) {
      return 'w-full max-w-xl';
    }
    
    // Se 2 vídeos, usar grid normal
    if (sortedItems.length === 2) {
      return '';
    }
    
    // Para 3+ vídeos, usar column_position para determinar posição
    const position = video.column_position || 2;
    
    // Em desktop (lg), posicionar na coluna correta
    return `lg:col-start-${position}`;
  };

  // Obter URL do vídeo (upload tem prioridade)
  const getVideoSrc = (video: LandingVideo) => {
    if (video.video_type === 'upload' && video.video_file_url) {
      return video.video_file_url;
    }
    return video.video_url;
  };

  return (
    <section className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Veja o XLata <span className="text-emerald-400">Funcionando</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Vídeos curtos mostrando como é simples usar o sistema no dia a dia
          </p>
        </div>

        {/* Videos Grid */}
        <div className={getGridClass()}>
          {sortedItems.map((video, index) => (
            <div 
              key={video.id}
              className={`group ${getItemClass(video, index)}`}
            >
              {/* Custom Video Player */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <CustomVideoPlayer
                  src={getVideoSrc(video)}
                  thumbnail={video.thumbnail_url}
                  title={video.title}
                  isYouTube={video.video_type === 'url'}
                />
                
                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {video.title}
                    </h3>
                    {video.duration && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </div>
                    )}
                  </div>
                  {video.description && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
