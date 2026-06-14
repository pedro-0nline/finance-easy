import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSubscriptionBlock() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // If no subscription exists, user is not blocked
        if (!subscription || error) {
          setIsBlocked(false);
          setIsLoading(false);
          return;
        }

        // Only block if status is explicitly 'canceled' or 'inactive'
        const isBlocked = subscription.status === 'canceled' || 
          (subscription.status === 'inactive' && 
           subscription.current_period_end && 
           new Date(subscription.current_period_end) < new Date());

        setIsBlocked(isBlocked);

        // If blocked, update user metadata
        if (isBlocked) {
          await supabase.auth.updateUser({
            data: { subscription_blocked: true }
          });
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
        // On error, don't block access
        setIsBlocked(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSubscription();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isBlocked, isLoading };
}