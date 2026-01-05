
// Export all functions from supabaseStorage for backward compatibility
export * from './supabaseStorage';

// Import necessary functions
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order } from '../types/pdv';
import { saveOrder, saveCustomer, getOrders, getCustomers, setActiveCustomer, setActiveOrder } from './supabaseStorage';

// Clear any potentially corrupted auto-save data
export const clearCorruptedData = () => {
  localStorage.removeItem('pdv_temp_session');
  localStorage.removeItem('pdv_active_order');
  localStorage.removeItem('pdv_active_customer');
  console.log('Cleared potentially corrupted auto-save data');
};

// Session validation utilities
export const validateSessionData = (data: any): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  // Validate order structure
  if (data.activeOrder) {
    const order = data.activeOrder;
    if (!order.id || !order.customerId || !Array.isArray(order.items)) {
      console.warn('Invalid order structure detected, clearing session');
      return false;
    }
    
    // Validate each item in the order
    for (const item of order.items) {
      if (!item.materialId || !item.materialName || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        console.warn('Invalid order item detected, clearing session');
        return false;
      }
    }
  }
  
  return true;
};

// Auto-save session data to Supabase with robust error handling
export const autoSaveSessionData = async (customer: Customer | null, order: Order | null) => {
  try {
    if (!customer || !order) {
      console.log('No customer or order to save');
      return;
    }

    console.log('Auto-saving session data to Supabase:', {
      customerId: customer.id,
      orderID: order.id,
      orderItemsCount: order.items.length,
      orderTotal: order.total
    });

    // Save customer and order to Supabase
    await Promise.all([
      saveCustomer(customer),
      saveOrder(order)
    ]);

    // Set as active in Supabase
    await Promise.all([
      setActiveCustomer(customer),
      setActiveOrder(order)
    ]);

    console.log('Session data auto-saved successfully');
  } catch (error) {
    console.error('Error auto-saving session data:', error);
    // Don't throw error to avoid breaking the UI
  }
};

// Restore open orders from Supabase
export const restoreOpenOrdersFromSupabase = async (): Promise<{ customers: Customer[], activeCustomer: Customer | null, activeOrder: Order | null }> => {
  try {
    console.log('Restoring open orders from Supabase...');
    
    // Get all customers and orders from Supabase
    const [customersFromSupabase, ordersFromSupabase] = await Promise.all([
      getCustomers(),
      getOrders()
    ]);

    console.log('Loaded from Supabase:', {
      customersCount: customersFromSupabase.length,
      ordersCount: ordersFromSupabase.length
    });

    // Filter only open orders
    const openOrders = ordersFromSupabase.filter(order => order.status === 'open');
    console.log('Found open orders:', openOrders.length);

    // Build customers with their open orders and clean material names
    const { cleanMaterialName } = await import('./materialNameCleaner');
    const customersWithOpenOrders = customersFromSupabase.map(customer => {
      const customerOrders = openOrders.filter(order => order.customerId === customer.id);
      // Clean material names in each order's items
      const cleanedOrders = customerOrders.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          materialName: cleanMaterialName(item.materialName)
        }))
      }));
      return {
        ...customer,
        orders: cleanedOrders
      };
    }).filter(customer => customer.orders.length > 0);

    console.log('Customers with open orders:', customersWithOpenOrders.length);

    // Try to restore active customer and order
    let activeCustomer: Customer | null = null;
    let activeOrder: Order | null = null;

    if (customersWithOpenOrders.length > 0) {
      // Get the most recent open order
      const mostRecentOrder = openOrders.reduce((latest, current) => {
        return current.timestamp > latest.timestamp ? current : latest;
      });

      activeCustomer = customersWithOpenOrders.find(c => c.id === mostRecentOrder.customerId) || null;
      activeOrder = mostRecentOrder;
    }

    console.log('Restored session:', {
      activeCustomer: activeCustomer?.name || 'none',
      activeOrder: activeOrder?.id || 'none',
      activeOrderItems: activeOrder?.items.length || 0
    });

    return {
      customers: customersWithOpenOrders,
      activeCustomer,
      activeOrder
    };
  } catch (error) {
    console.error('Error restoring open orders from Supabase:', error);
    return {
      customers: [],
      activeCustomer: null,
      activeOrder: null
    };
  }
};

// Save session data with automatic sync
export const saveSessionData = async (customer: Customer | null, order: Order | null) => {
  await autoSaveSessionData(customer, order);
};

// Restore session data from Supabase
export const restoreSessionData = async () => {
  return await restoreOpenOrdersFromSupabase();
};

// Additional cash register functions that were missing
export const addCashToRegister = async (amount: number, description?: string) => {
  const { addCashToRegister: supabaseAddCash } = await import('./supabaseStorage');
  return await supabaseAddCash(amount, description);
};

export const addExpenseToCashRegister = async (amount: number, description: string) => {
  const { addExpenseToCashRegister: supabaseAddExpense } = await import('./supabaseStorage');
  return await supabaseAddExpense(amount, description);
};

export const closeActiveCashRegister = async (finalAmount: number) => {
  const { closeActiveCashRegister: supabaseCloseCash } = await import('./supabaseStorage');
  return await supabaseCloseCash(finalAmount);
};

export const calculateCashSummary = async (cashRegister: any) => {
  const { calculateCashSummary: supabaseCalculateSummary } = await import('./supabaseStorage');
  return await supabaseCalculateSummary(cashRegister);
};
