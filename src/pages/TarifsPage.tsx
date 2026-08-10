import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Shield, Users, UserCog, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage } from '../i18n';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-32px' }}
    transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

type Plan = {
  name: string;
  price: string;
  sub: string;
  badge: string;
  items: string[];
  cta: string;
};

const PlanCard: React.FC<{ plan: Plan; featured?: boolean; onCta: () => void }> = ({ plan, featured = false, onCta }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
    transition={{ duration: 0.25 }}
    className={`rounded-2xl p-7 h-full flex flex-col relative ${
      featured ? 'bg-scanup-navy text-white' : 'bg-white border border-black/[0.07] shadow-sm'
    }`}
  >
    {plan.badge && (
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide whitespace-nowrap ${
        featured ? 'bg-scanup-turquoise text-scanup-navy' : 'bg-scanup-blue text-white'
      }`}>
        {plan.badge}
      </div>
    )}
    <div className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${featured ? 'text-scanup-turquoise' : 'text-scanup-blue'}`}>
      {plan.name}
    </div>
    <div className={`text-[28px] font-bold tracking-tight leading-none mb-1 ${featured ? 'text-white' : 'text-scanup-navy'}`}>
      {plan.price}
    </div>
    <div className={`text-[12px] leading-snug mb-6 ${featured ? 'text-white/40' : 'text-scanup-graytext'}`}>
      {plan.sub}
    </div>
    <ul className="space-y-2.5 flex-grow mb-7">
      {plan.items.map((item, j) => (
        <li key={j} className={`flex items-start gap-2 text-[13px] leading-snug ${featured ? 'text-white/70' : 'text-scanup-graytext'}`}>
          <Check size={11} className={`flex-shrink-0 mt-1 ${featured ? 'text-scanup-turquoise' : 'text-scanup-blue'}`} />
          {item}
        </li>
      ))}
    </ul>
    <button
      onClick={onCta}
      className={`w-full py-2.5 rounded-xl font-semibold text-[13px] transition-all mt-2 ${
        featured
          ? 'bg-white text-scanup-navy hover:bg-scanup-turquoise'
          : 'border border-black/10 hover:border-scanup-blue hover:text-scanup-blue'
      }`}
    >
      {plan.cta}
    </button>
  </motion.div>
);

const NOTE_ICONS = [Shield, Users, UserCog];

export default function TarifsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = t.tarifs;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const goContact = () => navigate('/aide-support');

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="Tarifs ScanUp — Prévention TMS & RPS"
        description="Dépistage RPS dès 27 € et dépistage TMS dès 55 € HT par collaborateur, analyse par nos experts incluse. Essai gratuit 14 jours, sans carte bancaire. Hébergement certifié HDS."
        path="/tarifs"
      />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-12 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(0,104,255,0.07) 0%, transparent 65%)' }} />
        </div>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-scanup-blue/20 bg-scanup-blue/5 text-scanup-blue text-[12px] font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
              {tr.badge}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-[28px] sm:text-[40px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.1] mb-5">
              {tr.title}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
                {tr.titleHighlight}
              </span>
            </h1>
          </Reveal>
          {tr.subtitle && (
            <Reveal delay={0.1}>
              <p className="text-[17px] text-scanup-graytext leading-relaxed max-w-xl mx-auto mb-8">{tr.subtitle}</p>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={goContact}
              className="bg-scanup-blue text-white px-8 py-3.5 rounded-full font-bold text-[15px] hover:brightness-110 transition-all shadow-lg shadow-scanup-blue/25 inline-flex items-center gap-2"
            >
              {tr.trial.cta} <ArrowRight size={15} />
            </motion.button>
          </Reveal>
        </div>
      </section>

      {/* ── Dépistage RPS ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-8">
            <h2 className="text-[24px] sm:text-[30px] font-bold tracking-tight">{tr.rps.title}</h2>
            <p className="text-[15px] text-scanup-graytext mt-1">{tr.rps.subtitle}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
            {tr.rps.plans.map((plan, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <PlanCard plan={plan} featured={!!plan.badge} onCta={goContact} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dépistage TMS ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-8">
            <h2 className="text-[24px] sm:text-[30px] font-bold tracking-tight">{tr.tms.title}</h2>
            <p className="text-[15px] text-scanup-graytext mt-1">{tr.tms.subtitle}</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
            {tr.tms.plans.map((plan, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <PlanCard plan={plan} onCta={goContact} />
              </Reveal>
            ))}
            {/* CTA essai gratuit — à côté des cartes */}
            <Reveal delay={tr.tms.plans.length * 0.07}>
              <div className="rounded-2xl p-7 h-full flex flex-col bg-gradient-to-br from-scanup-blue/[0.06] to-scanup-turquoise/[0.12] border-2 border-dashed border-scanup-blue/30">
                <div className="w-10 h-10 rounded-full bg-scanup-blue/10 text-scanup-blue flex items-center justify-center mb-4">
                  <Sparkles size={18} />
                </div>
                <div className="text-[20px] font-bold tracking-tight mb-2 text-scanup-navy">{tr.trial.title}</div>
                <p className="text-[13px] text-scanup-graytext leading-relaxed flex-grow">{tr.trial.desc}</p>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={goContact}
                  className="w-full py-3 rounded-xl font-bold text-[13px] bg-scanup-blue text-white hover:brightness-110 transition-all mt-6 inline-flex items-center justify-center gap-2"
                >
                  {tr.trial.cta} <ArrowRight size={13} />
                </motion.button>
              </div>
            </Reveal>
          </div>

          {/* Encart — l'ergonomie centrée sur les personnes */}
          <Reveal delay={0.1} className="mt-8">
            <div className="rounded-2xl bg-scanup-navy text-white p-8 sm:p-10 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-20 -top-20 w-[280px] h-[280px] rounded-full border border-scanup-turquoise/15" />
              <div className="w-12 h-1 rounded-full bg-scanup-turquoise mb-6" />
              <p className="text-[16px] sm:text-[18px] leading-relaxed text-white/85 max-w-3xl">
                {tr.tms.highlight}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Notes ────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pt-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-3">
          {tr.notes.map((note, i) => {
            const Icon = NOTE_ICONS[i];
            const clickable = i > 0;
            const inner = (
              <>
                <Icon size={16} className="text-scanup-blue flex-shrink-0 mt-0.5" />
                <span className="text-[14px] leading-relaxed text-scanup-graytext">{note}</span>
                {clickable && <ArrowRight size={14} className="text-scanup-blue flex-shrink-0 mt-1 ml-auto" />}
              </>
            );
            return clickable ? (
              <Reveal key={i} delay={i * 0.05}>
                <button
                  onClick={goContact}
                  className="w-full flex items-start gap-3 text-left rounded-xl border border-black/[0.07] bg-[#f8f9fb] px-5 py-4 hover:border-scanup-blue/40 transition-colors"
                >
                  {inner}
                </button>
              </Reveal>
            ) : (
              <Reveal key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3 rounded-xl border border-black/[0.07] bg-[#f8f9fb] px-5 py-4">
                  {inner}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#f8f9fb]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-[26px] sm:text-[36px] font-bold tracking-tight">{tr.faqTitle}</h2>
          </Reveal>
          <div className="border-t border-black/[0.06]">
            {tr.faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className="border-b border-black/[0.06]">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full text-left py-5 gap-6 group"
                  >
                    <span className="text-[15px] font-semibold group-hover:text-scanup-blue transition-colors">{faq.q}</span>
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
                        <div className="pb-5 text-[14px] text-scanup-graytext leading-relaxed">{faq.a}</div>
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
      <section className="py-20 px-6 bg-scanup-navy relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full border border-scanup-turquoise/10" />
          <div className="absolute -left-16 -bottom-16 w-[300px] h-[300px] rounded-full border border-scanup-blue/20" />
        </div>
        <Reveal className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-[26px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">{tr.ctaTitle}</h2>
          <p className="text-[16px] text-white/50 mb-8 leading-relaxed">{tr.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={goContact}
              className="bg-scanup-turquoise text-scanup-navy px-8 py-3.5 rounded-full font-bold text-[15px] hover:brightness-105 transition-all shadow-lg shadow-scanup-turquoise/20 inline-flex items-center gap-2"
            >
              {tr.ctaStart} <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={goContact}
              className="text-white/70 px-8 py-3.5 rounded-full font-medium text-[15px] border border-white/20 hover:border-white/50 hover:text-white transition-all"
            >
              {tr.ctaDemo}
            </motion.button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
