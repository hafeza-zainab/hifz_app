// features/coach/CoachComponents.jsx
//
// FIXES:
// 1. FormattedText: replaced dangerouslySetInnerHTML with safe React element rendering
//    — eliminates XSS risk from AI-generated content
// 2. QuickChips: guard added in CoachPage (messages.length > 0 check) — no change needed here
// 3. All other components unchanged

import { useState, useEffect, useRef } from "react";
import { HOME_OPTIONS, QUICK_CHIPS } from "../coachConstants";

// ─── Typing indicator (three bouncing dots) ────────────────────────────────────
export function TypingIndicator() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "14px 18px", background: "#F9FAFB",
      borderRadius: "6px 18px 18px 18px", maxWidth: 80,
      border: "1px solid #F3F4F6",
    }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: "50%", background: "#9CA3AF",
            display: "inline-block",
            animation: `ustadh-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Safe inline markdown renderer ────────────────────────────────────────────
// FIX: Replaced dangerouslySetInnerHTML with React element parsing.
// Handles **bold** and *italic* without any HTML injection risk.
function parseInlineMarkdown(line) {
  const parts = [];
  // Combined regex: **bold** or *italic*
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = regex.exec(line)) !== null) {
    // Text before this match
    if (m.index > last) {
      parts.push(line.slice(last, m.index));
    }
    if (m[0].startsWith("**")) {
      parts.push(<strong key={key++}>{m[2]}</strong>);
    } else {
      parts.push(<em key={key++}>{m[3]}</em>);
    }
    last = m.index + m[0].length;
  }

  // Remaining text after last match
  if (last < line.length) {
    parts.push(line.slice(last));
  }

  return parts.length > 0 ? parts : [line];
}

export function FormattedText({ text }) {
  // Strip [STATE:...] tags from display
  const cleanText = text.replace(/\[STATE:[^\]]+\]/g, "").trim();
  return (
    <div>
      {cleanText.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        return (
          <p key={i} style={{ margin: "0 0 4px 0", lineHeight: 1.65 }}>
            {parseInlineMarkdown(line)}
          </p>
        );
      })}
    </div>
  );
}

// ─── Message bubble (user + assistant, with inline edit & resend) ─────────────
export function MessageBubble({ msg, onEdit }) {
  const isUser = msg.role === "user";
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(msg.content);
  const editRef               = useRef(null);
const editValLengthRef = useRef(editVal.length);
useEffect(() => {
  editValLengthRef.current = editVal.length;
});

useEffect(() => {
  if (editing && editRef.current) {
    editRef.current.focus();
    editRef.current.setSelectionRange(editValLengthRef.current, editValLengthRef.current);
  }
}, [editing]);

  const handleSave = () => {
    const trimmed = editVal.trim();
    if (trimmed) onEdit(trimmed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === "Escape") { setEditVal(msg.content); setEditing(false); }
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10, alignItems: "flex-start", marginBottom: 16,
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: "50%", background: "#004D40",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2,
        }}>
          <i className="ti ti-star-filled" style={{ fontSize: 16, color: "#F2C94C" }} />
        </div>
      )}

      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4, maxWidth: "78%",
      }}>
        {editing ? (
          <div style={{ width: "100%", minWidth: 260 }}>
            <textarea
              ref={editRef}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              style={{
                width: "100%", border: "2px solid #004D40", borderRadius: 10,
                padding: "10px 14px", fontSize: 14, fontFamily: "inherit",
                resize: "vertical", outline: "none", lineHeight: 1.6,
                background: "#F0FDF4",
              }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setEditVal(msg.content); setEditing(false); }}
                style={{
                  background: "#F3F4F6", border: "none", borderRadius: 6,
                  padding: "5px 12px", cursor: "pointer", fontSize: 12, color: "#6B7280",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: "#004D40", border: "none", borderRadius: 6,
                  padding: "5px 14px", cursor: "pointer", fontSize: 12,
                  fontWeight: 600, color: "#fff",
                }}
              >
                ✓ Resend
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 }}
            onMouseEnter={() => isUser && setHovered(true)}
            onMouseLeave={() => isUser && setHovered(false)}
          >
            {isUser && (
              <button
                onClick={() => { setEditVal(msg.content); setEditing(true); }}
                title="Edit & resend"
                style={{
                  visibility: hovered ? "visible" : "hidden",
                  background: "#004D40", border: "none",
                  borderRadius: 7, width: 34, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,77,64,0.25)",
                  color: "#fff",
                  transition: "all .15s",
                  fontWeight: 700,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#00332E";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#004D40";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <i className="ti ti-pencil" style={{ fontSize: 15, pointerEvents: "none" }} />
              </button>
            )}

            <div style={{
              padding: "13px 17px",
              borderRadius: isUser ? "18px 6px 18px 18px" : "6px 18px 18px 18px",
              background: isUser ? "#004D40" : "#F9FAFB",
              color: isUser ? "#fff" : "#111827",
              fontSize: 14,
              border: isUser ? "none" : "1px solid #F3F4F6",
              wordBreak: "break-word",
            }}>
              <FormattedText text={msg.content} />
              {msg.timestamp && (
                <div style={{
                  fontSize: 11,
                  color: isUser ? "rgba(255,255,255,0.55)" : "#9CA3AF",
                  marginTop: 6,
                  textAlign: isUser ? "right" : "left",
                }}>
                  {msg.timestamp}
                  {msg.edited && <span style={{ marginLeft: 6, opacity: 0.7 }}>(edited)</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick chips ───────────────────────────────────────────────────────────────
// NOTE: The messages.length > 0 guard is applied in CoachPage before rendering this.
export function QuickChips({ onSend }) {
  return (
    <div style={{
      padding: "8px 16px 4px", display: "flex", gap: 8,
      flexWrap: "wrap", borderTop: "1px solid #F3F4F6", flexShrink: 0,
    }}>
      {QUICK_CHIPS.map((q) => (
        <button
          key={q}
          className="ustadh-chip"
          onClick={() => onSend(q)}
          style={{
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            borderRadius: 20, padding: "5px 12px", fontSize: 12,
            cursor: "pointer", color: "#374151", whiteSpace: "nowrap",
            transition: "all .15s",
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}

// ─── Navigation notice banner ──────────────────────────────────────────────────
export function NavBanner({ text }) {
  return (
    <div style={{
      background: "#E6F4F1", border: "1px solid #004D40", borderRadius: 10,
      padding: "10px 16px", margin: "0 16px 8px", fontSize: 13, color: "#004D40",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <i className="ti ti-arrow-right" /> {text}
    </div>
  );
}

// ─── Flashcard saved banner ────────────────────────────────────────────────────
export function FlashcardBanner({ saved, onView, onDismiss }) {
  return (
    <div style={{
      background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 10,
      padding: "10px 16px", margin: "0 16px 8px", fontSize: 13, color: "#166534",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
    }}>
      <span>✅ {saved.count} flashcards saved to "{saved.name}"</span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button
          onClick={onView}
          style={{
            background: "#004D40", border: "none", color: "#fff",
            fontWeight: 600, cursor: "pointer", fontSize: 12,
            padding: "4px 12px", borderRadius: 6,
          }}
        >
          View →
        </button>
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16, padding: "0 4px" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}