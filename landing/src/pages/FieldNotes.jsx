import { Link } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';
import { features } from '../content/features.js';

export default function FieldNotes() {
  return <div className="container document-layout"><aside className="document-sidebar"><p className="eyebrow">THE FIELD GUIDE</p>{features.map(f => <Link key={f.id} to={`#${f.id}`}>{f.title}</Link>)}</aside><article className="document"><p className="eyebrow">CORTEXT / FIELD NOTES</p><h1>A little anatomy<br />of the controls.</h1><p className="lead">Part feature guide, part project notebook. A closer look at what each piece does and how it fits together.</p><div className="editor-note">These are starter notes. The handwritten stories behind each feature will live here.</div>{features.map(({ id, icon: Icon, title, intro, details, note }, i) => <section className="field-entry" id={id} key={id}><p className="eyebrow">SPECIMEN 0{i + 1}</p><h2><Icon size={30} />{title}</h2><p className="entry-intro">{intro}</p><p>{details}</p><div className="field-note"><span>OBSERVATION</span><p>{note}</p></div></section>)}<Link className="text-link" to="/docs/">Ready to try it? Read the setup guide <ArrowRight size={18} /></Link></article></div>;
}
