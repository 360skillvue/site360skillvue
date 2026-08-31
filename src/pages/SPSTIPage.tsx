import React from 'react';
import { motion } from 'motion/react';
import {
  Stethoscope,
  ArrowRight,
  Mail,
  Check,
  ScanLine,
  Video,
  Users,
  Scale,
} from 'lucide-react';
import { useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

const FadeIn: React.FC<{ children: React.ReactNode, delay?: number, className?: string }> = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function SPSTIPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const allerContact = () => navigate('/aide-support');

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-warning/20">
      <PageMeta
        title={t.spsti.metaTitle}
        description={t.spsti.metaDescription}
        path="/spsti"
      />
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-scanup-warning/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-warning/10 text-scanup-warning text-sm font-medium mb-6 border border-scanup-warning/20">
                <Stethoscope size={16} />
                {t.spsti.heroBadge}
              </div>
              <h1 className="text-[26px] sm:text-[34px] md:text-[46px] lg:text-[52px] font-bold leading-[1.15] mb-6 tracking-tight">
                {t.spsti.heroTitle}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-warning to-scanup-blue">
                  {t.spsti.heroTitleHighlight}
                </span>
              </h1>
              <p className="text-[17px] text-scanup-graytext mb-8 leading-[1.65] max-w-xl">
                {t.spsti.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={allerContact}
                  className="bg-scanup-warning text-scanup-navy px-8 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-scanup-warning/20 group"
                >
                  {t.spsti.heroCtaDemo}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
              <p className="text-[13px] text-scanup-graytext mt-5">{t.spsti.heroNote}</p>
            </FadeIn>
          </div>

          <FadeIn delay={0.15}>
            <div className="rounded-[22px] border border-scanup-graylight bg-scanup-white shadow-xl shadow-scanup-navy/5 p-8">
              <div className="flex items-center gap-2 mb-6 text-scanup-blue">
                <Scale size={18} />
                <span className="text-[12px] uppercase tracking-widest font-semibold">{t.spsti.cadreLabel}</span>
              </div>
              <ul className="space-y-5">
                {t.spsti.cadre.map((c, i) => (
                  <li key={i} className="border-l-2 border-scanup-warning/40 pl-4">
                    <p className="text-[12px] font-semibold text-scanup-graytext tracking-wide mb-1">{c.tag}</p>
                    <p className="text-[16px] font-bold leading-snug">{c.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── CADRE REGLEMENTAIRE ───────────────────────────────── */}
      <section className="bg-scanup-graylight py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-[28px] md:text-[40px] font-bold mb-5 tracking-tight">{t.spsti.cadreTitle}</h2>
            <p className="text-[17px] text-scanup-graytext leading-relaxed">{t.spsti.cadreSubtitle}</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {t.spsti.cadre.map((c, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-scanup-white rounded-[20px] border border-scanup-graylight/80 p-8 h-full flex flex-col shadow-sm">
                  <p className="text-[12px] font-semibold text-scanup-warning tracking-wide mb-3">{c.tag}</p>
                  <h3 className="text-[19px] font-bold mb-4 leading-snug text-scanup-navy">{c.title}</h3>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed flex-grow">{c.desc}</p>
                  <p className="text-[15px] text-scanup-navy leading-relaxed mt-5 pt-5 border-t border-scanup-graylight font-medium">
                    {c.scanup}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ETUDE DE POSTE A DISTANCE ─────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="max-w-3xl mb-14">
            <div className="flex items-center gap-2 mb-4 text-scanup-blue">
              <Video size={18} />
              <span className="text-[12px] uppercase tracking-widest font-semibold">{t.spsti.etudeLabel}</span>
            </div>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-5 tracking-tight">{t.spsti.etudeTitle}</h2>
            <p className="text-[17px] text-scanup-graytext leading-relaxed">{t.spsti.etudeSubtitle}</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {t.spsti.etudePoints.map((p, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-[20px] border border-scanup-graylight p-8 h-full hover:shadow-xl hover:shadow-scanup-navy/5 transition-shadow duration-300">
                  <h3 className="text-[18px] font-bold mb-3 leading-snug text-scanup-navy">{p.title}</h3>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed">{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEPISTAGE RPS ET ORIENTATION ──────────────────────── */}
      <section className="bg-scanup-navy text-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="max-w-3xl mb-14">
            <div className="flex items-center gap-2 mb-4 text-scanup-turquoise">
              <ScanLine size={18} />
              <span className="text-[12px] uppercase tracking-widest font-semibold">{t.spsti.rpsLabel}</span>
            </div>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-5 tracking-tight text-white">{t.spsti.rpsTitle}</h2>
            <p className="text-[17px] text-white/70 leading-relaxed">{t.spsti.rpsSubtitle}</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {t.spsti.rpsPoints.map((p, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-[20px] border border-white/15 bg-white/5 p-8 h-full">
                  <h3 className="text-[18px] font-bold mb-3 leading-snug text-white">{p.title}</h3>
                  <p className="text-[15px] text-white/70 leading-relaxed">{p.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODES DE COLLABORATION ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="flex items-center justify-center gap-2 mb-4 text-scanup-blue">
              <Users size={18} />
              <span className="text-[12px] uppercase tracking-widest font-semibold">{t.spsti.modesLabel}</span>
            </div>
            <h2 className="text-[28px] md:text-[40px] font-bold tracking-tight">{t.spsti.modesTitle}</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {t.spsti.modes.map((m, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="rounded-[20px] border border-scanup-graylight p-8 h-full flex flex-col">
                  <h3 className="text-[20px] font-bold mb-4 text-scanup-navy">{m.title}</h3>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed flex-grow">{m.desc}</p>
                  <button
                    onClick={allerContact}
                    className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-scanup-blue hover:gap-3 transition-all duration-300 self-start"
                  >
                    {m.cta}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRACABILITE ───────────────────────────────────────── */}
      <section className="bg-scanup-graylight py-24">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="mb-10">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-4">{t.spsti.tracaLabel}</p>
            <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight">{t.spsti.tracaTitle}</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <ul className="space-y-4">
              {t.spsti.tracaItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 shrink-0 w-5 h-5 rounded-full bg-scanup-success/10 flex items-center justify-center">
                    <Check size={13} className="text-scanup-success" />
                  </span>
                  <span className="text-[16px] text-scanup-navy leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-8 tracking-tight">{t.spsti.ctaTitle}</h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={allerContact}
              className="bg-scanup-warning text-scanup-navy px-8 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors inline-flex items-center gap-2 shadow-xl shadow-scanup-warning/20 group"
            >
              {t.spsti.ctaButton}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <p className="mt-8 text-[15px] text-scanup-graytext flex items-center justify-center gap-2">
              <Mail size={16} />
              <a href={`mailto:${t.spsti.ctaEmail}`} className="hover:text-scanup-navy transition-colors">
                {t.spsti.ctaEmail}
              </a>
            </p>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
