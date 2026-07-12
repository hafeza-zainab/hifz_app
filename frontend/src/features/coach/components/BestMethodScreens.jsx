// features/coach/components/BestMethodScreens.jsx
//
// Best Method (Sensory Profile) module screens for Ustadh AI coach workflow

import React, { useState } from 'react';

export function AssessmentCheck({ onSelect }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>
        Have you completed the Cognitive Learning Assessment?
      </h2>
      
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        width: "100%", maxWidth: 400,
      }}>
        <button
          onClick={() => onSelect(true)}
          style={{
            background: "white", border: "1.5px solid #E5E7EB",
            borderRadius: 12, padding: "16px",
            cursor: "pointer", textAlign: "left",
            transition: "border-color .15s, background .15s",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            1. Yes
          </div>
        </button>
        
        <button
          onClick={() => onSelect(false)}
          style={{
            background: "white", border: "1.5px solid #E5E7EB",
            borderRadius: 12, padding: "16px",
            cursor: "pointer", textAlign: "left",
            transition: "border-color .15s, background .15s",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            2. No
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
        Back to Home
      </button>
    </div>
  );
}

export function ProfileInput({ onSubmit, onBack, saved, profile, existingProfile }) {
  const [selected, setSelected] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  
  const profiles = ['Exploratory Learner', 'Repetitive Learner', 'Sensitive Structured Learner', 'Balanced Learner'];
  
  if (saved) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 16px", textAlign: "center",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", background: "#10B981",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <i className="ti ti-check" style={{ fontSize: 30, color: "white" }} />
        </div>
        
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
          Profile saved successfully
        </h2>
        
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
          Current learning profile:
        </p>
        
        <div style={{
          background: "#E6F4F1", border: "1px solid #004D40",
          borderRadius: 8, padding: "12px 20px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#004D40" }}>
            {profile}
          </span>
        </div>
        
        <p style={{ fontSize: 13, color: "#6B7280", maxWidth: 380, lineHeight: 1.6 }}>
          I will use this profile to personalize future memorization, revision, Mutashabihat, and scheduling recommendations.
        </p>
      </div>
    );
  }
  
  if (showConfirm) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px 16px", textAlign: "center",
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%", background: "#F59E0B",
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 30, color: "white" }} />
        </div>
        
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
          Update your profile?
        </h2>
        
        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16, maxWidth: 400 }}>
          You previously selected <strong>{existingProfile}</strong>. Now you've selected <strong>{selected}</strong>.
          Have you retaken the assessment and want to update your profile?
        </p>
        
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={() => onSubmit(selected, true)}
            style={{
              padding: "10px 20px",
              background: "#004D40",
              color: "white",
              border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Yes, Update Profile
          </button>
          
          <button
            onClick={() => {
              setShowConfirm(false);
              setSelected(existingProfile);
            }}
            style={{
              padding: "10px 20px",
              background: "transparent", border: "1.5px solid #E5E7EB",
              color: "#6B7280", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Keep Previous
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", textAlign: "center",
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: "0 0 8px" }}>
        Select your learning profile
      </h2>
      
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
        Choose the profile that matches your assessment report:
      </p>
      
      {existingProfile && (
        <div style={{
          background: "#FEF3C7", border: "1px solid #F59E0B",
          borderRadius: 8, padding: "12px 16px", marginBottom: 16,
          width: "100%", maxWidth: 400,
        }}>
          <span style={{ fontSize: 13, color: "#92400E" }}>
            Previously saved: <strong>{existingProfile}</strong>
          </span>
        </div>
      )}
      
      <div style={{
        display: "flex", flexDirection: "column", gap: 12,
        width: "100%", maxWidth: 400,
      }}>
        {profiles.map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            style={{
              background: selected === p ? "#E6F4F1" : "white",
              border: selected === p ? "2px solid #004D40" : "1.5px solid #E5E7EB",
              borderRadius: 12, padding: "16px",
              cursor: "pointer", textAlign: "left",
              transition: "border-color .15s, background .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 20, height: 20,
                borderRadius: "50%",
                border: selected === p ? "2px solid #004D40" : "2px solid #D1D5DB",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {selected === p && (
                  <div style={{
                    width: 10, height: 10,
                    borderRadius: "50%",
                    background: "#004D40",
                  }} />
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                {p}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button
          onClick={() => {
            if (existingProfile && selected !== existingProfile) {
              setShowConfirm(true);
            } else {
              onSubmit(selected);
            }
          }}
          disabled={!selected}
          style={{
            padding: "10px 20px",
            background: selected ? "#004D40" : "#E5E7EB",
            color: selected ? "white" : "#6B7280",
            border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: selected ? "pointer" : "not-allowed",
          }}
        >
          Save Profile
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
