import { motion } from 'framer-motion';
import { FiCompass } from 'react-icons/fi';
import PageTransition from '../components/common/PageTransition.jsx';
import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';

/**
 * Global 404. Also reused by the public `/:username` route when nobody has
 * claimed that name, so an unknown address always looks like a 404 rather
 * than a half-broken profile page.
 */
const NotFoundPage = ({ children, detail }) => (
  <PageTransition
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      textAlign: 'center',
    }}
  >
    <div>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <Logo to={null} showWord={false} />
      </motion.div>

      <motion.h1
        className="page-title"
        style={{ fontSize: 46, marginTop: 18 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        404
      </motion.h1>

      <motion.p
        className="muted"
        style={{ marginTop: 8, maxWidth: 380, marginInline: 'auto' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        {detail || 'We could not find that page. It may have moved, or the link might be mistyped.'}
      </motion.p>

      {children && (
        <motion.div
          style={{ marginTop: 16 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.18 }}
        >
          {children}
        </motion.div>
      )}

      <motion.div
        className="row gap-8"
        style={{ justifyContent: 'center', marginTop: 24 }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Button to="/" icon={FiCompass}>
          Back to home
        </Button>
        <Button to="/dashboard" variant="outline">
          Go to dashboard
        </Button>
      </motion.div>
    </div>
  </PageTransition>
);

export default NotFoundPage;
