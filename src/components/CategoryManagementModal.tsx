import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Check, X, Shield, Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { MaterialCategory } from '@/types/pdv';
import { getMaterialCategories, saveMaterialCategory, removeMaterialCategory, toggleCategoryActive, seedDefaultCategoriesAndMaterials, resetAllCategories } from '@/utils/supabaseStorage';
import { CATEGORY_COLORS, CATEGORY_COLOR_OPTIONS } from './CategoryBar';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

interface CategoryManagementModalProps {
  open: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

// Helper to check if a hex color is light
const isLightColor = (hex: string): boolean => {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

// Helper to get the next available color that is not already in use
const getNextAvailableColor = (usedColors: string[]): string => {
  const availableColors = CATEGORY_COLOR_OPTIONS.map(opt => opt.value);
  const nextColor = availableColors.find(color => !usedColors.includes(color));
  return nextColor || 'blue'; // Fallback if all colors are used
};

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  open,
  onClose,
  onCategoriesChanged
}) => {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('blue');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate which colors are currently in use
  const usedColors = categories.map(c => c.color);

  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const cats = await getMaterialCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeedLoading(true);
    try {
      await seedDefaultCategoriesAndMaterials();
      await loadCategories();
      onCategoriesChanged?.();
      toast({
        title: "Sucesso",
        description: "Categorias e materiais padrão criados com sucesso!"
      });
    } catch (error) {
      console.error('Error seeding defaults:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categorias padrão",
        variant: "destructive"
      });
    } finally {
      setIsSeedLoading(false);
    }
  };

  const handleResetCategories = async () => {
    setIsResetting(true);
    try {
      // Delete ALL categories (bypassing is_system check)
      await resetAllCategories();
      
      // Re-seed default categories with correct unique colors
      await seedDefaultCategoriesAndMaterials();
      await loadCategories();
      onCategoriesChanged?.();
      setShowResetConfirm(false);
      
      toast({
        title: "Sucesso",
        description: "Categorias resetadas para o padrão!"
      });
    } catch (error) {
      console.error('Error resetting categories:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar categorias",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicates
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const newCategory = await saveMaterialCategory({
        id: crypto.randomUUID(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        display_order: categories.length
      });

      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName('');
      setNewCategoryColor('blue');
      setIsAdding(false);
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;

    // Block editing system categories
    if (editingCategory.is_system) {
      toast({
        title: "Bloqueado",
        description: "Categorias do sistema não podem ser editadas",
        variant: "destructive"
      });
      setEditingCategory(null);
      return;
    }

    setIsLoading(true);
    try {
      const updated = await saveMaterialCategory({
        id: editingCategory.id,
        name: editingCategory.name.trim(),
        color: editingCategory.color,
        display_order: editingCategory.display_order
      });

      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingCategory(null);
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: MaterialCategory) => {
    // Block deleting system categories
    if (category.is_system) {
      toast({
        title: "Bloqueado",
        description: "Categorias do sistema não podem ser excluídas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await removeMaterialCategory(category.id);
      setCategories(prev => prev.filter(c => c.id !== category.id));
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso"
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (category: MaterialCategory) => {
    // All categories can be toggled - no restrictions

    setIsLoading(true);
    try {
      const newActiveState = !category.is_active;
      await toggleCategoryActive(category.id, newActiveState);
      setCategories(prev => prev.map(c => 
        c.id === category.id ? { ...c, is_active: newActiveState } : c
      ));
      onCategoriesChanged?.();

      toast({
        title: "Sucesso",
        description: newActiveState ? "Categoria ativada" : "Categoria desativada"
      });
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da categoria",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ColorPicker with used colors indication
  const ColorPicker: React.FC<{ 
    value: string; 
    onChange: (color: string) => void; 
    disabled?: boolean;
    excludeCategoryId?: string; // Exclude this category from "used" check (for editing)
  }> = ({ value, onChange, disabled, excludeCategoryId }) => {
    // Colors used by OTHER categories (excluding the one being edited)
    const colorsUsedByOthers = categories
      .filter(c => c.id !== excludeCategoryId)
      .map(c => c.color);

    return (
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_COLOR_OPTIONS.map((option) => {
          const colors = CATEGORY_COLORS[option.value];
          const isUsedByOther = colorsUsedByOthers.includes(option.value);
          const isCurrentValue = value === option.value;
          const isDisabled = disabled || (isUsedByOther && !isCurrentValue);
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-all duration-200 flex items-center justify-center relative',
                colors.bg,
                isCurrentValue 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 border-white' 
                  : 'border-transparent hover:scale-110',
                isDisabled && 'opacity-40 cursor-not-allowed',
                isUsedByOther && !isCurrentValue && 'after:content-[""] after:absolute after:w-full after:h-0.5 after:bg-white/70 after:rotate-45'
              )}
              title={isUsedByOther && !isCurrentValue ? `${option.label} (já em uso)` : option.label}
            >
              {isCurrentValue && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}
      </div>
    );
  };

  // Get the color display for a category
  const getCategoryColorDisplay = (category: MaterialCategory) => {
    if (category.hex_color) {
      return {
        backgroundColor: category.hex_color,
        color: isLightColor(category.hex_color) ? '#000000' : '#FFFFFF'
      };
    }
    const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
    return { className: colors.bg };
  };

  // Separate system and user categories
  const systemCategories = categories.filter(c => c.is_system);
  const userCategories = categories.filter(c => !c.is_system);
  const hasSystemCategories = systemCategories.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="z-[60] bg-slate-800 border-slate-700 text-white w-full max-w-full h-[100dvh] max-h-[100dvh] rounded-none md:w-auto md:max-w-lg lg:max-w-[70%] md:h-auto md:max-h-[90vh] md:rounded-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription className="text-slate-400">
            Crie, edite ou exclua categorias de materiais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seed default categories button */}
          {!hasSystemCategories && (
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-3">
              <p className="text-sm text-emerald-300 mb-2">
                Deseja criar as categorias padrão do sistema com materiais pré-cadastrados?
              </p>
              <Button
                onClick={handleSeedDefaults}
                disabled={isSeedLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSeedLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</>
                ) : (
                  <><Shield className="w-4 h-4 mr-2" /> Criar Categorias Padrão</>
                )}
              </Button>
            </div>
          )}

          {/* Add new category form */}
          {isAdding ? (
            <div className="bg-slate-700/50 rounded-lg p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-white text-sm">Nome da categoria</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Minha Categoria"
                  className="bg-slate-700 border-slate-600 text-white"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white text-sm">Cor</Label>
                <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-4 h-4 mr-1" /> Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewCategoryName('');
                    setNewCategoryColor('blue');
                  }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-1" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => {
                // Auto-select the next available color when opening the add form
                const nextColor = getNextAvailableColor(usedColors);
                setNewCategoryColor(nextColor);
                setIsAdding(true);
              }}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar Categoria Personalizada
            </Button>
          )}

          {/* Categories list */}
          <ScrollArea className="h-[calc(100dvh-320px)] md:h-[320px]">
            <div className="space-y-4 pr-2">
              {isLoading && categories.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  Carregando...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  Nenhuma categoria cadastrada
                </div>
              ) : (
                <>
                  {/* System Categories Section */}
                  {systemCategories.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                          Categorias do Sistema
                        </span>
                      </div>
                      {systemCategories.map((category) => {
                        const colorDisplay = getCategoryColorDisplay(category);

                        return (
                          <div
                            key={category.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50',
                              !category.is_active && 'opacity-50'
                            )}
                          >
                            {/* Color indicator */}
                            <div 
                              className={cn(
                                'w-5 h-5 rounded-full flex-shrink-0',
                                'className' in colorDisplay ? colorDisplay.className : ''
                              )}
                              style={'backgroundColor' in colorDisplay ? { backgroundColor: colorDisplay.backgroundColor } : {}}
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-white text-sm font-medium truncate">
                                  {category.name}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-400 bg-amber-500/10">
                                  Sistema
                                </Badge>
                              </div>
                            </div>

                            {/* Active toggle - all categories can be toggled */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {category.is_active ? 'Ativa' : 'Inativa'}
                              </span>
                              <Switch
                                checked={category.is_active !== false}
                                onCheckedChange={() => handleToggleActive(category)}
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* User Categories Section */}
                  {userCategories.length > 0 && (
                    <div className="space-y-2">
                      <div className="px-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Suas Categorias
                        </span>
                      </div>
                      {userCategories.map((category) => {
                        const colors = CATEGORY_COLORS[category.color] || CATEGORY_COLORS.blue;
                        const isEditing = editingCategory?.id === category.id;

                        return (
                          <div
                            key={category.id}
                            className={cn(
                              'flex items-center gap-2 p-2 rounded-lg transition-all',
                              isEditing ? 'bg-slate-700' : 'bg-slate-700/50 hover:bg-slate-700'
                            )}
                          >
                            <div className={cn('w-4 h-4 rounded-full flex-shrink-0', colors.bg)} />
                            
                            {isEditing ? (
                              <div className="flex-1 space-y-2">
                                <Input
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                  className="bg-slate-600 border-slate-500 text-white h-8 text-sm"
                                  autoFocus
                                />
                                <ColorPicker 
                                  value={editingCategory.color} 
                                  onChange={(color) => setEditingCategory({ ...editingCategory, color })}
                                  excludeCategoryId={editingCategory.id}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateCategory}
                                    disabled={isLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                                  >
                                    <Check className="w-3 h-3 mr-1" /> Salvar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCategory(null)}
                                    className="border-slate-600 text-slate-300 hover:bg-slate-600 h-7 text-xs"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 text-white text-sm font-medium truncate">
                                  {category.name}
                                </span>
                                <button
                                  onClick={() => setEditingCategory(category)}
                                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showResetConfirm ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-amber-400">Confirmar reset?</span>
              <Button
                size="sm"
                onClick={handleResetCategories}
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isResetting ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Resetando...</>
                ) : (
                  'Sim, resetar'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(true)}
              className="text-amber-400 border-amber-600/50 hover:bg-amber-600/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Resetar Categorias
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagementModal;