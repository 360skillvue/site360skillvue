import React, { useState } from 'react';
import { Play } from 'lucide-react';

type Ratio = '16/9' | '9/16';

type Props = {
  /** identifiant YouTube, par exemple PgL46oFdz2M */
  id: string;
  /** titre accessible du lecteur */
  title: string;
  /** format du cadre ; '9/16' pour un Short vertical */
  ratio?: Ratio;
  /** largeur maximale en pixels */
  maxWidth?: number;
  className?: string;
};

/**
 * Lecteur YouTube en deux temps.
 * Tant que le visiteur n'a pas cliqué, seule la miniature est affichee :
 * aucun script ni cookie YouTube n'est charge. Au clic, le lecteur est
 * charge depuis youtube-nocookie.com, qui ne depose pas de cookie
 * publicitaire tant que la lecture n'a pas commence.
 */
export default function VideoEmbed({
  id,
  title,
  ratio = '16/9',
  maxWidth,
  className = '',
}: Props) {
  const [active, setActive] = useState(false);
  const vertical = ratio === '9/16';
  const pad = vertical ? '177.78%' : '56.25%';

  // miniature adaptee au format, avec repli sur hqdefault si elle n'existe pas
  const poster = vertical
    ? `https://i.ytimg.com/vi/${id}/oardefault.jpg`
    : `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-xl shadow-black/10 border border-black/[0.06] bg-black ${className}`}
      style={{ width: '100%', maxWidth }}
    >
      <div style={{ paddingTop: pad, position: 'relative' }}>
        {active ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            aria-label={title}
            className="group absolute inset-0 w-full h-full cursor-pointer"
          >
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fallback) {
                  img.dataset.fallback = '1';
                  img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-scanup-navy/25 group-hover:bg-scanup-navy/10 transition-colors duration-300" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex items-center justify-center w-[68px] h-[68px] rounded-full bg-white/95 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Play className="w-7 h-7 text-scanup-blue fill-scanup-blue ml-1" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
