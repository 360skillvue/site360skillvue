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
  HeartPulse
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

export default function SPSTIPage() {
  const trackEvent = (eventName: string) => {
    console.log(`[GA4 Event] ${eventName}`);
  };

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-warning/20">
      {/* Top Decorative Bar */}
      <div className="h-[8px] w-full bg-gradient-to-r from-scanup-warning to-scanup-blue fixed top-0 z-50"></div>

      {/* Navigation */}
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
            <span className="text-scanup-warning font-medium">SPSTI</span>
            <Link to="/partenaires" className="text-scanup-graytext hover:text-scanup-warning transition-colors">Notre Réseau</Link>
            <a href="#" className="text-scanup-graytext hover:text-scanup-warning transition-colors">Aide & Support</a>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <button className="hidden sm:block text-scanup-navy font-medium hover:text-scanup-warning transition-colors">Connexion</button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => trackEvent('click_essai_gratuit_nav_spsti')}
              className="bg-scanup-warning text-scanup-navy px-5 py-2.5 rounded-[10px] font-medium hover:bg-amber-500 transition-colors shadow-lg shadow-scanup-warning/20"
            >
              Essai gratuit
            </motion.button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-scanup-warning/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-warning/10 text-scanup-warning text-sm font-medium mb-6 border border-scanup-warning/20">
                <Stethoscope size={16} />
                Prévention primaire & désinsertion
              </div>
              <h1 className="text-[32px] md:text-[48px] lg:text-[56px] font-bold leading-[1.15] mb-6 tracking-tight">
                Détection précoce et <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-warning to-scanup-blue">maintien dans l’emploi</span>
              </h1>
              <p className="text-[18px] text-scanup-graytext mb-10 leading-[1.6] max-w-lg">
                ScanUp RPS et TMS : l'outil indispensable pour vos équipes pluridisciplinaires pour assurer une traçabilité parfaite de vos actions de prévention.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => trackEvent('click_demande_demo_hero_spsti')}
                  className="bg-scanup-warning text-scanup-navy px-8 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-scanup-warning/20 group"
                >
                  Demander une démo
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
                src="https://picsum.photos/seed/medical/800/600?blur=2" 
                alt="Équipe médicale SPSTI" 
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
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">Vos objectifs de santé au travail</h2>
            <p className="text-[18px] text-scanup-graytext leading-relaxed">
              Renforcez votre action de prévention primaire et facilitez le maintien dans l'emploi de vos salariés suivis.
            </p>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Activity, title: "Détection précoce", desc: "Identifiez les signaux faibles de RPS et TMS dès les premières alertes pour une intervention rapide.", color: "text-scanup-warning", bg: "bg-scanup-warning/10" },
              { icon: HeartPulse, title: "Maintien dans l’emploi", desc: "Accompagnez durablement les salariés pour prévenir la désinsertion professionnelle.", color: "text-scanup-blue", bg: "bg-scanup-blue/10" }
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
            <h2 className="text-[28px] md:text-[40px] font-bold mb-6 tracking-tight">Un outil pour vos équipes pluridisciplinaires</h2>
            <p className="text-[18px] text-scanup-graytext mb-8 leading-relaxed">
              Facilitez la collaboration entre médecins du travail, infirmiers, psychologues et ergonomes grâce à une plateforme partagée.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-warning/10 flex items-center justify-center flex-shrink-0">
                  <Users className="text-scanup-warning" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">Outil pour équipes pluridisciplinaires</h4>
                  <p className="text-scanup-graytext">Partagez les informations et coordonnez vos actions de prévention en temps réel.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-scanup-blue/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="text-scanup-blue" size={20} />
                </div>
                <div>
                  <h4 className="text-[18px] font-bold mb-1">Traçabilité des actions</h4>
                  <p className="text-scanup-graytext">Assurez un suivi rigoureux et conforme de chaque intervention et recommandation.</p>
                </div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-scanup-warning to-scanup-blue rounded-2xl transform translate-x-3 translate-y-3 opacity-20 transition-transform duration-500"></div>
              <img 
                src="https://picsum.photos/seed/spsti/800/600?blur=2" 
                alt="Outil de suivi médical" 
                className="relative rounded-2xl shadow-xl border border-scanup-white w-full object-cover"
                referrerPolicy="no-referrer"
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
              Optimisez votre action de prévention
            </h2>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => trackEvent('click_demande_demo_footer_spsti')}
              className="bg-scanup-warning text-scanup-navy px-10 py-4 rounded-[10px] font-medium hover:bg-amber-500 transition-colors shadow-xl shadow-scanup-warning/20 text-lg"
            >
              Demander une démo SPSTI
            </motion.button>
            <div className="mt-12 text-scanup-lightblue/60 flex items-center justify-center gap-2">
              <Mail size={16} />
              <a href="mailto:contact@360skillvue.com" className="hover:text-scanup-white transition-colors">contact@360skillvue.com</a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
