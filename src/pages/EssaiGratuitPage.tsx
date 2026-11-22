import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage } from '../i18n';
import { EssaiScanupSection, ESSAI_META } from '../components/EssaiScanup';

/** Page dédiée à l'essai gratuit, avec sa propre image d'aperçu pour les partages (LinkedIn, mails). */
export default function EssaiGratuitPage() {
  const { lang } = useLanguage();
  const meta = ESSAI_META[lang] ?? ESSAI_META.fr;
  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-[#F8F9FC]">
      <PageMeta
        title={meta.title}
        description={meta.description}
        path="/essai-gratuit"
        ogImage="https://360skillvue.com/og-essai-gratuit.png"
      />
      <Navbar />
      <EssaiScanupSection page />
      <Footer />
    </div>
  );
}
