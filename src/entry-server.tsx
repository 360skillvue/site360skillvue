/**
 * Point d'entree du pre-rendu du contenu (voir scripts/prerender-content.mjs).
 *
 * Pourquoi : les robots des moteurs de reponse (ChatGPT, Perplexity, Claude,
 * Gemini, Copilot) et une partie des robots d'indexation ne lancent pas le
 * JavaScript. Sans ce pre-rendu, ils ne voient qu'une page vide. On ecrit donc
 * le texte de chaque page directement dans le HTML ; l'application React
 * remplace ensuite ce contenu au chargement, sans changement pour le visiteur.
 */
import { prerenderToNodeStream } from 'react-dom/static';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <HelmetProvider context={{}}>
      <App location={url} />
    </HelmetProvider>,
  );
  const chunks: Buffer[] = [];
  for await (const c of prelude) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks).toString('utf8');
}
