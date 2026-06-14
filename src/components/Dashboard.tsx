import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Receipt } from '../types/receipt';
import { Category } from '../types/category';
import { Bill } from '../types/bill';
import { RecurringBill, MonthlyBill } from '../types/recurring-bill';
import { BarChart2, DollarSign, Calendar, Bell, ChevronLeft, ChevronRight, CreditCard, Clock, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReceiptGroup {
  category: Category | null;
  receipts: Receipt[];
}

interface ReceiptsGrouped {
  [key: string]: ReceiptGroup;
}

export function Dashboard() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptsGrouped, setReceiptsGrouped] = useState<ReceiptsGrouped>({});
  const [bills, setBills] = useState<Bill[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchReceipts(),
        fetchBills(),
        fetchRecurringBills(),
        fetchMonthlyBills()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group receipts by category
    const grouped = (data || []).reduce((acc: ReceiptsGrouped, receipt: any) => {
      const key = receipt.category?.id || 'uncategorized';
      if (!acc[key]) {
        acc[key] = {
          category: receipt.category,
          receipts: []
        };
      }
      acc[key].receipts.push(receipt);
      return acc;
    }, {});

    setReceipts(data || []);
    setReceiptsGrouped(grouped);
  };

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    setBills(data || []);
  };

  const fetchRecurringBills = async () => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .order('due_day', { ascending: true });
    
    if (error) throw error;
    setRecurringBills(data || []);
  };

  const fetchMonthlyBills = async () => {
    const { data, error } = await supabase
      .from('monthly_bills')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    setMonthlyBills(data || []);
  };

  const toggleAccordion = (key: string) => {
    setExpanded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const calculateMonthlyExpenses = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Sum receipts for selected month
    const receiptsTotal = receipts
      .filter(r => {
        const date = parseISO(r.reference_month);
        return date >= monthStart && date <= monthEnd && r.type === 'expense';
      })
      .reduce((sum, r) => sum + r.amount, 0);

    // Sum bills for selected month
    const billsTotal = bills
      .filter(b => {
        const date = parseISO(b.due_date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, b) => sum + b.installment_amount, 0);

    // Sum monthly bills for selected month
    const monthlyBillsTotal = monthlyBills
      .filter(mb => {
        const date = parseISO(mb.due_date);
        return date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, mb) => sum + mb.amount, 0);

    return receiptsTotal + billsTotal + monthlyBillsTotal;
  };

  const calculateMonthlyIncome = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    return receipts
      .filter(r => {
        const date = parseISO(r.reference_month);
        return date >= monthStart && date <= monthEnd && r.type === 'income';
      })
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const getLargeExpenses = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    return receipts
      .filter(r => {
        const date = parseISO(r.reference_month);
        return date >= monthStart && date <= monthEnd && r.type === 'expense';
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const getCategoryDistribution = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const distribution = Object.values(receiptsGrouped).map(({ category, receipts }) => {
      const total = receipts
        .filter(r => {
          const date = parseISO(r.reference_month);
          return date >= monthStart && date <= monthEnd && r.type === 'expense';
        })
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        category: category?.name || 'Uncategorized',
        color: category?.color || '#CBD5E1',
        total
      };
    });

    return distribution.sort((a, b) => b.total - a.total);
  };

  const renderReceiptsByCategory = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    // Filter receipts for current month
    const monthlyReceipts = receipts.filter(r => {
      const date = parseISO(r.reference_month);
      return date >= monthStart && date <= monthEnd;
    });

    // Group by category
    const grouped = monthlyReceipts.reduce((acc: { [key: string]: Receipt[] }, receipt) => {
      const categoryId = receipt.category?.id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(receipt);
      return acc;
    }, {});

    // Calculate totals and sort categories by amount
    const categories = Object.entries(grouped).map(([categoryId, receipts]) => {
      const category = receipts[0]?.category;
      const total = receipts.reduce((sum, r) => sum + r.amount, 0);
      return { categoryId, category, receipts, total };
    }).sort((a, b) => b.total - a.total);

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.receiptsByCategory')}</h3>
        <div className="space-y-2">
          {categories.map(({ categoryId, category, receipts, total }) => (
            <div key={categoryId} className="border rounded-lg">
              <button
                onClick={() => toggleAccordion(categoryId)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category?.color || '#94A3B8' }}
                  />
                  <span className="font-medium">
                    {category?.name || t('dashboard.uncategorized')}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold">${total.toFixed(2)}</span>
                  {expanded[categoryId] ? (
                    <Minus className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {expanded[categoryId] && (
                <div className="border-t divide-y">
                  {receipts.map(receipt => (
                    <div key={receipt.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          {receipt.description || t('dashboard.noDescription')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(receipt.reference_month), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`font-medium ${
                        receipt.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {receipt.type === 'income' ? '+' : '-'}${receipt.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const monthlyExpenses = calculateMonthlyExpenses();
  const monthlyIncome = calculateMonthlyIncome();

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-md p-4">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold">
          {format(selectedMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">{t('dashboard.currentMonthIncome')}</h3>
          <p className="text-3xl font-bold text-green-600">
            ${monthlyIncome.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">{t('dashboard.currentMonthExpenses')}</h3>
          <p className="text-3xl font-bold text-red-600">
            ${monthlyExpenses.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">{t('dashboard.netBalance')}</h3>
          <p className={`text-3xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${(monthlyIncome - monthlyExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bills Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.upcomingBills')}</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {bills.map(bill => {
              const installments = Array.from({ length: bill.installments });
              const dueDate = parseISO(bill.due_date);
              
              return (
                <div key={bill.id} className="border-b last:border-b-0 pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-sm text-gray-500">
                        {t('dashboard.due')}: {format(dueDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${bill.installment_amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {bill.installments}x {t('dashboard.installments')} ${(bill.installment_amount * bill.installments).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {installments.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full ${
                          index < bill.installments ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.recurringBills')}</h3>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {monthlyBills
              .filter(bill => {
                const dueDate = parseISO(bill.due_date);
                return dueDate >= startOfMonth(selectedMonth) && 
                       dueDate <= endOfMonth(selectedMonth);
              })
              .map(bill => (
                <div key={bill.id} className="flex justify-between items-center border-b last:border-b-0 pb-3">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-sm text-gray-500">
                      {t('dashboard.due')}: {format(parseISO(bill.due_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${bill.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {bill.paid ? t('dashboard.paid') : t('dashboard.pending')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Monthly Expenses Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('dashboard.monthlyExpensesBreakdown')}</h3>
          <BarChart2 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('dashboard.regularExpenses')}</span>
            <span className="font-medium">
              ${receipts
                .filter(r => {
                  const date = parseISO(r.reference_month);
                  return date >= startOfMonth(selectedMonth) && 
                         date <= endOfMonth(selectedMonth) &&
                         r.type === 'expense';
                })
                .reduce((sum, r) => sum + r.amount, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('dashboard.bills')}</span>
            <span className="font-medium">
              ${bills
                .filter(b => {
                  const date = parseISO(b.due_date);
                  return date >= startOfMonth(selectedMonth) && 
                         date <= endOfMonth(selectedMonth);
                })
                .reduce((sum, b) => sum + b.installment_amount, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{t('dashboard.recurringBills')}</span>
            <span className="font-medium">
              ${monthlyBills
                .filter(mb => {
                  const date = parseISO(mb.due_date);
                  return date >= startOfMonth(selectedMonth) && 
                         date <= endOfMonth(selectedMonth);
                })
                .reduce((sum, mb) => sum + mb.amount, 0)
                .toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-gray-200 my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span>{t('dashboard.total')}</span>
            <span>${monthlyExpenses.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Category Distribution and Recent Large Expenses */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t('dashboard.categoryDistribution')}</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getCategoryDistribution().map(({ category, color, total }) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm">{category}</span>
                </div>
                <span className="font-medium">${total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Large Expenses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">{t('dashboard.recentLargeExpenses')}</h3>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {getLargeExpenses().map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{expense.description || t('dashboard.noDescription')}</p>
                  {expense.category && (
                    <div className="flex items-center mt-1">
                      <div
                        className="w-2 h-2 rounded-full mr-1"
                        style={{ backgroundColor: expense.category.color }}
                      />
                      <span className="text-xs text-gray-500">{expense.category.name}</span>
                    </div>
                  )}
                </div>
                <span className="font-medium ml-4">${expense.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts by Category */}
      {renderReceiptsByCategory()}
    </div>
  );
}