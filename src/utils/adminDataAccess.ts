
import { supabase } from '@/integrations/supabase/client';
import { Order, CashRegister } from '@/types/pdv';

export const getOrdersForUser = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_orders', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }

    if (!data) return [];

    // Transform database format to frontend format
    return data.map((order: any) => ({
      id: order.id,
      customerId: order.customer_id,
      items: [], // This will need to be populated with order_items if needed
      total: order.total,
      timestamp: new Date(order.created_at).getTime(),
      status: order.status,
      type: order.type
    }));
  } catch (error) {
    console.error('Error in getOrdersForUser:', error);
    return [];
  }
};

export const getMaterialsForUser = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_user_materials', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user materials:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMaterialsForUser:', error);
    return [];
  }
};

export const getCashRegistersForUser = async (userId: string): Promise<CashRegister[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_cash_registers', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user cash registers:', error);
      return [];
    }

    if (!data) return [];

    // Transform database format to frontend format
    return data.map((register: any) => ({
      id: register.id,
      initialAmount: register.initial_amount,
      currentAmount: register.current_amount,
      transactions: [], // This will need to be populated if needed
      openingTimestamp: new Date(register.opening_timestamp).getTime(),
      closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
      status: register.status as 'open' | 'closed',
      finalAmount: register.final_amount
    }));
  } catch (error) {
    console.error('Error in getCashRegistersForUser:', error);
    return [];
  }
};

export const getActiveCashRegisterForUser = async (userId: string): Promise<CashRegister | null> => {
  try {
    const { data, error } = await supabase.rpc('get_user_active_cash_register', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching user active cash register:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const register = data[0];
    
    // Transform database format to frontend format
    return {
      id: register.id,
      initialAmount: register.initial_amount,
      currentAmount: register.current_amount,
      transactions: [], // This will need to be populated if needed
      openingTimestamp: new Date(register.opening_timestamp).getTime(),
      closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
      status: register.status as 'open' | 'closed',
      finalAmount: register.final_amount
    };
  } catch (error) {
    console.error('Error in getActiveCashRegisterForUser:', error);
    return null;
  }
};
