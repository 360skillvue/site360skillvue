import { Helmet } from 'react-helmet-async';

interface Props {
  title: string;
  description: string;
  path: string;
}

export default function PageMeta({ title, description, path }: Props) {
  const base = 'https://site360skillvue.vercel.app';
  return (
    <Helmet>
      <title>{title} | ScanUp 360SkillVue</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`${base}${path}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${base}${path}`} />
    </Helmet>
  );
}
