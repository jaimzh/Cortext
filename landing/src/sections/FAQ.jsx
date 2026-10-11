import { Plus } from '@phosphor-icons/react';
import { AsciiText } from '../components/ui/AsciiText.jsx';

export default function FAQ() {
  return (
    <section id="faq" className="section container faq-section">
      <div className="faq-body">
        <div className="faq-artwork">
          <AsciiText
            className="faq-question-mark"
            text="?"
            animation="wave"
            speed={0.7}
            color="var(--accent)"
            aria-hidden="true"
          />
        </div>
        <div className="faq-content">
          <h2>Got any questions?</h2>
          <div className="faq-list">
            {[
              [
                'Why did you make Cortext?',
                'I was bored and wanted to see if I could turn my phone into an input device for my computer. So I gave it a go, and Cortext grew from there.',
              ],
              [
                'Is it better than dedicated input devices?',
                'Probably not. I built Cortext out of curiosity, and it has been a fun project to figure out. If someone else finds it useful too, that’s a bonus.',
              ],
              [
                'Do I need to install an app on my phone?',
                'The current interface runs in your phone’s browser. Your computer runs the Python server; your phone opens the session link.',
              ],
              [
                'Does this website control my computer?',
                'This is the project showcase. To use the controls, start Cortext locally and connect to the session on your computer.',
              ],
              [
                'Which computers does it work with?',
                'The current setup scripts target Windows. The controller uses a virtual Xbox gamepad through vgamepad / ViGEmBus. Other platforms have not been validated for this setup.',
              ],
              [
                'Can I change the controller layout?',
                'Yes. Move and resize the controls, reset the layout, and choose which controls are visible. Layout preferences are saved in your browser.',
              ],
              [
                'Is this a finished product?',
                'Cortext is an evolving personal project. These pages document the current interface, with room for experiments and handwritten feature notes.',
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
