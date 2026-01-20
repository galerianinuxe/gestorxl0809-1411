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
  cancelled?: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  refund_amount?: number;
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
  user_id: string;
  category_id?: string | null;
  is_default?: boolean;
}

export interface MaterialCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  hex_color?: string | null;
  display_order: number;
  is_system?: boolean;
  is_required?: boolean;
  is_active?: boolean;
  system_key?: string | null;
}

export interface UserMaterialSettings {
  id: string;
  user_id: string;
  use_categories: boolean;
}

export interface CashRegister {
  id: string;
  initialAmount: number;
  currentAmount: number;
  transactions: CashTransaction[];
  openingTimestamp: number;
  closingTimestamp?: number;
  status: 'open' | 'closed';
  finalAmount?: number;
  userName?: string;
  userEmail?: string;
}

export interface CashTransaction {
  id: string;
  type: 'opening' | 'closing' | 'sale' | 'purchase' | 'addition' | 'expense' | 'refund';
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
