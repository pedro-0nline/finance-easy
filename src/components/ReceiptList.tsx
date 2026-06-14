import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import {
  FileText,
  ExternalLink,
  Eye,
  Trash2,
  Edit2,
  Search,
  Tag,
  Loader2
} from 'lucide-react';
import { Receipt } from '../types/receipt';
import { Category } from '../types/category';
import { ReceiptViewer } from './ReceiptViewer';
import { MonthlyReport } from './MonthlyReport';
import { ReceiptForm } from './ReceiptForm';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

function formatFirstDayOfMonth(referenceDate: any) {
  // Converte a data de referência para o formato "MMMM YYYY"
  return moment(referenceDate, 'YYYY-MM-DD').format('MMMM YYYY');
}

export function ReceiptList() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<(Receipt & { category: Category | null })[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReceipts = async () => {
    try {
      setIsRefreshing(true);
      let query = supabase
        .from('receipts')
        .select('*, category:categories(*)');
      
      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('reference_month', { ascending: false });
      if (error) throw error;
      setReceipts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Busca os recibos quando o componente é montado e sempre que searchTerm mudar
  useEffect(() => {
    fetchReceipts();
  }, [searchTerm]);

  const handleDelete = async (receipt: Receipt) => {
    try {
      setIsRefreshing(true);
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', receipt.id);
      if (error) throw error;
      await fetchReceipts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Essa função é chamada após o envio do formulário para atualizar os dados
  const handleFormSuccess = async () => {
    await fetchReceipts();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Relatório Mensal */}
      <MonthlyReport />

      {/* Formulário de edição */}
      {editingReceipt && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t('common.edit')}</h2>
            <button
              onClick={() => setEditingReceipt(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              {t('common.cancel')}
            </button>
          </div>
          <ReceiptForm
            receipt={editingReceipt}
            onSuccess={async () => {
              setEditingReceipt(null);
              await handleFormSuccess();
            }}
          />
        </div>
      )}

      {/* Lista de Recibos */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold">{t('receipts.allReceipts')}</h2>
            {isRefreshing && (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <div className="w-full sm:w-auto relative">
            <input
              type="text"
              placeholder={t('receipts.searchByDescription')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {receipts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t('receipts.noReceipts')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="font-medium">
                      {formatFirstDayOfMonth(receipt.reference_month)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="text-blue-500 hover:text-blue-600"
                      title={t('receipts.viewReceipt')}
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEditingReceipt(receipt)}
                      className="text-blue-500 hover:text-blue-600"
                      title={t('common.edit')}
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(receipt)}
                      className="text-red-500 hover:text-red-600"
                      title={t('common.delete')}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {receipt.file_url && (
                      <a
                        href={receipt.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                        title={t('common.open')}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-lg font-semibold">
                    ${receipt.amount.toFixed(2)}
                  </div>
                  {receipt.description && (
                    <p className="mt-1 text-sm text-gray-600 break-words">
                      {receipt.description}
                    </p>
                  )}
                  {receipt.category && (
                    <div className="mt-2 flex items-center">
                      <Tag className="w-4 h-4 mr-1" style={{ color: receipt.category.color }} />
                      <span className="text-sm text-gray-600">{receipt.category.name}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {t('receipts.addedOn')} {format(new Date(receipt.created_at), 'PP')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visualizador de Recibos */}
      <ReceiptViewer
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />
    </div>
  );
}
