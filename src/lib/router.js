import { useEffect, useState } from 'react';

/** Minimal client-side routing (no dependency): current pathname + navigate(). */
export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return path;
}

export function navigate(to) {
  if (to === window.location.pathname) return;
  window.history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export const profileUrl = handle => `${window.location.origin}/joueur/${handle}`;
