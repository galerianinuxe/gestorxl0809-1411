
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SEOConfig {
  title: string;
  description: string;
  author: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  robots: string;
  canonical: string;
}

export const useSEO = () => {
  const { user } = useAuth();

  const updateMetaTags = (config: SEOConfig) => {
    // Atualizar título
    document.title = config.title;
    
    // Atualizar ou criar meta tags
    const metaTags = [
      { name: 'description', content: config.description },
      { name: 'author', content: config.author },
      { name: 'keywords', content: config.keywords },
      { name: 'robots', content: config.robots },
      { property: 'og:title', content: config.ogTitle },
      { property: 'og:description', content: config.ogDescription },
      { property: 'og:image', content: config.ogImage },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: config.twitterCard },
      { name: 'twitter:title', content: config.ogTitle },
      { name: 'twitter:description', content: config.ogDescription },
      { name: 'twitter:image', content: config.ogImage }
    ];

    metaTags.forEach(tag => {
      const selector = tag.name ? `meta[name="${tag.name}"]` : `meta[property="${tag.property}"]`;
      let existingTag = document.querySelector(selector);
      
      if (existingTag) {
        existingTag.setAttribute('content', tag.content);
      } else {
        const newTag = document.createElement('meta');
        if (tag.name) newTag.setAttribute('name', tag.name);
        if (tag.property) newTag.setAttribute('property', tag.property);
        newTag.setAttribute('content', tag.content);
        document.head.appendChild(newTag);
      }
    });

    // Atualizar canonical URL
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonicalTag) {
      canonicalTag.href = config.canonical;
    } else {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      canonicalTag.href = config.canonical;
      document.head.appendChild(canonicalTag);
    }
  };

  const loadSEOConfig = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('seo_config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações SEO:', error);
        return;
      }

      if (data && data.seo_config) {
        // Safely cast the Json to SEOConfig
        const seoData = data.seo_config as unknown as SEOConfig;
        updateMetaTags(seoData);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações SEO:', error);
    }
  };

  // Carregar configurações SEO quando o usuário fizer login
  useEffect(() => {
    if (user) {
      loadSEOConfig();
    }
  }, [user]);

  return { loadSEOConfig, updateMetaTags };
};
