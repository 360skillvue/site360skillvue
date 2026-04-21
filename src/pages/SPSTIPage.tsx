import React from 'react';
import { motion } from 'motion/react';
import {
  Stethoscope,
  Activity,
  Users,
  ShieldCheck,
  ArrowRight,
  Mail,
  ClipboardCheck,
  HeartPulse,
  Lock,
  Scale,
  Flag,
  Hospital
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  const trackEvent = (eventName: string) => {
    console.log(`[GA4 Event] ${eventName}`);
    if (eventName.includes('demo')) navigate('/aide-support');
  };

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-warning/20">
      <PageMeta
        title="SPSTI — Détection précoce & Maintien dans l'emploi"
        description="Outil de dépistage TMS et RPS pour équipes pluridisciplinaires. Traçabilité complète de vos actions de prévention."
        path="/spsti"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-scanup-warning/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-warning/10 text-scanup-warning text-sm font-medium mb-6 border border-scanup-warning/20">
                <Stethoscope size={16} />
                {t.spsti.heroBadge}
              </div>
              <h1 className="text-[24px] sm:text-[32px] md:text-[48px] lg:text-[56px] font-bold leading-[1.15] mb-6 tracking-tight">
                {t.spsti.heroTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-warning to-scanup-blue">{t.spsti.heroTitleHighlight}</span>
              </h1>
              <p className="text-[18px] text-scanup-graytext mb-10 leading-[1.6] max-w-lg">
                {t.spsti.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_demande_demo_hero_spsti')}
                  className="bg-scanup-warning text-scanup-navy px-8 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-scanup-warning/20 group"
                >
                  {t.spsti.heroCtaDemo}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="relative">
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-warning/20 to-scanup-blue/20 rounded-2xl transform translate-x-4 translate-y-4 blur-sm"></div>
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
                alt="Médecin du travail SPSTI"
                className="relative rounded-2xl shadow-2xl border border-scanup-white/50 w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Section Objectifs */}
      <section className="bg-scanup-graylight py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">{t.spsti.objectivesTitle}</h2>
            <p className="text-[18px] text-scanup-graytext leading-relaxed">
              {t.spsti.objectivesSubtitle}
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Activity, title: t.spsti.objective1Title, desc: t.spsti.objective1Desc, color: "text-scanup-warning", bg: "bg-scanup-warning/10" },
              { icon: HeartPulse, title: t.spsti.objective2Title, desc: t.spsti.objective2Desc, color: "text-scanup-blue", bg: "bg-scanup-blue/10" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-scanup-white border border-scanup-graylight/80 rounded-[20px] p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-300 h-full"
                >
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-6`}>
                    <item.icon className={item.color} size={32} strokeWidth={2} />
                  </div>
                  <h3 className="text-[20px] font-semibold mb-3">{item.title}</h3>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section Messages Clés */}
      <section className="py-24 bg-scanup-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">{t.spsti.teamTitle}</h2>
            <p className="text-[18px] text-scanup-graytext mb-8 leading-relaxed">
              {t.spsti.teamSubtitle}
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-warning/10 flex items-center justify-center flex-shrink-0">
                  <Users className="text-scanup-warning" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">{t.spsti.team1Title}</h4>
                  <p className="text-scanup-graytext">{t.spsti.team1Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-blue/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="text-scanup-blue" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">{t.spsti.team2Title}</h4>
                  <p className="text-scanup-graytext">{t.spsti.team2Desc}</p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-warning to-scanup-blue rounded-2xl transform translate-x-3 translate-y-3 opacity-20 transition-transform duration-500"></div>
              <img
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80"
                alt="Outil de suivi médical"
                className="relative rounded-2xl shadow-xl border border-scanup-white w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Sécurité & Conformité */}
      <section className="py-24 px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-scanup-blue mb-4">
              Sécurité &amp; Conformité
            </span>
            <h2 className="text-[28px] md:text-[40px] font-bold tracking-tight mb-4">
              Vos données de santé entre de bonnes mains
            </h2>
            <p className="text-[16px] text-scanup-graytext max-w-xl mx-auto leading-relaxed">
              La confiance est au cœur de notre plateforme. Nous appliquons les standards les plus exigeants.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Hospital,
                color: 'text-scanup-blue',
                bg: 'bg-scanup-blue/8',
                title: 'Hébergement HDS',
                desc: 'Infrastructure certifiée Hébergeur de Données de Santé, conformément aux exigences du Code de la santé publique.',
              },
              {
                icon: Lock,
                color: 'text-scanup-turquoise',
                bg: 'bg-scanup-turquoise/10',
                title: 'Anonymisation native',
                desc: 'Les données collectées sont anonymisées dès leur réception. Aucun témoignage ne peut être relié à un salarié identifié.',
              },
              {
                icon: Scale,
                color: 'text-scanup-warning',
                bg: 'bg-scanup-warning/10',
                title: 'Conformité RGPD',
                desc: 'Traitement des données en totale conformité avec le Règlement Général sur la Protection des Données.',
              },
              {
                icon: Flag,
                color: 'text-scanup-success',
                bg: 'bg-scanup-success/10',
                title: 'Souveraineté française',
                desc: 'Toutes les données sont hébergées en France, sur des serveurs situés sur le territoire national.',
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.07)' }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl border border-black/[0.07] p-6 h-full flex flex-col"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center mb-4 flex-shrink-0`}>
                    <item.icon className={item.color} size={20} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[15px] font-bold text-scanup-navy mb-2">{item.title}</h3>
                  <p className="text-[13px] text-scanup-graytext leading-relaxed flex-grow">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-scanup-navy py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <FadeIn>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-10 text-scanup-white tracking-tight">
              {t.spsti.ctaTitle}
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => trackEvent('click_demande_demo_footer_spsti')}
              className="bg-scanup-warning text-scanup-navy px-10 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors shadow-xl shadow-scanup-warning/20 text-lg"
            >
              {t.spsti.ctaButton}
            </motion.button>
            <div className="mt-12 text-scanup-lightblue/60 flex items-center justify-center gap-2">
              <Mail size={16} />
              <a href={`mailto:${t.spsti.ctaEmail}`} className="hover:text-scanup-white transition-colors">{t.spsti.ctaEmail}</a>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
