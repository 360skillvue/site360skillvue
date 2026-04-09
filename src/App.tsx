import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import CookieConsent from './components/CookieConsent';

const HomePage          = lazy(() => import('./pages/HomePage'));
const CertificationPage = lazy(() => import('./pages/CertificationPage'));
const EntreprisesPage   = lazy(() => import('./pages/EntreprisesPage'));
const AssureursPage     = lazy(() => import('./pages/AssureursPage'));
const SPSTIPage         = lazy(() => import('./pages/SPSTIPage'));
const PartenairesPage   = lazy(() => import('./pages/PartenairesPage'));
const AidePage          = lazy(() => import('./pages/AidePage'));
const NotFoundPage        = lazy(() => import('./pages/NotFoundPage'));
const TarifsPage                   = lazy(() => import('./pages/TarifsPage'));
const MentionsLegalesPage          = lazy(() => import('./pages/MentionsLegalesPage'));
const CGUPage                      = lazy(() => import('./pages/CGUPage'));
const CGVPage                      = lazy(() => import('./pages/CGVPage'));
const PolitiqueConfidentialitePage = lazy(() => import('./pages/PolitiqueConfidentialitePage'));

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-scanup-blue/20 border-t-scanup-blue rounded-full animate-spin" />
          </div>
        }>
          <CookieConsent />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/certification-periodique-sante" element={<CertificationPage />} />
            <Route path="/entreprises-drh" element={<EntreprisesPage />} />
            <Route path="/assureurs-mutuelles" element={<AssureursPage />} />
            <Route path="/spsti" element={<SPSTIPage />} />
            <Route path="/partenaires" element={<PartenairesPage />} />
            <Route path="/aide-support" element={<AidePage />} />
            <Route path="/tarifs" element={<TarifsPage />} />
            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
            <Route path="/cgu" element={<CGUPage />} />
            <Route path="/cgv" element={<CGVPage />} />
            <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  );
}
