import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  Mail, 
  Monitor, 
  Users, 
  BookOpen, 
  BellRing, 
  Calendar, 
  ShieldCheck, 
  Database, 
  Wand2, 
  Award,
  ChevronDown,
  ChevronUp,
  Settings,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

const FAQItem: React.FC<{ question: string, answer: string, index: number }> = ({ question, answer, index }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border border-scanup-graylight rounded-[16px] mb-4 bg-scanup-white overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <button 
        className="flex justify-between items-center w-full text-left p-6"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[16px] text-scanup-navy pr-8">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="text-scanup-blue flex-shrink-0" size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-scanup-graytext text-[14px] leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function CertificationPage() {
  const faqData = [
    {
      question: "Qu’est-ce que la certification périodique ?",
      answer: "Une obligation pour les 7 professions de santé à ordre de valider des actions de formation, qualité, relation patient et santé personnelle sur un cycle de 6 ans."
    },
    {
      question: "Quelles professions sont concernées ?",
      answer: "Médecins, infirmiers, pharmaciens, sages-femmes, kinésithérapeutes, podologues et chirurgiens-dentistes."
    },
    {
      question: "L’employeur a-t-il des obligations ?",
      answer: "Oui. L’article L.4022-2 du Code de la santé publique impose à l’employeur de coordonner et faciliter l’accès aux actions de certification."
    },
    {
      question: "Combien de modules à valider ?",
      answer: "8 à 10 modules selon la profession, répartis sur les 4 blocs de la certification, à valider sur 6 ans."
    },
    {
      question: "Votre plateforme est-elle conforme Qualiopi ?",
      answer: "Oui. IEF Biologie, organisme de formation certifié Qualiopi, utilise déjà 360SkillVue pour ses formations."
    },
    {
      question: "Pouvez-vous héberger des données de santé ?",
      answer: "Oui. Notre infrastructure permet l’hébergement de données de santé (HDS), rendant possible la validation des 4 blocs contrairement aux autres LMS. C'est indispensable pour les audits cliniques et les suivis d'indicateurs car l'apprenant communique sur des données de santé des patients."
    }
  ];

  const schemaOrgData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "360SkillVue",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "description": "Plateforme LMS pour piloter la certification périodique des professionnels de santé."
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqData.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  const trackEvent = (eventName: string) => {
    console.log(`[GA4 Event] ${eventName}`);
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        event_category: 'conversion',
        event_label: 'Landing Page Certification'
      });
    }
  };

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }} />
      
      {/* Top Decorative Bar */}
      <div className="h-[8px] w-full bg-gradient-to-r from-scanup-blue to-scanup-turquoise fixed top-0 z-50"></div>

      {/* Navigation (Sticky & Glassmorphism) */}
      <nav className="sticky top-[8px] z-40 bg-scanup-white/80 backdrop-blur-md border-b border-scanup-graylight/50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-scanup-blue">ScanUp</span>
              <span className="text-scanup-graytext text-sm font-normal">by</span>
              <img src="/Logo360skillvue-200x55.webp" alt="360SkillVue" className="h-8 w-auto" />
            </Link>
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-scanup-blue font-medium flex items-center gap-2 relative group">
              Certification Santé
              <span className="bg-gradient-to-r from-scanup-blue to-scanup-turquoise text-scanup-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">Nouveau</span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-scanup-blue transform scale-x-100 transition-transform origin-left"></span>
            </a>
            <Link to="/partenaires" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Notre Réseau</Link>
            <a href="#" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Aide & Support</a>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button className="hidden sm:block text-scanup-navy font-medium hover:text-scanup-blue transition-colors">Connexion</button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => trackEvent('click_essai_gratuit_nav')}
              className="bg-scanup-blue text-scanup-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/20"
            >
              Essai gratuit
            </motion.button>
          </motion.div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-scanup-blue/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-lightblue/50 text-scanup-blue text-sm font-medium mb-6 border border-scanup-blue/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-scanup-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-scanup-blue"></span>
                </span>
                Conforme à l'arrêté du 26 février 2026
              </div>
              <h1 className="text-[32px] md:text-[48px] lg:text-[56px] font-bold leading-[1.15] mb-6 tracking-tight">
                Certification périodique : <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">pilotez la conformité</span>
              </h1>
              <p className="text-[18px] text-scanup-graytext mb-10 leading-[1.6] max-w-lg">
                Une seule plateforme pour déployer les modules, suivre l’avancement et vous assurer que tous vos professionnels valident leur certification dans les temps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_demande_demo_hero')}
                  className="bg-scanup-blue text-scanup-white px-8 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-scanup-blue/20 group"
                >
                  Demander une démo
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_essai_gratuit_hero')}
                  className="bg-scanup-white text-scanup-navy border border-scanup-graylight px-8 py-4 rounded-[10px] font-medium hover:bg-scanup-graylight transition-colors flex items-center justify-center"
                >
                  Essai gratuit 14 jours
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
                src="https://picsum.photos/seed/dashboard/800/600?blur=2" 
                alt="Tableau de bord RH 360SkillVue" 
                className="relative rounded-2xl shadow-2xl border border-scanup-white/50 w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Section 2: Contexte réglementaire */}
      <section className="bg-scanup-graylight py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">Ce que la loi impose à votre établissement</h2>
            <p className="text-[18px] text-scanup-graytext leading-relaxed">
              Depuis l’ordonnance du 19 juillet 2021, les 7 professions de santé à ordre doivent valider une certification périodique sur un cycle de 6 ans. En tant qu’employeur (Art. L.4022-2), vous devez coordonner cette démarche.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "7 professions concernées", desc: "Médecin, infirmier, pharmacien, sage-femme, kinésithérapeute, podologue, chirurgien-dentiste.", color: "text-scanup-blue", bg: "bg-scanup-blue/10" },
              { icon: BookOpen, title: "8 à 10 modules à valider", desc: "Par profession sur un cycle de 6 ans, couvrant les 4 blocs de la certification.", color: "text-scanup-blue", bg: "bg-scanup-blue/10" },
              { icon: ShieldCheck, title: "Sanction possible", desc: "Risque de suspension d’exercice en cas de non-validation à l'issue du cycle.", color: "text-scanup-warning", bg: "bg-scanup-warning/10" }
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

      {/* Section 3: Le problème actuel */}
      <section className="py-24 bg-scanup-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">Aujourd’hui, vous jonglez entre plusieurs outils</h2>
            <p className="text-[18px] text-scanup-graytext mb-8 leading-relaxed">
              Tableurs pour suivre les avancements, e-mails pour relancer, plateforme DPC séparée, pas de vue consolidée… Le résultat : un pilotage compliqué et des risques de non-conformité.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="bg-gradient-to-br from-scanup-graylight to-white rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-center gap-8 border border-scanup-graylight shadow-lg relative">
              
              {/* Avant */}
              <div className="flex flex-col gap-4 relative w-full md:w-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="w-full h-1.5 bg-scanup-error/80 transform rotate-45 absolute rounded-full"></div>
                  <div className="w-full h-1.5 bg-scanup-error/80 transform -rotate-45 absolute rounded-full"></div>
                </motion.div>
                
                {[
                  { icon: FileSpreadsheet, label: "Tableurs" },
                  { icon: Mail, label: "E-mails" },
                  { icon: Monitor, label: "LMS DPC" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 0.5, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-scanup-white p-4 rounded-xl shadow-sm border border-scanup-graylight flex items-center gap-4 grayscale"
                  >
                    <item.icon className="text-scanup-graytext" size={24} />
                    <span className="text-[15px] font-medium">{item.label}</span>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-scanup-graytext/50 font-black text-3xl italic">VS</div>
              
              {/* Après */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring" }}
                className="bg-scanup-white p-8 rounded-2xl shadow-xl border-2 border-scanup-success flex flex-col items-center gap-4 relative w-full md:w-auto"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute -top-4 -right-4 bg-scanup-success text-white rounded-full p-1.5 shadow-lg"
                >
                  <CheckCircle2 size={24} />
                </motion.div>
                <div className="w-20 h-20 bg-scanup-blue/10 rounded-full flex items-center justify-center mb-2">
                  <Settings className="text-scanup-blue" size={40} />
                </div>
                <span className="font-bold text-2xl text-scanup-navy tracking-tight">360SkillVue</span>
                <span className="bg-scanup-success/10 text-scanup-success text-sm font-bold px-3 py-1 rounded-full uppercase tracking-wider">Tout-en-un</span>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section 4: Notre solution */}
      <section className="bg-scanup-graylight py-24">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">Tout au même endroit : déployez et suivez</h2>
            <p className="text-[18px] text-scanup-graytext max-w-2xl mx-auto leading-relaxed">
              Plus besoin de jongler entre plusieurs outils. 360SkillVue centralise le déploiement des modules et le suivi des avancements.
            </p>
          </FadeIn>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { icon: BookOpen, title: "Déployez vos modules", desc: "Modules génériques prêts à l’emploi ou sur-mesure. Création simplifiée." },
                { icon: Monitor, title: "Suivez en temps réel", desc: "Tableau de bord RH : avancement par profession, par apprenant." },
                { icon: BellRing, title: "Relancez en un clic", desc: "Identifiez ceux qui n’ont pas terminé et relancez depuis la plateforme." },
                { icon: Calendar, title: "Pilotez sur 6 ans", desc: "Sessions calées sur le cycle officiel de certification." }
              ].map((item, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-scanup-white p-8 rounded-[20px] border border-scanup-graylight shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                  >
                    <div className="w-12 h-12 bg-scanup-blue/10 rounded-xl flex items-center justify-center mb-5">
                      <item.icon className="text-scanup-blue" size={24} />
                    </div>
                    <h4 className="text-[18px] font-semibold mb-3">{item.title}</h4>
                    <p className="text-[15px] text-scanup-graytext leading-relaxed">{item.desc}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
            <FadeIn delay={0.3}>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-scanup-blue to-scanup-turquoise rounded-2xl transform translate-x-3 translate-y-3 opacity-20 group-hover:translate-x-4 group-hover:translate-y-4 transition-transform duration-500"></div>
                <img 
                  src="https://picsum.photos/seed/dashboard2/800/600?blur=2" 
                  alt="Tableau de bord 360SkillVue" 
                  className="relative rounded-2xl shadow-xl border border-scanup-white w-full object-cover transition-transform duration-500 group-hover:-translate-y-1"
                  referrerPolicy="no-referrer"
                />
              </div>
            </FadeIn>
          </div>
          
          <FadeIn delay={0.4} className="text-center">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => trackEvent('click_voir_plateforme_solution')}
              className="bg-scanup-blue text-scanup-white px-8 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-scanup-blue/20 group"
            >
              Voir la plateforme en action
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </FadeIn>
        </div>
      </section>

      {/* Section 5: Nos avantages clés */}
      <section className="bg-scanup-navy py-24 text-scanup-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-scanup-blue/20 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 z-10 relative">
          <FadeIn>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-16 text-center tracking-tight">Pourquoi 360SkillVue plutôt qu’un LMS généraliste ?</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: "Conforme Qualiopi", desc: "IEF Biologie, OF certifié Qualiopi, utilise déjà notre plateforme." },
              { icon: Database, title: "Hébergement HDS", desc: "Rend possible la validation des 4 blocs contrairement aux autres LMS. Indispensable pour les audits cliniques et suivis d'indicateurs car l'apprenant communique sur des données de santé des patients." },
              { icon: Wand2, title: "Création ultra-simple", desc: "Un PS peut créer un module sans aucune compétence technique. Accès facilité avec une connexion sans email." },
              { icon: ShieldCheck, title: "Spécialisée certification", desc: "Conçue spécifiquement pour ce dispositif, pas un LMS générique." }
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div 
                  whileHover={{ y: -8 }}
                  className="bg-scanup-white border border-scanup-graylight rounded-[20px] p-8 text-scanup-navy hover:shadow-xl transition-all duration-300 h-full"
                >
                  <item.icon className="text-scanup-blue mb-6" size={36} strokeWidth={1.5} />
                  <h3 className="text-[20px] font-semibold mb-3">{item.title}</h3>
                  <p className="text-[14px] text-scanup-graytext leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Tarif */}
      <section className="py-24 bg-scanup-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-scanup-success/10 text-scanup-success font-semibold text-sm tracking-wide uppercase">
              Offre de lancement
            </div>
            <h2 className="text-[48px] md:text-[64px] font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">
              10 € <span className="text-[24px] text-scanup-navy font-semibold">/ salarié / an</span>
            </h2>
            <h3 className="text-[20px] font-medium text-scanup-graytext mb-10">Tarif early adopter — gagnant-gagnant pour nos premiers partenaires</h3>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <div className="bg-scanup-graylight rounded-[24px] p-8 md:p-12 mb-8 border border-scanup-graylight/80 text-left shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-scanup-turquoise/10 rounded-full blur-2xl"></div>
              <p className="text-[18px] text-scanup-navy leading-relaxed mb-8 relative z-10">
                Accès autonome à l’ensemble de la plateforme pendant 12 mois, tous modules inclus. En contrepartie : vos retours pour améliorer la plateforme et votre autorisation de communiquer sur notre collaboration.
              </p>
              <div className="flex justify-center relative z-10">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_essai_gratuit_tarif')}
                  className="bg-scanup-blue text-scanup-white px-10 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors shadow-xl shadow-scanup-blue/20 text-lg"
                >
                  Démarrer l’essai gratuit
                </motion.button>
              </div>
            </div>
            <p className="text-[14px] text-scanup-graytext">Modules sur étagère ou sur-mesure disponibles sur devis</p>
          </FadeIn>
        </div>
      </section>

      {/* Section 7: Témoignage */}
      <section className="bg-scanup-graylight py-24">
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn>
            <div className="bg-scanup-white rounded-[24px] p-8 md:p-12 border border-scanup-graylight/80 shadow-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-scanup-blue to-scanup-turquoise"></div>
              <div className="flex-shrink-0 w-32 h-32 bg-scanup-graylight rounded-full flex items-center justify-center border border-scanup-graylight/80 shadow-inner">
                <span className="font-bold text-scanup-navy text-center text-sm">Logo<br/>IEF Biologie</span>
              </div>
              <div>
                <svg className="w-10 h-10 text-scanup-blue/20 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <blockquote className="text-[20px] md:text-[24px] font-medium italic text-scanup-navy mb-6 leading-relaxed">
                  « Nous utilisons 360SkillVue pour déployer nos formations et suivre la conformité de nos professionnels de santé. »
                </blockquote>
                <div className="text-[16px] text-scanup-graytext mb-6 font-medium">— IEF Biologie, OF certifié Qualiopi</div>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-scanup-blue/10 text-scanup-blue text-[13px] px-4 py-1.5 rounded-full font-semibold tracking-wide">Qualiopi</span>
                  <span className="bg-scanup-turquoise/20 text-scanup-navy text-[13px] px-4 py-1.5 rounded-full font-semibold tracking-wide">Hébergement données de santé</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="py-24 bg-scanup-white">
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn>
            <h2 className="text-[28px] md:text-[40px] font-bold mb-12 text-center tracking-tight">Questions fréquentes</h2>
          </FadeIn>
          <div className="space-y-2">
            {faqData.map((faq, index) => (
              <FAQItem key={index} index={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 8: CTA final */}
      <section className="bg-scanup-navy py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/pattern/1920/1080?blur=10')] opacity-10 mix-blend-overlay"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <FadeIn>
            <h2 className="text-[32px] md:text-[48px] font-bold mb-10 text-scanup-white tracking-tight leading-tight">
              Prêts à simplifier la certification de vos équipes ?
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => trackEvent('click_demande_demo_footer')}
                className="bg-scanup-blue text-scanup-white px-10 py-4 rounded-[10px] font-medium hover:bg-blue-700 transition-colors shadow-xl shadow-scanup-blue/20 text-lg"
              >
                Demander une démo
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => trackEvent('click_essai_gratuit_footer')}
                className="bg-scanup-white/10 text-scanup-white border border-scanup-white/20 px-10 py-4 rounded-[10px] font-medium hover:bg-scanup-white/20 transition-colors backdrop-blur-sm text-lg"
              >
                Essai gratuit 14 jours
              </motion.button>
            </div>
            <div className="text-scanup-lightblue/60 text-[16px] flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <a href="mailto:Laure.dellamonica@360skillvue.com?subject=Demande%20de%20d%C3%A9mo%20-%20Certification%20P%C3%A9riodique" className="hover:text-scanup-white transition-colors flex items-center gap-2">
                <Mail size={16} />
                Laure.dellamonica@360skillvue.com
              </a>
              <span className="hidden sm:block text-scanup-white/20">|</span>
              <a href="https://360skillvue.com?utm_source=website&utm_medium=landing&utm_campaign=certif_periodique" className="hover:text-scanup-white transition-colors">
                360skillvue.com
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
