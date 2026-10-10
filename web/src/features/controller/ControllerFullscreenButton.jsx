import { ArrowsInIcon, ArrowsOutIcon } from '@phosphor-icons/react';

export default function ControllerFullscreenButton({ buttonRef }) {
    return <button ref={buttonRef} id="controllerFullscreenButton" className="controller-fullscreen-button"
        type="button" aria-label="Enter fullscreen" title="Enter fullscreen" aria-pressed="false">
        <ArrowsOutIcon size={22} className="fullscreen-enter-icon" aria-hidden="true" />
        <ArrowsInIcon size={22} className="fullscreen-exit-icon" aria-hidden="true" />
    </button>;
}
