import { Route, Routes, useLocation } from 'react-router';
import Navigation from './components/Navigation.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Docs from './pages/Docs.jsx';
import FieldNotes from './pages/FieldNotes.jsx';
import NotFound from './pages/NotFound.jsx';
import RouteEffects from './routing/RouteEffects.jsx';
import ClosingSection from './sections/ClosingSection.jsx';

export default function App() {
  const { pathname } = useLocation();
  return (
    <>
      <RouteEffects />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navigation />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/field-notes" element={<FieldNotes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {pathname === '/' ? <ClosingSection /> : <Footer />}
    </>
  );
}
