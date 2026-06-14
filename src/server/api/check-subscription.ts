import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export async function checkSubscription(req: Request) {
  try {
    const { email } = await req.json();

    // Find customer by email
    const customers = await stripe.customers.list({ email });
    const customer = customers.data[0];

    if (!customer) {
      return new Response(JSON.stringify({ subscription: null }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 1
    });

    const subscription = subscriptions.data[0];

    return new Response(JSON.stringify({ subscription }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Error checking subscription:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}