import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ArrowRight,
  ScanLine, Brain, ShieldCheck,
  BarChart3, Users, FileCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = ""
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.65, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

type Audience = { label: string; link: string };

const audiences: Audience[] = [
  { label: "Assureurs & Mutuelles", link: "/assureurs-mutuelles" },
  { label: "Entreprises & DRH",     link: "/entreprises-drh" },
  { label: "SPSTI",                  link: "/spsti" },
  { label: "Secteur santé",          link: "/certification-periodique-sante" },
];


const pillars = [
  {
    icon: ScanLine,
    color: "text-scanup-blue",
    bg: "bg-scanup-blue/8",
    title: "Évaluer",
    desc: "Des questionnaires scientifiquement validés pour mesurer TMS, RPS et compétences — déployés en quelques clics.",
  },
  {
    icon: BarChart3,
    color: "text-scanup-turquoise",
    bg: "bg-scanup-turquoise/10",
    title: "Analyser",
    desc: "Tableaux de bord en temps réel, segmentation par population, alertes automatiques sur les cohortes à risque.",
  },
  {
    icon: ShieldCheck,
    color: "text-scanup-success",
    bg: "bg-scanup-success/8",
    title: "Agir",
    desc: "Plans de prévention personnalisés, relances automatiques et traçabilité complète pour chaque collaborateur.",
  },
];

const products = [
  {
    tag: "Prévention",
    name: "ScanUp TMS",
    desc: "Dépistage des troubles musculo-squelettiques à grande échelle, avec orientation vers les équipes soignantes.",
    icon: Users,
    link: "/entreprises-drh",
    accent: "#0068FF",
    accentLight: "rgba(0,104,255,0.07)",
  },
  {
    tag: "Prévention",
    name: "ScanUp RPS",
    desc: "Évaluation des risques psychosociaux et détection précoce des signaux faibles de souffrance au travail.",
    icon: Brain,
    link: "/assureurs-mutuelles",
    accent: "#33FFCC",
    accentLight: "rgba(51,255,204,0.08)",
  },
  {
    tag: "Réglementation",
    name: "ScanUp Certification",
    desc: "Pilotage de la certification périodique des professionnels de santé — conformité, traçabilité, HDS.",
    icon: FileCheck,
    link: "/certification-periodique-sante",
    accent: "#16A34A",
    accentLight: "rgba(22,163,74,0.07)",
    highlight: true,
  },
];

const refs = [
  { name: "Roche",  src: "https://360skillvue.com/wp-content/uploads/2025/roche.png" },
  { name: "Cerba",  src: "https://360skillvue.com/wp-content/uploads/2025/cerba.png" },
  { name: "HCL",    src: "https://360skillvue.com/wp-content/uploads/2025/LogoHCL.jpg" },
  { name: "BIC",    src: "https://360skillvue.com/wp-content/uploads/2025/Bic.png" },
  { name: "HPS",    src: "https://360skillvue.com/wp-content/uploads/2025/HPS.png" },
  { name: "CDE",    src: "https://360skillvue.com/wp-content/uploads/2025/cde.png" },
  { name: "Revima", src: "https://360skillvue.com/wp-content/uploads/2025/Revima.png" },
];

export default function HomePage() {
  const [open, setOpen]         = useState(false);
  const [selected, setSelected]  = useState<Audience | null>(null);
  const [cycleIdx, setCycleIdx]  = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (selected) return;
    const t = setInterval(() => setCycleIdx(i => (i + 1) % audiences.length), 5000);
    return () => clearInterval(t);
  }, [selected]);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">

      {/* Top bar */}
      <div className="h-[6px] w-full bg-gradient-to-r from-scanup-blue via-scanup-turquoise to-scanup-blue fixed top-0 z-50" />

      {/* Nav */}
      <nav className="sticky top-[6px] z-40 bg-scanup-white/80 backdrop-blur-md border-b border-scanup-graylight/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="font-bold text-xl tracking-tight text-scanup-blue">ScanUp</span>
            <span className="text-scanup-graytext text-sm">by</span>
            <img src="/Logo360skillvue-200x55.webp" alt="360SkillVue" className="h-8 w-auto" />
          </motion.div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/certification-periodique-sante" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Certification Santé</Link>
            <Link to="/partenaires" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Notre Réseau</Link>
            <a href="#" className="text-scanup-graytext hover:text-scanup-blue transition-colors">Aide & Support</a>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <button className="hidden sm:block text-scanup-navy font-medium hover:text-scanup-blue transition-colors">Connexion</button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-scanup-blue text-white px-5 py-2.5 rounded-[10px] font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-scanup-blue/20"
            >
              Essai gratuit
            </motion.button>
          </motion.div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[78vh] pt-16 pb-20 overflow-hidden">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,104,255,0.08) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(51,255,204,0.1) 0%, transparent 70%)" }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "radial-gradient(circle, #1C244B 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-6 text-center">
          <FadeIn>
            <h1 className="text-[42px] md:text-[58px] lg:text-[68px] font-bold leading-[1.15] tracking-tight mb-6">
              <span className="block mb-2">Vous êtes</span>

              {/* Animated label slot */}
              <span className="relative inline-block" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(o => !o)}
                  className="inline-flex items-center gap-3 focus:outline-none group"
                >
                  {/* Spacer (invisible longest label) keeps width stable */}
                  <span className="relative inline-block">
                    <span
                      aria-hidden
                      className="invisible whitespace-nowrap select-none pointer-events-none"
                    >
                      Assureurs &amp; Mutuelles ?
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={selected ? selected.label : audiences[cycleIdx].label}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -28 }}
                        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 flex items-center justify-center text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise whitespace-nowrap"
                      >
                        {selected ? selected.label : audiences[cycleIdx].label} ?
                      </motion.span>
                    </AnimatePresence>
                  </span>

                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.22 }}
                    className="text-scanup-blue/60 group-hover:text-scanup-blue transition-colors inline-flex"
                  >
                    <ChevronDown size={36} strokeWidth={2.5} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {open && (
                    <motion.ul
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 bg-white border border-scanup-graylight rounded-2xl shadow-2xl z-50 min-w-[280px] overflow-hidden text-left"
                    >
                      {audiences.map((a, i) => (
                        <motion.li
                          key={a.link}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <button
                            onClick={() => { setSelected(a); setOpen(false); navigate(a.link); }}
                            className="w-full px-6 py-4 text-[17px] font-semibold text-scanup-navy hover:bg-scanup-blue/5 hover:text-scanup-blue transition-colors text-left flex items-center justify-between group border-b border-scanup-graylight/60 last:border-0"
                          >
                            {a.label}
                            <ArrowRight size={15} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-scanup-blue" />
                          </button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </span>
            </h1>

            <p className="text-[18px] text-scanup-graytext leading-[1.75] max-w-2xl mx-auto mt-8">
              Sélectionnez votre profil pour découvrir la solution ScanUp adaptée à vos enjeux de prévention et de conformité.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── CLIENTS STRIP ─────────────────────────────────────── */}
      <section className="border-y border-scanup-graylight/70 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-graytext whitespace-nowrap flex-shrink-0">
            Ils nous font confiance
          </p>
          <div className="w-px h-8 bg-scanup-graylight hidden md:block flex-shrink-0" />
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-10">
            {refs.map((ref, i) => (
              <motion.img
                key={ref.name}
                src={ref.src}
                alt={`Logo ${ref.name}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="h-9 w-auto object-contain opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PILLARS ───────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">Notre approche</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">
              De la mesure à l'action,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">en un seul outil.</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="bg-scanup-white border border-scanup-graylight rounded-[20px] p-8 hover:shadow-xl hover:shadow-scanup-navy/5 transition-shadow duration-300 h-full flex flex-col"
                >
                  <div className={`w-14 h-14 rounded-2xl ${p.bg} flex items-center justify-center mb-6 flex-shrink-0`}>
                    <p.icon className={p.color} size={26} strokeWidth={1.75} />
                  </div>
                  <h3 className="text-[22px] font-bold mb-3">{p.title}</h3>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed flex-grow">{p.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ──────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-scanup-graylight/40">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">Nos solutions</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">
              Trois produits, une vision.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {products.map((prod, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <Link to={prod.link} className="block h-full group">
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="relative bg-white border rounded-[20px] p-8 h-full flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl"
                    style={{
                      borderColor: prod.highlight ? prod.accent : "rgba(241,245,249,1)",
                      boxShadow: prod.highlight ? `0 0 0 1px ${prod.accent}33` : undefined,
                    }}
                  >
                    {prod.highlight && (
                      <div className="absolute top-0 right-0 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl" style={{ background: prod.accent }}>
                        Nouveau
                      </div>
                    )}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: prod.accentLight }}
                    >
                      <prod.icon size={22} strokeWidth={1.75} style={{ color: prod.accent }} />
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: prod.accent }}
                    >
                      {prod.tag}
                    </span>
                    <h3 className="text-[22px] font-bold mb-3">{prod.name}</h3>
                    <p className="text-[14px] text-scanup-graytext leading-relaxed flex-grow">{prod.desc}</p>
                    <div
                      className="mt-8 pt-5 border-t border-scanup-graylight flex items-center gap-2 font-semibold text-[14px] transition-colors duration-200"
                      style={{ color: prod.accent }}
                    >
                      Découvrir
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-scanup-navy relative overflow-hidden">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -right-40 -top-40 w-[500px] h-[500px] rounded-full border border-scanup-turquoise/10"
        />
        <motion.div
          animate={{ rotate: [360, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -left-20 -bottom-20 w-[300px] h-[300px] rounded-full border border-scanup-blue/20"
        />
        <FadeIn className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-[32px] md:text-[44px] font-bold text-white mb-6 tracking-tight">
            Prêt à passer à l'action ?
          </h2>
          <p className="text-[17px] text-white/60 mb-10 leading-relaxed">
            Déployez ScanUp en quelques heures. Essai gratuit 14 jours, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-scanup-turquoise text-scanup-navy px-8 py-4 rounded-[12px] font-bold text-[16px] hover:brightness-105 transition-all shadow-lg shadow-scanup-turquoise/20"
            >
              Démarrer l'essai gratuit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="border border-white/20 text-white px-8 py-4 rounded-[12px] font-semibold text-[16px] hover:bg-white/5 transition-all"
            >
              Demander une démo
            </motion.button>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="bg-scanup-navy border-t border-white/5 py-10 text-center text-white/40 text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 360SkillVue. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
