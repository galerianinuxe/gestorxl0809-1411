import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Pause, Star, Users, Shield, SkipBack, SkipForward, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LandingHeroProps {
  settings: {
    hero_main_title?: string;
    hero_subtitle?: string;
    hero_description?: string;
    hero_button_text?: string;
    hero_badge_text?: string;
    hero_highlight_text?: string;
    hero_secondary_button_text?: string;
    hero_social_proof_users?: string;
    hero_social_proof_users_label?: string;
    hero_social_proof_rating?: string;
    hero_social_proof_rating_label?: string;
    hero_security_label?: string;
    background_image_url?: string;
    video_url?: string;
    hero_image_url?: string;
    hero_image_size_desktop?: string;
    hero_image_size_tablet?: string;
    hero_image_size_mobile?: string;
    hero_image_alt?: string;
    hero_media_type?: string;
    hero_video_url?: string;
    hero_video_type?: string;
  } | null;
  onStartTrial: () => void;
  onWatchVideo: () => void;
}

// Helper function to get image size classes
const getImageSizeClasses = (size: string, breakpoint: 'mobile' | 'tablet' | 'desktop') => {
  const sizes: Record<string, Record<string, string>> = {
    small: { mobile: 'max-w-[150px] max-h-[80px]', tablet: 'md:max-w-[200px] md:max-h-[100px]', desktop: 'lg:max-w-[200px] lg:max-h-[100px]' },
    medium: { mobile: 'max-w-[200px] max-h-[120px]', tablet: 'md:max-w-[300px] md:max-h-[160px]', desktop: 'lg:max-w-[350px] lg:max-h-[180px]' },
    large: { mobile: 'max-w-[250px] max-h-[150px]', tablet: 'md:max-w-[400px] md:max-h-[220px]', desktop: 'lg:max-w-[500px] lg:max-h-[280px]' },
    full: { mobile: 'max-w-[300px] max-h-[180px]', tablet: 'md:max-w-[500px] md:max-h-[300px]', desktop: 'lg:max-w-[700px] lg:max-h-[400px]' },
  };
  return sizes[size]?.[breakpoint] || sizes.medium[breakpoint];
};

// Helper functions to detect YouTube/Vimeo
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function LandingHero({ settings, onStartTrial, onWatchVideo }: LandingHeroProps) {
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);
  
  // Video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const title = settings?.hero_main_title || 'Pese, Calcule e Imprima em';
  const highlight = settings?.hero_highlight_text || '3 Minutos';
  const subtitle = settings?.hero_subtitle || 'Sem erro. Sem fila. Sem discussão.';
  const description = settings?.hero_description || 'Sistema completo para depósitos de sucata que querem parar de perder dinheiro com conta errada e cliente desconfiado.';
  const buttonText = settings?.hero_button_text || 'Começar Teste Grátis';
  const secondaryButtonText = settings?.hero_secondary_button_text || 'Ver Como Funciona';
  const badgeText = settings?.hero_badge_text || '✨ 7 dias grátis • Sem cartão';
  
  // Social proof - all editable
  const socialProofUsers = settings?.hero_social_proof_users || '130+';
  const socialProofUsersLabel = settings?.hero_social_proof_users_label || 'depósitos ativos';
  const socialProofRating = settings?.hero_social_proof_rating || '4.9';
  const socialProofRatingLabel = settings?.hero_social_proof_rating_label || 'de satisfação';
  const securityLabel = settings?.hero_security_label || 'Dados 100% seguros';

  // Hero media settings
  const heroMediaType = settings?.hero_media_type || 'image';
  const heroImageUrl = settings?.hero_image_url;
  const heroVideoUrl = settings?.hero_video_url;
  const heroImageAlt = settings?.hero_image_alt || 'Imagem do Hero';
  const sizeMobile = settings?.hero_image_size_mobile || 'small';
  const sizeTablet = settings?.hero_image_size_tablet || 'medium';
  const sizeDesktop = settings?.hero_image_size_desktop || 'medium';

  // Video detection
  const youtubeId = heroVideoUrl ? getYouTubeId(heroVideoUrl) : null;
  const vimeoId = heroVideoUrl ? getVimeoId(heroVideoUrl) : null;
  const isEmbedVideo = !!youtubeId || !!vimeoId;
  const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;

  // Video control handlers
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        setHasStarted(true);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handlePlayVideo = () => {
    if (isEmbedVideo) {
      setShowVideoEmbed(true);
    }
  };

  // Render video player (same style as "Como Funciona")
  const renderVideoPlayer = () => {
    if (!heroVideoUrl) return null;

    if (isEmbedVideo) {
      const embedUrl = youtubeId 
        ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`
        : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;

      if (showVideoEmbed) {
        return (
          <div className="relative aspect-video max-w-[400px] md:max-w-[500px] lg:max-w-[600px] mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <div 
          className="relative aspect-video max-w-[400px] md:max-w-[500px] lg:max-w-[600px] mx-auto bg-slate-900 rounded-xl overflow-hidden cursor-pointer group shadow-2xl"
          onClick={handlePlayVideo}
        >
          {thumbUrl && (
            <img 
              src={thumbUrl} 
              alt="Vídeo do Hero"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
          
          {/* Play button - same style as Como Funciona */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
              <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        </div>
      );
    }

    // Native video player for uploaded videos with custom controls
    return (
      <div 
        ref={containerRef}
        className="relative aspect-video max-w-[400px] md:max-w-[500px] lg:max-w-[600px] mx-auto bg-slate-900 rounded-xl overflow-hidden shadow-2xl group"
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={heroVideoUrl}
          className="w-full h-full object-cover cursor-pointer"
          onClick={handlePlayPause}
          poster={undefined}
        />

        {/* Initial play overlay */}
        {!hasStarted && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={handlePlayPause}
          >
            <button className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110">
              <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" fill="white" />
            </button>
          </div>
        )}

        {/* Custom controls - emerald theme */}
        {hasStarted && (
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            {/* Progress bar */}
            <div 
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group/progress"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-emerald-500 rounded-full relative transition-all"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Skip back 10s */}
                <button 
                  onClick={handleSkipBack}
                  className="text-white/80 hover:text-emerald-400 transition-colors p-1"
                  title="Retroceder 10s"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                {/* Play/Pause */}
                <button 
                  onClick={handlePlayPause}
                  className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                  )}
                </button>

                {/* Skip forward 10s */}
                <button 
                  onClick={handleSkipForward}
                  className="text-white/80 hover:text-emerald-400 transition-colors p-1"
                  title="Avançar 10s"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Fullscreen */}
              <button 
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-emerald-400 transition-colors p-1"
                title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-5 h-5" />
                ) : (
                  <Maximize2 className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Media - Image or Video */}
          {heroMediaType === 'video' && heroVideoUrl ? (
            <div className="mb-4 animate-fade-in">
              {renderVideoPlayer()}
            </div>
          ) : heroImageUrl && (
            <div className="mb-6 animate-fade-in">
              <img 
                src={heroImageUrl}
                alt={heroImageAlt}
                className={cn(
                  'mx-auto object-contain transition-all duration-300',
                  getImageSizeClasses(sizeMobile, 'mobile'),
                  getImageSizeClasses(sizeTablet, 'tablet'),
                  getImageSizeClasses(sizeDesktop, 'desktop')
                )}
              />
            </div>
          )}

          {/* Badge */}
          <Badge 
            variant="outline" 
            className="mb-6 px-4 py-2 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400 animate-fade-in"
          >
            {badgeText}
          </Badge>
          
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in">
            {title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
              {highlight}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-emerald-400 font-medium mb-4 animate-fade-in">
            {subtitle}
          </p>
          
          {/* Description */}
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto animate-fade-in">
            {description}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
            <Button 
              size="lg" 
              onClick={onStartTrial}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 hover:scale-105"
            >
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onWatchVideo}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg"
            >
              <Play className="mr-2 h-5 w-5" />
              {secondaryButtonText}
            </Button>
          </div>
          
          {/* Social Proof - All editable */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 animate-fade-in">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              <span><strong className="text-white">{socialProofUsers}</strong> {socialProofUsersLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span><strong className="text-white">{socialProofRating}</strong> {socialProofRatingLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <span dangerouslySetInnerHTML={{ __html: securityLabel.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
    </section>
  );
}
