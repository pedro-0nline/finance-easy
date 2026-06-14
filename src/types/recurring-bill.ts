export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number;
  created_at: string;
  last_generated_date: string | null;
}

export interface MonthlyBill {
  id: string;
  recurring_bill_id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}