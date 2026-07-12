/**
 * Authentication Context
 * Purpose: Manages user authentication state and token handling
 * Features: Login, logout, token validation, localStorage persistence
 */
//  - Removed repeated localStorage.getItem calls on every render

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';

export const AuthContext = createContext();

/** Decode a JWT payload without verifying its signature. Returns null on failure. */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/** Returns true when a token is present and its exp claim is in the future. */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  // Define logout first so it can be safely referenced in effects below.
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken, username) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', username);
    setToken(newToken);
    // user state is derived in the effect below
  }, []);

  // Validate token on mount and whenever it changes.
  // Also schedule automatic logout for when the token expires.
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    if (!isTokenValid(token)) {
      // Token is present but expired — clean up immediately.
      logout();
      return;
    }

    setUser({ username: localStorage.getItem('username') });

    // Schedule automatic logout at the exact expiry time.
    const payload = decodeJwtPayload(token);
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    const timerId = setTimeout(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[Auth] Token expired — logging out automatically.');
      }
      logout();
    }, msUntilExpiry);

    return () => clearTimeout(timerId);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);