import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ArrowRight,
  ScanLine, Brain, ShieldCheck,
  BarChart3, Users, FileCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

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

const refs = [
  { name: "Roche",  src: "/partners/roche.png" },
  { name: "Cerba",  src: "/partners/cerba.png" },
  { name: "HCL",    src: "/partners/LogoHCL.jpg" },
  { name: "BIC",    src: "/partners/Bic.png" },
  { name: "HPS",    src: "/partners/HPS.png" },
  { name: "CDE",    src: "/partners/cde.png" },
  { name: "Revima", src: "/partners/Revima.png" },
];

type Audience = { label: string; link: string };

export default function HomePage() {
  const { t } = useLanguage();

  const audiences: Audience[] = [
    { label: t.home.audiences.assureurs, link: "/assureurs-mutuelles" },
    { label: t.home.audiences.entreprises, link: "/entreprises-drh" },
    { label: t.home.audiences.spsti,      link: "/spsti" },
    { label: t.home.audiences.sante,      link: "/certification-periodique-sante" },
  ];

  const pillars = [
    { icon: ScanLine,   color: "text-scanup-blue",      bg: "bg-scanup-blue/8",      title: t.home.pillar1Title, desc: t.home.pillar1Desc },
    { icon: BarChart3,  color: "text-scanup-turquoise", bg: "bg-scanup-turquoise/10", title: t.home.pillar2Title, desc: t.home.pillar2Desc },
    { icon: ShieldCheck,color: "text-scanup-success",   bg: "bg-scanup-success/8",   title: t.home.pillar3Title, desc: t.home.pillar3Desc },
  ];

  const products = [
    { tag: t.home.productTagPrevention,     name: t.home.product1Name, desc: t.home.product1Desc, icon: Users,     link: "/entreprises-drh",               accent: "#0068FF", accentLight: "rgba(0,104,255,0.07)" },
    { tag: t.home.productTagPrevention,     name: t.home.product2Name, desc: t.home.product2Desc, icon: Brain,     link: "/assureurs-mutuelles",            accent: "#33FFCC", accentLight: "rgba(51,255,204,0.08)" },
    { tag: t.home.productTagReglementation, name: t.home.product3Name, desc: t.home.product3Desc, icon: FileCheck, link: "/certification-periodique-sante", accent: "#16A34A", accentLight: "rgba(22,163,74,0.07)", highlight: true },
  ];

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
    const timer = setInterval(() => setCycleIdx(i => (i + 1) % audiences.length), 5000);
    return () => clearInterval(timer);
  }, [selected, audiences.length]);

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">
      <PageMeta
        title="Prévention TMS & RPS · Certification Santé"
        description="ScanUp dépiste les risques TMS et RPS et pilote la certification périodique de vos professionnels de santé."
        path="/"
      />

      <Navbar />

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
            <h1 className="text-[36px] sm:text-[48px] md:text-[62px] lg:text-[76px] font-bold leading-[1.15] tracking-tight mb-6">
              <span className="block mb-2">{t.home.heroTitle}</span>

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
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 bg-white border border-scanup-graylight rounded-2xl shadow-2xl z-50 min-w-[min(280px,80vw)] overflow-hidden text-left"
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
              {t.home.heroSubtitle}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ─── CLIENTS STRIP ─────────────────────────────────────── */}
      <section className="border-y border-scanup-graylight/70 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 md:gap-12">
          <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-graytext whitespace-nowrap flex-shrink-0">
            {t.home.trustStrip}
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
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PILLARS ───────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.home.pillarsLabel}</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">
              {t.home.pillarsTitle}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-scanup-blue to-scanup-turquoise">{t.home.pillarsTitleHighlight}</span>
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
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.home.productsLabel}</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight">
              {t.home.productsTitle}
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
                        {t.home.productNew}
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
                      {t.home.productDiscover}
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARATIF ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.home.compareLabel}</p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight mb-4">{t.home.compareTitle}</h2>
            <p className="text-scanup-graytext text-[16px]">{t.home.compareSubtitle}</p>
          </FadeIn>

          <FadeIn>
            <div className="overflow-x-auto rounded-2xl border border-black/[0.06] shadow-sm">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-[#f8f9fb] border-b border-black/[0.06]">
                    <th className="text-left px-5 py-4 font-semibold text-scanup-navy w-[30%]"></th>
                    <th className="px-4 py-4 text-center w-[17.5%]">
                      <div className="font-bold text-scanup-blue text-[13px] leading-tight">{t.home.compareColScanup}</div>
                      <div className="text-[11px] text-scanup-blue/60 font-normal mt-1 leading-tight">{t.home.compareColScanupSub}</div>
                    </th>
                    <th className="px-4 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[13px] leading-tight">{t.home.compareColQuestionnaires}</div>
                      <div className="text-[11px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColQuestionnairesSub}</div>
                    </th>
                    <th className="px-4 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[13px] leading-tight">{t.home.compareColLogiciels}</div>
                      <div className="text-[11px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColLogicielsSub}</div>
                    </th>
                    <th className="px-4 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[13px] leading-tight">{t.home.compareColIA}</div>
                      <div className="text-[11px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColIASub}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.home.compareRows.map((row, i) => {
                    const isLast = i === t.home.compareRows.length - 1;
                    const cell = (val: boolean | string, isScanup = false) => {
                      if (typeof val === 'string') return (
                        <td className={`px-4 py-4 text-center text-[13px] font-semibold ${isScanup ? 'text-scanup-blue' : 'text-scanup-navy'} ${!isLast ? 'border-b border-black/[0.04]' : ''}`}>
                          {val}
                        </td>
                      );
                      if (val === true) return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[13px]">✓</span></td>;
                      if (val === 'partial') return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-[13px]">◐</span></td>;
                      return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-[15px]">—</span></td>;
                    };
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'}>
                        <td className={`px-5 py-4 font-medium text-scanup-navy text-[13px] ${!isLast ? 'border-b border-black/[0.04]' : ''}`}>{row.label}</td>
                        {cell(row.scanup as boolean | string, true)}
                        {cell(row.q as boolean | string)}
                        {cell(row.rps as boolean | string)}
                        {cell(row.ia as boolean | string)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-scanup-graytext mt-3">{t.home.compareNote}</p>
          </FadeIn>
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
            {t.home.ctaTitle}
          </h2>
          <p className="text-[17px] text-white/60 mb-10 leading-relaxed">
            {t.home.ctaSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/aide-support')}
              className="bg-scanup-turquoise text-scanup-navy px-8 py-4 rounded-[12px] font-bold text-[16px] hover:brightness-105 transition-all shadow-lg shadow-scanup-turquoise/20"
            >
              {t.home.ctaButtonTrial}
            </motion.button>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="bg-scanup-navy border-t border-white/5 py-10 text-white/40 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/360skillvue/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn 360SkillVue"
              className="hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/360_skillvue/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram 360SkillVue"
              className="hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
            <span>·</span>
            <a href="/cgu" className="hover:text-white transition-colors">CGU</a>
            <span>·</span>
            <a href="/politique-confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</a>
          </div>
          <p>{t.home.footer}</p>
        </div>
      </footer>
    </div>
  );
}
