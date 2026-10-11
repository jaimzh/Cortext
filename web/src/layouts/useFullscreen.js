import { useEffect, useRef, useState } from 'react';

export function useFullscreen(view) {
  const [fullscreen, setFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const pending = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const synchronize = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', synchronize);
    return () => {
      mounted.current = false;
      document.removeEventListener('fullscreenchange', synchronize);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('app-fullscreen', fullscreen);
    document.body.classList.toggle('controller-fullscreen', fullscreen && view === 'controller');
    return () => document.body.classList.remove('app-fullscreen', 'controller-fullscreen');
  }, [fullscreen, view]);

  async function toggleFullscreen() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    const next = !fullscreen;
    try {
      if (next && !document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      else if (!next && document.fullscreenElement) await document.exitFullscreen?.();
    } catch {
      // Keep an immersive app layout on browsers that disallow fullscreen.
    } finally {
      pending.current = false;
      if (mounted.current) {
        setFullscreen(next);
        setBusy(false);
      }
    }
  }

  return { fullscreen, busy, toggleFullscreen };
}
