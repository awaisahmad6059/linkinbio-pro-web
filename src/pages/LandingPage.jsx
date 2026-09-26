import PageTransition from '../components/common/PageTransition.jsx';
import MarketingNav from '../components/layout/MarketingNav.jsx';
import MarketingFooter from '../components/layout/MarketingFooter.jsx';
import Hero from '../components/landing/Hero.jsx';
import Features, { HowItWorks } from '../components/landing/Features.jsx';
import ThemeShowcase from '../components/landing/ThemeShowcase.jsx';
import AnalyticsShowcase from '../components/landing/AnalyticsShowcase.jsx';
import FinalCta from '../components/landing/FinalCta.jsx';

const LandingPage = () => (
  <PageTransition>
    <MarketingNav />
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <ThemeShowcase />
      <AnalyticsShowcase />
      <FinalCta />
    </main>
    <MarketingFooter />
  </PageTransition>
);

export default LandingPage;
