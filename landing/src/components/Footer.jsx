import { Link } from 'react-router';
export default function Footer() {
  return <footer className="container footer"><Link className="brand" to="/">CORTEXT<span className="brand-dot">.</span></Link><div><Link to="/docs/">Setup guide</Link><Link to="/field-notes/">Field notes</Link></div></footer>;
}
