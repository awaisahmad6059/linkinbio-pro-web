import { Link } from 'react-router-dom';
import { FiShield } from 'react-icons/fi';
import LoginForm from '../../components/auth/LoginForm.jsx';

/**
 * The admin sign-in.
 *
 * A separate screen, but the same form component and the same
 * `POST /api/auth/login` call as `/login` — there is no second credential
 * check. Whether this page is reachable, and where a valid account lands, is
 * decided by the server-reported role and the /admin guard.
 */
const AdminLoginPage = () => (
  <LoginForm
    variant="admin"
    title="Administrator sign-in"
    subtitle="This area is read-only. The same account and password you use elsewhere will work."
    submitLabel="Sign in as administrator"
    successMessage="Signed in — opening the admin area"
    note={
      <div className="admin-login-note">
        <FiShield />
        <span>
          Sessions in the admin area are checked against the server on every request, so an old or edited
          token cannot grant access.
        </span>
      </div>
    }
    footer={
      <>
        Not an administrator? <Link to="/login">Use the normal sign-in</Link>
      </>
    }
  />
);

export default AdminLoginPage;
