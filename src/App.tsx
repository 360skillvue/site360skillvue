import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';

const HomePage          = lazy(() => import('./pages/HomePage'));
const CertificationPage = lazy(() => import('./pages/CertificationPage'));
const EntreprisesPage   = lazy(() => import('./pages/EntreprisesPage'));
const AssureursPage     = lazy(() => import('./pages/AssureursPage'));
const SPSTIPage         = lazy(() => import('./pages/SPSTIPage'));
const PartenairesPage   = lazy(() => import('./pages/PartenairesPage'));
const AidePage          = lazy(() => import('./pages/AidePage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/certification-periodique-sante" element={<CertificationPage />} />
            <Route path="/entreprises-drh" element={<EntreprisesPage />} />
            <Route path="/assureurs-mutuelles" element={<AssureursPage />} />
            <Route path="/spsti" element={<SPSTIPage />} />
            <Route path="/partenaires" element={<PartenairesPage />} />
            <Route path="/aide-support" element={<AidePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </LanguageProvider>
  );
}
