/**
 * Main Application Component
 * Purpose: Defines routes, lazy loading, and global providers
 * Features: Auth, App, Tour contexts with protected routes
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './shared/context/AuthContext';
import { AppProvider } from './shared/context/AppContext';
import { TourProvider, useTour } from './shared/context/TourContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import Navbar from './shared/components/Navbar';
import Walkthrough from './shared/components/Walkthrough';
import TourBanner from './shared/components/TourBanner';
import DailyQuoteCard from './shared/components/DailyQuoteCard';
import './App.css';

// Lazy load page components
const Home = lazy(() => import('./features/auth/pages/Home'));
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('./features/auth/pages/SignupPage'));
const SimilarityPage = lazy(() => import('./features/similarity/SimilarityPage'));
const DiaryPage = lazy(() => import('./features/diary/DiaryPage'));
const FlashcardsPage = lazy(() => import('./features/flashcards/FlashcardsPage'));
const BestMethodPage = lazy(() => import('./features/auth/pages/BestMethodPage'));
const CoachPage = lazy(() => import('./features/coach/pages/CoachPage'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    fontSize: '16px',
    color: '#6B7280'
  }}>
    Loading...
  </div>
);

function AppContent() {
  const { user } = useAuthContext();
  const location = useLocation();
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [hasSeenWalkthrough, setHasSeenWalkthrough] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const { startTour, isActive } = useTour();

  // Routes where navbar and tour should be hidden
  const hideNavbarRoutes = ['/login', '/signup', '/register'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  useEffect(() => {
    // Check if daily quote should be shown today - scoped to user
    if (!user?.username) return; // wait until user is available
    
    const key = `lastQuoteDate_${user.username}`;
    const lastQuoteDate = localStorage.getItem(key);
    const today = new Date().toISOString().split('T')[0];
    
    if (lastQuoteDate !== today) {
      setShowQuote(true);
    }
  }, [user?.username]);

  useEffect(() => {
    // Check localStorage for tour completion only
    const tourCompleted = localStorage.getItem('hifz_tour_completed') === 'true';
    setHasSeenWalkthrough(tourCompleted);
    
    // Auto-start tour for logged-in users who haven't completed it and not on auth pages
    if (user && !tourCompleted && !isActive && !shouldHideNavbar) {
      const timer = setTimeout(() => {
        console.log('[App] Auto-starting tour for new user');
        startTour();
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    // Show walkthrough modal for non-logged-in users or if tour not completed (not on auth pages)
    if (!tourCompleted && !user && !shouldHideNavbar) {
      const timer = setTimeout(() => {
        setIsWalkthroughOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isActive, startTour, shouldHideNavbar]);

  const handleWalkthroughClose = () => {
    setIsWalkthroughOpen(false);
  };

  const handleOpenWalkthrough = () => {
    setIsWalkthroughOpen(true);
  };

  return (
    <div className="app-layout" id="app-root">
      {showQuote && <DailyQuoteCard username={user?.username} onDismiss={() => setShowQuote(false)} />}
      {!shouldHideNavbar && <TourBanner />}
      {!shouldHideNavbar && <Navbar onOpenWalkthrough={handleOpenWalkthrough} />}
      <main className="app-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/similarity" element={<ProtectedRoute><SimilarityPage /></ProtectedRoute>} />
            <Route path="/diary" element={<ProtectedRoute><DiaryPage /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
            <Route path="/best-method" element={<BestMethodPage />} />
            <Route path="/coach" element={<ProtectedRoute><CoachPage /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </main>
      <Walkthrough
        isOpen={isWalkthroughOpen}
        onClose={handleWalkthroughClose}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <TourProvider>
            <AppContent />
          </TourProvider>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}
export default App;