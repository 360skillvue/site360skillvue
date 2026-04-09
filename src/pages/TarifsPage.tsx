import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowRight, Shield, Clock, Database } from 'lucide-react';
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

const FAQS = [
  {
    q: 'Qu\'est-ce que ScanUp RPS et TMS ?',
    a: 'Des modules d\'évaluation scientifiquement validés pour dépister les Risques Psycho-Sociaux et les Troubles Musculo-Squelettiques au sein de vos équipes. Résultats en 48 h.',
  },
  {
    q: 'Les données des salariés sont-elles confidentielles ?',
    a: 'Absolument. Les données individuelles sont strictement confidentielles. Les RH n\'accèdent qu\'à des données agrégées et anonymisées. L\'email est facultatif.',
  },
  {
    q: 'Combien coûte ScanUp ?',
    a: 'Essai gratuit avec 5 dépistages. Ensuite, dès 10 € par évaluation en autonomie, ou 2 700 € HT pour 100 dépistages avec qualification par nos experts.',
  },
  {
    q: 'Cela remplace-t-il le Document Unique (DUERP) ?',
    a: 'Non, cela l\'alimente. Nos tableaux de bord fournissent des données objectives pour mettre à jour votre DUERP et justifier vos plans d\'action.',
  },
  {
    q: 'Combien de temps pour démarrer ?',
    a: 'En 48 heures. Vos collaborateurs accèdent aux questionnaires par QR code ou email, sans téléchargement, depuis n\'importe quel appareil.',
  },
  {
    q: 'Y a-t-il un engagement de durée ?',
    a: 'Aucun. Les crédits sont utilisables sans limite de temps. Les abonnements sont résiliables à tout moment, sans frais ni préavis.',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratuit',
    sub: '14 jours d\'essai',
    items: ['5 dépistages', 'Tableau de bord', 'Analyse par nos experts'],
    cta: 'Démarrer',
    featured: false,
  },
  {
    name: 'Access',
    price: '10 €',
    sub: '/ action HT',
    items: ['Plateforme complète', 'Modules autonomes', 'Crédits flexibles'],
    cta: 'Prendre RDV',
    featured: false,
  },
  {
    name: 'Pack 100',
    price: '2 700 €',
    sub: 'HT · 100 dépistages',
    items: ['Modules sur mesure', 'Qualification experts', 'Dashboard par équipe'],
    cta: 'Prendre RDV',
    featured: true,
  },
  {
    name: 'Impact 50',
    price: '4 475 €',
    sub: 'HT · 50 dépistages',
    items: ['Retours individuels', 'Restitution direction', 'Plan d\'action prévention'],
    cta: 'Prendre RDV',
    featured: false,
  },
];

const GUARANTEES = [
  { icon: Shield,   text: 'Aucune carte bancaire requise' },
  { icon: Clock,    text: 'Résiliation à tout moment' },
  { icon: Database, text: 'Données hébergées en France (HDS)' },
];

export default function TarifsPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title="Tarifs ScanUp — Prévention TMS & RPS"
        description="Découvrez les tarifs ScanUp : essai gratuit 14 jours, dès 10€ par évaluation. Aucune carte bancaire requise. Données hébergées en France."
        path="/tarifs"
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
              Tarifs
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-[28px] sm:text-[40px] md:text-[52px] font-bold tracking-[-0.02em] leading-[1.1] mb-5">
              Fini les audits à{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
                15 000€.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[17px] text-scanup-graytext leading-relaxed max-w-xl mx-auto">
              Démarrez dès <strong className="text-scanup-navy">10€ par évaluation</strong>. Passez à l'échelle selon vos besoins.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl p-7 h-full flex flex-col transition-shadow relative ${
                    plan.featured
                      ? 'bg-scanup-navy text-white'
                      : 'bg-white border border-black/[0.07] shadow-sm'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-scanup-blue text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-wide whitespace-nowrap">
                      Populaire
                    </div>
                  )}
                  <div className={`text-[11px] font-semibold uppercase tracking-widest mb-3 ${plan.featured ? 'text-scanup-turquoise' : 'text-scanup-blue'}`}>
                    {plan.name}
                  </div>
                  <div className={`text-[30px] font-bold tracking-tight leading-none mb-1 ${plan.featured ? 'text-white' : 'text-scanup-navy'}`}>
                    {plan.price}
                  </div>
                  <div className={`text-[12px] mb-6 ${plan.featured ? 'text-white/40' : 'text-scanup-graytext'}`}>
                    {plan.sub}
                  </div>
                  <ul className="space-y-2.5 flex-grow mb-7">
                    {plan.items.map((item, j) => (
                      <li key={j} className={`flex items-center gap-2 text-[13px] ${plan.featured ? 'text-white/70' : 'text-scanup-graytext'}`}>
                        <Check size={11} className={plan.featured ? 'text-scanup-turquoise flex-shrink-0' : 'text-scanup-blue flex-shrink-0'} />
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
                    }`}
                  >
                    {plan.cta}
                  </button>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Guarantees */}
          <Reveal className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {GUARANTEES.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-scanup-graytext">
                <Icon size={13} className="text-scanup-blue flex-shrink-0" />
                {text}
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Comparaison usage ────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#f8f9fb]">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight mb-3">Quel forfait vous correspond ?</h2>
            <p className="text-[15px] text-scanup-graytext">Un seul critère : la taille de votre équipe.</p>
          </Reveal>
          <Reveal>
            <div className="space-y-3">
              {[
                { range: 'Moins de 20 personnes',   plan: 'Starter ou Access',  color: '#0068FF' },
                { range: '20 à 100 personnes',      plan: 'Access ou Pack 100', color: '#0068FF' },
                { range: '100 à 300 personnes',     plan: 'Pack 100',           color: '#16A34A' },
                { range: 'Plus de 300 personnes',   plan: 'Impact 50 + Access', color: '#F97316' },
              ].map((row, i) => (
                <div key={i} className="bg-white rounded-2xl border border-black/[0.06] px-6 py-4 flex items-center justify-between gap-4">
                  <span className="text-[14px] text-scanup-graytext">{row.range}</span>
                  <span className="text-[13px] font-semibold px-3 py-1 rounded-full text-white" style={{ background: row.color }}>
                    {row.plan}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-12">
            <h2 className="text-[26px] sm:text-[36px] font-bold tracking-tight">Questions fréquentes</h2>
          </Reveal>
          <div className="border-t border-black/[0.06]">
            {FAQS.map((faq, i) => (
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

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-scanup-navy relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full border border-scanup-turquoise/10" />
          <div className="absolute -left-16 -bottom-16 w-[300px] h-[300px] rounded-full border border-scanup-blue/20" />
        </div>
        <Reveal className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-[26px] sm:text-[38px] font-bold text-white mb-4 tracking-tight">
            Prêt à démarrer ?
          </h2>
          <p className="text-[16px] text-white/50 mb-8 leading-relaxed">
            Essai gratuit 14 jours, sans carte bancaire. Vos équipes démarrent en 48h.
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
              onClick={() => navigate('/aide-support')}
              className="text-white/70 px-8 py-3.5 rounded-full font-medium text-[15px] border border-white/20 hover:border-white/50 hover:text-white transition-all"
            >
              Demander une démo
            </motion.button>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
