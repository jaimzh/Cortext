import { Link } from 'react-router';
import { ArrowRight, Plus } from '@phosphor-icons/react';

export default function FAQ() {
  return (
    <section id="faq" className="section container faq-section"><div><p className="eyebrow">04 / A FEW QUESTIONS</p><h2>Before you<br />give it a go.</h2><Link className="text-link" to="/docs/">Go to the setup guide <ArrowRight size={18} /></Link></div><div className="faq-list">{[
      ['Do I need to install an app on my phone?', 'The current interface runs in your phone’s browser. Your computer runs the Python server; your phone opens the session link.'],
      ['Does this website control my computer?', 'This is the project showcase. To use the controls, start Cortext locally and connect to the session on your computer.'],
      ['Which computers does it work with?', 'The current setup scripts target Windows. The controller uses a virtual Xbox gamepad through vgamepad / ViGEmBus. Other platforms have not been validated for this setup.'],
      ['Can I change the controller layout?', 'Yes. Move and resize the controls, reset the layout, and choose which controls are visible. Layout preferences are saved in your browser.'],
      ['Is this a finished product?', 'Cortext is an evolving personal project. These pages document the current interface, with room for experiments and handwritten feature notes.'],
    ].map(([q, a]) => <details key={q}><summary>{q}<Plus size={18} /></summary><p>{a}</p></details>)}</div></section>
  );
}
