// features/coach/components/MutashabihatScreens.jsx
//
// Mutashabihat module screens for Ustadh AI coach workflow

import React, { useState } from 'react';

export function MutashabihatHome({ onSelect, savedTips }) {
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
          { key: "1", label: "Find Mutashabihat" },
          { key: "2", label: "Help me remember a Pair" },
          { key: "3", label: "Help me remember all pairs of an Ayah" },
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

export function MutashabihatSearch({ onSurahSubmit, onBack }) {
  const [surah, setSurah] = useState('');
  const [ayah, setAyah] = useState('');
  const [step, setStep] = useState(1);
  
  const handleSurahSubmit = () => {
    if (surah.trim()) {
      onSurahSubmit(surah.trim(), ayah.trim());
    }
  };
  
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 Find Mutashabihat
      </h2>
      
      {step === 1 ? (
        <>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Enter Surah Number
          </p>
          <input
            type="text"
            value={surah}
            onChange={(e) => setSurah(e.target.value)}
            placeholder="e.g., 2"
            style={{
              width: "100%", maxWidth: 300,
              padding: "12px 16px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && surah.trim()) {
                setStep(2);
              }
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setStep(2)}
              disabled={!surah.trim()}
              style={{
                padding: "10px 20px",
                background: surah.trim() ? "#004D40" : "#E5E7EB",
                color: surah.trim() ? "white" : "#6B7280",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: surah.trim() ? "pointer" : "not-allowed",
              }}
            >
              Next
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
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Enter Ayah Number
          </p>
          <input
            type="text"
            value={ayah}
            onChange={(e) => setAyah(e.target.value)}
            placeholder="e.g., 255"
            style={{
              width: "100%", maxWidth: 300,
              padding: "12px 16px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ayah.trim()) {
                handleSurahSubmit();
              }
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={handleSurahSubmit}
              disabled={!ayah.trim()}
              style={{
                padding: "10px 20px",
                background: ayah.trim() ? "#004D40" : "#E5E7EB",
                color: ayah.trim() ? "white" : "#6B7280",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: ayah.trim() ? "pointer" : "not-allowed",
              }}
            >
              Search
            </button>
            <button
              onClick={() => setStep(1)}
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
        </>
      )}
    </div>
  );
}

export function MutashabihatPairInput({ onSubmit, onBack }) {
  const [aSurah, setASurah] = useState('');
  const [aAyah, setAAyah] = useState('');
  const [bSurah, setBSurah] = useState('');
  const [bAyah, setBAyah] = useState('');
  const [step, setStep] = useState(1);
  
  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };
  
  const handleSubmit = () => {
    if (aSurah.trim() && aAyah.trim() && bSurah.trim() && bAyah.trim()) {
      onSubmit({
        a: { surah: aSurah.trim(), ayah: aAyah.trim() },
        b: { surah: bSurah.trim(), ayah: bAyah.trim() },
      });
    }
  };
  
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 Help me remember a Pair
      </h2>
      
      <div style={{
        background: "#F9FAFB", border: "1px solid #E5E7EB",
        borderRadius: 12, padding: 20, width: "100%", maxWidth: 400,
      }}>
        <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: "#004D40" }}>
          A
        </div>
        
        {step >= 1 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
              Surah:
            </label>
            <input
              type="text"
              value={aSurah}
              onChange={(e) => setASurah(e.target.value)}
              placeholder="e.g., 2"
              style={{
                width: "100%", padding: "8px 12px",
                border: "1px solid #E5E7EB", borderRadius: 6,
                fontSize: 14, outline: "none",
              }}
              disabled={step > 1}
            />
          </div>
        )}
        
        {step >= 2 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
              Ayah:
            </label>
            <input
              type="text"
              value={aAyah}
              onChange={(e) => setAAyah(e.target.value)}
              placeholder="e.g., 255"
              style={{
                width: "100%", padding: "8px 12px",
                border: "1px solid #E5E7EB", borderRadius: 6,
                fontSize: 14, outline: "none",
              }}
              disabled={step > 2}
            />
          </div>
        )}
        
        {step >= 3 && (
          <>
            <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: "#004D40" }}>
              B
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
                Surah:
              </label>
              <input
                type="text"
                value={bSurah}
                onChange={(e) => setBSurah(e.target.value)}
                placeholder="e.g., 3"
                style={{
                  width: "100%", padding: "8px 12px",
                  border: "1px solid #E5E7EB", borderRadius: 6,
                  fontSize: 14, outline: "none",
                }}
                disabled={step > 3}
              />
            </div>
          </>
        )}
        
        {step >= 4 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>
              Ayah:
            </label>
            <input
              type="text"
              value={bAyah}
              onChange={(e) => setBAyah(e.target.value)}
              placeholder="e.g., 18"
              style={{
                width: "100%", padding: "8px 12px",
                border: "1px solid #E5E7EB", borderRadius: 6,
                fontSize: 14, outline: "none",
              }}
            />
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {step < 4 ? (
          <button
            onClick={handleNext}
            style={{
              padding: "10px 20px",
              background: "#004D40", color: "white",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!aSurah.trim() || !aAyah.trim() || !bSurah.trim() || !bAyah.trim()}
            style={{
              padding: "10px 20px",
              background: (aSurah.trim() && aAyah.trim() && bSurah.trim() && bAyah.trim()) 
                ? "#004D40" : "#E5E7EB",
              color: (aSurah.trim() && aAyah.trim() && bSurah.trim() && bAyah.trim())
                ? "white" : "#6B7280",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: (aSurah.trim() && aAyah.trim() && bSurah.trim() && bAyah.trim())
                ? "pointer" : "not-allowed",
            }}
          >
            Generate Tip
          </button>
        )}
        
        <button
          onClick={handleBack}
          style={{
            padding: "10px 20px",
            background: "transparent", border: "1.5px solid #E5E7EB",
            color: "#6B7280", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          {step > 1 ? 'Back' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

export function MutashabihatAllPairs({ onSubmit, onBack }) {
  const [surah, setSurah] = useState('');
  const [ayah, setAyah] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (surah.trim() && ayah.trim()) {
      onSubmit({ surah: surah.trim(), ayah: ayah.trim() });
    }
  };
  
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        🤖 Help me remember all pairs of an Ayah
      </h2>
      
      {step === 1 ? (
        <>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Enter Surah Number
          </p>
          <input
            type="text"
            value={surah}
            onChange={(e) => setSurah(e.target.value)}
            placeholder="e.g., 2"
            style={{
              width: "100%", maxWidth: 300,
              padding: "12px 16px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && surah.trim()) {
                setStep(2);
              }
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setStep(2)}
              disabled={!surah.trim()}
              style={{
                padding: "10px 20px",
                background: surah.trim() ? "#004D40" : "#E5E7EB",
                color: surah.trim() ? "white" : "#6B7280",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: surah.trim() ? "pointer" : "not-allowed",
              }}
            >
              Next
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
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Enter Ayah Number
          </p>
          <input
            type="text"
            value={ayah}
            onChange={(e) => setAyah(e.target.value)}
            placeholder="e.g., 255"
            style={{
              width: "100%", maxWidth: 300,
              padding: "12px 16px",
              border: "1.5px solid #E5E7EB",
              borderRadius: 8,
              fontSize: 14,
              outline: "none",
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ayah.trim()) {
                handleSubmit();
              }
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={!ayah.trim()}
              style={{
                padding: "10px 20px",
                background: ayah.trim() ? "#004D40" : "#E5E7EB",
                color: ayah.trim() ? "white" : "#6B7280",
                border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 600,
                cursor: ayah.trim() ? "pointer" : "not-allowed",
              }}
            >
              Generate All Tips
            </button>
            <button
              onClick={() => setStep(1)}
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
        </>
      )}
    </div>
  );
}
