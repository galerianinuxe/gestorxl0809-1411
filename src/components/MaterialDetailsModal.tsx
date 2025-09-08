import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Package, DollarSign, Target, Clock } from 'lucide-react';

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

interface MaterialDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: MaterialStock | null;
  totalWeight: number;
}

const MaterialDetailsModal = ({ open, onOpenChange, material, totalWeight }: MaterialDetailsModalProps) => {
  if (!material) return null;

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
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const percentage = totalWeight > 0 ? (material.currentStock / totalWeight * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes do Material: {material.materialName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cards de Informações Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-blue-900 border-blue-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Peso em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-100">
                  {formatWeight(material.currentStock)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-900 border-green-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Percentual do Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-100 mb-2">
                  {percentage.toFixed(1)}%
                </div>
                <Progress value={percentage} className="h-2" />
              </CardContent>
            </Card>

            <Card className="bg-purple-900 border-purple-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Transações no Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-100">
                  {material.transactions.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Preços e Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-yellow-900 border-yellow-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Preço de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-yellow-100">
                  {formatCurrency(material.purchasePrice)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-900 border-orange-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Preço de Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-100">
                  {formatCurrency(material.salePrice)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-900 border-indigo-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-indigo-100">
                  {formatCurrency(material.totalValue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-900 border-emerald-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Projeção de Lucro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-100">
                  {formatCurrency(material.profitProjection)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Transações */}
          {material.transactions.length > 0 && (
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Transações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {material.transactions.map((transaction, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        transaction.type === 'compra' 
                          ? 'bg-green-900/50 border border-green-700' 
                          : 'bg-red-900/50 border border-red-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-col">
                          <span className={`font-medium ${
                            transaction.type === 'compra' ? 'text-green-200' : 'text-red-200'
                          }`}>
                            {transaction.type === 'compra' ? 'Compra' : 'Venda'}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:text-right">
                          <span className="text-white font-medium">
                            {formatWeight(transaction.quantity)}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {formatCurrency(transaction.price)}/kg
                          </span>
                          <span className="text-white font-bold">
                            {formatCurrency(transaction.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialDetailsModal;