// backend/modules/coach/sequenceWizard.controller.js
"use strict";

const ayahRepo = require("../../repositories/ayah.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");
const SEQUENCE_PROMPT = require("./prompts/sequence.prompt");
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Helper Functions ─────────────────────────────────────────────────────────────
const extractFirstThreeWords = (text) => {
  if (!text) return '';
  return text.split(' ').slice(0, 3).join(' ');
};

// ─── Arabic Surah Names Mapping ─────────────────────────────────────────────────────
const ARABIC_SURAH_NAMES = {
  1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة",
  6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
  11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر",
  16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
  21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان",
  26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
  31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر",
  36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
  41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية",
  46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
  51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن",
  56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
  61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق",
  66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
  71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة",
  76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
  81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج",
  86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
  91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين",
  96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
  101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل",
  106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
  111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

// ─── Sequence Wizard Controllers (Backend-Only Traversal Logic) ─────────────

/**
 * Sequence of Ayah in Surah - Backend deterministic fetch
 * POST /api/coach/wizard/sequence/surah
 * Body: { surah: number|string, mode: 'starting'|'ending' }
 */
exports.getSurahSequence = async (req, res, next) => {
    try {
        const { surah, mode } = req.body;

        console.log('getSurahSequence received:', { surah, mode });

        if (!surah || !mode) {
            return res.status(400).json(formatError("surah and mode are required."));
        }

        // Backend-only traversal logic (deterministic)
        const ayahs = await ayahRepo.getFullAyahsBySurah(surah);
        
        // Order by ayah number (deterministic)
        const orderedAyahs = ayahs.sort((a, b) => a.ayah - b.ayah);

        // Get page range for this surah
        const pages = orderedAyahs.map(a => a.page);
        const minPage = Math.min(...pages);
        const maxPage = Math.max(...pages);

        // Format output based on mode (deterministic)
        const formattedAyahs = orderedAyahs.map((ayah) => {
            const words = ayah.text.split(' ');
            let displayText;
            
            console.log(`Processing ayah ${ayah.surah}:${ayah.ayah}, mode: ${mode}, word count: ${words.length}`);
            
            if (mode === 'starting') {
                displayText = words.slice(0, 3).join(' ');
                console.log(`Starting mode: ${displayText}`);
            } else { // ending
                displayText = words.slice(-3).join(' ');
                console.log(`Ending mode: ${displayText}`);
            }

            return {
                reference: `${ayah.name} (${ayah.surah}:${ayah.ayah})`,
                text: displayText,
                fullText: ayah.text,
            };
        });

        const result = {
            surahName: orderedAyahs[0]?.name || 'Unknown',
            surahNumber: surah,
            mode,
            ayahs: formattedAyahs,
            // Add metadata for study questions with real data
            ayahCount: orderedAyahs.length,
            juzInfo: `Juz ${orderedAyahs[0]?.juz || 'Unknown'}`,
            pageInfo: `Pages ${minPage}-${maxPage}`,
            neighboringSurahs: {
                previous: surah > 1 ? `${ARABIC_SURAH_NAMES[surah - 1] || 'Surah ' + (surah - 1)}` : 'N/A',
                current: `${ARABIC_SURAH_NAMES[surah] || orderedAyahs[0]?.name || 'Unknown'}`,
                next: surah < 114 ? `${ARABIC_SURAH_NAMES[surah + 1] || 'Surah ' + (surah + 1)}` : 'N/A',
            },
        };

        console.log('getSurahSequence result:', result);
        res.status(200).json(formatSuccess(result));
    } catch (err) {
        next(err);
    }
};

/**
 * Sequence of Ayah in Page - Backend deterministic fetch
 * POST /api/coach/wizard/sequence/page
 * Body: { page: number, mode: 'starting'|'ending' }
 */
exports.getPageSequence = async (req, res, next) => {
    try {
        const { page, mode } = req.body;

        if (!page || !mode) {
            return res.status(400).json(formatError("page and mode are required."));
        }

        // Backend-only traversal logic (deterministic)
        const pageDetails = await ayahRepo.getPageDetails(page);
        
        if (!pageDetails) {
            return res.status(404).json(formatError("Page not found."));
        }

        // Get ayahs on this page (deterministic ordering)
        const ayahs = await ayahRepo.getAyahsByPage(page);
        
        // Order by surah then ayah (deterministic)
        const orderedAyahs = ayahs.sort((a, b) => {
            if (a.surah !== b.surah) return a.surah - b.surah;
            return a.ayah - b.ayah;
        });

        // Get first and last ayah for neighboring info
        const firstAyah = await ayahRepo.getFirstAyahOfPage(page);
        const lastAyah = await ayahRepo.getLastAyahOfPage(page);

        // Get neighboring page ayahs - fetch each separately by surah+ayah number
        let prevPageLast = null;
        let nextPageFirst = null;

        if (page > 1) {
            const prevPageLastAyah = await ayahRepo.getLastAyahOfPage(page - 1);
            if (prevPageLastAyah) {
                // Fetch the actual ayah text separately using getAyah
                const prevPageLastText = await ayahRepo.getAyah(prevPageLastAyah.surah, prevPageLastAyah.ayah);
                prevPageLast = {
                    reference: `${prevPageLastAyah.name} (${prevPageLastAyah.surah}:${prevPageLastAyah.ayah})`,
                    text: prevPageLastText?.text || '',
                };
                console.log('[NEIGHBORING AYAH] Previous page last:', { ref: prevPageLast.reference, text: prevPageLast.text });
            }
        }

        const nextPageLastAyah = await ayahRepo.getLastAyahOfPage(page + 1);
        if (nextPageLastAyah) {
            // Fetch the first ayah of the next page separately
            const nextPageFirstAyah = await ayahRepo.getFirstAyahOfPage(page + 1);
            if (nextPageFirstAyah) {
                const nextPageFirstText = await ayahRepo.getAyah(nextPageFirstAyah.surah, nextPageFirstAyah.ayah);
                nextPageFirst = {
                    reference: `${nextPageFirstAyah.name} (${nextPageFirstAyah.surah}:${nextPageFirstAyah.ayah})`,
                    text: nextPageFirstText?.text || '',
                };
                console.log('[NEIGHBORING AYAH] Next page first:', { ref: nextPageFirst.reference, text: nextPageFirst.text });
            }
        }

        // Fetch current page first and last ayah text separately
        const currentPageFirstText = firstAyah ? await ayahRepo.getAyah(firstAyah.surah, firstAyah.ayah) : null;
        const currentPageLastText = lastAyah ? await ayahRepo.getAyah(lastAyah.surah, lastAyah.ayah) : null;

        if (currentPageFirstText) {
            console.log('[NEIGHBORING AYAH] Current page first:', { ref: `${firstAyah.name} (${firstAyah.surah}:${firstAyah.ayah})`, text: currentPageFirstText.text });
        }
        if (currentPageLastText) {
            console.log('[NEIGHBORING AYAH] Current page last:', { ref: `${lastAyah.name} (${lastAyah.surah}:${lastAyah.ayah})`, text: currentPageLastText.text });
        }

        // Format output based on mode (deterministic)
        const formattedAyahs = orderedAyahs.map((ayah) => {
            const words = ayah.text.split(' ');
            let displayText;
            
            if (mode === 'starting') {
                displayText = words.slice(0, 3).join(' ');
            } else { // ending
                displayText = words.slice(-3).join(' ');
            }

            return {
                reference: `${ayah.name} (${ayah.surah}:${ayah.ayah})`,
                text: displayText,
                fullText: ayah.text,
            };
        });

        const result = {
            pageNumber: page,
            mode,
            ayahs: formattedAyahs,
            // Add metadata for study questions with real data
            firstAyah: firstAyah ? `${firstAyah.name} (${firstAyah.surah}:${firstAyah.ayah})` : 'Unknown',
            firstAyahText: currentPageFirstText?.text || '',
            lastAyah: lastAyah ? `${lastAyah.name} (${lastAyah.surah}:${lastAyah.ayah})` : 'Unknown',
            lastAyahText: currentPageLastText?.text || '',
            ayahCount: orderedAyahs.length,
            juzSurahInfo: `Juz ${pageDetails.surahs[0]?.juz || 'Unknown'}, ${pageDetails.surahs.map(s => s.name).join(', ')}`,
            neighboringAyahs: {
                previousPageLast: prevPageLast?.reference || 'N/A',
                previousPageLastText: prevPageLast?.text || '',
                currentPageFirst: firstAyah ? `${firstAyah.name} (${firstAyah.surah}:${firstAyah.ayah})` : 'Unknown',
                currentPageFirstText: currentPageFirstText?.text || '',
                currentPageLast: lastAyah ? `${lastAyah.name} (${lastAyah.surah}:${lastAyah.ayah})` : 'Unknown',
                currentPageLastText: currentPageLastText?.text || '',
                nextPageFirst: nextPageFirst?.reference || 'N/A',
                nextPageFirstText: nextPageFirst?.text || '',
            },
        };

        console.log(`[PAGE SEQUENCE] Page ${page} has ${orderedAyahs.length} ayahs`);
        console.log('getPageSequence result:', result);
        res.status(200).json(formatSuccess(result));
    } catch (err) {
        next(err);
    }
};

/**
 * Sequence of Pages in Juz - Backend deterministic fetch
 * POST /api/coach/wizard/sequence/juz-pages
 * Body: { juz: number, mode: 'starting'|'ending' }
 */
exports.getJuzPagesSequence = async (req, res, next) => {
    try {
        const { juz, mode } = req.body;

        if (!juz || !mode) {
            return res.status(400).json(formatError("juz and mode are required."));
        }

        // Backend-only traversal logic (deterministic)
        const juzPages = await ayahRepo.getPagesByJuz(juz);
        
        // Order by page number (deterministic)
        const orderedPages = juzPages.sort((a, b) => a.page - b.page);

        // Format output based on mode (deterministic)
        const formattedPages = await Promise.all(orderedPages.map(async (pageData) => {
            const ayahs = await ayahRepo.getAyahsByPage(pageData.page);
            let displayText;
            let selectedAyah;
            
            console.log(`[JUZ PAGES] Processing page ${pageData.page}, mode: ${mode}, ayahs count: ${ayahs.length}`);
            
            if (mode === 'starting') {
                // First ayah, first 3 words
                selectedAyah = ayahs.sort((a, b) => {
                    if (a.surah !== b.surah) return a.surah - b.surah;
                    return a.ayah - b.ayah;
                })[0];
                const words = selectedAyah?.text?.split(' ') || [];
                displayText = words.slice(0, 3).join(' ');
                console.log(`[JUZ PAGES] Page ${pageData.page} starting: first ayah ${selectedAyah?.surah}:${selectedAyah?.ayah}, text: ${displayText}`);
            } else { // ending
                // Last ayah, last 3 words
                selectedAyah = ayahs.sort((a, b) => {
                    if (a.surah !== b.surah) return b.surah - a.surah;
                    return b.ayah - a.ayah;
                })[0];
                const words = selectedAyah?.text?.split(' ') || [];
                displayText = words.slice(-3).join(' ');
                console.log(`[JUZ PAGES] Page ${pageData.page} ending: last ayah ${selectedAyah?.surah}:${selectedAyah?.ayah}, text: ${displayText}`);
            }

            return {
                pageNumber: pageData.page,
                surahName: ayahs[0]?.name || 'Unknown',
                text: displayText,
                surahNum: selectedAyah?.surah || null,
                ayahNum: selectedAyah?.ayah || null,
            };
        }));

        const firstPage = orderedPages[0]?.page;
        const lastPage = orderedPages[orderedPages.length - 1]?.page;

        // Get the actual first and last ayahs of the juz for study questions
        const firstAyahOfJuz = await ayahRepo.getFirstAyahOfPage(firstPage);
        const lastAyahOfJuz = await ayahRepo.getLastAyahByJuz(juz);
        
        // Use FULL ayah text for study questions (not just 3 words)
        const firstPageFirstAyahText = firstAyahOfJuz?.text || '';
        const lastPageLastAyahText = lastAyahOfJuz?.text || '';
        
        console.log(`[JUZ PAGES] First ayah of juz: ${firstAyahOfJuz?.surah}:${firstAyahOfJuz?.ayah}, full text length: ${firstPageFirstAyahText.length}`);
        console.log(`[JUZ PAGES] Last ayah of juz: ${lastAyahOfJuz?.surah}:${lastAyahOfJuz?.ayah}, full text length: ${lastPageLastAyahText.length}`);

        // Get unique surahs with their numbers for Question 3
        const surahsInJuz = await ayahRepo.getSurahsByJuz(juz);
        const surahList = `${surahsInJuz.length} surahs: ${surahsInJuz
            .map(s => `${s.name} (Surah ${s.surah})`)
            .join(', ')}`;
        
        console.log(`[JUZ PAGES] Surah list: ${surahList}`);

        const result = {
            juzNumber: juz,
            mode,
            pages: formattedPages,
            // Add metadata for study questions with real data
            firstPage: firstPage || 'Unknown',
            lastPage: lastPage || 'Unknown',
            pageCount: orderedPages.length,
            surahList: surahList,
            // For study questions: use actual first and last ayahs of the juz
            firstPageFirstAyah: firstPageFirstAyahText,
            lastPageLastAyah: lastPageLastAyahText,
        };

        console.log('getJuzPagesSequence result:', result);
        res.status(200).json(formatSuccess(result));
    } catch (err) {
        next(err);
    }
};

/**
 * Sequence of Surahs in Juz - Backend deterministic fetch
 * POST /api/coach/wizard/sequence/juz-surahs
 * Body: { juz: number }
 */
exports.getJuzSurahSequence = async (req, res, next) => {
    try {
        const { juz } = req.body;

        if (!juz) {
            return res.status(400).json(formatError("juz is required."));
        }

        console.log('getJuzSurahSequence received:', { juz });

        // Backend-only traversal logic (deterministic)
        const surahs = await ayahRepo.getSurahsByJuz(juz);
        
        console.log('Surahs found in juz:', surahs);

        // Format output (deterministic) - use Arabic names and include first ayah
        const formattedSurahs = await Promise.all(surahs.map(async (surah) => {
            // Get the first ayah of this surah
            const firstAyah = await ayahRepo.getAyah(surah.surah, 1);
            const firstAyahText = firstAyah?.text || '';
            const firstWord = firstAyahText ? extractFirstThreeWords(firstAyahText) : '';
            
            return {
                number: surah.surah,
                name: ARABIC_SURAH_NAMES[surah.surah] || surah.name, // Use Arabic name if available, fallback to English
                firstAyahText: firstAyahText,
                firstWord: firstWord,
            };
        }));

        const result = {
            juzNumber: juz,
            surahs: formattedSurahs,
            // Add metadata for study questions
            surahDetails: formattedSurahs.map(s => `${s.number}: ${s.name}`).join(', '),
            surahNumbers: formattedSurahs.map(s => s.number).join(', '),
            surahAyahCounts: 'See Quran data for ayah counts',
        };

        console.log('getJuzSurahSequence result:', result);
        res.status(200).json(formatSuccess(result));
    } catch (err) {
        next(err);
    }
};

/**
 * Helper: Use LLM ONLY to format sequence output (no traversal logic)
 * This is optional - backend can format output deterministically without LLM
 */
async function formatSequenceWithLLM(sequenceData) {
    const sequenceText = JSON.stringify(sequenceData, null, 2);
    
    const messages = [
        { role: "system", content: SEQUENCE_PROMPT },
        { role: "user", content: `Format this sequence for readability:\n\n${sequenceText}` },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 1000,
            temperature: 0.3,
        }),
    });

    if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    return groqData.choices[0].message.content;
}
