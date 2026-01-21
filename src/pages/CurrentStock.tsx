import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ArrowLeft, Archive, Search, X, Trash2, Package, TrendingUp, DollarSign, Scale } from 'lucide-react';
import ContextualHelpButton from '@/components/ContextualHelpButton';
import { getOrders, getMaterials } from '@/utils/supabaseStorage';
import PasswordPromptModal from '@/components/PasswordPromptModal';
import ClearStockModal from '@/components/ClearStockModal';
import MaterialDetailsView from '@/components/MaterialDetailsView';
import { Order } from '@/types/pdv';
import { StandardFilter, FilterPeriod } from '@/components/StandardFilter';
import { MetricCard } from '@/components/MetricCard';
import { Label } from '@/components/ui/label';

interface MaterialStock {
  materialName: string;
  currentStock: number;
  purchasePrice: number; // Preço atual do cadastro (referência)
  salePrice: number; // Preço de venda atual do cadastro
  totalValue: number; // Custo real do estoque (baseado em preços históricos)
  profitProjection: number; // Projeção de lucro (valor venda - custo real)
  totalPurchases: number; // Valor total das compras
  totalSales: number; // Valor total das vendas
  // Novos campos para cálculo com preços históricos
  totalPurchaseCost: number; // Soma real dos valores pagos nas compras
  totalPurchaseQuantity: number; // Quantidade total comprada
  avgPurchasePrice: number; // Preço médio ponderado de compra
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
  
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialSearchOpen, setMaterialSearchOpen] = useState(false);
  const [materialSearchValue, setMaterialSearchValue] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClearStockModal, setShowClearStockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialStock | null>(null);
  const [showMaterialDetails, setShowMaterialDetails] = useState(false);

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
              purchasePrice: material?.price || 0, // Preço atual (referência)
              salePrice: material?.salePrice || 0, // Preço de venda atual
              totalValue: 0,
              profitProjection: 0,
              totalPurchases: 0,
              totalSales: 0,
              // Novos campos para cálculo histórico
              totalPurchaseCost: 0,
              totalPurchaseQuantity: 0,
              avgPurchasePrice: 0,
              transactions: []
            };
          }

          // Registrar transação SEMPRE (independente de filtros)
          materialStocks[item.materialName].transactions.push({
            date: order.timestamp,
            type: order.type,
            quantity: item.quantity,
            price: item.price,
            total: item.total
          });

          if (order.type === 'compra') {
            materialStocks[item.materialName].currentStock += item.quantity;
            materialStocks[item.materialName].totalPurchases += item.total;
            // Acumular custo real e quantidade das compras
            materialStocks[item.materialName].totalPurchaseCost += item.total;
            materialStocks[item.materialName].totalPurchaseQuantity += item.quantity;
          } else if (order.type === 'venda') {
            materialStocks[item.materialName].currentStock -= item.quantity;
            materialStocks[item.materialName].totalSales += item.total;
          }
        });
      }
    });

    const hasActiveFilters = (selectedPeriod && selectedPeriod !== 'all') || (selectedPeriod === 'custom' && filterStartDate && filterEndDate) || selectedMaterials.length > 0;

    const now = new Date();
    let periodStart: Date | null = null;
    let periodEnd: Date = new Date(now);
    periodEnd.setHours(23, 59, 59, 999);

    if (selectedPeriod === 'custom' && filterStartDate && filterEndDate) {
      periodStart = new Date(filterStartDate + 'T00:00:00');
      periodEnd = new Date(filterEndDate + 'T23:59:59.999');
    } else if (selectedPeriod && selectedPeriod !== 'all') {
      switch (selectedPeriod) {
        case 'daily':
          periodStart = new Date(now);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd = new Date(now);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'last30':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 30);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last60':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 60);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last90':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 90);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'last365':
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - 365);
          periodStart.setHours(0, 0, 0, 0);
          break;
      }
    }

    const filteredOrders = hasActiveFilters && periodStart ? orders.filter(order => {
      if (order.status !== 'completed') return false;
      const orderDate = new Date(order.timestamp);
      return orderDate >= periodStart && orderDate <= periodEnd;
    }) : [];

    const filteredPeriodTotals: { [key: string]: { weight: number; value: number; profit: number } } = {};

    if (hasActiveFilters && periodStart) {
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
              filteredPeriodTotals[item.materialName] = { weight: 0, value: 0, profit: 0 };
            }

            if (order.type === 'compra') {
              filteredPeriodTotals[item.materialName].weight += item.quantity;
              filteredPeriodTotals[item.materialName].value += item.total;
            } else if (order.type === 'venda') {
              filteredPeriodTotals[item.materialName].weight -= item.quantity;
              filteredPeriodTotals[item.materialName].value -= item.total;
            }
          }
        });
      });
    }

    Object.values(materialStocks).forEach(stock => {
      // Calcular preço médio ponderado de compra (CMP)
      if (stock.totalPurchaseQuantity > 0) {
        stock.avgPurchasePrice = stock.totalPurchaseCost / stock.totalPurchaseQuantity;
      }
      
      if (stock.currentStock > 0) {
        // Custo real do estoque = estoque atual × preço médio de compra
        stock.totalValue = stock.currentStock * stock.avgPurchasePrice;
        // Projeção de lucro = (preço venda atual × estoque) - custo real
        const projectedSaleValue = stock.salePrice * stock.currentStock;
        stock.profitProjection = projectedSaleValue - stock.totalValue;
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
        
      totalProfitProjection: 0
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const clearFilters = () => {
    setSelectedPeriod('all');
    setFilterStartDate('');
    setFilterEndDate('');
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

  const stockInPositive = totalStockData.filter(stock => stock.currentStock > 0);

  const totalStockValue = stockInPositive.reduce((sum, stock) => sum + stock.totalValue, 0);

  const totalSaleValue = stockInPositive.reduce((sum, stock) => sum + (stock.currentStock * stock.salePrice), 0);

  const totalProfitProjection = stockInPositive.reduce((sum, stock) => sum + stock.profitProjection, 0);

  const totalWeight = stockInPositive.reduce((sum, stock) => sum + stock.currentStock, 0);

  const materialsInStock = stockInPositive.length;

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-800">
        <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
          <h1 className="text-lg md:text-xl font-bold">Estoque Atual</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Carregando...</div>
        </main>
      </div>
    );
  }

  // Renderização condicional: Detalhes do Material OU Lista
  if (selectedMaterial) {
    return (
      <>
        <MaterialDetailsView
          material={selectedMaterial}
          totalWeight={totalWeight}
          onBack={() => {
            setSelectedMaterial(null);
            setShowMaterialDetails(false);
          }}
        />
        
        {/* Modals ainda disponíveis */}
        <PasswordPromptModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          onAuthenticated={handlePasswordAuthenticated}
          title="Zerar Estoque"
          description="Digite a senha para confirmar a limpeza do estoque."
        />

        <ClearStockModal
          open={showClearStockModal}
          onOpenChange={setShowClearStockModal}
          onStockCleared={handleStockCleared}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm">Voltar</span>
            </Link>
            <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Archive className="h-5 w-5 text-emerald-500" />
              Estoque Atual
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <ContextualHelpButton module="estoque" />
            <Button
              onClick={handleClearStockRequest}
              size="sm"
              variant="outline"
              className="bg-rose-900/20 border-rose-600 text-rose-400 hover:bg-rose-900/40 text-xs px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Zerar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Filtro Padronizado com Seleção de Materiais */}
        <StandardFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={filterStartDate}
          onStartDateChange={setFilterStartDate}
          endDate={filterEndDate}
          onEndDateChange={setFilterEndDate}
          onClear={clearFilters}
          showAllOption={true}
          extraFilters={
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-slate-300 text-sm mb-1 block">Filtrar Material</Label>
                <Popover open={materialSearchOpen} onOpenChange={setMaterialSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between bg-slate-800 border-slate-600 text-white hover:bg-slate-700 h-10"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {selectedMaterials.length > 0 
                        ? `${selectedMaterials.length} selecionado(s)`
                        : "Selecionar"
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0 bg-slate-800 border-slate-600">
                    <Command>
                      <CommandInput 
                        placeholder="Buscar..." 
                        value={materialSearchValue}
                        onValueChange={setMaterialSearchValue}
                        className="text-white"
                      />
                      <CommandList>
                        <CommandEmpty className="text-slate-400 text-sm p-2">Nenhum.</CommandEmpty>
                        <CommandGroup>
                          {uniqueMaterials
                            .filter(material => 
                              material.toLowerCase().includes(materialSearchValue.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((material) => (
                              <CommandItem
                                key={material}
                                value={material}
                                onSelect={() => {
                                  if (!selectedMaterials.includes(material)) {
                                    setSelectedMaterials(prev => [...prev, material]);
                                  }
                                  setMaterialSearchValue('');
                                  setMaterialSearchOpen(false);
                                }}
                                className="text-white hover:bg-slate-700"
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
                <div className="flex flex-wrap gap-1">
                  {selectedMaterials.map((material) => (
                    <span
                      key={material}
                      className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {material.substring(0, 15)}
                      <button onClick={() => removeMaterial(material)} className="hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          }
        />

        {/* Resumo - Cards Compactos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
          <MetricCard
            icon={Scale}
            iconColor="text-slate-400"
            label="Peso Total"
            value={formatWeight(totalWeight)}
          />
          <MetricCard
            icon={Package}
            iconColor="text-slate-400"
            label="Materiais"
            value={materialsInStock}
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-yellow-500"
            label="Valor Compra"
            value={formatCurrency(totalStockValue)}
          />
          <MetricCard
            icon={DollarSign}
            iconColor="text-blue-500"
            label="Valor Venda"
            value={formatCurrency(totalSaleValue)}
          />
          <MetricCard
            icon={TrendingUp}
            iconColor={totalProfitProjection >= 0 ? "text-emerald-500" : "text-rose-500"}
            label="Projeção Lucro"
            value={formatCurrency(totalProfitProjection)}
          />
        </div>

        {/* Período Filtrado */}
        {(selectedPeriod && selectedPeriod !== 'all') && (
          <Card className="bg-slate-700/50 border-slate-600 mb-3">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-white text-sm">Totais do Período Filtrado</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-slate-400 text-xs">Peso</div>
                  <div className="text-white font-semibold">{formatWeight(filteredTotals.totalWeight)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Materiais</div>
                  <div className="text-white font-semibold">{filteredTotals.materialsCount}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Valor</div>
                  <div className="text-white font-semibold">{formatCurrency(filteredTotals.totalValue)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Materiais */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3">
            <CardTitle className="text-white text-base md:text-lg">Materiais em Estoque</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {filteredStockData.filter(stock => stock.currentStock > 0).length > 0 ? (
              <div className="space-y-2">
                {filteredStockData.filter(stock => stock.currentStock > 0).map((stock) => (
                  <Card 
                    key={stock.materialName} 
                    className="bg-slate-800 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleMaterialClick(stock)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium truncate">{stock.materialName}</div>
                          <div className="text-sm text-slate-400">
                            {formatWeight(stock.currentStock)} em estoque
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{formatCurrency(stock.totalValue)}</div>
                          <div className={`text-sm ${stock.profitProjection >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            Lucro: {formatCurrency(stock.profitProjection)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                Nenhum material em estoque.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Materiais com estoque zerado ou negativo */}
        {filteredStockData.filter(stock => stock.currentStock <= 0).length > 0 && (
          <Card className="bg-slate-700 border-slate-600 mt-3">
            <CardHeader className="p-3">
              <CardTitle className="text-slate-400 text-base">Materiais Esgotados</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-3">
              <div className="space-y-2">
                {filteredStockData.filter(stock => stock.currentStock <= 0).map((stock) => (
                  <Card 
                    key={stock.materialName} 
                    className="bg-slate-800/50 border-slate-600 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleMaterialClick(stock)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-slate-400 font-medium truncate">{stock.materialName}</div>
                          <div className="text-sm text-slate-500">
                            {formatWeight(stock.currentStock)} em estoque
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500 font-semibold">R$ 0,00</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
        title="Zerar Estoque"
        description="Digite a senha para confirmar a limpeza do estoque."
      />

      <ClearStockModal
        open={showClearStockModal}
        onOpenChange={setShowClearStockModal}
        onStockCleared={handleStockCleared}
      />

    </div>
  );
};

export default CurrentStock;
