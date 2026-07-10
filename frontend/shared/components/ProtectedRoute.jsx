//C:\quran-similarity-app\frontend\src\shared\components\ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
const ProtectedRoute = ({ children }) => {
    const { user } = useAuthContext();
    if (!user) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    return children;
};
export default ProtectedRoute;