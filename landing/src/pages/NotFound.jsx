import Button from '../components/Button.jsx';

export default function NotFound() {
  return (
    <section className="container closing">
      <p className="eyebrow">404 / PAGE NOT FOUND</p>
      <h1>This page wandered off.</h1>
      <p style={{ marginBlock: '24px' }}>Head back to Cortext to explore the project.</p>
      <Button to="/">Back to home</Button>
    </section>
  );
}
