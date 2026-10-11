import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer id="footer" className="container footer">
      <Link className="brand" to="/" aria-label="Cortext home">
        CORTEXT
      </Link>
      <div className="footer-links">
        <Link to="/docs/">Go to the setup guide</Link>
        <Link to="/field-notes/">Field notes</Link>
      </div>
    </footer>
  );
}
