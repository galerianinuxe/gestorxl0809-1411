import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  accept?: string;
}

export function ImageUploader({
  value,
  onChange,
  bucket = 'landing-images',
  folder = 'uploads',
  placeholder = 'Cole uma URL ou faça upload',
  className = '',
  showPreview = true,
  accept = 'image/*',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.');
      return;
    }

    setIsUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      setUrlInput(urlData.publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url || null);
  };

  const handleClear = () => {
    setUrlInput('');
    onChange(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="bg-slate-700 border-slate-600 text-white pr-10"
          />
          {urlInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="border-slate-600 hover:bg-slate-700"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview */}
      {showPreview && urlInput && (
        <div className="relative rounded-lg overflow-hidden border border-slate-600 bg-slate-800">
          <img
            src={urlInput}
            alt="Preview"
            className="w-full h-32 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 opacity-0 hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
            >
              <X className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {showPreview && !urlInput && (
        <div 
          className="rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 p-6 text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-8 h-8 mx-auto text-slate-500 mb-2" />
          <p className="text-sm text-slate-400">
            Clique para fazer upload ou cole uma URL
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG, WEBP até 5MB
          </p>
        </div>
      )}
    </div>
  );
}
