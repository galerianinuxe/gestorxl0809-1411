import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Building, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SystemSettings {
  id?: string;
  user_id: string;
  company: string;
  address: string;
  whatsapp1: string;
  whatsapp2: string;
  logo: string | null;
}

interface UserSettingsTabProps {
  userId: string;
  userName: string;
}

const UserSettingsTab: React.FC<UserSettingsTabProps> = ({ userId, userName }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          user_id: data.user_id,
          company: data.company || '',
          address: data.address || '',
          whatsapp1: data.whatsapp1 || '',
          whatsapp2: data.whatsapp2 || '',
          logo: data.logo,
        });
      } else {
        // User has no settings yet
        setSettings({
          user_id: userId,
          company: '',
          address: '',
          whatsapp1: '',
          whatsapp2: '',
          logo: null,
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SystemSettings, value: string | null) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const dataToSave = {
        user_id: settings.user_id,
        company: settings.company,
        address: settings.address,
        whatsapp1: settings.whatsapp1,
        whatsapp2: settings.whatsapp2,
        logo: settings.logo,
        updated_at: new Date().toISOString(),
      };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from('system_settings')
          .update(dataToSave)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('system_settings')
          .insert(dataToSave);
        
        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: `As configurações de ${userName} foram atualizadas com sucesso.`
      });
      setHasChanges(false);
      loadSettings(); // Reload to get ID if new
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Não foi possível carregar as configurações.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Save Button Header */}
      {hasChanges && (
        <div className="sticky top-0 z-10 bg-card border border-amber-500/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-amber-400 text-sm font-medium">
            Você tem alterações não salvas
          </span>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Empresa */}
        <Card className="bg-muted border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Building className="h-4 w-4 text-emerald-400" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-muted-foreground">Nome da Empresa</Label>
              <Input
                id="company"
                value={settings.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Nome da empresa"
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-muted-foreground">Endereço</Label>
              <Input
                id="address"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Endereço completo"
                className="bg-card border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contatos */}
        <Card className="bg-muted border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contatos WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp1" className="text-muted-foreground">WhatsApp Principal</Label>
              <Input
                id="whatsapp1"
                value={settings.whatsapp1}
                onChange={(e) => handleChange('whatsapp1', e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-card border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp2" className="text-muted-foreground">WhatsApp Secundário</Label>
              <Input
                id="whatsapp2"
                value={settings.whatsapp2}
                onChange={(e) => handleChange('whatsapp2', e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-card border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="bg-muted border-border md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-foreground">
              <Image className="h-4 w-4 text-emerald-400" />
              Logotipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-muted-foreground">URL do Logotipo</Label>
              <Input
                id="logo"
                value={settings.logo || ''}
                onChange={(e) => handleChange('logo', e.target.value || null)}
                placeholder="https://exemplo.com/logo.png"
                className="bg-card border-border"
              />
            </div>
            {settings.logo && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm">Preview:</span>
                <img 
                  src={settings.logo} 
                  alt="Logo preview" 
                  className="h-12 w-auto object-contain bg-white rounded p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default UserSettingsTab;
