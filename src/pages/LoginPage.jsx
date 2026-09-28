import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm.jsx';

const LoginPage = () => (
  <LoginForm
    footer={
      <>
        New to LinkInBio Pro? <Link to="/signup">Create a free page</Link>
      </>
    }
  />
);

export default LoginPage;
