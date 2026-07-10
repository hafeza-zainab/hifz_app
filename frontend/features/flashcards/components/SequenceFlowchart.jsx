// C:\quran-similarity-app\frontend\src\features\flashcards\components\SequenceFlowchart.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { authFetch } from '../../../shared/services/http';

// ── Surah names lookup (index 0 empty so SURAH_NAMES[1] === "Al-Fatihah") ───────
const SURAH_NAMES = [
  "",
  "Al-Fatihah", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Ma'idah",
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr",
  "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
  "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
  "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
  "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil",
  "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas",
];

// ── Build surah name to number lookup map ───────────────────────────────────────
const SURAH_NAME_TO_NUMBER = new Map();
SURAH_NAMES.forEach((name, index) => {
  if (name) {
    SURAH_NAME_TO_NUMBER.set(name.toLowerCase(), index);
    // Also add without "Al-" prefix for easier matching
    if (name.startsWith("Al-")) {
      SURAH_NAME_TO_NUMBER.set(name.substring(3).toLowerCase(), index);
    }
  }
});

// ── Detect set type and number from set name ──────────────────────────────────
function detectSetInfo(setName) {
  const pageMatch = setName.match(/\b(?:page|pg\.?)\s*(\d{1,3})\b/i);
  if (pageMatch) return { type: "page", num: parseInt(pageMatch[1]) };

  const juzPagesMatch = setName.match(/\b(?:juz|juzz|para|sipara)\s*(\d{1,2})\s*pages\b/i);
  if (juzPagesMatch) return { type: "juz-pages", num: parseInt(juzPagesMatch[1]) };

  // Juz without "Pages" keyword → juz-surahs (surah sequence)
  // Must check this AFTER juz-pages to avoid matching "Juz X Pages" as juz-surahs
  const juzSurahsMatch = setName.match(/\b(?:juz|juzz|para|sipara)\s*(\d{1,2})\b/i);
  if (juzSurahsMatch && !juzPagesMatch) return { type: "juz-surahs", num: parseInt(juzSurahsMatch[1]) };

  const bracketMatch = setName.match(/\((\d{1,3})\)/);
  if (bracketMatch) return { type: "surah", num: parseInt(bracketMatch[1]) };

  const surahWordMatch = setName.match(/\bsurah\s+(\d{1,3})\b/i);
  if (surahWordMatch) return { type: "surah", num: parseInt(surahWordMatch[1]) };

  const plainNum = setName.match(/\b(\d{1,3})\b/);
  if (plainNum) return { type: "surah", num: parseInt(plainNum[1]) };

  // Check for surah name in the set name (e.g., "Al-Falaq", "Al-Nas", "Fatihah")
  const lowerName = setName.toLowerCase();
  for (const [name, num] of SURAH_NAME_TO_NUMBER) {
    if (lowerName.includes(name)) {
      return { type: "surah", num };
    }
  }

  return null;
}

// ── Detect whether a set was generated with "ending" (last words) mode ────────
// Looks for keywords in the set name like "Ending", "Last Words", "End"
function isEndingMode(setName) {
  return /\b(ending|end|last\s*word)/i.test(setName);
}

// ── Build the printable HTML string ──────────────────────────────────────────
function buildPrintHTML(ayahs, setName, ending) {

  // Build flowchart nodes without pre-calculating rows - let CSS handle wrapping
  const flowchartNodes = ayahs.map((a, i) => `
    <div class="node-group" data-index="${i}">
      <div class="node">
        <div class="node-badge">${a.ayah}</div>
        <div class="node-word">${a.firstWord}</div>
        <div class="node-label">Ayah ${a.ayah}</div>
      </div>
      <div class="arrow-horizontal"></div>
    </div>
  `).join("");


  return `<!DOCTYPE html>
<html lang="ar" dir="ltr">
<head>
  <meta charset="utf-8"/>
  <title>Sequence Memory Aid — ${setName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: white; padding: 32px 40px; color: #111827; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #004D40; }
    .header-title { font-size: 22px; font-weight: 700; color: #004D40; margin-bottom: 6px; }
    .header-sub   { font-size: 13px; color: #6B7280; }
    .flowchart { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; width: 100%; }
    .node-group { page-break-inside: avoid; break-inside: avoid; display: flex; align-items: center; flex-shrink: 0; }
    .node { background: linear-gradient(135deg, #004D40 0%, #00695C 100%); color: white; border-radius: 12px; padding: 10px 20px; min-width: 200px; max-width: 280px; text-align: center; position: relative; margin-top: 8px; box-shadow: 0 3px 10px rgba(0,77,64,0.28); }
    .node-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: #F2C94C; color: #1a1a1a; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    .node-word { font-family: 'Traditional Arabic', 'Amiri', serif; font-size: 20px; font-weight: 700; direction: rtl; margin-bottom: 4px; line-height: 1.4; }
    .node-label { font-size: 11px; opacity: 0.72; direction: ltr; }
    .arrow-horizontal { width: 30px; height: 2px; background: #004D40; position: relative; flex-shrink: 0; }
    .arrow-horizontal::before { content: ''; position: absolute; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 5px solid transparent; border-bottom: 5px solid transparent; }
    .arrow-horizontal.arrow-left::before { right: -2px; border-left: 8px solid #004D40; }
    .arrow-horizontal.arrow-right::before { left: -2px; border-right: 8px solid #004D40; }
    .row-connector { width: 2px; height: 20px; background: #004D40; margin: 0 auto; position: relative; }
    .row-connector::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #004D40; }
    .footer { text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 14px; margin-top: 8px; }
    @media print {
      body { padding: 20px 24px; }
      .header { page-break-after: auto; }
      .node-group { page-break-inside: avoid; break-inside: avoid; }
      .node { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .node-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .arrow-horizontal, .row-connector { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-title">📊 Sequence Memory Aid</div>
    <div class="header-sub">${setName} · ${ayahs.length} ayahs · Generated ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
  </div>
  <div class="flowchart" id="flowchart">${flowchartNodes}</div>
  <div class="footer">حفظ القرآن · Hifz al-Quran Platform</div>
  <script>
    // Snake layout: detect rows after CSS wrapping and apply direction alternation
    (function() {
      const flowchart = document.getElementById('flowchart');
      const nodes = Array.from(flowchart.querySelectorAll('.node-group'));
      if (nodes.length === 0) return;
      
      // Detect rows by measuring actual positions after CSS wrapping
      const rows = [];
      let currentRow = [];
      let lastY = null;
      
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const y = rect.top;
        
        if (lastY === null || Math.abs(y - lastY) > 10) {
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [node];
        } else {
          currentRow.push(node);
        }
        lastY = y;
      });
      
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      
      // Apply snake layout: even rows = RTL (row-reverse), odd rows = LTR
      rows.forEach((row, rowIndex) => {
        const isEvenRow = rowIndex % 2 === 0;
        const flexDirection = isEvenRow ? 'row-reverse' : 'row';
        const arrowClass = isEvenRow ? 'arrow-left' : 'arrow-right';
        
        // Apply flex-direction to the row's nodes
        row.forEach((node, nodeIndex) => {
          const isLastInRow = nodeIndex === row.length - 1;
          const arrow = node.querySelector('.arrow-horizontal');
          
          if (arrow) {
            if (isLastInRow) {
              // Hide last horizontal arrow in each row
              arrow.style.display = 'none';
            } else {
              // Set arrow direction based on row
              arrow.className = 'arrow-horizontal ' + arrowClass;
            }
          }
        });
        
        // Apply row-reverse to even rows by reversing the DOM order
        if (isEvenRow && row.length > 1) {
          const parent = flowchart;
          const rowNodes = row.slice().reverse();
          rowNodes.forEach(node => {
            parent.insertBefore(node, parent.firstChild);
          });
        }
        
        // Add row connector between rows (except after last row)
        if (rowIndex < rows.length - 1) {
          const lastNode = row[row.length - 1];
          const connector = document.createElement('div');
          connector.className = 'row-connector';
          lastNode.parentNode.insertBefore(connector, lastNode.nextSibling);
        }
      });
    })();
  </script>
</body>
</html>`;
}


// ── Main Component ─────────────────────────────────────────────────────────────
// Props:
//   setName  {string}  — display name of the set (used for title + detection)
export default function SequenceFlowchart({ setName }) {
  const ending = isEndingMode(setName);

  const [open,      setOpen]      = useState(true);
  const [ayahs,     setAyahs]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const chartRef = useRef(null);

  // ── Fetch ayah data from API (only used when no cards prop is provided) ───
  const fetchFromApi = useCallback(async () => {
    const info = detectSetInfo(setName);
    if (!info) {
      setError("Could not detect a Surah, Page, or Juz number from the set name. Try naming it e.g. 'Surah 112', 'Page 582', or 'Juz 30'.");
      return;
    }

    const { type, num } = info;
    if (type === "surah" && (num < 1 || num > 114)) { setError("Surah number must be between 1 and 114.");  return; }
    if (type === "page"  && (num < 1 || num > 604)) { setError("Page number must be between 1 and 604.");   return; }
    if (type === "juz"   && (num < 1 || num > 30))  { setError("Juz number must be between 1 and 30.");     return; }
    if (type === "juz-pages" && (num < 1 || num > 30)) { setError("Juz number must be between 1 and 30."); return; }
    if (type === "juz-surahs" && (num < 1 || num > 30)) { setError("Juz number must be between 1 and 30."); return; }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    try {
      let path;
      let body;
      if (type === "juz-pages") {
        // Use the sequence wizard endpoint for juz-pages to get correct mode handling
        path = '/coach/wizard/sequence/juz-pages';
        body = { juz: num, mode: ending ? 'ending' : 'starting' };
        console.log('[FLOWCHART API] Calling juz-pages endpoint:', path, 'with body:', body);
      } else if (type === "juz-surahs") {
        // Use the sequence wizard endpoint for juz-surahs to get all surahs in the juz
        path = '/coach/wizard/sequence/juz-surahs';
        body = { juz: num };
        console.log('[FLOWCHART API] Calling juz-surahs endpoint:', path, 'with body:', body);
      } else {
        path =
          type === "page"  ? `/ayah/page/${num}/full` :
          type === "juz"   ? `/ayah/juz/${num}/full`  :
                             `/ayah/${num}/full`;
        console.log('[FLOWCHART API] calling standard endpoint:', path);
      }

      const res = await authFetch(path, { 
        signal: controller.signal,
        method: body ? 'POST' : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }, 'fetchAyahData');

      if (res?.success && res.data) {
        let ayahsList = [];

        if (res.data.ayahs && Array.isArray(res.data.ayahs)) {
          console.log('[FLOWCHART API] Received ayahs from API:', res.data.ayahs.length, 'ayahs');
          console.log('[FLOWCHART API] Ayahs:', res.data.ayahs.map(a => ({ ayah: a.ayah, text: a.text?.substring(0, 30) })));
          console.log('[FLOWCHART API] Mode:', ending ? 'ENDING (last 3 words)' : 'STARTING (first 3 words)');
          
          ayahsList = res.data.ayahs.map(a => {
            let displayWord;
            if (ending) {
              // Ending mode: extract last 3 words from full text
              const words = (a.text || '').trim().split(/\s+/).filter(w => /[\u0600-\u06FF]/.test(w));
              displayWord = words.slice(-3).join(' ');
            } else {
              // Starting mode: use backend's firstWord or extract from full text
              const words = (a.text || '').trim().split(/\s+/).filter(w => /[\u0600-\u06FF]/.test(w));
              displayWord = a.firstWord || (words.length > 0 ? words.slice(0, 3).join(' ') : '');
            }
            
            // Parse ayah reference (format: "surah:ayah" or just ayah number)
            // For surah sets, a.ayah is just the ayah number; for page sets, it's "surah:ayah"
            let surahNum, ayahNum;
            const ayahStr = String(a.ayah || '');
            if (ayahStr.includes(':')) {
              [surahNum, ayahNum] = ayahStr.split(':').map(Number);
            } else {
              // For surah sets, ayah is just the number; surah comes from res.data.surah
              surahNum = res.data.surah || null;
              ayahNum = parseInt(ayahStr) || null;
            }
            
            return {
              ayah:      a.ayah,
              text:      a.text,
              firstWord: displayWord,
              surahNum:  surahNum || null,
              ayahNum:   ayahNum || null,
            };
          });
          
          console.log('[FLOWCHART API] Processed ayahsList:', ayahsList.length, 'items');
        } else if (res.data.pages && Array.isArray(res.data.pages)) {
          // Juz Pages sequence - each page is a node with display text
          console.log('[FLOWCHART API] Received pages from API:', res.data.pages.length, 'pages');
          console.log('[FLOWCHART API] Mode:', ending ? 'ENDING (last 3 words of last ayah per page)' : 'STARTING (first 3 words of first ayah per page)');
          
          ayahsList = res.data.pages.map((p, i) => ({
            ayah: i + 1, // Sequential numbering
            text: p.text,
            firstWord: p.text,
            surahName: p.surahName,
            surahNum: p.surahNum || null,
            ayahNum: p.ayahNum || null,
          }));
          
          console.log('[FLOWCHART API] Processed ayahsList from pages:', ayahsList.length, 'items');
        } else if (res.data.surahs && Array.isArray(res.data.surahs)) {
          // Juz Surah sequence - each surah is a node with name and first ayah
          console.log('[FLOWCHART API] Received surahs from API:', res.data.surahs.length, 'surahs');
          ayahsList = res.data.surahs.map((s, i) => ({
            ayah: i + 1, // Sequential numbering
            text: s.firstAyahText || s.name, // Use first ayah text as the full text
            firstWord: s.firstWord || s.name, // Use first word or surah name
            surahName: s.name, // Store surah name for display
            surahNumber: s.number, // Store surah number for display
          }));
          console.log('[FLOWCHART API] Processed ayahsList from surahs:', ayahsList.length, 'items');
        }

        if (ayahsList.length > 0) {
          setAyahs(ayahsList);
        } else {
          setError("No ayahs found in response. Please check your request.");
        }
      } else {
        const messages = {
          page:  "Backend error: Unable to load Page data. Please verify the page number (1-604) is correct.",
          juz:   "Backend error: Unable to load Juz/Sipara data. Please verify the Juz number (1-30) is correct.",
          surah: "Backend error: Unable to load Surah data. Please verify the Surah number (1-114) is correct.",
        };
        setError(messages[type] || "Unexpected error loading data.");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("[FETCH ERROR]", err);
      setError("Network error loading ayah data. Please check your connection and try again.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }

    return () => controller.abort();
  }, [setName, ending]);

  // ── Reset and auto-load when setName changes ───────────────────────────────
  useEffect(() => {
    setOpen(true);
    setAyahs([]);
    setLoading(false);
    setError("");

    // ALWAYS fetch from API for flowchart - ignore cards prop
    // The cards prop is only used for study questions, not the flowchart nodes
    fetchFromApi();
  }, [setName, ending, fetchFromApi]);


  // ── Print/download ─────────────────────────────────────────────────────────
  const openPrintWindow = useCallback((forPrint = false) => {
    const html = buildPrintHTML(ayahs, setName, ending);
    const win  = window.open("", "_blank", "width=900,height=700");
    if (!win) { alert("Please allow popups for this site to use print/download."); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    if (forPrint) {
      win.onload = () => { win.focus(); win.print(); };
      // Fallback: best-effort print trigger (may fail due to popup blockers)
      setTimeout(() => { try { win.focus(); win.print(); } catch {} }, 800);
    }
  }, [ayahs, setName, ending]);

  const handlePrint    = () => openPrintWindow(true);
  const handleDownload = () => openPrintWindow(false);

  // Column/chain label changes based on starting vs ending mode
  const chainLabel = ending ? "Last-Word Sequence" : "First-Word Sequence";


  // ── Expanded panel ─────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 20, border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>

      {/* Header bar */}
      <div style={{ background: "#004D40", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>📊 Sequence Memory Aid — {setName}</span>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>


      {/* Content */}
      <div style={{ padding: 20, background: "white", maxHeight: 480, overflowY: "auto" }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#6B7280", padding: 24 }}>
            Loading ayah data…
          </div>
        )}

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B" }}>
            {error}
          </div>
        )}

        {!loading && !error && ayahs.length > 0 && (
          <div ref={chartRef}>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14, background: "#F0FDF4", borderRadius: 8, padding: "6px 14px", border: "1px solid #BBF7D0" }}>
              {ayahs.length} ayahs · {chainLabel}
            </div>
            {/* Horizontal word-chain */}
            <div style={{
              direction: "rtl", fontSize: 18, fontFamily: "serif",
              textAlign: "center", padding: "14px 8px",
              background: "#F8FAFC", borderRadius: 10,
              border: "1px solid #E5E7EB", lineHeight: 2.4,
            }}>
              {ayahs.map((a, i) => (
                <span key={`${a.ayah}-${i}`}>
                  <span style={{ background: "#004D40", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 17, fontWeight: 700, display: "inline-block" }}>
                    {a.firstWord}
                  </span>
                  {i < ayahs.length - 1 && (
                    <span style={{ color: "#9CA3AF", fontSize: 16, margin: "0 6px", direction: "ltr", display: "inline-block" }}>←</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {!loading && ayahs.length > 0 && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9CA3AF", marginRight: "auto" }}>
            Opens in a new tab — use your browser's Save/Print
          </span>
          <button
            onClick={handleDownload}
            style={{ background: "none", border: "1px solid #004D40", color: "#004D40", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            🔗 Open / Save
          </button>
          <button
            onClick={handlePrint}
            style={{ background: "#004D40", border: "none", color: "#fff", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            🖨️ Print
          </button>
        </div>
      )}
    </div>
  );
}