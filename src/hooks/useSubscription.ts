import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SubscriptionData {
  status: string;
  current_period_end: string | null;
  stripe_customer_id: string | null;
}

export function useSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(true); // Default to true to prevent blocking
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          setIsSubscribed(false);
          setData(null);
          setIsLoading(false);
          return;
        }

        // Get subscription data using the RPC function
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .rpc('handle_subscription_status', {
            p_user_id: user.id,
            p_email: user.email
          });

        if (subscriptionError) {
          // On error, default to allowing access
          console.error('Subscription check error:', subscriptionError);
          setIsSubscribed(true);
          setData({
            status: 'active',
            current_period_end: null,
            stripe_customer_id: null
          });
          return;
        }

        if (subscriptionData) {
          const isActive = subscriptionData.status === 'active' || 
                          subscriptionData.status === 'trialing';

          setIsSubscribed(isActive);
          setData({
            status: subscriptionData.status,
            current_period_end: subscriptionData.current_period_end,
            stripe_customer_id: subscriptionData.customer_id
          });
        } else {
          // If no subscription data, default to allowing access
          setIsSubscribed(true);
          setData({
            status: 'active',
            current_period_end: null,
            stripe_customer_id: null
          });
        }
      } catch (err: any) {
        // On error, default to allowing access
        console.error('Subscription check error:', err);
        setIsSubscribed(true);
        setData({
          status: 'active',
          current_period_end: null,
          stripe_customer_id: null
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();

    // Subscribe to subscription changes
    const channel = supabase.channel('subscription-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'subscriptions' 
      }, () => {
        checkSubscription();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    isSubscribed,
    isLoading,
    error,
    data
  };
}