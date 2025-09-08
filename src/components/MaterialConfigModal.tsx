
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MaterialConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export interface MaterialDisplayConfig {
  fontSize: 'small' | 'medium' | 'large';
  showPricePerKg: boolean;
}

const fontSizeClass = "text-[130%]"; // +30% no texto

const MaterialConfigModal: React.FC<MaterialConfigModalProps> = ({ open, onClose }) => {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showPricePerKg, setShowPricePerKg] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      // Load saved configuration
      const savedConfig = localStorage.getItem('material_display_config');
      if (savedConfig) {
        const config: MaterialDisplayConfig = JSON.parse(savedConfig);
        setFontSize(config.fontSize);
        setShowPricePerKg(config.showPricePerKg);
      }
    }
  }, [open]);

  const handleSave = () => {
    const config: MaterialDisplayConfig = {
      fontSize,
      showPricePerKg
    };

    localStorage.setItem('material_display_config', JSON.stringify(config));

    toast({
      title: "Configurações salvas",
      description: "As configurações dos materiais foram atualizadas",
    });

    // Trigger a page refresh to apply changes immediately
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#202020] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className={`text-center ${fontSizeClass}`}>Configurações dos Materiais</DialogTitle>
          <DialogDescription className="text-gray-400 text-center">
            Personalize a exibição dos materiais na tela principal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className={`text-white text-base ${fontSizeClass}`}>Tamanho da fonte do nome do material:</Label>
            <RadioGroup value={fontSize} onValueChange={(value: 'small' | 'medium' | 'large') => setFontSize(value)}>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="small" className="border-green-500 text-green-500" />
                  <Label htmlFor="small" className={`text-white ${fontSizeClass}`}>Pequeno</Label>
                </div>
                <div className="text-white text-xs">Material Exemplo</div>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" className="border-green-500 text-green-500" />
                  <Label htmlFor="medium" className={`text-white ${fontSizeClass}`}>Médio</Label>
                </div>
                <div className="text-white text-sm">Material Exemplo</div>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="large" className="border-green-500 text-green-500" />
                  <Label htmlFor="large" className={`text-white ${fontSizeClass}`}>Grande</Label>
                </div>
                <div className="text-white text-lg">Material Exemplo</div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <Label className={`text-white text-base ${fontSizeClass}`}>Exibir valor por kg:</Label>
            <Switch
              checked={showPricePerKg}
              onCheckedChange={setShowPricePerKg}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className={`text-black bg-white hover:bg-gray-100 ${fontSizeClass}`}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className={`bg-pdv-green hover:bg-pdv-green/90 ${fontSizeClass}`}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialConfigModal;
