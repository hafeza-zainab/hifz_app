// frontend/src/features/coach/components/SensoryProfileModal.jsx
// Modal to display detailed Sensory Profile information

import React from 'react';

const PROFILE_DETAILS = {
  'Exploratory Learner': {
    description: 'You learn best by exploring new material and connecting concepts across different topics. You thrive when you can see the big picture before diving into details.',
    recommendedMethod: 'Use the "Whole-to-Part" approach: Start by reading the entire surah or section to understand the context, then break it down into smaller portions for memorization.',
    strengths: ['Strong pattern recognition', 'Good at making connections', 'Enjoys variety in learning'],
    focusAreas: ['Maintain consistency in revision', 'Balance exploration with structured practice', 'Use visual aids and mind maps'],
  },
  'Repetitive Learner': {
    description: 'You learn best through repetition and consistent practice. You excel when you can repeat material multiple times until it becomes second nature.',
    recommendedMethod: 'Use the "Chunking and Repetition" approach: Break verses into small chunks and repeat each chunk 10-20 times before moving to the next.',
    strengths: ['Excellent retention through repetition', 'Strong discipline', 'Consistent performance'],
    focusAreas: ['Vary your revision techniques', 'Connect repetitions to understanding', 'Use audio for auditory reinforcement'],
  },
  'Sensitive Structured Learner': {
    description: 'You learn best in a structured, predictable environment. You prefer clear goals, systematic approaches, and gradual progression.',
    recommendedMethod: 'Use the "Step-by-Step" approach: Follow a strict daily schedule with clear milestones, moving from easier to more complex material systematically.',
    strengths: ['Highly organized', 'Reliable progress tracking', 'Reduced anxiety through structure'],
    focusAreas: ['Build flexibility in your routine', 'Embrace occasional challenges', 'Balance structure with creativity'],
  },
  'Balanced Learner': {
    description: 'You have a balanced learning style, able to adapt to different methods as needed. You can switch between exploration, repetition, and structure based on the situation.',
    recommendedMethod: 'Use the "Adaptive" approach: Combine different methods based on the difficulty of the material - use repetition for difficult verses, exploration for easier ones, and structure for long-term planning.',
    strengths: ['Versatile learning approach', 'Adaptable to challenges', 'Well-rounded progress'],
    focusAreas: ['Identify which method works best for each situation', 'Maintain consistency across methods', 'Track which techniques yield best results'],
  },
};

export default function SensoryProfileModal({ profile, onClose, onRetakeTest }) {
  if (!profile) return null;

  const details = PROFILE_DETAILS[profile] || PROFILE_DETAILS['Balanced Learner'];

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
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", margin: 0 }}>
            Sensory Profile
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

        {/* Profile Name */}
        <div style={{
          background: "#E6F4F1",
          border: "1px solid #004D40",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#004D40" }}>
            {profile}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#004D40", marginBottom: 8 }}>
            What This Means
          </h3>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
            {details.description}
          </p>
        </div>

        {/* Recommended Method */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#004D40", marginBottom: 8 }}>
            Recommended Memorization Method
          </h3>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
            {details.recommendedMethod}
          </p>
        </div>

        {/* Strengths */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#004D40", marginBottom: 8 }}>
            Your Strengths
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            {details.strengths.map((strength, i) => (
              <li key={i}>{strength}</li>
            ))}
          </ul>
        </div>

        {/* Focus Areas */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#004D40", marginBottom: 8 }}>
            Suggested Focus Areas
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            {details.focusAreas.map((area, i) => (
              <li key={i}>{area}</li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onRetakeTest}
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
            ↺ Retake Test
          </button>
          <button
            onClick={onClose}
            style={{
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
