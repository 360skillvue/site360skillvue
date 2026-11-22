import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Smartphone, ClipboardList, Briefcase } from 'lucide-react';
import { useLanguage, type Lang } from '../i18n';

/**
 * Essai gratuit de ScanUp en libre accès : bouton et formulaire.
 * Le formulaire est envoyé au scénario Make « ScanUp - Essai en libre accès depuis le site web »,
 * qui vérifie l'adresse, écarte les robots, note le testeur et envoie le lien d'inscription.
 * Envoi au format formulaire classique (pas JSON) pour éviter la requête préalable CORS du navigateur.
 */
export const ESSAI_ANCRE = 'essai-scanup';
const WEBHOOK = 'https://hook.eu1.make.com/4uxjdwtxs3l5bkn9nln0pyty1rw0f8q6';

/** Titre et description de la page /essai-gratuit (mêmes valeurs dans scripts/prerender-meta.mjs). */
export const ESSAI_META: Record<Lang, { title: string; description: string }> = {
  fr: { title: 'Tester ScanUp gratuitement', description: "Testez ScanUp gratuitement en 10 minutes, comme un de vos salariés : questionnaire RPS et vidéo TMS depuis votre téléphone. Sans engagement, données supprimées au bout de 30 jours." },
  en: { title: 'Try ScanUp for free', description: 'Try ScanUp for free in 10 minutes, as one of your employees would: psychosocial risk questionnaire and MSD video from your phone. No commitment, data deleted after 30 days.' },
  de: { title: 'ScanUp kostenlos testen', description: 'Testen Sie ScanUp kostenlos in 10 Minuten, wie Ihre Mitarbeitenden: Fragebogen zu psychosozialen Risiken und MSE-Video mit dem Smartphone. Unverbindlich, Daten nach 30 Tagen gelöscht.' },
  it: { title: 'Prova ScanUp gratis', description: 'Prova ScanUp gratis in 10 minuti, come uno dei tuoi collaboratori: questionario sui rischi psicosociali e video DMS dal telefono. Senza impegno, dati cancellati dopo 30 giorni.' },
  es: { title: 'Probar ScanUp gratis', description: 'Pruebe ScanUp gratis en 10 minutos, como uno de sus empleados: cuestionario de riesgos psicosociales y vídeo TME desde su teléfono. Sin compromiso, datos eliminados a los 30 días.' },
  pt: { title: 'Testar a ScanUp grátis', description: 'Teste a ScanUp grátis em 10 minutos, como um dos seus colaboradores: questionário de riscos psicossociais e vídeo LMERT no telemóvel. Sem compromisso, dados apagados ao fim de 30 dias.' },
};

type Texts = {
  button: string;
  label: string;
  title: string;
  intro: string;
  steps: [string, string, string];
  prenom: string; nom: string; entreprise: string; fonction: string; email: string; telephone: string;
  optional: string;
  accord: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
};

const TEXTS: Record<Lang, Texts> = {
  fr: {
    button: 'Tester ScanUp gratuitement',
    label: 'Essai gratuit',
    title: 'Tester ScanUp gratuitement',
    intro: 'Essayez ScanUp comme un de vos salariés, en TMS comme en RPS : choisissez votre métier, répondez au questionnaire sur vos conditions de travail et votre ressenti, filmez une situation de travail depuis votre téléphone. Gratuit, sans engagement, en 10 minutes.',
    steps: ['Choisissez votre métier', 'Questionnaire RPS : conditions de travail et ressenti', 'Vidéo TMS : filmez une situation de travail'],
    prenom: 'Prénom', nom: 'Nom', entreprise: 'Entreprise', fonction: 'Fonction', email: 'E-mail professionnel', telephone: 'Téléphone',
    optional: 'facultatif',
    accord: "J'accepte que 360SkillVue me contacte au sujet de ScanUp. Mes données d'essai sont supprimées au bout de 30 jours.",
    submit: "Recevoir mon lien d'essai",
    sending: 'Envoi en cours…',
    success: "Merci ! Vérifiez votre boîte mail : nous venons de vous envoyer votre lien pour créer votre compte d'essai. Pensez à regarder dans les indésirables.",
    error: "L'envoi n'a pas abouti, réessayez dans un instant ou écrivez-nous à hello@360skillvue.com.",
  },
  en: {
    button: 'Try ScanUp for free',
    label: 'Free trial',
    title: 'Try ScanUp for free',
    intro: 'Try ScanUp as one of your employees would, for both MSDs and psychosocial risks: choose your job, answer the questionnaire on your working conditions and how you feel, film a work situation with your phone. Free, no commitment, in 10 minutes.',
    steps: ['Choose your job', 'Psychosocial risk questionnaire: working conditions and how you feel', 'MSD video: film a work situation'],
    prenom: 'First name', nom: 'Last name', entreprise: 'Company', fonction: 'Job title', email: 'Work email', telephone: 'Phone',
    optional: 'optional',
    accord: 'I agree that 360SkillVue may contact me about ScanUp. My trial data is deleted after 30 days.',
    submit: 'Get my trial link',
    sending: 'Sending…',
    success: 'Thank you! Check your inbox: we have just sent you the link to create your trial account. Remember to check your spam folder.',
    error: 'Sending failed. Please try again in a moment or write to hello@360skillvue.com.',
  },
  de: {
    button: 'ScanUp kostenlos testen',
    label: 'Kostenloser Test',
    title: 'ScanUp kostenlos testen',
    intro: 'Testen Sie ScanUp wie Ihre Mitarbeitenden, für MSE und psychosoziale Risiken: Beruf wählen, Fragebogen zu Arbeitsbedingungen und Befinden ausfüllen, eine Arbeitssituation mit dem Smartphone filmen. Kostenlos, unverbindlich, in 10 Minuten.',
    steps: ['Beruf wählen', 'Fragebogen psychosoziale Risiken: Arbeitsbedingungen und Befinden', 'MSE-Video: Arbeitssituation filmen'],
    prenom: 'Vorname', nom: 'Nachname', entreprise: 'Unternehmen', fonction: 'Funktion', email: 'Geschäftliche E-Mail', telephone: 'Telefon',
    optional: 'optional',
    accord: 'Ich bin einverstanden, dass 360SkillVue mich zu ScanUp kontaktiert. Meine Testdaten werden nach 30 Tagen gelöscht.',
    submit: 'Testlink erhalten',
    sending: 'Wird gesendet…',
    success: 'Danke! Prüfen Sie Ihr Postfach: Wir haben Ihnen soeben den Link zum Erstellen Ihres Testkontos geschickt. Sehen Sie auch im Spam-Ordner nach.',
    error: 'Das Senden ist fehlgeschlagen. Versuchen Sie es gleich noch einmal oder schreiben Sie an hello@360skillvue.com.',
  },
  it: {
    button: 'Prova ScanUp gratis',
    label: 'Prova gratuita',
    title: 'Prova ScanUp gratis',
    intro: 'Prova ScanUp come uno dei tuoi collaboratori, sia per i DMS sia per i rischi psicosociali: scegli il tuo mestiere, rispondi al questionario sulle condizioni di lavoro e su come ti senti, filma una situazione di lavoro con il telefono. Gratis, senza impegno, in 10 minuti.',
    steps: ['Scegli il tuo mestiere', 'Questionario rischi psicosociali: condizioni di lavoro e benessere', 'Video DMS: filma una situazione di lavoro'],
    prenom: 'Nome', nom: 'Cognome', entreprise: 'Azienda', fonction: 'Funzione', email: 'E-mail professionale', telephone: 'Telefono',
    optional: 'facoltativo',
    accord: 'Accetto che 360SkillVue mi contatti in merito a ScanUp. I miei dati di prova vengono cancellati dopo 30 giorni.',
    submit: 'Ricevi il link di prova',
    sending: 'Invio in corso…',
    success: "Grazie! Controlla la tua casella: ti abbiamo appena inviato il link per creare l'account di prova. Guarda anche nella posta indesiderata.",
    error: "L'invio non è riuscito, riprova tra un momento o scrivici a hello@360skillvue.com.",
  },
  es: {
    button: 'Probar ScanUp gratis',
    label: 'Prueba gratuita',
    title: 'Probar ScanUp gratis',
    intro: 'Pruebe ScanUp como uno de sus empleados, tanto en TME como en riesgos psicosociales: elija su oficio, responda al cuestionario sobre sus condiciones de trabajo y cómo se siente, grabe una situación de trabajo con su teléfono. Gratis, sin compromiso, en 10 minutos.',
    steps: ['Elija su oficio', 'Cuestionario de riesgos psicosociales: condiciones de trabajo y bienestar', 'Vídeo TME: grabe una situación de trabajo'],
    prenom: 'Nombre', nom: 'Apellido', entreprise: 'Empresa', fonction: 'Cargo', email: 'Correo profesional', telephone: 'Teléfono',
    optional: 'opcional',
    accord: 'Acepto que 360SkillVue me contacte sobre ScanUp. Mis datos de prueba se eliminan a los 30 días.',
    submit: 'Recibir mi enlace de prueba',
    sending: 'Enviando…',
    success: '¡Gracias! Revise su correo: le acabamos de enviar el enlace para crear su cuenta de prueba. Mire también en la carpeta de spam.',
    error: 'El envío no se ha realizado. Inténtelo de nuevo en un momento o escríbanos a hello@360skillvue.com.',
  },
  pt: {
    button: 'Testar a ScanUp grátis',
    label: 'Teste gratuito',
    title: 'Testar a ScanUp grátis',
    intro: 'Experimente a ScanUp como um dos seus colaboradores, em LMERT e em riscos psicossociais: escolha a sua profissão, responda ao questionário sobre as suas condições de trabalho e como se sente, filme uma situação de trabalho com o telemóvel. Grátis, sem compromisso, em 10 minutos.',
    steps: ['Escolha a sua profissão', 'Questionário de riscos psicossociais: condições de trabalho e bem-estar', 'Vídeo LMERT: filme uma situação de trabalho'],
    prenom: 'Nome', nom: 'Apelido', entreprise: 'Empresa', fonction: 'Função', email: 'E-mail profissional', telephone: 'Telefone',
    optional: 'facultativo',
    accord: 'Aceito que a 360SkillVue me contacte sobre a ScanUp. Os meus dados de teste são apagados ao fim de 30 dias.',
    submit: 'Receber o meu link de teste',
    sending: 'A enviar…',
    success: 'Obrigado! Verifique a sua caixa de correio: acabámos de lhe enviar o link para criar a sua conta de teste. Veja também na pasta de spam.',
    error: 'O envio falhou. Tente novamente dentro de momentos ou escreva-nos para hello@360skillvue.com.',
  },
};

function useTexts(): Texts {
  const { lang } = useLanguage();
  return TEXTS[lang] ?? TEXTS.fr;
}

function allerAuFormulaire(e: React.MouseEvent) {
  const cible = document.getElementById(ESSAI_ANCRE);
  if (!cible) return;
  e.preventDefault();
  cible.scrollIntoView({ behavior: 'smooth', block: 'start' });
  history.replaceState(null, '', `#${ESSAI_ANCRE}`);
  window.setTimeout(() => (cible.querySelector('input[name="prenom"]') as HTMLInputElement | null)?.focus({ preventScroll: true }), 600);
}

/** Bouton qui fait défiler jusqu'au formulaire d'essai de la page. */
export function EssaiScanupBouton({ variant = 'primary', className = '' }: { variant?: 'primary' | 'light'; className?: string }) {
  const t = useTexts();
  const styles = variant === 'light'
    ? 'bg-scanup-turquoise text-scanup-navy hover:bg-white'
    : 'bg-scanup-blue text-white hover:bg-blue-700 shadow-lg shadow-scanup-blue/25';
  return (
    <a
      href={`#${ESSAI_ANCRE}`}
      onClick={allerAuFormulaire}
      className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[15px] transition-colors group ${styles} ${className}`}
    >
      {t.button}
      <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
    </a>
  );
}

const champ = 'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-scanup-navy placeholder:text-scanup-graytext/70 focus:outline-none focus:border-scanup-blue focus:ring-2 focus:ring-scanup-blue/15 transition';

/** Section avec le formulaire d'essai gratuit. */
export function EssaiScanupSection({ page = false }: { page?: boolean }) {
  const t = useTexts();
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'ok' | 'erreur'>('saisie');
  const icones = [Briefcase, ClipboardList, Smartphone];

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.reportValidity()) return;
    const donnees = new URLSearchParams();
    new FormData(f).forEach((v, k) => { if (typeof v === 'string') donnees.append(k, v.trim()); });
    donnees.delete('accord');
    if (!donnees.get('site_web')) donnees.delete('site_web');
    setEtat('envoi');
    try {
      const r = await fetch(WEBHOOK, { method: 'POST', body: donnees });
      if (!r.ok) throw new Error(String(r.status));
      setEtat('ok');
    } catch {
      setEtat('erreur');
    }
  }

  return (
    <section id={ESSAI_ANCRE} className={`scroll-mt-24 px-6 bg-[#F8F9FC] ${page ? 'pt-14 pb-24 md:pt-20' : 'py-24'}`}>
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_1.15fr] gap-10 md:gap-14 items-start">
        <div className="relative rounded-3xl bg-scanup-navy text-white p-8 md:p-10 overflow-hidden">
          <div aria-hidden="true" className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-scanup-blue/50 blur-3xl" />
          <div aria-hidden="true" className="absolute -left-16 -bottom-24 w-56 h-56 rounded-full bg-scanup-turquoise/20 blur-3xl" />
          <div className="relative">
            <p className="text-[12px] uppercase tracking-widest font-semibold text-scanup-turquoise mb-4">{t.label}</p>
            {page
              ? <h1 className="text-[32px] md:text-[42px] font-bold tracking-[-0.02em] leading-[1.12] mb-5 text-white">{t.title}</h1>
              : <h2 className="text-[30px] md:text-[38px] font-bold tracking-[-0.02em] leading-[1.15] mb-5 text-white">{t.title}</h2>}
            <p className="text-[15px] text-white/75 leading-relaxed mb-8">{t.intro}</p>
            <ol className="space-y-3">
              {t.steps.map((s, i) => {
                const Icon = icones[i];
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-white/10 text-scanup-turquoise flex items-center justify-center flex-shrink-0">
                      <Icon size={17} strokeWidth={1.8} />
                    </span>
                    <span className="text-[15px] text-white/90">{s}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="rounded-3xl border border-black/[0.06] bg-white p-7 md:p-9 shadow-[0_14px_34px_-20px_rgba(28,36,75,0.25)]">
          {etat === 'ok' ? (
            <div role="status" className="flex flex-col items-center text-center py-10 gap-4">
              <CheckCircle2 size={44} className="text-scanup-success" strokeWidth={1.6} />
              <p className="text-[16px] leading-relaxed text-scanup-navy max-w-md">{t.success}</p>
            </div>
          ) : (
            <form onSubmit={envoyer} noValidate className="relative grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.prenom} *</span>
                <input name="prenom" required autoComplete="given-name" className={champ} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.nom} *</span>
                <input name="nom" required autoComplete="family-name" className={champ} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.entreprise} *</span>
                <input name="entreprise" required autoComplete="organization" className={champ} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.fonction} <span className="font-normal text-scanup-graytext">({t.optional})</span></span>
                <input name="fonction" autoComplete="organization-title" className={champ} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.email} *</span>
                <input name="email" type="email" required autoComplete="email" className={champ} />
              </label>
              <label className="block">
                <span className="block text-[13px] font-medium mb-1.5">{t.telephone} <span className="font-normal text-scanup-graytext">({t.optional})</span></span>
                <input name="telephone" type="tel" autoComplete="tel" className={champ} />
              </label>

              {/* Champ piège anti-robot : invisible, doit rester vide. */}
              <input name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />

              <label className="sm:col-span-2 flex items-start gap-3 text-[13px] text-scanup-graytext leading-relaxed cursor-pointer">
                <input type="checkbox" name="accord" required className="mt-0.5 w-4 h-4 accent-scanup-blue flex-shrink-0" />
                <span>{t.accord}</span>
              </label>

              <div className="sm:col-span-2 flex flex-col gap-3">
                <button type="submit" disabled={etat === 'envoi'}
                  className="inline-flex items-center justify-center gap-2 bg-scanup-blue text-white px-7 py-3.5 rounded-full font-semibold text-[15px] hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {etat === 'envoi' ? t.sending : t.submit}
                  {etat !== 'envoi' && <ArrowRight size={17} />}
                </button>
                <p role="status" className="text-[13px] text-scanup-error min-h-[1em]">{etat === 'erreur' ? t.error : ''}</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
