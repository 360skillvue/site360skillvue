import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, ArrowRight, Check, ScanLine, ShieldCheck, Users, Settings2 } from 'lucide-react';
import { useLocalizedNavigate as useNavigate } from '../i18n/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageMeta from '../components/PageMeta';
import { useLanguage, type Lang } from '../i18n';

/**
 * Page « Cabinets de santé au travail ».
 * Cible : cabinets de conseil en ergonomie et en RPS, psychologues et ergonomes
 * du travail, structures MSST. ScanUp y est présenté comme un outil métier
 * utilisé en autonomie, en complément de leurs interventions en présentiel.
 * Les textes des six langues sont regroupés ici, pour ne pas toucher aux
 * fichiers de traduction communs.
 */

type Texts = {
  metaTitle: string;
  metaDescription: string;
  heroBadge: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroCta: string;
  heroNote: string;
  usagesLabel: string;
  usagesTitle: string;
  usages: { title: string; text: string }[];
  etapesLabel: string;
  etapesTitle: string;
  etapes: { title: string; text: string }[];
  securiteLabel: string;
  securiteTitle: string;
  securiteText: string;
  securite: string[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

const TEXTS: Record<Lang, Texts> = {
  fr: {
    metaTitle: 'Cabinets de santé au travail',
    metaDescription:
      "ScanUp, outil métier des cabinets de conseil en ergonomie et en RPS : vos ergonomes et psychologues créent leurs modules, mènent les évaluations à distance et recueillent les données terrain sur un hébergement certifié HDS.",
    heroBadge: 'Cabinets, ergonomes et psychologues du travail',
    heroTitle: 'Votre outil métier pour le terrain, ',
    heroTitleHighlight: 'en toute autonomie',
    heroSubtitle:
      "ScanUp est la plateforme que vos ergonomes et vos psychologues du travail utilisent comme ils l'entendent : ils créent leurs propres modules pour chaque client, mènent les évaluations à distance et gardent la main sur l'analyse. Le présentiel reste le vôtre, là où il crée le plus de valeur.",
    heroCta: 'Demander une démonstration',
    heroNote: "Essai gratuit de 14 jours, sans engagement.",
    usagesLabel: 'Trois usages',
    usagesTitle: 'Ce que vos experts en font',
    usages: [
      {
        title: 'Cibler vos interventions en présentiel',
        text: "Le dépistage à distance couvre l'ensemble des salariés et fait ressortir les situations à traiter. Vous vous déplacez là où le besoin est établi, avec un diagnostic déjà posé.",
      },
      {
        title: 'Recueillir les données terrain en sécurité',
        text: "Vidéos de situations de travail, questionnaires, verbatims : tout est collecté dans un cadre unique, hébergé chez un hébergeur certifié HDS, plutôt que sur des téléphones et des boîtes mail.",
      },
      {
        title: 'Élargir votre offre sans recruter',
        text: "Vous couvrez des effectifs entiers, plusieurs sites et plusieurs langues avec la même équipe, et vous facturez une prestation complète plutôt qu'un échantillon.",
      },
    ],
    etapesLabel: 'Comment ça marche',
    etapesTitle: 'Vous gardez la main à chaque étape',
    etapes: [
      {
        title: 'Vous créez le module du client',
        text: "Vos ergonomes et vos psychologues construisent le module d'évaluation adapté à chaque entreprise cliente : gestes et postures, RPS, questionnaires, consignes de tournage.",
      },
      {
        title: 'Les salariés participent à distance',
        text: "Quelques minutes par personne, en asynchrone, depuis un téléphone. Aucune adresse e-mail n'est nécessaire, un pseudonyme suffit.",
      },
      {
        title: 'Vos experts évaluent',
        text: "Vos évaluateurs analysent les situations et rédigent les rapports dans la plateforme, avec un circuit de relecture avant diffusion.",
      },
      {
        title: 'Vous intervenez là où il faut',
        text: "Formation, accompagnement individuel, aménagement de poste : votre valeur ajoutée se concentre sur les situations qui le justifient.",
      },
    ],
    securiteLabel: 'Données de santé',
    securiteTitle: 'Un cadre de confidentialité que vous pouvez montrer à vos clients',
    securiteText:
      "La question des données de santé arrive toujours, côté direction comme côté CSE. Le dispositif est intégré à la plateforme.",
    securite: [
      'Hébergement chez OVH, certifié hébergeur de données de santé (HDS)',
      "Floutage de la vidéo et anonymisation de la voix activés par défaut",
      'Accès aux données de santé réservé aux évaluateurs, avec double authentification',
      "Vidéos, audio et réponses supprimés au bout de 30 jours ; la direction ne reçoit que des données agrégées",
    ],
    ctaTitle: 'Voir la plateforme avec vos cas',
    ctaText:
      "Nous vous montrons la création d'un module, le parcours du salarié et la production d'un rapport, à partir d'une situation que vous rencontrez.",
    ctaButton: 'Nous contacter',
  },
  en: {
    metaTitle: 'Occupational health consultancies',
    metaDescription:
      'ScanUp as a professional tool for ergonomics and psychosocial risk consultancies: your ergonomists and psychologists build their own modules, run remote assessments and collect field data on health-data certified hosting.',
    heroBadge: 'Consultancies, ergonomists and work psychologists',
    heroTitle: 'Your field tool, ',
    heroTitleHighlight: 'used on your own terms',
    heroSubtitle:
      'ScanUp is the platform your ergonomists and work psychologists use as they see fit: they build their own modules for each client, run assessments remotely and keep full control of the analysis. On-site work stays yours, where it creates the most value.',
    heroCta: 'Request a demo',
    heroNote: '14-day free trial, no commitment.',
    usagesLabel: 'Three uses',
    usagesTitle: 'What your experts do with it',
    usages: [
      {
        title: 'Target your on-site work',
        text: 'Remote screening covers the whole workforce and surfaces the situations that need attention. You travel where the need is established, with the diagnosis already made.',
      },
      {
        title: 'Collect field data securely',
        text: 'Videos of work situations, questionnaires, verbatim comments: everything is gathered in one place, on health-data certified hosting, rather than on phones and in mailboxes.',
      },
      {
        title: 'Widen your offer without hiring',
        text: 'You cover entire workforces, several sites and several languages with the same team, and invoice a complete assignment rather than a sample.',
      },
    ],
    etapesLabel: 'How it works',
    etapesTitle: 'You stay in control at every step',
    etapes: [
      {
        title: 'You build the client module',
        text: 'Your ergonomists and psychologists design the assessment module for each client company: posture and movement, psychosocial risks, questionnaires, filming instructions.',
      },
      {
        title: 'Employees take part remotely',
        text: 'A few minutes per person, asynchronously, from a phone. No email address is required, a pseudonym is enough.',
      },
      {
        title: 'Your experts assess',
        text: 'Your assessors analyse the situations and write the reports inside the platform, with a review step before anything is shared.',
      },
      {
        title: 'You step in where it matters',
        text: 'Training, individual support, workstation redesign: your added value goes to the situations that justify it.',
      },
    ],
    securiteLabel: 'Health data',
    securiteTitle: 'A privacy framework you can show your clients',
    securiteText:
      'The health-data question always comes up, from management and from employee representatives alike. The safeguards are built into the platform.',
    securite: [
      'Hosted by OVH, certified for health data hosting (HDS)',
      'Video blurring and voice anonymisation enabled by default',
      'Health data restricted to assessors, with two-factor authentication',
      'Videos, audio and answers deleted after 30 days; management only receives aggregated data',
    ],
    ctaTitle: 'See the platform with your own cases',
    ctaText:
      'We walk you through building a module, the employee journey and producing a report, based on a situation you actually deal with.',
    ctaButton: 'Contact us',
  },
  de: {
    metaTitle: 'Beratungsbüros für Arbeitsgesundheit',
    metaDescription:
      'ScanUp als Fachwerkzeug für Ergonomie- und Psychosozialberatungen: Ihre Ergonominnen und Arbeitspsychologen erstellen eigene Module, führen Beurteilungen aus der Ferne durch und erheben Felddaten auf zertifiziertem Gesundheitsdaten-Hosting.',
    heroBadge: 'Beratungsbüros, Ergonominnen und Arbeitspsychologen',
    heroTitle: 'Ihr Fachwerkzeug für das Feld, ',
    heroTitleHighlight: 'eigenständig eingesetzt',
    heroSubtitle:
      'ScanUp ist die Plattform, die Ihre Ergonominnen und Arbeitspsychologen nach eigenem Ermessen nutzen: Sie erstellen für jeden Kunden eigene Module, führen Beurteilungen aus der Ferne durch und behalten die Analyse in der Hand. Die Arbeit vor Ort bleibt Ihre, dort wo sie am meisten bringt.',
    heroCta: 'Demo anfragen',
    heroNote: '14 Tage kostenlos testen, ohne Verpflichtung.',
    usagesLabel: 'Drei Einsätze',
    usagesTitle: 'Was Ihre Fachleute damit machen',
    usages: [
      {
        title: 'Einsätze vor Ort gezielt planen',
        text: 'Das Screening aus der Ferne erfasst die gesamte Belegschaft und zeigt die kritischen Situationen. Sie fahren dorthin, wo der Bedarf belegt ist, mit bereits gestellter Diagnose.',
      },
      {
        title: 'Felddaten sicher erheben',
        text: 'Videos von Arbeitssituationen, Fragebogen, Aussagen: alles an einem Ort erfasst, auf zertifiziertem Gesundheitsdaten-Hosting statt auf Handys und in Postfächern.',
      },
      {
        title: 'Angebot erweitern ohne Neueinstellungen',
        text: 'Sie decken ganze Belegschaften, mehrere Standorte und mehrere Sprachen mit demselben Team ab und verrechnen eine vollständige Leistung statt einer Stichprobe.',
      },
    ],
    etapesLabel: 'So funktioniert es',
    etapesTitle: 'Sie behalten in jedem Schritt die Kontrolle',
    etapes: [
      {
        title: 'Sie erstellen das Kundenmodul',
        text: 'Ihre Fachleute gestalten das Beurteilungsmodul für jedes Kundenunternehmen: Bewegung und Haltung, psychosoziale Risiken, Fragebogen, Aufnahmehinweise.',
      },
      {
        title: 'Mitarbeitende nehmen aus der Ferne teil',
        text: 'Wenige Minuten pro Person, asynchron, über das Smartphone. Keine E-Mail-Adresse nötig, ein Pseudonym genügt.',
      },
      {
        title: 'Ihre Fachleute beurteilen',
        text: 'Ihre Beurteilenden analysieren die Situationen und verfassen die Berichte in der Plattform, mit Gegenlesen vor der Weitergabe.',
      },
      {
        title: 'Sie greifen dort ein, wo es nötig ist',
        text: 'Schulung, individuelle Begleitung, Arbeitsplatzgestaltung: Ihr Mehrwert fliesst in die Situationen, die ihn rechtfertigen.',
      },
    ],
    securiteLabel: 'Gesundheitsdaten',
    securiteTitle: 'Ein Datenschutzrahmen, den Sie Ihren Kunden zeigen können',
    securiteText:
      'Die Frage der Gesundheitsdaten kommt immer, von der Geschäftsleitung wie von der Arbeitnehmervertretung. Die Schutzmassnahmen sind Teil der Plattform.',
    securite: [
      'Hosting bei OVH, zertifiziert für Gesundheitsdaten (HDS)',
      'Unkenntlichmachung des Videos und Anonymisierung der Stimme standardmässig aktiv',
      'Zugang zu Gesundheitsdaten nur für Beurteilende, mit Zwei-Faktor-Authentisierung',
      'Videos, Audio und Antworten nach 30 Tagen gelöscht; die Geschäftsleitung erhält nur aggregierte Daten',
    ],
    ctaTitle: 'Die Plattform an Ihren Fällen sehen',
    ctaText:
      'Wir zeigen Ihnen die Erstellung eines Moduls, den Ablauf für Mitarbeitende und die Erstellung eines Berichts, ausgehend von einer Situation aus Ihrem Alltag.',
    ctaButton: 'Kontakt aufnehmen',
  },
  it: {
    metaTitle: 'Studi di salute sul lavoro',
    metaDescription:
      'ScanUp come strumento professionale per studi di ergonomia e rischi psicosociali: i vostri ergonomi e psicologi creano i propri moduli, conducono le valutazioni a distanza e raccolgono i dati sul campo su un hosting certificato per i dati sanitari.',
    heroBadge: 'Studi, ergonomi e psicologi del lavoro',
    heroTitle: 'Il vostro strumento per il campo, ',
    heroTitleHighlight: 'in piena autonomia',
    heroSubtitle:
      'ScanUp è la piattaforma che i vostri ergonomi e psicologi del lavoro usano come preferiscono: creano moduli su misura per ogni cliente, conducono le valutazioni a distanza e mantengono il controllo sull\'analisi. La presenza sul posto resta vostra, dove crea più valore.',
    heroCta: 'Richiedi una dimostrazione',
    heroNote: 'Prova gratuita di 14 giorni, senza impegno.',
    usagesLabel: 'Tre utilizzi',
    usagesTitle: 'Che cosa ne fanno i vostri esperti',
    usages: [
      {
        title: 'Mirare gli interventi in presenza',
        text: 'Lo screening a distanza copre tutto il personale e fa emergere le situazioni da trattare. Vi spostate dove il bisogno è accertato, con la diagnosi già fatta.',
      },
      {
        title: 'Raccogliere i dati sul campo in sicurezza',
        text: 'Video delle situazioni di lavoro, questionari, testimonianze: tutto raccolto in un unico spazio, su un hosting certificato per i dati sanitari, invece che su telefoni e caselle di posta.',
      },
      {
        title: 'Ampliare l\'offerta senza assumere',
        text: 'Coprite interi organici, più sedi e più lingue con lo stesso team, e fatturate una prestazione completa invece di un campione.',
      },
    ],
    etapesLabel: 'Come funziona',
    etapesTitle: 'Il controllo resta vostro a ogni passo',
    etapes: [
      {
        title: 'Create il modulo del cliente',
        text: 'I vostri esperti costruiscono il modulo di valutazione per ogni azienda cliente: gesti e posture, rischi psicosociali, questionari, istruzioni di ripresa.',
      },
      {
        title: 'I dipendenti partecipano a distanza',
        text: 'Pochi minuti a persona, in modo asincrono, dal telefono. Nessun indirizzo e-mail necessario, basta uno pseudonimo.',
      },
      {
        title: 'I vostri esperti valutano',
        text: 'I valutatori analizzano le situazioni e redigono i rapporti nella piattaforma, con una rilettura prima della diffusione.',
      },
      {
        title: 'Intervenite dove serve',
        text: 'Formazione, accompagnamento individuale, adeguamento della postazione: il vostro valore aggiunto va dove è giustificato.',
      },
    ],
    securiteLabel: 'Dati sanitari',
    securiteTitle: 'Un quadro di riservatezza da mostrare ai vostri clienti',
    securiteText:
      'La domanda sui dati sanitari arriva sempre, dalla direzione come dai rappresentanti dei lavoratori. Le garanzie sono integrate nella piattaforma.',
    securite: [
      'Hosting presso OVH, certificato per i dati sanitari (HDS)',
      'Sfocatura del video e anonimizzazione della voce attive per impostazione predefinita',
      'Accesso ai dati sanitari riservato ai valutatori, con autenticazione a due fattori',
      'Video, audio e risposte cancellati dopo 30 giorni; alla direzione solo dati aggregati',
    ],
    ctaTitle: 'Vedere la piattaforma sui vostri casi',
    ctaText:
      'Vi mostriamo la creazione di un modulo, il percorso del dipendente e la produzione di un rapporto, a partire da una situazione che incontrate davvero.',
    ctaButton: 'Contattaci',
  },
  es: {
    metaTitle: 'Gabinetes de salud laboral',
    metaDescription:
      'ScanUp como herramienta profesional para gabinetes de ergonomía y riesgos psicosociales: vuestros ergónomos y psicólogos crean sus módulos, realizan las evaluaciones a distancia y recogen los datos de campo en un alojamiento certificado para datos de salud.',
    heroBadge: 'Gabinetes, ergónomos y psicólogos del trabajo',
    heroTitle: 'Vuestra herramienta de campo, ',
    heroTitleHighlight: 'con total autonomía',
    heroSubtitle:
      'ScanUp es la plataforma que vuestros ergónomos y psicólogos del trabajo usan como quieren: crean sus propios módulos para cada cliente, realizan las evaluaciones a distancia y mantienen el control del análisis. La intervención presencial sigue siendo vuestra, allí donde aporta más.',
    heroCta: 'Solicitar una demostración',
    heroNote: 'Prueba gratuita de 14 días, sin compromiso.',
    usagesLabel: 'Tres usos',
    usagesTitle: 'Lo que hacen vuestros expertos con ella',
    usages: [
      {
        title: 'Dirigir las intervenciones presenciales',
        text: 'El cribado a distancia cubre a toda la plantilla y hace aflorar las situaciones que hay que tratar. Os desplazáis donde la necesidad está probada, con el diagnóstico ya hecho.',
      },
      {
        title: 'Recoger los datos de campo con seguridad',
        text: 'Vídeos de situaciones de trabajo, cuestionarios, testimonios: todo se recoge en un único marco, en un alojamiento certificado para datos de salud, y no en teléfonos y buzones.',
      },
      {
        title: 'Ampliar la oferta sin contratar',
        text: 'Cubrís plantillas enteras, varios centros y varios idiomas con el mismo equipo, y facturáis un servicio completo en lugar de una muestra.',
      },
    ],
    etapesLabel: 'Cómo funciona',
    etapesTitle: 'Mantenéis el control en cada etapa',
    etapes: [
      {
        title: 'Creáis el módulo del cliente',
        text: 'Vuestros expertos construyen el módulo de evaluación para cada empresa cliente: gestos y posturas, riesgos psicosociales, cuestionarios, instrucciones de grabación.',
      },
      {
        title: 'Los empleados participan a distancia',
        text: 'Unos minutos por persona, de forma asíncrona, desde el móvil. No hace falta correo electrónico, basta un seudónimo.',
      },
      {
        title: 'Vuestros expertos evalúan',
        text: 'Los evaluadores analizan las situaciones y redactan los informes en la plataforma, con una revisión antes de difundirlos.',
      },
      {
        title: 'Intervenís donde hace falta',
        text: 'Formación, acompañamiento individual, adaptación del puesto: vuestro valor añadido va a las situaciones que lo justifican.',
      },
    ],
    securiteLabel: 'Datos de salud',
    securiteTitle: 'Un marco de confidencialidad que podéis enseñar a vuestros clientes',
    securiteText:
      'La pregunta sobre los datos de salud llega siempre, tanto de la dirección como de la representación del personal. Las garantías están integradas en la plataforma.',
    securite: [
      'Alojamiento en OVH, certificado para datos de salud (HDS)',
      'Difuminado del vídeo y anonimización de la voz activados por defecto',
      'Acceso a los datos de salud reservado a los evaluadores, con doble autenticación',
      'Vídeos, audio y respuestas eliminados a los 30 días; la dirección solo recibe datos agregados',
    ],
    ctaTitle: 'Ver la plataforma con vuestros casos',
    ctaText:
      'Os mostramos la creación de un módulo, el recorrido del empleado y la producción de un informe, a partir de una situación real vuestra.',
    ctaButton: 'Contactar',
  },
  pt: {
    metaTitle: 'Gabinetes de saúde no trabalho',
    metaDescription:
      'A ScanUp como ferramenta profissional para gabinetes de ergonomia e riscos psicossociais: os vossos ergonomistas e psicólogos criam os seus módulos, fazem as avaliações à distância e recolhem os dados de terreno num alojamento certificado para dados de saúde.',
    heroBadge: 'Gabinetes, ergonomistas e psicólogos do trabalho',
    heroTitle: 'A vossa ferramenta de terreno, ',
    heroTitleHighlight: 'com total autonomia',
    heroSubtitle:
      'A ScanUp é a plataforma que os vossos ergonomistas e psicólogos do trabalho usam como entendem: criam os seus próprios módulos para cada cliente, fazem as avaliações à distância e mantêm o controlo da análise. O trabalho presencial continua vosso, onde cria mais valor.',
    heroCta: 'Pedir uma demonstração',
    heroNote: 'Teste gratuito de 14 dias, sem compromisso.',
    usagesLabel: 'Três utilizações',
    usagesTitle: 'O que os vossos especialistas fazem com ela',
    usages: [
      {
        title: 'Direcionar as intervenções presenciais',
        text: 'O rastreio à distância abrange todos os colaboradores e faz sobressair as situações a tratar. Deslocam-se onde a necessidade está comprovada, com o diagnóstico já feito.',
      },
      {
        title: 'Recolher os dados de terreno em segurança',
        text: 'Vídeos de situações de trabalho, questionários, testemunhos: tudo recolhido num só enquadramento, num alojamento certificado para dados de saúde, e não em telemóveis e caixas de correio.',
      },
      {
        title: 'Alargar a oferta sem contratar',
        text: 'Cobrem quadros inteiros, vários locais e várias línguas com a mesma equipa, e faturam um serviço completo em vez de uma amostra.',
      },
    ],
    etapesLabel: 'Como funciona',
    etapesTitle: 'O controlo é vosso em cada etapa',
    etapes: [
      {
        title: 'Criam o módulo do cliente',
        text: 'Os vossos especialistas constroem o módulo de avaliação para cada empresa cliente: gestos e posturas, riscos psicossociais, questionários, instruções de filmagem.',
      },
      {
        title: 'Os colaboradores participam à distância',
        text: 'Poucos minutos por pessoa, de forma assíncrona, a partir do telemóvel. Não é preciso endereço de e-mail, basta um pseudónimo.',
      },
      {
        title: 'Os vossos especialistas avaliam',
        text: 'Os avaliadores analisam as situações e redigem os relatórios na plataforma, com uma revisão antes da divulgação.',
      },
      {
        title: 'Intervêm onde é preciso',
        text: 'Formação, acompanhamento individual, adaptação do posto: o vosso valor acrescentado vai para as situações que o justificam.',
      },
    ],
    securiteLabel: 'Dados de saúde',
    securiteTitle: 'Um enquadramento de confidencialidade que podem mostrar aos clientes',
    securiteText:
      'A questão dos dados de saúde surge sempre, tanto da direção como dos representantes dos trabalhadores. As garantias estão integradas na plataforma.',
    securite: [
      'Alojamento na OVH, certificado para dados de saúde (HDS)',
      'Desfocagem do vídeo e anonimização da voz ativadas por predefinição',
      'Acesso aos dados de saúde reservado aos avaliadores, com dupla autenticação',
      'Vídeos, áudio e respostas eliminados ao fim de 30 dias; a direção recebe apenas dados agregados',
    ],
    ctaTitle: 'Ver a plataforma com os vossos casos',
    ctaText:
      'Mostramos a criação de um módulo, o percurso do colaborador e a produção de um relatório, a partir de uma situação que encontram no dia a dia.',
    ctaButton: 'Contactar',
  },
};

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const USAGE_ICONS = [ScanLine, ShieldCheck, Users];

export default function CabinetsPage() {
  const { lang } = useLanguage();
  const t = TEXTS[lang] ?? TEXTS.fr;
  const navigate = useNavigate();
  const allerContact = () => navigate('/aide-support');

  return (
    <div className="min-h-screen font-sans text-scanup-navy bg-scanup-white selection:bg-scanup-blue/20">
      <PageMeta title={t.metaTitle} description={t.metaDescription} path="/cabinets-sante-travail" />
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────── */}
      <section className="px-6 pt-16 pb-14 md:pt-20 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scanup-lightblue text-scanup-blue text-[13px] font-medium mb-6">
              <Briefcase size={16} />
              {t.heroBadge}
            </div>
            <h1 className="text-[30px] sm:text-[40px] md:text-[50px] font-bold leading-[1.15] mb-6 tracking-tight">
              {t.heroTitle}
              <span className="text-scanup-blue">{t.heroTitleHighlight}</span>
            </h1>
            <p className="text-[17px] text-scanup-graytext leading-[1.65] mb-8">{t.heroSubtitle}</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={allerContact}
              className="inline-flex items-center gap-2 bg-scanup-blue text-white px-8 py-4 rounded-[10px] font-semibold hover:brightness-110 transition-all group"
            >
              {t.heroCta}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
            <p className="text-[13px] text-scanup-graytext mt-5">{t.heroNote}</p>
          </FadeIn>
        </div>
      </section>

      {/* ─── TROIS USAGES ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-scanup-graylight/50">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.usagesLabel}</p>
            <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight">{t.usagesTitle}</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {t.usages.map((u, i) => {
              const Icon = USAGE_ICONS[i] ?? ScanLine;
              return (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="h-full bg-white border border-scanup-graylight rounded-[16px] p-7">
                    <Icon size={28} className="text-scanup-blue mb-5" />
                    <h3 className="text-[19px] font-semibold mb-3 leading-snug">{u.title}</h3>
                    <p className="text-[15px] text-scanup-graytext leading-relaxed">{u.text}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── ETAPES ────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.etapesLabel}</p>
            <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight">{t.etapesTitle}</h2>
          </FadeIn>
          <div className="space-y-5">
            {t.etapes.map((e, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="flex gap-5 items-start bg-white border border-scanup-graylight rounded-[16px] p-6">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-scanup-blue text-white font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[18px] font-semibold mb-2 leading-snug">{e.title}</h3>
                    <p className="text-[15px] text-scanup-graytext leading-relaxed">{e.text}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DONNEES DE SANTE ──────────────────────────────────── */}
      <section className="px-6 py-20 bg-scanup-navy text-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center gap-2 text-scanup-turquoise mb-4">
              <Settings2 size={18} />
              <span className="text-[12px] uppercase tracking-widest font-semibold">{t.securiteLabel}</span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-bold tracking-tight mb-4 leading-tight">{t.securiteTitle}</h2>
            <p className="text-[16px] text-white/80 leading-relaxed mb-8">{t.securiteText}</p>
            <ul className="grid sm:grid-cols-2 gap-4">
              {t.securite.map((s, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Check size={20} className="text-scanup-turquoise shrink-0 mt-0.5" />
                  <span className="text-[15px] leading-relaxed text-white/90">{s}</span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <FadeIn className="max-w-3xl mx-auto text-center">
          <h2 className="text-[26px] md:text-[34px] font-bold tracking-tight mb-4">{t.ctaTitle}</h2>
          <p className="text-[16px] text-scanup-graytext leading-relaxed mb-8">{t.ctaText}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={allerContact}
            className="inline-flex items-center gap-2 bg-scanup-blue text-white px-8 py-4 rounded-[10px] font-semibold hover:brightness-110 transition-all group"
          >
            {t.ctaButton}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </FadeIn>
      </section>

      <Footer />
    </div>
  );
}
