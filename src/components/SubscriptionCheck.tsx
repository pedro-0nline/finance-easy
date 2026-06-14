import React, { useEffect } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Navigate, useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export function SubscriptionCheck({ children }: Props) {
  const navigate = useNavigate();
  const { isSubscribed, isLoading, error, status } = useSubscription();

  useEffect(() => {
    // If subscription is canceled, redirect to subscribe page
    if (status === 'canceled') {
      navigate('/subscribe', { replace: true });
    }
  }, [status, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          Error checking subscription status. Please try again.
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
}