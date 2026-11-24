import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage, localizePath } from '../i18n';
import { EssaiScanupSection, ESSAI_META } from '../components/EssaiScanup';

/** Page dédiée à l'essai gratuit, avec sa propre image d'aperçu pour les partages (LinkedIn, mails). */
export default function EssaiGratuitPage() {
  const { lang } = useLanguage();
  const meta = ESSAI_META[lang] ?? ESSAI_META.fr;
  const navigate = useNavigate();
  const location = useLocation();
  // Arrivée directe par un lien partagé (LinkedIn, mail) : on glisse l'accueil
  // derrière cette page, pour que « Retour » mène à l'accueil du site et non à
  // la page vue avant d'ouvrir le lien.
  useEffect(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx !== 0) return;
    const ici = location.pathname + location.search + location.hash;
    navigate(localizePath('/', lang), { replace: true });
    navigate(ici);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-[#F8F9FC]">
      <PageMeta
        title={meta.title}
        description={meta.description}
        path="/essai-gratuit"
        ogImage="https://360skillvue.com/og-essai-audio-video.png"
      />
      <Navbar />
      <EssaiScanupSection page />
      <Footer />
    </div>
  );
}
