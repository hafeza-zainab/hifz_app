/**
 * Feature: Similarity Search
 * Purpose: Search for structurally similar Quran verses
 * Features: Auto-search from coach, result selection, AI tip integration
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../shared/context/AppContext';
import { useTour } from '../../shared/context/TourContext';
import SearchBar from './components/SearchBar';
import AyahDisplay from './components/AyahDisplay';
import SimilarityList from './components/SimilaritiesList';
import SidePanel from './components/SidePanel';

export default function SimilarityPage() {
  const location = useLocation();
  const { results, setSelectedResult } = useAppContext();
  const { isActive, currentStep, onResultsFound, onResultClicked } = useTour();
  const [hasSearched, setHasSearched] = useState(false);

  // Passed from CoachPage via navigate('/similarity', { state: { ... } })
  const autoSearch = location.state?.autoSearch || false;
  const autoSurah  = location.state?.surah      || null;
  const autoAyah   = location.state?.ayah       || null;
  const autoTargetSurah = location.state?.targetSurah || null;
  const autoTargetAyah  = location.state?.targetAyah  || null;

  console.log('SimilarityPage state:', { autoSearch, autoSurah, autoAyah, autoTargetSurah, autoTargetAyah });

  // SearchBar exposes a trigger function through this ref
  const searchRef = useRef(null);

  useEffect(() => {
    if (autoSearch && autoSurah && autoAyah) {
      const timer = setTimeout(() => {
        console.log('searchRef.current:', searchRef.current);
        if (searchRef.current && searchRef.current.triggerSearch) {
          searchRef.current.triggerSearch(String(autoSurah), String(autoAyah));
        } else {
          console.error('searchRef.current.triggerSearch is not available:', searchRef.current);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoSearch, autoSurah, autoAyah]);

  // Auto-select the target result if specified
  useEffect(() => {
    console.log('Auto-select target result:', { autoTargetSurah, autoTargetAyah, resultsCount: results.length });
    if (autoTargetSurah && autoTargetAyah && results.length > 0) {
      const targetResult = results.find(
        r => r.target_surah === Number(autoTargetSurah) && r.target_ayah === Number(autoTargetAyah)
      );
      console.log('Found target result:', targetResult);
      if (targetResult) {
        setSelectedResult(targetResult);
      } else {
        console.log('Target result not found in results');
      }
    }
  }, [results, autoTargetSurah, autoTargetAyah, setSelectedResult]);

  // Tour step 1: Detect when results appear
  useEffect(() => {
    if (isActive && currentStep === 3 && results.length > 0 && !hasSearched) {
      setHasSearched(true);
      onResultsFound();
    }
  }, [isActive, currentStep, results.length, hasSearched, onResultsFound]);

  // Tour step 3: Detect when result is clicked
  const handleResultClick = (result) => {
    setSelectedResult(result);
    if (isActive && currentStep === 4) {
      onResultClicked();
    }
  };

  return (
    <div className="similarity-page-wrapper">
      <SearchBar ref={searchRef} />

      <div className="similarity-main-grid">
        <div className="similarity-left-col">
          <AyahDisplay />
          <SimilarityList onResultClick={handleResultClick} />
        </div>
        <div className="similarity-right-col">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}