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
  `Home.jsx` composes the main sections; `ClosingSection.jsx` combines the closing
  call to action and footer over a full-width LetterGlitch background.
- `src/App.jsx`: route definitions and the shared navigation/footer.
- `src/routing/RouteEffects.jsx`: section scrolling and page metadata after navigation.
- `src/components/`: shared navigation, footer, code blocks, Button, and AsciiWordmark.
  Button matches the web recording control; AsciiWordmark uses the reusable
  animated ASCII text component in the Cortext accent blue. `components/ui/`
  contains the adapted Nyx UI AsciiText and React Bits LetterGlitch effects.
- `src/content/brand.js`: ASCII branding and the tagline, "Control your computer from your phone."
- `src/styles/theme.css`: brand tokens matching the control app.
- `src/styles/landing.css`: website layout and responsive styles.
- `src/components/showcase/`: simulated laptop and phone-frame styling.
- `src/demo/`: local demo API, laptop input state, and input tests.

The showcase imports the actual `web/src/layouts/MainLayout.jsx` and its styles
into a separate iframe entry point at `/demo/index.html`. Its API adapter emits
local messages to the laptop simulator instead of calling the Python backend.
Mouse, regular/live typing, zoom, and controller input work in the simulation.
Voice has no installed models and needs the real backend. Reset reloads the
phone UI and clears the laptop; browser-saved layout preferences persist.

Run `npm.cmd test` for the demo transport and laptop state tests. Brand tokens
are copied from the web app; update both if the brand changes.

## Vercel

Import the repository as a Vercel project and configure:

- Root Directory: `landing`
- Enable **Include source files outside of the Root Directory in the Build Step**
  so the build can read the shared `web/src/` UI. Only `dist/` is deployed.
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main` when the landing work is merged

The `landing` branch can receive preview deployments. View generated URLs in
Vercel's project dashboard. A custom domain can be attached later.

Vite builds the landing entry point plus the isolated demo entry point.
React Router selects the landing page and internal
links navigate without reloading the document. `vercel.json` rewrites incoming
paths to `/index.html`, so direct visits and refreshes on `/docs/` and
`/field-notes/` work on Vercel. Unknown paths show the site's not-found page.
Keep the Vite base at `/`. Browser titles and descriptions update on navigation;
the initial static HTML contains the homepage metadata.
Deploy only this directory: the local control app and Python backend stay on
the user's computer. No Vercel project or public deployment has been created
by scaffolding this directory.
