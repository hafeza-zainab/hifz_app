//C:\quran-similarity-app\frontend\src\features\diary\hooks\useTasmeeForm.js
import { useState } from 'react';
import { fetchPagesInRange } from '../../../shared/services/similarityApi';

export default function useTasmeeForm() {
    const [tasmeeStart, setTasmeeStart]     = useState('');
    const [tasmeeEnd, setTasmeeEnd]         = useState('');
    const [tasmeeTemplate, setTasmeeTemplate] = useState([]);

    const generateTemplate = async () => {
        const s = parseInt(tasmeeStart), e = parseInt(tasmeeEnd);
        if (!s || !e || s > e || s < 1 || e > 604) return alert("Invalid page range.");
        const pages = await fetchPagesInRange(s, e);
        if (!pages || pages.length === 0) return alert("No pages found.");
        setTasmeeTemplate(pages.map(p => ({ ...p, score: 8 })));
    };

    const updateTemplate = (index, field, value) => {
        const updated = [...tasmeeTemplate];
        updated[index][field] = field === 'score' ? Number(value) : value;
        setTasmeeTemplate(updated);
    };

    const buildFinalPayload = () =>
        tasmeeTemplate.map(t => ({ range_from: `Juz ${t.juz} - Page ${t.page}`, score: t.score }));

    const resetAll = () => { setTasmeeStart(''); setTasmeeEnd(''); setTasmeeTemplate([]); };

    return { tasmeeStart, setTasmeeStart, tasmeeEnd, setTasmeeEnd, tasmeeTemplate, generateTemplate, updateTemplate, buildFinalPayload, resetAll };
}