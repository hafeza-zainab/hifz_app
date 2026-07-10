// C:\quran-similarity-app\frontend\src\features\diary\hooks\useMurajahForm.js
import { useState } from 'react';
import { fetchJuzPages } from '../../../shared/services/similarityApi';

export default function useMurajahForm() {
    const [currentJuzInput, setCurrentJuzInput] = useState('');
    const [availablePages, setAvailablePages]   = useState([]);
    const [activeSuwal, setActiveSuwal]         = useState([{ id: 1, page: '', score: 8 }]);
    const [queuedJuzData, setQueuedJuzData]     = useState([]);

    const loadPagesForJuz = async (juzNum) => {
        if (!juzNum || juzNum < 1 || juzNum > 30) {
            setAvailablePages([]);
            return;
        }
        const pages = await fetchJuzPages(juzNum);
        setAvailablePages(pages || []);
    };

    const handleGenerateTemplate = () => {
        if (!currentJuzInput || availablePages.length === 0) return;
        setActiveSuwal([{ id: 1, page: '', score: 8 }]);
    };

    const addNewSuwal = () =>
        setActiveSuwal(prev => [...prev, { id: prev.length + 1, page: '', score: 8 }]);

    const removeSuwal = (index) =>
        setActiveSuwal(prev => prev.filter((_, i) => i !== index));

    const updateSuwal = (index, field, value) =>
        setActiveSuwal(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: field === 'score' ? Number(value) : value,
            };
            return updated;
        });

    const queueJuz = () => {
        if (!currentJuzInput || !activeSuwal.every(s => s.page !== '')) return;
        setQueuedJuzData(prev => [...prev, { juz: currentJuzInput, suwal: activeSuwal }]);
        resetCurrentJuz();
    };

    const buildFinalPayload = () => {
        const finalQueue = [...queuedJuzData];
        if (activeSuwal.some(s => s.page !== '') && currentJuzInput) {
            finalQueue.push({ juz: currentJuzInput, suwal: activeSuwal });
        }
        return finalQueue.flatMap(j =>
            j.suwal.map(s => ({
                range_from: `Juz ${j.juz} - Su'al ${s.id} (Pg ${s.page})`,
                score: Number(s.score),
            }))
        );
    };

    const resetCurrentJuz = () => {
        setCurrentJuzInput('');
        setAvailablePages([]);
        setActiveSuwal([{ id: 1, page: '', score: 8 }]);
    };

    const resetAll = () => {
        resetCurrentJuz();
        setQueuedJuzData([]);
    };

    return {
        currentJuzInput, setCurrentJuzInput,
        availablePages,
        activeSuwal,
        queuedJuzData,
        loadPagesForJuz,
        handleGenerateTemplate,
        addNewSuwal,
        updateSuwal,
        removeSuwal,
        queueJuz,
        buildFinalPayload,
        resetCurrentJuz,
        resetAll,
    };
}