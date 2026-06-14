import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { Bill, BillInstallment } from '../types/bill';
import { Category } from '../types/category';
import { PlusCircle, Calendar, DollarSign, Check, X, Loader2, Bell, Tag, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function BillsManagement() {
  const { t } = useTranslation();
  const [bills, setBills] = useState<(Bill & { category: Category | null })[]>([]);
  const [installments, setInstallments] = useState<BillInstallment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    installment_amount: '',
    installments: '1',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    category_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchBills(),
        fetchInstallments(),
        fetchCategories()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setBills(data || []);
  };

  const fetchInstallments = async () => {
    const { data, error } = await supabase
      .from('bill_installments')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    setInstallments(data || []);
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
        .from('bills')
        .insert({
          name: formData.name,
          installment_amount: parseFloat(formData.installment_amount),
          installments: parseInt(formData.installments),
          due_date: formData.due_date,
          status: 'pending',
          category_id: formData.category_id || null,
          user_id: user.data.user.id
        })
        .select()
        .single();

      if (billError) throw billError;
      if (!bill) throw new Error('Failed to create bill');

      const installmentsToCreate = Array.from(
        { length: parseInt(formData.installments) },
        (_, i) => ({
          bill_id: bill.id,
          installment_number: i + 1,
          amount: parseFloat(formData.installment_amount),
          due_date: format(parseISO(formData.due_date), 'yyyy-MM-dd'),
          paid: false
        })
      );

      const { error: installmentsError } = await supabase
        .from('bill_installments')
        .insert(installmentsToCreate);

      if (installmentsError) throw installmentsError;

      setFormData({
        name: '',
        installment_amount: '',
        installments: '1',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        category_id: ''
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error creating bill:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleInstallmentPaid = async (installment: BillInstallment) => {
    try {
      const { error: updateError } = await supabase
        .from('bill_installments')
        .update({
          paid: !installment.paid,
          paid_at: !installment.paid ? new Date().toISOString() : null
        })
        .eq('id', installment.id);

      if (updateError) throw updateError;

      const { data: billInstallments, error: fetchError } = await supabase
        .from('bill_installments')
        .select('paid')
        .eq('bill_id', installment.bill_id);

      if (fetchError) throw fetchError;

      const allPaid = billInstallments?.every(i => i.paid);
      
      const { error: statusError } = await supabase
        .from('bills')
        .update({ status: allPaid ? 'paid' : 'pending' })
        .eq('id', installment.bill_id);

      if (statusError) throw statusError;

      await fetchData();
    } catch (err: any) {
      console.error('Error toggling installment:', err);
      setError(err.message);
    }
  };

  const markBillAsPaid = async (billId: string) => {
    try {
      const { error: installmentsError } = await supabase
        .from('bill_installments')
        .update({
          paid: true,
          paid_at: new Date().toISOString()
        })
        .eq('bill_id', billId);

      if (installmentsError) throw installmentsError;

      const { error: billError } = await supabase
        .from('bills')
        .update({ status: 'paid' })
        .eq('id', billId);

      if (billError) throw billError;

      await fetchData();
    } catch (err: any) {
      console.error('Error marking bill as paid:', err);
      setError(err.message);
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      // First delete all installments
      const { error: installmentsError } = await supabase
        .from('bill_installments')
        .delete()
        .eq('bill_id', billId);

      if (installmentsError) throw installmentsError;

      // Then delete the bill
      const { error: billError } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId);

      if (billError) throw billError;

      await fetchData();
    } catch (err: any) {
      console.error('Error deleting bill:', err);
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

  const pendingBills = bills.filter(bill => bill.status === 'pending');
  const paidBills = bills.filter(bill => bill.status === 'paid');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('bills.title')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          {t('bills.addBill')}
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
            <label className="block text-sm font-medium text-gray-700">Installment Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.installment_amount}
              onChange={e => setFormData(prev => ({ ...prev, installment_amount: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Installments</label>
            <input
              type="number"
              min="1"
              value={formData.installments}
              onChange={e => setFormData(prev => ({ ...prev, installments: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">First Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={e => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
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
              'Add Bill'
            )}
          </button>
        </form>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{t('bills.pendingBills')}</h3>
          <div className="space-y-4">
            {pendingBills.map(bill => {
              const billInstallments = installments.filter(i => i.bill_id === bill.id);
              const totalAmount = bill.installment_amount * bill.installments;
              return (
                <div key={bill.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{bill.name}</h4>
                      <p className="text-sm text-gray-600">
                        ${bill.installment_amount.toFixed(2)} × {bill.installments} = ${totalAmount.toFixed(2)}
                      </p>
                      {bill.category && (
                        <div className="mt-1 flex items-center">
                          <Tag className="w-4 h-4 mr-1" style={{ color: bill.category.color }} />
                          <span className="text-sm text-gray-600">{bill.category.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markBillAsPaid(bill.id)}
                        className="text-green-600 hover:text-green-700"
                        title={t('common.save')}
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-red-600 hover:text-red-700"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {billInstallments.map(installment => (
                      <div key={installment.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={installment.paid}
                            onChange={() => toggleInstallmentPaid(installment)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            Installment {installment.installment_number} •{' '}
                            ${installment.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(parseISO(installment.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {pendingBills.length === 0 && (
              <p className="text-gray-500 text-center">{t('bills.noBills')}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">{t('bills.paidBills')}</h3>
          <div className="space-y-4">
            {paidBills.map(bill => {
              const totalAmount = bill.installment_amount * bill.installments;
              return (
                <div key={bill.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{bill.name}</h4>
                      <p className="text-sm text-gray-600">
                        ${bill.installment_amount.toFixed(2)} × {bill.installments} = ${totalAmount.toFixed(2)}
                      </p>
                      {bill.category && (
                        <div className="mt-1 flex items-center">
                          <Tag className="w-4 h-4 mr-1" style={{ color: bill.category.color }} />
                          <span className="text-sm text-gray-600">{bill.category.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <span className="text-green-600">
                        <Check className="w-5 h-5" />
                      </span>
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-red-600 hover:text-red-700"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {paidBills.length === 0 && (
              <p className="text-gray-500 text-center">{t('bills.noBills')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}