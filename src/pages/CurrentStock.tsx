import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Archive, Search, Calendar as CalendarIcon, Filter, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import ClearStockModal from '@/components/ClearStockModal';
import MaterialDetailsModal from '@/components/MaterialDetailsModal';
import { Order } from '@/types/pdv';

interface MaterialStock {
  materialName: string;
  currentStock: number;
  purchasePrice: number;
  salePrice: number;
  totalValue: number;
  profitProjection: number;
  totalPurchases: number;
  totalSales: number;
  transactions: Array<{
    date: number;
    type: 'compra' | 'venda';
    quantity: number;
    price: number;
    total: number;
  }>;
}

const CurrentStock = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');

  // Estados para zerar estoque
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearStockModal, setShowClearStockModal] = useState(false);
  
  // Estados para modal de detalhes
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStock | null>(null);
  const [showMaterialDetails, setShowMaterialDetails] = useState(false);
  
  // Estado para controle dos filtros
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      const [ordersData, materialsData] = await Promise.all([
        getOrders(),
        getMaterials()
      ]);
      setOrders(ordersData);
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStockRequest = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordAuthenticated = () => {
    setShowPasswordModal(false);
    setShowClearStockModal(true);
  };

  const handleStockCleared = () => {
    // Recarregar dados após zerar estoque
    loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  // Obter materiais únicos para o filtro
  const uniqueMaterials = useMemo(() => {
    const materialNames = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => {
        materialNames.add(item.materialName);
      });
    });
    return Array.from(materialNames).sort();
  }, [orders]);

  const { filteredStockData, totalStockData, filteredTotals } = useMemo(() => {
    const materialStocks: { [key: string]: MaterialStock } = {};

    // PRIMEIRO: Calcular estoque atual total (sem filtro de período)
    orders.forEach(order => {
      if (order.status === 'completed') {
        order.items.forEach(item => {
          if (!materialStocks[item.materialName]) {
            const material = materials.find(m => m.name === item.materialName);
            materialStocks[item.materialName] = {
              materialName: item.materialName,
              currentStock: 0,
              purchasePrice: material?.price || 0,
              salePrice: material?.salePrice || 0,
              totalValue: 0,
              profitProjection: 0,
              totalPurchases: 0,
              totalSales: 0,
              transactions: []
            };
          }

          if (order.type === 'compra') {
            materialStocks[item.materialName].currentStock += item.quantity;
            materialStocks[item.materialName].totalPurchases += item.total;
          } else if (order.type === 'venda') {
            materialStocks[item.materialName].currentStock -= item.quantity;
            materialStocks[item.materialName].totalSales += item.total;
          }
        });
      }
    });

    // Verificar se há filtros aplicados
    const hasActiveFilters = selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0;

    // SEGUNDO: Filtrar pedidos por período (apenas se há filtros)
    const filteredOrders = hasActiveFilters ? orders.filter(order => {
      if (order.status !== 'completed') return false;
      
      const orderDate = new Date(order.timestamp);
      const now = new Date();
      
      // Aplicar filtro de período se especificado
      if (selectedPeriod) {
        let periodStartDate: Date;
        
        switch (selectedPeriod) {
          case 'diario':
            periodStartDate = new Date(now);
            periodStartDate.setHours(0, 0, 0, 0);
            break;
          case 'semanal':
            periodStartDate = new Date(now);
            periodStartDate.setDate(now.getDate() - 7);
            break;
          case 'mensal':
            periodStartDate = new Date(now);
            periodStartDate.setMonth(now.getMonth() - 1);
            break;
          case 'anual':
            periodStartDate = new Date(now);
            periodStartDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            return true;
        }
        
        if (orderDate < periodStartDate) return false;
      }
      
      // Aplicar filtro de data customizada se especificado
      if (filterStartDate) {
        const startOfDay = new Date(filterStartDate);
        startOfDay.setHours(0, 0, 0, 0);
        if (orderDate < startOfDay) return false;
      }
      
      if (filterEndDate) {
        const endOfDay = new Date(filterEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (orderDate > endOfDay) return false;
      }
      
      return true;
    }) : [];

    // TERCEIRO: Adicionar transações do período filtrado e calcular totais do período
    const filteredPeriodTotals: { [key: string]: { weight: number; value: number; profit: number; materialsCount: number } } = {};

    // Só processar se há filtros ativos
    if (hasActiveFilters) {
      filteredOrders.forEach(order => {
        order.items.forEach(item => {
          if (materialStocks[item.materialName]) {
            materialStocks[item.materialName].transactions.push({
              date: order.timestamp,
              type: order.type,
              quantity: item.quantity,
              price: item.price,
              total: item.total
            });

            // Calcular totais do período filtrado
            if (!filteredPeriodTotals[item.materialName]) {
              filteredPeriodTotals[item.materialName] = { weight: 0, value: 0, profit: 0, materialsCount: 0 };
            }

            if (order.type === 'compra') {
              filteredPeriodTotals[item.materialName].weight += item.quantity;
              filteredPeriodTotals[item.materialName].value += item.total;
              filteredPeriodTotals[item.materialName].profit += (materialStocks[item.materialName].salePrice - item.price) * item.quantity;
            } else if (order.type === 'venda') {
              filteredPeriodTotals[item.materialName].weight -= item.quantity;
              filteredPeriodTotals[item.materialName].value -= item.total;
              filteredPeriodTotals[item.materialName].profit -= (item.price - materialStocks[item.materialName].purchasePrice) * item.quantity;
            }
          }
        });
      });
    }

    // QUARTO: Calcular valores e projeções baseados no estoque atual
    Object.values(materialStocks).forEach(stock => {
      if (stock.currentStock > 0) {
        stock.totalValue = stock.currentStock * stock.purchasePrice;
        stock.profitProjection = (stock.salePrice - stock.purchasePrice) * stock.currentStock;
      }
      
      stock.transactions.sort((a, b) => b.date - a.date);
    });

    const totalStockData = Object.values(materialStocks);
    
    // QUINTO: Aplicar filtros de materiais específicos
    let filteredStockData = Object.values(materialStocks);
    
    // Filtro por materiais específicos selecionados
    if (selectedMaterials.length > 0) {
      filteredStockData = filteredStockData.filter(stock => 
        selectedMaterials.some(selectedMaterial => 
          stock.materialName.toLowerCase().includes(selectedMaterial.toLowerCase())
        )
      );
    }

    // SEXTO: Calcular totais dos dados filtrados baseado APENAS no período filtrado
    // Se não há filtros ativos, zerar todos os valores
    const filteredTotals = hasActiveFilters ? {
      totalWeight: Object.values(filteredPeriodTotals)
        .filter((_, index) => {
          const materialName = Object.keys(filteredPeriodTotals)[index];
          return selectedMaterials.length === 0 || selectedMaterials.some(selected => 
            materialName.toLowerCase().includes(selected.toLowerCase())
          );
        })
        .reduce((sum, totals) => sum + totals.weight, 0),
      
      materialsCount: Object.keys(filteredPeriodTotals)
        .filter(materialName => {
          const hasTransactions = filteredPeriodTotals[materialName].weight !== 0;
          const matchesFilter = selectedMaterials.length === 0 || selectedMaterials.some(selected => 
            materialName.toLowerCase().includes(selected.toLowerCase())
          );
          return hasTransactions && matchesFilter;
        }).length,
        
      totalValue: Object.values(filteredPeriodTotals)
        .filter((_, index) => {
          const materialName = Object.keys(filteredPeriodTotals)[index];
          return selectedMaterials.length === 0 || selectedMaterials.some(selected => 
            materialName.toLowerCase().includes(selected.toLowerCase())
          );
        })
        .reduce((sum, totals) => sum + Math.abs(totals.value), 0),
        
      totalProfitProjection: Object.values(filteredPeriodTotals)
        .filter((_, index) => {
          const materialName = Object.keys(filteredPeriodTotals)[index];
          return selectedMaterials.length === 0 || selectedMaterials.some(selected => 
            materialName.toLowerCase().includes(selected.toLowerCase())
          );
        })
        .reduce((sum, totals) => sum + totals.profit, 0)
    } : {
      totalWeight: 0,
      materialsCount: 0,
      totalValue: 0,
      totalProfitProjection: 0
    };

    return {
      filteredStockData: filteredStockData.sort((a, b) => b.currentStock - a.currentStock),
      totalStockData: totalStockData,
      filteredTotals
    };
  }, [orders, materials, selectedPeriod, filterStartDate, filterEndDate, selectedMaterials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const clearFilters = () => {
    setSelectedPeriod('');
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setSelectedMaterials([]);
    setMaterialSearchValue('');
  };

  const removeMaterial = (materialToRemove: string) => {
    setSelectedMaterials(prev => prev.filter(material => material !== materialToRemove));
  };

  const handleMaterialClick = (material: MaterialStock) => {
    setSelectedMaterial(material);
    setShowMaterialDetails(true);
  };

  const totalStockValue = totalStockData
    .filter(stock => stock.currentStock > 0)
    .reduce((sum, stock) => sum + stock.totalValue, 0);

  const totalProfitProjection = totalStockData
    .filter(stock => stock.currentStock > 0)
    .reduce((sum, stock) => sum + stock.profitProjection, 0);

  const totalWeight = totalStockData
    .filter(stock => stock.currentStock > 0)
    .reduce((sum, stock) => sum + stock.currentStock, 0);

  const materialsInStock = totalStockData.filter(stock => stock.currentStock > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        <header className="bg-pdv-dark text-white p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Estoque Atual</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando dados...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <header className="bg-pdv-dark text-white p-4 border-b border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-gray-300">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar ao Dashboard</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6" />
            Estoque Atual
          </h1>
        </div>
        
        <Button
          onClick={handleClearStockRequest}
          size="sm"
          variant="outline"
          className="bg-red-900/20 border-red-600 text-red-400 hover:bg-red-900/40 hover:text-red-300 text-xs px-3 py-1"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Zerar Estoque
        </Button>
      </header>

      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        {/* Filtros em Dropdown */}
        <div className="mb-6">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {(selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0) && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {[selectedPeriod, filterStartDate, filterEndDate, ...selectedMaterials].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-gray-800 border-gray-700" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Período</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-300">
                      <SelectValue placeholder="Selecionar período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600",
                          !filterStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterStartDate ? format(filterStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filterStartDate}
                        onSelect={setFilterStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600",
                          !filterEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterEndDate ? format(filterEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filterEndDate}
                        onSelect={setFilterEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Materiais</Label>
                  <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={materialSearchOpen}
                        className="w-full justify-between bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {selectedMaterials.length > 0 
                          ? `${selectedMaterials.length} material(is) selecionado(s)`
                          : "Selecionar materiais"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Pesquisar material..." 
                          value={materialSearchValue}
                          onValueChange={setMaterialSearchValue}
                        />
                        <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandList>
                            {uniqueMaterials
                              .filter(material => 
                                material.toLowerCase().includes(materialSearchValue.toLowerCase())
                              )
                              .map((material) => (
                              <CommandItem
                                key={material}
                                value={material}
                                onSelect={() => {
                                  setSelectedMaterials(prev =>
                                    prev.includes(material)
                                      ? prev.filter(m => m !== material)
                                      : [...prev, material]
                                  );
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedMaterials.includes(material)}
                                    readOnly
                                    className="h-4 w-4"
                                  />
                                  <span>{material}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1"
                  >
                    Aplicar
                  </Button>
                </div>

                {selectedMaterials.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm text-gray-300">Materiais selecionados:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMaterials.map(material => (
                        <div key={material} className="flex items-center gap-1 bg-blue-900 text-blue-200 px-2 py-1 rounded-md text-sm">
                          <span>{material}</span>
                          <button
                            onClick={() => removeMaterial(material)}
                            className="ml-1 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Card className="bg-blue-900 border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">
                {selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0 
                  ? "Peso Bruto (Período Filtrado)" 
                  : "Peso Bruto (Período Filtrado)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-blue-100">
                {formatWeight(filteredTotals.totalWeight)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900 border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">
                {selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0 
                  ? "Tipos de Materiais (Filtrados)" 
                  : "Tipos de Materiais (Filtrados)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-green-100">
                {filteredTotals.materialsCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900 border-yellow-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">
                {selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0 
                  ? "Valor Total (Período Filtrado)" 
                  : "Valor Total (Período Filtrado)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-yellow-100">
                {formatCurrency(filteredTotals.totalValue)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">
                {selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0 
                  ? "Projeção de Lucro (Filtrado)" 
                  : "Projeção de Lucro (Filtrado)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-purple-100">
                {formatCurrency(filteredTotals.totalProfitProjection)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Resumo do Estoque Atual Total */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Card className="bg-blue-900 border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Estoque Atual - Peso Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-blue-100">
                {formatWeight(totalWeight)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-900 border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Estoque Atual - Tipos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-green-100">
                {materialsInStock}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900 border-yellow-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Estoque Atual - Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-yellow-100">
                {formatCurrency(totalStockValue)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-900 border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Estoque Atual - Projeção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg md:text-xl xl:text-2xl font-bold text-purple-100">
                {formatCurrency(totalProfitProjection)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materiais em Estoque - Lista Mobile-Friendly */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Materiais em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStockData.filter(stock => stock.currentStock > 0).length > 0 ? (
              <div className="space-y-3">
                {filteredStockData
                  .filter(stock => stock.currentStock > 0)
                  .map(stock => {
                    const percentage = totalWeight > 0 ? (stock.currentStock / totalWeight * 100) : 0;
                    return (
                      <div 
                        key={stock.materialName}
                        onClick={() => handleMaterialClick(stock)}
                        className="p-4 bg-gray-700 rounded-lg border border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex flex-col space-y-3">
                          {/* Material Name */}
                          <div>
                            <h3 className="font-medium text-white text-lg">{stock.materialName}</h3>
                          </div>
                          
                          {/* Weight and percentage */}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Peso em Estoque:</span>
                            <span className="text-white font-medium">
                              {formatWeight(stock.currentStock)}
                            </span>
                          </div>
                          
                          {/* Progress bar for percentage */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-sm">Percentual do Total:</span>
                              <span className="text-gray-300 text-sm">{percentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all" 
                                style={{width: `${Math.min(percentage, 100)}%`}}
                              />
                            </div>
                          </div>
                          
                          {/* Additional info on mobile */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-400">Valor Total:</span>
                              <div className="text-white font-medium">{formatCurrency(stock.totalValue)}</div>
                            </div>
                            <div>
                              <span className="text-gray-400">Projeção:</span>
                              <div className="text-green-400 font-medium">{formatCurrency(stock.profitProjection)}</div>
                            </div>
                          </div>
                          
                          {/* Tap hint */}
                          <div className="text-center text-xs text-gray-500 mt-2 border-t border-gray-600 pt-2">
                            Toque para ver detalhes completos
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum material em estoque encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materiais com Estoque Zerado */}
        {filteredStockData.filter(stock => stock.currentStock <= 0).length > 0 && (
          <Card className="mt-6 bg-red-900 border-red-700">
            <CardHeader>
              <CardTitle className="text-white">Materiais com Estoque Zerado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredStockData
                  .filter(stock => stock.currentStock <= 0)
                  .map(stock => (
                    <div key={stock.materialName} className="flex justify-between items-center p-3 bg-red-800 rounded-lg">
                      <div>
                        <span className="text-white font-medium">{stock.materialName}</span>
                        <div className="text-red-200 text-sm">
                          Estoque: {formatWeight(stock.currentStock)}
                        </div>
                      </div>
                      {stock.transactions.length > 0 && (
                        <div className="text-red-200 text-sm">
                          Última transação: {formatDate(stock.transactions[0].date)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Modais */}
      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Autenticação para Zerar Estoque"
        description="Digite sua senha para confirmar a operação de zerar estoque"
      />
      
      <ClearStockModal
        open={showClearStockModal}
        onOpenChange={setShowClearStockModal}
        onStockCleared={handleStockCleared}
      />
      
      <MaterialDetailsModal
        open={showMaterialDetails}
        onOpenChange={setShowMaterialDetails}
        material={selectedMaterial}
        totalWeight={totalWeight}
      />
    </div>
  );
};

export default CurrentStock;
