export interface Customer {
  id: string;
  name: string;
  orders: Order[];
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  timestamp: number;
  status: 'open' | 'completed';
  type: 'compra' | 'venda';
}

export interface OrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  price: number;
  total: number;
  tara?: number;
}

export interface Material {
  id: string;
  name: string;
  price: number;
  salePrice: number;
  unit: string;
  user_id: string; // <-- Add this line to match the DB and fix the error
}

export interface CashRegister {
  id: string;
  initialAmount: number;
  currentAmount: number;
  transactions: CashTransaction[];
  openingTimestamp: number;
  closingTimestamp?: number;
  status: 'open' | 'closed';
  finalAmount?: number; // Add this property
}

export interface CashTransaction {
  id: string;
  type: 'opening' | 'closing' | 'sale' | 'purchase' | 'addition' | 'expense';
  amount: number;
  timestamp: number;
  description: string;
  orderId?: string;
}

export interface CashSummary {
  openingAmount: number;
  currentAmount: number;
  totalSales: number;
  totalPurchases: number; // Add this field
  totalWeight: number;
  expectedAmount: number;
  finalAmount?: number;
  expenses: {
    id: string;
    amount: number;
    description: string;
    timestamp: number;
  }[];
}
