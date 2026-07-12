//C:\quran-similarity-app\frontend\src\features\auth\pages\LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { loginUser } from '../../../shared/services/authApi';
import '../../../styles/AuthPages.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(username, password);
      if (data.success) { login(data.data.token, data.data.username); navigate('/'); }
      else setError(data.message);
    } catch (err) { setError("Network error. Is the backend running?"); }
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Login</button>
        </form>
        <p className="auth-link">Don't have an account? <Link to="/signup">Sign Up</Link></p>
      </div>
    </div>
  );
};
export default LoginPage;