-- Adicionar campos de vídeo à tabela landing_page_settings
ALTER TABLE public.landing_page_settings
ADD COLUMN IF NOT EXISTS video_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS video_title text DEFAULT 'Veja como funciona em 60 segundos',
ADD COLUMN IF NOT EXISTS video_subtitle text DEFAULT 'Assista a uma demonstração rápida do sistema XLata.site',
ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_poster_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_bullets text DEFAULT '["Pesagem automática e precisa", "Controle total de materiais e estoque", "Relatórios financeiros em tempo real"]';

-- Também adicionar à tabela global_landing_settings para consistência
ALTER TABLE public.global_landing_settings
ADD COLUMN IF NOT EXISTS video_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS video_title text DEFAULT 'Veja como funciona em 60 segundos',
ADD COLUMN IF NOT EXISTS video_subtitle text DEFAULT 'Assista a uma demonstração rápida do sistema XLata.site',
ADD COLUMN IF NOT EXISTS video_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_poster_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS video_bullets text DEFAULT '["Pesagem automática e precisa", "Controle total de materiais e estoque", "Relatórios financeiros em tempo real"]';