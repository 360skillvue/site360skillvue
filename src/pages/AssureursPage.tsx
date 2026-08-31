import React from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowRight, Mail, Bone, BrainCircuit, Database } from 'lucide-react';
import { useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const PROBLEM_ICONS = [Bone, BrainCircuit, Database];

export default function AssureursPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const ta = t.assureurs as any;

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white selection:bg-scanup-blue/20">
      <PageMeta
        title={t.meta.assureurs.title}
        description={t.meta.assureurs.description}
        path="/assureurs-mutuelles"
      />
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-scanup-blue/5 rounded-full blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-lightblue/50 text-scanup-blue text-sm font-medium mb-6 border border-scanup-blue/10">
                <Shield size={16} />
                {ta.heroBadge}
              </div>
              <h1 className="text-[28px] sm:text-[38px] md:text-[50px] font-bold leading-[1.15] mb-6 tracking-tight">
                {ta.heroTitle}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">{ta.heroTitleHighlight}</span>{' '}
                {ta.heroTitleEnd}
              </h1>
              <p className="text-[18px] text-scanup-graytext mb-10 leading-[1.6] max-w-lg">{ta.heroSubtitle}</p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/aide-support')}
                className="bg-scanup-blue text-white px-8 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-xl shadow-scanup-blue/20 group"
              >
                {ta.heroCtaDemo}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="relative">
            <motion.div animate={{ y: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }} className="relative z-10">
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-blue/20 to-scanup-turquoise/20 rounded-2xl transform translate-x-4 translate-y-4 blur-sm" />
              <img src="/scanup-tms-operateur.webp" alt="Écran ScanUp : le salarié est invité à filmer sa situation de travail pour le dépistage TMS"
                className="relative rounded-2xl shadow-2xl border border-white/50 w-full object-cover" loading="lazy" decoding="async" />
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* ── Le constat ─────────────────────────────────────────────── */}
      <section className="bg-[#f7f9fc] py-24 border-t border-black/[0.05]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="mb-14">
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{ta.constatLabel}</p>
            <h2 className="text-[26px] md:text-[38px] font-bold mb-4 tracking-tight max-w-2xl">
              {ta.constatTitle} <span className="text-scanup-blue">{ta.constatTitleEnd}</span>
            </h2>
            <p className="text-[16px] text-scanup-graytext leading-relaxed max-w-2xl">{ta.constatSubtitle}</p>
          </FadeIn>
          <div className="divide-y divide-black/[0.06]">
            {ta.problems.map((p: any, i: number) => {
              const Icon = PROBLEM_ICONS[i];
              return (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="flex gap-6 py-8 items-start">
                    <div className="w-10 h-10 rounded-xl bg-scanup-blue/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="text-scanup-blue" size={20} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold mb-1.5">{p.title}</h3>
                      <p className="text-[14px] text-scanup-graytext leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Notre solution ─────────────────────────────────────────── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{ta.solutionLabel}</p>
            <h2 className="text-[24px] md:text-[34px] font-bold mb-5 tracking-tight leading-snug">{ta.solutionTitle}</h2>
            <p className="text-[15px] text-scanup-graytext leading-relaxed mb-4">{ta.solutionBody}</p>
            <p className="text-[15px] text-scanup-graytext leading-relaxed">{ta.solutionBody2}</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-blue to-scanup-turquoise rounded-2xl transform translate-x-3 translate-y-3 opacity-15" />
              <img src="/scanup-tms-evaluateur.webp" alt="Écran ScanUp : l'évaluateur cote l'exposition aux facteurs de risque et rend sa correction"
                className="relative rounded-2xl shadow-xl border border-white w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Comment ça marche ──────────────────────────────────────── */}
      <section className="bg-[#f7f9fc] py-24 border-t border-black/[0.05]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="mb-14">
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{ta.processLabel}</p>
            <h2 className="text-[26px] md:text-[38px] font-bold mb-3 tracking-tight">{ta.processTitle}</h2>
            <p className="text-[15px] text-scanup-graytext max-w-xl">{ta.processSubtitle}</p>
          </FadeIn>
          <div className="space-y-0 divide-y divide-black/[0.06]">
            {ta.steps.map((step: any, i: number) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex gap-6 py-8 items-start">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-scanup-blue text-white text-[12px] font-bold flex items-center justify-center mt-0.5">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold mb-1.5">{step.title}</h3>
                    <p className="text-[14px] text-scanup-graytext leading-relaxed">{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bénéfices + KPI ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn className="mb-14">
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{ta.benefitsLabel}</p>
            <h2 className="text-[26px] md:text-[38px] font-bold tracking-tight">{ta.benefitsTitle}</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
            {ta.benefits.map((b: any, i: number) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="flex gap-4 items-start">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{b.emoji}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold mb-1">{b.title}</h3>
                    <p className="text-[13px] text-scanup-graytext leading-relaxed">{b.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* KPI inline */}
          <FadeIn className="mt-16">
            <div className="bg-scanup-blue/[0.04] border border-scanup-blue/15 rounded-2xl p-8 md:p-10">
              <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-2">{ta.kpiLabel}</p>
              <h3 className="text-[20px] md:text-[26px] font-bold mb-3 tracking-tight">{ta.kpiTitle}</h3>
              <p className="text-[14px] text-scanup-graytext mb-8 leading-relaxed max-w-2xl">{ta.kpiSubtitle}</p>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col gap-6">
                  {ta.kpiSteps.map((k: any, i: number) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="w-7 h-7 rounded-full bg-scanup-blue text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold">{k.title}</p>
                        <p className="text-[12px] text-scanup-graytext leading-relaxed">{k.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <img src="/dashboard-rh.webp" alt="Tableau de bord 360SkillVue : taux de dépistage positif et cartographie des risques"
                  className="w-full rounded-xl" loading="lazy" decoding="async" />
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Tarification ───────────────────────────────────────────── */}
      <section className="bg-[#f7f9fc] py-16 border-t border-black/[0.05]">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-3">{ta.pricingLabel}</p>
            <h2 className="text-[22px] md:text-[30px] font-bold mb-4 tracking-tight">{ta.pricingTitle}</h2>
            <p className="text-[15px] text-scanup-graytext leading-relaxed max-w-3xl">{ta.pricingBody}</p>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="bg-scanup-navy py-24 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <FadeIn>
            <p className="text-[11px] font-semibold text-scanup-turquoise uppercase tracking-widest mb-4">{ta.ctaLabel}</p>
            <h2 className="text-[26px] md:text-[40px] font-bold mb-4 text-white tracking-tight">{ta.ctaTitle}</h2>
            <p className="text-[15px] text-white/50 mb-10 leading-relaxed">{ta.ctaSubtitle}</p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-blue text-white px-10 py-4 rounded-[10px] font-medium hover:bg-blue-600 transition-colors shadow-xl shadow-scanup-blue/30 text-[16px]"
            >
              {ta.ctaButton}
            </motion.button>
            <div className="mt-8 text-white/40 flex items-center justify-center gap-2 text-sm">
              <Mail size={14} />
              <a href={`mailto:${ta.ctaEmail}`} className="hover:text-white transition-colors">{ta.ctaEmail}</a>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
