// frontend/src/features/coach/components/SensoryAssessmentModal.jsx
// Modal for Sensory Profile learning style assessment - links to external Google Form

import React, { useState } from 'react';
import { authFetch } from '../../../../shared/services/http';

const PROFILES = ['Exploratory Learner', 'Repetitive Learner', 'Sensitive Structured Learner', 'Balanced Learner'];

export default function SensoryAssessmentModal({ onClose, onProfileSaved }) {
  const [step, setStep] = useState('check'); // 'check' | 'select' | 'saved'
  const [selectedProfile, setSelectedProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAssessmentComplete = (completed) => {
    if (completed) {
      setStep('select');
    } else {
      // Open external Google Form
      window.open('https://forms.gle/4MZnpYDQ8x9cWzTHA', '_blank');
    }
  };

  const handleProfileSelect = async () => {
    if (!selectedProfile) return;

    setLoading(true);
    setError(null);

    try {
      // Save profile to backend
      const res = await authFetch('/coach/wizard/sensory-profile/save', {
        method: 'POST',
        body: JSON.stringify({ profile: selectedProfile }),
      }, 'saveProfile');

      if (res.success) {
        setStep('saved');
        onProfileSaved(selectedProfile);
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 24,
        maxWidth: 500,
        width: "90%",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>
            Sensory Profile Learning Style Assessment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#6B7280",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Step 1: Check if assessment completed */}
        {step === 'check' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
              Have you completed the Cognitive Learning Assessment?
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, lineHeight: 1.5 }}>
              This assessment helps identify your preferred learning patterns, motivation style, memory habits, and study environment needs.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => handleAssessmentComplete(true)}
                style={{
                  padding: "14px 16px",
                  background: "white",
                  border: "2px solid #E5E7EB",
                  borderRadius: 8,
                  color: "#374151",
                  fontSize: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#004D40";
                  e.target.style.background = "#E6F4F1";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.background = "white";
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>Yes, I've completed it</div>
              </button>

              <button
                onClick={() => handleAssessmentComplete(false)}
                style={{
                  padding: "14px 16px",
                  background: "white",
                  border: "2px solid #E5E7EB",
                  borderRadius: 8,
                  color: "#374151",
                  fontSize: 14,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#004D40";
                  e.target.style.background = "#E6F4F1";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#E5E7EB";
                  e.target.style.background = "white";
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>No, take me to the assessment</div>
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                padding: "10px 20px",
                background: "transparent",
                border: "none",
                color: "#6B7280",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </>
        )}

        {/* Step 2: Select Profile */}
        {step === 'select' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
              Select your learning profile
            </h3>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
              Choose the profile that matches your assessment report:
            </p>

            {error && (
              <div style={{
                padding: "12px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 8,
                color: "#991B1B",
                fontSize: 13,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {PROFILES.map((profile) => (
                <button
                  key={profile}
                  onClick={() => setSelectedProfile(profile)}
                  style={{
                    padding: "14px 16px",
                    background: selectedProfile === profile ? "#E6F4F1" : "white",
                    border: selectedProfile === profile ? "2px solid #004D40" : "2px solid #E5E7EB",
                    borderRadius: 8,
                    color: "#374151",
                    fontSize: 14,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: selectedProfile === profile ? "2px solid #004D40" : "2px solid #D1D5DB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {selectedProfile === profile && (
                        <div style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#004D40",
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{profile}</div>
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setStep('check')}
                style={{
                  padding: "10px 20px",
                  background: "#F3F4F6",
                  border: "1px solid #D1D5DB",
                  borderRadius: 8,
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
              <button
                onClick={handleProfileSelect}
                disabled={!selectedProfile || loading}
                style={{
                  padding: "10px 20px",
                  background: selectedProfile && !loading ? "#004D40" : "#E5E7EB",
                  border: "none",
                  borderRadius: 8,
                  color: selectedProfile && !loading ? "white" : "#6B7280",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: selectedProfile && !loading ? "pointer" : "not-allowed",
                }}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Saved */}
        {step === 'saved' && (
          <>
            <div style={{
              textAlign: "center",
              padding: "20px 0",
            }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <span style={{ fontSize: 30, color: "white" }}>✓</span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
                Profile saved successfully
              </h3>

              <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
                Current learning profile:
              </p>

              <div style={{
                background: "#E6F4F1",
                border: "1px solid #004D40",
                borderRadius: 8,
                padding: "12px 20px",
                marginBottom: 16,
                display: "inline-block",
              }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: "#004D40" }}>
                  {selectedProfile}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "10px 20px",
                background: "#004D40",
                border: "none",
                borderRadius: 8,
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
