
import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { useAuth } from './useAuth';
import { getCanonicalKey, areMaterialsEquivalent } from '@/utils/materialNormalization';
import { roundToThreeDecimals } from '@/utils/numericComparison';

export const useStockCalculation = () => {
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockCache, setStockCache] = useState<Map<string, { stock: number; timestamp: number }>>(new Map());
  const { user } = useAuth();

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const calculateMaterialStock = useCallback(async (materialName: string): Promise<number> => {
    if (!user || !materialName) return 0;

    const canonicalKey = getCanonicalKey(materialName);
    
    // Check cache first
    const cached = stockCache.get(canonicalKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.stock;
    }

    setIsLoadingStock(true);

    try {
      // Optimized query: get order_items directly with joins
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          material_name,
          quantity,
          orders!inner(
            type,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('orders.status', 'completed');

      if (error) {
        console.error('Error fetching order items:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar dados do estoque",
          variant: "destructive",
          duration: 3000,
        });
        return 0;
      }

      let totalCompras = 0;
      let totalVendas = 0;

      orderItems?.forEach(item => {
        // Use intelligent material matching
        if (areMaterialsEquivalent(item.material_name, materialName)) {
          const quantity = item.quantity || 0;
          if (item.orders.type === 'compra') {
            totalCompras += quantity;
          } else if (item.orders.type === 'venda') {
            totalVendas += quantity;
          }
        }
      });

      const estoqueAtual = roundToThreeDecimals(totalCompras - totalVendas);
      const finalStock = Math.max(0, estoqueAtual);
      
      // Update cache
      setStockCache(prev => new Map(prev.set(canonicalKey, {
        stock: finalStock,
        timestamp: Date.now()
      })));

      return finalStock;

    } catch (error) {
      console.error('Error calculating stock:', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular estoque",
        variant: "destructive",
        duration: 3000,
      });
      return 0;
    } finally {
      setIsLoadingStock(false);
    }
  }, [user, stockCache]);

  // Clear cache when user changes
  const clearCache = useCallback(() => {
    setStockCache(new Map());
  }, []);

  // Get all stock for multiple materials efficiently
  const calculateMultipleMaterialsStock = useCallback(async (materialNames: string[]): Promise<Record<string, number>> => {
    if (!user || !materialNames.length) return {};

    const result: Record<string, number> = {};
    
    try {
      // Get all order items at once
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select(`
          material_name,
          quantity,
          orders!inner(
            type,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('orders.status', 'completed');

      if (error) throw error;

      // Calculate stock for each requested material
      materialNames.forEach(materialName => {
        const canonicalKey = getCanonicalKey(materialName);
        
        let totalCompras = 0;
        let totalVendas = 0;

        orderItems?.forEach(item => {
          if (areMaterialsEquivalent(item.material_name, materialName)) {
            const quantity = item.quantity || 0;
            if (item.orders.type === 'compra') {
              totalCompras += quantity;
            } else if (item.orders.type === 'venda') {
              totalVendas += quantity;
            }
          }
        });

        const stock = Math.max(0, roundToThreeDecimals(totalCompras - totalVendas));
        result[materialName] = stock;
        
        // Update cache
        setStockCache(prev => new Map(prev.set(canonicalKey, {
          stock,
          timestamp: Date.now()
        })));
      });

      return result;
    } catch (error) {
      console.error('Error calculating multiple materials stock:', error);
      return {};
    }
  }, [user]);

  return {
    calculateMaterialStock,
    calculateMultipleMaterialsStock,
    isLoadingStock,
    clearCache
  };
};
