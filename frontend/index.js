// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';

import './styles/Navbar.css';
import './styles/AuthPages.css';
import './styles/DashboardCard.css';
import './styles/BestMethodPage.css';
import './styles/DiaryPage.css';
import './styles/DailyTasks.css';
import './styles/AnalyticsView.css';
import './styles/PerformanceAnalyticsView.css';
import './styles/QuranMapView.css';
import './styles/SearchBar.css';
import './styles/AyahDisplay.css';
import './styles/SimilarityList.css';
import './styles/SidePanel.css';
import './styles/StreakBanner.css';
import './styles/ThemeBanner.css';
import './styles/ThemeSelector.css';
import './styles/LoadingSpinner.css';
import './styles/Flashcards.css';
import './styles/Responsive.css';

import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);