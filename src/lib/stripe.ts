import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export const createCheckoutSession = async (email: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe failed to initialize');

    // Get subscription data from Supabase FDW
    const { data: subscriptions, error: subError } = await supabase
      .rpc('get_stripe_subscription_by_email', {
        customer_email: email
      });

    if (subError) throw subError;

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: { 
        email,
        customerId: subscriptions?.[0]?.customer_id
      }
    });

    if (sessionError) throw sessionError;

    // Redirect to checkout
    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionData.sessionId
    });
    
    if (error) throw error;

  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    throw err;
  }
};