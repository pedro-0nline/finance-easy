import React from 'react';
import { X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SubscriptionStatus } from './SubscriptionStatus';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  children: React.ReactNode;
}

export function MobileMenu({ isOpen, onClose, email, children }: MobileMenuProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />

      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="w-10 h-10 text-gray-400 bg-white rounded-full p-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{email}</p>
                  <p className="text-xs text-gray-500">{t('user.accountInfo')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-4 flex items-center space-x-4">
              <LanguageSwitcher />
              <SubscriptionStatus />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-4">
              {children}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}