//C:\quran-similarity-app\frontend\src\shared\components\Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import '../../styles/Navbar.css';

const Navbar = ({ onOpenWalkthrough }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="dashboard-navbar">
      <div className="navbar-brand">
        <img src="/logo.png" alt="Ikhtebar Logo" className="navbar-logo-img" />
        <Link to="/" className="brand-text">حفظ القرآن</Link>
      </div>

      {user && (
        <div className="navbar-links">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        </div>
      )}

      <div className="navbar-auth">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#004D40', fontWeight: 600 }}>
              السَّلَامُ عَلَيْكُمْ , {user.username}
            </span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="logout-btn"
              style={{ textDecoration: 'none', textAlign: 'center', padding: '6px 15px' }}>
              Login
            </Link>
            <Link to="/signup" className="logout-btn"
              style={{ textDecoration: 'none', textAlign: 'center', padding: '6px 15px',
                       background: '#F2C94C', color: '#004D40', border: 'none' }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;