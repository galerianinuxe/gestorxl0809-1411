import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Check, Video } from 'lucide-react';
import VideoPlayerModal from '@/components/VideoPlayerModal';

interface VideoSectionProps {
  enabled: boolean;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterUrl?: string;
  bullets: string[];
}

const VideoSection: React.FC<VideoSectionProps> = ({
  enabled,
  title,
  subtitle,
  videoUrl,
  posterUrl,
  bullets
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Se o vídeo não estiver habilitado ou não tiver URL, não renderizar
  if (!enabled || !videoUrl) return null;

  // Extract YouTube thumbnail if no poster provided
  const getYouTubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
    }
    return null;
  };

  const thumbnailUrl = posterUrl || getYouTubeThumbnail(videoUrl) || '/lovable-uploads/capa_xlata.jpg';

  return (
    <>
      <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-900 to-gray-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10 lg:mb-14">
              <Badge className="mb-4 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 text-sm font-medium">
                <Video className="h-4 w-4 mr-2" />
                DEMONSTRAÇÃO RÁPIDA
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4">
                {title}
              </h2>
              <p className="text-gray-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
                {subtitle}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Video Player */}
              <div className="relative group order-1">
                <div 
                  className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-emerald-500/10 cursor-pointer border border-gray-800 group-hover:border-emerald-500/50 transition-all duration-300"
                  onClick={() => setIsVideoOpen(true)}
                >
                  {/* Thumbnail */}
                  <img 
                    src={thumbnailUrl}
                    alt="Demonstração do Sistema XLata"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40 group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white ml-1" fill="white" />
                    </div>
                  </div>

                  {/* Duration badge */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-lg font-medium">
                    60 segundos
                  </div>
                </div>
              </div>

              {/* Bullets */}
              <div className="order-2 space-y-6">
                <p className="text-gray-300 text-lg font-medium">
                  Neste vídeo você vai aprender:
                </p>
                <ul className="space-y-4">
                  {bullets.map((bullet, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-4 w-4 text-emerald-400" />
                      </div>
                      <span className="text-gray-200 text-base sm:text-lg leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setIsVideoOpen(true)}
                  className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-base"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Assistir Agora
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <VideoPlayerModal
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl={videoUrl}
        title={title}
      />
    </>
  );
};

export default VideoSection;