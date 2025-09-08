
import { supabase } from '@/integrations/supabase/client';
import { Customer, Order, Material, CashRegister, CashTransaction, CashSummary } from '../types/pdv';
import { cleanMaterialName, cleanOrderItemNames } from './materialNameCleaner';
import { createLogger } from './logger';

// Create logger for this module
const logger = createLogger('[Storage]');

// Helper function to ensure user is authenticated
const ensureAuthenticated = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  return userData.user;
};

// Helper function to generate UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Customer functions
export const getCustomers = async (): Promise<Customer[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return data?.map(customer => ({
    id: customer.id,
    name: customer.name,
    orders: [] // Orders are handled separately
  })) || [];
};

export const saveCustomer = async (customer: Omit<Customer, 'orders'>): Promise<void> => {
  const user = await ensureAuthenticated();

  const customerData = {
    id: customer.id,
    name: customer.name,
    user_id: user.id
  };

  const { error } = await supabase
    .from('customers')
    .upsert(customerData);
  
  if (error) {
    console.error('Error saving customer:', error);
    throw error;
  }
};

export const removeCustomer = async (customerId: string): Promise<void> => {
  const user = await ensureAuthenticated();
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error removing customer:', error);
    throw error;
  }
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching customer:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    orders: []
  } : undefined;
};

// Order functions - CRITICAL FIX: Always filter by user_id and preserve exact material names
export const getOrders = async (): Promise<Order[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  
  // Process orders data (reduced logging)
  logger.debug('Processing orders data:', data.length, 'orders');
  
  return data?.map(order => {
    return {
      id: order.id,
      customerId: order.customer_id,
      type: order.type as 'venda' | 'compra',
      status: order.status as 'open' | 'completed',
      total: Number(order.total),
      items: order.order_items?.map((item: any) => {
        // Use material_name exactly as stored, with cleaning for trailing zeros
        const exactMaterialName = item.material_name;
        const cleanedMaterialName = cleanMaterialName(exactMaterialName);
        
        // Log cleaning only if name was actually changed (dev only)
        if (exactMaterialName !== cleanedMaterialName) {
          logger.debug('Material name cleaned:', {
            original: exactMaterialName,
            cleaned: cleanedMaterialName
          });
        }
        
        return {
          materialId: item.material_id,
          materialName: cleanedMaterialName,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.total),
          tara: Number(item.tara || 0)
        };
      }) || [],
      timestamp: new Date(order.created_at).getTime()
    };
  }) || [];
};

export const saveOrder = async (order: Order): Promise<void> => {
  const user = await ensureAuthenticated();

  try {
    console.log('SAVING ORDER - Full order object:', order);
    
    // Save order with user_id to ensure isolation
    const orderData = {
      id: order.id,
      customer_id: order.customerId,
      type: order.type,
      status: order.status,
      total: order.total,
      user_id: user.id // CRITICAL: Always set user_id
    };

    console.log('Order data being saved:', orderData);

    const { error: orderError } = await supabase
      .from('orders')
      .upsert(orderData);
    
    if (orderError) throw orderError;

    // Delete existing order items for this order and user
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id)
      .eq('user_id', user.id);

    // Save order items with user_id - CRITICAL FIX: Preserve material name exactly as provided
    if (order.items.length > 0) {
      const orderItems = order.items.map(item => {
        console.log('SAVING ORDER ITEM - Original item:', item);
        console.log('SAVING ORDER ITEM - Material name details:', {
          materialName: item.materialName,
          materialNameType: typeof item.materialName,
          materialNameStringified: JSON.stringify(item.materialName),
          materialId: item.materialId
        });
        
        // CRITICAL FIX: Use the material name EXACTLY as provided - no processing at all
        const exactMaterialName = item.materialName;
        
        console.log('EXACT MATERIAL NAME FOR SAVE:', {
          original: item.materialName,
          exact: exactMaterialName,
          areIdentical: item.materialName === exactMaterialName,
          originalStringified: JSON.stringify(item.materialName),
          exactStringified: JSON.stringify(exactMaterialName)
        });
        
        const itemToSave = {
          order_id: order.id,
          material_id: item.materialId,
          material_name: exactMaterialName, // CRITICAL: Use exact material name with no processing
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          tara: item.tara || 0,
          user_id: user.id // CRITICAL: Always set user_id
        };
        
        console.log('ITEM BEING SAVED TO DATABASE:', itemToSave);
        return itemToSave;
      });

      console.log('ALL ORDER ITEMS BEING SAVED:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error saving order items:', itemsError);
        throw itemsError;
      }
      
      // Order items saved (dev only)
      if (import.meta.env.DEV) console.log('ORDER ITEMS SAVED SUCCESSFULLY');
    }

    // Handle cash register updates for completed orders
    if (order.status === 'completed') {
      const activeCashRegister = await getActiveCashRegister();
      if (activeCashRegister && activeCashRegister.status === 'open') {
        const customer = await getCustomerById(order.customerId);
        
        const transaction = {
          id: generateUUID(),
          cash_register_id: activeCashRegister.id,
          type: order.type === 'venda' ? 'sale' : 'purchase',
          amount: order.total,
          order_id: order.id,
          description: order.type === 'venda' 
            ? `Venda para ${customer?.name || 'Cliente'}`
            : `Compra de ${customer?.name || 'Cliente'}`,
          user_id: user.id
        };

        await supabase.from('cash_transactions').insert(transaction);

        // Update cash register amount
        const newAmount = order.type === 'venda' 
          ? activeCashRegister.currentAmount + order.total
          : activeCashRegister.currentAmount - order.total;

        await supabase
          .from('cash_registers')
          .update({ current_amount: newAmount })
          .eq('id', activeCashRegister.id)
          .eq('user_id', user.id);
      }
    }
  } catch (error) {
    console.error('Error saving order:', error);
    throw error;
  }
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (*)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching order:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    customerId: data.customer_id,
    type: data.type as 'venda' | 'compra',
    status: data.status as 'open' | 'completed',
    total: Number(data.total),
    items: data.order_items?.map((item: any) => ({
      materialId: item.material_id,
      materialName: cleanMaterialName(item.material_name), // Clean material name on restore
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number(item.total),
      tara: Number(item.tara || 0)
    })) || [],
    timestamp: new Date(data.created_at).getTime()
  } : undefined;
};

// Material functions
export const getMaterials = async (): Promise<Material[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  
  if (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
  
  return data?.map(material => ({
    id: material.id,
    name: material.name,
    price: Number(material.price),
    salePrice: Number(material.sale_price),
    unit: material.unit || 'kg',
    user_id: material.user_id || user.id
  })) || [];
};

export const saveMaterial = async (material: Material): Promise<void> => {
  const user = await ensureAuthenticated();

  console.log('Saving material with data:', material);

  // Validate and generate UUID if needed
  let materialId = material.id;
  if (!materialId || !isValidUUID(materialId)) {
    materialId = generateUUID();
    console.log('Generated new UUID for material:', materialId);
  }

  // Check if material with same name already exists for this user (excluding current material ID)
  const { data: existingMaterials, error: checkError } = await supabase
    .from('materials')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('name', material.name.trim())
    .neq('id', materialId);

  if (checkError) {
    console.error('Error checking existing materials:', checkError);
    throw checkError;
  }

  if (existingMaterials && existingMaterials.length > 0) {
    throw new Error(`Material com nome "${material.name.trim()}" já existe.`);
  }

  const materialData = {
    id: materialId,
    name: material.name.trim(),
    price: Number(material.price),
    sale_price: Number(material.salePrice),
    unit: material.unit || 'kg',
    user_id: user.id
  };

  console.log('Material data to save:', materialData);

  const { error } = await supabase
    .from('materials')
    .upsert(materialData, {
      onConflict: 'id'
    });
  
  if (error) {
    console.error('Error saving material:', error);
    throw error;
  }

  console.log('Material saved successfully');
};

export const removeMaterial = async (materialId: string): Promise<void> => {
  const user = await ensureAuthenticated();
  
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)
    .eq('user_id', user.id);
  
  if (error) {
    console.error('Error removing material:', error);
    throw error;
  }
};

export const getMaterialById = async (id: string): Promise<Material | undefined> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    console.error('Error fetching material:', error);
    return undefined;
  }
  
  return data ? {
    id: data.id,
    name: data.name,
    price: Number(data.price),
    salePrice: Number(data.sale_price),
    unit: data.unit || 'kg',
    user_id: data.user_id || user.id
  } : undefined;
};

// Cash register functions - CRITICAL FIX: Always filter by user_id
export const getCashRegisters = async (): Promise<CashRegister[]> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('cash_registers')
    .select(`
      *,
      cash_transactions (*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching cash registers:', error);
    return [];
  }
  
  return data?.map(register => ({
    id: register.id,
    initialAmount: Number(register.initial_amount),
    currentAmount: Number(register.current_amount),
    transactions: register.cash_transactions?.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type as any,
      amount: Number(transaction.amount),
      timestamp: new Date(transaction.created_at).getTime(),
      orderId: transaction.order_id,
      description: transaction.description
    })) || [],
    openingTimestamp: new Date(register.opening_timestamp || register.created_at).getTime(),
    closingTimestamp: register.closing_timestamp ? new Date(register.closing_timestamp).getTime() : undefined,
    status: register.status as 'open' | 'closed',
    finalAmount: register.final_amount ? Number(register.final_amount) : undefined
  })) || [];
};

export const getActiveCashRegister = async (): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('cash_registers')
    .select(`
      *,
      cash_transactions (*)
    `)
    .eq('status', 'open')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching active cash register:', error);
    return null;
  }
  
  return data ? {
    id: data.id,
    initialAmount: Number(data.initial_amount),
    currentAmount: Number(data.current_amount),
    transactions: data.cash_transactions?.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type as any,
      amount: Number(transaction.amount),
      timestamp: new Date(transaction.created_at).getTime(),
      orderId: transaction.order_id,
      description: transaction.description
    })) || [],
    openingTimestamp: new Date(data.opening_timestamp || data.created_at).getTime(),
    closingTimestamp: data.closing_timestamp ? new Date(data.closing_timestamp).getTime() : undefined,
    status: data.status as 'open' | 'closed',
    finalAmount: data.final_amount ? Number(data.final_amount) : undefined
  } : null;
};

export const openCashRegister = async (initialAmount: number): Promise<CashRegister> => {
  const user = await ensureAuthenticated();

  // Close any existing open register for this user
  await supabase
    .from('cash_registers')
    .update({ 
      status: 'closed',
      closing_timestamp: new Date().toISOString()
    })
    .eq('status', 'open')
    .eq('user_id', user.id);

  // Create new register with proper UUID
  const registerId = generateUUID();
  const { error: registerError } = await supabase
    .from('cash_registers')
    .insert({
      id: registerId,
      initial_amount: initialAmount,
      current_amount: initialAmount,
      status: 'open',
      user_id: user.id
    });

  if (registerError) {
    console.error('Error creating cash register:', registerError);
    throw registerError;
  }

  // Create opening transaction with proper UUID
  const transactionId = generateUUID();
  const { error: transactionError } = await supabase
    .from('cash_transactions')
    .insert({
      id: transactionId,
      cash_register_id: registerId,
      type: 'opening',
      amount: initialAmount,
      description: 'Abertura de caixa',
      user_id: user.id
    });

  if (transactionError) {
    console.error('Error creating opening transaction:', transactionError);
    throw transactionError;
  }

  return {
    id: registerId,
    initialAmount,
    currentAmount: initialAmount,
    transactions: [{
      id: transactionId,
      type: 'opening',
      amount: initialAmount,
      timestamp: Date.now(),
      description: 'Abertura de caixa'
    }],
    openingTimestamp: Date.now(),
    status: 'open'
  };
};

export const hasSufficientFunds = async (amount: number, orderType: 'venda' | 'compra' = 'compra'): Promise<boolean> => {
  const register = await getActiveCashRegister();
  if (!register || register.status !== 'open') {
    return false;
  }
  
  if (orderType === 'venda') {
    return true;
  }
  
  return register.currentAmount >= amount;
};

// Active order and customer state (using localStorage for temporary session data only)
export const getActiveOrder = (): Order | null => {
  const data = localStorage.getItem('pdv_active_order');
  if (!data) return null;
  
  try {
    const order = JSON.parse(data);
    // Clean material names when restoring from localStorage
    if (order && order.items) {
      order.items = cleanOrderItemNames(order.items);
    }
    return order;
  } catch (error) {
    console.error('Error parsing active order from localStorage:', error);
    return null;
  }
};

export const setActiveOrder = (order: Order | null): void => {
  if (order) {
    localStorage.setItem('pdv_active_order', JSON.stringify(order));
  } else {
    localStorage.removeItem('pdv_active_order');
  }
};

export const getActiveCustomer = (): Customer | null => {
  const data = localStorage.getItem('pdv_active_customer');
  return data ? JSON.parse(data) : null;
};

export const setActiveCustomer = (customer: Customer | null): void => {
  if (customer) {
    localStorage.setItem('pdv_active_customer', JSON.stringify(customer));
  } else {
    localStorage.removeItem('pdv_active_customer');
  }
};

export const setActiveCashRegister = (register: CashRegister | null): void => {
  if (register) {
    localStorage.setItem('pdv_active_cash_register', JSON.stringify(register));
  } else {
    localStorage.removeItem('pdv_active_cash_register');
  }
};

// Clear session data when user logs out - CRITICAL for user isolation
export const clearUserSessionData = (): void => {
  localStorage.removeItem('pdv_active_order');
  localStorage.removeItem('pdv_active_customer');
  localStorage.removeItem('pdv_active_cash_register');
  localStorage.removeItem('pdv_temp_session');
  localStorage.removeItem('pdv_sale_mode');
};

// Remove the initializeData function as it's no longer needed
export const initializeData = () => {
  console.log('Data initialization is now handled by Supabase');
};

export const addCashToRegister = async (amount: number, description?: string): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  try {
    // Create addition transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'addition',
        amount: amount,
        description: description || 'Adição de saldo',
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Update cash register amount
    const newAmount = activeCashRegister.currentAmount + amount;
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ current_amount: newAmount })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return await getActiveCashRegister();
  } catch (error) {
    console.error('Error adding cash to register:', error);
    throw error;
  }
};

export const addExpenseToCashRegister = async (amount: number, description: string): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  if (activeCashRegister.currentAmount < amount) {
    throw new Error('Saldo insuficiente');
  }

  try {
    // Create expense transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'expense',
        amount: amount,
        description: description,
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Update cash register amount
    const newAmount = activeCashRegister.currentAmount - amount;
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ current_amount: newAmount })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return await getActiveCashRegister();
  } catch (error) {
    console.error('Error adding expense to register:', error);
    throw error;
  }
};

export const closeActiveCashRegister = async (finalAmount: number): Promise<CashRegister | null> => {
  const user = await ensureAuthenticated();
  const activeCashRegister = await getActiveCashRegister();
  
  if (!activeCashRegister || activeCashRegister.status !== 'open') {
    return null;
  }

  try {
    // Create closing transaction with proper UUID
    const transactionId = generateUUID();
    const { error: transactionError } = await supabase
      .from('cash_transactions')
      .insert({
        id: transactionId,
        cash_register_id: activeCashRegister.id,
        type: 'closing',
        amount: finalAmount,
        description: 'Fechamento de caixa',
        user_id: user.id
      });

    if (transactionError) throw transactionError;

    // Close the cash register
    const { error: updateError } = await supabase
      .from('cash_registers')
      .update({ 
        status: 'closed',
        closing_timestamp: new Date().toISOString(),
        final_amount: finalAmount
      })
      .eq('id', activeCashRegister.id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return {
      ...activeCashRegister,
      status: 'closed' as const,
      closingTimestamp: Date.now(),
      finalAmount: finalAmount
    };
  } catch (error) {
    console.error('Error closing cash register:', error);
    throw error;
  }
};

export const calculateCashSummary = async (cashRegister: CashRegister): Promise<CashSummary> => {
  const user = await ensureAuthenticated();
  
  const totalSales = cashRegister.transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalPurchases = cashRegister.transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalAdditions = cashRegister.transactions
    .filter(t => t.type === 'addition')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = cashRegister.transactions
    .filter(t => t.type === 'expense')
    .map(t => ({
      id: t.id,
      amount: t.amount,
      description: t.description,
      timestamp: t.timestamp
    }));
    
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate total weight from completed orders
  const orders = await getOrders();
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalWeight = completedOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  const expectedAmount = cashRegister.initialAmount + totalSales - totalPurchases + totalAdditions - totalExpenses;
  
  return {
    openingAmount: cashRegister.initialAmount,
    currentAmount: cashRegister.currentAmount,
    totalSales,
    totalPurchases,
    totalWeight,
    expectedAmount,
    finalAmount: cashRegister.finalAmount,
    expenses
  };
};
