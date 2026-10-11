import { Link } from 'react-router';
import './Button.css';

export default function Button({ to, children, className = '', type = 'button', ...props }) {
  const classes = `cortext-button ${className}`.trim();
  const label = <span className="cortext-button-label">{children}</span>;

  if (to) {
    return <Link to={to} className={classes} {...props}>{label}</Link>;
  }

  return <button type={type} className={classes} {...props}>{label}</button>;
}
