import { Helmet } from 'react-helmet-async';
import { useLanguage, LANGUAGES, HREFLANG, localizePath, type Lang } from '../i18n';

interface Props {
  title: string;
  description: string;
  /** Chemin de la page, sans prefixe de langue, par exemple /tarifs */
  path: string;
  ogImage?: string;
  schema?: object;
}

const BASE = 'https://360skillvue.com';
const DEFAULT_OG_IMAGE = `${BASE}/og-image.svg`;

export default function PageMeta({ title, description, path, ogImage, schema }: Props) {
  const { lang } = useLanguage();
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  // Le chemin recu peut deja porter un prefixe (pages de confirmation) : on le
  // laisse tel quel dans ce cas, sinon on le localise.
  const dejaPrefixe = LANGUAGES.some(l => l.code !== 'fr' && path.startsWith(`/${l.code}/`));
  const url = dejaPrefixe ? `${BASE}${path}` : `${BASE}${localizePath(path, lang)}`;

  return (
    <Helmet>
      <html lang={HREFLANG[lang]} />
      <title>{title} | ScanUp 360SkillVue</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Versions linguistiques : sans ces balises, Google ne sait pas que ces
          pages sont les traductions les unes des autres. */}
      {!dejaPrefixe && LANGUAGES.map(l => (
        <link
          key={l.code}
          rel="alternate"
          hrefLang={HREFLANG[l.code as Lang]}
          href={`${BASE}${localizePath(path, l.code as Lang)}`}
        />
      ))}
      {!dejaPrefixe && (
        <link rel="alternate" hrefLang="x-default" href={`${BASE}${localizePath(path, 'fr')}`} />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={HREFLANG[lang]} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}
