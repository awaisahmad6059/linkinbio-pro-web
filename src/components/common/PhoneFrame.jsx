import { motion } from 'framer-motion';
import { FiActivity, FiBatteryCharging, FiWifi } from 'react-icons/fi';

/**
 * Phone device frame used by the hero mockup and the dashboard live preview.
 * The screen renders the *real* ProfileView component, so what the user sees in
 * the dashboard is exactly what visitors get.
 */
const PhoneFrame = ({ children, url, className, height = 560 }) => (
  <div className={className}>
    <div className="phone">
      <div className="phone-notch" />
      <div className="phone-screen" style={{ height }}>
        <div className="phone-bar">
          <span>9:41</span>
          <span className="phone-bar-icons">
            <FiActivity />
            <FiWifi />
            <FiBatteryCharging />
          </span>
        </div>
        {children}
      </div>
    </div>
    {url && (
      <motion.div className="preview-url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <span>🔗</span>
        <span>{url}</span>
      </motion.div>
    )}
  </div>
);

export default PhoneFrame;
