export interface Receipt {
  id: string;
  amount: number;
  reference_month: string;
  file_url: string;
  description: string;
  created_at: string;
  user_id: string;
  category_id?: string;
  type: 'income' | 'expense';
}