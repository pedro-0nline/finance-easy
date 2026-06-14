import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/site';

/** 404 page so there are no "broken routes" that Google could flag. */
export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">404</h1>
        <p className="mt-3 text-gray-600">Página não encontrada.</p>
        <Link
          to={ROUTES.home}
          className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
