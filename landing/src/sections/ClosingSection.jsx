import Footer from '../components/Footer.jsx';
import LetterGlitch from '../components/ui/LetterGlitch.jsx';
import CallToAction from './CallToAction.jsx';

const glitchColors = ['#0a2b45', '#014d87', '#0178d4'];

export default function ClosingSection() {
  return (
    <div className="closing-section">
      <div className="closing-effect">
        <LetterGlitch
          glitchColors={glitchColors}
          backgroundColor="#111111"
          glitchSpeed={70}
          centerVignette
          outerVignette
          smooth
        />
      </div>
      <CallToAction />
      <Footer />
    </div>
  );
}
