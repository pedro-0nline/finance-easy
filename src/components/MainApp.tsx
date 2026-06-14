import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { AuthForm } from './AuthForm';
import { ReceiptForm } from './ReceiptForm';
import { ReceiptList } from './ReceiptList';
import { BillsManagement } from './BillsManagement';
import { RecurringBills } from './RecurringBills';
import { CategoryManager } from './CategoryManager';
import { ExpenseSharing } from './ExpenseSharing';
import { Dashboard } from './Dashboard';
import {
  LogOut,
  Receipt,
  FileText,
  Bell,
  Tag,
  Users,
  Menu,
  X,
  LayoutDashboard,
  PlusCircle,
  File,
  Brain
} from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { SubscriptionStatus } from './SubscriptionStatus';
import { SupportButton } from './SupportButton';
import { AIReports } from './AIReports';

export function MainApp({ session }: { session: Session }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receipts' | 'bills' | 'recurring' | 'categories' | 'sharing' | 'ai-reports'>('dashboard');
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showIAReportsModal, setShowIAReportsModal] = useState(false);
  // Estados para o dropdown do usuário (desktop e mobile)
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  // Estado para o novo password e mensagem de feedback
  const [newPassword, setNewPassword] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setShowReceiptForm(false);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setUpdateMessage(t('user.passwordLength', 'A senha deve ter no mínimo 6 caracteres.'));
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setUpdateMessage(error.message);
      } else {
        setUpdateMessage(t('user.passwordUpdated', 'Senha atualizada com sucesso!'));
        setNewPassword('');
      }
    } catch (e: any) {
      setUpdateMessage(t('user.passwordUpdateError', 'Erro ao atualizar a senha.'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Receipt className="h-8 w-8 text-blue-500" />
                <span className="ml-2 text-xl font-bold">FinanceEasy</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  {t('dashboard.title')}
                </button>

                <button
                  onClick={() => handleTabChange('receipts')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'receipts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  {t('receipts.title')}
                </button>

                <button
                  onClick={() => handleTabChange('bills')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'bills'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {t('bills.title')}
                </button>

                <button
                  onClick={() => handleTabChange('recurring')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'recurring'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {t('recurring.title')}
                </button>

                <button
                  onClick={() => handleTabChange('categories')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'categories'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  {t('categories.title')}
                </button>

                <button
                  onClick={() => handleTabChange('sharing')}
                  className={`inline-flex items-center px-4 py-2 border-b-2 text-sm font-medium ${activeTab === 'sharing'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('sharing.title')}
                </button>

                {/* Novo botão para IA Reports */}
                <button
                  onClick={() => handleTabChange('ai-reports')}
                  className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'ai-reports'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                >
                  <Brain className="w-5 h-5 mr-3" />
                  Relatórios IA
                </button>
              </div>
            </div>
            {/* Container dos itens à direita (Desktop) */}
            <div className="hidden pl-12 sm:ml-6 sm:flex sm:items-center sm:space-x-4 relative z-10">
              <LanguageSwitcher />
              <SubscriptionStatus />
              {/* Dropdown do usuário (Desktop) */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {session.user.email}
                  <svg
                    className="ml-2 h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-3 px-4">
                      <p className="text-sm text-gray-900">{session.user.email}</p>
                      <p className="mt-1 text-xs text-gray-500">{t('user.accountInfo', 'Conta do Usuário')}</p>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <div className="py-3 px-4">
                      <label htmlFor="new-password" className="block text-xs font-medium text-gray-700">
                        {t('user.newPassword', 'Nova Senha')}
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        name="new-password"
                        autoComplete="new-password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={t('user.newPasswordPlaceholder', 'Digite a nova senha')}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {updateMessage && (
                        <p className="mt-1 text-xs text-gray-500">{updateMessage}</p>
                      )}
                      <button
                        onClick={handleUpdatePassword}
                        className="mt-2 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-1 px-3 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {t('user.updatePassword', 'Atualizar Senha')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </button>
            </div>
            {/* Ícone do menu para mobile */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`sm:hidden ${isMobileMenuOpen ? 'block' : 'hidden'} relative z-20`}>
          <div className="pt-2 pb-3 space-y-1">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              {t('dashboard.title')}
            </button>

            <button
              onClick={() => handleTabChange('receipts')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'receipts'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Receipt className="w-5 h-5 mr-3" />
              {t('receipts.title')}
            </button>

            <button
              onClick={() => handleTabChange('bills')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'bills'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              {t('bills.title')}
            </button>

            <button
              onClick={() => handleTabChange('recurring')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'recurring'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              {t('recurring.title')}
            </button>

            <button
              onClick={() => handleTabChange('categories')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'categories'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Tag className="w-5 h-5 mr-3" />
              {t('categories.title')}
            </button>

            <button
              onClick={() => handleTabChange('sharing')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'sharing'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Users className="w-5 h-5 mr-3" />
              {t('sharing.title')}
            </button>

            {/* Botão para IA Reports no menu mobile */}
            <button
              onClick={() => handleTabChange('ai-reports')}
              className={`w-full flex items-center px-3 py-2 text-base font-medium ${activeTab === 'ai-reports'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <Brain className="w-5 h-5 mr-3" />
              Relatórios IA
            </button>
          </div>
          {/* Mobile menu: área inferior com LanguageSwitcher, SubscriptionStatus e dropdown do usuário */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 space-x-3">
              <LanguageSwitcher />
              <SubscriptionStatus />
              {/* Dropdown do usuário no mobile */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {session.user.email}
                  <svg
                    className="ml-2 h-5 w-5 text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-3 px-4">
                      <p className="text-sm text-gray-900">{session.user.email}</p>
                      <p className="mt-1 text-xs text-gray-500">{t('user.accountInfo', 'Conta do Usuário')}</p>
                    </div>
                    <div className="border-t border-gray-100"></div>
                    <div className="py-3 px-4">
                      <label htmlFor="mobile-new-password" className="block text-xs font-medium text-gray-700">
                        {t('user.newPassword', 'Nova Senha')}
                      </label>
                      <input
                        type="password"
                        id="mobile-new-password"
                        name="new-password"
                        autoComplete="new-password"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={t('user.newPasswordPlaceholder', 'Digite a nova senha')}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {updateMessage && (
                        <p className="mt-1 text-xs text-gray-500">{updateMessage}</p>
                      )}
                      <button
                        onClick={handleUpdatePassword}
                        className="mt-2 w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-1 px-3 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {t('user.updatePassword', 'Atualizar Senha')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="ml-auto flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.signOut')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('receipts.title')}</h2>
                <button
                  onClick={() => setShowReceiptForm(!showReceiptForm)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  {t('receipts.addReceipt')}
                </button>
              </div>

              {showReceiptForm && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <ReceiptForm onSuccess={() => setShowReceiptForm(false)} />
                </div>
              )}

              <ReceiptList />
            </div>
          )}
          {activeTab === 'bills' && <BillsManagement />}
          {activeTab === 'recurring' && <RecurringBills />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'sharing' && <ExpenseSharing />}
          {activeTab === 'ai-reports' && <AIReports />}
        </div>
      </main>

      {/* Support button */}
      <SupportButton />

      {/* Modal para IA Reports */}
      {showIAReportsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000]">
          <div
            className="absolute inset-0 bg-gray-900 opacity-50"
            onClick={() => setShowIAReportsModal(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-lg z-50 p-6 max-w-sm mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {t('iaReports.title', 'Relatórios com base em IA')}
              </h3>
              <button onClick={() => setShowIAReportsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700">
              {t('iaReports.comingSoon', 'Em breve, esta funcionalidade estará disponível.')}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowIAReportsModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
