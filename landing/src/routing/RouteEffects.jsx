import { useEffect } from 'react';
import { useLocation } from 'react-router';

const metadata = {
  '/': {
    title: 'Cortext — Your phone, at the cursor.',
    description:
      'Cortext turns your phone into a touchpad, keyboard, microphone, and game controller for your computer. Explore the project and learn how to set it up.',
  },
  '/docs': {
    title: 'Setup — Cortext Docs',
    description:
      'Set up Cortext on your computer and connect your phone to the local control interface.',
  },
  '/field-notes': {
    title: 'Field notes — Cortext',
    description:
      'A field guide to Cortext: mouse, keyboard, voice, controller, and the details behind each feature.',
  },
};

// Routing belongs to React Router. This component only updates browser metadata
// and scroll position after a route or section link changes.
export default function RouteEffects() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const page = metadata[pathname.replace(/\/$/, '') || '/'] ?? {
      title: 'Page not found — Cortext',
      description: 'This Cortext page could not be found.',
    };
    document.title = page.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description);

    const frame = requestAnimationFrame(() => {
      let id = hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        /* Keep malformed fragments harmless. */
      }
      const section = id ? document.getElementById(id) : null;
      if (section) section.scrollIntoView();
      else window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

  return null;
}
