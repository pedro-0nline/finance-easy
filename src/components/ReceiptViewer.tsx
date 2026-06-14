import React from 'react';
import { Dialog } from './Dialog';
import { FileText, X } from 'lucide-react';
import { format } from 'date-fns';
import { Receipt } from '../types/receipt';
import moment from 'moment';

interface Props {
  receipt: Receipt | null;
  onClose: () => void;
}
 
function formatFirstDayOfMonth(referenceDate: any) {
  // Cria uma nova data dinâmica para o primeiro dia do mês
  const date = moment(referenceDate, 'YYYY-MM-DD').format('MMMM YYYY');
  console.log(date);

  return date
}


export function ReceiptViewer({ receipt, onClose }: Props) {
  if (!receipt) return null;

  return (
    <Dialog isOpen={!!receipt} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-lg font-semibold">Receipt Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Amount</h3>
              <p className="mt-1 text-lg font-semibold">${receipt.amount.toFixed(2)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Reference Month</h3>
              <p className="mt-1">{formatFirstDayOfMonth(receipt.reference_month)}</p>
            </div>
            
            {receipt.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{receipt.description}</p>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Receipt Image</h3>
              <div className="mt-2 border rounded-lg overflow-hidden">
                {receipt.file_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={receipt.file_url}
                    className="w-full h-96"
                    title="Receipt PDF"
                  />
                ) : (
                  <img
                    src={receipt.file_url}
                    alt="Receipt"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}