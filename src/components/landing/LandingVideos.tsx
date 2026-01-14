import { Play, Clock } from 'lucide-react';
import { LandingVideo } from '@/hooks/useLandingData';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LandingVideosProps {
  items: LandingVideo[];
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function LandingVideos({ items }: LandingVideosProps) {
  const [selectedVideo, setSelectedVideo] = useState<LandingVideo | null>(null);

  if (!items.length) return null;

  const getEmbedUrl = (url: string) => {
    const youtubeId = getYouTubeId(url);
    if (youtubeId) return `https://www.youtube.com/embed/${youtubeId}?autoplay=1`;
    
    const vimeoId = getVimeoId(url);
    if (vimeoId) return `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    
    return url;
  };

  const getThumbnail = (video: LandingVideo) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    
    const youtubeId = getYouTubeId(video.video_url);
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    
    return null;
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((video) => {
            const thumbnail = getThumbnail(video);
            
            return (
              <button 
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="group relative bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden text-left hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative bg-slate-700">
                  {thumbnail && (
                    <img 
                      src={thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 text-white ml-1" />
                    </div>
                  </div>
                  
                  {/* Duration */}
                  {video.duration && (
                    <div className="absolute bottom-3 right-3 bg-black/70 rounded px-2 py-1 flex items-center gap-1 text-xs text-white">
                      <Clock className="w-3 h-3" />
                      {video.duration}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-slate-700">
          {selectedVideo && (
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(selectedVideo.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
