export interface Bill {
  id: string;
  user_id: string;
  name: string;
  installment_amount: number;
  installments: number;
  due_date: string;
  status: 'pending' | 'paid';
  created_at: string;
}

export interface BillInstallment {
  id: string;
  bill_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
}