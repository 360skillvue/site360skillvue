import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, TrendingUp, Eye, Zap, Target } from 'lucide-react';
import { useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage } from '../i18n';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const CARD_ICONS = [Target, Eye, Zap, TrendingUp];

export default function AProposPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const tr = t.aPropos;

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="À propos — 360SkillVue & ScanUp"
        description="Depuis plus de dix ans, 360SkillVue accompagne les professionnels de santé. Découvrez l'origine de ScanUp, notre plateforme de prévention TMS & RPS."
        path="/a-propos"
      />
      <Navbar />

      {/* ── Hero — light aurora ──────────────────────────────────── */}
      <section className="relative bg-white overflow-hidden pt-28 pb-20 px-6">
        {/* Aurora blobs — very subtle on white */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #0068ff 0%, transparent 65%)', filter: 'blur(80px)' }} />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #00d2c8 0%, transparent 65%)', filter: 'blur(90px)' }} />
          <div className="absolute bottom-[0%] right-[30%] w-[400px] h-[400px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 65%)', filter: 'blur(70px)' }} />
        </div>

        <div className="max-w-4xl mx-auto relative text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-scanup-blue mb-8">
              <span className="w-5 h-px bg-scanup-blue/40" />
              {tr.badge}
              <span className="w-5 h-px bg-scanup-blue/40" />
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-[38px] sm:text-[56px] md:text-[72px] font-bold tracking-[-0.035em] leading-[1.02] text-scanup-navy mb-7">
              {tr.title}{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #0068ff 0%, #00d2c8 50%, #4f46e5 100%)' }}>
                {tr.titleHighlight}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="text-[17px] text-scanup-graytext leading-relaxed max-w-xl mx-auto">{tr.subtitle}</p>
          </Reveal>
        </div>
      </section>

      {/* ── Award — avant le storytelling ───────────────────────── */}
      <section className="py-12 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="rounded-3xl overflow-hidden border border-black/[0.07] shadow-xl shadow-black/[0.06] bg-white">
              <div className="flex flex-col md:flex-row">
                {/* Photo — pleine hauteur, pas de maxHeight */}
                <div className="md:w-[55%]">
                  <img
                    src="/preventica-award-2025.webp"
                    alt={tr.awardCaption}
                    className="w-full h-full object-cover object-center"
                    style={{ minHeight: 260, display: 'block' }}
                  />
                </div>

                {/* Content — fond clair */}
                <div className="md:w-[45%] flex flex-col justify-center px-8 py-10 bg-white">
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 w-fit mb-6"
                    style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdfc)', border: '1px solid #bfdbfe' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                        fill="rgba(0,104,255,0.15)" stroke="#0068ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[11px] font-bold text-scanup-blue uppercase tracking-wide">Prix Innovation</span>
                  </div>

                  <h3 className="text-[22px] sm:text-[28px] font-bold text-scanup-navy leading-tight mb-2">
                    Prix Innovation<br />by Préventica 2025
                  </h3>
                  <p className="text-[12px] text-scanup-graytext mb-5 uppercase tracking-widest font-semibold">
                    Préventica Paris 2025
                  </p>

                  <p className="text-[14px] text-scanup-graytext leading-relaxed mb-6"
                    dangerouslySetInnerHTML={{ __html: tr.awardDesc }} />

                  <p className="text-[12px] text-scanup-graytext/50 italic">{tr.awardCaption}</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Storytelling / Origine ───────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-scanup-blue mb-4">Notre histoire</p>
              <p className="text-[22px] sm:text-[28px] font-bold text-scanup-navy leading-tight">{tr.originText1}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-5">
              <p className="text-[16px] text-scanup-graytext leading-relaxed border-l-2 border-scanup-blue/20 pl-5">
                {tr.originText2}
              </p>
              <div className="flex items-center gap-2 text-scanup-blue text-[14px] font-semibold">
                <div className="w-8 h-[2px] bg-scanup-blue rounded-full" />
                360SkillVue — fondée pour changer ça
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Le constat ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f8f9fb] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] rounded-full opacity-[0.08]"
            style={{ background: 'radial-gradient(circle at top right, #0068ff 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-scanup-blue mb-6">{tr.constatBadge}</p>
              <h2 className="text-[26px] sm:text-[34px] font-bold text-scanup-navy leading-tight mb-6">{tr.constatTitle}</h2>
              <p className="text-[15px] text-scanup-graytext leading-relaxed">{tr.constatIntro}</p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="space-y-3 mt-2">
                {tr.constatItems.map((item: string, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-4 bg-white border border-black/[0.07] rounded-xl px-5 py-4 shadow-sm"
                  >
                    <span className="text-[12px] font-bold text-scanup-blue/50 flex-shrink-0 mt-0.5 w-5 text-right">0{i + 1}</span>
                    <p className="text-[14px] text-scanup-navy/80 leading-relaxed">{item}</p>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── La réponse ScanUp ────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal className="mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-scanup-turquoise mb-3">{tr.reponseBadge}</p>
            <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight">
              {tr.reponseTitle}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">ScanUp</span>
            </h2>
            <p className="text-[16px] text-scanup-graytext mt-3 max-w-xl">{tr.reponseSubtitle}</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tr.reponseCards.map((card: any, i: number) => {
              const Icon = CARD_ICONS[i];
              return (
                <Reveal key={i} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 24px 48px rgba(0,0,0,0.08)' }}
                    transition={{ duration: 0.3 }}
                    className="group rounded-2xl border border-black/[0.07] p-6 bg-white hover:border-scanup-blue/30 transition-colors cursor-default"
                  >
                    <div className="w-10 h-10 rounded-xl bg-scanup-blue/8 flex items-center justify-center mb-4 group-hover:bg-scanup-blue transition-colors">
                      <Icon size={18} className="text-scanup-blue group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-[14px] font-bold text-scanup-navy mb-2">{card.title}</p>
                    <p className="text-[13px] text-scanup-graytext leading-relaxed">{card.desc}</p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Notre positionnement ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-scanup-blue mb-3">{tr.positionBadge}</p>
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-tight max-w-2xl mx-auto">{tr.positionTitle}</h2>
          </Reveal>
          <div className="space-y-3 max-w-3xl mx-auto mb-12">
            {tr.positionRows.map((row: any, i: number) => (
              <Reveal key={i} delay={0.06 + i * 0.08}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 bg-white rounded-2xl border border-black/[0.06] px-6 py-5 shadow-sm">
                  <span className="text-[14px] text-scanup-graytext/70 line-through">{row.from}</span>
                  <div className="w-8 h-8 rounded-full bg-scanup-blue flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                  <span className="text-[14px] font-bold text-scanup-navy text-right">{row.to}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="max-w-3xl mx-auto">
            <div className="bg-scanup-navy rounded-2xl px-8 py-7 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full"
                style={{ background: 'radial-gradient(circle at top right, rgba(0,210,200,0.15) 0%, transparent 70%)' }} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-scanup-turquoise mb-3 relative">Notre ambition</p>
              <p className="text-[17px] text-white font-medium leading-relaxed relative">{tr.positionQuote}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <Reveal className="max-w-2xl mx-auto text-center">
          <h2 className="text-[28px] sm:text-[42px] font-bold text-scanup-navy mb-4 tracking-tight">{tr.ctaTitle}</h2>
          <p className="text-[16px] text-scanup-graytext mb-10 leading-relaxed">{tr.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-blue text-white px-8 py-3.5 rounded-full font-bold text-[15px] hover:bg-blue-700 transition-all shadow-lg shadow-scanup-blue/20 inline-flex items-center gap-2"
            >
              {tr.ctaStart} <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/tarifs')}
              className="text-scanup-navy px-8 py-3.5 rounded-full font-medium text-[15px] border border-black/15 hover:border-scanup-blue hover:text-scanup-blue transition-all"
            >
              {tr.ctaTarifs}
            </motion.button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
