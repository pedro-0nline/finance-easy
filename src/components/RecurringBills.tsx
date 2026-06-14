import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, addMonths, isAfter, startOfDay } from 'date-fns';
import { RecurringBill, MonthlyBill } from '../types/recurring-bill';
import { Category } from '../types/category';
import { PlusCircle, Calendar, DollarSign, Check, X, Loader2, Bell, RotateCcw, Trash2, Tag, Plus } from 'lucide-react';

export function RecurringBills() {
  const [recurringBills, setRecurringBills] = useState<(RecurringBill & { category: Category | null })[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_day: '1',
    category_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchRecurringBills(),
        fetchMonthlyBills(),
        fetchCategories()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecurringBills = async () => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRecurringBills(data || []);
  };

  const fetchMonthlyBills = async () => {
    const { data, error } = await supabase
      .from('monthly_bills')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    setMonthlyBills(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const { data: bill, error: billError } = await supabase
        .from('recurring_bills')
        .insert({
          name: formData.name,
          amount: parseFloat(formData.amount),
          due_day: parseInt(formData.due_day),
          category_id: formData.category_id || null,
          user_id: user.data.user.id
        })
        .select()
        .single();

      if (billError) throw billError;

      setFormData({
        name: '',
        amount: '',
        due_day: '1',
        category_id: ''
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCurrentMonthBill = async (recurringBill: RecurringBill) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const today = new Date();
      const dueDate = format(new Date(today.getFullYear(), today.getMonth(), recurringBill.due_day), 'yyyy-MM-dd');

      const { error } = await supabase.rpc('generate_monthly_bills_bypass_rls', {
        p_recurring_bill_id: recurringBill.id,
        p_user_id: user.data.user.id,
        p_name: recurringBill.name,
        p_amount: recurringBill.amount,
        p_due_date: dueDate
      });

      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const generateMonthlyBills = async (recurringBill: RecurringBill) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const today = startOfDay(new Date());
      const nextThreeMonths = Array.from({ length: 3 }, (_, i) => {
        const date = addMonths(today, i);
        return format(new Date(date.getFullYear(), date.getMonth(), recurringBill.due_day), 'yyyy-MM-dd');
      });

      for (const dueDate of nextThreeMonths) {
        const { error } = await supabase.rpc('generate_monthly_bills_bypass_rls', {
          p_recurring_bill_id: recurringBill.id,
          p_user_id: user.data.user.id,
          p_name: recurringBill.name,
          p_amount: recurringBill.amount,
          p_due_date: dueDate
        });

        if (error) throw error;
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleMonthlyBillPaid = async (monthlyBill: MonthlyBill) => {
    try {
      const { error } = await supabase
        .from('monthly_bills')
        .update({
          paid: !monthlyBill.paid,
          paid_at: !monthlyBill.paid ? new Date().toISOString() : null
        })
        .eq('id', monthlyBill.id);

      if (error) throw error;
      await fetchMonthlyBills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteRecurringBill = async (id: string) => {
    try {
      // First delete any shared expenses
      const { error: sharedExpensesError } = await supabase
        .from('shared_expenses')
        .delete()
        .eq('recurring_bill_id', id);

      if (sharedExpensesError) throw sharedExpensesError;

      // Then delete monthly bills
      const { error: monthlyBillsError } = await supabase
        .from('monthly_bills')
        .delete()
        .eq('recurring_bill_id', id);

      if (monthlyBillsError) throw monthlyBillsError;

      // Finally delete the recurring bill
      const { error: recurringBillError } = await supabase
        .from('recurring_bills')
        .delete()
        .eq('id', id);

      if (recurringBillError) throw recurringBillError;

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recurring Bills</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Recurring Bill
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button
            onClick={() => setError('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Bill Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category (Optional)</label>
            <select
              value={formData.category_id}
              onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">No Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Due Day (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.due_day}
              onChange={e => setFormData(prev => ({ ...prev, due_day: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Add Recurring Bill'
            )}
          </button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recurringBills.map(bill => {
          const billMonthlyBills = monthlyBills.filter(mb => mb.recurring_bill_id === bill.id);
          const currentMonth = new Date();
          const hasCurrentMonthBill = billMonthlyBills.some(mb => {
            const billDate = parseISO(mb.due_date);
            return billDate.getMonth() === currentMonth.getMonth() && 
                   billDate.getFullYear() === currentMonth.getFullYear();
          });

          return (
            <div key={bill.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{bill.name}</h3>
                  <p className="text-sm text-gray-600">
                    ${bill.amount.toFixed(2)} / month
                  </p>
                  <p className="text-sm text-gray-600">
                    Due day: {bill.due_day}
                  </p>
                  {bill.category && (
                    <div className="mt-1 flex items-center">
                      <Tag className="w-4 h-4 mr-1" style={{ color: bill.category.color }} />
                      <span className="text-sm text-gray-600">{bill.category.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!hasCurrentMonthBill && (
                    <button
                      onClick={() => generateCurrentMonthBill(bill)}
                      className="text-green-500 hover:text-green-600"
                      title="Add Current Month"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => generateMonthlyBills(bill)}
                    className="text-blue-500 hover:text-blue-600"
                    title="Generate Monthly Bills"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteRecurringBill(bill.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Delete Recurring Bill"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {billMonthlyBills.map(monthlyBill => (
                  <div
                    key={monthlyBill.id}
                    className="flex items-center justify-between text-sm border-t pt-2"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={monthlyBill.paid}
                        onChange={() => toggleMonthlyBillPaid(monthlyBill)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2">
                        Due: {format(parseISO(monthlyBill.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <span className={monthlyBill.paid ? 'text-green-600' : 'text-gray-600'}>
                      ${monthlyBill.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {recurringBills.length === 0 && !showForm && (
        <div className="text-center text-gray-500 py-8">
          No recurring bills yet. Add your first recurring bill to get started.
        </div>
      )}
    </div>
  );
}