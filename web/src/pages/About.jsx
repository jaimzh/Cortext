import { useEffect, useRef } from 'react';
import { ArrowLeftIcon } from '@phosphor-icons/react';

export default function About({ onBack }) {
    const headingRef = useRef(null);
    useEffect(() => { headingRef.current.focus(); }, []);

    return <section className="about-page" aria-labelledby="about-heading">
        <button className="about-back" type="button" onClick={onBack}>
            <ArrowLeftIcon size={18} aria-hidden="true" /> Back to controls
        </button>
        <h1 id="about-heading" ref={headingRef} tabIndex={-1}>Cortext</h1>
        <p>Your phone, at the cursor.</p>
        <p>Cortext turns your phone into a touchpad, keyboard, microphone, and game controller for your computer.</p>
        <p>Move the cursor, send text and shortcuts, or record your voice to turn speech into text. Switch to the controller for gamepad buttons and a joystick.</p>
        <p>Keep your phone and computer on the same local network. Open the connection link or scan the QR code shown on your computer to get started.</p>
    </section>;
}
