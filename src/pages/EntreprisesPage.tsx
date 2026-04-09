import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronDown, Mail, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

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


/* ── Component ───────────────────────────────────────────── */

export default function EntreprisesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const stats    = t.entreprises.stats;
  const problems = t.entreprises.problems;
  const features = t.entreprises.features;
  const personas = t.entreprises.personas;
  const faqs     = t.entreprises.faqs;
  const plans    = t.entreprises.plans.map((p, i) => ({ ...p, featured: i === 2 }));

  const [activePersona, setActivePersona] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white">
      <PageMeta
        title="Entreprises & DRH — Dépistage TMS & RPS"
        description="Dépistez les risques TMS et RPS de vos équipes sans audit. Résultats en 48h, dès 5€ par évaluation."
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

          <Reveal delay={0.15} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-blue text-white px-8 py-3.5 rounded-full font-semibold text-[15px] hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/25 flex items-center gap-2 group"
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

      {/* ── Problems ─────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-16">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.entreprises.problemsLabel}</p>
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-[-0.02em] leading-[1.1]">
              {t.entreprises.problemsTitle}<br />{t.entreprises.problemsTitleEnd}
            </h2>
          </Reveal>

          <div>
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.06, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[40px_1fr_auto] md:grid-cols-[56px_1fr_160px] gap-6 md:gap-10 py-7 border-b border-black/[0.06] group"
              >
                <div className="text-[13px] font-mono text-black/20 pt-0.5 group-hover:text-scanup-blue transition-colors">{p.n}</div>
                <div>
                  <h3 className="text-[17px] font-semibold mb-1.5 group-hover:text-scanup-blue transition-colors">{p.title}</h3>
                  <p className="text-[14px] text-scanup-graytext leading-relaxed">{p.body}</p>
                </div>
                <div className="hidden md:block text-right pt-0.5">
                  <span className="text-[12px] font-semibold text-scanup-blue bg-scanup-blue/8 px-3 py-1.5 rounded-full whitespace-nowrap">{p.stat}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-20 items-start">
            <Reveal className="md:sticky md:top-28">
              <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-4">{t.entreprises.featuresLabel}</p>
              <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.02em] leading-[1.15] mb-5">
                {t.entreprises.featuresTitle}<br />{t.entreprises.featuresTitleEnd}
              </h2>
              <p className="text-[15px] text-scanup-graytext leading-relaxed mb-8">
                {t.entreprises.featuresSubtitle}
              </p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/aide-support')}
                className="bg-scanup-blue text-white px-6 py-3 rounded-full font-semibold text-[14px] hover:bg-blue-700 transition-colors"
              >
                {t.entreprises.featuresCtaButton}
              </motion.button>
            </Reveal>

            <div>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: i * 0.07, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="py-7 border-b border-black/[0.06] last:border-0 group"
                >
                  <div className="text-[11px] text-scanup-blue font-semibold uppercase tracking-widest mb-2">{f.label}</div>
                  <h3 className="text-[18px] font-semibold mb-2 group-hover:text-scanup-blue transition-colors">{f.title}</h3>
                  <p className="text-[14px] text-scanup-graytext leading-relaxed">{f.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Personas ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#F8F9FC]">
        <div className="max-w-4xl mx-auto">
          <Reveal className="mb-12">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.entreprises.personasLabel}</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em]">{t.entreprises.personasTitle}</h2>
          </Reveal>

          <Reveal delay={0.05}>
            {/* tabs */}
            <div className="inline-flex bg-white border border-black/[0.08] rounded-full p-1 mb-10 shadow-sm">
              {personas.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setActivePersona(i)}
                  className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-all duration-200 ${
                    activePersona === i ? 'bg-scanup-navy text-white shadow-sm' : 'text-scanup-graytext hover:text-scanup-navy'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activePersona}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl p-10 border border-black/[0.06] shadow-sm"
              >
                <div className="flex flex-col md:flex-row gap-10">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-scanup-blue/8 flex items-center justify-center text-scanup-blue font-bold text-2xl mb-4">
                      {personas[activePersona].name[0]}
                    </div>
                    <div className="text-[13px] text-scanup-blue font-semibold mb-0.5">{personas[activePersona].role}</div>
                    <div className="text-[14px] text-scanup-graytext italic">{personas[activePersona].intro}</div>
                  </div>
                  <div className="w-px bg-black/[0.06] hidden md:block" />
                  <div className="flex-1">
                    <div className="text-[11px] text-scanup-graytext font-semibold uppercase tracking-widest mb-5">{t.entreprises.personaChallengesLabel}</div>
                    <ul className="space-y-4">
                      {personas[activePersona].items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-[15px] text-scanup-navy">
                          <div className="w-5 h-5 rounded-full bg-scanup-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check size={10} className="text-scanup-blue" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonial ──────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="relative">
              {/* giant quote mark */}
              <div className="absolute -top-8 -left-4 text-[140px] font-serif leading-none text-scanup-blue/[0.07] select-none pointer-events-none">"</div>
              <div className="relative">
                <div className="flex gap-1 mb-8">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16} className="text-scanup-blue fill-scanup-blue" />
                  ))}
                </div>
                <p className="text-[24px] md:text-[32px] font-medium leading-[1.5] text-scanup-navy mb-10 tracking-[-0.01em]">
                  {t.entreprises.testimonialQuote}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-scanup-blue/10 flex items-center justify-center text-scanup-blue font-bold text-[13px]">
                    MA
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-scanup-navy">{t.entreprises.testimonialName}</div>
                    <div className="text-[13px] text-scanup-graytext">{t.entreprises.testimonialRole}</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="mt-16 grid md:grid-cols-2 gap-px bg-black/[0.06] rounded-2xl overflow-hidden">
            {t.entreprises.testimonials.map((testimonial, i) => (
              <Reveal key={i} delay={i * 0.1} className="bg-white p-8">
                <p className="text-[15px] text-scanup-graytext leading-relaxed italic mb-6">"{testimonial.text}"</p>
                <div className="text-[13px] font-semibold text-scanup-navy">{testimonial.name}</div>
                <div className="text-[12px] text-scanup-graytext">{testimonial.role}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.entreprises.pricingLabel}</p>
            <h2 className="text-[32px] md:text-[44px] font-bold tracking-[-0.02em] mb-4">{t.entreprises.pricingTitle}</h2>
            <p className="text-[16px] text-scanup-graytext">{t.entreprises.pricingSubtitle}</p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {plans.map((plan, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <motion.div whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl p-7 h-full flex flex-col transition-shadow relative ${
                    plan.featured ? 'bg-scanup-navy text-white' : 'bg-white border border-black/[0.07]'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-scanup-blue text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide">
                      {t.entreprises.pricingPopular}
                    </div>
                  )}
                  <div className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${plan.featured ? 'text-scanup-turquoise' : 'text-scanup-blue'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-[30px] font-bold tracking-tight leading-none mb-1 ${plan.featured ? 'text-white' : 'text-scanup-navy'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-[12px] mb-6 ${plan.featured ? 'text-white/40' : 'text-scanup-graytext'}`}>{plan.sub}</div>
                  <ul className="space-y-2.5 flex-grow mb-7">
                    {plan.items.map((item, j) => (
                      <li key={j} className={`flex items-center gap-2 text-[13px] ${plan.featured ? 'text-white/70' : 'text-scanup-graytext'}`}>
                        <Check size={11} className={plan.featured ? 'text-scanup-turquoise' : 'text-scanup-blue'} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/aide-support')}
                    className={`w-full py-2.5 rounded-xl font-semibold text-[13px] transition-all ${
                      plan.featured
                        ? 'bg-white text-scanup-navy hover:bg-scanup-turquoise'
                        : 'border border-black/10 hover:border-scanup-blue hover:text-scanup-blue'
                    }`}>
                    {plan.cta}
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 flex flex-wrap justify-center gap-6">
            {t.entreprises.pricingGuarantees.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-scanup-graytext">
                <Check size={11} className="text-scanup-blue" />{item}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

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
              onClick={() => navigate('/aide-support')}
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
