import CortextLogo from './CortextLogo.jsx';

export default function AppNavbar({ onAbout, buttonRef }) {
    return <nav className="app-navbar" aria-label="Cortext navigation">
        <CortextLogo buttonRef={buttonRef} onAbout={onAbout} />
    </nav>;
}
