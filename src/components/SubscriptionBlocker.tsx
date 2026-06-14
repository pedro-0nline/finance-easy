import React from 'react';
import { useSubscriptionBlock } from '../hooks/useSubscriptionBlock';
import { XCircle, AlertTriangle, Loader2, CreditCard } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function SubscriptionBlocker({ children }: Props) {
  const { isBlocked, isLoading } = useSubscriptionBlock();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Blocked
            </h2>
            <p className="text-gray-600 mb-6">
              Your subscription is inactive and access to the application has been blocked.
              Please renew your subscription to continue using the service.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-left w-full">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-700">
                  Your data is safely stored and will be available once you reactivate your subscription.
                </p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = 'https://buy.stripe.com/9AQdU39Br5GxgNy001?prefilled_email=${encodeURIComponent(email)}'}
              className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Renew Subscription
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}