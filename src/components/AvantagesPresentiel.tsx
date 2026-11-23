import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Video, Layers, Users } from 'lucide-react';
import { Link } from '../i18n/Link';
import { useLanguage, type Lang } from '../i18n';
import { EssaiScanupBouton } from './EssaiScanup';

/**
 * Section « ScanUp face aux méthodes en présentiel » de la page d'accueil.
 * Textes regroupés ici pour les six langues, afin de ne pas toucher aux fichiers i18n.
 */

type Texts = {
  label: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  simpleTag: string; simpleFigure: string; simpleText: string;
  cheapTag: string; cheapFigure: string; cheapText: string;
  qualityTag: string; tmsLabel: string; tmsText: string; rpsLabel: string; rpsText: string;
  inclusiveTag: string; inclusiveFigure: string; inclusiveText: string;
  valueTag: string; valueTitle: string;
  value1Title: string; value1Text: string; value2Title: string; value2Text: string; value3Title: string; value3Text: string;
  cta: string;
};

const TEXTS: Record<Lang, Texts> = {
  fr: {
    label: 'Pourquoi le digital',
    title: 'Prévention TMS et RPS : ',
    titleHighlight: 'pourquoi choisir ScanUp',
    subtitle: 'Une démarche digitale plus simple, plus économique, plus fine et plus inclusive que le présentiel.',
    simpleTag: 'Plus simple', simpleFigure: 'Quelques minutes',
    simpleText: "par collaborateur, en asynchrone et à son rythme, sans bloquer l'activité ni organiser de réunions.",
    cheapTag: 'Moins cher', cheapFigure: '2 fois moins cher',
    cheapText: "qu'une étude de situation de travail en présentiel : ni déplacement d'intervenant, ni journée d'observation sur site.",
    qualityTag: 'Plus qualitatif',
    tmsLabel: 'TMS :', tmsText: 'tous les collaborateurs observés, sans échantillonnage.',
    rpsLabel: 'RPS :', rpsText: 'les personnes à risque repérées, seules reçues en entretien individuel.',
    inclusiveTag: 'Plus inclusif', inclusiveFigure: 'Chacun participe',
    inclusiveText: "y compris les collaborateurs isolés, en horaires décalés ou sur des sites éloignés, où qu'ils soient.",
    valueTag: 'La valeur ajoutée de ScanUp', valueTitle: 'Une seule plateforme, des données utiles à chacun',
    value1Title: 'RPS et TMS au même endroit', value1Text: "Un seul parcours pour le salarié, un seul outil pour l'expert et pour l'entreprise.",
    value2Title: 'Audio et vidéo', value2Text: "L'expert entend le salarié et voit son poste réel, là où un questionnaire seul s'arrête aux cases cochées.",
    value3Title: 'Salarié, direction, médecine du travail', value3Text: 'Un retour individuel au salarié, une vue collective pour la direction, un rapport nominatif pour la médecine du travail.',
    cta: 'Demander à tester',
  },
  en: {
    label: 'Why digital',
    title: 'MSD and psychosocial risk prevention: ',
    titleHighlight: 'why choose ScanUp',
    subtitle: 'A digital approach that is simpler, more affordable, more precise and more inclusive than on-site methods.',
    simpleTag: 'Simpler', simpleFigure: 'A few minutes',
    simpleText: 'per employee, asynchronously and at their own pace, without disrupting work or organising meetings.',
    cheapTag: 'More affordable', cheapFigure: 'Half the cost',
    cheapText: 'of an on-site workplace assessment: no consultant travel, no day of on-site observation.',
    qualityTag: 'Higher quality',
    tmsLabel: 'MSDs:', tmsText: 'every employee is observed, with no sampling.',
    rpsLabel: 'Psychosocial risks:', rpsText: 'people at risk are identified, and only they are seen in individual interviews.',
    inclusiveTag: 'More inclusive', inclusiveFigure: 'Everyone takes part',
    inclusiveText: 'including isolated employees, shift workers and remote sites, wherever they are.',
    valueTag: "ScanUp's added value", valueTitle: 'One platform, data that is useful to everyone',
    value1Title: 'Psychosocial risks and MSDs in one place', value1Text: 'One journey for the employee, one tool for the expert and the company.',
    value2Title: 'Audio and video', value2Text: 'The expert hears the employee and sees their real workstation, where a questionnaire alone stops at ticked boxes.',
    value3Title: 'Employee, management, occupational health', value3Text: 'Individual feedback for the employee, a collective view for management, a named report for occupational health.',
    cta: 'Request a trial',
  },
  de: {
    label: 'Warum digital',
    title: 'Prävention von MSE und psychosozialen Risiken: ',
    titleHighlight: 'warum ScanUp',
    subtitle: 'Ein digitaler Ansatz, einfacher, günstiger, präziser und inklusiver als Präsenzmethoden.',
    simpleTag: 'Einfacher', simpleFigure: 'Wenige Minuten',
    simpleText: 'pro Mitarbeitenden, asynchron und im eigenen Tempo, ohne den Betrieb zu stören oder Sitzungen zu planen.',
    cheapTag: 'Günstiger', cheapFigure: 'Halb so teuer',
    cheapText: 'wie eine Arbeitsplatzanalyse vor Ort: keine Anreise von Fachpersonen, kein Beobachtungstag im Betrieb.',
    qualityTag: 'Qualitativ besser',
    tmsLabel: 'MSE:', tmsText: 'alle Mitarbeitenden werden beobachtet, ohne Stichprobe.',
    rpsLabel: 'Psychosoziale Risiken:', rpsText: 'gefährdete Personen werden erkannt und nur sie zum Einzelgespräch eingeladen.',
    inclusiveTag: 'Inklusiver', inclusiveFigure: 'Alle machen mit',
    inclusiveText: 'auch Mitarbeitende an abgelegenen Standorten, im Schichtbetrieb oder allein arbeitend.',
    valueTag: 'Der Mehrwert von ScanUp', valueTitle: 'Eine Plattform, Daten mit Nutzen für alle',
    value1Title: 'Psychosoziale Risiken und MSE an einem Ort', value1Text: 'Ein Ablauf für die Mitarbeitenden, ein Werkzeug für Fachperson und Unternehmen.',
    value2Title: 'Audio und Video', value2Text: 'Die Fachperson hört die Mitarbeitenden und sieht ihren echten Arbeitsplatz, wo ein Fragebogen allein bei angekreuzten Kästchen stehen bleibt.',
    value3Title: 'Mitarbeitende, Geschäftsleitung, Arbeitsmedizin', value3Text: 'Eine individuelle Rückmeldung für die Mitarbeitenden, eine kollektive Sicht für die Geschäftsleitung, ein namentlicher Bericht für die Arbeitsmedizin.',
    cta: 'Test anfragen',
  },
  it: {
    label: 'Perché il digitale',
    title: 'Prevenzione dei DMS e dei rischi psicosociali: ',
    titleHighlight: 'perché scegliere ScanUp',
    subtitle: 'Un approccio digitale più semplice, più economico, più preciso e più inclusivo rispetto ai metodi in presenza.',
    simpleTag: 'Più semplice', simpleFigure: 'Pochi minuti',
    simpleText: "per collaboratore, in modo asincrono e con i propri tempi, senza fermare l'attività né organizzare riunioni.",
    cheapTag: 'Più economico', cheapFigure: 'La metà del costo',
    cheapText: "di un'analisi della situazione di lavoro in presenza: nessuna trasferta di consulenti, nessuna giornata di osservazione in sede.",
    qualityTag: 'Più qualitativo',
    tmsLabel: 'DMS:', tmsText: 'tutti i collaboratori osservati, senza campionamento.',
    rpsLabel: 'Rischi psicosociali:', rpsText: 'le persone a rischio vengono individuate e solo loro ricevute in colloquio individuale.',
    inclusiveTag: 'Più inclusivo', inclusiveFigure: 'Tutti partecipano',
    inclusiveText: 'anche i collaboratori isolati, a turni o in sedi lontane, ovunque si trovino.',
    valueTag: 'Il valore aggiunto di ScanUp', valueTitle: "Un'unica piattaforma, dati utili a ciascuno",
    value1Title: 'Rischi psicosociali e DMS in un solo posto', value1Text: "Un solo percorso per il collaboratore, un solo strumento per l'esperto e per l'azienda.",
    value2Title: 'Audio e video', value2Text: "L'esperto ascolta il collaboratore e vede la sua postazione reale, dove un questionario da solo si ferma alle caselle spuntate.",
    value3Title: 'Collaboratore, direzione, medicina del lavoro', value3Text: 'Un riscontro individuale al collaboratore, una visione collettiva per la direzione, una relazione nominativa per la medicina del lavoro.',
    cta: 'Richiedi una prova',
  },
  es: {
    label: 'Por qué lo digital',
    title: 'Prevención de TME y riesgos psicosociales: ',
    titleHighlight: 'por qué elegir ScanUp',
    subtitle: 'Un enfoque digital más sencillo, más económico, más preciso y más inclusivo que los métodos presenciales.',
    simpleTag: 'Más sencillo', simpleFigure: 'Unos minutos',
    simpleText: 'por empleado, de forma asíncrona y a su ritmo, sin detener la actividad ni organizar reuniones.',
    cheapTag: 'Más económico', cheapFigure: 'La mitad de coste',
    cheapText: 'que un estudio presencial de la situación de trabajo: sin desplazamiento de consultores ni jornada de observación in situ.',
    qualityTag: 'Más calidad',
    tmsLabel: 'TME:', tmsText: 'se observa a todos los empleados, sin muestreo.',
    rpsLabel: 'Riesgos psicosociales:', rpsText: 'se detecta a las personas en riesgo y solo ellas pasan a entrevista individual.',
    inclusiveTag: 'Más inclusivo', inclusiveFigure: 'Todos participan',
    inclusiveText: 'incluidos los empleados aislados, a turnos o en centros alejados, estén donde estén.',
    valueTag: 'El valor añadido de ScanUp', valueTitle: 'Una sola plataforma, datos útiles para cada uno',
    value1Title: 'Riesgos psicosociales y TME en un mismo lugar', value1Text: 'Un solo recorrido para el empleado, una sola herramienta para el experto y la empresa.',
    value2Title: 'Audio y vídeo', value2Text: 'El experto escucha al empleado y ve su puesto real, donde un cuestionario por sí solo se queda en las casillas marcadas.',
    value3Title: 'Empleado, dirección, medicina del trabajo', value3Text: 'Un informe individual para el empleado, una visión colectiva para la dirección, un informe nominativo para la medicina del trabajo.',
    cta: 'Solicitar una prueba',
  },
  pt: {
    label: 'Porquê o digital',
    title: 'Prevenção de LMERT e riscos psicossociais: ',
    titleHighlight: 'porquê escolher a ScanUp',
    subtitle: 'Uma abordagem digital mais simples, mais económica, mais precisa e mais inclusiva do que os métodos presenciais.',
    simpleTag: 'Mais simples', simpleFigure: 'Poucos minutos',
    simpleText: 'por colaborador, de forma assíncrona e ao seu ritmo, sem parar a atividade nem organizar reuniões.',
    cheapTag: 'Mais económico', cheapFigure: 'Metade do custo',
    cheapText: 'de um estudo presencial da situação de trabalho: sem deslocação de consultores nem dia de observação no local.',
    qualityTag: 'Mais qualidade',
    tmsLabel: 'LMERT:', tmsText: 'todos os colaboradores observados, sem amostragem.',
    rpsLabel: 'Riscos psicossociais:', rpsText: 'as pessoas em risco são identificadas e só elas passam a entrevista individual.',
    inclusiveTag: 'Mais inclusivo', inclusiveFigure: 'Todos participam',
    inclusiveText: 'incluindo colaboradores isolados, por turnos ou em locais afastados, onde quer que estejam.',
    valueTag: 'O valor acrescentado da ScanUp', valueTitle: 'Uma só plataforma, dados úteis para cada um',
    value1Title: 'Riscos psicossociais e LMERT no mesmo sítio', value1Text: 'Um só percurso para o colaborador, uma só ferramenta para o especialista e para a empresa.',
    value2Title: 'Áudio e vídeo', value2Text: 'O especialista ouve o colaborador e vê o seu posto real, onde um questionário sozinho fica pelas caixas assinaladas.',
    value3Title: 'Colaborador, direção, medicina do trabalho', value3Text: 'Um retorno individual ao colaborador, uma visão coletiva para a direção, um relatório nominativo para a medicina do trabalho.',
    cta: 'Pedir um teste',
  },
};

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.65, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

type CardProps = {
  tone: 'blue' | 'navy';
  tag: string;
  children: React.ReactNode;
};

const Card: React.FC<CardProps> = ({ tone, tag, children }) => {
  const isBlue = tone === 'blue';
  return (
    <div
      className={`h-full flex flex-col gap-2.5 md:gap-3 rounded-2xl p-4 md:p-6 text-white ${
        isBlue ? 'bg-scanup-blue' : 'bg-scanup-navy'
      }`}
    >
      <span
        className={`self-start rounded-full px-3 py-1 text-[11px] md:text-[12px] font-semibold ${
          isBlue ? 'bg-white text-scanup-blue' : 'bg-scanup-turquoise text-scanup-navy'
        }`}
      >
        {tag}
      </span>
      {children}
    </div>
  );
};

export default function AvantagesPresentiel({ hero = false }: { hero?: boolean }) {
  const { lang } = useLanguage();
  const t = TEXTS[lang] ?? TEXTS.fr;

  return (
    <section className={`px-6 bg-white ${hero ? 'pt-12 pb-20 md:pt-16' : 'py-24'}`}>
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">
            {t.label}
          </p>
          {hero ? (
            <h1 className="text-[30px] sm:text-[40px] md:text-[52px] font-bold tracking-tight mb-5 leading-[1.15]">
              {t.title}
              <span className="md:block text-scanup-blue">{t.titleHighlight}</span>
            </h1>
          ) : (
            <h2 className="text-[30px] md:text-[42px] font-bold tracking-tight mb-5 leading-tight">
              {t.title}
              <span className="text-scanup-blue">{t.titleHighlight}</span>
            </h2>
          )}
          <p className="text-[16px] text-scanup-graytext max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
          {hero && <EssaiScanupBouton className="mt-8" />}
        </FadeIn>

        {/* Valeur ajoutée : trois piliers compacts */}
        <FadeIn delay={0}>
          <div className="relative overflow-hidden rounded-2xl p-5 md:p-8 text-white bg-gradient-to-br from-scanup-blue to-scanup-navy">
            <div aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-scanup-turquoise/25 blur-3xl" />
            <div className="relative">
              <span className="inline-block rounded-full px-3 py-1 text-[12px] font-semibold bg-scanup-turquoise text-scanup-navy">{t.valueTag}</span>
              <p className="mt-3 text-[22px] md:text-[32px] font-bold leading-[1.2] tracking-tight text-balance">{t.valueTitle}</p>
              <div className="mt-5 grid md:grid-cols-3 gap-3 md:gap-4">
                {[
                  { Icon: Layers, title: t.value1Title, text: t.value1Text },
                  { Icon: Video, title: t.value2Title, text: t.value2Text },
                  { Icon: Users, title: t.value3Title, text: t.value3Text },
                ].map(({ Icon, title, text }) => (
                  <div key={title} className="flex md:flex-col items-start gap-3 rounded-xl bg-white/10 p-3.5 md:p-5">
                    <span className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-scanup-turquoise/15 text-scanup-turquoise flex items-center justify-center flex-shrink-0"><Icon size={18} strokeWidth={1.8} /></span>
                    <div>
                      <p className="text-[15px] md:text-[17px] font-semibold leading-snug text-white">{title}</p>
                      <p className="mt-1 text-[13px] md:text-[14px] leading-snug text-white/80">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Quatre avantages face au présentiel, en tuiles */}
        <div className="mt-3 md:mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <FadeIn delay={0.05}>
            <Card tone="blue" tag={t.simpleTag}>
              <p className="text-[20px] md:text-[26px] font-bold leading-[1.15] tracking-tight">{t.simpleFigure}</p>
              <p className="text-[13px] md:text-[14px] leading-snug text-white/85">{t.simpleText}</p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.1}>
            <Card tone="navy" tag={t.cheapTag}>
              <p className="text-[20px] md:text-[26px] font-bold leading-[1.15] tracking-tight text-scanup-turquoise">{t.cheapFigure}</p>
              <p className="text-[13px] md:text-[14px] leading-snug text-white/85">{t.cheapText}</p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.15}>
            <Card tone="navy" tag={t.qualityTag}>
              <p className="text-[13px] md:text-[14px] leading-snug text-white/85"><span className="text-[20px] md:text-[26px] font-bold leading-[1.15] tracking-tight text-scanup-turquoise block">100 %</span><span className="font-semibold text-white">{t.tmsLabel}</span> {t.tmsText}</p>
              <p className="text-[13px] md:text-[14px] leading-snug text-white/85"><span className="text-[20px] md:text-[26px] font-bold leading-[1.15] tracking-tight text-scanup-turquoise block">≈ 20 %</span><span className="font-semibold text-white">{t.rpsLabel}</span> {t.rpsText}</p>
            </Card>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Card tone="blue" tag={t.inclusiveTag}>
              <p className="text-[20px] md:text-[26px] font-bold leading-[1.15] tracking-tight">{t.inclusiveFigure}</p>
              <p className="text-[13px] md:text-[14px] leading-snug text-white/85">{t.inclusiveText}</p>
            </Card>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/aide-support?sujet=test#contact"
            className={hero
              ? 'inline-flex items-center gap-2 text-scanup-navy px-7 py-3.5 rounded-full font-semibold text-[15px] border border-black/10 hover:border-scanup-blue hover:text-scanup-blue transition-all'
              : 'inline-flex items-center gap-2 bg-scanup-blue text-white px-7 py-3.5 rounded-[10px] font-semibold text-[15px] hover:brightness-110 transition-all'}
          >
            {t.cta}
            <ArrowRight size={18} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
