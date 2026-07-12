// frontend/src/features/coach/components/AIErrorDisplay.jsx
//
// Displays user-friendly AI error information with diagnosis

import React from "react";
import "../../../styles/AIErrorDisplay.css";

const AIErrorDisplay = ({ error, diagnosis, onDismiss }) => {
  if (!error && !diagnosis) return null;

  const getIconForType = (type) => {
    switch (type) {
      case "TPM_LIMIT":
      case "RPM_LIMIT":
      case "RATE_LIMIT":
      case "DAILY_QUOTA":
        return "⏱️";
      case "CONTEXT_TOO_LONG":
        return "📏";
      case "INVALID_API_KEY":
        return "🔑";
      case "BILLING_QUOTA":
        return "💳";
      case "PROVIDER_OUTAGE":
        return "🔧";
      case "TIMEOUT":
        return "⏰";
      default:
        return "⚠️";
    }
  };

  return (
    <div className="ai-error-display">
      <div className="ai-error-header">
        <span className="ai-error-icon">{getIconForType(diagnosis?.type || "UNKNOWN_ERROR")}</span>
        <h3>AI Request Failed</h3>
        {onDismiss && (
          <button className="ai-error-dismiss" onClick={onDismiss}>
            ✕
          </button>
        )}
      </div>

      <div className="ai-error-content">
        {diagnosis && (
          <>
            <div className="ai-error-section">
              <label>Reason:</label>
              <p>{diagnosis.explanation}</p>
            </div>

            <div className="ai-error-section">
              <label>Suggested Action:</label>
              <p>{diagnosis.action}</p>
            </div>

            {diagnosis.estimatedReset && diagnosis.estimatedReset !== "N/A" && (
              <div className="ai-error-section">
                <label>Reset:</label>
                <p>{diagnosis.estimatedReset}</p>
              </div>
            )}
          </>
        )}

        {!diagnosis && error && (
          <div className="ai-error-section">
            <label>Error:</label>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIErrorDisplay;
