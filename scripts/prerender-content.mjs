/**
 * Pre-rendu du contenu des pages, apres scripts/prerender-meta.mjs.
 *
 * Pour chaque page HTML produite par prerender-meta, on calcule le HTML de la
 * page avec React (rendu serveur, sans navigateur) et on l'ecrit dans
 * <div id="root">. Les robots qui ne lancent pas le JavaScript lisent ainsi
 * le vrai texte de la page. Dans le navigateur, main.tsx monte l'application
 * normalement et remplace ce contenu.
 *
 * Si une page ne se rend pas cote serveur (par exemple la carte Leaflet des
 * partenaires, qui exige un navigateur), on la laisse telle quelle : elle
 * garde ses balises meta et fonctionne comme avant.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'www');
// vite.config.ts fixe le nom du point d'entree a assets/app.js, y compris pour ce build.
const SSR = join(ROOT, '.ssr', 'assets', 'app.js');

// Pages servies telles quelles, a ne pas toucher.
const SKIP = new Set(['404.html', 'confirmation.html']);

function listPages(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'assets') continue;
      files.push(...listPages(full));
    } else if (name === 'index.html') {
      files.push(full);
    }
  }
  return files;
}

function urlOf(file) {
  const rel = relative(OUT, dirname(file)).split(sep).join('/');
  return rel === '' ? '/' : `/${rel}`;
}

const MARK = '<div id="root"></div>';

const { render } = await import(pathToFileURL(SSR).href);

let ok = 0;
const ko = [];
for (const file of listPages(OUT)) {
  if (SKIP.has(relative(OUT, file))) continue;
  const html = readFileSync(file, 'utf8');
  if (!html.includes(MARK)) continue;
  const url = urlOf(file);
  try {
    let body = await render(url);
    // Les balises title, meta et link de react-helmet sont deja dans le <head>
    // grace a prerender-meta : on ne les recopie pas dans le corps.
    body = body
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/g, '')
      .replace(/<meta\b[^>]*>/g, '')
      .replace(/<link\b[^>]*>/g, '');
    if (!body || body.length < 200) throw new Error('rendu vide');
    // <!--$!--> : React a bascule une partie de la page en rendu navigateur
    // (erreur cote serveur). On garde alors la page d'origine.
    if (body.includes('<!--$!-->')) throw new Error('rendu serveur impossible');
    writeFileSync(file, html.replace(MARK, `<div id="root">${body}</div>`), 'utf8');
    ok++;
  } catch (e) {
    ko.push(`${url} (${String(e && e.message || e).slice(0, 80)})`);
  }
}
console.log(`Pre-rendu du contenu : ${ok} pages ecrites${ko.length ? `, ${ko.length} laissees en l'etat : ${ko.join(', ')}` : ''}.`);
