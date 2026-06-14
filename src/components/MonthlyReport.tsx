import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parse } from 'date-fns';
import { BarChart, DollarSign } from 'lucide-react';
import moment from 'moment';

interface MonthlyTotal {
  reference_month: string;
  total: number;
}

function formatFirstDayOfMonth(referenceDate: any) {
  // Cria uma nova data dinâmica para o primeiro dia do mês
  const date = moment(referenceDate, 'YYYY-MM-DD').format('MMMM YYYY');
  console.log(date);

  return date
}



export function MonthlyReport() {
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonthlyTotals();
  }, []);

  const fetchMonthlyTotals = async () => {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('reference_month, amount')
        .order('reference_month', { ascending: false });

      if (error) throw error;

      // Group and sum by month
      const totals = (data || []).reduce((acc: { [key: string]: number }, receipt) => {
        const month = moment(receipt.reference_month, 'YYYY-MM-DD').format('YYYY-MM');
        acc[month] = (acc[month] || 0) + receipt.amount;
        return acc;
      }, {});

      // Convert to array and sort
      const sortedTotals = Object.entries(totals)
        .map(([month, total]) => ({
          reference_month: month,
          total,
        }))
        .sort((a, b) => b.reference_month.localeCompare(a.reference_month));

      setMonthlyTotals(sortedTotals);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading monthly report...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        Error loading report: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <BarChart className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold">Monthly Expense Report</h2>
      </div>

      <div className="space-y-4">
        {monthlyTotals.map((item) => (
          <div
            key={item.reference_month}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="font-medium">
                {format(parse(item.reference_month, 'yyyy-MM', new Date()), 'MMMM yyyy')}
              </span>
            </div>
            <span className="text-lg font-semibold">${item.total.toFixed(2)}</span>
          </div>
        ))}

        {monthlyTotals.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No expenses recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}