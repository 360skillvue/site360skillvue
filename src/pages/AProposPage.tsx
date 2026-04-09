import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';

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

export default function AProposPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="À propos — 360SkillVue & ScanUp"
        description="Depuis plus de dix ans, 360SkillVue accompagne les professionnels de santé. Découvrez l'origine de ScanUp, notre plateforme de prévention TMS & RPS."
        path="/a-propos"
      />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
            style={{ background: 'radial-gradient(ellipse at center top, rgba(0,104,255,0.07) 0%, transparent 65%)' }}
          />
        </div>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-scanup-blue/20 bg-scanup-blue/5 text-scanup-blue text-[12px] font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
              Notre origine
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-[28px] sm:text-[40px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.1] mb-5">
              Dix ans au service de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
                la santé au travail.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[17px] text-scanup-graytext leading-relaxed max-w-2xl mx-auto">
              Depuis plus de dix ans, nous accompagnons des professionnels de santé dans le développement de leurs compétences.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Origine ──────────────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="bg-[#f8f9fb] rounded-2xl p-8 md:p-10 text-[15px] text-scanup-graytext leading-relaxed space-y-4">
              <p>
                Au fil de nos collaborations, un constat s'est imposé : dans certaines organisations, l'absentéisme progressait, les tensions internes augmentaient et les troubles physiques s'installaient durablement, sans que la direction ne dispose d'éléments objectivés pour en comprendre les causes.
              </p>
              <p>
                Les outils traditionnels — enquêtes internes, audits RH ponctuels, démarches de prévention générales — peinent à identifier les signaux précoces. Les collaborateurs les plus exposés sont souvent ceux qui s'expriment le moins.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Le constat ───────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[2px] w-8 bg-scanup-blue rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-scanup-blue">Le constat</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="text-[17px] text-scanup-navy font-medium leading-relaxed mb-8">
              L'employeur a une responsabilité claire en matière de protection de la santé et de prévention des risques professionnels.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[15px] text-scanup-graytext mb-6">Encore faut-il disposer d'outils concrets permettant :</p>
          </Reveal>
          <div className="space-y-3">
            {[
              "d'identifier précocement les facteurs de risque",
              "d'objectiver les situations à potentiel TMS ou RPS",
              "de structurer une démarche de prévention mesurable",
              "d'agir avant l'apparition d'arrêts prolongés ou de désorganisation interne",
            ].map((item, i) => (
              <Reveal key={i} delay={0.12 + i * 0.06}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-scanup-blue/10 flex items-center justify-center mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-scanup-blue" />
                  </div>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed">{item}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── La réponse : ScanUp ──────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#f8f9fb]">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[2px] w-8 bg-scanup-turquoise rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-scanup-turquoise">La réponse</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight mb-4">
              C'est dans ce contexte qu'est née{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">ScanUp</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[15px] text-scanup-graytext leading-relaxed mb-8">
              La plateforme digitale développée par 360SkillVue. ScanUp associe :
            </p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Questionnaire ciblé', desc: 'Structuré et scientifiquement validé pour chaque type de risque.' },
              { title: 'Captation vidéo', desc: 'En situation réelle pour objectiver les postures et comportements.' },
              { title: 'Analyse expert', desc: 'Par un ergonome ou un psychologue qualifié, pas un algorithme seul.' },
              { title: 'Retour exploitable', desc: 'Pour orienter concrètement les actions de prévention de l\'entreprise.' },
            ].map((card, i) => (
              <Reveal key={i} delay={0.12 + i * 0.07}>
                <div className="bg-white rounded-2xl border border-black/[0.07] p-6 shadow-sm">
                  <p className="text-[13px] font-bold text-scanup-navy mb-1">{card.title}</p>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Notre positionnement ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[2px] w-8 bg-scanup-blue rounded-full" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-scanup-blue">Notre positionnement</span>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="text-[24px] sm:text-[32px] font-bold tracking-tight mb-8">
              D'une prévention déclarative à une prévention objectivée.
            </h2>
          </Reveal>
          <div className="space-y-3 mb-10">
            {[
              { from: 'Prévention déclarative',   to: 'Prévention objectivée' },
              { from: 'Réaction a posteriori',     to: 'Détection précoce' },
              { from: 'Indicateurs généraux',      to: 'Données terrain exploitables' },
            ].map((row, i) => (
              <Reveal key={i} delay={0.08 + i * 0.07}>
                <div className="flex items-center gap-3 bg-[#f8f9fb] rounded-2xl px-5 py-4">
                  <span className="text-[13px] text-scanup-graytext line-through flex-1">{row.from}</span>
                  <ArrowRight size={14} className="text-scanup-blue flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-scanup-navy flex-1 text-right">{row.to}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div className="border-l-2 border-scanup-blue pl-6">
              <p className="text-[16px] text-scanup-navy font-medium leading-relaxed">
                Notre ambition : renforcer la culture de prévention et soutenir durablement la santé des collaborateurs, tout en sécurisant la responsabilité de l'employeur.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-scanup-navy relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full border border-scanup-turquoise/10" />
          <div className="absolute -left-16 -bottom-16 w-[300px] h-[300px] rounded-full border border-scanup-blue/20" />
        </div>
        <Reveal className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-[26px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">
            Prêt à objectiver votre prévention ?
          </h2>
          <p className="text-[16px] text-white/50 mb-8 leading-relaxed">
            Démarrez avec 5 dépistages gratuits. Vos équipes accèdent aux questionnaires en 48h.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-turquoise text-scanup-navy px-8 py-3.5 rounded-full font-bold text-[15px] hover:brightness-105 transition-all shadow-lg shadow-scanup-turquoise/20 inline-flex items-center gap-2"
            >
              Démarrer gratuitement <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/tarifs')}
              className="text-white/70 px-8 py-3.5 rounded-full font-medium text-[15px] border border-white/20 hover:border-white/50 hover:text-white transition-all"
            >
              Voir les tarifs
            </motion.button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
