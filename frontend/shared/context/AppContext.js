/**
 * Application Context
 * Purpose: Manages shared application state (similarity search results, tips)
 * Features: Source ayah, results, selected result, tips state
 */
import React, { createContext, useState, useMemo } from 'react';
export const AppContext = createContext();
export const AppProvider = ({ children }) => {
    const [sourceAyah, setSourceAyah] = useState(null);
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tips, setTips] = useState([]); // Move tips to context so it can be cleared from SimilaritiesList
    
    const value = useMemo(() => ({
        sourceAyah, setSourceAyah, 
        results, setResults, 
        selectedResult, setSelectedResult, 
        isLoading, setIsLoading, 
        tips, setTips
    }), [sourceAyah, results, selectedResult, isLoading, tips]);
    
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
export const useAppContext = () => React.useContext(AppContext);