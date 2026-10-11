import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { ArrowUpRight, List, X } from '@phosphor-icons/react';
import { asciiC } from '../content/brand.js';

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const links = [['Showcase', '/#showcase'], ['Features', '/#features'], ['How it works', '/#how-it-works'], ['FAQ', '/#faq']];
  return <header className="site-header"><div className="container nav-inner">
    <Link className="brand" to="/" aria-label="Cortext home" onClick={() => setOpen(false)}><pre aria-hidden="true" className="brand-mark">{asciiC}</pre><span>CORTEXT<span className="brand-dot">.</span></span></Link>
    <button className="menu-toggle" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <List size={22} />}</button>
    <nav id="navigation" className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
      {links.map(([label, to]) => <Link key={to} to={to} onClick={() => setOpen(false)}>{label}</Link>)}
      <NavLink to="/field-notes/" onClick={() => setOpen(false)}>Field notes</NavLink>
      <NavLink className="nav-docs" to="/docs/" onClick={() => setOpen(false)}>Docs <ArrowUpRight size={15} /></NavLink>
    </nav>
  </div></header>;
}
