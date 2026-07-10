// C:\quran-similarity-app\frontend\src\features\similarity\components\SimilaritiesList.jsx
import React from 'react';
import { useAppContext } from '../../../shared/context/AppContext';
import '../../../styles/SimilarityList.css';

export default function SimilarityList({ onResultClick }) {
    const { results, setSelectedResult, selectedResult, setTips } = useAppContext();
    
    if (!results || results.length === 0) {
        return <div className="no-results">No similarities found.</div>;
    }

    const handleCardClick = (r) => {
        // Clear tips immediately when switching to a new similarity
        setTips([]);
        setSelectedResult(r);
        // Call tour callback if provided
        if (onResultClick) {
            onResultClick(r);
        }
    };

    return (
        <div className="results-list" data-tour="similarity-results-list">
            {results.map((r) => (
                <div
                    key={`${r.target_surah}-${r.target_ayah}`}
                    className={`result-card ${
                        selectedResult?.target_surah === r.target_surah &&
                        selectedResult?.target_ayah === r.target_ayah
                            ? 'active'
                            : ''
                    }`}
                    onClick={() => handleCardClick(r)}
                >
                    <div className="result-top">
                        <span className="result-identity">
                            ({r.target_page}) ({r.target_surah}. {r.name}) ({r.target_ayah})
                        </span>
                        <span className={`badge badge-${r.strength_label.toLowerCase()}`} data-tour="similarity-score-badge">
                            {Math.round(r.similarity_score * 100)}% - {r.strength_label}
                        </span>
                    </div>
                    
                    <div className="result-body">
                        <div className="card-text" dir="rtl">{r.text}</div>
                    </div>
                    
                    {/* Changed "Mode:" to "Focus on:" */}
                    <div className="result-bottom">
                        Juz: {r.juz} | Focus on: {r.highlight_mode}
                    </div>
                </div>
            ))}
        </div>
    );
}