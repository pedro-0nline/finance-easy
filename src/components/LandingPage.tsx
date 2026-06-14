import React from 'react';
import { Receipt, FileText, Bell, Users, Tag, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../config/site';

const features = [
  {
    icon: <Receipt className="h-6 w-6 text-blue-500" />,
    title: 'Receipt Management',
    description: 'Easily upload and organize your receipts. Track expenses with smart categorization.'
  },
  {
    icon: <FileText className="h-6 w-6 text-blue-500" />,
    title: 'Bill Tracking',
    description: 'Never miss a payment with our bill tracking system. Set up reminders and installments.'
  },
  {
    icon: <Bell className="h-6 w-6 text-blue-500" />,
    title: 'Recurring Bills',
    description: 'Manage your recurring expenses efficiently. Automatic monthly bill generation.'
  },
  {
    icon: <Tag className="h-6 w-6 text-blue-500" />,
    title: 'Smart Categories',
    description: 'Organize expenses by categories. Get insights into your spending patterns.'
  },
  {
    icon: <Users className="h-6 w-6 text-blue-500" />,
    title: 'Expense Sharing',
    description: 'Split bills with friends and family. Track shared expenses and settlements.'
  },
  {
    icon: <Shield className="h-6 w-6 text-blue-500" />,
    title: 'Secure Storage',
    description: 'Your financial data is encrypted and securely stored. Access from anywhere.'
  }
];

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">FinanceEasy</span>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={() => navigate(ROUTES.login)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {t('auth.login')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-8 md:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Manage Your Finances with Confidence
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Track expenses, manage bills, and share costs effortlessly. Your all-in-one solution for personal finance management.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate(ROUTES.login)}
              className="px-8 py-3 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need</h2>
            <p className="mt-4 text-xl text-gray-600">
              Powerful features to help you manage your finances effectively
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
            <div className="flex items-center">
              <Receipt className="h-8 w-8 text-blue-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                FinanceEasy
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link to={ROUTES.privacy} className="hover:text-blue-600">
                {t('legal.privacyPolicy', 'Política de Privacidade')}
              </Link>
              <Link to={ROUTES.terms} className="hover:text-blue-600">
                {t('legal.termsOfService', 'Termos de Serviço')}
              </Link>
            </nav>
            <p className="text-gray-600">© 2026 FinanceEasy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}