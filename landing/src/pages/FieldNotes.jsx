import { Link } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';
import { features } from '../content/features.js';

export default function FieldNotes() {
  return (
    <div className="container document-layout">
      <aside className="document-sidebar">
        {features.map((f) => (
          <Link key={f.id} to={`#${f.id}`}>
            {f.title}
          </Link>
        ))}
      </aside>
      <article className="document">
        <h1>
          A little anatomy
          <br />
          of the controls.
        </h1>
        <p className="lead">
          Part feature guide, part project notebook. A closer look at what each piece does and how
          it fits together.
        </p>
        {features.map(({ id, icon: Icon, title, intro, details, note }) => (
          <section className="field-entry" id={id} key={id}>
            <h2>
              <Icon size={30} />
              {title}
            </h2>
            <p className="entry-intro">{intro}</p>
            <p>{details}</p>
            <div className="field-note">
              <p>{note}</p>
            </div>
          </section>
        ))}
        <Link className="text-link" to="/docs/">
          Ready to try it? Read the setup guide <ArrowRight size={18} />
        </Link>
      </article>
    </div>
  );
}
