//C:\quran-similarity-app\frontend\src\features\auth\pages\SignupPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from '../../../shared/services/authApi';
import '../../../styles/AuthPages.css';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const data = await signupUser(username, email, password);
      if (data.success) { setSuccess("Account created! Redirecting..."); setTimeout(() => navigate('/login'), 2000); }
      else setError(data.message);
    } catch (err) { setError("Network error."); }
  };
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <div className="password-rules"><p>Password must contain:</p><ul><li>At least 8 characters</li><li>At least 1 UPPERCASE letter</li><li>At least 1 Number</li></ul></div>
          <button type="submit">Create Account</button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};
export default SignupPage;