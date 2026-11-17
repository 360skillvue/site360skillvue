import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, ArrowRight, Check, ScanLine, ShieldCheck, Users, Settings2, UserCheck, MapPin, Palette, ChevronDown } from 'lucide-react';
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
  // Sections ajoutées d'après les échanges avec les cabinets (affichées seulement si le texte existe dans la langue)
  expertLabel?: string;
  expertTitle?: string;
  expertText?: string;
  expert?: { title: string; text: string }[];
  casLabel?: string;
  casTitle?: string;
  cas?: { title: string; text: string }[];
  essaiLabel?: string;
  essaiTitle?: string;
  essaiText?: string;
  essai?: { title: string; text: string }[];
  faqLabel?: string;
  faqTitle?: string;
  faq?: { q: string; a: string }[];
};

const TEXTS: Record<Lang, Texts> = {
  fr: {
    metaTitle: 'Cabinets de santé au travail',
    metaDescription:
      "ScanUp, outil métier des cabinets d'ergonomie et de prévention des RPS : vos ergonomes et psychologues repèrent à distance les situations à risque et les signaux faibles, en complément de leurs interventions, sur un hébergement certifié HDS.",
    heroBadge: 'Cabinets, ergonomes et psychologues du travail',
    heroTitle: 'Repérez à distance, intervenez ',
    heroTitleHighlight: 'là où vous êtes utiles',
    heroSubtitle:
      "ScanUp est l'outil que vos ergonomes et vos psychologues du travail utilisent pour atteindre tous les salariés d'un client, y compris ceux que le présentiel ne touche jamais. Ils créent leurs modules, analysent eux-mêmes les situations et repèrent les signaux faibles. Vous gardez l'expertise et le terrain ; ScanUp vous dit où aller.",
    heroCta: 'Demander une démonstration',
    heroNote: "Essai gratuit de 14 jours dans votre propre espace, avec des modules modèles prêts à l'emploi.",
    usagesLabel: 'Trois usages',
    usagesTitle: 'Ce que vos experts en font',
    usages: [
      {
        title: 'Cibler vos interventions en présentiel',
        text: "Le repérage à distance couvre l'ensemble des salariés et fait ressortir les postes, les équipes et les personnes à voir en priorité. Vous vous déplacez là où le besoin est établi, avec un premier diagnostic déjà posé.",
      },
      {
        title: 'Recueillir les données terrain en sécurité',
        text: "Vidéos de situations de travail, questionnaires, témoignages audio : tout est collecté dans un cadre unique, chez un hébergeur certifié HDS, plutôt que sur des téléphones et des boîtes mail.",
      },
      {
        title: 'Élargir votre offre sans recruter',
        text: "Vous couvrez des effectifs entiers, plusieurs sites, le travail de nuit et plusieurs langues avec la même équipe, et vous proposez à vos clients un état des lieux complet plutôt qu'un échantillon.",
      },
    ],
    expertLabel: 'Vous restez l\'expert',
    expertTitle: 'Un complément du terrain, pas un remplaçant',
    expertText:
      "C'est la première question que posent les ergonomes et les psychologues, et elle est légitime. ScanUp ne remplace ni votre regard ni votre présence : il trie, il priorise, et il vous apporte les situations qui ont besoin de vous.",
    expert: [
      {
        title: 'Votre analyse, pas celle d\'un algorithme',
        text: "Ce sont vos évaluateurs qui regardent les vidéos, écoutent les témoignages et qualifient chaque situation. La plateforme collecte et organise ; l'analyse reste humaine et vous appartient.",
      },
      {
        title: 'Aussi pendant vos interventions sur site',
        text: "Lors d'une formation ou d'une visite, remettez aux salariés une carte avec un QR code et un identifiant : ils répondent sur place, depuis leur téléphone, et vous repartez avec des données exploitables.",
      },
      {
        title: 'Vos modules, votre marque',
        text: "Vous adaptez nos modèles ou vous créez vos propres questionnaires et consignes, métier par métier. L'espace est à votre nom et à votre logo : vos clients voient votre cabinet.",
      },
    ],
    casLabel: 'Cas concrets',
    casTitle: 'Ce que les cabinets nous demandent le plus',
    cas: [
      {
        title: 'Faire un état des lieux avant d\'intervenir, et mesurer l\'impact après',
        text: "Un premier passage avant une formation ou un plan d'action, un second quelques mois plus tard : le taux de situations à risque devient un indicateur que votre client comprend.",
      },
      {
        title: 'Répondre à une situation RPS sensible',
        text: "Tension dans une équipe, suite d'une inspection, signalement de harcèlement : la confidentialité libère la parole, et vous obtenez une vision d'ensemble avant de rencontrer les personnes.",
      },
      {
        title: 'Savoir qui voir en entretien individuel',
        text: "Le repérage fait ressortir les salariés qui ont besoin d'un échange, sans attendre l'entretien annuel ou l'arrêt de travail. Vous orientez votre temps vers eux.",
      },
      {
        title: 'Atteindre ceux que le présentiel ne touche pas',
        text: "Télétravailleurs, équipes de nuit, petits sites éloignés, salariés qui parlent une autre langue : chacun participe depuis son téléphone, au moment qui lui convient.",
      },
    ],
    etapesLabel: 'Comment ça marche',
    etapesTitle: 'Vous gardez la main à chaque étape',
    etapes: [
      {
        title: 'Vous créez le module du client',
        text: "Vos ergonomes et vos psychologues partent d'un modèle ou de leurs propres outils pour construire le module adapté à chaque entreprise : gestes et postures, RPS, questionnaires, consignes de tournage.",
      },
      {
        title: 'Les salariés participent à distance',
        text: "Quelques minutes par personne, en asynchrone, depuis un téléphone et sans application à installer. Aucune adresse e-mail n'est nécessaire, un identifiant sous pseudonyme suffit. ScanUp est connecté au logiciel RH Lucca.",
      },
      {
        title: 'Vos experts évaluent',
        text: "Vos évaluateurs analysent les situations et rédigent leurs conclusions dans la plateforme, avec un circuit de relecture avant diffusion.",
      },
      {
        title: 'Vous intervenez là où il faut',
        text: "Formation, entretien individuel, aménagement de poste, plan d'action intégré au DUERP : votre valeur ajoutée se concentre sur les situations qui le justifient.",
      },
    ],
    essaiLabel: 'Essai gratuit',
    essaiTitle: 'Quatorze jours pour l\'essayer sur un vrai cas',
    essaiText:
      "L'essai démarre à votre première connexion. Pour qu'il serve vraiment, nous le préparons avec vous lors d'un court échange, puis nous restons disponibles pendant toute sa durée.",
    essai: [
      {
        title: 'Votre espace prêt au premier jour',
        text: "Un espace à votre nom, avec des modules modèles TMS et RPS que vous pouvez utiliser tels quels ou adapter, et des crédits offerts.",
      },
      {
        title: 'Un test avec quelques salariés',
        text: "Chez un client volontaire ou dans votre propre équipe : quelques salariés participent, et vos évaluateurs traitent leurs réponses comme dans une vraie mission.",
      },
      {
        title: 'Un point à mi-parcours',
        text: "Nous faisons le point avec vous à la moitié de l'essai : ce qui fonctionne, ce qu'il faut ajuster, comment le présenter à vos clients.",
      },
      {
        title: 'Un bilan pour décider',
        text: "À la fin, vous savez ce que l'outil apporte à votre cabinet et comment l'intégrer à vos offres. Sans engagement.",
      },
    ],
    securiteLabel: 'Données de santé',
    securiteTitle: 'Un cadre de confidentialité que vous pouvez montrer à vos clients',
    securiteText:
      "La question des données de santé arrive toujours, côté direction comme côté représentants du personnel. Le dispositif est intégré à la plateforme.",
    securite: [
      'Hébergement chez OVH, certifié hébergeur de données de santé (HDS)',
      "Floutage de la vidéo et anonymisation de la voix activés par défaut",
      'Accès aux données de santé réservé aux évaluateurs, avec double authentification',
      "Connexion SSO avec le compte de l'entreprise cliente, en plus des identifiants sous pseudonyme",
      "Vidéos, audio et réponses supprimés au bout de 30 jours ; la direction ne reçoit que des données agrégées",
    ],
    faqLabel: 'Questions fréquentes',
    faqTitle: 'Les questions que posent les cabinets',
    faq: [
      {
        q: 'Est-ce que ScanUp remplace l\'ergonome ou le psychologue ?',
        a: "Non. La plateforme recueille et organise les données ; ce sont vos évaluateurs qui analysent et concluent. ScanUp sert à repérer et à prioriser, pour que votre temps de terrain aille aux situations qui en ont besoin.",
      },
      {
        q: 'Doit-on parler de dépistage à nos clients ?',
        a: "Vous choisissez vos mots. Beaucoup de psychologues préfèrent parler de repérage des signaux faibles ou d'état des lieux. Les titres, textes et consignes des modules sont entièrement modifiables.",
      },
      {
        q: 'Peut-on utiliser nos propres questionnaires ?',
        a: "Oui. Vous partez de nos modèles ou vous saisissez vos propres questions, échelles et consignes, et vous les réutilisez d'un client à l'autre.",
      },
      {
        q: 'Qui voit les résultats ?',
        a: "Les données de santé ne sont accessibles qu'à vos évaluateurs. Vous décidez si le salarié voit son propre résultat et le conseil associé ; l'employeur ne reçoit que des données agrégées.",
      },
      {
        q: 'Dans quelles langues les salariés peuvent-ils répondre ?',
        a: "La plateforme est disponible en français, anglais, allemand, italien, espagnol et portugais, et vos modules peuvent être proposés dans chacune de ces langues : pratique pour les équipes multilingues et les interventions en Suisse.",
      },
      {
        q: 'Combien de temps faut-il prévoir ?',
        a: "Partir d'un modèle permet de créer un premier module rapidement. Chaque salarié répond en quelques minutes ; reste le temps d'analyse de vos évaluateurs, que vous facturez comme une prestation.",
      },
      {
        q: 'Et si nous n\'avons pas le temps d\'analyser nous-mêmes ?',
        a: "Les ergonomes et les psychologues de 360SkillVue peuvent prendre en charge l'analyse de tout ou partie des réponses, pour absorber un pic d'activité ou répondre à un appel d'offres.",
      },
    ],
    ctaTitle: 'Voir la plateforme avec vos cas',
    ctaText:
      "Nous vous montrons la création d'un module, le parcours du salarié et l'analyse d'une situation, à partir d'un cas que vous rencontrez. Puis nous préparons ensemble votre essai.",
    ctaButton: 'Nous contacter',
  },
  en: {
    metaTitle: "Occupational health consultancies",
    metaDescription: "ScanUp, the professional tool for ergonomics and psychosocial risk consultancies: your ergonomists and psychologists identify at-risk situations and weak signals remotely, alongside their on-site work, on certified health data hosting (HDS).",
    heroBadge: "Consultancies, ergonomists and occupational psychologists",
    heroTitle: "Identify remotely, step in ",
    heroTitleHighlight: "where you are needed",
    heroSubtitle: "ScanUp is the tool your ergonomists and occupational psychologists use to reach every employee of a client, including those on-site work never reaches. They build their modules, analyse the situations themselves and pick up weak signals. You keep the expertise and the field work; ScanUp tells you where to go.",
    heroCta: "Request a demo",
    heroNote: "14-day free trial in your own space, with ready-to-use template modules.",
    usagesLabel: "Three uses",
    usagesTitle: "What your experts do with it",
    usages: [
      { title: "Target your on-site interventions", text: "Remote screening covers the whole workforce and highlights the workstations, teams and people to see first. You go where the need is established, with an initial diagnosis already made." },
      { title: "Collect field data securely", text: "Videos of work situations, questionnaires, audio testimonies: everything is collected in a single framework, on certified health data hosting (HDS), rather than on phones and in mailboxes." },
      { title: "Broaden your offer without hiring", text: "You cover entire workforces, several sites, night shifts and several languages with the same team, and offer your clients a complete picture rather than a sample." },
    ],
    expertLabel: "You remain the expert",
    expertTitle: "A complement to field work, not a replacement",
    expertText: "It is the first question ergonomists and psychologists ask, and a legitimate one. ScanUp replaces neither your judgement nor your presence: it sorts, it prioritises, and it brings you the situations that need you.",
    expert: [
      { title: "Your analysis, not an algorithm's", text: "Your assessors watch the videos, listen to the testimonies and qualify each situation. The platform collects and organises; the analysis remains human and belongs to you." },
      { title: "During your on-site interventions too", text: "During a training session or a visit, hand employees a card with a QR code and a login: they answer on the spot from their phone, and you leave with usable data." },
      { title: "Your modules, your brand", text: "Adapt our templates or create your own questionnaires and instructions, job by job. The space carries your name and logo: your clients see your consultancy." },
    ],
    casLabel: "Real cases",
    casTitle: "What consultancies ask us for most",
    cas: [
      { title: "Take stock before intervening, and measure the impact afterwards", text: "A first round before training or an action plan, a second a few months later: the rate of at-risk situations becomes an indicator your client understands." },
      { title: "Respond to a sensitive psychosocial situation", text: "Tension in a team, follow-up to an inspection, a harassment report: confidentiality frees people to speak, and you get an overall picture before meeting anyone." },
      { title: "Know who to see in an individual interview", text: "Screening highlights the employees who need a conversation, without waiting for the annual review or sick leave. You direct your time towards them." },
      { title: "Reach those on-site work does not", text: "Remote workers, night teams, small distant sites, employees who speak another language: everyone takes part from their phone, whenever suits them." },
    ],
    etapesLabel: "How it works",
    etapesTitle: "You stay in control at every step",
    etapes: [
      { title: "You create the client's module", text: "Your ergonomists and psychologists start from a template or their own tools to build the module suited to each company: movements and postures, psychosocial risks, questionnaires, filming instructions." },
      { title: "Employees take part remotely", text: "A few minutes per person, asynchronously, from a phone and with no app to install. No email address needed, a pseudonymous login is enough. ScanUp is connected to the Lucca HR software." },
      { title: "Your experts assess", text: "Your assessors analyse the situations and write their conclusions in the platform, with a review step before release." },
      { title: "You step in where it matters", text: "Training, individual interview, workstation redesign, action plan included in the risk assessment: your added value goes to the situations that justify it." },
    ],
    essaiLabel: "Free trial",
    essaiTitle: "Fourteen days to try it on a real case",
    essaiText: "The trial starts at your first login. To make it truly useful, we prepare it with you in a short call, then remain available throughout.",
    essai: [
      { title: "Your space ready on day one", text: "A space in your name, with TMS and psychosocial template modules you can use as they are or adapt, and free credits." },
      { title: "A test with a few employees", text: "At a willing client or within your own team: a few employees take part, and your assessors handle their answers as in a real assignment." },
      { title: "A mid-point review", text: "We review things with you halfway through the trial: what works, what needs adjusting, how to present it to your clients." },
      { title: "A review to decide", text: "At the end, you know what the tool brings to your consultancy and how to fit it into your offers. No commitment." },
    ],
    securiteLabel: "Health data",
    securiteTitle: "A confidentiality framework you can show your clients",
    securiteText: "The question of health data always comes up, from management and from employee representatives alike. The framework is built into the platform.",
    securite: ["Hosted by OVH, certified health data host (HDS)", "Video blurring and voice anonymisation enabled by default", "Access to health data restricted to assessors, with two-factor authentication", "Videos, audio and answers deleted after 30 days; management only receives aggregated data", "SSO sign-in with the client company's account, in addition to pseudonymous logins"],
    faqLabel: "Frequently asked questions",
    faqTitle: "The questions consultancies ask",
    faq: [
      { q: "Does ScanUp replace the ergonomist or the psychologist?", a: "No. The platform collects and organises the data; your assessors analyse and conclude. ScanUp is there to identify and prioritise, so your field time goes to the situations that need it." },
      { q: "Should we talk about screening to our clients?", a: "You choose your words. Many psychologists prefer to speak of identifying weak signals or of taking stock. Module titles, texts and instructions are fully editable." },
      { q: "Can we use our own questionnaires?", a: "Yes. Start from our templates or enter your own questions, scales and instructions, and reuse them from one client to the next." },
      { q: "Who sees the results?", a: "Health data is only accessible to your assessors. You decide whether employees see their own result and the related advice; the employer only receives aggregated data." },
      { q: "In which languages can employees answer?", a: "The platform is available in French, English, German, Italian, Spanish and Portuguese, and your modules can be offered in each of these languages: handy for multilingual teams and work in Switzerland." },
      { q: "How much time should we plan?", a: "Starting from a template lets you create a first module quickly. Each employee answers in a few minutes; what remains is your assessors' analysis time, which you bill as a service." },
      { q: "What if we do not have time to analyse ourselves?", a: "360SkillVue's ergonomists and psychologists can handle the analysis of all or part of the answers, to absorb a peak in activity or respond to a tender." },
    ],
    ctaTitle: "See the platform with your cases",
    ctaText: "We show you how to create a module, the employee journey and the analysis of a situation, based on a case you deal with. Then we prepare your trial together.",
    ctaButton: "Contact us",
  },
  de: {
    metaTitle: "Beratungsbüros für Arbeitsgesundheit",
    metaDescription: "ScanUp als Fachwerkzeug für Ergonomie- und Psychosozialberatungen: Ihre Fachleute für Ergonomie und Arbeitspsychologie erkennen Risikosituationen und schwache Signale aus der Ferne, ergänzend zu ihren Einsätzen vor Ort, auf zertifiziertem Gesundheitsdaten-Hosting (HDS).",
    heroBadge: "Beratungsbüros, Ergonomie und Arbeitspsychologie",
    heroTitle: "Aus der Ferne erkennen, eingreifen, ",
    heroTitleHighlight: "wo Sie gebraucht werden",
    heroSubtitle: "ScanUp ist das Werkzeug, mit dem Ihre Fachleute für Ergonomie und Arbeitspsychologie alle Mitarbeitenden eines Kunden erreichen, auch jene, die Einsätze vor Ort nie erreichen. Sie erstellen ihre Module, analysieren die Situationen selbst und erkennen schwache Signale. Expertise und Feldarbeit bleiben bei Ihnen; ScanUp zeigt Ihnen, wohin Sie gehen sollten.",
    heroCta: "Demo anfragen",
    heroNote: "14 Tage kostenlos testen, in Ihrem eigenen Bereich, mit sofort einsetzbaren Mustermodulen.",
    usagesLabel: "Drei Einsätze",
    usagesTitle: "Was Ihre Fachleute damit machen",
    usages: [
      { title: "Einsätze vor Ort gezielt planen", text: "Das Screening aus der Ferne erfasst die ganze Belegschaft und zeigt, welche Arbeitsplätze, Teams und Personen zuerst gesehen werden sollten. Sie gehen dorthin, wo der Bedarf feststeht, mit einer ersten Diagnose." },
      { title: "Felddaten sicher erheben", text: "Videos von Arbeitssituationen, Fragebögen, Audio-Erfahrungsberichte: Alles wird in einem einzigen Rahmen erhoben, auf zertifiziertem Gesundheitsdaten-Hosting (HDS), statt auf Telefonen und in Postfächern." },
      { title: "Ihr Angebot erweitern, ohne einzustellen", text: "Sie decken ganze Belegschaften, mehrere Standorte, Nachtarbeit und mehrere Sprachen mit demselben Team ab und bieten Ihren Kunden eine vollständige Bestandsaufnahme statt einer Stichprobe." },
    ],
    expertLabel: "Sie bleiben die Fachperson",
    expertTitle: "Eine Ergänzung der Feldarbeit, kein Ersatz",
    expertText: "Das ist die erste Frage von Fachleuten für Ergonomie und Psychologie, und sie ist berechtigt. ScanUp ersetzt weder Ihren Blick noch Ihre Präsenz: Es sortiert, priorisiert und bringt Ihnen die Situationen, die Sie brauchen.",
    expert: [
      { title: "Ihre Analyse, nicht die eines Algorithmus", text: "Ihre Fachleute sehen die Videos, hören die Erfahrungsberichte und beurteilen jede Situation. Die Plattform erhebt und ordnet; die Analyse bleibt menschlich und gehört Ihnen." },
      { title: "Auch während Ihrer Einsätze vor Ort", text: "Bei einer Schulung oder einem Besuch erhalten die Mitarbeitenden eine Karte mit QR-Code und Kennung: Sie antworten gleich vor Ort mit dem Smartphone, und Sie gehen mit verwertbaren Daten nach Hause." },
      { title: "Ihre Module, Ihre Marke", text: "Sie passen unsere Vorlagen an oder erstellen eigene Fragebögen und Anleitungen, Beruf für Beruf. Der Bereich trägt Ihren Namen und Ihr Logo: Ihre Kunden sehen Ihr Büro." },
    ],
    casLabel: "Konkrete Fälle",
    casTitle: "Was Beratungsbüros am häufigsten von uns verlangen",
    cas: [
      { title: "Vor dem Einsatz eine Bestandsaufnahme machen und danach die Wirkung messen", text: "Ein erster Durchgang vor einer Schulung oder einem Massnahmenplan, ein zweiter einige Monate später: Der Anteil der Risikosituationen wird zu einer Kennzahl, die Ihr Kunde versteht." },
      { title: "Auf eine heikle psychosoziale Situation reagieren", text: "Spannungen im Team, Folgen einer Inspektion, Meldung von Belästigung: Vertraulichkeit öffnet das Gespräch, und Sie erhalten ein Gesamtbild, bevor Sie die Personen treffen." },
      { title: "Wissen, wen Sie im Einzelgespräch sehen sollten", text: "Das Screening zeigt, welche Mitarbeitenden ein Gespräch brauchen, ohne auf das Jahresgespräch oder eine Krankschreibung zu warten. Sie setzen Ihre Zeit für sie ein." },
      { title: "Jene erreichen, die Einsätze vor Ort nicht erreichen", text: "Homeoffice, Nachtschichten, kleine abgelegene Standorte, Mitarbeitende mit einer anderen Sprache: Alle nehmen mit dem Smartphone teil, wann es ihnen passt." },
    ],
    etapesLabel: "So funktioniert's",
    etapesTitle: "Sie behalten jeden Schritt in der Hand",
    etapes: [
      { title: "Sie erstellen das Modul des Kunden", text: "Ihre Fachleute starten mit einer Vorlage oder ihren eigenen Werkzeugen und bauen das passende Modul für jedes Unternehmen: Bewegungen und Haltungen, psychosoziale Risiken, Fragebögen, Filmanleitungen." },
      { title: "Die Mitarbeitenden nehmen aus der Ferne teil", text: "Wenige Minuten pro Person, asynchron, über das Smartphone und ohne App-Installation. Keine E-Mail-Adresse nötig, eine pseudonyme Kennung genügt. ScanUp ist mit der HR-Software Lucca verbunden." },
      { title: "Ihre Fachleute beurteilen", text: "Ihre Fachleute analysieren die Situationen und verfassen ihre Schlussfolgerungen in der Plattform, mit einem Prüfschritt vor der Freigabe." },
      { title: "Sie greifen dort ein, wo es nötig ist", text: "Schulung, Einzelgespräch, Arbeitsplatzanpassung, Massnahmenplan in der Gefährdungsbeurteilung: Ihr Mehrwert konzentriert sich auf die Situationen, die ihn rechtfertigen." },
    ],
    essaiLabel: "Kostenloser Test",
    essaiTitle: "Vierzehn Tage zum Testen an einem echten Fall",
    essaiText: "Der Test beginnt mit Ihrer ersten Anmeldung. Damit er wirklich etwas bringt, bereiten wir ihn in einem kurzen Gespräch mit Ihnen vor und bleiben die ganze Zeit erreichbar.",
    essai: [
      { title: "Ihr Bereich ab dem ersten Tag bereit", text: "Ein Bereich auf Ihren Namen, mit Mustermodulen für Muskel-Skelett-Erkrankungen und psychosoziale Risiken, die Sie so verwenden oder anpassen können, und mit Gratis-Credits." },
      { title: "Ein Test mit einigen Mitarbeitenden", text: "Bei einem interessierten Kunden oder in Ihrem eigenen Team: Einige Mitarbeitende nehmen teil, und Ihre Fachleute bearbeiten die Antworten wie in einem echten Auftrag." },
      { title: "Eine Zwischenbilanz", text: "Zur Halbzeit besprechen wir mit Ihnen, was funktioniert, was angepasst werden muss und wie Sie es Ihren Kunden vorstellen." },
      { title: "Eine Bilanz für Ihre Entscheidung", text: "Am Ende wissen Sie, was das Werkzeug Ihrem Büro bringt und wie Sie es in Ihre Angebote einbauen. Ohne Verpflichtung." },
    ],
    securiteLabel: "Gesundheitsdaten",
    securiteTitle: "Ein Vertraulichkeitsrahmen, den Sie Ihren Kunden zeigen können",
    securiteText: "Die Frage nach den Gesundheitsdaten kommt immer, von der Geschäftsleitung wie von der Personalvertretung. Der Rahmen ist in die Plattform integriert.",
    securite: ["Hosting bei OVH, zertifizierter Hoster für Gesundheitsdaten (HDS)", "Verpixelung der Videos und Anonymisierung der Stimme standardmässig aktiv", "Zugang zu Gesundheitsdaten nur für die beurteilenden Fachleute, mit Zwei-Faktor-Authentifizierung", "Videos, Audio und Antworten werden nach 30 Tagen gelöscht; die Geschäftsleitung erhält nur aggregierte Daten", "SSO-Anmeldung mit dem Konto des Kundenunternehmens, zusätzlich zu pseudonymen Kennungen"],
    faqLabel: "Häufige Fragen",
    faqTitle: "Die Fragen der Beratungsbüros",
    faq: [
      { q: "Ersetzt ScanUp die Ergonomin oder den Psychologen?", a: "Nein. Die Plattform erhebt und ordnet die Daten; Ihre Fachleute analysieren und ziehen Schlüsse. ScanUp dient dazu, zu erkennen und zu priorisieren, damit Ihre Zeit vor Ort den Situationen zugutekommt, die sie brauchen." },
      { q: "Sollen wir unseren Kunden gegenüber von Screening sprechen?", a: "Sie wählen Ihre Worte. Viele Psychologinnen und Psychologen sprechen lieber vom Erkennen schwacher Signale oder von einer Bestandsaufnahme. Titel, Texte und Anleitungen der Module sind vollständig anpassbar." },
      { q: "Können wir unsere eigenen Fragebögen verwenden?", a: "Ja. Sie starten mit unseren Vorlagen oder erfassen eigene Fragen, Skalen und Anleitungen und verwenden sie von Kunde zu Kunde wieder." },
      { q: "Wer sieht die Ergebnisse?", a: "Gesundheitsdaten sind nur für Ihre Fachleute zugänglich. Sie entscheiden, ob die Mitarbeitenden ihr eigenes Ergebnis und den zugehörigen Rat sehen; der Arbeitgeber erhält nur aggregierte Daten." },
      { q: "In welchen Sprachen können die Mitarbeitenden antworten?", a: "Die Plattform ist auf Französisch, Englisch, Deutsch, Italienisch, Spanisch und Portugiesisch verfügbar, und Ihre Module können in jeder dieser Sprachen angeboten werden: praktisch für mehrsprachige Teams und Einsätze in der Schweiz." },
      { q: "Wie viel Zeit sollten wir einplanen?", a: "Mit einer Vorlage erstellen Sie ein erstes Modul rasch. Jede Person antwortet in wenigen Minuten; es bleibt die Analysezeit Ihrer Fachleute, die Sie als Leistung verrechnen." },
      { q: "Und wenn wir keine Zeit haben, selbst zu analysieren?", a: "Die Fachleute für Ergonomie und Psychologie von 360SkillVue können die Analyse ganz oder teilweise übernehmen, um Spitzen aufzufangen oder auf eine Ausschreibung zu antworten." },
    ],
    ctaTitle: "Die Plattform mit Ihren Fällen sehen",
    ctaText: "Wir zeigen Ihnen die Erstellung eines Moduls, den Ablauf für die Mitarbeitenden und die Analyse einer Situation, anhand eines Falls aus Ihrer Praxis. Dann bereiten wir gemeinsam Ihren Test vor.",
    ctaButton: "Kontakt aufnehmen",
  },
  it: {
    metaTitle: "Studi di salute sul lavoro",
    metaDescription: "ScanUp, lo strumento professionale degli studi di ergonomia e di rischi psicosociali: i vostri ergonomi e psicologi individuano a distanza le situazioni a rischio e i segnali deboli, a complemento dei loro interventi, su un hosting certificato per i dati sanitari (HDS).",
    heroBadge: "Studi, ergonomi e psicologi del lavoro",
    heroTitle: "Individuate a distanza, intervenite ",
    heroTitleHighlight: "dove siete utili",
    heroSubtitle: "ScanUp è lo strumento che i vostri ergonomi e psicologi del lavoro usano per raggiungere tutti i dipendenti di un cliente, compresi quelli che l'intervento in presenza non raggiunge mai. Creano i loro moduli, analizzano loro stessi le situazioni e colgono i segnali deboli. Voi mantenete l'esperienza e il campo; ScanUp vi dice dove andare.",
    heroCta: "Richiedere una dimostrazione",
    heroNote: "Prova gratuita di 14 giorni nel vostro spazio, con moduli modello pronti all'uso.",
    usagesLabel: "Tre usi",
    usagesTitle: "Che cosa ne fanno i vostri esperti",
    usages: [
      { title: "Mirare i vostri interventi in presenza", text: "L'individuazione a distanza copre tutto il personale e fa emergere le postazioni, i team e le persone da vedere per primi. Vi spostate dove il bisogno è accertato, con una prima diagnosi già fatta." },
      { title: "Raccogliere i dati sul campo in sicurezza", text: "Video di situazioni di lavoro, questionari, testimonianze audio: tutto è raccolto in un unico quadro, su un hosting certificato per i dati sanitari (HDS), anziché su telefoni e caselle e-mail." },
      { title: "Ampliare la vostra offerta senza assumere", text: "Coprite interi organici, più sedi, il lavoro notturno e più lingue con lo stesso team, e proponete ai clienti un quadro completo anziché un campione." },
    ],
    expertLabel: "L'esperto restate voi",
    expertTitle: "Un complemento al campo, non un sostituto",
    expertText: "È la prima domanda che pongono ergonomi e psicologi, ed è legittima. ScanUp non sostituisce né il vostro giudizio né la vostra presenza: smista, dà priorità e vi porta le situazioni che hanno bisogno di voi.",
    expert: [
      { title: "La vostra analisi, non quella di un algoritmo", text: "Sono i vostri valutatori a guardare i video, ascoltare le testimonianze e qualificare ogni situazione. La piattaforma raccoglie e organizza; l'analisi resta umana e vi appartiene." },
      { title: "Anche durante i vostri interventi in sede", text: "Durante una formazione o una visita, consegnate ai dipendenti una scheda con codice QR e identificativo: rispondono sul posto dal telefono, e voi ripartite con dati utilizzabili." },
      { title: "I vostri moduli, il vostro marchio", text: "Adattate i nostri modelli o create i vostri questionari e istruzioni, mestiere per mestiere. Lo spazio porta il vostro nome e il vostro logo: i clienti vedono il vostro studio." },
    ],
    casLabel: "Casi concreti",
    casTitle: "Che cosa ci chiedono più spesso gli studi",
    cas: [
      { title: "Fare il punto prima di intervenire e misurare l'impatto dopo", text: "Un primo passaggio prima di una formazione o di un piano d'azione, un secondo qualche mese dopo: il tasso di situazioni a rischio diventa un indicatore che il cliente capisce." },
      { title: "Rispondere a una situazione psicosociale delicata", text: "Tensioni in un team, seguito di un'ispezione, segnalazione di molestie: la riservatezza libera la parola e ottenete un quadro d'insieme prima di incontrare le persone." },
      { title: "Sapere chi vedere in colloquio individuale", text: "L'individuazione fa emergere i dipendenti che hanno bisogno di un colloquio, senza aspettare la valutazione annuale o l'assenza per malattia. Dedicate a loro il vostro tempo." },
      { title: "Raggiungere chi l'intervento in presenza non raggiunge", text: "Telelavoratori, squadre notturne, piccole sedi lontane, dipendenti che parlano un'altra lingua: ognuno partecipa dal telefono, quando gli è comodo." },
    ],
    etapesLabel: "Come funziona",
    etapesTitle: "Mantenete il controllo a ogni passo",
    etapes: [
      { title: "Create il modulo del cliente", text: "I vostri ergonomi e psicologi partono da un modello o dai loro strumenti per costruire il modulo adatto a ogni azienda: gesti e posture, rischi psicosociali, questionari, istruzioni per le riprese." },
      { title: "I dipendenti partecipano a distanza", text: "Pochi minuti a persona, in modo asincrono, dal telefono e senza app da installare. Non serve un indirizzo e-mail, basta un identificativo con pseudonimo. ScanUp è collegato al software HR Lucca." },
      { title: "I vostri esperti valutano", text: "I vostri valutatori analizzano le situazioni e redigono le conclusioni nella piattaforma, con un circuito di revisione prima della diffusione." },
      { title: "Intervenite dove serve", text: "Formazione, colloquio individuale, adattamento della postazione, piano d'azione integrato nella valutazione dei rischi: il vostro valore aggiunto si concentra sulle situazioni che lo giustificano." },
    ],
    essaiLabel: "Prova gratuita",
    essaiTitle: "Quattordici giorni per provarlo su un caso reale",
    essaiText: "La prova inizia al primo accesso. Perché sia davvero utile, la prepariamo con voi in un breve colloquio e restiamo disponibili per tutta la sua durata.",
    essai: [
      { title: "Il vostro spazio pronto dal primo giorno", text: "Uno spazio a vostro nome, con moduli modello per i disturbi muscoloscheletrici e i rischi psicosociali da usare così come sono o da adattare, e crediti gratuiti." },
      { title: "Un test con alcuni dipendenti", text: "Presso un cliente disponibile o nel vostro team: alcuni dipendenti partecipano e i vostri valutatori trattano le risposte come in un incarico reale." },
      { title: "Un punto a metà percorso", text: "A metà prova facciamo il punto con voi: che cosa funziona, che cosa va adattato, come presentarlo ai clienti." },
      { title: "Un bilancio per decidere", text: "Alla fine sapete che cosa lo strumento porta al vostro studio e come integrarlo nelle vostre offerte. Senza impegno." },
    ],
    securiteLabel: "Dati sanitari",
    securiteTitle: "Un quadro di riservatezza da mostrare ai vostri clienti",
    securiteText: "La questione dei dati sanitari arriva sempre, sia dalla direzione sia dalle rappresentanze del personale. Il dispositivo è integrato nella piattaforma.",
    securite: ["Hosting presso OVH, certificato per i dati sanitari (HDS)", "Sfocatura del video e anonimizzazione della voce attive per impostazione predefinita", "Accesso ai dati sanitari riservato ai valutatori, con doppia autenticazione", "Video, audio e risposte cancellati dopo 30 giorni; la direzione riceve solo dati aggregati", "Accesso SSO con l'account dell'azienda cliente, oltre agli identificativi con pseudonimo"],
    faqLabel: "Domande frequenti",
    faqTitle: "Le domande che pongono gli studi",
    faq: [
      { q: "ScanUp sostituisce l'ergonomo o lo psicologo?", a: "No. La piattaforma raccoglie e organizza i dati; sono i vostri valutatori ad analizzare e concludere. ScanUp serve a individuare e dare priorità, perché il vostro tempo sul campo vada alle situazioni che ne hanno bisogno." },
      { q: "Dobbiamo parlare di screening ai clienti?", a: "Scegliete voi le parole. Molti psicologi preferiscono parlare di individuazione dei segnali deboli o di quadro della situazione. Titoli, testi e istruzioni dei moduli sono interamente modificabili." },
      { q: "Possiamo usare i nostri questionari?", a: "Sì. Partite dai nostri modelli o inserite le vostre domande, scale e istruzioni, e le riutilizzate da un cliente all'altro." },
      { q: "Chi vede i risultati?", a: "I dati sanitari sono accessibili solo ai vostri valutatori. Decidete voi se il dipendente vede il proprio risultato e il consiglio associato; il datore di lavoro riceve solo dati aggregati." },
      { q: "In quali lingue possono rispondere i dipendenti?", a: "La piattaforma è disponibile in francese, inglese, tedesco, italiano, spagnolo e portoghese, e i vostri moduli possono essere proposti in ciascuna di queste lingue: pratico per i team multilingue e per gli interventi in Svizzera." },
      { q: "Quanto tempo bisogna prevedere?", a: "Partire da un modello permette di creare rapidamente un primo modulo. Ogni dipendente risponde in pochi minuti; resta il tempo di analisi dei vostri valutatori, che fatturate come una prestazione." },
      { q: "E se non abbiamo il tempo di analizzare noi stessi?", a: "Gli ergonomi e gli psicologi di 360SkillVue possono occuparsi dell'analisi di tutte o parte delle risposte, per assorbire un picco di attività o rispondere a una gara." },
    ],
    ctaTitle: "Vedere la piattaforma con i vostri casi",
    ctaText: "Vi mostriamo la creazione di un modulo, il percorso del dipendente e l'analisi di una situazione, a partire da un caso che incontrate. Poi prepariamo insieme la vostra prova.",
    ctaButton: "Contattarci",
  },
  es: {
    metaTitle: "Gabinetes de salud laboral",
    metaDescription: "ScanUp, la herramienta profesional de los gabinetes de ergonomía y de riesgos psicosociales: sus ergónomos y psicólogos detectan a distancia las situaciones de riesgo y las señales débiles, como complemento de sus intervenciones, en un alojamiento certificado para datos de salud (HDS).",
    heroBadge: "Gabinetes, ergónomos y psicólogos del trabajo",
    heroTitle: "Detecte a distancia, intervenga ",
    heroTitleHighlight: "donde es útil",
    heroSubtitle: "ScanUp es la herramienta que sus ergónomos y psicólogos del trabajo utilizan para llegar a todos los empleados de un cliente, incluidos los que la intervención presencial nunca alcanza. Crean sus módulos, analizan ellos mismos las situaciones y detectan las señales débiles. Usted conserva la experiencia y el terreno; ScanUp le indica adónde ir.",
    heroCta: "Solicitar una demostración",
    heroNote: "Prueba gratuita de 14 días en su propio espacio, con módulos modelo listos para usar.",
    usagesLabel: "Tres usos",
    usagesTitle: "Lo que hacen sus expertos con ella",
    usages: [
      { title: "Orientar sus intervenciones presenciales", text: "La detección a distancia cubre a toda la plantilla y señala los puestos, equipos y personas que conviene ver primero. Usted se desplaza donde la necesidad está establecida, con un primer diagnóstico ya hecho." },
      { title: "Recoger los datos de campo con seguridad", text: "Vídeos de situaciones de trabajo, cuestionarios, testimonios de audio: todo se recoge en un marco único, en un alojamiento certificado para datos de salud (HDS), en lugar de en teléfonos y buzones de correo." },
      { title: "Ampliar su oferta sin contratar", text: "Cubre plantillas enteras, varios centros, el trabajo nocturno y varios idiomas con el mismo equipo, y ofrece a sus clientes un diagnóstico completo en lugar de una muestra." },
    ],
    expertLabel: "Usted sigue siendo el experto",
    expertTitle: "Un complemento del terreno, no un sustituto",
    expertText: "Es la primera pregunta que hacen ergónomos y psicólogos, y es legítima. ScanUp no sustituye ni su criterio ni su presencia: clasifica, prioriza y le trae las situaciones que le necesitan.",
    expert: [
      { title: "Su análisis, no el de un algoritmo", text: "Sus evaluadores ven los vídeos, escuchan los testimonios y califican cada situación. La plataforma recoge y organiza; el análisis sigue siendo humano y le pertenece." },
      { title: "También durante sus intervenciones presenciales", text: "En una formación o una visita, entregue a los empleados una tarjeta con código QR e identificador: responden allí mismo desde su móvil, y usted se va con datos utilizables." },
      { title: "Sus módulos, su marca", text: "Adapte nuestros modelos o cree sus propios cuestionarios e instrucciones, oficio por oficio. El espacio lleva su nombre y su logotipo: sus clientes ven su gabinete." },
    ],
    casLabel: "Casos concretos",
    casTitle: "Lo que más nos piden los gabinetes",
    cas: [
      { title: "Hacer un diagnóstico antes de intervenir y medir el impacto después", text: "Una primera ronda antes de una formación o un plan de acción, una segunda unos meses después: la tasa de situaciones de riesgo se convierte en un indicador que su cliente entiende." },
      { title: "Responder a una situación psicosocial delicada", text: "Tensión en un equipo, seguimiento de una inspección, denuncia de acoso: la confidencialidad libera la palabra y usted obtiene una visión de conjunto antes de reunirse con las personas." },
      { title: "Saber a quién ver en entrevista individual", text: "La detección señala a los empleados que necesitan una conversación, sin esperar a la evaluación anual o a la baja laboral. Usted dedica su tiempo a ellos." },
      { title: "Llegar a quienes la intervención presencial no alcanza", text: "Teletrabajadores, equipos de noche, pequeños centros alejados, empleados que hablan otro idioma: cada uno participa desde su móvil, cuando le conviene." },
    ],
    etapesLabel: "Cómo funciona",
    etapesTitle: "Usted mantiene el control en cada etapa",
    etapes: [
      { title: "Usted crea el módulo del cliente", text: "Sus ergónomos y psicólogos parten de un modelo o de sus propias herramientas para construir el módulo adaptado a cada empresa: gestos y posturas, riesgos psicosociales, cuestionarios, instrucciones de grabación." },
      { title: "Los empleados participan a distancia", text: "Unos minutos por persona, de forma asíncrona, desde un móvil y sin aplicación que instalar. No se necesita correo electrónico, basta con un identificador con seudónimo. ScanUp está conectado al software de RR. HH. Lucca." },
      { title: "Sus expertos evalúan", text: "Sus evaluadores analizan las situaciones y redactan sus conclusiones en la plataforma, con un circuito de revisión antes de la difusión." },
      { title: "Usted interviene donde hace falta", text: "Formación, entrevista individual, adaptación del puesto, plan de acción integrado en la evaluación de riesgos: su valor añadido se concentra en las situaciones que lo justifican." },
    ],
    essaiLabel: "Prueba gratuita",
    essaiTitle: "Catorce días para probarla en un caso real",
    essaiText: "La prueba empieza con su primera conexión. Para que sea realmente útil, la preparamos con usted en una breve conversación y seguimos disponibles durante todo el periodo.",
    essai: [
      { title: "Su espacio listo desde el primer día", text: "Un espacio a su nombre, con módulos modelo de TME y de riesgos psicosociales que puede usar tal cual o adaptar, y créditos gratuitos." },
      { title: "Una prueba con algunos empleados", text: "En un cliente voluntario o en su propio equipo: algunos empleados participan y sus evaluadores tratan sus respuestas como en una misión real." },
      { title: "Un punto a mitad de camino", text: "A mitad de la prueba revisamos con usted lo que funciona, lo que hay que ajustar y cómo presentarlo a sus clientes." },
      { title: "Un balance para decidir", text: "Al final, sabe lo que la herramienta aporta a su gabinete y cómo integrarla en sus ofertas. Sin compromiso." },
    ],
    securiteLabel: "Datos de salud",
    securiteTitle: "Un marco de confidencialidad que puede mostrar a sus clientes",
    securiteText: "La cuestión de los datos de salud siempre aparece, tanto en la dirección como entre los representantes del personal. El dispositivo está integrado en la plataforma.",
    securite: ["Alojamiento en OVH, certificado como alojamiento de datos de salud (HDS)", "Desenfoque del vídeo y anonimización de la voz activados por defecto", "Acceso a los datos de salud reservado a los evaluadores, con doble autenticación", "Vídeos, audio y respuestas eliminados a los 30 días; la dirección solo recibe datos agregados", "Acceso SSO con la cuenta de la empresa cliente, además de los identificadores con seudónimo"],
    faqLabel: "Preguntas frecuentes",
    faqTitle: "Las preguntas que hacen los gabinetes",
    faq: [
      { q: "¿ScanUp sustituye al ergónomo o al psicólogo?", a: "No. La plataforma recoge y organiza los datos; sus evaluadores analizan y concluyen. ScanUp sirve para detectar y priorizar, para que su tiempo de terreno vaya a las situaciones que lo necesitan." },
      { q: "¿Debemos hablar de cribado con nuestros clientes?", a: "Usted elige sus palabras. Muchos psicólogos prefieren hablar de detección de señales débiles o de diagnóstico. Los títulos, textos e instrucciones de los módulos son totalmente modificables." },
      { q: "¿Podemos usar nuestros propios cuestionarios?", a: "Sí. Parte de nuestros modelos o introduce sus propias preguntas, escalas e instrucciones, y las reutiliza de un cliente a otro." },
      { q: "¿Quién ve los resultados?", a: "Los datos de salud solo son accesibles para sus evaluadores. Usted decide si el empleado ve su propio resultado y el consejo asociado; el empleador solo recibe datos agregados." },
      { q: "¿En qué idiomas pueden responder los empleados?", a: "La plataforma está disponible en francés, inglés, alemán, italiano, español y portugués, y sus módulos pueden ofrecerse en cada uno de estos idiomas: práctico para equipos multilingües y para intervenir en Suiza." },
      { q: "¿Cuánto tiempo hay que prever?", a: "Partir de un modelo permite crear rápidamente un primer módulo. Cada empleado responde en unos minutos; queda el tiempo de análisis de sus evaluadores, que usted factura como una prestación." },
      { q: "¿Y si no tenemos tiempo de analizar nosotros mismos?", a: "Los ergónomos y psicólogos de 360SkillVue pueden encargarse del análisis de todas o parte de las respuestas, para absorber un pico de actividad o responder a una licitación." },
    ],
    ctaTitle: "Ver la plataforma con sus casos",
    ctaText: "Le mostramos la creación de un módulo, el recorrido del empleado y el análisis de una situación, a partir de un caso que usted encuentra. Después preparamos juntos su prueba.",
    ctaButton: "Contactar",
  },
  pt: {
    metaTitle: "Gabinetes de saúde ocupacional",
    metaDescription: "ScanUp, a ferramenta profissional dos gabinetes de ergonomia e de riscos psicossociais: os seus ergonomistas e psicólogos identificam à distância as situações de risco e os sinais fracos, em complemento das suas intervenções, num alojamento certificado para dados de saúde (HDS).",
    heroBadge: "Gabinetes, ergonomistas e psicólogos do trabalho",
    heroTitle: "Identifique à distância, intervenha ",
    heroTitleHighlight: "onde é útil",
    heroSubtitle: "O ScanUp é a ferramenta que os seus ergonomistas e psicólogos do trabalho utilizam para chegar a todos os colaboradores de um cliente, incluindo aqueles que a intervenção presencial nunca alcança. Criam os seus módulos, analisam eles próprios as situações e identificam os sinais fracos. Fica com a especialização e o terreno; o ScanUp diz-lhe onde ir.",
    heroCta: "Pedir uma demonstração",
    heroNote: "Teste gratuito de 14 dias no seu próprio espaço, com módulos modelo prontos a usar.",
    usagesLabel: "Três utilizações",
    usagesTitle: "O que os seus especialistas fazem com ela",
    usages: [
      { title: "Direcionar as suas intervenções presenciais", text: "A identificação à distância abrange todos os colaboradores e destaca os postos, as equipas e as pessoas a ver primeiro. Desloca-se onde a necessidade está estabelecida, com um primeiro diagnóstico já feito." },
      { title: "Recolher os dados de terreno em segurança", text: "Vídeos de situações de trabalho, questionários, testemunhos em áudio: tudo é recolhido num quadro único, num alojamento certificado para dados de saúde (HDS), em vez de em telemóveis e caixas de correio." },
      { title: "Alargar a sua oferta sem recrutar", text: "Abrange equipas inteiras, vários locais, o trabalho noturno e várias línguas com a mesma equipa, e oferece aos seus clientes um levantamento completo em vez de uma amostra." },
    ],
    expertLabel: "Continua a ser o especialista",
    expertTitle: "Um complemento do terreno, não um substituto",
    expertText: "É a primeira pergunta que ergonomistas e psicólogos fazem, e é legítima. O ScanUp não substitui nem o seu olhar nem a sua presença: seleciona, prioriza e traz-lhe as situações que precisam de si.",
    expert: [
      { title: "A sua análise, não a de um algoritmo", text: "São os seus avaliadores que veem os vídeos, ouvem os testemunhos e qualificam cada situação. A plataforma recolhe e organiza; a análise continua humana e pertence-lhe." },
      { title: "Também durante as suas intervenções no local", text: "Numa formação ou numa visita, entregue aos colaboradores um cartão com código QR e identificador: respondem ali mesmo, a partir do telemóvel, e sai com dados utilizáveis." },
      { title: "Os seus módulos, a sua marca", text: "Adapte os nossos modelos ou crie os seus próprios questionários e instruções, profissão a profissão. O espaço tem o seu nome e o seu logótipo: os seus clientes veem o seu gabinete." },
    ],
    casLabel: "Casos concretos",
    casTitle: "O que os gabinetes mais nos pedem",
    cas: [
      { title: "Fazer um levantamento antes de intervir e medir o impacto depois", text: "Uma primeira ronda antes de uma formação ou de um plano de ação, uma segunda alguns meses depois: a taxa de situações de risco torna-se um indicador que o seu cliente compreende." },
      { title: "Responder a uma situação psicossocial sensível", text: "Tensão numa equipa, seguimento de uma inspeção, denúncia de assédio: a confidencialidade liberta a palavra e obtém uma visão de conjunto antes de encontrar as pessoas." },
      { title: "Saber quem ver em entrevista individual", text: "A identificação destaca os colaboradores que precisam de uma conversa, sem esperar pela avaliação anual ou pela baixa médica. Dedica-lhes o seu tempo." },
      { title: "Chegar a quem a intervenção presencial não alcança", text: "Teletrabalhadores, equipas noturnas, pequenos locais afastados, colaboradores que falam outra língua: cada um participa a partir do telemóvel, quando lhe convém." },
    ],
    etapesLabel: "Como funciona",
    etapesTitle: "Mantém o controlo em cada etapa",
    etapes: [
      { title: "Cria o módulo do cliente", text: "Os seus ergonomistas e psicólogos partem de um modelo ou das suas próprias ferramentas para construir o módulo adaptado a cada empresa: gestos e posturas, riscos psicossociais, questionários, instruções de filmagem." },
      { title: "Os colaboradores participam à distância", text: "Alguns minutos por pessoa, de forma assíncrona, a partir de um telemóvel e sem aplicação para instalar. Não é preciso endereço de e-mail, basta um identificador com pseudónimo. O ScanUp está ligado ao software de RH Lucca." },
      { title: "Os seus especialistas avaliam", text: "Os seus avaliadores analisam as situações e redigem as suas conclusões na plataforma, com um circuito de revisão antes da divulgação." },
      { title: "Intervém onde é preciso", text: "Formação, entrevista individual, adaptação do posto, plano de ação integrado na avaliação de riscos: o seu valor acrescentado concentra-se nas situações que o justificam." },
    ],
    essaiLabel: "Teste gratuito",
    essaiTitle: "Catorze dias para o experimentar num caso real",
    essaiText: "O teste começa no seu primeiro acesso. Para que seja realmente útil, preparamo-lo consigo numa breve conversa e ficamos disponíveis durante todo o período.",
    essai: [
      { title: "O seu espaço pronto no primeiro dia", text: "Um espaço em seu nome, com módulos modelo de LMERT e de riscos psicossociais que pode usar tal como estão ou adaptar, e créditos oferecidos." },
      { title: "Um teste com alguns colaboradores", text: "Num cliente interessado ou na sua própria equipa: alguns colaboradores participam e os seus avaliadores tratam as respostas como numa missão real." },
      { title: "Um ponto a meio do percurso", text: "A meio do teste fazemos o ponto consigo: o que funciona, o que é preciso ajustar, como o apresentar aos seus clientes." },
      { title: "Um balanço para decidir", text: "No fim, sabe o que a ferramenta traz ao seu gabinete e como a integrar nas suas ofertas. Sem compromisso." },
    ],
    securiteLabel: "Dados de saúde",
    securiteTitle: "Um quadro de confidencialidade que pode mostrar aos seus clientes",
    securiteText: "A questão dos dados de saúde surge sempre, tanto na direção como entre os representantes dos trabalhadores. O dispositivo está integrado na plataforma.",
    securite: ["Alojamento na OVH, certificado para dados de saúde (HDS)", "Desfocagem do vídeo e anonimização da voz ativadas por defeito", "Acesso aos dados de saúde reservado aos avaliadores, com dupla autenticação", "Vídeos, áudio e respostas apagados ao fim de 30 dias; a direção só recebe dados agregados", "Acesso SSO com a conta da empresa cliente, além dos identificadores com pseudónimo"],
    faqLabel: "Perguntas frequentes",
    faqTitle: "As perguntas que os gabinetes fazem",
    faq: [
      { q: "O ScanUp substitui o ergonomista ou o psicólogo?", a: "Não. A plataforma recolhe e organiza os dados; são os seus avaliadores que analisam e concluem. O ScanUp serve para identificar e priorizar, para que o seu tempo de terreno vá para as situações que precisam dele." },
      { q: "Devemos falar de rastreio aos nossos clientes?", a: "Escolhe as suas palavras. Muitos psicólogos preferem falar de identificação de sinais fracos ou de levantamento. Os títulos, textos e instruções dos módulos são totalmente editáveis." },
      { q: "Podemos usar os nossos próprios questionários?", a: "Sim. Parte dos nossos modelos ou introduz as suas próprias perguntas, escalas e instruções, e reutiliza-as de um cliente para outro." },
      { q: "Quem vê os resultados?", a: "Os dados de saúde só são acessíveis aos seus avaliadores. Decide se o colaborador vê o seu próprio resultado e o conselho associado; o empregador só recebe dados agregados." },
      { q: "Em que línguas podem os colaboradores responder?", a: "A plataforma está disponível em francês, inglês, alemão, italiano, espanhol e português, e os seus módulos podem ser propostos em cada uma destas línguas: prático para equipas multilingues e para intervenções na Suíça." },
      { q: "Quanto tempo é preciso prever?", a: "Partir de um modelo permite criar rapidamente um primeiro módulo. Cada colaborador responde em poucos minutos; resta o tempo de análise dos seus avaliadores, que fatura como uma prestação." },
      { q: "E se não tivermos tempo para analisar nós próprios?", a: "Os ergonomistas e psicólogos da 360SkillVue podem encarregar-se da análise de todas ou de parte das respostas, para absorver um pico de atividade ou responder a um concurso." },
    ],
    ctaTitle: "Ver a plataforma com os seus casos",
    ctaText: "Mostramos-lhe a criação de um módulo, o percurso do colaborador e a análise de uma situação, a partir de um caso que encontra. Depois preparamos juntos o seu teste.",
    ctaButton: "Contactar-nos",
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
const EXPERT_ICONS = [UserCheck, MapPin, Palette];

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

      {/* ─── VOUS RESTEZ L'EXPERT ──────────────────────────────── */}
      {t.expert && (
        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <FadeIn className="text-center mb-14 max-w-3xl mx-auto">
              <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.expertLabel}</p>
              <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight mb-4">{t.expertTitle}</h2>
              <p className="text-[16px] text-scanup-graytext leading-relaxed">{t.expertText}</p>
            </FadeIn>
            <div className="grid md:grid-cols-3 gap-6">
              {t.expert.map((u, i) => {
                const Icon = EXPERT_ICONS[i] ?? UserCheck;
                return (
                  <FadeIn key={i} delay={i * 0.08}>
                    <div className="h-full bg-scanup-lightblue/40 border border-scanup-graylight rounded-[16px] p-7">
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
      )}

      {/* ─── CAS CONCRETS ──────────────────────────────────────── */}
      {t.cas && (
        <section className="px-6 py-20 bg-scanup-graylight/50">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14">
              <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.casLabel}</p>
              <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight">{t.casTitle}</h2>
            </FadeIn>
            <div className="grid sm:grid-cols-2 gap-6">
              {t.cas.map((c, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="h-full bg-white border border-scanup-graylight rounded-[16px] p-7">
                    <div className="text-[11px] text-scanup-blue font-semibold uppercase tracking-widest mb-3">{String(i + 1).padStart(2, '0')}</div>
                    <h3 className="text-[18px] font-semibold mb-2 leading-snug">{c.title}</h3>
                    <p className="text-[15px] text-scanup-graytext leading-relaxed">{c.text}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* ─── ESSAI ─────────────────────────────────────────────── */}
      {t.essai && (
        <section className="px-6 py-20 bg-scanup-graylight/50">
          <div className="max-w-5xl mx-auto">
            <FadeIn className="text-center mb-14 max-w-3xl mx-auto">
              <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.essaiLabel}</p>
              <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight mb-4">{t.essaiTitle}</h2>
              <p className="text-[16px] text-scanup-graytext leading-relaxed">{t.essaiText}</p>
            </FadeIn>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {t.essai.map((e, i) => (
                <FadeIn key={i} delay={i * 0.06}>
                  <div className="h-full bg-white border border-scanup-graylight rounded-[16px] p-6">
                    <span className="inline-flex w-9 h-9 rounded-full bg-scanup-blue text-white font-semibold items-center justify-center mb-4">{i + 1}</span>
                    <h3 className="text-[17px] font-semibold mb-2 leading-snug">{e.title}</h3>
                    <p className="text-[14px] text-scanup-graytext leading-relaxed">{e.text}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* ─── FAQ ───────────────────────────────────────────────── */}
      {t.faq && (
        <section className="px-6 py-20 bg-white">
          <div className="max-w-3xl mx-auto">
            <FadeIn className="text-center mb-12">
              <p className="text-[13px] uppercase tracking-widest font-semibold text-scanup-blue mb-3">{t.faqLabel}</p>
              <h2 className="text-[28px] md:text-[38px] font-bold tracking-tight">{t.faqTitle}</h2>
            </FadeIn>
            <div className="space-y-3">
              {t.faq.map((f, i) => (
                <details key={i} className="group bg-white border border-scanup-graylight rounded-[14px] px-6 py-4">
                  <summary className="flex justify-between items-center gap-4 cursor-pointer list-none text-[16px] font-semibold">
                    {f.q}
                    <ChevronDown size={18} className="shrink-0 text-scanup-blue transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-[15px] text-scanup-graytext leading-relaxed mt-3">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

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
