import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, TrendingUp, Package, DollarSign, ArrowUpCircle, ArrowDownCircle, Scale, Percent, Receipt, Clock } from 'lucide-react';

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

interface MaterialDetailsViewProps {
  material: MaterialStock;
  totalWeight: number;
  onBack: () => void;
}

const MaterialDetailsView = ({ material, totalWeight, onBack }: MaterialDetailsViewProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatWeight = (value: number) => {
    return `${value.toFixed(2)} kg`;
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const percentage = totalWeight > 0 ? (material.currentStock / totalWeight * 100) : 0;
  const totalSaleValue = material.currentStock * material.salePrice;

  return (
    <div className="flex flex-col min-h-screen bg-slate-800">
      {/* Header */}
      <header className="bg-slate-900 text-white p-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="ml-1 text-sm">Voltar</span>
          </Button>
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-2 truncate">
            <Package className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="truncate">{material.materialName}</span>
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-2 md:p-4 overflow-auto">
        {/* Seção: Estoque */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Estoque</h3>
          <div className="grid grid-cols-3 gap-2">
            {/* Peso */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Scale className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Peso</span>
                </div>
                <div className="text-sm font-bold text-white">{formatWeight(material.currentStock)}</div>
              </CardContent>
            </Card>
            
            {/* Percentual */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Percent className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">% Total</span>
                </div>
                <div className="text-sm font-bold text-white">{percentage.toFixed(1)}%</div>
                <Progress value={percentage} className="h-1 mt-1.5" />
              </CardContent>
            </Card>
            
            {/* Transações */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Movim.</span>
                </div>
                <div className="text-sm font-bold text-white">{material.transactions.length}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção: Preços */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Preços por kg</h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Preço de Compra */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs text-slate-400">Compra</span>
                </div>
                <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.purchasePrice)}</div>
              </CardContent>
            </Card>
            
            {/* Preço de Venda */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-slate-400">Venda</span>
                </div>
                <div className="text-sm font-bold text-blue-400">{formatCurrency(material.salePrice)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seção: Valores em Estoque */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Valores em Estoque</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Custo Total */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs text-slate-400">Custo Total</span>
                </div>
                <div className="text-sm font-bold text-yellow-400">{formatCurrency(material.totalValue)}</div>
              </CardContent>
            </Card>
            
            {/* Valor de Venda Total */}
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs text-slate-400">Valor Venda</span>
                </div>
                <div className="text-sm font-bold text-blue-400">{formatCurrency(totalSaleValue)}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Projeção de Lucro - Destacado */}
          <Card className="bg-emerald-900/30 border-emerald-700/50">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-300">Projeção de Lucro</span>
                </div>
                <div className="text-lg font-bold text-emerald-400">{formatCurrency(material.profitProjection)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção: Histórico de Transações */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Histórico de Transações ({material.transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-3">
            {material.transactions.length > 0 ? (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {material.transactions.map((transaction, index) => {
                    const { date, time } = formatDateTime(transaction.date);
                    return (
                      <Card 
                        key={index}
                        className={`border ${
                          transaction.type === 'compra' 
                            ? 'bg-emerald-900/20 border-emerald-800/50' 
                            : 'bg-rose-900/20 border-rose-800/50'
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            {/* Left side: Type, Date, Time */}
                            <div className="flex items-start gap-2">
                              {transaction.type === 'compra' ? (
                                <ArrowUpCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <span className={`text-sm font-semibold ${
                                  transaction.type === 'compra' ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                  {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-400">{date}</span>
                                  <span className="text-xs text-slate-500">às</span>
                                  <span className="text-xs text-slate-400 font-medium">{time}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side: Quantity, Price, Total */}
                            <div className="text-right">
                              <div className="text-sm text-white font-medium">
                                {formatWeight(transaction.quantity)}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {formatCurrency(transaction.price)}/kg
                              </div>
                              <div className={`text-sm font-semibold mt-1 ${
                                transaction.type === 'compra' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {formatCurrency(transaction.total)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Nenhuma transação registrada para este material.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MaterialDetailsView;
