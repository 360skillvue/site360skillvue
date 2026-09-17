import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ScanLine, Brain, ShieldCheck,
  BarChart3, Users, FileCheck
} from 'lucide-react';
import { Link, useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';
import VideoEmbed from '../components/VideoEmbed';
import AvantagesPresentiel from '../components/AvantagesPresentiel';

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
  { name: "Roche",  src: "/partners/roche.webp" },
  { name: "Cerba",  src: "/partners/cerba.webp" },
  { name: "HCL",    src: "/partners/LogoHCL.webp" },
  { name: "BIC",    src: "/partners/Bic.webp" },
  { name: "HPS",    src: "/partners/HPS.webp" },
  { name: "CDE",    src: "/partners/cde.webp" },
  { name: "Revima", src: "/partners/Revima.webp" },
];

export default function HomePage() {
  const { t } = useLanguage();

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

  const navigate = useNavigate();


  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">
      <PageMeta
        title={t.meta.home.title}
        description={t.meta.home.description}
        path="/"
      />

      <Navbar />

      {/* ─── HERO : AVANTAGES FACE AU PRÉSENTIEL ─────────────── */}
      <AvantagesPresentiel hero />

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

      {/* ─── PARCOURS SALARIE, QUATRE VIDEOS ───────────────────── */}
      <section className="py-24 px-6 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">
              {t.home.videosLabel}
            </p>
            <h2 className="text-[28px] sm:text-[38px] font-bold tracking-tight mb-4">
              {t.home.videosTitle}
            </h2>
            <p className="text-[15px] text-scanup-graytext max-w-2xl mx-auto leading-relaxed">
              {t.home.videosSubtitle}
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">
            {[
              { flag: '🇫🇷', label: t.home.videosRpsFr, file: 'rps-fr' },
              { flag: '🇨🇭', label: t.home.videosRpsCh, file: 'rps-ch' },
              { flag: '🇫🇷', label: t.home.videosTmsFr, file: 'tms-fr' },
              { flag: '🇨🇭', label: t.home.videosTmsCh, file: 'tms-ch' },
            ].map((v, i) => (
              <FadeIn key={v.file} delay={0.1 + i * 0.08}>
                <p className="text-[13px] font-semibold text-scanup-navy mb-3">
                  {v.flag} {v.label}
                </p>
                <VideoEmbed
                  src={`/videos/scanup-parcours-${v.file}.mp4`}
                  poster={`/scanup-parcours-${v.file}.webp`}
                  title={v.label}
                  ratio="16/9"
                />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NIVEAUX D'ACCOMPAGNEMENT ──────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">
              {t.home.levelsLabel}
            </p>
            <h2 className="text-[32px] md:text-[42px] font-bold tracking-tight mb-5">
              {t.home.levelsTitle}
            </h2>
            <p className="text-[15px] text-scanup-graytext max-w-3xl mx-auto leading-relaxed">
              {t.home.levelsSubtitle}
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { n: '01', title: t.home.level1Title, desc: t.home.level1Desc, price: t.home.level1Price, hi: false },
              { n: '02', title: t.home.level2Title, desc: t.home.level2Desc, price: t.home.level2Price, hi: false },
              { n: '03', title: t.home.level3Title, desc: t.home.level3Desc, price: t.home.level3Price, hi: true },
            ].map((lv, i) => (
              <FadeIn key={lv.n} delay={i * 0.1}>
                <div
                  className={`h-full flex flex-col rounded-[20px] p-8 border transition-shadow duration-300 ${
                    lv.hi
                      ? 'bg-scanup-navy text-white border-scanup-navy shadow-xl shadow-scanup-navy/15'
                      : 'bg-scanup-white border-scanup-graylight hover:shadow-xl hover:shadow-scanup-navy/5'
                  }`}
                >
                  <span
                    className={`text-[28px] font-bold tracking-tight mb-4 ${
                      lv.hi ? 'text-scanup-turquoise' : 'text-scanup-blue'
                    }`}
                  >
                    {lv.n}
                  </span>
                  <h3
                    className={`text-[20px] font-bold tracking-tight mb-3 leading-snug ${
                      lv.hi ? 'text-white' : 'text-scanup-navy'
                    }`}
                  >
                    {lv.title}
                  </h3>
                  <p
                    className={`text-[15px] leading-relaxed flex-grow ${
                      lv.hi ? 'text-white/80' : 'text-scanup-graytext'
                    }`}
                  >
                    {lv.desc}
                  </p>
                  <p
                    className={`text-[14px] font-semibold mt-6 pt-5 border-t ${
                      lv.hi ? 'text-scanup-turquoise border-white/15' : 'text-scanup-navy border-scanup-graylight'
                    }`}
                  >
                    {lv.price}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.15} className="mb-12">
            <div className="rounded-[20px] bg-scanup-lightblue/50 border border-scanup-blue/15 p-8 md:p-9">
              <h3 className="text-[18px] font-bold tracking-tight text-scanup-navy mb-3">
                {t.home.levelsPackTitle}
              </h3>
              <p className="text-[15px] text-scanup-graytext leading-relaxed max-w-3xl">
                {t.home.levelsPackDesc}
              </p>
              <p className="text-[15px] text-scanup-navy font-medium leading-relaxed max-w-3xl mt-3">
                {t.home.levelsIntl}
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-3 mt-6">
                <Link
                  to="/partenaires"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-scanup-blue hover:gap-3 transition-all duration-300"
                >
                  {t.home.levelsPackNetwork}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/aide-support"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-scanup-blue hover:gap-3 transition-all duration-300"
                >
                  {t.home.levelsPackContact}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <blockquote className="max-w-3xl mx-auto text-center border-l-2 border-scanup-blue pl-6 md:border-l-0 md:pl-0">
              <p className="text-[17px] md:text-[19px] leading-relaxed text-scanup-navy italic">
                {t.home.levelsQuote}
              </p>
            </blockquote>
          </FadeIn>

          <FadeIn delay={0.2} className="text-center mt-10">
            <Link
              to="/tarifs"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-scanup-blue hover:gap-3 transition-all duration-300"
            >
              {t.home.levelsCta}
              <ArrowRight size={18} />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ─── VISION FONDATRICE ─────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10">
            <h2 className="text-[26px] sm:text-[34px] font-bold tracking-tight mb-3">
              {t.home.founderTitle}
            </h2>
            <p className="text-[15px] text-scanup-graytext max-w-xl mx-auto">
              {t.home.founderSubtitle}
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="flex justify-center">
            <VideoEmbed
              id="PlirT4EdL6g"
              title={t.home.founderTitle}
              ratio="16/9"
              maxWidth={360}
            />
          </FadeIn>
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
              <table className="w-full text-[14px] min-w-[560px]">
                <thead>
                  <tr className="bg-[#f8f9fb] border-b border-black/[0.06]">
                    <th className="text-left px-4 py-4 font-semibold text-scanup-navy w-[30%]"></th>
                    <th className="px-3 py-4 text-center w-[17.5%]">
                      <div className="font-bold text-scanup-blue text-[12px] leading-tight whitespace-nowrap">{t.home.compareColScanup}</div>
                      <div className="text-[10px] text-scanup-blue/60 font-normal mt-1 leading-tight">{t.home.compareColScanupSub}</div>
                    </th>
                    <th className="px-3 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[12px] leading-tight">{t.home.compareColQuestionnaires}</div>
                      <div className="text-[10px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColQuestionnairesSub}</div>
                    </th>
                    <th className="px-3 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[12px] leading-tight">{t.home.compareColLogiciels}</div>
                      <div className="text-[10px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColLogicielsSub}</div>
                    </th>
                    <th className="px-3 py-4 text-center w-[17.5%]">
                      <div className="font-semibold text-scanup-navy text-[12px] leading-tight">{t.home.compareColIA}</div>
                      <div className="text-[10px] text-scanup-graytext font-normal mt-1 leading-tight">{t.home.compareColIASub}</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {t.home.compareRows.map((row, i) => {
                    const isLast = i === t.home.compareRows.length - 1;
                    const cell = (val: boolean | string, isScanup = false) => {
                      if (val === true) return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[13px]">✓</span></td>;
                      if (val === false) return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-[15px]">—</span></td>;
                      if (val === 'partial') return <td className={`px-4 py-4 text-center ${!isLast ? 'border-b border-black/[0.04]' : ''}`}><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 font-bold text-[13px]">◐</span></td>;
                      return (
                        <td className={`px-4 py-4 text-center text-[13px] font-semibold ${isScanup ? 'text-scanup-blue' : 'text-scanup-navy'} ${!isLast ? 'border-b border-black/[0.04]' : ''}`}>
                          {val}
                        </td>
                      );
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
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { window.location.href = '/simulateur-cout-tms-rps'; }}
              className="text-white px-8 py-4 rounded-[12px] font-bold text-[16px] border border-white/25 hover:border-white transition-all"
            >
              {t.home.ctaButtonSimulateur}
            </motion.button>
          </div>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
