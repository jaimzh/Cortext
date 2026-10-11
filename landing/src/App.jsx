import { Route, Routes } from 'react-router';
import Navigation from './components/Navigation.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Docs from './pages/Docs.jsx';
import FieldNotes from './pages/FieldNotes.jsx';
import NotFound from './pages/NotFound.jsx';
import RouteEffects from './routing/RouteEffects.jsx';

export default function App() {
  return (
    <>
      <RouteEffects />
      <a className="skip-link" href="#main">Skip to content</a>
      <Navigation />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/field-notes" element={<FieldNotes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
