import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, Shield, Clock, Database } from 'lucide-react';
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

// true = ✓, false = ✗ — order matches i18n features array
const FEATURE_VALUES: { essai: boolean; acces: boolean; pack100: boolean; impact50: boolean }[] = [
  { essai: false, acces: false, pack100: true,  impact50: true  },
  { essai: false, acces: true,  pack100: true,  impact50: true  },
  { essai: false, acces: true,  pack100: true,  impact50: true  },
  { essai: true,  acces: false, pack100: true,  impact50: true  },
  { essai: true,  acces: true,  pack100: true,  impact50: true  },
  { essai: true,  acces: true,  pack100: true,  impact50: true  },
  { essai: true,  acces: true,  pack100: true,  impact50: true  },
  { essai: false, acces: true,  pack100: true,  impact50: true  },
  { essai: false, acces: false, pack100: false, impact50: true  },
  { essai: false, acces: false, pack100: false, impact50: true  },
  { essai: false, acces: false, pack100: false, impact50: true  },
];

const GUARANTEE_ICONS = [Shield, Clock, Database];

export default function TarifsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = t.tarifs;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="Tarifs ScanUp — Prévention TMS & RPS"
        description="Essai gratuit 14 jours, Formule Accès dès 10 €/utilisateur/an, Pack 100 à 2 700 € HT. Données hébergées en France (HDS). Aucune carte bancaire requise."
        path="/tarifs"
      />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
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
          <Reveal delay={0.1}>
            <p className="text-[17px] text-scanup-graytext leading-relaxed max-w-xl mx-auto">{tr.subtitle}</p>
          </Reveal>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tr.plans.map((plan: any, i: number) => (
              <Reveal key={i} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl p-7 h-full flex flex-col relative ${
                    i === 2 ? 'bg-scanup-navy text-white' : 'bg-white border border-black/[0.07] shadow-sm'
                  }`}
                >
                  {i === 2 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-scanup-blue text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide whitespace-nowrap">
                      {tr.popular}
                    </div>
                  )}
                  <div className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${i === 2 ? 'text-scanup-turquoise' : 'text-scanup-blue'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-[28px] font-bold tracking-tight leading-none mb-1 ${i === 2 ? 'text-white' : 'text-scanup-navy'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-[12px] mb-6 ${i === 2 ? 'text-white/40' : 'text-scanup-graytext'}`}>
                    {plan.sub}
                  </div>
                  <ul className="space-y-2.5 flex-grow mb-7">
                    {plan.items.map((item: string, j: number) => (
                      <li key={j} className={`flex items-center gap-2 text-[13px] ${i === 2 ? 'text-white/70' : 'text-scanup-graytext'}`}>
                        <Check size={11} className={`flex-shrink-0 ${i === 2 ? 'text-scanup-turquoise' : 'text-scanup-blue'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/aide-support')}
                    className={`w-full py-2.5 rounded-xl font-semibold text-[13px] transition-all mt-2 ${
                      i === 2
                        ? 'bg-white text-scanup-navy hover:bg-scanup-turquoise'
                        : 'border border-black/10 hover:border-scanup-blue hover:text-scanup-blue'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {tr.guarantees.map((text: string, i: number) => {
              const Icon = GUARANTEE_ICONS[i];
              return (
                <div key={i} className="flex items-center gap-2 text-[13px] text-scanup-graytext">
                  <Icon size={13} className="text-scanup-blue flex-shrink-0" />
                  {text}
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight mb-2">{tr.tableTitle}</h2>
            <p className="text-[15px] text-scanup-graytext">{tr.tableSubtitle}</p>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto rounded-2xl shadow-md border border-black/[0.07]">
              <table className="w-full min-w-[560px] text-[13px] border-collapse">
                <colgroup>
                  <col style={{ width: '38%' }} />
                  <col style={{ backgroundColor: '#ffffff' }} />
                  <col style={{ backgroundColor: '#eff6ff' }} />
                  <col style={{ backgroundColor: '#0f1f3d' }} />
                  <col style={{ backgroundColor: '#f0fdf4' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="text-left px-5 py-4 bg-white rounded-tl-2xl" />
                    <th className="text-center px-3 py-4 font-bold text-[12px] text-gray-500 uppercase tracking-wide bg-white">
                      {tr.plans[0].name}
                    </th>
                    <th className="text-center px-3 py-4 font-bold text-[12px] text-blue-700 uppercase tracking-wide" style={{ backgroundColor: '#dbeafe' }}>
                      {tr.plans[1].name}
                    </th>
                    <th className="text-center px-3 py-4 font-bold text-[12px] text-white uppercase tracking-wide" style={{ backgroundColor: '#0f1f3d' }}>
                      {tr.plans[2].name}
                      <div className="text-[10px] font-normal text-white/50 mt-0.5 normal-case tracking-normal">{tr.popular}</div>
                    </th>
                    <th className="text-center px-3 py-4 font-bold text-[12px] text-emerald-700 uppercase tracking-wide rounded-tr-2xl" style={{ backgroundColor: '#bbf7d0' }}>
                      {tr.plans[3].name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tr.features.map((label: string, i: number) => {
                    const row = FEATURE_VALUES[i];
                    return (
                      <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <td className="px-5 py-3.5 font-medium text-scanup-navy bg-white">{label}</td>
                        <td className="px-3 py-3.5 text-center">
                          {row.essai ? <Check size={18} className="text-green-500 mx-auto" strokeWidth={2.5} /> : <X size={16} className="text-gray-300 mx-auto" strokeWidth={2} />}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {row.acces ? <Check size={18} className="text-blue-600 mx-auto" strokeWidth={2.5} /> : <X size={16} className="text-blue-200 mx-auto" strokeWidth={2} />}
                        </td>
                        <td className="px-3 py-3.5 text-center" style={{ backgroundColor: '#0f1f3d' }}>
                          {row.pack100 ? <Check size={18} className="text-emerald-400 mx-auto" strokeWidth={2.5} /> : <X size={16} className="text-white/20 mx-auto" strokeWidth={2} />}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {row.impact50 ? <Check size={18} className="text-emerald-600 mx-auto" strokeWidth={2.5} /> : <X size={16} className="text-emerald-200 mx-auto" strokeWidth={2} />}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: '2px solid rgba(0,0,0,0.1)' }}>
                    <td className="px-5 py-4 font-bold text-scanup-navy bg-white rounded-bl-2xl">{tr.tableTarif}</td>
                    <td className="px-3 py-4 text-center bg-white">
                      <div className="font-bold text-[15px] text-scanup-navy">{tr.plans[0].price}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{tr.plans[0].sub}</div>
                    </td>
                    <td className="px-3 py-4 text-center" style={{ backgroundColor: '#dbeafe' }}>
                      <div className="font-bold text-[15px] text-blue-700">{tr.plans[1].price}</div>
                      <div className="text-[11px] text-blue-400 mt-0.5">{tr.plans[1].sub}</div>
                    </td>
                    <td className="px-3 py-4 text-center" style={{ backgroundColor: '#0f1f3d' }}>
                      <div className="font-bold text-[15px] text-white">{tr.plans[2].price}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">{tr.plans[2].sub}</div>
                    </td>
                    <td className="px-3 py-4 text-center rounded-br-2xl" style={{ backgroundColor: '#bbf7d0' }}>
                      <div className="font-bold text-[15px] text-emerald-800">{tr.plans[3].price}</div>
                      <div className="text-[11px] text-emerald-600 mt-0.5">{tr.plans[3].sub}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Decision guide ───────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight mb-3">{tr.decisionTitle}</h2>
            <p className="text-[15px] text-scanup-graytext">{tr.decisionSubtitle}</p>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-scanup-blue text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0">1</div>
                <p className="font-semibold text-[16px]">{tr.q1}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pl-10">
                <div className="bg-[#f8f9fb] rounded-2xl border border-black/[0.07] p-5">
                  <div className="text-[11px] font-bold text-scanup-blue uppercase tracking-wide mb-2">{tr.q1Yes}</div>
                  <p className="font-semibold text-scanup-navy mb-1">{tr.q1YesPlan}</p>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed">{tr.q1YesDesc}</p>
                  <p className="text-[13px] font-bold text-scanup-navy mt-3">{tr.q1YesPrice}</p>
                </div>
                <div className="bg-[#f8f9fb] rounded-2xl border border-black/[0.07] p-5">
                  <div className="text-[11px] font-bold text-scanup-graytext uppercase tracking-wide mb-2">{tr.q1No}</div>
                  <p className="font-semibold text-scanup-navy mb-1">{tr.q1NoPlan}</p>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed">{tr.q1NoDesc}</p>
                  <p className="text-[13px] text-scanup-blue font-medium mt-3 flex items-center gap-1">{tr.q1NoNext} <ArrowRight size={12} /></p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-scanup-blue/20 text-scanup-blue flex items-center justify-center text-[12px] font-bold flex-shrink-0">2</div>
                <p className="font-semibold text-[16px]">{tr.q2}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pl-10">
                <div className="bg-[#f8f9fb] rounded-2xl border border-black/[0.07] p-5">
                  <p className="font-semibold text-scanup-navy mb-2">{tr.q2Option1Label}</p>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed mb-3">{tr.q2Option1Desc}</p>
                  <div className="border-t border-black/[0.06] pt-3">
                    <p className="text-[12px] font-bold text-scanup-blue uppercase tracking-wide">{tr.q2Option1Plan}</p>
                    <p className="text-[20px] font-bold text-scanup-navy">{tr.q2Option1Price}</p>
                    <p className="text-[12px] text-scanup-graytext">{tr.q2Option1Sub}</p>
                  </div>
                </div>
                <div className="bg-scanup-navy rounded-2xl p-5">
                  <p className="font-semibold text-white mb-2">{tr.q2Option2Label}</p>
                  <p className="text-[13px] text-white/60 leading-relaxed mb-3">{tr.q2Option2Desc}</p>
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-[12px] font-bold text-scanup-turquoise uppercase tracking-wide">{tr.q2Option2Plan}</p>
                    <p className="text-[20px] font-bold text-white">{tr.q2Option2Price}</p>
                    <p className="text-[12px] text-white/40">{tr.q2Option2Sub}</p>
                  </div>
                </div>
              </div>
            </div>
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
            {tr.faqs.map((faq: any, i: number) => (
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
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-turquoise text-scanup-navy px-8 py-3.5 rounded-full font-bold text-[15px] hover:brightness-105 transition-all shadow-lg shadow-scanup-turquoise/20 inline-flex items-center gap-2"
            >
              {tr.ctaStart} <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/aide-support')}
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
