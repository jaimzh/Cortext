# Cortext landing page

Independent React + Vite public showcase with React Router. Uses plain CSS with Cortext's existing
dark palette, blue accent, monospace details, and Phosphor icons. No Python server
or session token is needed to run this site.

## Local development

From the repository root:

```powershell
cd landing
npm.cmd install
npm.cmd run dev
```

Open http://localhost:5174/. The control interface in `web/` continues to use
port 5173; the backend uses port 8001.

```powershell
npm.cmd run build
npm.cmd run preview
```

## Pages and editing

- `/`: showcase, features, how it works, FAQ.
- `/docs/`: Windows setup instructions.
- `/field-notes/`: feature guide and space for the author's writing.
- `src/content/features.js`: feature titles, descriptions, and observations.
- `src/pages/`: landing page, setup docs, and field notes.
- `src/sections/`: Hero, Showcase, Features, HowItWorks, FAQ, and CallToAction.
  `Home.jsx` composes these sections in page order.
- `src/App.jsx`: route definitions and the shared navigation/footer.
- `src/routing/RouteEffects.jsx`: section scrolling and page metadata after navigation.
- `src/components/`: shared navigation, footer, code blocks, Button, and AsciiWordmark.
  Button matches the web recording control; AsciiWordmark reuses the TUI's
  pyfiglet wordmark with a blue sweep that respects reduced-motion preferences.
- `src/content/brand.js`: ASCII branding and the TUI tagline, "Your voice, anywhere."
- `src/styles/theme.css`: brand tokens matching the control app.
- `src/styles/landing.css`: website layout and responsive styles.

The previews are labelled illustrations, not live controls or screenshots.
Add real screenshots or recordings under `public/` when available. The theme
tokens are currently copied from the web app; update both if the brand changes.

## Vercel

Import the repository as a Vercel project and configure:

- Root Directory: `landing`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main` when the landing work is merged

The `landing` branch can receive preview deployments. View generated URLs in
Vercel's project dashboard. A custom domain can be attached later.

Vite builds one HTML entry point. React Router selects the page and internal
links navigate without reloading the document. `vercel.json` rewrites incoming
paths to `/index.html`, so direct visits and refreshes on `/docs/` and
`/field-notes/` work on Vercel. Unknown paths show the site's not-found page.
Keep the Vite base at `/`. Browser titles and descriptions update on navigation;
the initial static HTML contains the homepage metadata.
Deploy only this directory: the local control app and Python backend stay on
the user's computer. No Vercel project or public deployment has been created
by scaffolding this directory.
