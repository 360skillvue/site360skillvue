import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider, PREFIXED_LANGS } from './i18n';
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
const AProposPage                  = lazy(() => import('./pages/AProposPage'));
const RevueDePressePage            = lazy(() => import('./pages/RevueDePressePage'));
const ConfirmationPage             = lazy(() => import('./pages/ConfirmationPage'));

/**
 * Chemins publics du site, sans prefixe de langue.
 * Le francais vit a la racine ; chaque autre langue reprend les memes
 * chemins sous son prefixe, par exemple /es/tarifs.
 */
const PAGES: { path: string; element: React.ReactNode }[] = [
  { path: '/',                              element: <HomePage /> },
  { path: '/certification-periodique-sante', element: <CertificationPage /> },
  { path: '/entreprises-drh',               element: <EntreprisesPage /> },
  { path: '/assureurs-mutuelles',           element: <AssureursPage /> },
  { path: '/spsti',                         element: <SPSTIPage /> },
  { path: '/partenaires',                   element: <PartenairesPage /> },
  { path: '/aide-support',                  element: <AidePage /> },
  { path: '/tarifs',                        element: <TarifsPage /> },
  { path: '/mentions-legales',              element: <MentionsLegalesPage /> },
  { path: '/cgu',                           element: <CGUPage /> },
  { path: '/cgv',                           element: <CGVPage /> },
  { path: '/politique-confidentialite',     element: <PolitiqueConfidentialitePage /> },
  { path: '/a-propos',                      element: <AProposPage /> },
  { path: '/revue-de-presse',               element: <RevueDePressePage /> },
];

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-8 h-8 border-2 border-scanup-blue/20 border-t-scanup-blue rounded-full animate-spin" />
          </div>
        }>
          <CookieConsent />
          <Routes>
            {PAGES.map(p => (
              <Route key={p.path} path={p.path} element={p.element} />
            ))}
            {PREFIXED_LANGS.flatMap(lg =>
              PAGES.map(p => (
                <Route
                  key={`${lg}${p.path}`}
                  path={p.path === '/' ? `/${lg}` : `/${lg}${p.path}`}
                  element={p.element}
                />
              ))
            )}

            {/* Pages de confirmation Calendly, adresses figees par langue */}
            <Route path="/demande-calendly-bien-recue" element={<ConfirmationPage forcedLang="fr" path="/demande-calendly-bien-recue/" />} />
            <Route path="/demande-calendly-bien-recue/" element={<ConfirmationPage forcedLang="fr" path="/demande-calendly-bien-recue/" />} />
            <Route path="/en/appointment-confirmation" element={<ConfirmationPage forcedLang="en" path="/en/appointment-confirmation/" />} />
            <Route path="/en/appointment-confirmation/" element={<ConfirmationPage forcedLang="en" path="/en/appointment-confirmation/" />} />
            <Route path="/de/terminbestaetigung" element={<ConfirmationPage forcedLang="de" path="/de/terminbestaetigung/" />} />
            <Route path="/de/terminbestaetigung/" element={<ConfirmationPage forcedLang="de" path="/de/terminbestaetigung/" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </LanguageProvider>
    </Router>
  );
}
