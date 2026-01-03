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
import { ArrowLeft, Archive, Search, Calendar as CalendarIcon, Filter, X, Trash2, Package, TrendingUp, DollarSign, Scale } from 'lucide-react';
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

    const hasActiveFilters = selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0;

    const filteredOrders = hasActiveFilters ? orders.filter(order => {
      if (order.status !== 'completed') return false;
      
      const orderDate = new Date(order.timestamp);
      const now = new Date();
      
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

    const filteredPeriodTotals: { [key: string]: { weight: number; value: number; profit: number; materialsCount: number } } = {};

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

    Object.values(materialStocks).forEach(stock => {
      if (stock.currentStock > 0) {
        stock.totalValue = stock.currentStock * stock.purchasePrice;
        stock.profitProjection = (stock.salePrice - stock.purchasePrice) * stock.currentStock;
      }
      
      stock.transactions.sort((a, b) => b.date - a.date);
    });

    const totalStockData = Object.values(materialStocks);
    
    let filteredStockData = Object.values(materialStocks);
    
    if (selectedMaterials.length > 0) {
      filteredStockData = filteredStockData.filter(stock => 
        selectedMaterials.some(selectedMaterial => 
          stock.materialName.toLowerCase().includes(selectedMaterial.toLowerCase())
        )
      );
    }

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
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold">Estoque Atual</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-xl">Carregando dados...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-4 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Archive className="h-6 w-6 text-emerald-500" />
            Estoque Atual
          </h1>
        </div>
        
        <Button
          onClick={handleClearStockRequest}
          size="sm"
          variant="outline"
          className="bg-rose-900/20 border-rose-600 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 text-xs px-3 py-1"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Zerar Estoque
        </Button>
      </header>

      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        {/* Filtros */}
        <div className="mb-6">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
                {(selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0) && (
                  <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                    {[selectedPeriod, filterStartDate, filterEndDate, ...selectedMaterials].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-slate-800 border-slate-700" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Período</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-300">
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
                  <Label className="text-slate-300">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600",
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
                  <Label className="text-slate-300">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600",
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
                  <Label className="text-slate-300">Materiais</Label>
                  <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={materialSearchOpen}
                        className="w-full justify-between bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {selectedMaterials.length > 0 
                          ? `${selectedMaterials.length} material(is)` 
                          : "Selecionar materiais"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Buscar material..." 
                          value={materialSearchValue}
                          onValueChange={setMaterialSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                          <CommandGroup>
                            {uniqueMaterials
                              .filter(material => 
                                material.toLowerCase().includes(materialSearchValue.toLowerCase())
                              )
                              .map((material) => (
                                <CommandItem
                                  key={material}
                                  value={material}
                                  onSelect={() => {
                                    if (!selectedMaterials.includes(material)) {
                                      setSelectedMaterials(prev => [...prev, material]);
                                    }
                                    setMaterialSearchValue('');
                                  }}
                                >
                                  {material}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {selectedMaterials.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterials.map((material) => (
                      <span
                        key={material}
                        className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full text-xs flex items-center gap-1"
                      >
                        {material}
                        <button onClick={() => removeMaterial(material)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <Button onClick={clearFilters} variant="outline" className="w-full bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
                  Limpar Filtros
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Cards de Resumo - Estoque Total */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Scale className="h-4 w-4 text-emerald-500" />
                Peso Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-white">
                {formatWeight(totalWeight)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-500" />
                Materiais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-white">
                {materialsInStock}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-white">
                {formatCurrency(totalStockValue)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600 hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Projeção Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xl md:text-2xl font-bold ${totalProfitProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(totalProfitProjection)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards Período Filtrado */}
        {(selectedPeriod || filterStartDate || filterEndDate || selectedMaterials.length > 0) && (
          <div className="mb-6">
            <h3 className="text-slate-400 text-sm mb-3 font-medium">Período Filtrado</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500">Peso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-white">{formatWeight(filteredTotals.totalWeight)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500">Materiais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-white">{filteredTotals.materialsCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500">Valor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-white">{formatCurrency(filteredTotals.totalValue)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-700/50 border-slate-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-slate-500">Lucro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-lg font-bold ${filteredTotals.totalProfitProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(filteredTotals.totalProfitProjection)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Lista de Materiais em Estoque */}
        <Card className="bg-slate-700 border-slate-600 mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Materiais em Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStockData.filter(stock => stock.currentStock > 0).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStockData
                  .filter(stock => stock.currentStock > 0)
                  .map((stock) => (
                    <div
                      key={stock.materialName}
                      onClick={() => handleMaterialClick(stock)}
                      className="bg-slate-800 border border-slate-600 rounded-lg p-4 cursor-pointer hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium text-sm truncate">{stock.materialName}</h4>
                        <span className="text-emerald-400 font-bold text-sm">{formatWeight(stock.currentStock)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Valor:</span>
                          <span className="text-slate-300">{formatCurrency(stock.totalValue)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Lucro Proj.:</span>
                          <span className={stock.profitProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {formatCurrency(stock.profitProjection)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min((stock.currentStock / Math.max(...filteredStockData.map(s => s.currentStock))) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                Nenhum material em estoque.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materiais com Estoque Zero */}
        {filteredStockData.filter(stock => stock.currentStock <= 0).length > 0 && (
          <Card className="bg-slate-700/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-slate-400 text-sm">Estoque Zero ou Negativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {filteredStockData
                  .filter(stock => stock.currentStock <= 0)
                  .map((stock) => (
                    <span
                      key={stock.materialName}
                      className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs"
                    >
                      {stock.materialName}: {formatWeight(stock.currentStock)}
                    </span>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Modals */}
      <PasswordPromptModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        onAuthenticated={handlePasswordAuthenticated}
        title="Autenticação Necessária"
        description="Digite a senha para zerar o estoque"
      />

      <ClearStockModal
        open={showClearStockModal}
        onOpenChange={setShowClearStockModal}
        onStockCleared={handleStockCleared}
      />

      {selectedMaterial && (
        <MaterialDetailsModal
          open={showMaterialDetails}
          onOpenChange={(open) => {
            setShowMaterialDetails(open);
            if (!open) setSelectedMaterial(null);
          }}
          material={selectedMaterial}
          totalWeight={selectedMaterial.currentStock}
        />
      )}
    </div>
  );
};

export default CurrentStock;
