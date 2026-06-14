import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { getStripe } from '../lib/stripe';
import { CreditCard, Bank, QrCode, Loader2 } from 'lucide-react';

type PaymentMethod = 'card' | 'bank' | 'pix';

interface Props {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function PaymentMethodForm({ amount, onSuccess, onError }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: ''
  });
  const [pixKey, setPixKey] = useState('');

  const handleCardPayment = async () => {
    try {
      setIsLoading(true);
      const stripe = await getStripe();
      if (!stripe) throw new Error('Stripe failed to initialize');

      const { error: sessionError, data: sessionData } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount }
      });

      if (sessionError) throw sessionError;

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: sessionData.sessionId
      });

      if (stripeError) throw stripeError;

      onSuccess();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('bank_transfers')
        .insert({
          amount,
          account_name: bankInfo.accountName,
          account_number: bankInfo.accountNumber,
          bank_name: bankInfo.bankName,
          branch: bankInfo.branch,
          status: 'pending'
        });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePixPayment = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('pix_payments')
        .insert({
          amount,
          pix_key: pixKey,
          status: 'pending'
        });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      onError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedMethod('card')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            selectedMethod === 'card'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
          }`}
        >
          <CreditCard className={`w-6 h-6 mb-2 ${selectedMethod === 'card' ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${selectedMethod === 'card' ? 'text-blue-700' : 'text-gray-600'}`}>
            Credit Card
          </span>
        </button>

        <button
          onClick={() => setSelectedMethod('bank')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            selectedMethod === 'bank'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
          }`}
        >
          <Bank className={`w-6 h-6 mb-2 ${selectedMethod === 'bank' ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${selectedMethod === 'bank' ? 'text-blue-700' : 'text-gray-600'}`}>
            Bank Transfer
          </span>
        </button>

        <button
          onClick={() => setSelectedMethod('pix')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            selectedMethod === 'pix'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-200'
          }`}
        >
          <QrCode className={`w-6 h-6 mb-2 ${selectedMethod === 'pix' ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${selectedMethod === 'pix' ? 'text-blue-700' : 'text-gray-600'}`}>
            PIX
          </span>
        </button>
      </div>

      <div className="mt-6">
        {selectedMethod === 'card' && (
          <button
            onClick={handleCardPayment}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay with Card
              </>
            )}
          </button>
        )}

        {selectedMethod === 'bank' && (
          <form onSubmit={handleBankTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name</label>
              <input
                type="text"
                value={bankInfo.accountName}
                onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                value={bankInfo.accountNumber}
                onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input
                type="text"
                value={bankInfo.bankName}
                onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Branch</label>
              <input
                type="text"
                value={bankInfo.branch}
                onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
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
                  <Bank className="h-5 w-5 mr-2" />
                  Submit Bank Transfer
                </>
              )}
            </button>
          </form>
        )}

        {selectedMethod === 'pix' && (
          <form onSubmit={handlePixPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">PIX Key</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
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
                  <QrCode className="h-5 w-5 mr-2" />
                  Pay with PIX
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}