import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight } from '@phosphor-icons/react';
import { features } from '../content/features.js';

export default function Features() {
  return (
    <section id="features" className="section container"><div className="section-heading"><div><h2>Four ways to reach<br />your computer.</h2></div><Link className="text-link" to="/field-notes/">Read the field notes <ArrowUpRight size={18} /></Link></div><div className="feature-grid">{features.map(({ id, icon: Icon, title, intro }) => <Link className="feature-card" key={id} to={`/field-notes/#${id}`}><div className="feature-top"><Icon size={28} weight="duotone" /></div><h3>{title}</h3><p>{intro}</p><span className="feature-link">Explore <ArrowRight size={17} /></span></Link>)}</div></section>
  );
}
