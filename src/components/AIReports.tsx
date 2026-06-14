import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Receipt } from '../types/receipt';
import { Category } from '../types/category';
import { RecurringBill, MonthlyBill } from '../types/recurring-bill';
import { 
  Brain, 
  TrendingUp, 
  PieChart, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  DollarSign,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { chatWithClaude } from '../lib/anthropicApi';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AIInsight {
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  value?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface SpendingProjection {
  total: number;
  recurring: number;
  estimated: number;
  categories: {
    name: string;
    current: number;
    projected: number;
    color: string;
  }[];
}

export function AIReports() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [projection, setProjection] = useState<SpendingProjection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [receiptsData, categoriesData, recurringData, monthlyData] = await Promise.all([
        fetchReceipts(),
        fetchCategories(),
        fetchRecurringBills(),
        fetchMonthlyBills()
      ]);
      
      if (receiptsData && categoriesData) {
        await Promise.all([
          generateInsights(receiptsData, categoriesData),
          generateProjection(receiptsData, categoriesData, recurringData, monthlyData)
        ]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from('receipts')
      .select('*, category:categories(*)')
      .order('reference_month', { ascending: false });
    
    if (error) throw error;
    setReceipts(data || []);
    return data;
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setCategories(data || []);
    return data;
  };

  const fetchRecurringBills = async () => {
    const { data, error } = await supabase
      .from('recurring_bills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRecurringBills(data || []);
    return data;
  };

  const fetchMonthlyBills = async () => {
    const { data, error } = await supabase
      .from('monthly_bills')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    setMonthlyBills(data || []);
    return data;
  };

  const generateInsights = async (receiptsData: Receipt[], categoriesData: Category[]) => {
    try {
      setIsAnalyzing(true);
      setError('');
      
      const lastThreeMonths = Array.from({ length: 3 }, (_, i) => 
        format(subMonths(new Date(), i), 'yyyy-MM')
      );

      const monthlyData = lastThreeMonths.map(month => {
        const monthReceipts = receiptsData.filter(r => 
          format(parseISO(r.reference_month), 'yyyy-MM') === month
        );

        return {
          month,
          income: monthReceipts.filter(r => r.type === 'income')
            .reduce((sum, r) => sum + r.amount, 0),
          expenses: monthReceipts.filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + r.amount, 0),
          categories: categoriesData.map(cat => ({
            name: cat.name,
            total: monthReceipts
              .filter(r => r.category_id === cat.id)
              .reduce((sum, r) => sum + r.amount, 0)
          }))
        };
      });

      const response = await chatWithClaude([{
        type: 'text',
        text: JSON.stringify({
          data: monthlyData,
          request: 'Analise estes dados financeiros e forneça insights sobre padrões de gastos, tendências de receita e distribuição por categoria. Foque em identificar padrões incomuns e fornecer recomendações acionáveis.'
        })
      }]);

      let aiResponse;
      try {
        aiResponse = JSON.parse(response);
      } catch (jsonError) {
        throw new Error('Falha ao processar resposta da IA');
      }
      
      const newInsights: AIInsight[] = [
        {
          title: 'Tendência de Gastos',
          description: aiResponse.spendingTrend || 'Análise de tendência de gastos não disponível',
          type: aiResponse.spendingTrendType || 'neutral',
          trend: aiResponse.trend
        },
        {
          title: 'Distribuição por Categoria',
          description: aiResponse.categoryInsight || 'Análise de categorias não disponível',
          type: 'neutral'
        },
        {
          title: 'Recomendações',
          description: aiResponse.recommendations || 'Recomendações não disponíveis',
          type: 'positive'
        }
      ];

      setInsights(newInsights);
    } catch (err: any) {
      setError('Erro ao gerar insights: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateProjection = async (
    receiptsData: Receipt[],
    categoriesData: Category[],
    recurringData: RecurringBill[],
    monthlyData: MonthlyBill[]
  ) => {
    const currentMonth = startOfMonth(new Date());
    const nextMonth = addMonths(currentMonth, 1);

    // Get current month's expenses by category
    const currentExpenses = categoriesData.map(category => {
      const total = receiptsData
        .filter(r => 
          r.category_id === category.id &&
          r.type === 'expense' &&
          parseISO(r.reference_month) >= currentMonth &&
          parseISO(r.reference_month) < nextMonth
        )
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        name: category.name,
        current: total,
        color: category.color
      };
    });

    // Calculate recurring expenses for next month
    const recurringTotal = recurringData.reduce((sum, bill) => sum + bill.amount, 0);

    // Project next month's expenses based on current patterns and recurring bills
    const projectedCategories = currentExpenses.map(cat => {
      // Use a simple projection model that considers current spending and adds a small variance
      const variance = Math.random() * 0.1 - 0.05; // -5% to +5% variance
      const projected = cat.current * (1 + variance);

      return {
        name: cat.name,
        current: cat.current,
        projected: projected,
        color: cat.color
      };
    });

    // Calculate total projected spending
    const totalProjected = projectedCategories.reduce((sum, cat) => sum + cat.projected, 0);

    setProjection({
      total: totalProjected,
      recurring: recurringTotal,
      estimated: totalProjected + recurringTotal,
      categories: projectedCategories
    });
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1));
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsLoading(true);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const canvas = await html2canvas(reportRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      // Add header
      pdf.setFontSize(20);
      pdf.text('Relatório Financeiro', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);

      // Add content
      const contentWidth = 170;
      const contentHeight = (canvas.height * contentWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 40, contentWidth, contentHeight);

      pdf.save('relatorio-financeiro.pdf');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Erro ao gerar PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const getChartData = () => {
    const lastThreeMonths = Array.from({ length: 3 }, (_, i) => 
      format(subMonths(new Date(), i), 'yyyy-MM')
    ).reverse();

    const monthlyExpenses = lastThreeMonths.map(month => {
      return receipts
        .filter(r => format(parseISO(r.reference_month), 'yyyy-MM') === month && r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
    });

    const monthlyIncome = lastThreeMonths.map(month => {
      return receipts
        .filter(r => format(parseISO(r.reference_month), 'yyyy-MM') === month && r.type === 'income')
        .reduce((sum, r) => sum + r.amount, 0);
    });

    return {
      labels: lastThreeMonths.map(month => format(parseISO(`${month}-01`), 'MMM yyyy')),
      datasets: [
        {
          label: 'Despesas',
          data: monthlyExpenses,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.4
        },
        {
          label: 'Receitas',
          data: monthlyIncome,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.4
        }
      ]
    };
  };

  const getPieChartData = () => {
    const categoryTotals = categories.map(category => {
      const total = receipts
        .filter(r => r.category_id === category.id && r.type === 'expense')
        .reduce((sum, r) => sum + r.amount, 0);
      return {
        category: category.name,
        total,
        color: category.color
      };
    });

    return {
      labels: categoryTotals.map(c => c.category),
      datasets: [{
        data: categoryTotals.map(c => c.total),
        backgroundColor: categoryTotals.map(c => c.color),
        borderWidth: 1
      }]
    };
  };

  const getProjectionChartData = () => {
    if (!projection) return null;

    return {
      labels: projection.categories.map(cat => cat.name),
      datasets: [
        {
          label: 'Mês Atual',
          data: projection.categories.map(cat => cat.current),
          backgroundColor: projection.categories.map(cat => cat.color),
          borderWidth: 1
        },
        {
          label: 'Projeção',
          data: projection.categories.map(cat => cat.projected),
          backgroundColor: projection.categories.map(cat => `${cat.color}80`),
          borderWidth: 1
        }
      ]
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header Section - Improved Mobile Layout */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Relatórios com IA</h2>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
          {/* Month selector - Full width on mobile */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow px-2 w-full sm:w-auto">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="flex-1 text-center px-4 font-medium">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Action Buttons - Full width on mobile */}
          <div className="grid grid-cols-2 gap-3 sm:flex sm:space-x-4">
            <button
              onClick={exportToPDF}
              disabled={isLoading || isAnalyzing}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
            >
              <Download className="w-5 h-5 mr-2" />
              <span className="whitespace-nowrap">Exportar PDF</span>
            </button>

            <button
              onClick={() => fetchData()}
              disabled={isAnalyzing || isLoading}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span className="whitespace-nowrap">Analisando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  <span className="whitespace-nowrap">Atualizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Insights Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 ${
              insight.type === 'positive' ? 'border-green-500' :
              insight.type === 'negative' ? 'border-red-500' :
              'border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold">{insight.title}</h3>
              {insight.trend && (
                insight.trend === 'up' ? (
                  <ArrowUpRight className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : insight.trend === 'down' ? (
                  <ArrowDownRight className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                )
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600">{insight.description}</p>
            {insight.value && (
              <div className="mt-4 text-xl sm:text-2xl font-bold">
                R$ {insight.value.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold">Evolução Financeira</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-48 sm:h-64">
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value}`,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  },
                  x: {
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-semibold">Distribuição por Categoria</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-48 sm:h-64">
            <Pie
              data={getPieChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Projection Section */}
      {projection && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="text-base sm:text-lg font-semibold">Projeção para o Próximo Mês</h3>
            </div>
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-600">Gastos Recorrentes</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-700">
                R$ {projection.recurring.toFixed(2)}
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-600">Gastos Estimados</span>
                <Target className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-orange-700">
                R$ {projection.total.toFixed(2)}
              </p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-600">Total Projetado</span>
                <DollarSign className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-700">
                R$ {projection.estimated.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="h-48 sm:h-64">
            <Bar
              data={getProjectionChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `R$ ${value}`,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  },
                  x: {
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}