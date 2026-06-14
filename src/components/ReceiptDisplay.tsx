import React from 'react';
import { useTranslation } from 'react-i18next';

interface ReceiptData {
  value: number;
  category: string;
  referenceMonth: string;
  description: string;
  type: string;
}

interface ReceiptDisplayProps {
  data: ReceiptData;
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ data }) => {
  const { t, i18n } = useTranslation();

  // Verifica o tipo para usar a tradução correta
  const typeLabel =
    data.type.toLowerCase() === 'expenses' || data.type.toLowerCase() === 'expense'
      ? t('receipts.expense')
      : t('receipts.income');

  return (
    <div className="p-4 bg-white rounded shadow-md border">
      <div className="mb-2">
        <span className="font-bold">{t('receipts.amount')}: </span>
        <span>
          {new Intl.NumberFormat(i18n.language, {
            style: 'currency',
            currency: 'BRL' // Altere a moeda se necessário ou torne dinâmico
          }).format(data.value)}
        </span>
      </div>
      <div className="mb-2">
        <span className="font-bold">{t('receipts.category')}: </span>
        <span>{data.category || t('receipts.noCategory')}</span>
      </div>
      <div className="mb-2">
        <span className="font-bold">{t('receipts.referenceMonth')}: </span>
        <span>{data.referenceMonth}</span>
      </div>
      <div className="mb-2">
        <span className="font-bold">{t('receipts.description')}: </span>
        <span>{data.description}</span>
      </div>
      <div>
        <span className="font-bold">{t('receipts.viewReceipt')}: </span>
        <span>{typeLabel}</span>
      </div>
    </div>
  );
};

export default ReceiptDisplay;
