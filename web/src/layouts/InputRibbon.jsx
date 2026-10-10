import { KeyboardIcon, LightningIcon, MicrophoneIcon } from '@phosphor-icons/react';

const tabs = [['keyboard', 'Keyboard'], ['live-keyboard', 'Live keyboard'], ['voice', 'Voice']];

export default function InputRibbon({ selected, onSelect }) {
    function navigate(event, index) {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
        onSelect(tabs[next][0]);
    }

    return <div className="input-ribbon" role="tablist" aria-label="Input panel">
        {tabs.map(([id, label], index) => <button key={id} id={`${id}-tab`} type="button" role="tab"
            className="input-ribbon-tab" aria-label={label} title={label} aria-selected={selected === id}
            aria-controls={`${id}-input-panel`} tabIndex={selected === id ? 0 : -1}
            onClick={() => onSelect(id)} onKeyDown={event => navigate(event, index)}>
            {id === 'voice'
                ? <MicrophoneIcon size={24} weight={selected === id ? 'fill' : 'regular'} aria-hidden="true" focusable="false" />
                : <span className={id === 'live-keyboard' ? 'live-keyboard-icon' : undefined}>
                    <KeyboardIcon size={24} weight={selected === id ? 'fill' : 'regular'} aria-hidden="true" focusable="false" />
                    {id === 'live-keyboard' && <LightningIcon className="live-keyboard-badge" size={12} weight="fill" aria-hidden="true" />}
                </span>}
        </button>)}
    </div>;
}
