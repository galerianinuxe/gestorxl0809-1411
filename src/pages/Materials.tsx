import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Plus, Save, Trash, Download, Search, Settings, AlertTriangle } from "lucide-react";
import { getMaterials, saveMaterial, removeMaterial } from "../utils/supabaseStorage";
import { Material } from "../types/pdv";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import DeleteMaterialModal from "../components/DeleteMaterialModal";
import MaterialConfigModal from "../components/MaterialConfigModal";
import { useAuth } from "@/hooks/useAuth";
import { findMaterialMatches, wouldCreateDuplicate, MaterialSuggestion } from '@/utils/materialMatching';
import { getDisplayName } from '@/utils/materialNormalization';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { MaterialsTutorial } from '@/components/onboarding/tutorials/MaterialsTutorial';
const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState<string>("");
  const [materialPrice, setMaterialPrice] = useState<string>("");
  const [materialSalePrice, setMaterialSalePrice] = useState<string>("");
  const [materialUnit, setMaterialUnit] = useState<string>("kg");
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    material: Material | null;
  }>({
    open: false,
    material: null
  });
  const [configModal, setConfigModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [materialSuggestions, setMaterialSuggestions] = useState<MaterialSuggestion[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<boolean>(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOnboardingActive, progress, completeStep, completeSubStep, skipOnboarding } = useOnboarding();
  const isMaterialsTutorialActive = isOnboardingActive && progress.currentStep === 2;
  const defaultMaterialsList = ['Aerosol', 'Alum chap', 'Alum perfil', 'Bloco limpo', 'Bloco misto', 'Bloco sujo', 'Bronze', 'Cavaco', 'Chumbo mole', 'Chumbo duro', 'Cobre 1', 'Cobre 2', 'Cobre 3', 'Eletrônico', 'Ferro', 'Ferro fundido', 'Ferro leve', 'Ferro pesado', 'Fio inst', 'Garrafa pet', 'Inox 304', 'Latinha', 'Metal', 'Panela limpa', 'Panela suja', 'Papel alum', 'Papelão', 'Plástico', 'Radiador alum', 'Radiador cobre', 'Roda', 'Televisão', 'Torneira', 'Vergalhão', 'Vidro', 'Plástico pvc', 'Plástico ps', 'Plástico pead', 'Fio pp', 'Fio off-set'];
  useEffect(() => {
    loadMaterials();
  }, []);
  useEffect(() => {
    const sorted = materials.sort((a, b) => a.name.localeCompare(b.name));
    const filtered = sorted.filter(material => material.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredMaterials(filtered);
  }, [materials, searchTerm]);
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const storedMaterials = await getMaterials();
      setMaterials(storedMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar materiais",
        variant: "destructive"
      });
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const insertDefaultMaterials = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para inserir materiais.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const existingMaterials = await getMaterials();
      let successCount = 0;
      let duplicateCount = 0;
      for (let index = 0; index < defaultMaterialsList.length; index++) {
        const materialName = defaultMaterialsList[index];
        const exists = existingMaterials.some(material => material.name.toLowerCase() === materialName.toLowerCase());
        if (!exists) {
          try {
            const newMaterial: Material = {
              id: crypto.randomUUID(),
              name: materialName,
              price: 0,
              salePrice: 0,
              unit: 'kg',
              user_id: user.id
            };
            console.log('Inserindo material padrão:', newMaterial);
            await saveMaterial(newMaterial);
            successCount++;
          } catch (error) {
            console.error(`Erro ao inserir material ${materialName}:`, error);
            duplicateCount++;
          }
        } else {
          duplicateCount++;
        }
      }
      if (successCount > 0) {
        await loadMaterials();
        toast({
          title: "Sucesso",
          description: `${successCount} materiais adicionados automaticamente`
        });
      } else {
        toast({
          title: "Informação",
          description: "Todos os materiais padrão já existem"
        });
      }
    } catch (error) {
      console.error('Error inserting default materials:', error);
      toast({
        title: "Erro",
        description: "Erro ao inserir materiais padrão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const maskBRL = (value: string) => {
    const onlyDigits = value.replace(/[^\d]/g, "");
    let numberValue = onlyDigits ? parseInt(onlyDigits, 10) : 0;
    const cents = numberValue % 100;
    const reais = Math.floor(numberValue / 100);
    return `R$ ${reais},${cents.toString().padStart(2, "0")}`;
  };
  const unmaskBRL = (maskedValue: string) => {
    const onlyDigits = maskedValue.replace(/[^\d]/g, "");
    if (!onlyDigits) return 0;
    return parseFloat((parseInt(onlyDigits, 10) / 100).toFixed(2));
  };
  const numberToMask = (value: number) => {
    if (!value && value !== 0) return maskBRL("");

    // Multiplica por 100 para converter para centavos e depois aplica a máscara
    const cents = Math.round(value * 100);
    const centString = cents.toString().padStart(1, "0");
    return maskBRL(centString);
  };
  const handleMaterialPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const masked = maskBRL(val);
    setMaterialPrice(masked);
  };
  const handleMaterialSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const masked = maskBRL(val);
    setMaterialSalePrice(masked);
  };
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setMaterialPrice(numberToMask(material.price));
    setMaterialSalePrice(numberToMask(material.salePrice ?? 0));
    setMaterialUnit(material.unit);
    setOpenDialog(true);
  };
  const handleAddMaterial = () => {
    resetForm();
    setOpenDialog(true);
  };
  const handleSaveMaterial = async () => {
    if (isSubmitting) return; // Prevent double submission

    const price = unmaskBRL(materialPrice);
    const salePrice = unmaskBRL(materialSalePrice);
    if (!materialName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do material é obrigatório",
        variant: "destructive"
      });
      return;
    }
    if (isNaN(price) || price < 0 || isNaN(salePrice) || salePrice < 0) {
      toast({
        title: "Erro",
        description: "Preços devem ser valores válidos e não negativos",
        variant: "destructive"
      });
      return;
    }
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar materiais.",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    const excludeId = editingMaterial?.id;
    if (wouldCreateDuplicate(materialName.trim(), materials, excludeId)) {
      toast({
        title: "Material Duplicado",
        description: "Já existe um material com nome similar. Verifique os materiais existentes.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSubmitting(true);
      setLoading(true);
      if (editingMaterial) {
        const updatedMaterial: Material = {
          ...editingMaterial,
          name: getDisplayName(materialName.trim()),
          price,
          salePrice,
          unit: materialUnit,
          user_id: user.id
        };
        console.log('Atualizando material:', updatedMaterial);
        await saveMaterial(updatedMaterial);
        toast({
          title: "Sucesso",
          description: "Material atualizado com sucesso"
        });
        
        // Complete onboarding sub-steps when editing
        if (isMaterialsTutorialActive) {
          if (price > 0) await completeSubStep(2, 'price-buy');
          if (salePrice > 0) await completeSubStep(2, 'price-sell');
        }
      } else {
        const newMaterial: Material = {
          id: crypto.randomUUID(),
          name: getDisplayName(materialName.trim()),
          price,
          salePrice,
          unit: materialUnit,
          user_id: user.id
        };
        console.log('Criando novo material:', newMaterial);
        await saveMaterial(newMaterial);
        toast({
          title: "Sucesso",
          description: "Material adicionado com sucesso"
        });
        
        // Complete onboarding sub-steps when adding
        if (isMaterialsTutorialActive) {
          await completeSubStep(2, 'add');
          if (price > 0) await completeSubStep(2, 'price-buy');
          if (salePrice > 0) await completeSubStep(2, 'price-sell');
        }
      }
      await loadMaterials();
      setOpenDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar material";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setEditingMaterial(null);
    setMaterialName("");
    setMaterialPrice(maskBRL(""));
    setMaterialSalePrice(maskBRL(""));
    setMaterialUnit("kg");
    setMaterialSuggestions([]);
    setShowDuplicateWarning(false);
  };

  // Handle material name changes and show suggestions
  const handleMaterialNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialName(value);
    
    if (value.trim().length > 2) {
      const matches = findMaterialMatches(value.trim(), materials);
      setMaterialSuggestions(matches.suggestions);
      
      const excludeId = editingMaterial?.id;
      const isDuplicate = wouldCreateDuplicate(value.trim(), materials, excludeId);
      setShowDuplicateWarning(isDuplicate);
    } else {
      setMaterialSuggestions([]);
      setShowDuplicateWarning(false);
    }
  };

  const selectSuggestion = (suggestion: MaterialSuggestion) => {
    handleEditMaterial(materials.find(m => m.id === suggestion.id)!);
    setMaterialSuggestions([]);
    setShowDuplicateWarning(false);
  };
  useEffect(() => {
    setMaterialPrice(prev => maskBRL(prev));
    setMaterialSalePrice(prev => maskBRL(prev));
  }, []);
  const handleDeleteMaterial = (material: Material) => {
    setDeleteModal({
      open: true,
      material
    });
  };
  const confirmDeleteMaterial = async () => {
    if (deleteModal.material) {
      try {
        setLoading(true);
        await removeMaterial(deleteModal.material.id);
        await loadMaterials();
        toast({
          title: "Material excluído",
          description: "O material foi removido com sucesso"
        });
      } catch (error) {
        console.error('Error deleting material:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir material",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    setDeleteModal({
      open: false,
      material: null
    });
  };
  const formatCurrency = (value: string) => {
    if (!value) return "R$ 0,00";
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "R$ 0,00";
    return numValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleSaveMaterial();
    }
  };
  const handleCardClick = (material: Material, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    handleEditMaterial(material);
  };
  return (
    <div className="min-h-screen bg-slate-900 text-white p-3 sm:p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4" data-tutorial="materials-header">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="icon" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Gerenciar Materiais</h1>
            <p className="text-slate-400 text-sm hidden sm:block">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materiais'} cadastrados
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button 
            onClick={() => setConfigModal(true)} 
            variant="outline"
            className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white flex-1 sm:flex-none" 
            disabled={loading}
            data-tutorial="config-button"
          >
            <Settings className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Configurações</span>
          </Button>
          <Button 
            onClick={insertDefaultMaterials} 
            variant="outline"
            className="bg-slate-700 border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 flex-1 sm:flex-none" 
            disabled={loading}
            data-tutorial="default-materials-button"
          >
            <Download className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Materiais Padrão</span>
          </Button>
          <Button 
            onClick={handleAddMaterial} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 sm:flex-none" 
            disabled={loading}
            data-tutorial="add-material-button"
          >
            <Plus className="h-4 w-4 sm:mr-2" /> 
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </header>

      {/* Search Bar */}
      <Card className="bg-slate-800 border-slate-700 mb-4">
        <CardContent className="p-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Buscar material por nome..." 
              value={searchTerm} 
              onChange={handleSearchChange} 
              className="pl-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-11 text-base" 
              disabled={loading} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-2 sm:p-3">
          <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-260px)]">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-slate-400">Carregando materiais...</div>
              </div>
            ) : filteredMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                <p className="text-base">Nenhum material encontrado</p>
                <p className="text-sm mt-1">Adicione materiais ou use os materiais padrão</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                {filteredMaterials.map((material, index) => (
                  <Card 
                    key={material.id} 
                    className="bg-slate-700 border-slate-600 relative group hover:bg-slate-600 hover:border-emerald-500/50 cursor-pointer transition-all duration-200"
                    onClick={e => handleCardClick(material, e)}
                    data-tutorial={index === 0 ? "material-card" : undefined}
                  >
                    {/* Delete Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 rounded-full text-slate-400 hover:text-white hover:bg-red-600 opacity-60 hover:opacity-100 z-10"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteMaterial(material);
                      }} 
                      disabled={loading}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                    
                    <CardContent className="p-3 pt-6">
                      {/* Material Name */}
                      <h3 className="font-semibold text-sm sm:text-base text-white text-center leading-tight mb-2 truncate" title={material.name}>
                        {material.name}
                      </h3>
                      
                      {/* Prices */}
                      <div className="space-y-1 text-center">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-slate-400">Compra:</span>
                          <span className="text-amber-400 font-medium">
                            {formatCurrency(material.price.toString())}/{material.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-slate-400">Venda:</span>
                          <span className="text-emerald-400 font-semibold">
                            {formatCurrency(material.salePrice?.toString() || "0")}/{material.unit}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-white">
              {editingMaterial ? "Editar Material" : "Adicionar Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material-name" className="text-slate-300 text-sm">Nome do Material</Label>
                <Input 
                  id="material-name" 
                  value={materialName} 
                  onChange={handleMaterialNameChange} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-emerald-400 text-base sm:text-lg font-medium" 
                />
                
                {showDuplicateWarning && (
                  <Alert className="border-amber-500 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-400 text-sm">
                      Material similar já existe. Verifique os materiais cadastrados.
                    </AlertDescription>
                  </Alert>
                )}
                
                {materialSuggestions.length > 0 && (
                  <div className="bg-slate-700 border border-slate-600 rounded-md p-2 space-y-1">
                    <p className="text-xs text-slate-400 mb-2">Materiais similares encontrados:</p>
                    {materialSuggestions.slice(0, 3).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center justify-between p-2 bg-slate-600 rounded cursor-pointer hover:bg-slate-500"
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <span className="text-sm text-white">{suggestion.name}</span>
                        <Badge variant="secondary" className="text-xs bg-slate-500">
                          {Math.round(suggestion.similarity * 100)}% similar
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-unit" className="text-slate-300 text-sm">Unidade</Label>
                <Input 
                  id="material-unit" 
                  value={materialUnit} 
                  onChange={e => setMaterialUnit(e.target.value)} 
                  className="bg-slate-700 border-slate-600 text-slate-400 text-base" 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-price" className="text-slate-300 text-sm">Preço de Compra (R$)</Label>
                <Input 
                  id="material-price" 
                  value={materialPrice} 
                  onChange={handleMaterialPriceChange} 
                  inputMode="numeric" 
                  maxLength={15} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-amber-400 text-xl sm:text-2xl py-3 font-bold" 
                  data-tutorial="price-buy-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material-sale-price" className="text-slate-300 text-sm">Preço de Venda (R$)</Label>
                <Input 
                  id="material-sale-price" 
                  value={materialSalePrice} 
                  onChange={handleMaterialSalePriceChange} 
                  inputMode="numeric" 
                  maxLength={15} 
                  onKeyDown={handleKeyDown} 
                  disabled={loading || isSubmitting} 
                  className="bg-slate-700 border-slate-600 text-emerald-400 text-xl sm:text-2xl py-3 font-bold" 
                  data-tutorial="price-sell-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)} 
              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1" 
              disabled={loading || isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMaterial} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto order-1 sm:order-2" 
              disabled={loading || isSubmitting}
              data-tutorial="save-material-button"
            >
              <Save className="mr-2 h-4 w-4" /> 
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteMaterialModal 
        open={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, material: null })} 
        onConfirm={confirmDeleteMaterial} 
        materialName={deleteModal.material?.name || ""} 
      />

      <MaterialConfigModal open={configModal} onClose={() => setConfigModal(false)} />

      {/* Materials Tutorial */}
      {isMaterialsTutorialActive && (
        <MaterialsTutorial 
          isActive={true}
          onComplete={() => {
            completeStep(2);
            toast({
              title: "Materiais configurados!",
              description: "Agora vamos abrir o caixa para começar a operar.",
            });
            navigate('/');
          }}
          onSkip={skipOnboarding}
        />
      )}
    </div>
  );
};

export default Materials;