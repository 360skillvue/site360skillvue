import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, FileText, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage } from '../i18n';

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 32 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function RevueDePressePage() {
  const { t } = useLanguage();
  const rp = t.revueDePresse;

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-white flex flex-col">
      <PageMeta
        title={rp.metaTitle}
        description={rp.metaDescription}
        path="/revue-de-presse"
      />
      <Navbar />

      <section className="relative bg-white overflow-hidden pt-28 pb-20 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #0068ff 0%, transparent 65%)', filter: 'blur(80px)' }} />
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #00d2c8 0%, transparent 65%)', filter: 'blur(90px)' }} />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-scanup-blue/20 bg-scanup-blue/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-scanup-blue mb-6">
              <Newspaper size={14} />
              {rp.badge}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">
              {rp.title}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-lg text-scanup-navy/60 max-w-xl mx-auto">
              {rp.subtitle}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="flex-1 bg-gray-50/60 py-16 px-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {rp.items.map((item, i) => (
            <Reveal key={item.href} delay={i * 0.06}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-scanup-blue/20 transition-all duration-200 p-6"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-scanup-blue/8 flex items-center justify-center text-scanup-blue">
                  <FileText size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest text-scanup-blue/70">{item.label}</span>
                    <span className="text-xs text-scanup-navy/35">{item.date}</span>
                  </div>
                  <h2 className="text-base font-bold text-scanup-navy group-hover:text-scanup-blue transition-colors truncate mb-1">
                    {item.title}
                  </h2>
                  <p className="text-sm text-scanup-navy/55 line-clamp-2">{item.description}</p>
                </div>
                <ExternalLink size={16} className="flex-shrink-0 mt-1 text-scanup-navy/25 group-hover:text-scanup-blue transition-colors" />
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
