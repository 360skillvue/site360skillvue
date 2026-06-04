import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, Mail, Clock, CheckCircle2, ArrowRight, CalendarDays,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../i18n';
import PageMeta from '../components/PageMeta';

// ➜ Créer la clé sur https://web3forms.com/create avec tech@360skillvue.com
const WEB3FORMS_KEY = '19385c98-ba2c-4ac6-a6d8-0090c5416c33';

type FormState = { nom: string; email: string; sujet: string; message: string };
const INITIAL_FORM: FormState = { nom: '', email: '', sujet: '', message: '' };

// ─── FAQ Item ──────────────────────────────────────────────────────────────────

function FaqItem({ item, index, openIndex, setOpenIndex }: {
  item: { q: string; a: string };
  index: number;
  openIndex: number | null;
  setOpenIndex: (i: number | null) => void;
}) {
  const isOpen = openIndex === index;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.045, ease: [0.16, 1, 0.3, 1] }}
      className={`border-b border-black/[0.07] last:border-0 transition-colors ${isOpen ? '' : 'hover:bg-black/[0.01]'}`}
    >
      <button
        onClick={() => setOpenIndex(isOpen ? null : index)}
        className="w-full flex items-start justify-between gap-6 py-5 text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-start gap-4 min-w-0">
          <span className="text-[11px] font-bold text-scanup-blue/50 tabular-nums mt-0.5 flex-shrink-0 w-5">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className={`text-[14px] font-semibold leading-snug transition-colors ${
            isOpen ? 'text-scanup-blue' : 'text-scanup-navy group-hover:text-scanup-blue'
          }`}>
            {item.q}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`flex-shrink-0 mt-0.5 transition-colors ${isOpen ? 'text-scanup-blue' : 'text-scanup-graytext/40'}`}
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className="text-[13px] text-scanup-graytext leading-relaxed pl-9 pb-5">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AidePage() {
  const { t } = useLanguage();
  const FAQ_ITEMS = t.aide.faq;
  const SUJET_OPTIONS = t.aide.sujetOptions;

  const [openIndex, setOpenIndex]   = useState<number | null>(null);
  const [form, setForm]             = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted]   = useState(false);
  const [sending, setSending]       = useState(false);
  const [sendError, setSendError]   = useState<string | null>(null);

  useEffect(() => {
    if (document.querySelector('script[src*="calendly"]')) return;
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: form.nom,
          email: form.email,
          subject: `[ScanUp] ${form.sujet} — ${form.nom}`,
          message: form.message,
          from_name: 'ScanUp Contact',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setForm(INITIAL_FORM);
      } else {
        setSendError('Une erreur est survenue. Veuillez réessayer ou nous écrire directement.');
      }
    } catch {
      setSendError('Impossible d\'envoyer le message. Vérifiez votre connexion.');
    } finally {
      setSending(false);
    }
  }

  const inputClass = 'w-full border border-black/[0.08] rounded-xl px-4 py-3 text-[13px] bg-[#f8f9fb] focus:outline-none focus:border-scanup-blue/40 focus:bg-white transition-all placeholder:text-scanup-graytext/40';
  const labelClass = 'block text-[11px] font-semibold text-scanup-navy/70 uppercase tracking-wider mb-2';

  return (
    <div className="min-h-screen bg-white font-sans text-scanup-navy">
      <PageMeta
        title="Aide & Support"
        description="Toutes vos questions sur ScanUp. FAQ, contact et prise de rendez-vous avec l'équipe 360SkillVue."
        path="/aide-support"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map((item: { q: string; a: string }) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        }}
      />
      <Navbar />

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10"
        >
          <div>
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-2">{t.aide.faqBadge}</p>
            <h1 className="text-[28px] font-bold tracking-tight">{t.aide.faqTitle}</h1>
            <p className="text-[14px] text-scanup-graytext mt-1.5">{t.aide.faqSubtitle}</p>
          </div>
          <a href="#contact"
            className="flex-shrink-0 flex items-center gap-2 text-[13px] font-medium text-scanup-blue hover:text-blue-700 transition-colors group">
            {t.aide.faqNoAnswer}
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
        </motion.div>

        <div className="bg-white border border-black/[0.07] rounded-3xl shadow-sm shadow-black/[0.04] px-6 md:px-8 divide-y divide-black/[0.05]">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              index={i}
              openIndex={openIndex}
              setOpenIndex={setOpenIndex}
            />
          ))}
        </div>
      </section>

      {/* ── Contact + Calendly ───────────────────────────────────────── */}
      <section id="contact" className="bg-[#f8f9fb] border-t border-black/[0.05] py-16">
        <div className="max-w-6xl mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <p className="text-[11px] font-semibold text-scanup-blue uppercase tracking-widest mb-2">{t.aide.contactBadge}</p>
            <h2 className="text-[28px] font-bold tracking-tight">{t.aide.contactTitle}</h2>
            <p className="text-[14px] text-scanup-graytext mt-1.5">{t.aide.contactSubtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-black/[0.07] rounded-3xl shadow-sm shadow-black/[0.04] overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col"
                  >
                    {/* Form header */}
                    <div className="px-7 pt-7 pb-5 border-b border-black/[0.05]">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-scanup-blue/[0.08] flex items-center justify-center">
                          <Mail size={14} className="text-scanup-blue" />
                        </div>
                        <p className="text-[15px] font-bold text-scanup-navy">{t.aide.formTitle}</p>
                      </div>
                      <p className="text-[12px] text-scanup-graytext ml-11">{t.aide.formResponseTime}</p>
                    </div>

                    {/* Fields */}
                    <div className="px-7 py-6 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="nom" className={labelClass}>{t.aide.labelNom}</label>
                          <input id="nom" name="nom" type="text" required
                            placeholder={t.aide.placeholderNom} value={form.nom}
                            onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                          <label htmlFor="email" className={labelClass}>{t.aide.labelEmail}</label>
                          <input id="email" name="email" type="email" required
                            placeholder={t.aide.placeholderEmail} value={form.email}
                            onChange={handleChange} className={inputClass} />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="sujet" className={labelClass}>{t.aide.labelSujet}</label>
                        <select id="sujet" name="sujet" required value={form.sujet}
                          onChange={handleChange} className={`${inputClass} cursor-pointer`}>
                          <option value="" disabled>{t.aide.placeholderSujet}</option>
                          {SUJET_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className={labelClass}>{t.aide.labelMessage}</label>
                        <textarea id="message" name="message" required rows={5}
                          placeholder={t.aide.placeholderMessage} value={form.message}
                          onChange={handleChange} className={`${inputClass} resize-none`} />
                      </div>
                    </div>

                    {/* Error */}
                    {sendError && (
                      <p className="mx-7 mb-2 text-[12px] text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{sendError}</p>
                    )}

                    {/* Footer */}
                    <div className="px-7 pb-7 flex items-center justify-between gap-4">
                      <p className="text-[11px] text-scanup-graytext/50 leading-snug">
                        {t.aide.privacyText}{' '}
                        <a href="#" className="underline hover:text-scanup-blue transition-colors">{t.aide.privacyLink}</a>.
                      </p>
                      <motion.button type="submit" disabled={sending}
                        whileHover={{ scale: sending ? 1 : 1.03 }} whileTap={{ scale: sending ? 1 : 0.97 }}
                        className="flex-shrink-0 bg-scanup-blue text-white rounded-full px-6 py-2.5 text-[13px] font-semibold hover:bg-blue-700 transition-colors shadow-md shadow-scanup-blue/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sending
                          ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</>
                          : <><Mail size={13} /> {t.aide.sendButton}</>
                        }
                      </motion.button>
                    </div>

                    {/* Contact info strip */}
                    <div className="border-t border-black/[0.05] bg-[#f8f9fb] px-7 py-4 flex flex-wrap gap-5">
                      {[
                        { icon: Mail,  value: t.aide.contactEmail, href: 'mailto:hello@360skillvue.com' },
                        { icon: Clock, value: t.aide.contactHours, href: undefined },
                      ].map(({ icon: Icon, value, href }) => (
                        href ? (
                          <a key={value} href={href} className="flex items-center gap-1.5 text-[11px] text-scanup-graytext hover:text-scanup-blue transition-colors">
                            <Icon size={11} className="text-scanup-blue/60" />{value}
                          </a>
                        ) : (
                          <span key={value} className="flex items-center gap-1.5 text-[11px] text-scanup-graytext/60">
                            <Icon size={11} />{value}
                          </span>
                        )
                      ))}
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="p-12 flex flex-col items-center text-center gap-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 size={30} className="text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-scanup-navy">{t.aide.successTitle}</p>
                      <p className="text-[13px] text-scanup-graytext mt-2 leading-relaxed">
                        {t.aide.successMessage} <span className="font-semibold text-scanup-navy">{form.nom.split(' ')[0]}</span>{t.aide.successResponseTime}{' '}
                        <span className="font-semibold text-scanup-navy">{form.email}</span> {t.aide.successResponseDelay}
                      </p>
                    </div>
                    <button onClick={() => { setForm(INITIAL_FORM); setSubmitted(false); }}
                      className="text-[12px] text-scanup-blue hover:underline font-medium">
                      {t.aide.sendAnother}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Calendly */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-black/[0.07] rounded-3xl shadow-sm shadow-black/[0.04] overflow-hidden"
            >
              <div className="px-7 pt-7 pb-5 border-b border-black/[0.05]">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-[#7c3aed]/[0.08] flex items-center justify-center">
                    <CalendarDays size={14} className="text-[#7c3aed]" />
                  </div>
                  <p className="text-[15px] font-bold text-scanup-navy">{t.aide.calendlyTitle}</p>
                </div>
                <p className="text-[12px] text-scanup-graytext ml-11">{t.aide.calendlySubtitle}</p>
              </div>
              <div
                className="calendly-inline-widget"
                data-url="https://calendly.com/d/cwdj-qsf-79c/presentation-de-360skillvue"
                style={{ minWidth: '100%', height: 580 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
