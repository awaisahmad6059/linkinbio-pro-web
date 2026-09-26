import { Link } from 'react-router-dom';
import { FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';
import { FaInstagram, FaYoutube } from 'react-icons/fa6';
import Logo from '../common/Logo.jsx';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Themes', href: '/#themes' },
      { label: 'Analytics', href: '/#analytics' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Create a page', to: '/signup' },
      { label: 'Log in', to: '/login' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Settings', to: '/dashboard/settings' },
    ],
  },
  {
    title: 'Popular themes',
    links: [
      { label: 'Minimal Light', to: '/signup' },
      { label: 'Dark Mode', to: '/signup' },
      { label: 'Gradient', to: '/signup' },
      { label: 'Nature Soft', to: '/signup' },
    ],
  },
];

const SOCIALS = [
  { Icon: FiTwitter, label: 'X (Twitter)' },
  { Icon: FaInstagram, label: 'Instagram' },
  { Icon: FiLinkedin, label: 'LinkedIn' },
  { Icon: FaYoutube, label: 'YouTube' },
  { Icon: FiGithub, label: 'GitHub' },
];

const MarketingFooter = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-top">
        <div>
          <Logo />
          <p className="footer-blurb">
            One beautiful link for everything you do. Built for creators, freelancers and small
            teams who want their whole internet presence in a single place.
          </p>
          <div className="row gap-12" style={{ marginTop: 16 }}>
            {SOCIALS.map(({ Icon, label }) => (
              <span
                key={label}
                className="icon-btn"
                title={label}
                aria-label={label}
                style={{ color: 'var(--ink-400)' }}
              >
                <Icon />
              </span>
            ))}
          </div>
        </div>

        <div className="footer-cols">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              {col.links.map((link) => (
                link.to ? (
                  <Link key={link.label} className="footer-link" to={link.to}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} className="footer-link" href={link.href}>
                    {link.label}
                  </a>
                )
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} LinkInBio Pro — built with React, Node, Express &amp; MongoDB.</span>
        <span className="row gap-6">
          <span>Free forever</span>
          <span aria-hidden="true">·</span>
          <span>No credit card needed</span>
        </span>
      </div>
    </div>
  </footer>
);

export default MarketingFooter;
