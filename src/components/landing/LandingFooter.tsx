import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, BadgeCheck, KeyRound, ShieldCheck } from 'lucide-react';

interface FooterLink {
  label: string;
  url: string;
  is_visible: boolean;
}

interface SecurityBadge {
  icon: string;
  label: string;
  is_visible: boolean;
}

interface FooterSettings {
  copyright_text: string | null;
  links: FooterLink[];
  show_social_links: boolean | null;
  is_active: boolean | null;
  security_badges: SecurityBadge[];
}

interface LandingFooterProps {
  fallbackText?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Lock,
  BadgeCheck,
  KeyRound,
  ShieldCheck,
};

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
        security_badges: Array.isArray(data.security_badges) ? (data.security_badges as unknown as SecurityBadge[]) : [],
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

  // Default security badges
  const defaultBadges: SecurityBadge[] = [
    { icon: 'Shield', label: 'Site Seguro', is_visible: true },
    { icon: 'Lock', label: 'Dados Criptografados', is_visible: true },
    { icon: 'BadgeCheck', label: '100% Confiável', is_visible: true },
  ];

  const links = footerSettings?.is_active && footerSettings.links.length > 0 
    ? footerSettings.links.filter(link => link.is_visible)
    : defaultLinks;

  const securityBadges = footerSettings?.is_active && footerSettings.security_badges.length > 0
    ? footerSettings.security_badges.filter(badge => badge.is_visible)
    : defaultBadges;

  const copyrightText = footerSettings?.is_active && footerSettings.copyright_text
    ? footerSettings.copyright_text
    : fallbackText || `© ${new Date().getFullYear()} XLata.site • Todos os direitos reservados`;

  const handleLinkClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  const renderBadgeIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Shield;
    return <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  return (
    <footer className="bg-slate-950 py-8 lg:py-10 px-4 border-t border-slate-800">
      <div className="container mx-auto max-w-4xl">
        {/* Security Badges */}
        {securityBadges.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mb-6 pb-6 border-b border-slate-800">
            {securityBadges.map((badge, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-emerald-500"
              >
                {renderBadgeIcon(badge.icon)}
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        )}

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
