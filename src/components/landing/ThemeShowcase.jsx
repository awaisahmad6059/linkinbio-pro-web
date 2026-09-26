import { RevealSection } from '../common/PageTransition.jsx';
import { THEMES } from '../../lib/constants.js';
import { ProfileView } from '../profile/ProfileView.jsx';

const SAMPLE_PROFILE = {
  displayName: 'Awais Ahmad',
  username: 'awais',
  bio: 'Full-stack developer · Building in public',
};

const SAMPLE_LINKS = [
  { _id: '1', label: 'My portfolio', platform: 'custom', isActive: true },
  { _id: '2', label: 'Hire me for work', platform: 'email', isActive: true },
  { _id: '3', label: 'Watch my YouTube', platform: 'youtube', isActive: true },
];

/** Live-rendered thumbnails of every theme — not flat colour swatches. */
const ThemeShowcase = () => (
  <section className="section" id="themes">
    <div className="container">
      <RevealSection className="section-head">
        <span className="section-eyebrow">Themes</span>
        <h2 className="section-title">Five looks, one click apart</h2>
        <p className="section-sub">
          Each theme is a real rendered page, so what you pick is exactly what your visitors get.
          You can switch at any time — nothing breaks.
        </p>
      </RevealSection>

      <div className="theme-strip">
        {THEMES.map((theme, i) => (
          <RevealComponent key={theme.key} delay={i * 0.07}>
            <div className="theme-chip">
              <div className="theme-chip-frame">
                <ProfileView
                  theme={theme.key}
                  compact={false}
                  animate={false}
                  showFooter={false}
                  profile={SAMPLE_PROFILE}
                  links={SAMPLE_LINKS}
                />
              </div>
              <div className="theme-chip-name">
                <span>{theme.name}</span>
                <span className="tiny">{theme.blurb}</span>
              </div>
            </div>
          </RevealComponent>
        ))}
      </div>
    </div>
  </section>
);

/* Small wrapper so the chips can stagger in individually. */
function RevealComponent({ children, delay }) {
  return (
    <RevealSection delay={delay} style={{ height: '100%' }}>
      {children}
    </RevealSection>
  );
}

export default ThemeShowcase;
