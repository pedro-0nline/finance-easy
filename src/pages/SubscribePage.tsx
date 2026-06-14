import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '../lib/stripe';
import { CreditCard, Check } from 'lucide-react';

export function SubscribePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user email found');

      await createCheckoutSession(user.email);
      
      // Redirect will happen in createCheckoutSession
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Subscribe to Continue
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Get access to all features with our premium subscription
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Premium Plan</h3>
              <span className="text-3xl font-bold text-gray-900">$9.99/mo</span>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span>Unlimited receipts and bills</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span>Advanced analytics and reports</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span>Expense sharing with team members</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-3" />
                <span>Priority customer support</span>
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Subscribe Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}