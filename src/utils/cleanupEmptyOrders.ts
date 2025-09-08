import { getCustomers, saveCustomer, removeCustomer } from './supabaseStorage';
import { Customer } from '../types/pdv';

/**
 * Remove pedidos em aberto vazios (sem itens) que foram criados há mais de 5 minutos
 */
export const cleanupEmptyOrders = async (): Promise<void> => {
  try {
    console.log('Iniciando limpeza de pedidos vazios...');
    
    const customers = await getCustomers();
    const now = new Date();
    const fiveMinutesAgo = now.getTime() - (5 * 60 * 1000); // 5 minutos em milliseconds
    
    let cleanedCount = 0;
    
    for (const customer of customers) {
      // Filtrar pedidos em aberto que têm itens OU foram criados nos últimos 5 minutos
      const validOrders = customer.orders.filter(order => {
        if (order.status !== 'open') return true; // Manter todos os pedidos não-abertos
        
        const orderTime = new Date(order.timestamp).getTime();
        const hasItems = order.items && order.items.length > 0;
        const isRecent = orderTime > fiveMinutesAgo;
        
        // Manter o pedido se tem itens OU foi criado recentemente
        return hasItems || isRecent;
      });
      
      // Se removeu algum pedido, atualizar o cliente
      if (validOrders.length < customer.orders.length) {
        const removedOrdersCount = customer.orders.length - validOrders.length;
        cleanedCount += removedOrdersCount;
        
        if (validOrders.length === 0) {
          // Se o cliente não tem mais nenhum pedido, remove o cliente completamente
          console.log(`Removendo cliente ${customer.name} sem pedidos válidos`);
          await removeCustomer(customer.id);
        } else {
          // Atualizar cliente com pedidos válidos
          const updatedCustomer: Customer = {
            ...customer,
            orders: validOrders
          };
          
          console.log(`Atualizando cliente ${customer.name}, removidos ${removedOrdersCount} pedidos vazios`);
          await saveCustomer(updatedCustomer);
        }
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Limpeza concluída: ${cleanedCount} pedidos vazios removidos`);
    } else {
      console.log('Nenhum pedido vazio encontrado para remoção');
    }
    
  } catch (error) {
    console.error('Erro durante limpeza de pedidos vazios:', error);
  }
};

/**
 * Configura limpeza automática de pedidos vazios a cada 10 minutos
 */
export const setupAutoCleanup = (): (() => void) => {
  console.log('Configurando limpeza automática de pedidos vazios (a cada 10 minutos)');
  
  // Executar uma vez imediatamente
  cleanupEmptyOrders();
  
  // Configurar execução periódica a cada 10 minutos
  const intervalId = setInterval(() => {
    cleanupEmptyOrders();
  }, 10 * 60 * 1000); // 10 minutos
  
  // Retornar função para cancelar o interval
  return () => {
    console.log('Cancelando limpeza automática de pedidos vazios');
    clearInterval(intervalId);
  };
};