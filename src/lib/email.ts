import { supabase } from './supabase';

export async function sendTempPasswordEmail(email: string) {
  try {
    // Send email using Edge Function
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://financemanage.app',
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error('Error sending temp password email:', err);
    throw err;
  }
}