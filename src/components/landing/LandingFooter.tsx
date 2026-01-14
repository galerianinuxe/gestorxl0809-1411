import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FooterLink {
  label: string;
  url: string;
  is_visible: boolean;
}

interface FooterSettings {
  copyright_text: string | null;
  links: FooterLink[];
  show_social_links: boolean | null;
  is_active: boolean | null;
}

interface LandingFooterProps {
  fallbackText?: string;
}

export function LandingFooter({ fallbackText }: LandingFooterProps) {
  const navigate = useNavigate();

  const { data: footerSettings } = useQuery({
    queryKey: ['landing-footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_footer_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;

      return {
        copyright_text: data.copyright_text,
        links: Array.isArray(data.links) ? (data.links as unknown as FooterLink[]) : [],
        show_social_links: data.show_social_links,
        is_active: data.is_active,
      } as FooterSettings;
    },
  });

  // Default links if no settings or settings not active
  const defaultLinks = [
    { label: 'Termos de Uso', url: '/termos-de-uso', is_visible: true },
    { label: 'Guia Completo', url: '/guia-completo', is_visible: true },
    { label: 'Planos', url: '/planos', is_visible: true },
    { label: 'Área do Cliente', url: '/login', is_visible: true },
  ];

  const links = footerSettings?.is_active && footerSettings.links.length > 0 
    ? footerSettings.links.filter(link => link.is_visible)
    : defaultLinks;

  const copyrightText = footerSettings?.is_active && footerSettings.copyright_text
    ? footerSettings.copyright_text
    : fallbackText || `© ${new Date().getFullYear()} XLata.site • Sistema para Depósitos de Reciclagem`;

  const handleLinkClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return (
    <footer className="bg-slate-950 py-8 lg:py-10 px-4 border-t border-slate-800">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-6 mb-6">
          {links.map((link, index) => (
            <Button 
              key={index}
              variant="ghost" 
              size="sm" 
              onClick={() => handleLinkClick(link.url)} 
              className="text-slate-500 hover:text-white text-xs sm:text-sm"
            >
              {link.label}
            </Button>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-slate-600 text-xs sm:text-sm">
            {copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
