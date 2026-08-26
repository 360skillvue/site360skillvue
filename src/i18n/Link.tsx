import React from 'react';
import { Link as RouterLink, type LinkProps, useNavigate, type NavigateOptions } from 'react-router-dom';
import { useLanguage, localizePath } from './index';

/**
 * Lien interne conscient de la langue.
 * <Link to="/tarifs"> mene a /tarifs en francais et a /es/tarifs en espagnol,
 * ce qui evite de retomber en francais des le premier clic.
 */
export function Link({ to, ...rest }: LinkProps) {
  const { lang } = useLanguage();
  const target = typeof to === 'string' && to.startsWith('/') ? localizePath(to, lang) : to;
  return <RouterLink to={target} {...rest} />;
}

/** Meme logique pour les navigations declenchees par du code. */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  return (to: string, options?: NavigateOptions) => {
    const target = typeof to === 'string' && to.startsWith('/') ? localizePath(to, lang) : to;
    navigate(target, options);
  };
}
