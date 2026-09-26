import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils.js';

export const LogoMark = ({ size = 'md' }) => (
  <span className={cn('logo-mark', size === 'sm' && 'logo-mark-sm')}>
    <svg width={size === 'sm' ? 12 : 16} height={size === 'sm' ? 12 : 16} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.5 14.5L14.5 9.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.8 7.4l1.9-1.9a3.9 3.9 0 015.5 5.5l-1.9 1.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11.2 16.6l-1.9 1.9a3.9 3.9 0 01-5.5-5.5l1.9-1.9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  </span>
);

const Logo = ({ to = '/', size = 'md', showWord = true, className }) => {
  const content = (
    <>
      <LogoMark size={size} />
      {showWord && (
        <span className="logo-word">
          LinkInBio<span style={{ color: 'var(--brand)' }}>Pro</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cn('logo', className)}>
        {content}
      </Link>
    );
  }
  return <span className={cn('logo', className)}>{content}</span>;
};

export default Logo;
