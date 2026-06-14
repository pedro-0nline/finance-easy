import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { AlertCircle, CheckCircle, Loader2, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export function SubscriptionStatus() {
  const { isSubscribed, isLoading, error, data } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center text-gray-500">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span className="text-sm">Checking subscription...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center text-red-500">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="text-sm">Error checking subscription</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center text-yellow-500">
        <Clock className="w-4 h-4 mr-2" />
        <span className="text-sm">No subscription</span>
      </div>
    );
  }

  const getStatusInfo = () => {
    if (data.status === 'trialing') {
      return {
        color: 'text-blue-500',
        icon: Clock,
        text: 'Trial Active'
      };
    }

    if (data.status === 'active' && data.current_period_end) {
      const periodEnd = new Date(data.current_period_end);
      if (periodEnd > new Date()) {
        return {
          color: 'text-green-500',
          icon: CheckCircle,
          text: 'Active'
        };
      }
    }

    if (data.status === 'canceled') {
      return {
        color: 'text-red-500',
        icon: XCircle,
        text: 'Canceled'
      };
    }

    return {
      color: 'text-yellow-500',
      icon: Clock,
      text: 'Inactive'
    };
  };

  const { color, icon: Icon, text } = getStatusInfo();

  return (
    <div className={`flex items-center ${color}`}>
      <Icon className="w-4 h-4 mr-2" />
      <span className="text-sm font-medium mr-2">{text}</span>
      {data.current_period_end && data.status !== 'canceled' && (
        <span className="text-xs text-gray-500">
          (Expires: {format(new Date(data.current_period_end), 'MMM d, yyyy')})
        </span>
      )}
    </div>
  );
}