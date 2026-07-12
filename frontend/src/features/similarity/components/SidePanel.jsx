// frontend/src/features/similarity/components/SidePanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../../shared/context/AppContext";
import { useTour } from "../../../shared/context/TourContext";
import { fetchAyahContext } from "../../../shared/services/similarityApi";
import "../../../styles/SidePanel.css";
import { authFetch } from '../../../shared/services/http';

// ── Save tips to DB ───────────────────────────────────────────────────────────
async function saveTips(sourceSurah, sourceAyah, targetSurah, targetAyah, tips) {
  try {
    // Use consistent pair key format: minSurah_ayahA_maxSurah_ayahB
    const minSurah = Math.min(sourceSurah, targetSurah);
    const maxSurah = Math.max(sourceSurah, targetSurah);
    const ayahA = minSurah === sourceSurah ? sourceAyah : targetAyah;
    const ayahB = maxSurah === targetSurah ? targetAyah : sourceAyah;
    
    await authFetch(
      `/similarity/by-pair/tips?ss=${minSurah}&sa=${ayahA}&ts=${maxSurah}&ta=${ayahB}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ tips }),
      },
      'saveTips'
    );
    return true;
  } catch { return false; }
}

// ── Fetch tips from DB using consistent pair key ─────────────────────────────────
async function fetchTipsFromDB(sourceSurah, sourceAyah, targetSurah, targetAyah) {
  try {
    const minSurah = Math.min(sourceSurah, targetSurah);
    const maxSurah = Math.max(sourceSurah, targetSurah);
    const ayahA = minSurah === sourceSurah ? sourceAyah : targetAyah;
    const ayahB = maxSurah === targetSurah ? targetAyah : sourceAyah;
    
    const res = await authFetch(
      `/similarity/by-pair/tips?ss=${minSurah}&sa=${ayahA}&ts=${maxSurah}&ta=${ayahB}`,
      {},
      'fetchTips'
    );
    return res.success ? (res.data?.tips || []) : [];
  } catch { return []; }
}

// ── Single tip row ────────────────────────────────────────────────────────────
function TipRow({ tip, onEdit, onEditOpened }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(tip);

  const save = () => { onEdit(val.trim()); setEditing(false); };

  const handleEditClick = () => {
    setEditing(true);
    if (onEditOpened) onEditOpened();
  };

  return (
    <div style={{
      background: "#F0FDF4", border: "1px solid #BBF7D0",
      borderRadius: 8, padding: "10px 12px", marginBottom: 8,
      position: "relative",
    }}>
      {editing ? (
        <>
          <textarea
            autoFocus value={val}
            onChange={e => setVal(e.target.value)}
            rows={3}
            style={{
              width: "100%", border: "1px solid #004D40", borderRadius: 6,
              padding: "6px 8px", fontSize: 13, resize: "vertical",
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              onClick={save}
              style={{
                background: "#004D40", color: "#fff", border: "none",
                borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setVal(tip); setEditing(false); }}
              style={{
                background: "#F3F4F6", border: "none",
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                fontSize: 12, color: "#6B7280",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#166534", paddingRight: 32 }}>
            {tip}
          </p>
          <div style={{ position: "absolute", top: 8, right: 8 }}>
            <button
              onClick={handleEditClick}
              title="Edit tip"
              data-tour="tip-edit-icon"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "2px 4px", fontSize: 13, borderRadius: 4,
              }}
            >
              ✏️
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main SidePanel ────────────────────────────────────────────────────────────
export default function SidePanel() {
  const { selectedResult, sourceAyah, tips, setTips } = useAppContext();
  const { dispatchTourEvent } = useTour();

  const [saving, setSaving]       = useState(false);
  const [status, setStatus]       = useState(""); // '' | 'saved' | 'error'
  const [context, setContext]     = useState(null);
  const [loadingContext, setLoadingContext] = useState(false);

  const sourceSurah = sourceAyah?.surah;
  const sourceAyahN = sourceAyah?.ayah;
  const targetSurah = selectedResult?.target_surah;
  const targetAyah  = selectedResult?.target_ayah;

  // ── Load context whenever selected result changes ─────────────────────────
  useEffect(() => {
    if (selectedResult) {
      loadContext(selectedResult.target_surah, selectedResult.target_ayah);
    } else {
      setContext(null);
    }
  }, [selectedResult]);

  const loadContext = async (surah, ayah) => {
    setLoadingContext(true);
    try {
      const res = await fetchAyahContext(surah, ayah);
      if (res.success) setContext(res.data);
    } catch (err) {
      console.error('[SidePanel] Failed to load context for ayah:', `${surah}:${ayah}`, err);
    } finally {
      setLoadingContext(false);
    }
  };

  // ── Load tips whenever the selected pair changes ──────────────────────────
  useEffect(() => {
    console.log('SidePanel useEffect triggered:', { selectedResult, targetSurah, targetAyah });
    
    if (!selectedResult) return;

    const loadTips = async () => {
      // Calculate consistent pair key
      const minSurah = Math.min(sourceSurah, targetSurah);
      const maxSurah = Math.max(sourceSurah, targetSurah);
      const ayahA = minSurah === sourceSurah ? sourceAyahN : targetAyah;
      const ayahB = maxSurah === targetSurah ? targetAyah : sourceAyahN;
      const pairKey = `${minSurah}_${ayahA}_${maxSurah}_${ayahB}`;

      console.log('[TIPS] Fetching tips from DB for pair:', pairKey);

      // Check DB for existing tip
      const dbTips = await fetchTipsFromDB(sourceSurah, sourceAyahN, targetSurah, targetAyah);
      console.log('[TIPS] Database tips:', dbTips);

      if (dbTips.length > 0) {
        // Tip exists in DB, show it
        setTips(dbTips);
        console.log('[TIPS] Tip found in DB, displaying');
      } else {
        // No tip exists, show empty state
        setTips([]);
        console.log('[TIPS] No tip found in DB');
      }
    };

    loadTips();
  }, [selectedResult, sourceSurah, sourceAyahN, targetSurah, targetAyah]);

  // ── Persist updated tips list ─────────────────────────────────────────────
  const persist = useCallback(async (updatedTips) => {
    if (!sourceSurah || !sourceAyahN || !targetSurah || !targetAyah) return;
    setSaving(true);
    const ok = await saveTips(sourceSurah, sourceAyahN, targetSurah, targetAyah, updatedTips);
    setSaving(false);
    if (ok) {
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("error");
    }
  }, [sourceSurah, sourceAyahN, targetSurah, targetAyah]);

  const handleEdit = (newText) => {
    setTips([newText]);
    persist([newText]);
  };

  const handleEditOpened = () => {
    try {
      dispatchTourEvent('tip:edit:opened');
    } catch (e) {
      console.error('[SidePanel] Error dispatching tour event:', e);
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!selectedResult) {
    return (
      <div className="side-panel-empty">
        Click a result card to view memory tips here
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="side-panel">
      <div className="panel-header" data-tour="side-panel-header">Memory Tips &amp; Context</div>
      <div className="panel-body">

        {/* ── Tips section ── */}
        <div style={{ marginBottom: 20 }} data-tour="ai-tips-edit">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <strong style={{ fontSize: 13, color: "#111827", display: "flex", alignItems: "center", gap: 6 }}>
              🧠 Memory Tip
              {saving && (
                <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>Saving…</span>
              )}
            </strong>
            {status === "saved" && (
              <span style={{ fontSize: 11, color: "#166534" }}>✓ Saved</span>
            )}
            {status === "error" && (
              <span style={{ fontSize: 11, color: "#991B1B" }}>⚠ Save failed</span>
            )}
          </div>

          {tips.length > 0 && tips[0] && (
            <TipRow tip={tips[0]} onEdit={handleEdit} onEditOpened={handleEditOpened} />
          )}

          {tips.length === 0 && (
            <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 8px", fontStyle: "italic" }}>
              No memory tip saved yet. Click the ✏️ icon to add one.
            </p>
          )}
        </div>

        {/* ── Divider ── */}
        <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "0 0 16px" }} />

        {/* ── Context section ── */}
        <div className="context-container">
          {loadingContext ? (
            <div className="loading-text">Loading context...</div>
          ) : context ? (
            <>
              {context.prev && (
                <div className="context-ayah prev">
                  <div className="context-label">Previous Ayah</div>
                  <div className="arabic-text-sm" dir="rtl">{context.prev}</div>
                </div>
              )}
              <div className="context-ayah main">
                <div className="context-label">
                  Selected Ayah (Surah {selectedResult.target_surah}:{selectedResult.target_ayah})
                </div>
                <div className="arabic-text-sm main-text" dir="rtl">{context.current}</div>
              </div>
              {context.next && (
                <div className="context-ayah next">
                  <div className="context-label">Next Ayah</div>
                  <div className="arabic-text-sm" dir="rtl">{context.next}</div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ── Match analysis ── */}
        <div className="tip-context" data-tour="similarity-analysis">
          <strong>Match Analysis</strong>
          <p className="highlight-mode">
            Focus on: <span>{selectedResult.highlight_mode}</span>
          </p>
          <p data-tour="mutashabiha-score">
            Mutashabiha Score: <span>{Math.round(selectedResult.similarity_score * 100)}%</span>
          </p>
        </div>

      </div>
    </div>
  );
}