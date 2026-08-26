import React from 'react';
import { Link } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">
      <PageMeta
        title="Page introuvable"
        description="La page que vous recherchez n'existe pas."
        path="/404"
      />
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <p className="text-[80px] font-bold text-scanup-blue/20 leading-none mb-4">404</p>
        <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight mb-4">
          {t.notFound.title}
        </h1>
        <p className="text-[16px] text-scanup-graytext mb-8 max-w-md leading-relaxed">
          {t.notFound.subtitle}
        </p>
        <Link
          to="/"
          className="bg-scanup-blue text-white px-8 py-3.5 rounded-full font-semibold text-[15px] hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/25"
        >
          {t.notFound.button}
        </Link>
      </div>

      <Footer />
    </div>
  );
}
