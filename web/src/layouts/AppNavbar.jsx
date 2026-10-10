const asciiC = '  ____\n / ___|\n| |    \n| |___ \n \\____|';

export default function AppNavbar({ onAbout, buttonRef }) {
    return <nav className="app-navbar" aria-label="Cortext navigation">
        <button ref={buttonRef} className="app-logo" type="button" aria-label="About Cortext"
            title="About Cortext" onClick={onAbout}>
            <pre aria-hidden="true">{asciiC}</pre>
        </button>
    </nav>;
}
