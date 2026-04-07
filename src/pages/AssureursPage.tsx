import React from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  BarChart3,
  Users,
  Target,
  ArrowRight,
  Mail,
  PieChart,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
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

export default function AssureursPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const trackEvent = (eventName: string) => {
    console.log(`[GA4 Event] ${eventName}`);
    if (eventName.includes('demo')) navigate('/aide-support');
  };

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">
      <PageMeta
        title="Assureurs & Mutuelles — Pilotage du risque santé"
        description="Segmentez vos populations et optimisez votre tarification avec des données de dépistage TMS et RPS en temps réel."
        path="/assureurs-mutuelles"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-scanup-blue/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-lightblue/50 text-scanup-blue text-sm font-medium mb-6 border border-scanup-blue/10">
                <Shield size={16} />
                {t.assureurs.heroBadge}
              </div>
              <h1 className="text-[24px] sm:text-[32px] md:text-[48px] lg:text-[56px] font-bold leading-[1.15] mb-6 tracking-tight">
                {t.assureurs.heroTitle} <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">{t.assureurs.heroTitleHighlight}</span> {t.assureurs.heroTitleEnd}
              </h1>
              <p className="text-[18px] text-scanup-graytext mb-10 leading-[1.6] max-w-lg">
                {t.assureurs.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_demande_demo_hero_assureurs')}
                  className="bg-scanup-blue text-scanup-white px-8 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-scanup-blue/20 group"
                >
                  {t.assureurs.heroCtaDemo}
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
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-blue/20 to-scanup-turquoise/20 rounded-2xl transform translate-x-4 translate-y-4 blur-sm"></div>
              <img 
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                alt="Réunion professionnelle assureurs"
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
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">{t.assureurs.objectivesTitle}</h2>
            <p className="text-[18px] text-scanup-graytext leading-relaxed">
              {t.assureurs.objectivesSubtitle}
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: PieChart, title: t.assureurs.objective1Title, desc: t.assureurs.objective1Desc, color: "text-scanup-blue", bg: "bg-scanup-blue/10" },
              { icon: Zap, title: t.assureurs.objective2Title, desc: t.assureurs.objective2Desc, color: "text-scanup-turquoise", bg: "bg-scanup-turquoise/10" },
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
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">{t.assureurs.dataTitle}</h2>
            <p className="text-[18px] text-scanup-graytext mb-8 leading-relaxed">
              {t.assureurs.dataSubtitle}
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-blue/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="text-scanup-blue" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">{t.assureurs.data1Title}</h4>
                  <p className="text-scanup-graytext">{t.assureurs.data1Desc}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-turquoise/10 flex items-center justify-center flex-shrink-0">
                  <Users className="text-scanup-turquoise" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">{t.assureurs.data2Title}</h4>
                  <p className="text-scanup-graytext">{t.assureurs.data2Desc}</p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-blue to-scanup-turquoise rounded-2xl transform translate-x-3 translate-y-3 opacity-20 transition-transform duration-500"></div>
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Visualisation de données"
                className="relative rounded-2xl shadow-xl border border-scanup-white w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-scanup-navy py-24 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <FadeIn>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-10 text-scanup-white tracking-tight">
              {t.assureurs.ctaTitle}
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => trackEvent('click_demande_demo_footer_assureurs')}
              className="bg-scanup-blue text-scanup-white px-10 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors shadow-xl shadow-scanup-blue/20 text-lg"
            >
              {t.assureurs.ctaButton}
            </motion.button>
            <div className="mt-12 text-scanup-lightblue/60 flex items-center justify-center gap-2">
              <Mail size={16} />
              <a href={`mailto:${t.assureurs.ctaEmail}`} className="hover:text-scanup-white transition-colors">{t.assureurs.ctaEmail}</a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
