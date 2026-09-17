import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from '../i18n/Link';
import { useLanguage, type Lang } from '../i18n';

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
    cta: 'Parler à notre équipe',
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
    cta: 'Talk to our team',
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
    cta: 'Mit unserem Team sprechen',
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
    cta: 'Parla con il nostro team',
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
    cta: 'Hablar con nuestro equipo',
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
    cta: 'Falar com a nossa equipa',
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
      className={`h-full flex flex-col gap-4 rounded-[20px] p-7 md:p-9 text-white ${
        isBlue ? 'bg-scanup-blue' : 'bg-scanup-navy'
      }`}
    >
      <span
        className={`self-start rounded-full px-4 py-1.5 text-[13px] font-semibold ${
          isBlue ? 'bg-white text-scanup-blue' : 'bg-scanup-turquoise text-scanup-navy'
        }`}
      >
        {tag}
      </span>
      {children}
    </div>
  );
};

export default function AvantagesPresentiel() {
  const { lang } = useLanguage();
  const t = TEXTS[lang] ?? TEXTS.fr;

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">
            {t.label}
          </p>
          <h2 className="text-[30px] md:text-[42px] font-bold tracking-tight mb-5 leading-tight">
            {t.title}
            <span className="text-scanup-blue">{t.titleHighlight}</span>
          </h2>
          <p className="text-[16px] text-scanup-graytext max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-5 md:gap-6">
          <FadeIn delay={0}>
            <Card tone="blue" tag={t.simpleTag}>
              <p className="text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-tight">{t.simpleFigure}</p>
              <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90">{t.simpleText}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={0.08}>
            <Card tone="navy" tag={t.cheapTag}>
              <p className="text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-tight text-scanup-turquoise">{t.cheapFigure}</p>
              <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90">{t.cheapText}</p>
            </Card>
          </FadeIn>

          <FadeIn delay={0.16}>
            <Card tone="navy" tag={t.qualityTag}>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <p className="text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-tight text-scanup-turquoise">100 %</p>
                  <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90">
                    <span className="font-semibold text-white">{t.tmsLabel}</span> {t.tmsText}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-tight text-scanup-turquoise">≈ 10 %</p>
                  <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90">
                    <span className="font-semibold text-white">{t.rpsLabel}</span> {t.rpsText}
                  </p>
                </div>
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.24}>
            <Card tone="blue" tag={t.inclusiveTag}>
              <p className="text-[34px] md:text-[42px] font-bold leading-[1.1] tracking-tight">{t.inclusiveFigure}</p>
              <p className="text-[15px] md:text-[16px] leading-relaxed text-white/90">{t.inclusiveText}</p>
            </Card>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} className="text-center mt-12">
          <Link
            to="/aide-support"
            className="inline-flex items-center gap-2 bg-scanup-blue text-white px-7 py-3.5 rounded-[10px] font-semibold text-[15px] hover:brightness-110 transition-all"
          >
            {t.cta}
            <ArrowRight size={18} />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
