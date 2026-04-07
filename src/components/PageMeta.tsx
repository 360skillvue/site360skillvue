import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  schema?: object;
}

const BASE = 'https://site360skillvue.vercel.app';
const DEFAULT_OG_IMAGE = `${BASE}/og-image.svg`;

export default function PageMeta({ title, description, path, ogImage, schema }: Props) {
  const image = ogImage ?? DEFAULT_OG_IMAGE;
  const url = `${BASE}${path}`;
  return (
    <Helmet>
      <title>{title} | ScanUp 360SkillVue</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

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
