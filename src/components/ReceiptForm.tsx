import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatReferenceMonth } from '../utils/date';
import { Receipt } from '../types/receipt';
import { Category } from '../types/category';
import { format } from 'date-fns';

interface Props {
  receipt?: Receipt;
  onSuccess: () => void;
}

export function ReceiptForm({ receipt, onSuccess }: Props) {
  const [amount, setAmount] = useState(receipt?.amount.toString() || '');
  const [referenceMonth, setReferenceMonth] = useState(
    receipt ? format(new Date(receipt.reference_month), 'yyyy-MM') : format(new Date(), 'yyyy-MM')
  );
  const [description, setDescription] = useState(receipt?.description || '');
  const [categoryId, setCategoryId] = useState(receipt?.category_id || '');
  const [type, setType] = useState<'income' | 'expense'>(receipt?.type || 'expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Removemos a verificação para que o arquivo seja opcional

    setIsLoading(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      let fileUrl = receipt?.file_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(`${user.data.user.id}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('receipts')
          .getPublicUrl(`${user.data.user.id}/${fileName}`);

        fileUrl = publicUrl;
      }

      const receiptData = {
        amount: parseFloat(amount),
        reference_month: formatReferenceMonth(referenceMonth),
        description,
        category_id: categoryId || null,
        type,
        ...(fileUrl && { file_url: fileUrl }),
        user_id: user.data.user.id
      };

      if (receipt) {
        const { error: updateError } = await supabase
          .from('receipts')
          .update(receiptData)
          .eq('id', receipt.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('receipts')
          .insert(receiptData);

        if (insertError) throw insertError;
      }

      // Reset do formulário
      setAmount('');
      setReferenceMonth(format(new Date(), 'yyyy-MM'));
      setDescription('');
      setCategoryId('');
      setType('expense');
      setFile(null);
      
      // Chama o callback onSuccess após a submissão
      await onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center px-4 py-2 rounded-md border ${
                type === 'income'
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Income
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center px-4 py-2 rounded-md border ${
                type === 'expense'
                  ? 'bg-red-50 border-red-500 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Expense
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reference Month</label>
          <input
            type="month"
            value={referenceMonth}
            onChange={(e) => setReferenceMonth(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category (Optional)</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">No Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {receipt ? 'New Receipt File (optional)' : 'Receipt File (optional)'}
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            <>
              <Upload className="h-5 w-5 mr-2" />
              {receipt ? 'Update Receipt' : 'Upload Receipt'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
