import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, UserCog, Sparkles } from 'lucide-react';
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

// true = ✓, false = ✗ — row order matches i18n rps.features / tms.features
const RPS_FEATURE_VALUES: boolean[][] = [
  [true, true, true],   // Dépistage questionnaire + témoignage audio
  [true, true, true],   // Analyse psychologue du travail
  [true, true, true],   // Retour individuel confidentiel
  [true, true, true],   // Conduites à tenir personnalisées
  [true, true, true],   // Indicateurs agrégés anonymisés
  [false, true, true],  // Téléconsultation 30 min
  [false, false, true], // Restitution du plan d'action coconstruit à la direction
];

const TMS_FEATURE_VALUES: boolean[][] = [
  // colonnes : Pack Essential, Pack Premium, Forfait tout compris
  [true, true, true],    // Dépistage par vidéos
  [true, true, true],    // Qualification par un ergonome
  [true, true, true],    // Retour individuel confidentiel + conduites à tenir
  [false, true, true],   // Coaching vidéo gestes & postures
  [false, false, true],  // Étude de poste complète IPRP
  [false, false, true],  // Rapport individuel
  [false, false, true],  // Plan d'action TMS + restitution direction
];

// column palettes — same tints as the original comparison table
type PaletteKey = 'white' | 'blue' | 'navy' | 'green';
const COL_STYLES: Record<Exclude<PaletteKey, 'navy'>, { col: string; head: string; headText: string; check: string; x: string; price: string; sub: string }> = {
  white: { col: '#ffffff', head: '#ffffff', headText: 'text-gray-500', check: 'text-green-500', x: 'text-gray-300', price: 'text-scanup-navy', sub: 'text-gray-400' },
  blue:  { col: '#eff6ff', head: '#dbeafe', headText: 'text-blue-700', check: 'text-blue-600', x: 'text-blue-200', price: 'text-blue-700', sub: 'text-blue-400' },
  green: { col: '#f0fdf4', head: '#bbf7d0', headText: 'text-emerald-700', check: 'text-emerald-600', x: 'text-emerald-200', price: 'text-emerald-800', sub: 'text-emerald-600' },
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

const CompareTable: React.FC<{
  plans: Plan[];
  features: string[];
  values: boolean[][];
  tarifLabel: string;
  palette: PaletteKey[];
}> = ({ plans, features, values, tarifLabel, palette }) => {
  const styles = plans.map((_, i) => (palette[i] === 'navy' ? null : COL_STYLES[palette[i] as Exclude<PaletteKey, 'navy'>]));
  return (
    <div className={`overflow-x-auto rounded-2xl shadow-md border border-black/[0.07] bg-white ${plans.length === 2 ? 'max-w-3xl mx-auto' : ''}`}>
      <table className={`w-full text-[13px] border-collapse ${plans.length === 2 ? 'min-w-[480px]' : 'min-w-[560px]'}`}>
        <colgroup>
          <col style={{ width: `${100 / (plans.length + 1)}%` }} />
          {plans.map((_, i) => (
            <col key={i} style={{ width: `${100 / (plans.length + 1)}%`, backgroundColor: styles[i] ? styles[i]!.col : '#0f1f3d' }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="text-left px-5 py-4 bg-white rounded-tl-2xl" />
            {plans.map((plan, i) => {
              const s = styles[i];
              return s ? (
                <th key={i} className={`text-center px-3 py-4 font-bold text-[12px] uppercase tracking-wide whitespace-nowrap ${s.headText} ${i === plans.length - 1 ? 'rounded-tr-2xl' : ''}`}
                  style={{ backgroundColor: s.head }}>
                  {plan.name}
                  {plan.badge && <div className="text-[10px] font-normal opacity-60 mt-0.5 normal-case tracking-normal">{plan.badge}</div>}
                </th>
              ) : (
                <th key={i} className={`text-center px-3 py-4 font-bold text-[12px] text-white uppercase tracking-wide whitespace-nowrap ${i === plans.length - 1 ? 'rounded-tr-2xl' : ''}`}
                  style={{ backgroundColor: '#0f1f3d' }}>
                  {plan.name}
                  {plan.badge && <div className="text-[10px] font-normal text-white/50 mt-0.5 normal-case tracking-normal">{plan.badge}</div>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {features.map((label, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <td className="px-5 py-3.5 font-medium text-scanup-navy bg-white">{label}</td>
              {plans.map((_, j) => {
                const s = styles[j];
                const on = values[i][j];
                return s ? (
                  <td key={j} className="px-3 py-3.5 text-center">
                    {on ? <Check size={18} className={`${s.check} mx-auto`} strokeWidth={2.5} /> : <X size={16} className={`${s.x} mx-auto`} strokeWidth={2} />}
                  </td>
                ) : (
                  <td key={j} className="px-3 py-3.5 text-center" style={{ backgroundColor: '#0f1f3d' }}>
                    {on ? <Check size={18} className="text-emerald-400 mx-auto" strokeWidth={2.5} /> : <X size={16} className="text-white/20 mx-auto" strokeWidth={2} />}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr style={{ borderTop: '2px solid rgba(0,0,0,0.1)' }}>
            <td className="px-5 py-4 font-bold text-scanup-navy bg-white rounded-bl-2xl">{tarifLabel}</td>
            {plans.map((plan, i) => {
              const s = styles[i];
              return s ? (
                <td key={i} className={`px-3 py-4 text-center ${i === plans.length - 1 ? 'rounded-br-2xl' : ''}`} style={{ backgroundColor: s.head }}>
                  <div className={`font-bold text-[15px] ${s.price}`}>{plan.price}</div>
                  <div className={`text-[11px] mt-0.5 ${s.sub}`}>{plan.sub}</div>
                </td>
              ) : (
                <td key={i} className={`px-3 py-4 text-center ${i === plans.length - 1 ? 'rounded-br-2xl' : ''}`} style={{ backgroundColor: '#0f1f3d' }}>
                  <div className="font-bold text-[15px] text-white">{plan.price}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{plan.sub}</div>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default function TarifsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = t.tarifs;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tab, setTab] = useState<'rps' | 'tms'>('rps');
  const goContact = () => navigate('/aide-support');

  const TrialBanner = (
    <div className="rounded-2xl bg-gradient-to-br from-scanup-blue/[0.06] to-scanup-turquoise/[0.12] border-2 border-dashed border-scanup-blue/30 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-scanup-blue/10 text-scanup-blue flex items-center justify-center flex-shrink-0">
        <Sparkles size={18} />
      </div>
      <div className="flex-grow">
        <div className="text-[16px] font-bold text-scanup-navy">{tr.trial.title}</div>
        <p className="text-[13px] text-scanup-graytext leading-relaxed">{tr.trial.desc}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={goContact}
        className="py-3 px-6 rounded-xl font-bold text-[13px] bg-scanup-blue text-white hover:brightness-110 transition-all inline-flex items-center gap-2 flex-shrink-0"
      >
        {tr.trial.cta} <ArrowRight size={13} />
      </motion.button>
    </div>
  );

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="Tarifs ScanUp — Prévention TMS & RPS"
        description="Dépistage RPS dès 27 € et dépistage TMS dès 55 € HT par collaborateur, analyse par nos experts incluse. Essai gratuit 14 jours, sans carte bancaire. Hébergement certifié HDS."
        path="/tarifs"
      />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-10 px-6 text-center overflow-hidden">
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

      {/* ── Switch RPS / TMS ─────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <Reveal className="flex justify-center mb-4">
            <div className="inline-flex rounded-full border border-black/10 bg-[#f8f9fb] p-1">
              {(['rps', 'tms'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`relative px-6 sm:px-8 py-2.5 rounded-full text-[14px] font-semibold transition-colors ${
                    tab === k ? 'text-white' : 'text-scanup-graytext hover:text-scanup-navy'
                  }`}
                >
                  {tab === k && (
                    <motion.div
                      layoutId="tarifs-tab-pill"
                      className="absolute inset-0 bg-scanup-blue rounded-full"
                      transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                    />
                  )}
                  <span className="relative">{k === 'rps' ? tr.rps.title : tr.tms.title}</span>
                </button>
              ))}
            </div>
          </Reveal>
          <p className="text-center text-[15px] text-scanup-graytext mb-10">
            {tab === 'rps' ? tr.rps.subtitle : tr.tms.subtitle}
          </p>

          {tab === 'rps' ? (
            <div key="rps">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                {tr.rps.plans.map((plan, i) => (
                  <Reveal key={i} delay={i * 0.07}>
                    <PlanCard plan={plan} featured={!!plan.badge} onCta={goContact} />
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="mt-6">{TrialBanner}</Reveal>
            </div>
          ) : (
            <div key="tms">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                {tr.tms.plans.map((plan, i) => (
                  <Reveal key={i} delay={i * 0.07}>
                    <PlanCard plan={plan} featured={!!plan.badge} onCta={goContact} />
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.15} className="mt-6">{TrialBanner}</Reveal>
            </div>
          )}
        </div>
      </section>

      {/* ── Comparatif détaillé ──────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight mb-2">{tr.tableTitle}</h2>
            <p className="text-[15px] text-scanup-graytext">{tr.tableSubtitle}</p>
          </Reveal>
          <Reveal>
            {tab === 'rps' ? (
              <CompareTable
                plans={tr.rps.plans}
                features={tr.rps.features}
                values={RPS_FEATURE_VALUES}
                tarifLabel={tr.tableTarif}
                palette={['white', 'navy', 'green']}
              />
            ) : (
              <CompareTable
                plans={tr.tms.plans}
                features={tr.tms.features}
                values={TMS_FEATURE_VALUES}
                tarifLabel={tr.tableTarif}
                palette={['white', 'blue', 'navy']}
              />
            )}
          </Reveal>
        </div>
      </section>

      {/* ── Formule en autonomie ─────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <button
              onClick={goContact}
              className="w-full flex items-start gap-3 text-left rounded-xl border border-black/[0.07] bg-[#f8f9fb] px-5 py-4 hover:border-scanup-blue/40 transition-colors"
            >
              <UserCog size={16} className="text-scanup-blue flex-shrink-0 mt-0.5" />
              <span className="text-[14px] leading-relaxed text-scanup-graytext">{tr.autonomyNote}</span>
              <ArrowRight size={14} className="text-scanup-blue flex-shrink-0 mt-1 ml-auto" />
            </button>
          </Reveal>
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
