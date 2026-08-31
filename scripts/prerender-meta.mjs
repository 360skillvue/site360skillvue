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
const ROUTES = [
  { path: '/',                               pick: t => t.meta.home },
  { path: '/certification-periodique-sante', pick: t => t.meta.certification },
  { path: '/entreprises-drh',                pick: t => t.meta.entreprises },
  { path: '/assureurs-mutuelles',            pick: t => t.meta.assureurs },
  { path: '/spsti',                          pick: t => ({ title: t.spsti.metaTitle, description: t.spsti.metaDescription }) },
  { path: '/partenaires',                    pick: t => t.meta.partenaires },
  { path: '/aide-support',                   pick: t => t.meta.aide },
  { path: '/tarifs',                         pick: t => t.meta.tarifs },
  { path: '/mentions-legales',               pick: t => t.meta.mentions },
  { path: '/cgu',                            pick: t => t.meta.cgu },
  { path: '/cgv',                            pick: t => t.meta.cgv },
  { path: '/politique-confidentialite',      pick: t => t.meta.confidentialite },
  { path: '/a-propos',                       pick: t => t.meta.apropos },
  { path: '/revue-de-presse',                pick: t => ({ title: t.revueDePresse.metaTitle, description: t.revueDePresse.metaDescription }) },
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
  const { title, description } = route.pick(t);
  const fullTitle = `${title} | ScanUp 360SkillVue`;
  const url = `${BASE}${localizePath(route.path, lang)}`;

  const alternates = [
    ...LANGS.map(l =>
      `    <link rel="alternate" hreflang="${l}" href="${BASE}${localizePath(route.path, l)}" />`
    ),
    `    <link rel="alternate" hreflang="x-default" href="${BASE}${localizePath(route.path, 'fr')}" />`,
    `    <link rel="canonical" href="${url}" />`,
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

// vercel.json : le simulateur d'abord, puis les pages pre-rendues, puis le
// repli general vers l'application React.
const vercelPath = join(ROOT, 'vercel.json');
const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
vercel.rewrites = [
  { source: '/simulateur-cout-tms-rps', destination: '/simulateur-cout-tms-rps.html' },
  ...rewrites,
  { source: '/(.*)', destination: '/index.html' },
];
writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, 'utf8');

console.log(`Pre-rendu : ${count} pages, ${rewrites.length} rewrites dans vercel.json.`);
