import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Shield } from 'lucide-react';

type ConsentState = {
  analytics: boolean;
  marketing: boolean;
  decided: boolean;
};

const STORAGE_KEY = 'scanup_cookie_consent';
const GTM_ID = 'GTM-K2K7CQQF';

function getStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

function pushConsent(analytics: boolean, marketing: boolean) {
  const win = window as any;
  if (typeof win.gtag !== 'function') return;
  win.gtag('consent', 'update', {
    analytics_storage: analytics ? 'granted' : 'denied',
    ad_storage: marketing ? 'granted' : 'denied',
    ad_user_data: marketing ? 'granted' : 'denied',
    ad_personalization: marketing ? 'granted' : 'denied',
    wait_for_update: 500,
  });
}

function loadGTM() {
  if (document.getElementById('gtm-script')) return;
  const win = window as any;
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.id = 'gtm-script';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);

  // noscript iframe
  if (!document.getElementById('gtm-noscript')) {
    const ns = document.createElement('noscript');
    ns.id = 'gtm-noscript';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.cssText = 'display:none;visibility:hidden';
    ns.appendChild(iframe);
    document.body.insertBefore(ns, document.body.firstChild);
  }
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);

  useEffect(() => {
    const stored = getStored();
    if (stored?.decided) {
      pushConsent(stored.analytics, stored.marketing);
      loadGTM();
    } else {
      setVisible(true);
    }
  }, []);

  function save(analytics: boolean, marketing: boolean) {
    const state: ConsentState = { analytics, marketing, decided: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    pushConsent(analytics, marketing);
    loadGTM();
    setVisible(false);
  }

  function acceptAll() { save(true, true); }
  function refuseAll() { save(false, false); }
  function saveCustom() { save(analyticsOn, marketingOn); }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestion des cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl shadow-black/20 border border-black/[0.07] overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="w-8 h-8 rounded-lg bg-scanup-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Shield size={15} className="text-scanup-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-scanup-navy mb-1">Nous respectons votre vie privée</p>
            <p className="text-[12px] text-scanup-graytext leading-relaxed">
              Nous utilisons des cookies pour améliorer votre expérience et mesurer l'audience du site.
              Certains sont nécessaires au fonctionnement, d'autres sont optionnels.{' '}
              <a href="/politique-confidentialite" className="text-scanup-blue underline underline-offset-2">
                En savoir plus
              </a>
            </p>
          </div>
          <button
            onClick={refuseAll}
            aria-label="Fermer et refuser"
            className="flex-shrink-0 text-scanup-graytext hover:text-scanup-navy transition-colors p-1 -mr-1 -mt-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Expandable categories */}
        {expanded && (
          <div className="px-5 pb-4 space-y-3 border-t border-black/[0.06] pt-4">
            {/* Nécessaires */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-scanup-navy">Cookies nécessaires</p>
                <p className="text-[11px] text-scanup-graytext">Authentification, sécurité, préférences de langue. Toujours actifs.</p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-10 h-5 rounded-full bg-scanup-blue/20 relative cursor-not-allowed">
                  <div className="absolute right-1 top-0.5 w-4 h-4 rounded-full bg-scanup-blue/50" />
                </div>
              </div>
            </div>
            {/* Analytiques */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-scanup-navy">Cookies analytiques</p>
                <p className="text-[11px] text-scanup-graytext">Google Analytics — mesure d'audience anonymisée.</p>
              </div>
              <button
                role="switch"
                aria-checked={analyticsOn}
                aria-label="Activer les cookies analytiques"
                onClick={() => setAnalyticsOn(v => !v)}
                className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-scanup-blue focus:ring-offset-1 ${analyticsOn ? 'bg-scanup-blue' : 'bg-black/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${analyticsOn ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            {/* Marketing */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-scanup-navy">Cookies marketing</p>
                <p className="text-[11px] text-scanup-graytext">Google Ads — publicités personnalisées et mesure de conversions.</p>
              </div>
              <button
                role="switch"
                aria-checked={marketingOn}
                aria-label="Activer les cookies marketing"
                onClick={() => setMarketingOn(v => !v)}
                className={`flex-shrink-0 w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-scanup-blue focus:ring-offset-1 ${marketingOn ? 'bg-scanup-blue' : 'bg-black/10'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${marketingOn ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {expanded ? (
            <>
              <button
                onClick={saveCustom}
                className="flex-1 sm:flex-none sm:order-3 bg-scanup-blue text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Enregistrer mes choix
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none sm:order-2 bg-scanup-navy text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#0a1628] transition-colors"
              >
                Tout accepter
              </button>
              <button
                onClick={refuseAll}
                className="flex-1 sm:flex-none sm:order-1 text-scanup-graytext text-[13px] px-5 py-2.5 rounded-xl border border-black/10 hover:border-scanup-navy hover:text-scanup-navy transition-colors"
              >
                Tout refuser
              </button>
            </>
          ) : (
            <>
              <button
                onClick={acceptAll}
                className="flex-1 sm:flex-none sm:order-3 bg-scanup-blue text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Tout accepter
              </button>
              <button
                onClick={refuseAll}
                className="flex-1 sm:flex-none sm:order-2 text-scanup-graytext text-[13px] px-5 py-2.5 rounded-xl border border-black/10 hover:border-scanup-navy hover:text-scanup-navy transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 sm:flex-none sm:order-1 text-scanup-blue text-[13px] px-5 py-2.5 rounded-xl hover:bg-scanup-blue/5 transition-colors flex items-center justify-center gap-1"
              >
                Personnaliser <ChevronDown size={13} />
              </button>
            </>
          )}
          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="sm:ml-auto text-scanup-graytext text-[12px] flex items-center gap-1 hover:text-scanup-navy transition-colors"
            >
              <ChevronUp size={12} /> Réduire
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
