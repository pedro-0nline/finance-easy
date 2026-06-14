export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SharedExpense {
  id: string;
  owner_id: string;
  shared_with: string;
  bill_id: string;
  split_percentage: number;
  status: 'pending' | 'accepted' | 'rejected' | 'paid';
  created_at: string;
}