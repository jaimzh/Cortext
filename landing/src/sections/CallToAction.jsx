import Button from '../components/Button.jsx';
import { ArrowUpRight } from '@phosphor-icons/react';

export default function CallToAction() {
  return (
    <section className="container closing"><h2>Give your phone<br />another job.</h2><Button to="/docs/">Set up Cortext <ArrowUpRight size={19} /></Button></section>
  );
}
