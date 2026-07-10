//C:\quran-similarity-app\frontend\src\features\auth\pages\home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import { useAuthContext } from '../../../shared/context/AuthContext';
import { useTour } from '../../../shared/context/TourContext';
import { dailyQuotes } from '../../../shared/data/dailyQuotes';

const Home = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { isActive, currentStep, completeTour, onSensoryProfileTestStarted, onSensoryProfileSaved, startTour } = useTour();

  // Get today's quote based on day of year
  const getDailyQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const quoteIndex = dayOfYear % dailyQuotes.length;
    return dailyQuotes[quoteIndex];
  };

  const quote = getDailyQuote();

  const handleGoToScheduler = () => {
    completeTour();
    navigate('/coach');
  };

  const handleExplore = () => {
    completeTour();
  };

  const handleSensoryProfileTestClick = () => {
    if (isActive && currentStep === 35) {
      onSensoryProfileTestStarted();
    }
  };

  return (
    <div className="home-dashboard-container">
      {isActive && currentStep === 36 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#F5F0E8',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              border: '2px solid #C9A84C',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: '24px',
                fontSize: '64px',
              }}
            >
              🎉
            </div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#1B4332',
                marginBottom: '16px',
                marginTop: 0,
                textAlign: 'center',
              }}
            >
              Mashallah! Tour Complete
            </h2>
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#374151',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              You have explored every feature of the platform.
              <br /><br />
              Your journey:
              <br />✅ Mutashābihāt — similar verse finder
              <br />✅ Flashcards — sequence memory aids
              <br />✅ My Diary — personal Hifz journal
              <br />✅ Time Management — smart weekly scheduler
              <br />✅ Sensory Profile — your learning style
              <br /><br />
              May Allah make your Hifz easy and blessed. Ameen 🤲
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleGoToScheduler}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#C9A84C',
                  color: '#1B4332',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Start My Schedule →
              </button>
              <button
                onClick={handleExplore}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '2px solid #2D6A4F',
                  backgroundColor: 'transparent',
                  color: '#2D6A4F',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Explore freely
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Welcome to the Hifz al-Qur'an Platform</h1>
          <p>Identify structural patterns to strengthen your Hifz retention.</p>
        </div>
        <button 
          onClick={startTour}
          style={{
            backgroundColor: '#1B4332',
            color: '#C9A84C', 
            border: '2px solid #C9A84C',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2D6A4F';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1B4332';
            e.target.style.transform = 'scale(1)';
          }}
        >
          🗺️ Take a Tour
        </button>
      </div>

      {/* Quote of the Day */}
      <div 
        style={{
          backgroundColor: '#F5F0E8',
          borderLeft: '4px solid #1B4332',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '32px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div 
          style={{
            fontSize: '0.75rem',
            color: '#C9A84C',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          ✨ Quote of the Day
        </div>
        <div 
          style={{
            fontSize: '1.8rem',
            color: '#C9A84C',
            lineHeight: 1,
            marginBottom: '12px',
          }}
        >
          "
        </div>
        <div 
          style={{
            fontSize: '1.2rem',
            fontFamily: "'Amiri', serif",
            color: '#C9A84C',
            textAlign: 'right',
            marginBottom: '12px',
            lineHeight: 1.6,
            direction: 'rtl',
          }}
        >
          {quote.arabic}
        </div>
        <div 
          style={{
            fontSize: '0.875rem',
            color: '#1B4332',
            textAlign: 'center',
            marginBottom: '8px',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}
        >
          {quote.english}
        </div>
        <div 
          style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            textAlign: 'right',
          }}
        >
          {quote.source}
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard
          title="Mutashābihāt"
          description="Search for any Ayah and find its structurally similar pairs."
          linkTo="/similarity"
          buttonText="Open Tool"
          color="#F2C94C"
        />
        <DashboardCard
          title="Flashcards"
          description="Master repetitive verses."
          linkTo={user ? "/flashcards" : "/login"}
          buttonText={user ? "Open Flashcards" : "Login to Access"}
          color={user ? "#10B981" : "#9CA3AF"}
        />
        <DashboardCard
          title="My Diary"
          description="Keep a personal Hifz diary, notes, and teacher feedback."
          linkTo={user ? "/diary" : "/login"}
          buttonText={user ? "Open Diary" : "Login to Access"}
          color={user ? "#3B82F6" : "#9CA3AF"}
        />
        <DashboardCard
          title="Time Management"
          description="Plan your weekly Hifz schedule, manage your daily routine, and generate a personalized revision timetable."
          linkTo={user ? "/coach?start=wizard" : "/login"}
          buttonText={user ? "Open Planner" : "Login to Access"}
          color={user ? "#004D40" : "#9CA3AF"}
        />
      </div>
    </div>
  );
};
export default Home;