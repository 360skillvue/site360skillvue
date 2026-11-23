/**
 * Pre-rendu des balises de partage, une page HTML statique par URL publique.
 *
 * Pourquoi : le site est une application React rendue dans le navigateur.
 * Les robots de LinkedIn, WhatsApp, Slack, Facebook et X ne lancent pas le
 * JavaScript ; ils lisent le HTML brut, donc toujours le meme index.html,
 * donc toujours le meme titre. Ce script ecrit, pour chaque URL, une copie
 * d'index.html dont le title, la description et les balises Open Graph sont
 * ceux de la page. L'application React se charge ensuite normalement.
 *
 * Lance automatiquement apres "vite build" (voir package.json).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'www');
const BASE = 'https://360skillvue.com';

const LANGS = ['fr', 'en', 'de', 'it', 'es', 'pt'];
const OG_LOCALE = {
  fr: 'fr_FR', en: 'en_GB', de: 'de_DE', it: 'it_IT', es: 'es_ES', pt: 'pt_PT',
};

/**
 * Chemins publics et emplacement du titre et de la description dans les
 * fichiers de traduction. Doit rester aligne sur PAGES dans src/App.tsx.
 */
/** Titre et description de la page « cabinets de santé au travail », par langue. */
const CABINETS_META = {
  fr: { title: 'Cabinets de santé au travail', description: "ScanUp, outil métier des cabinets de conseil en ergonomie et en RPS : vos ergonomes et psychologues créent leurs modules, mènent les évaluations à distance et recueillent les données terrain sur un hébergement certifié HDS." },
  en: { title: 'Occupational health consultancies', description: 'ScanUp as a professional tool for ergonomics and psychosocial risk consultancies: your experts build their own modules, run remote assessments and collect field data on health-data certified hosting.' },
  de: { title: 'Beratungsbüros für Arbeitsgesundheit', description: 'ScanUp als Fachwerkzeug für Ergonomie- und Psychosozialberatungen: Ihre Fachleute erstellen eigene Module, führen Beurteilungen aus der Ferne durch und erheben Felddaten auf zertifiziertem Gesundheitsdaten-Hosting.' },
  it: { title: 'Studi di salute sul lavoro', description: 'ScanUp come strumento professionale per studi di ergonomia e rischi psicosociali: i vostri esperti creano i propri moduli, conducono le valutazioni a distanza e raccolgono i dati sul campo in sicurezza.' },
  es: { title: 'Gabinetes de salud laboral', description: 'ScanUp como herramienta profesional para gabinetes de ergonomía y riesgos psicosociales: sus expertos crean sus módulos, evalúan a distancia y recogen los datos de campo con seguridad.' },
  pt: { title: 'Gabinetes de saúde no trabalho', description: 'A ScanUp como ferramenta profissional para gabinetes de ergonomia e riscos psicossociais: os vossos especialistas criam os seus módulos, avaliam à distância e recolhem os dados de terreno em segurança.' },
};

/** Titre et description de la page « essai gratuit », par langue (mêmes valeurs que ESSAI_META dans src/components/EssaiScanup.tsx). */
const ESSAI_META = {
  fr: { title: 'Tester ScanUp gratuitement', description: "Testez ScanUp gratuitement en 10 minutes, comme un de vos salariés : questionnaire et témoignage audio RPS, vidéo TMS depuis votre téléphone. Sans engagement, données supprimées au bout de 30 jours." },
  en: { title: 'Try ScanUp for free', description: 'Try ScanUp for free in 10 minutes, as one of your employees would: psychosocial risk questionnaire and audio testimony, MSD video from your phone. No commitment, data deleted after 30 days.' },
  de: { title: 'ScanUp kostenlos testen', description: 'Testen Sie ScanUp kostenlos in 10 Minuten, wie Ihre Mitarbeitenden: Fragebogen und Audio-Statement zu psychosozialen Risiken, MSE-Video mit dem Smartphone. Unverbindlich, Daten nach 30 Tagen gelöscht.' },
  it: { title: 'Prova ScanUp gratis', description: 'Prova ScanUp gratis in 10 minuti, come uno dei tuoi collaboratori: questionario e testimonianza audio sui rischi psicosociali, video DMS dal telefono. Senza impegno, dati cancellati dopo 30 giorni.' },
  es: { title: 'Probar ScanUp gratis', description: 'Pruebe ScanUp gratis en 10 minutos, como uno de sus empleados: cuestionario y testimonio de audio sobre riesgos psicosociales, vídeo TME desde su teléfono. Sin compromiso, datos eliminados a los 30 días.' },
  pt: { title: 'Testar a ScanUp grátis', description: 'Teste a ScanUp grátis em 10 minutos, como um dos seus colaboradores: questionário e testemunho áudio sobre riscos psicossociais, vídeo LMERT no telemóvel. Sem compromisso, dados apagados ao fim de 30 dias.' },
};

const ROUTES = [
  { path: '/',                               pick: t => t.meta.home },
  { path: '/entreprises-drh',                pick: t => t.meta.entreprises },
  { path: '/assureurs-mutuelles',            pick: t => t.meta.assureurs },
  { path: '/spsti',                          pick: t => ({ title: t.spsti.metaTitle, description: t.spsti.metaDescription }) },
  { path: '/cabinets-sante-travail',         pick: (t, lang) => CABINETS_META[lang] },
  { path: '/partenaires',                    pick: t => t.meta.partenaires },
  { path: '/aide-support',                   pick: t => t.meta.aide },
  { path: '/tarifs',                         pick: t => t.meta.tarifs, ogImage: '/og-tarifs.png' },
  { path: '/mentions-legales',               pick: t => t.meta.mentions, noindexTranslations: true },
  { path: '/cgu',                            pick: t => t.meta.cgu, noindexTranslations: true },
  { path: '/cgv',                            pick: t => t.meta.cgv, noindexTranslations: true },
  { path: '/politique-confidentialite',      pick: t => t.meta.confidentialite, noindexTranslations: true },
  { path: '/a-propos',                       pick: t => t.meta.apropos },
  { path: '/revue-de-presse',                pick: t => ({ title: t.revueDePresse.metaTitle, description: t.revueDePresse.metaDescription }) },
  { path: '/essai-gratuit',                  pick: (t, lang) => ESSAI_META[lang], ogImage: '/og-essai-audio-video.png' },
];

function localizePath(path, lang) {
  if (lang === 'fr') return path;
  return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Charge les fichiers de traduction TypeScript en les compilant a la volee. */
async function loadTranslations() {
  const tmp = join(ROOT, '.tmp-i18n.mjs');
  await build({
    stdin: {
      contents: LANGS.map(l => `export { ${l} } from './src/i18n/${l}';`).join('\n'),
      resolveDir: ROOT,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: tmp,
    logLevel: 'silent',
  });
  const mod = await import(`${tmp}?t=${Date.now()}`);
  rmSync(tmp, { force: true });
  return mod;
}

// Le gabarit est index.html tel que produit par Vite. On enleve d'eventuelles
// balises canonical ou alternate deja injectees, pour que deux executions
// successives ne les empilent pas.
const template = readFileSync(join(OUT, 'index.html'), 'utf8')
  .replace(/^[ \t]*<link rel="(?:alternate|canonical)"[^>]*>\n/gm, '');

function renderPage(route, lang, t) {
  const { title, description } = route.pick(t, lang);
  const fullTitle = `${title} | ScanUp 360SkillVue`;
  const url = `${BASE}${localizePath(route.path, lang)}`;

  // Pages legales : le contenu reste en francais dans toutes les langues. Les
  // versions traduites sont exclues de l'index et designent la version
  // francaise comme canonique ; pas de hreflang, faute de vraie traduction.
  // Meme logique que la prop noindexTranslations de src/components/PageMeta.tsx.
  const frOnly = route.noindexTranslations === true;
  const canonical = frOnly ? `${BASE}${localizePath(route.path, 'fr')}` : url;
  const alternates = [
    ...(frOnly ? [] : [
      ...LANGS.map(l =>
        `    <link rel="alternate" hreflang="${l}" href="${BASE}${localizePath(route.path, l)}" />`
      ),
      `    <link rel="alternate" hreflang="x-default" href="${BASE}${localizePath(route.path, 'fr')}" />`,
    ]),
    `    <link rel="canonical" href="${canonical}" />`,
    ...(frOnly && lang !== 'fr' ? ['    <meta name="robots" content="noindex, follow" />'] : []),
  ].join('\n');

  let html = template;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(description)}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/>/,
    `<meta property="og:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${esc(description)}" />`
  );
  html = html.replace(
    /<meta property="og:locale" content="[^"]*"\s*\/>/,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/>/,
    `<meta name="twitter:title" content="${esc(title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${esc(description)}" />`
  );
  // Image d'aperçu propre à la page (même valeur que la prop ogImage de PageMeta).
  if (route.ogImage) {
    html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*("\s*\/>)/g, `$1${BASE}${route.ogImage}$2`);
  }
  html = html.replace('</head>', `${alternates}\n  </head>`);
  return html;
}

const t = await loadTranslations();
const rewrites = [];
let count = 0;

for (const lang of LANGS) {
  for (const route of ROUTES) {
    const path = localizePath(route.path, lang);
    const html = renderPage(route, lang, t[lang]);

    if (path === '/') {
      writeFileSync(join(OUT, 'index.html'), html, 'utf8');
    } else {
      const dir = join(OUT, path.slice(1));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.html'), html, 'utf8');
      rewrites.push({ source: path, destination: `${path}/index.html` });
    }
    count++;
  }
}

// Page 404 statique. Vercel la sert automatiquement, avec le vrai statut HTTP
// 404, pour toute adresse qui ne correspond a aucun fichier ni a aucune regle.
// Avant, un repli general renvoyait index.html en 200 pour n'importe quelle
// adresse, d'ou les "Soft 404" et les "Autre page avec balise canonique" dans
// la Search Console. React affiche ensuite la page introuvable habituelle.
{
  const nf = t.fr.meta.introuvable;
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(nf.title)} | ScanUp 360SkillVue</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/>/,
    `<meta name="description" content="${esc(nf.description)}" />`
  );
  html = html.replace('</head>', `    <meta name="robots" content="noindex, follow" />\n  </head>`);
  writeFileSync(join(OUT, '404.html'), html, 'utf8');
}

// Gabarit des pages de confirmation Calendly : application React, sans
// canonical ni alternate, et hors index (page de remerciement).
{
  let html = template.replace('</head>', `    <meta name="robots" content="noindex, follow" />\n  </head>`);
  writeFileSync(join(OUT, 'confirmation.html'), html, 'utf8');
}

// vercel.json : les pages statiques d'abord, puis les pages pre-rendues, puis
// les pages de confirmation Calendly (servies par l'application React).
// PAS de repli general : une adresse inconnue doit repondre 404.
// Toute nouvelle page statique deposee dans public/ doit etre ajoutee ici,
// sinon sa regle de reecriture est perdue au prochain build.
const STATIC_PAGES = [
  '/simulateur-cout-tms-rps',
  '/formation-risques-psychosociaux',
];
const APP_ONLY_PAGES = [
  '/demande-calendly-bien-recue',
  '/en/appointment-confirmation',
  '/de/terminbestaetigung',
];

// Anciennes adresses de l'epoque WordPress, relevees dans la Search Console,
// renvoyees en 301 vers la page equivalente du site actuel.
const LEGACY_REDIRECTS = [
  ['/sitemap_index.xml', '/sitemap.xml'],
  ['/wp-sitemap.xml', '/sitemap.xml'],
  ['/page-sitemap.xml', '/sitemap.xml'],
  ['/post-sitemap.xml', '/sitemap.xml'],
  ['/contact', '/aide-support'],
  ['/nous-contacter', '/aide-support'],
  ['/questions-frequentes', '/aide-support'],
  ['/faq', '/aide-support'],
  ['/tarifs-2', '/tarifs'],
  ['/ch/tarifs', '/tarifs'],
  ['/ch/tarifs-2', '/tarifs'],
  ['/ch', '/'],
  ['/ch/:path*', '/'],
  ['/author/:path*', '/'],
  ['/en/home', '/en'],
  ['/en/home-english', '/en'],
  ['/en/contact-us', '/en/aide-support'],
  ['/en/contact', '/en/aide-support'],
  ['/en/about', '/en/a-propos'],
  ['/en/about-2', '/en/a-propos'],
  ['/en/about-us', '/en/a-propos'],
  ['/en/pricing', '/en/tarifs'],
  ['/de/unser-ansatz', '/de/a-propos'],
  ['/de/ueber-uns', '/de/a-propos'],
  ['/de/preise', '/de/tarifs'],
  ['/de/kontakt', '/de/aide-support'],
  ['/:lang(en|de|it|es|pt)/simulateur-cout-tms-rps', '/simulateur-cout-tms-rps'],
  // La certification périodique est présentée sur le site de Biologie e-learning.
  ['/certification-periodique-sante', 'https://www.biologie-elearning.fr/'],
  ['/:lang(en|de|it|es|pt)/certification-periodique-sante', 'https://www.biologie-elearning.fr/'],
  ['/blog', '/'],
  ['/blog/:path*', '/'],
];

const vercelPath = join(ROOT, 'vercel.json');
const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
vercel.trailingSlash = false;
vercel.redirects = LEGACY_REDIRECTS.map(([source, destination]) => ({
  source,
  destination,
  permanent: true,
}));
vercel.rewrites = [
  ...STATIC_PAGES.map((p) => ({ source: p, destination: `${p}.html` })),
  ...rewrites,
  ...APP_ONLY_PAGES.map((p) => ({ source: p, destination: '/confirmation.html' })),
];
writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, 'utf8');

console.log(`Pre-rendu : ${count} pages, ${rewrites.length} rewrites dans vercel.json.`);
