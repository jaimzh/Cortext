import { useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { asciiWordmark } from '../layouts/cortextBrand.js';
import './About.css';

export default function About({ onBack }) {
    const headingRef = useRef(null);
    useEffect(() => { headingRef.current.focus(); }, []);

    return <section className="about-page" aria-labelledby="about-heading">
        <button className="about-back" type="button" onClick={onBack}>
            <ArrowLeftIcon size={18} aria-hidden="true" /> Back to controls
        </button>
        <header className="about-brand">
            <h1 id="about-heading" ref={headingRef} tabIndex={-1} aria-label="Cortext">
                <pre aria-hidden="true">{asciiWordmark}</pre>
            </h1>
            <p className="about-tagline">Your phone, at the cursor.</p>
        </header>
        <p>Cortext turns your phone into a touchpad, keyboard, microphone, and game controller for your computer.</p>
        <h2 className="about-section-title">[ controls ]</h2>
        <p>Move the cursor, send text and shortcuts, or record your voice to turn speech into text. Switch to the controller for gamepad buttons and a joystick.</p>
        <h2 className="about-section-title">[ connect ]</h2>
        <p>Keep your phone and computer on the same local network. Open the connection link or scan the QR code shown on your computer to get started.</p>
    </section>;
}
