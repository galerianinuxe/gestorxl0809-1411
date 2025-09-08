
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, RotateCcw, Printer, Crown } from 'lucide-react';

interface ReceiptFormatSettings {
  id?: string;
  format: '50mm' | '80mm';
  container_width: string;
  padding: string;
  margins: string;
  logo_max_width: string;
  logo_max_height: string;
  phone_font_size: string;
  address_font_size: string;
  title_font_size: string;
  customer_font_size: string;
  table_font_size: string;
  totals_font_size: string;
  final_total_font_size: string;
  datetime_font_size: string;
  quote_font_size: string;
}

const defaultSettings: Record<'50mm' | '80mm', ReceiptFormatSettings> = {
  '50mm': {
    format: '50mm',
    container_width: '45mm',
    padding: '2mm',
    margins: '1mm 0',
    logo_max_width: '90%',
    logo_max_height: '17mm',
    phone_font_size: '14px',
    address_font_size: '12px',
    title_font_size: '13px',
    customer_font_size: '12px',
    table_font_size: '10px',
    totals_font_size: '12px',
    final_total_font_size: '16px',
    datetime_font_size: '12px',
    quote_font_size: '11px',
  },
  '80mm': {
    format: '80mm',
    container_width: '66mm',
    padding: '2mm',
    margins: '1mm 0',
    logo_max_width: '90%',
    logo_max_height: '50mm',
    phone_font_size: '22px',
    address_font_size: '13.25px',
    title_font_size: '18px',
    customer_font_size: '19.327px',
    table_font_size: '11px',
    totals_font_size: '18px',
    final_total_font_size: '22px',
    datetime_font_size: '20.124px',
    quote_font_size: '14px',
  }
};

interface AdvancedReceiptConfigProps {
  open: boolean;
  onClose: () => void;
}

const AdvancedReceiptConfig: React.FC<AdvancedReceiptConfigProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [settings50mm, setSettings50mm] = useState<ReceiptFormatSettings>(defaultSettings['50mm']);
  const [settings80mm, setSettings80mm] = useState<ReceiptFormatSettings>(defaultSettings['80mm']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'50mm' | '80mm'>('50mm');
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se é admin
  const checkAdminStatus = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(data?.status === 'admin');
    } catch (error) {
      console.error('Erro ao verificar status admin:', error);
    }
  };

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Carregar configurações do usuário
  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('receipt_format_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data && data.length > 0) {
        data.forEach((setting) => {
          if (setting.format === '50mm') {
            setSettings50mm(setting as ReceiptFormatSettings);
          } else if (setting.format === '80mm') {
            setSettings80mm(setting as ReceiptFormatSettings);
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar configurações
  const saveSettings = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      
      const settingsToSave = [
        { ...settings50mm, user_id: user.id },
        { ...settings80mm, user_id: user.id }
      ];

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('receipt_format_settings')
          .upsert(setting, {
            onConflict: 'user_id,format'
          });

        if (error) {
          console.error('Erro ao salvar configuração:', error);
          toast({
            title: "Erro",
            description: `Erro ao salvar configurações do formato ${setting.format}`,
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações dos comprovantes foram atualizadas com sucesso!",
      });

      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Resetar para padrão
  const resetToDefault = () => {
    if (activeTab === '50mm') {
      setSettings50mm(defaultSettings['50mm']);
    } else {
      setSettings80mm(defaultSettings['80mm']);
    }
    
    toast({
      title: "Resetado",
      description: `Configurações do formato ${activeTab} foram resetadas para o padrão`,
    });
  };

  // Tornar padrão para todos os usuários - usando SQL direto
  const makeDefault = async () => {
    if (!user?.id || !isAdmin) return;

    const currentSettings = activeTab === '50mm' ? settings50mm : settings80mm;

    try {
      // Executar SQL direto através do cliente Supabase
      const { error } = await supabase
        .from('receipt_format_settings')
        .upsert({
          user_id: '00000000-0000-0000-0000-000000000000',
          format: activeTab,
          container_width: currentSettings.container_width,
          padding: currentSettings.padding,
          margins: currentSettings.margins,
          logo_max_width: currentSettings.logo_max_width,
          logo_max_height: currentSettings.logo_max_height,
          phone_font_size: currentSettings.phone_font_size,
          address_font_size: currentSettings.address_font_size,
          title_font_size: currentSettings.title_font_size,
          customer_font_size: currentSettings.customer_font_size,
          table_font_size: currentSettings.table_font_size,
          totals_font_size: currentSettings.totals_font_size,
          final_total_font_size: currentSettings.final_total_font_size,
          datetime_font_size: currentSettings.datetime_font_size,
          quote_font_size: currentSettings.quote_font_size
        });

      if (error) {
        console.error('Erro ao definir padrão:', error);
        toast({
          title: "Erro",
          description: "Erro ao definir configurações como padrão",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Padrão definido com sucesso!",
        description: `Configurações do formato ${activeTab} agora são o padrão para todos os usuários`,
      });
    } catch (error) {
      console.error('Erro ao definir padrão:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir configurações como padrão",
        variant: "destructive"
      });
    }
  };

  // Imprimir página de teste
  const printTestPage = () => {
    const currentSettings = activeTab === '50mm' ? settings50mm : settings80mm;
    
    // Dados fictícios para teste
    const testData = {
      customer: { name: "Cliente Teste Ltda" },
      order: {
        id: "TEST-001",
        timestamp: new Date().toISOString(),
        items: [
          {
            materialName: "Alumínio",
            quantity: 10.5,
            price: 3.50,
            total: 36.75,
            tara: 0.5
          },
          {
            materialName: "Cobre",
            quantity: 5.2,
            price: 15.00,
            total: 78.00,
            tara: 0.2
          }
        ],
        total: 114.75
      }
    };

    const totalWeight = testData.order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalTara = testData.order.items.reduce((sum, item) => sum + (item.tara || 0), 0);
    const netWeight = totalWeight - totalTara;

    const printContent = `
      <div style="
        width: ${currentSettings.container_width};
        max-width: ${currentSettings.container_width};
        margin: 0;
        padding: ${currentSettings.padding};
        font-family: 'Roboto', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.3;
        color: #000 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${currentSettings.margins};">
          <div style="width: 30%; flex: 0 0 30%; margin: 0; padding: 0;">
            <div style="
              width: 60px;
              height: 40px;
              background: #333;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 10px;
            ">LOGO</div>
          </div>
          
          <div style="width: 70%; flex: 0 0 70%; text-align: center;">
            <div style="font-size: ${currentSettings.phone_font_size}; font-weight: bold;">
              <div>(11) 96351-2105</div>
              <div style="margin-top: 2px;">(11) 94567-8901</div>
            </div>
            <div style="font-size: ${currentSettings.address_font_size}; margin-top: 3mm; font-weight: bold; text-align: center;">
              Rua Teste, 123 - Centro - São Paulo/SP
            </div>
          </div>
        </div>
        
        <div style="text-align: center; font-weight: bold; font-size: ${currentSettings.title_font_size}; margin-bottom: 1.05mm;">
          COMPROVANTE DE TESTE
        </div>
        
        <div style="text-align: center; margin-bottom: 3.6mm; font-size: ${currentSettings.customer_font_size}; font-weight: bold;">
          Cliente: ${testData.customer.name}
        </div>
        
        <div style="border-bottom: 2px solid #000; margin: ${currentSettings.margins};"></div>
        
        <table style="
          width: 100%;
          border-collapse: collapse;
          font-size: ${currentSettings.table_font_size};
          margin-bottom: 3mm;
          font-weight: bold;
        ">
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Material</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Peso</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">R$/kg</th>
              <th style="text-align: right; border-bottom: 1px solid #000; padding: 2mm 0; font-weight: bold;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${testData.order.items.map(item => {
              const pesoLiquido = item.quantity - (item.tara || 0);
              return `
                <tr>
                  <td style="padding: 1mm 0; vertical-align: top; font-weight: bold;">
                    ${item.materialName}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${activeTab === '50mm' ? '5px' : '10.8px'}; font-weight: bold;">Tara: ${item.tara.toFixed(3)} kg</span>` : ""}
                    ${item.tara && item.tara > 0 ? `<br/><span style="font-size: ${activeTab === '50mm' ? '5px' : '10.8px'}; font-weight: bold;">P. Líquido: ${pesoLiquido.toFixed(3)} kg</span>` : ""}
                  </td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.quantity.toFixed(3)}</td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.price.toFixed(2)}</td>
                  <td style="text-align: right; padding: 1mm 0; font-weight: bold;">${item.total.toFixed(2)}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        
        <div style="border-bottom: 2px solid #000; margin: ${currentSettings.margins};"></div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${currentSettings.totals_font_size}; font-weight: bold;">
          <span>Peso Bruto:</span>
          <span>${totalWeight.toFixed(3)} kg</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${currentSettings.totals_font_size}; font-weight: bold;">
          <span>Total Tara:</span>
          <span>${totalTara.toFixed(3)} kg</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin: 1.4mm 0; font-size: ${currentSettings.totals_font_size}; font-weight: bold;">
          <span>Peso Líquido:</span>
          <span>${netWeight.toFixed(3)} kg</span>
        </div>
        
        <div style="border-bottom: 2px solid #000; margin: ${currentSettings.margins};"></div>
        
        <div style="text-align: right; font-weight: bold; font-size: ${currentSettings.final_total_font_size}; margin: 2.16mm 0;">
          Total: R$ ${testData.order.total.toFixed(2)}
        </div>
        
        <div style="text-align: center; font-size: ${currentSettings.datetime_font_size}; margin: ${currentSettings.margins}; font-weight: bold;">
          ${new Date().toLocaleString('pt-BR')}
        </div>
        
        <div style="text-align: center; font-size: ${currentSettings.quote_font_size}; margin-top: 4mm; font-weight: bold; font-style: italic;">
          "O sucesso é a soma de pequenos esforços repetidos dia após dia."
        </div>
      </div>
    `;

    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Teste de Comprovante ${activeTab}</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    if (open && user) {
      loadSettings();
    }
  }, [open, user]);

  if (!open) return null;

  const currentSettings = activeTab === '50mm' ? settings50mm : settings80mm;
  const setCurrentSettings = activeTab === '50mm' ? setSettings50mm : setSettings80mm;

  const updateSetting = (key: keyof ReceiptFormatSettings, value: string) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-pdv-dark border border-gray-700 rounded-lg w-full h-full max-w-none max-h-none m-4 overflow-hidden">
        <div className="bg-pdv-dark-light border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-pdv-green" />
              <h2 className="text-xl font-bold text-white">Configurações Avançadas de Comprovante</h2>
            </div>
            <Button variant="outline" onClick={onClose} className="text-white border-gray-600 hover:bg-gray-700" style={{ backgroundColor: 'transparent' }}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100vh-200px)]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as '50mm' | '80mm')}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
              <TabsTrigger value="50mm" className="text-white data-[state=active]:bg-pdv-green data-[state=active]:text-black">
                Formato 50mm
              </TabsTrigger>
              <TabsTrigger value="80mm" className="text-white data-[state=active]:bg-pdv-green data-[state=active]:text-black">
                Formato 80mm
              </TabsTrigger>
            </TabsList>

            <TabsContent value="50mm" className="space-y-6">
              <ConfigurationForm 
                settings={settings50mm}
                onUpdate={(key, value) => setSettings50mm(prev => ({ ...prev, [key]: value }))}
                onReset={() => setSettings50mm(defaultSettings['50mm'])}
              />
            </TabsContent>

            <TabsContent value="80mm" className="space-y-6">
              <ConfigurationForm 
                settings={settings80mm}
                onUpdate={(key, value) => setSettings80mm(prev => ({ ...prev, [key]: value }))}
                onReset={() => setSettings80mm(defaultSettings['80mm'])}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-pdv-dark-light border-t border-gray-700 p-4 flex justify-between">
          <div className="flex gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={makeDefault}
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Tornar Padrão
              </Button>
            )}

            <Button
              variant="outline"
              onClick={resetToDefault}
              className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar {activeTab}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="text-white border-gray-600 hover:bg-gray-700" style={{ backgroundColor: 'transparent' }}>
              Cancelar
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-pdv-green hover:bg-pdv-green/90 text-black"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfigurationFormProps {
  settings: ReceiptFormatSettings;
  onUpdate: (key: keyof ReceiptFormatSettings, value: string) => void;
  onReset: () => void;
}

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      {/* Configurações de Layout */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Layout e Dimensões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Largura do Container</Label>
              <Input
                value={settings.container_width}
                onChange={(e) => onUpdate('container_width', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="50mm"
              />
            </div>
            <div>
              <Label className="text-white">Padding</Label>
              <Input
                value={settings.padding}
                onChange={(e) => onUpdate('padding', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="1mm"
              />
            </div>
            <div>
              <Label className="text-white">Margens</Label>
              <Input
                value={settings.margins}
                onChange={(e) => onUpdate('margins', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="1mm 0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Logo */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Logo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Largura Máxima do Logo</Label>
              <Input
                value={settings.logo_max_width}
                onChange={(e) => onUpdate('logo_max_width', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="100%"
              />
            </div>
            <div>
              <Label className="text-white">Altura Máxima do Logo</Label>
              <Input
                value={settings.logo_max_height}
                onChange={(e) => onUpdate('logo_max_height', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="20mm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Fonte */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Tamanhos de Fonte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Telefones</Label>
              <Input
                value={settings.phone_font_size}
                onChange={(e) => onUpdate('phone_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="8px"
              />
            </div>
            <div>
              <Label className="text-white">Endereço</Label>
              <Input
                value={settings.address_font_size}
                onChange={(e) => onUpdate('address_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="6px"
              />
            </div>
            <div>
              <Label className="text-white">Título</Label>
              <Input
                value={settings.title_font_size}
                onChange={(e) => onUpdate('title_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="10px"
              />
            </div>
            <div>
              <Label className="text-white">Cliente</Label>
              <Input
                value={settings.customer_font_size}
                onChange={(e) => onUpdate('customer_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="9px"
              />
            </div>
            <div>
              <Label className="text-white">Tabela</Label>
              <Input
                value={settings.table_font_size}
                onChange={(e) => onUpdate('table_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="6px"
              />
            </div>
            <div>
              <Label className="text-white">Totais</Label>
              <Input
                value={settings.totals_font_size}
                onChange={(e) => onUpdate('totals_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="7px"
              />
            </div>
            <div>
              <Label className="text-white">Total Final</Label>
              <Input
                value={settings.final_total_font_size}
                onChange={(e) => onUpdate('final_total_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="10px"
              />
            </div>
            <div>
              <Label className="text-white">Data/Hora</Label>
              <Input
                value={settings.datetime_font_size}
                onChange={(e) => onUpdate('datetime_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="7px"
              />
            </div>
            <div>
              <Label className="text-white">Frase Motivacional</Label>
              <Input
                value={settings.quote_font_size}
                onChange={(e) => onUpdate('quote_font_size', e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
                placeholder="6px"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReceiptConfig;
