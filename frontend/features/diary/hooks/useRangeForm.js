// C:\quran-similarity-app\frontend\src\features\diary\hooks\useRangeForm.js
// Fix #14: single hook that replaces the near-identical useJadeedForm and
// useJuzzHaliForm. Pass `type` = 'jadeed' | 'juz_hali' to distinguish them.

import { useState, useEffect } from 'react';
import { fetchPageDetails } from '../../../shared/services/similarityApi';

export default function useRangeForm(type = 'jadeed') {
    const [fromPage, setFromPage]                   = useState('');
    const [toPage, setToPage]                       = useState('');
    const [fromPageDetails, setFromPageDetails]     = useState(null);
    const [toPageDetails, setToPageDetails]         = useState(null);
    const [fromSelectedSurah, setFromSelectedSurah] = useState('');
    const [toSelectedSurah, setToSelectedSurah]     = useState('');
    const [fromAyah, setFromAyah]                   = useState('');
    const [toAyah, setToAyah]                       = useState('');
    const [score, setScore]                         = useState(8);

    useEffect(() => {
        if (fromPage) {
            const pageNum = parseInt(fromPage, 10);
            if (isNaN(pageNum) || pageNum < 1) {
                setFromPageDetails(null);
                setFromSelectedSurah('');
                setFromAyah('');
                return;
            }
            fetchPageDetails(pageNum).then(data => {
                setFromPageDetails(data);
                setFromSelectedSurah(data?.surahs?.length === 1 ? String(data.surahs[0].surah) : '');
                setFromAyah('');
            }).catch(() => setFromPageDetails(null));
        } else {
            setFromPageDetails(null);
            setFromSelectedSurah('');
            setFromAyah('');
        }
    }, [fromPage]);

    useEffect(() => {
        if (toPage) {
            const pageNum = parseInt(toPage, 10);
            if (isNaN(pageNum) || pageNum < 1) {
                setToPageDetails(null);
                setToSelectedSurah('');
                setToAyah('');
                return;
            }
            fetchPageDetails(pageNum).then(data => {
                setToPageDetails(data);
                setToSelectedSurah(data?.surahs?.length === 1 ? String(data.surahs[0].surah) : '');
                setToAyah('');
            }).catch(() => setToPageDetails(null));
        } else {
            setToPageDetails(null);
            setToSelectedSurah('');
            setToAyah('');
        }
    }, [toPage]);

    const getValidAyahs = (details, surah) => {
        if (!details || !details.surahs || !surah) return [];
        const s = details.surahs.find(s => s.surah === Number(surah));
        return s ? s.ayahs : [];
    };

    /**
     * Builds the payload shape expected by the backend for both types.
     * - 'jadeed'   → single object sent directly to /diary/jadeed
     * - 'juz_hali' → wrapped in entries[] array sent to /diary/juz-hali
     */
    const buildFinalPayload = (date) => {
    const base = {
        date,
        range_from_surah: fromSelectedSurah,
        range_from_ayah:  Number(fromAyah),
        range_to_surah:   toSelectedSurah,
        range_to_ayah:    Number(toAyah),
        range_from_name:  fromPageDetails?.surahs?.find(s => s.surah === Number(fromSelectedSurah))?.name || '',
        range_to_name:    toPageDetails?.surahs?.find(s => s.surah === Number(toSelectedSurah))?.name || '',
        score:            Number(score),
    };

    if (type === 'juz_hali') {
  const fromSurahName = fromPageDetails?.surahs?.find(
    s => s.surah === Number(fromSelectedSurah)
  )?.name || `Surah ${fromSelectedSurah}`;
  const toSurahName = toPageDetails?.surahs?.find(
    s => s.surah === Number(toSelectedSurah)
  )?.name || `Surah ${toSelectedSurah}`;

  return {
    range_from: `${fromSurahName} (${fromSelectedSurah}) : ${fromAyah}`,
    range_to:   toSelectedSurah
      ? `${toSurahName} (${toSelectedSurah}) : ${toAyah}`
      : '',
    score: Number(score),
  };
}

    // For jadeed, add structured page/juz data
    if (type === 'jadeed') {
        const fromSurahData = fromPageDetails?.surahs?.find(s => s.surah === Number(fromSelectedSurah));
        const toSurahData = toPageDetails?.surahs?.find(s => s.surah === Number(toSelectedSurah));
        
        return {
            ...base,
            start_page: Number(fromPage),
            finish_page: toPage ? Number(toPage) : null,
            start_juz: fromSurahData?.juz || null,
            finish_juz: toSurahData?.juz || null,
        };
    }

    return base;
};

    const resetAll = () => {
        setFromPage(''); setToPage('');
        setFromAyah(''); setToAyah('');
        setScore(8);
    };

    return {
        fromPage, setFromPage, toPage, setToPage,
        fromPageDetails, toPageDetails,
        fromSelectedSurah, setFromSelectedSurah,
        toSelectedSurah, setToSelectedSurah,
        fromAyah, setFromAyah,
        toAyah, setToAyah,
        score, setScore,
        getValidAyahs, buildFinalPayload, resetAll,
        // legacy alias so existing callers using resetForm still work
        resetForm: resetAll,
    };
}