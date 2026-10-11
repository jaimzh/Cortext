import Hero from '../sections/Hero.jsx';
import Showcase from '../sections/Showcase.jsx';
import Features from '../sections/Features.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import FAQ from '../sections/FAQ.jsx';
import CallToAction from '../sections/CallToAction.jsx';
import SectionDivider from '../components/SectionDivider.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <SectionDivider />
      <Showcase />
      <SectionDivider />
      <Features />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <FAQ />
      <SectionDivider />
      <CallToAction />
    </>
  );
}
