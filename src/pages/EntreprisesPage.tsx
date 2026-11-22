import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown, Mail, Check, EyeOff, CalendarX2, Wallet, BatteryLow, ClipboardCheck, ScanSearch, Video, Brain, PersonStanding, Radar, Users, ShieldCheck, ChartColumn, Accessibility } from 'lucide-react';

// Icônes des cinq leviers du bloc « La solution », dans l'ordre des textes.
const FEATURE_ICONS = [Radar, Users, ShieldCheck, ChartColumn, Accessibility];

// Icônes des cinq constats du bloc « La réalité terrain », dans l'ordre des textes.
const PROBLEM_ICONS = [EyeOff, CalendarX2, Wallet, BatteryLow, ClipboardCheck];
import { useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';
import { EssaiScanupBouton, EssaiScanupSection } from '../components/EssaiScanup';

/* ── Helpers ─────────────────────────────────────────────── */

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ''
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ── Data ────────────────────────────────────────────────── */

/* Destinations des quatre offres. Le simulateur et la page formation sont des
   pages statiques hors SPA, d'où la navigation par lien plein. */
// Icône et couleur de chaque offre, dans l'ordre des textes : dépistage, étude de situation, formation RPS, formation TMS.
const OFFRE_STYLES = [
  { icon: ScanSearch,     color: '#0068FF', soft: 'rgba(0,104,255,0.08)' },
  { icon: Video,          color: '#0E9F8A', soft: 'rgba(14,159,138,0.10)' },
  { icon: Brain,          color: '#8B5CF6', soft: 'rgba(139,92,246,0.10)' },
  { icon: PersonStanding, color: '#F97316', soft: 'rgba(249,115,22,0.10)' },
];
const OFFRE_LINKS = [
  { href: '/simulateur-cout-tms-rps',         spa: false },
  { href: '/aide-support#contact',            spa: false }, // Étude de situation : directement le formulaire « Nous contacter »
  { href: '/formation-risques-psychosociaux', spa: false },
  { href: '/formation-prevention-tms-sur-mesure.html', spa: false },
];



/* ── Component ───────────────────────────────────────────── */

export default function EntreprisesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const stats    = t.entreprises.stats;
  const problems = t.entreprises.problems;
  const features = t.entreprises.features;
  const offres   = t.entreprises.offres;
  const faqs     = t.entreprises.faqs;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">
      <PageMeta
        title={t.meta.entreprises.title}
        description={t.meta.entreprises.description}
        path="/entreprises-drh"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f: { q: string; a: string }) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
      `}</style>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32 px-6 text-center overflow-hidden">
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(0,104,255,0.07) 0%, transparent 65%)' }} />
        </div>

        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-scanup-blue/20 bg-scanup-blue/5 text-scanup-blue text-[12px] font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
              {t.entreprises.heroBadge}
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="text-[26px] sm:text-[36px] md:text-[44px] lg:text-[60px] font-bold tracking-[-0.02em] leading-[1.08] mb-8">
              {t.entreprises.heroTitle}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
                {t.entreprises.heroTitleHighlight}
              </span>
              <br />{t.entreprises.heroTitleEnd}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-[18px] text-scanup-graytext leading-[1.75] max-w-2xl mx-auto mb-10">
              {t.entreprises.heroSubtitle}
            </p>
          </Reveal>

          <Reveal delay={0.15} className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            <EssaiScanupBouton />
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { window.location.href = '/simulateur-cout-tms-rps'; }}
              className="text-scanup-navy px-8 py-3.5 rounded-full font-semibold text-[15px] border border-scanup-blue/30 hover:border-scanup-blue hover:text-scanup-blue transition-all flex items-center gap-2 group"
            >
              {t.entreprises.heroCtaPrimary}
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/aide-support')}
              className="text-scanup-navy px-8 py-3.5 rounded-full font-semibold text-[15px] border border-black/10 hover:border-scanup-blue hover:text-scanup-blue transition-all"
            >
              {t.entreprises.heroCtaSecondary}
            </motion.button>
          </Reveal>

          {/* stats */}
          <Reveal delay={0.2} className="mt-20 pt-12 border-t border-black/[0.06] grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.25 + i * 0.07, duration: 0.5 }}
              >
                <div className="text-[28px] sm:text-[36px] font-bold tracking-tight text-scanup-navy leading-none mb-1">{s.value}</div>
                <div className="text-[13px] text-scanup-graytext">{s.label}</div>
              </motion.div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Nos quatre offres ─────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-black/[0.06] bg-gradient-to-b from-white to-[#F8F9FC]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.entreprises.offresLabel}</p>
            <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.02em] leading-[1.1]">
              {t.entreprises.offresTitle}<br /><span className="text-scanup-blue">{t.entreprises.offresTitleEnd}</span>
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            {offres.map((o: { title: string; body: string; cta: string }, i: number) => {
              const st = OFFRE_STYLES[i % OFFRE_STYLES.length];
              const Icon = st.icon;
              return (
                <motion.a
                  key={i}
                  href={OFFRE_LINKS[i].href}
                  onClick={(e) => {
                    if (OFFRE_LINKS[i].spa) { e.preventDefault(); navigate(OFFRE_LINKS[i].href); }
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex flex-col rounded-2xl border border-black/[0.06] bg-white p-7 md:p-8 overflow-hidden shadow-[0_1px_2px_rgba(28,36,75,0.04)] hover:shadow-[0_16px_40px_-16px_rgba(28,36,75,0.22)] hover:-translate-y-0.5 transition-all duration-300 no-underline"
                >
                  <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: st.color }} />
                  <span aria-hidden="true" className="absolute -right-24 -top-24 w-48 h-48 rounded-full opacity-[0.06] group-hover:opacity-[0.11] transition-opacity" style={{ background: st.color }} />
                  <div className="relative flex items-center gap-4 mb-5">
                    <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: st.soft, color: st.color }}>
                      <Icon className="w-6 h-6" strokeWidth={1.8} />
                    </span>
                    <h3 className="text-[19px] font-semibold leading-snug text-scanup-navy">{o.title}</h3>
                  </div>
                  <p className="relative text-[14.5px] text-scanup-graytext leading-relaxed mb-7 flex-1">{o.body}</p>
                  <span className="relative self-start inline-flex items-center gap-2 text-[14px] font-semibold px-4 py-2.5 rounded-full transition-colors" style={{ background: st.soft, color: st.color }}>
                    {o.cta}
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Problems ─────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#F8F9FC]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14 max-w-2xl">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.entreprises.problemsLabel}</p>
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-[-0.02em] leading-[1.1]">
              {t.entreprises.problemsTitle} <span className="text-scanup-blue">{t.entreprises.problemsTitleEnd}</span>
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((p, i) => {
              const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex flex-col bg-white rounded-2xl border border-black/[0.06] p-7 shadow-[0_1px_2px_rgba(28,36,75,0.04)] hover:shadow-[0_12px_32px_-12px_rgba(28,36,75,0.18)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-5">
                    <span className="w-11 h-11 rounded-xl bg-scanup-blue/[0.08] text-scanup-blue flex items-center justify-center group-hover:bg-scanup-blue group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </span>
                    <span className="text-[12px] font-mono text-black/20">{p.n}</span>
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2 leading-snug">{p.title}</h3>
                  <p className="text-[14px] text-scanup-graytext leading-relaxed mb-6">{p.body}</p>
                  <p className="mt-auto pt-4 border-t border-black/[0.06] text-[13px] font-semibold text-scanup-navy flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-scanup-warning shrink-0" aria-hidden="true" />
                    {p.stat}
                  </p>
                </motion.div>
              );
            })}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: problems.length * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col justify-between rounded-2xl p-7 bg-scanup-navy text-white overflow-hidden"
            >
              <div aria-hidden="true" className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-scanup-blue/40 blur-3xl" />
              <div className="relative">
                <h3 className="text-[22px] font-bold leading-tight mb-3 text-white">{t.entreprises.problemsCtaTitle}</h3>
                <p className="text-[14px] text-white/70 leading-relaxed">{t.entreprises.problemsCtaBody}</p>
              </div>
              <button
                onClick={() => { window.location.href = '/simulateur-cout-tms-rps'; }}
                className="relative mt-6 self-start inline-flex items-center gap-2 bg-white text-scanup-navy text-[14px] font-semibold px-5 py-3 rounded-full hover:bg-scanup-turquoise transition-colors"
              >
                {t.entreprises.heroCtaPrimary}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr_1.35fr] gap-14 md:gap-20 items-start">
            <Reveal className="md:sticky md:top-28">
              <div className="relative rounded-3xl bg-scanup-navy text-white p-9 md:p-10 overflow-hidden">
                <div aria-hidden="true" className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-scanup-blue/50 blur-3xl" />
                <div aria-hidden="true" className="absolute -left-16 -bottom-24 w-56 h-56 rounded-full bg-scanup-turquoise/20 blur-3xl" />
                <div className="relative">
                  <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-turquoise mb-4">{t.entreprises.featuresLabel}</p>
                  <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.02em] leading-[1.15] mb-5 text-white">
                    {t.entreprises.featuresTitle}<br /><span className="text-scanup-turquoise">{t.entreprises.featuresTitleEnd}</span>
                  </h2>
                  <p className="text-[15px] text-white/70 leading-relaxed mb-8">
                    {t.entreprises.featuresSubtitle}
                  </p>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { window.location.href = '/simulateur-cout-tms-rps'; }}
                    className="inline-flex items-center gap-2 bg-white text-scanup-navy px-6 py-3 rounded-full font-semibold text-[14px] hover:bg-scanup-turquoise transition-colors"
                  >
                    {t.entreprises.featuresCtaButton}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </Reveal>

            <div className="relative">
              <div aria-hidden="true" className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-scanup-blue/40 via-scanup-blue/15 to-transparent" />
              {features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                    className="relative grid grid-cols-[48px_1fr] gap-5 pb-5 last:pb-0 group"
                  >
                    <span className="relative z-[1] w-12 h-12 rounded-2xl bg-white border border-scanup-blue/15 text-scanup-blue flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(0,104,255,0.25)] group-hover:bg-scanup-blue group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </span>
                    <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(28,36,75,0.04)] group-hover:shadow-[0_14px_34px_-16px_rgba(28,36,75,0.22)] group-hover:-translate-y-0.5 transition-all duration-300">
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-scanup-blue bg-scanup-blue/[0.08] px-2.5 py-1 rounded-full mb-3">{f.label}</span>
                      <h3 className="text-[18px] font-semibold mb-2 leading-snug">{f.title}</h3>
                      <p className="text-[14px] text-scanup-graytext leading-relaxed">{f.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────────── */}
      {/* Affiché seulement si un témoignage réel est renseigné dans la langue. */}
      {t.entreprises.testimonialQuote && (
      <section className="py-28 px-6 bg-[#F8F9FC]">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative">
              {/* giant quote mark */}
              <div className="absolute -top-8 -left-4 text-[140px] font-serif leading-none text-scanup-blue/[0.07] select-none pointer-events-none">"</div>
              <div className="relative">
                <p className="text-[24px] md:text-[32px] font-medium leading-[1.5] text-scanup-navy mb-10 tracking-[-0.01em]">
                  {t.entreprises.testimonialQuote}
                </p>
                <div className="flex items-center gap-4">
                  {t.entreprises.testimonialPhoto ? (
                    <img src={t.entreprises.testimonialPhoto} alt={t.entreprises.testimonialName} width={56} height={56} loading="lazy" className="w-14 h-14 rounded-full object-cover ring-2 ring-scanup-blue/30" />
                  ) : (
                  <div className="w-11 h-11 rounded-full bg-scanup-blue/10 flex items-center justify-center text-scanup-blue font-bold text-[13px]">
                    {t.entreprises.testimonialName.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  )}
                  <div>
                    <div className="text-[15px] font-semibold text-scanup-navy">{t.entreprises.testimonialName}</div>
                    <div className="text-[13px] text-scanup-graytext">{t.entreprises.testimonialRole}</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {t.entreprises.testimonials.length > 0 && (
          <div className="mt-16 grid md:grid-cols-2 gap-px bg-black/[0.06] rounded-2xl overflow-hidden">
            {t.entreprises.testimonials.map((testimonial, i) => (
              <Reveal key={i} delay={i * 0.1} className="bg-white p-8">
                <p className="text-[15px] text-scanup-graytext leading-relaxed italic mb-6">"{testimonial.text}"</p>
                <div className="text-[13px] font-semibold text-scanup-navy">{testimonial.name}</div>
                <div className="text-[12px] text-scanup-graytext">{testimonial.role}</div>
              </Reveal>
            ))}
          </div>
          )}
        </div>
      </section>
      )}


      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.02em]">{t.entreprises.faqTitle}</h2>
          </Reveal>
          <div className="border-t border-black/[0.06]">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="border-b border-black/[0.06]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full text-left py-6 gap-8 group"
                  >
                    <span className="text-[16px] font-semibold group-hover:text-scanup-blue transition-colors">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                      <div className="w-6 h-6 rounded-full border border-black/15 flex items-center justify-center group-hover:border-scanup-blue group-hover:text-scanup-blue transition-colors text-[18px] leading-none font-light">+</div>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="pb-6 text-[15px] text-scanup-graytext leading-relaxed">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Essai gratuit en libre accès ─────────────────────── */}
      <EssaiScanupSection />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(0,104,255,0.07) 0%, transparent 60%)' }} />
        </div>
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="text-[36px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.1] mb-6">
            {t.entreprises.ctaTitle}<br />{t.entreprises.ctaTitleEnd}
          </h2>
          <p className="text-[17px] text-scanup-graytext mb-10 leading-relaxed">
            {t.entreprises.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { window.location.href = '/simulateur-cout-tms-rps'; }}
              className="bg-scanup-blue text-white px-8 py-4 rounded-full font-semibold text-[15px] hover:bg-blue-700 transition-colors shadow-xl shadow-scanup-blue/20"
            >
              {t.entreprises.ctaPrimary}
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/aide-support')}
              className="text-scanup-navy px-8 py-4 rounded-full font-semibold text-[15px] border border-black/10 hover:border-scanup-blue hover:text-scanup-blue transition-all"
            >
              {t.entreprises.ctaSecondary}
            </motion.button>
          </div>
          <a href={`mailto:${t.entreprises.ctaEmail}`} className="inline-flex items-center gap-1.5 text-[13px] text-scanup-graytext hover:text-scanup-navy transition-colors">
            <Mail size={12} /> {t.entreprises.ctaEmail}
          </a>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
