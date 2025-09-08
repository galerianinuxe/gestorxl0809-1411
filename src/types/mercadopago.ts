export interface PaymentFormData {
  name: string;
  phone: string;
  email: string;
  cpf: string;
}

export interface PlanData {
  id: string;
  name: string;
  price: string;
  amount: number;
}

export interface PixPaymentResponse {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  status: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'cancelled' | 'rejected';
  status_detail?: string;
}