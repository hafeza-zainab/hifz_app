// features/coach/components/SequenceScreens.jsx
//
// Sequence module screens for Ustadh AI coach workflow

import React, { useState } from 'react';

export function SequenceHome({ onSelect }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 What would you like?
      </h2>
      
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        width: "100%", maxWidth: 400,
      }}>
        {[
          { key: "1", label: "Sequence of Ayah in Surah" },
          { key: "2", label: "Sequence of Ayah in Page" },
          { key: "3", label: "Sequence of Pages in Juz" },
          { key: "4", label: "Sequence of Surahs in Juz" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            style={{
              background: "white", border: "1.5px solid #E5E7EB",
              borderRadius: 12, padding: "16px",
              cursor: "pointer", textAlign: "left",
              transition: "border-color .15s, background .15s",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {opt.key}. {opt.label}
            </div>
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onSelect('back')}
        style={{
          marginTop: 20,
          background: "transparent", border: "none",
          color: "#6B7280", fontSize: 12, cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Back to Home
      </button>
    </div>
  );
}

export function SequenceModeSelect({ onSelect, title }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 Select Mode
      </h2>
      
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        width: "100%", maxWidth: 400,
      }}>
        <button
          onClick={() => onSelect('starting')}
          style={{
            background: "white", border: "1.5px solid #E5E7EB",
            borderRadius: 12, padding: "16px",
            cursor: "pointer", textAlign: "left",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            1. Starting of Ayah
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            (first 3 words)
          </div>
        </button>
        
        <button
          onClick={() => onSelect('ending')}
          style={{
            background: "white", border: "1.5px solid #E5E7EB",
            borderRadius: 12, padding: "16px",
            cursor: "pointer", textAlign: "left",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            2. Ending of Ayah
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            (last 3 words)
          </div>
        </button>
      </div>
      
      <button
        onClick={() => onSelect('back')}
        style={{
          marginTop: 20,
          background: "transparent", border: "none",
          color: "#6B7280", fontSize: 12, cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Back
      </button>
    </div>
  );
}

export function SequenceInput({ onSubmit, onBack, placeholder, title }) {
  const [input, setInput] = useState('');
  
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 {title}
      </h2>
      
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", maxWidth: 300,
          padding: "12px 16px",
          border: "1.5px solid #E5E7EB",
          borderRadius: 8,
          fontSize: 14,
          outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            onSubmit(input.trim());
          }
        }}
      />
      
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={() => onSubmit(input.trim())}
          disabled={!input.trim()}
          style={{
            padding: "10px 20px",
            background: input.trim() ? "#004D40" : "#E5E7EB",
            color: input.trim() ? "white" : "#6B7280",
            border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: input.trim() ? "pointer" : "not-allowed",
          }}
        >
          Submit
        </button>
        
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            background: "transparent", border: "1.5px solid #E5E7EB",
            color: "#6B7280", borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
