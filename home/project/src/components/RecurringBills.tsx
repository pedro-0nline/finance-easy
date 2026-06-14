import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, addMonths, isAfter } from 'date-fns';
import { RecurringBill, MonthlyBill } from '../types/recurring-bill';
import { Category } from '../types/category';
import { PlusCircle, Calendar, DollarSign, Check, X, Loader2, Bell, RotateCcw, Trash2, Tag } from 'lucide-react';

export function RecurringBills() {
  // ... (keep existing state and other functions)

  const generateMonthlyBills = async (recurringBill: RecurringBill) => {
    try {
      const today = new Date();
      const nextThreeMonths = Array.from({ length: 3 }, (_, i) => {
        const date = addMonths(today, i);
        return new Date(date.getFullYear(), date.getMonth(), recurringBill.due_day);
      });

      const { data: existingBills, error: fetchError } = await supabase
        .from('monthly_bills')
        .select('due_date')
        .eq('recurring_bill_id', recurringBill.id);

      if (fetchError) throw fetchError;

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      for (const dueDate of nextThreeMonths) {
        // Only create bills for future dates and dates that don't already exist
        if (isAfter(dueDate, today) && 
            !existingBills?.some(bill => 
              format(parseISO(bill.due_date), 'yyyy-MM-dd') === format(dueDate, 'yyyy-MM-dd')
            )) {
          const { error } = await supabase.rpc('generate_monthly_bills_bypass_rls', {
            p_recurring_bill_id: recurringBill.id,
            p_user_id: user.data.user.id,
            p_name: recurringBill.name,
            p_amount: recurringBill.amount,
            p_due_date: format(dueDate, 'yyyy-MM-dd')
          });

          if (error) throw error;
        }
      }

      // Update last_generated_date
      const { error: updateError } = await supabase
        .from('recurring_bills')
        .update({ last_generated_date: format(new Date(), 'yyyy-MM-dd') })
        .eq('id', recurringBill.id);

      if (updateError) throw updateError;

      await fetchBills();
    } catch (err: any) {
      console.error('Error generating monthly bills:', err);
      setError(err.message);
    }
  };

  // ... (keep rest of the component)
}