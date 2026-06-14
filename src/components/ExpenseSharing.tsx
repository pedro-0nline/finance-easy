import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SharedExpense } from '../types/category';
import { Bill } from '../types/bill';
import { RecurringBill } from '../types/recurring-bill';
import { Users, Check, X, Loader2, DollarSign, Bell } from 'lucide-react';

export function ExpenseSharing() {
  const [sharedExpenses, setSharedExpenses] = useState<SharedExpense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bill_id: '',
    recurring_bill_id: '',
    shared_with_email: '',
    split_percentage: '50',
    type: 'bill' as 'bill' | 'recurring'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      // Get shared expenses with bill and recurring bill details
      const { data: expensesData, error: expensesError } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          bill:bills(name, installment_amount),
          recurring_bill:recurring_bills(name, amount)
        `)
        .or(`owner_id.eq.${user.data.user.id},shared_with.eq.${user.data.user.id}`);

      if (expensesError) throw expensesError;

      // Get user details for each shared expense
      const expensesWithUsers = await Promise.all((expensesData || []).map(async (expense) => {
        const { data: userData } = await supabase
          .rpc('lookup_user_by_email', {
            lookup_email: expense.shared_with_email
          });
        
        return {
          ...expense,
          shared_user: userData
        };
      }));

      // Get available bills and recurring bills for sharing
      const [billsResponse, recurringResponse] = await Promise.all([
        supabase
          .from('bills')
          .select('*')
          .eq('status', 'pending')
          .eq('user_id', user.data.user.id),
        supabase
          .from('recurring_bills')
          .select('*')
          .eq('user_id', user.data.user.id)
      ]);

      if (billsResponse.error) throw billsResponse.error;
      if (recurringResponse.error) throw recurringResponse.error;

      setSharedExpenses(expensesWithUsers);
      setBills(billsResponse.data || []);
      setRecurringBills(recurringResponse.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      if (formData.type === 'recurring') {
        // Share recurring bill
        const { error } = await supabase.rpc('share_recurring_bill', {
          p_recurring_bill_id: formData.recurring_bill_id,
          p_shared_with_email: formData.shared_with_email,
          p_split_percentage: parseFloat(formData.split_percentage)
        });

        if (error) throw error;
      } else {
        // Share regular bill
        const { data: userData, error: userError } = await supabase
          .rpc('lookup_user_by_email', {
            lookup_email: formData.shared_with_email
          });

        if (userError || !userData?.[0]) {
          throw new Error('User not found. Please check the email address.');
        }

        const { error } = await supabase
          .from('shared_expenses')
          .insert({
            bill_id: formData.bill_id,
            shared_with: userData[0].id,
            shared_with_email: formData.shared_with_email,
            split_percentage: parseFloat(formData.split_percentage),
            status: 'pending',
            owner_id: user.data.user.id
          });

        if (error) throw error;
      }

      setFormData({
        bill_id: '',
        recurring_bill_id: '',
        shared_with_email: '',
        split_percentage: '50',
        type: 'bill'
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateExpenseStatus = async (id: string, status: 'accepted' | 'rejected' | 'paid') => {
    try {
      const { error } = await supabase
        .from('shared_expenses')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
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

  const pendingExpenses = sharedExpenses.filter(exp => exp.status === 'pending');
  const activeExpenses = sharedExpenses.filter(exp => exp.status === 'accepted');
  const paidExpenses = sharedExpenses.filter(exp => exp.status === 'paid');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shared Expenses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Users className="w-5 h-5 mr-2" />
          Share Expense
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
            <label className="block text-sm font-medium text-gray-700">Expense Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'bill' | 'recurring' }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="bill">One-time Bill</option>
              <option value="recurring">Recurring Bill</option>
            </select>
          </div>

          {formData.type === 'bill' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Bill</label>
              <select
                value={formData.bill_id}
                onChange={e => setFormData(prev => ({ ...prev, bill_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a bill</option>
                {bills.map(bill => (
                  <option key={bill.id} value={bill.id}>
                    {bill.name} - ${bill.installment_amount.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">Recurring Bill</label>
              <select
                value={formData.recurring_bill_id}
                onChange={e => setFormData(prev => ({ ...prev, recurring_bill_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a recurring bill</option>
                {recurringBills.map(bill => (
                  <option key={bill.id} value={bill.id}>
                    {bill.name} - ${bill.amount.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Share with (email)</label>
            <input
              type="email"
              value={formData.shared_with_email}
              onChange={e => setFormData(prev => ({ ...prev, shared_with_email: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Split Percentage</label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.split_percentage}
              onChange={e => setFormData(prev => ({ ...prev, split_percentage: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Share Expense
          </button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Pending Requests</h3>
          <div className="space-y-4">
            {pendingExpenses.map(expense => (
              <div key={expense.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold flex items-center">
                      {expense.recurring_bill_id ? (
                        <Bell className="w-4 h-4 mr-1 text-blue-500" />
                      ) : null}
                      {expense.recurring_bill?.name || expense.bill?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Split {expense.split_percentage}% with {expense.shared_with_email}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateExpenseStatus(expense.id, 'accepted')}
                      className="text-green-500 hover:text-green-600"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateExpenseStatus(expense.id, 'rejected')}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingExpenses.length === 0 && (
              <p className="text-gray-500 text-center">No pending requests</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Active Shared Expenses</h3>
          <div className="space-y-4">
            {activeExpenses.map(expense => (
              <div key={expense.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold flex items-center">
                      {expense.recurring_bill_id ? (
                        <Bell className="w-4 h-4 mr-1 text-blue-500" />
                      ) : null}
                      {expense.recurring_bill?.name || expense.bill?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Split {expense.split_percentage}% with {expense.shared_with_email}
                    </p>
                  </div>
                  <button
                    onClick={() => updateExpenseStatus(expense.id, 'paid')}
                    className="flex items-center text-green-500 hover:text-green-600"
                  >
                    <DollarSign className="w-5 h-5 mr-1" />
                    Mark as Paid
                  </button>
                </div>
              </div>
            ))}
            {activeExpenses.length === 0 && (
              <p className="text-gray-500 text-center">No active shared expenses</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Paid Shared Expenses</h3>
        <div className="space-y-4">
          {paidExpenses.map(expense => (
            <div key={expense.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold flex items-center">
                    {expense.recurring_bill_id ? (
                      <Bell className="w-4 h-4 mr-1 text-blue-500" />
                    ) : null}
                    {expense.recurring_bill?.name || expense.bill?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Split {expense.split_percentage}% with {expense.shared_with_email} • Paid
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            </div>
          ))}
          {paidExpenses.length === 0 && (
            <p className="text-gray-500 text-center">No paid shared expenses</p>
          )}
        </div>
      </div>
    </div>
  );
}