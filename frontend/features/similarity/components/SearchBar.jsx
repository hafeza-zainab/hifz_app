// C:\quran-similarity-app\frontend\src\features\similarity\components\SearchBar.jsx
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { fetchSurahs, fetchAyahs, fetchSimilarities } from '../../../shared/services/similarityApi';
import { useAppContext } from '../../../shared/context/AppContext';
import MARHALA_MAP from '../../../shared/utils/marhalaMapper';
import '../../../styles/SearchBar.css';

const SearchBar = forwardRef(function SearchBar(props, ref) {
    const { setSourceAyah, setResults, setIsLoading } = useAppContext();
    const [surahs, setSurahs]               = useState([]);
    const [ayahs, setAyahs]                 = useState([]);
    const [selectedSurah, setSelectedSurah] = useState('');
    const [selectedAyah, setSelectedAyah]   = useState('');
    const [inputError, setInputError]       = useState('');
    const [marhala, setMarhala]             = useState('');
    const [juzz, setJuzz]                   = useState([]);

    useEffect(() => {
        fetchSurahs().then(data => setSurahs(data));
    }, []);

    useEffect(() => {
        if (selectedSurah) {
            fetchAyahs(selectedSurah).then(data => {
                setAyahs(data);
                setSelectedAyah('');
                setInputError('');
            });
        } else {
            setAyahs([]);
            setSelectedAyah('');
        }
    }, [selectedSurah]);

    // Core search logic extracted so it can be called programmatically
    const runSearch = async (surahNum, ayahNum, marhalaFilter = '', juzzFilter = []) => {
        setInputError('');
        if (!surahNum || !ayahNum) {
            setInputError("Please select a Surah and Ayah.");
            return;
        }
        setIsLoading(true);
        try {
            console.log('SearchBar: Calling fetchSimilarities with params:', { surahNum, ayahNum, marhalaFilter, juzzFilter });
            const res = await fetchSimilarities(surahNum, ayahNum, marhalaFilter, juzzFilter.join(','));
            console.log('SearchBar: fetchSimilarities response:', res);
            if (res.success) {
                setSourceAyah(res.data.source);
                setResults(res.data.results);
                if (res.data.results.length === 0) {
                    setInputError(`No similarities found for Surah ${surahNum}, Ayah ${ayahNum}.`);
                }
            } else {
                setInputError("Failed to fetch: " + (res.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('[SearchBar] Failed to search for ayah:', `${surahNum}:${ayahNum}`, err);
            setInputError("Network error. Is the backend server running?");
        } finally {
            setIsLoading(false);
        }
    };

    // Expose programmatic trigger to parent via ref
    useImperativeHandle(ref, () => ({
        triggerSearch: async (surah, ayah) => {
            const surahNum = parseInt(surah);
            const ayahNum  = parseInt(ayah);

            // Pre-select the dropdowns so the UI reflects the auto-search
            setSelectedSurah(String(surahNum));

            // Wait for ayahs to load for this surah
            const ayahList = await fetchAyahs(surahNum);
            setAyahs(ayahList);
            setSelectedAyah(String(ayahNum));

            await runSearch(surahNum, ayahNum, marhala, juzz);
        }
    }));

    const handleSearch = async (e) => {
        e.preventDefault();
        await runSearch(parseInt(selectedSurah), parseInt(selectedAyah), marhala, juzz);
    };

    const handleMarhalaChange = (e) => {
        setMarhala(e.target.value);
        setJuzz([]);
    };

    return (
        <div className="search-container">
            <form onSubmit={handleSearch} className="search-form" data-tour="similarity-search-form">
                <select
                    value={selectedSurah}
                    onChange={(e) => setSelectedSurah(e.target.value)}
                    className="surah-select"
                >
                    <option value="">Select Surah</option>
                    {surahs.map(s => (
                        <option key={s.surah} value={s.surah}>
                            {s.surah} - {s.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedAyah}
                    onChange={(e) => setSelectedAyah(e.target.value)}
                    className="ayah-select"
                    disabled={ayahs.length === 0}
                    required
                >
                    <option value="">
                        {ayahs.length === 0 ? 'Select Surah First' : 'Select Ayah'}
                    </option>
                    {ayahs.map(a => (
                        <option key={a.ayah} value={a.ayah}>
                            Ayah {a.ayah}
                        </option>
                    ))}
                </select>

                <button type="submit" disabled={!selectedSurah || !selectedAyah} data-tour="similarity-search-button">
                    Find Similarities
                </button>
            </form>

            {inputError && (
                <div className="ui-error-message">⚠️ {inputError}</div>
            )}

            <div className="filters" data-tour="similarity-filters">
                <select value={marhala} onChange={handleMarhalaChange} data-tour="similarity-filter-dropdown">
                    <option value="">Full Quran</option>
                    {Object.keys(MARHALA_MAP).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {marhala && (
                    <select
                        multiple
                        value={juzz}
                        onChange={(e) => setJuzz(Array.from(e.target.selectedOptions, o => o.value))}
                    >
                        {MARHALA_MAP[marhala].map(j => (
                            <option key={j} value={j}>Juzz {j}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;