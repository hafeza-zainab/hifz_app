// features/coach/CoachSidebar.jsx
// ─── Left sidebar: session management ─────────────────────────────────────────
// ─── Right panel: learning style · progress · weekly cycle · schedule · tips ──
import { useState, useRef, useCallback } from "react";
import { timeAgo, authFetch } from "../coachConstants";

// ══════════════════════════════════════════════════════════════════[...]
// SESSION SIDEBAR (left) — with independent scrolling
// ══════════════════════════════════════════════════════════════════[...]
export function SessionSidebar({
  sessions,
  activeSessionId,
  dataLoaded,
  weakCount,
  totalPages,
  simCount,
  remainingMessages,
  isUnlimited,
  onCreateSession,
  onLoadSession,
  onDeleteSession,
  onRenameSession,
}) {
  const [renamingId,   setRenamingId]   = useState(null);
  const [renameValue,  setRenameValue]  = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const renameSavingRef                 = useRef(false);

  const startRename = useCallback((e, session) => {
    e.stopPropagation();
    e.preventDefault();
    setRenamingId(session.id);
    setRenameValue(session.title);
  }, []);

  const saveRename = useCallback(async (sessionId) => {
    if (!renameValue.trim()) { renameSavingRef.current = false; setRenamingId(null); return; }
    renameSavingRef.current = true;
    setRenameSaving(true);
    try {
      const res = await authFetch(
        `/coach/sessions/${sessionId}`,
        { method: "PATCH", body: JSON.stringify({ title: renameValue.trim() }) },
        'saveRename'
      );
      if (res?.success) onRenameSession(sessionId, renameValue.trim());
    } catch (e) { console.error('[CoachSidebar] Failed to rename session:', sessionId, e); }
    renameSavingRef.current = false;
    setRenamingId(null);
    setRenameSaving(false);
  }, [renameValue, onRenameSession]);

  return (
    <div style={{
      width: 230, borderRight: "1px solid #E5E7EB",
      display: "flex", flexDirection: "column",
      background: "#FAFAFA", flexShrink: 0,
    }}>
      {/* New session button */}
      <div style={{ padding: "14px 12px 10px", borderBottom: "1px solid #E5E7EB" }}>
        <button
          onClick={onCreateSession}
          style={{
            width: "100%", background: "#004D40", color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13,
            fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} /> New session
        </button>
      </div>

      {/* Data status */}
      {dataLoaded && (
        <div style={{
          padding: "8px 12px", borderBottom: "1px solid #E5E7EB",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          {totalPages > 0 && (
            <span style={{
              fontSize: 11, background: "#FEF3C7", color: "#92400E",
              borderRadius: 6, padding: "3px 8px", fontWeight: 600,
            }}>
              📖 {weakCount} weak / {totalPages} pages
            </span>
          )}
          <span style={{
            fontSize: 11, background: "#EFF6FF", color: "#1D4ED8",
            borderRadius: 6, padding: "3px 8px", fontWeight: 600,
          }}>
            🔗 {simCount > 0 ? `${simCount} similar pairs` : "No pairs loaded"}
          </span>
          {!isUnlimited && remainingMessages !== null && (
            <span style={{
              fontSize: 11,
              background: remainingMessages <= 3 ? "#FEF2F2" : "#F0FDF4",
              color:      remainingMessages <= 3 ? "#991B1B" : "#166534",
              borderRadius: 6, padding: "3px 8px", fontWeight: 600,
            }}>
              💬 {remainingMessages}/10 left today
            </span>
          )}
          {isUnlimited && (
            <span style={{
              fontSize: 11, background: "#F0FDF4", color: "#166534",
              borderRadius: 6, padding: "3px 8px", fontWeight: 600,
            }}>
              ✨ Unlimited access
            </span>
          )}
        </div>
      )}

      {/* Session list — independent scrolling */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {sessions.length === 0 && (
          <div style={{ padding: "20px 12px", fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
            No sessions yet.<br />Start a conversation!
          </div>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`ustadh-session-item ${activeSessionId === s.id ? "active" : ""}`}
            onClick={() => renamingId !== s.id && onLoadSession(s.id)}
            style={{
              padding: "10px 12px", cursor: "pointer",
              borderLeft: activeSessionId === s.id ? "3px solid #004D40" : "3px solid transparent",
              position: "relative", transition: "background .15s",
              background: activeSessionId === s.id ? "#E6F4F1" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            }}
          >
            {renamingId === s.id ? (
              <div onClick={(e) => e.stopPropagation()} style={{ flex: 1 }}>
                <input
                  autoFocus
                  className="ustadh-session-rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") { e.preventDefault(); saveRename(s.id); }
                    if (e.key === "Escape") { renameSavingRef.current = false; setRenamingId(null); }
                  }}
                  onBlur={() => {
                    // Wait one tick — onMouseDown on Save fires before blur
                    setTimeout(() => {
                      if (!renameSavingRef.current) setRenamingId(null);
                    }, 150);
                  }}
                  disabled={renameSaving}
                  style={{
                    width: "100%", padding: "6px 8px", fontSize: 12,
                    border: "2px solid #004D40", borderRadius: 6,
                    outline: "none", fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); saveRename(s.id); }}
                    style={{
                      flex: 1, background: "#004D40", color: "#fff", border: "none",
                      borderRadius: 4, padding: "4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    ✓ Save
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); renameSavingRef.current = false; setRenamingId(null); }}
                    style={{
                      flex: 1, background: "#F3F4F6", color: "#6B7280",
                      border: "none", borderRadius: 4, padding: "4px 0", fontSize: 11, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, color: "#111827",
                    fontWeight: activeSessionId === s.id ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                    {timeAgo(s.updated_at)}
                  </div>
                </div>
                
                {/* Action buttons — ALWAYS VISIBLE & PROMINENT */}
                <div style={{
                  display: "flex", gap: 5, flexShrink: 0,
                }}>
                  <button
                    className="ustadh-edit-btn"
                    onClick={(e) => startRename(e, s)}
                    title="Edit chat name"
                    style={{
                      background: "#004D40", border: "none", cursor: "pointer",
                      padding: "6px 8px", color: "#fff", fontSize: 14, borderRadius: 6,
                      fontWeight: 700, display: "flex", alignItems: "center", gap: 2,
                      transition: "all .2s",
                      boxShadow: "0 2px 6px rgba(0,77,64,0.25)",
                      minWidth: "32px", justifyContent: "center",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#00332E";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,77,64,0.4)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#004D40";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,77,64,0.25)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <i className="ti ti-pencil" style={{ fontSize: 12 }} />
                  </button>
                  <button
                    className="ustadh-del-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    title="Delete chat"
                    style={{
                      background: "#DC2626", border: "none", cursor: "pointer",
                      padding: "6px 8px", color: "#fff", fontSize: 14, borderRadius: 6,
                      fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all .2s",
                      boxShadow: "0 2px 6px rgba(220,38,38,0.25)",
                      minWidth: "32px",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#991B1B";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(220,38,38,0.4)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#DC2626";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(220,38,38,0.25)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <i className="ti ti-trash" style={{ fontSize: 12 }} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════[...]
// INFO PANEL (right) — learning style · progress · weekly cycle · schedule · tips
// with independent scrolling
// ════════════════════════════════════════════════════════════════[...]

function PanelSection({ title, children }) {
  return (
    <div style={{ padding: "12px 14px", borderBottom: "1px solid #E5E7EB" }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: "#9CA3AF",
        letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Badge({ color, children }) {
  const map = {
    green: { bg: "#DCFCE7", text: "#166534" },
    blue:  { bg: "#DBEAFE", text: "#1E40AF" },
    amber: { bg: "#FEF3C7", text: "#92400E" },
    gray:  { bg: "#F3F4F6", text: "#374151" },
  };
  const c = map[color] || map.gray;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text,
      borderRadius: 20, padding: "2px 8px", display: "inline-block",
    }}>
      {children}
    </span>
  );
}

export function InfoPanel({ learningStyle, progress, weeklyCycle, latestSchedule, memoryTips }) {
  const hasStyle    = learningStyle?.primary;
  const hasProgress = progress?.marhala;
  const hasCycle    = weeklyCycle?.length > 0;
  const hasSchedule = latestSchedule?.text;
  const hasTips     = memoryTips?.length > 0;

  const isEmpty = !hasStyle && !hasProgress && !hasCycle && !hasSchedule && !hasTips;

  return (
    <div style={{
      width: 210, borderLeft: "3px solid #004D40",
      display: "flex", flexDirection: "column",
      background: "#F0FDF4", flexShrink: 0,
    }}>
      {/* Panel header — PROMINENT */}
      <div style={{
        padding: "14px 14px 10px", borderBottom: "2px solid #004D40",
        display: "flex", alignItems: "center", gap: 6,
        background: "#E6F4F1",
      }}>
        <i className="ti ti-layout-sidebar-right" style={{ fontSize: 16, color: "#004D40", fontWeight: 700 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#004D40" }}>Your Profile</span>
      </div>

      {/* Content area — independent scrolling */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isEmpty && (
          <div style={{ padding: "20px 14px", fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 1.6 }}>
            Complete a flow to see your learning style, schedule, and tips here.
          </div>
        )}

        {/* Learning style */}
        {hasStyle && (
          <PanelSection title="Learning style">
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>Primary</span>
                <Badge color="green">{learningStyle.primary}</Badge>
              </div>
              {learningStyle.secondary && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>Secondary</span>
                  <Badge color="blue">{learningStyle.secondary}</Badge>
                </div>
              )}
            </div>
          </PanelSection>
        )}

        {/* Current progress */}
        {hasProgress && (
          <PanelSection title="Current progress">
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
              {progress.marhala}
            </div>
            {progress.sipara && (
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>
                Sipara {progress.sipara}
                {progress.page && ` · Page ${progress.page}${progress.totalPages ? ` / ${progress.totalPages}` : ""}`}
              </div>
            )}
            {progress.percent !== undefined && (
              <div style={{ height: 5, borderRadius: 3, background: "#E5E7EB", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "#004D40", borderRadius: 3, width: `${progress.percent}%` }} />
              </div>
            )}
          </PanelSection>
        )}

        {/* Weekly cycle — populated via [WEEKLY_CYCLE:…] block ─────────────────
            Each entry: { day: "Mon", siparas: ["Sipara 5", "Sipara 12"] }       */}
        {hasCycle && (
          <PanelSection title="Weekly cycle">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {weeklyCycle.map((entry) => (
                <div key={entry.day} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#004D40", minWidth: 28, flexShrink: 0 }}>
                    {entry.day.slice(0, 3)}
                  </span>
                  <span style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>
                    {entry.siparas.join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </PanelSection>
        )}

        {/* Latest schedule */}
        {hasSchedule && (
          <PanelSection title="Latest schedule">
            <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {latestSchedule.text.length > 280
                ? latestSchedule.text.slice(0, 280) + "…"
                : latestSchedule.text}
            </div>
            {latestSchedule.generatedAt && (
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>
                Generated {latestSchedule.generatedAt}
              </div>
            )}
          </PanelSection>
        )}

        {/* Memory tips */}
        {hasTips && (
          <PanelSection title="Memory tips">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memoryTips.slice(0, 8).map((tip, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11, color: "#374151", lineHeight: 1.5,
                    padding: "6px 8px", background: "white", borderRadius: 6,
                    border: "1px solid #D1D5DB",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#004D40", marginBottom: 2 }}>
                    {tip.pair}
                  </div>
                  <div style={{ color: "#6B7280" }}>
                    {tip.text.length > 80 ? tip.text.slice(0, 80) + "…" : tip.text}
                  </div>
                </div>
              ))}
            </div>
          </PanelSection>
        )}
      </div>
    </div>
  );
}
