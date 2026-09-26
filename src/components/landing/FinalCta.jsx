import Button from '../common/Button.jsx';
import { RevealSection } from '../common/PageTransition.jsx';
import { FiArrowRight } from 'react-icons/fi';

/** Closing call-to-action band. */
const FinalCta = () => (
  <section className="section">
    <div className="container">
      <RevealSection>
        <div className="cta-band">
          <h2>Your links deserve better than a list of bare URLs</h2>
          <p>
            Join creators and small businesses using LinkInBio Pro to look credible everywhere they
            show up. It takes about a minute and costs nothing.
          </p>
          <Button to="/signup" size="lg" iconRight={FiArrowRight}>
            Create your free page
          </Button>
        </div>
      </RevealSection>
    </div>
  </section>
);

export default FinalCta;
