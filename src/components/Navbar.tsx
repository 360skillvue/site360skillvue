import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Building2, Shield, Stethoscope, Award, Menu, X, Globe } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../i18n';

const CERTIFICATION_HREFS = [
  { href: '/entreprises-drh',              icon: Building2   },
  { href: '/assureurs-mutuelles',          icon: Shield      },
  { href: '/spsti',                        icon: Stethoscope },
  { href: '/certification-periodique-sante', icon: Award     },
];

export default function Navbar() {
  const location                             = useLocation();
  const { lang, setLang, t }                 = useLanguage();
  const [certOpen, setCertOpen]              = useState(false);
  const [langOpen, setLangOpen]              = useState(false);
  const [mobileOpen, setMobileOpen]          = useState(false);
  const [mobileCertOpen, setMobileCertOpen]  = useState(false);
  const certTimeout                          = useRef<ReturnType<typeof setTimeout> | null>(null);

  const certItems = [
    { ...CERTIFICATION_HREFS[0], label: t.nav.certItems.entreprises.label,   desc: t.nav.certItems.entreprises.desc   },
    { ...CERTIFICATION_HREFS[1], label: t.nav.certItems.assureurs.label,     desc: t.nav.certItems.assureurs.desc     },
    { ...CERTIFICATION_HREFS[2], label: t.nav.certItems.spsti.label,         desc: t.nav.certItems.spsti.desc         },
    { ...CERTIFICATION_HREFS[3], label: t.nav.certItems.certification.label, desc: t.nav.certItems.certification.desc },
  ];

  useEffect(() => {
    setCertOpen(false);
    setLangOpen(false);
    setMobileOpen(false);
    setMobileCertOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function onCertEnter() {
    if (certTimeout.current) clearTimeout(certTimeout.current);
    setCertOpen(true);
  }
  function onCertLeave() {
    certTimeout.current = setTimeout(() => setCertOpen(false), 120);
  }

  const isCertActive = certItems.some(i => i.href === location.pathname);
  const isReseau     = location.pathname === '/partenaires';
  const isAide       = location.pathname === '/aide-support';
  const isTarifs     = location.pathname === '/tarifs';
  const isAPropos    = location.pathname === '/a-propos';

  const navLink = (active: boolean) =>
    `transition-colors font-medium relative py-1 text-[14px] ${active ? 'text-scanup-blue' : 'text-scanup-graytext hover:text-scanup-navy'}`;

  const activeLine = (active: boolean) => active
    ? <div className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-scanup-blue rounded-full" />
    : null;

  return (
    <>
      {/* Top accent bar */}
      <div className="h-[3px] w-full bg-gradient-to-r from-scanup-blue via-scanup-turquoise to-scanup-blue fixed top-0 z-50" />

      <nav className="sticky top-[3px] z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-[auto_1fr_auto] items-center gap-4">

          {/* ── Logo ───────────────────────────────────────────── */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-[18px] tracking-tight text-scanup-blue">ScanUp</span>
              <span className="text-scanup-graytext text-[13px]">by</span>
              <img src="/Logo360skillvue-200x55.webp" alt="360SkillVue" className="h-6 w-auto" />
            </Link>
          </motion.div>

          {/* ── Desktop nav — truly centred ─────────────────────── */}
          <div className="hidden md:flex items-center justify-center gap-7">

            {/* Solutions dropdown */}
            <div className="relative" onMouseEnter={onCertEnter} onMouseLeave={onCertLeave}>
              <button className={`flex items-center gap-1 ${navLink(isCertActive)}`}>
                {t.nav.certification}
                <motion.span animate={{ rotate: certOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={12} />
                </motion.span>
              </button>
              {activeLine(isCertActive)}

              <AnimatePresence>
                {certOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    onMouseEnter={onCertEnter}
                    onMouseLeave={onCertLeave}
                    className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-[320px] bg-white rounded-2xl border border-black/[0.08] shadow-xl shadow-black/[0.08] p-2 z-50"
                  >
                    {certItems.map(item => {
                      const Icon   = item.icon;
                      const active = location.pathname === item.href;
                      return (
                        <Link key={item.href} to={item.href}
                          className={`flex items-start gap-3 p-3 rounded-xl transition-colors group ${
                            active ? 'bg-scanup-blue/[0.06]' : 'hover:bg-[#f8f9fb]'
                          }`}>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 transition-colors ${
                            active ? 'bg-scanup-blue text-white' : 'bg-[#f1f5f9] text-scanup-graytext group-hover:bg-scanup-blue/10 group-hover:text-scanup-blue'
                          }`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[13px] font-semibold leading-tight ${active ? 'text-scanup-blue' : 'text-scanup-navy'}`}>{item.label}</p>
                            <p className="text-[11px] text-scanup-graytext mt-0.5 leading-snug">{item.desc}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/partenaires" className={navLink(isReseau)}>
              {t.nav.network}
              {activeLine(isReseau)}
            </Link>

            <Link to="/tarifs" className={navLink(isTarifs)}>
              {t.nav.pricing}
              {activeLine(isTarifs)}
            </Link>

            <Link to="/a-propos" className={navLink(isAPropos)}>
              {t.nav.about}
              {activeLine(isAPropos)}
            </Link>

            <Link to="/aide-support" className={navLink(isAide)}>
              {t.nav.help}
              {activeLine(isAide)}
            </Link>
          </div>

          {/* ── Right actions ───────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2">

            {/* Language selector */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-1.5 text-[13px] font-medium text-scanup-navy hover:text-scanup-blue transition-colors border border-black/[0.08] hover:border-scanup-blue/30 rounded-full px-3 py-2"
              >
                <Globe size={13} />
                <span className="text-[12px]">{lang.toUpperCase()}</span>
              </motion.button>

              <AnimatePresence>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[101] bg-white rounded-2xl border border-black/[0.08] shadow-xl shadow-black/[0.08] p-1.5 w-[160px]"
                    >
                      {LANGUAGES.map(l => (
                        <button key={l.code}
                          onClick={() => { setLang(l.code); setLangOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                            lang === l.code ? 'bg-scanup-blue/[0.07] text-scanup-blue' : 'text-scanup-navy hover:bg-[#f8f9fb]'
                          }`}
                        >
                          <img src={l.flagUrl} alt={l.code} className="w-5 h-3.5 object-cover rounded-[2px] flex-shrink-0" />
                          <span>{l.label}</span>
                          {lang === l.code && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-scanup-blue" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Accès plateforme — desktop */}
            <motion.a
              href="https://scanup.360skillvue.com/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-1.5 border border-black/[0.08] hover:border-scanup-blue/30 rounded-full px-3 py-2 transition-colors whitespace-nowrap"
            >
              <span className="font-bold text-[13px] text-scanup-blue tracking-tight">Se connecter</span>
            </motion.a>

            {/* CTA — desktop */}
            <motion.a
              href="/aide-support#contact"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="hidden sm:flex bg-scanup-blue text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-scanup-blue/20 whitespace-nowrap"
            >
              {t.nav.trial}
            </motion.a>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-black/[0.08] text-scanup-navy hover:bg-[#f8f9fb] transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile menu ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-40 w-[85vw] max-w-[320px] bg-white shadow-2xl flex flex-col"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06]">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <span className="font-bold text-[17px] text-scanup-blue">ScanUp</span>
                  <span className="text-scanup-graytext text-[12px]">by 360SkillVue</span>
                </Link>
                <button onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-scanup-graytext hover:bg-[#f8f9fb] transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Mobile nav links */}
              <div className="flex-1 overflow-y-auto py-3 px-3">

                {/* Solutions dropdown */}
                <div className="mb-0.5">
                  <button
                    onClick={() => setMobileCertOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-[14px] font-medium text-scanup-navy hover:bg-[#f8f9fb] transition-colors"
                  >
                    {t.nav.certification}
                    <motion.span animate={{ rotate: mobileCertOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} className="text-scanup-graytext" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileCertOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pl-3 pb-2 flex flex-col gap-0.5">
                          {certItems.map(item => {
                            const Icon   = item.icon;
                            const active = location.pathname === item.href;
                            return (
                              <Link key={item.href} to={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-colors ${
                                  active ? 'bg-scanup-blue/[0.07] text-scanup-blue font-semibold' : 'text-scanup-navy hover:bg-[#f8f9fb]'
                                }`}>
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  active ? 'bg-scanup-blue text-white' : 'bg-[#f1f5f9] text-scanup-graytext'
                                }`}>
                                  <Icon size={12} />
                                </div>
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {[
                  { to: '/partenaires', label: t.nav.network,  active: isReseau  },
                  { to: '/tarifs',      label: t.nav.pricing,   active: isTarifs  },
                  { to: '/a-propos',    label: t.nav.about,     active: isAPropos },
                  { to: '/aide-support', label: t.nav.help,     active: isAide    },
                ].map(item => (
                  <Link key={item.to} to={item.to}
                    className={`flex items-center px-3 py-3 rounded-xl text-[14px] font-medium transition-colors mb-0.5 ${
                      item.active ? 'bg-scanup-blue/[0.07] text-scanup-blue' : 'text-scanup-navy hover:bg-[#f8f9fb]'
                    }`}>
                    {item.label}
                  </Link>
                ))}

                <div className="my-4 border-t border-black/[0.06]" />

                {/* Language selector */}
                <div className="px-3 py-2">
                  <p className="text-[10px] font-semibold text-scanup-graytext uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Globe size={10} /> Langue
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {LANGUAGES.map(l => (
                      <button key={l.code}
                        onClick={() => setLang(l.code)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                          lang === l.code
                            ? 'bg-scanup-blue/[0.07] text-scanup-blue border-scanup-blue/20'
                            : 'text-scanup-navy border-black/[0.08] hover:bg-[#f8f9fb]'
                        }`}
                      >
                        <img src={l.flagUrl} alt={l.code} className="w-5 h-3.5 object-cover rounded-[2px]" />
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile CTAs */}
              <div className="p-4 border-t border-black/[0.06] flex flex-col gap-2">
                <a
                  href="https://scanup.360skillvue.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full border border-scanup-blue/30 text-scanup-blue py-3 rounded-full text-[14px] font-semibold hover:bg-scanup-blue/5 transition-colors text-center"
                >
                  Se connecter
                </a>
                <a
                  href="/aide-support#contact"
                  className="block w-full bg-scanup-blue text-white py-3 rounded-full text-[14px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-scanup-blue/20 text-center"
                >
                  {t.nav.trial}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
