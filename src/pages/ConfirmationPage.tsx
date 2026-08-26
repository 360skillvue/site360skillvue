import React, { useEffect } from 'react';
import { Link } from '../i18n/Link';
import { motion } from 'motion/react';
import {
  CheckCircle2, Mail, ListChecks, CalendarDays, ArrowRight, Home,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage, type Lang } from '../i18n';

type Props = {
  forcedLang: Lang;
  path: string;
};

export default function ConfirmationPage({ forcedLang, path }: Props) {
  const { t, lang, setLang } = useLanguage();

  useEffect(() => {
    if (lang !== forcedLang) setLang(forcedLang);
  }, [forcedLang, lang, setLang]);

  const c = t.confirmation;

  const steps = [
    { icon: Mail,         title: c.step1Title, desc: c.step1Desc },
    { icon: ListChecks,   title: c.step2Title, desc: c.step2Desc },
    { icon: CalendarDays, title: c.step3Title, desc: c.step3Desc },
  ];

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">
      <PageMeta
        title={c.title}
        description={c.subtitle}
        path={path}
      />
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-b from-scanup-blue/[0.04] via-white to-white pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold mb-6"
          >
            <CheckCircle2 size={14} />
            {c.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="text-[32px] md:text-[44px] font-bold tracking-tight leading-tight mb-5"
          >
            {c.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[16px] md:text-[17px] text-scanup-graytext leading-relaxed max-w-2xl mx-auto"
          >
            {c.subtitle}
          </motion.p>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-black/[0.07] rounded-3xl p-7 shadow-sm shadow-black/[0.04]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-scanup-blue/[0.08] flex items-center justify-center mb-4">
                    <Icon size={18} className="text-scanup-blue" />
                  </div>
                  <p className="text-[15px] font-bold text-scanup-navy mb-2">{s.title}</p>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-scanup-blue/[0.04] to-white border border-black/[0.07] rounded-3xl p-8 md:p-12">
            <p className="text-[20px] md:text-[24px] font-bold tracking-tight mb-2">{c.exploreTitle}</p>
            <p className="text-[14px] text-scanup-graytext mb-7">{c.exploreSubtitle}</p>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { to: '/certification-periodique-sante', label: c.linkCertification },
                { to: '/entreprises-drh',                label: c.linkEntreprises },
                { to: '/spsti',                          label: c.linkSpsti },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="group flex items-center justify-between gap-3 px-5 py-4 bg-white border border-black/[0.07] rounded-2xl hover:border-scanup-blue/40 hover:shadow-sm transition-all"
                >
                  <span className="text-[14px] font-semibold text-scanup-navy">{l.label}</span>
                  <ArrowRight size={16} className="text-scanup-graytext/50 group-hover:text-scanup-blue group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-8 pt-7 border-t border-black/[0.06]">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-scanup-blue text-white px-6 py-3 rounded-full font-semibold text-[14px] hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/25"
              >
                <Home size={15} />
                {c.backHome}
              </Link>
              <Link
                to="/aide-support"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] text-scanup-navy hover:text-scanup-blue transition-colors"
              >
                {c.contact}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
