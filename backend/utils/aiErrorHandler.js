// backend/utils/aiErrorHandler.js
//
// Centralized error handler for AI API requests
// Provides structured logging and user-friendly error diagnosis

let lastError = null;
let lastStatusCode = null;
let lastDiagnosis = null;
let lastTimestamp = null;

/**
 * Analyze AI API error and generate user-friendly diagnosis
 * @param {number} status - HTTP status code
 * @param {string} responseBody - Raw response body from API
 * @param {Error} error - Error object
 * @param {string} provider - AI provider name (e.g., "Groq")
 * @returns {Object} Diagnosis object with type, explanation, action, and estimatedReset
 */
function analyzeAIError(status, responseBody, error, provider = "Unknown") {
    const timestamp = new Date().toISOString();
    
    console.log("=== AI ERROR ANALYSIS ===");
    console.log("Status:", status);
    console.log("Provider:", provider);
    console.log("Error object:", error);
    console.log("Response body:", responseBody);
    console.log("Timestamp:", timestamp);
    
    let diagnosis = {
        type: "UNKNOWN_ERROR",
        explanation: "An unknown error occurred.",
        action: "Please try again later.",
        estimatedReset: "Unknown",
    };
    
    let parsedBody = null;
    try {
        parsedBody = typeof responseBody === "string" ? JSON.parse(responseBody) : responseBody;
    } catch (e) {
        parsedBody = { raw: responseBody };
    }
    
    // 429 - Rate limit
    if (status === 429) {
        const errorMsg = parsedBody?.error?.message || parsedBody?.error || "";
        
        if (errorMsg.toLowerCase().includes("tpd") || errorMsg.toLowerCase().includes("tokens per day")) {
            // Extract retry duration from error message
            const retryMatch = errorMsg.match(/Please try again in ([\d]+m[\d]+(?:\.\d+)?s)/);
            const retryAfter = retryMatch ? retryMatch[1] : "Unknown";
            
            // Extract remaining tokens if available
            const limitMatch = errorMsg.match(/Limit (\d+)/);
            const usedMatch = errorMsg.match(/Used (\d+)/);
            const requestedMatch = errorMsg.match(/Requested (\d+)/);
            
            const limit = limitMatch ? parseInt(limitMatch[1]) : null;
            const used = usedMatch ? parseInt(usedMatch[1]) : null;
            const requested = requestedMatch ? parseInt(requestedMatch[1]) : null;
            const remainingTokens = limit && used ? limit - used : null;
            
            diagnosis = {
                type: "DAILY_QUOTA",
                explanation: "Daily token allocation exhausted. You've reached your daily limit.",
                retryAfter: retryAfter,
                remainingTokens: remainingTokens,
                estimatedReset: "Next day (UTC midnight)",
                action: `Wait for the retry window (${retryAfter}) or reduce prompt size to fit within remaining quota.`,
            };
        } else if (errorMsg.toLowerCase().includes("token") || errorMsg.toLowerCase().includes("tpm")) {
            diagnosis = {
                type: "TPM_LIMIT",
                explanation: "Token-per-minute limit exceeded. Too many tokens sent within one minute.",
                estimatedReset: "Rolling 60-second window",
                action: "Wait approximately 1 minute and try again.",
            };
        } else if (errorMsg.toLowerCase().includes("request") || errorMsg.toLowerCase().includes("rpm")) {
            diagnosis = {
                type: "RPM_LIMIT",
                explanation: "Request-per-minute limit exceeded. Too many requests sent within one minute.",
                estimatedReset: "Rolling 60-second window",
                action: "Wait approximately 1 minute and try again.",
            };
        } else if (errorMsg.toLowerCase().includes("daily") || errorMsg.toLowerCase().includes("day")) {
            diagnosis = {
                type: "DAILY_QUOTA",
                explanation: "Daily allocation exhausted. You've reached your daily limit.",
                estimatedReset: "Next day (UTC midnight)",
                action: "Wait for quota renewal tomorrow.",
            };
        } else {
            diagnosis = {
                type: "RATE_LIMIT",
                explanation: "Rate limit reached.",
                estimatedReset: "1-2 minutes",
                action: "Wait 1-2 minutes and try again.",
            };
        }
    }
    
    // 400 - Bad request
    else if (status === 400) {
        const errorMsg = parsedBody?.error?.message || parsedBody?.error || "";
        
        if (errorMsg.toLowerCase().includes("context") || errorMsg.toLowerCase().includes("too long") || errorMsg.toLowerCase().includes("max_tokens")) {
            diagnosis = {
                type: "CONTEXT_TOO_LONG",
                explanation: "Prompt exceeds model context limit. The request is too large.",
                estimatedReset: "N/A",
                action: "Reduce prompt size or break into smaller requests.",
            };
        } else if (errorMsg.toLowerCase().includes("invalid") || errorMsg.toLowerCase().includes("parameter")) {
            diagnosis = {
                type: "INVALID_PARAMETERS",
                explanation: "Invalid parameters provided to the API.",
                estimatedReset: "N/A",
                action: "Check request parameters and try again.",
            };
        } else {
            diagnosis = {
                type: "BAD_REQUEST",
                explanation: "Bad request sent to the API.",
                estimatedReset: "N/A",
                action: "Check request format and try again.",
            };
        }
    }
    
    // 401 - Unauthorized
    else if (status === 401) {
        diagnosis = {
            type: "INVALID_API_KEY",
            explanation: "Invalid API key or authentication failed.",
            estimatedReset: "N/A",
            action: "Check API key configuration and contact support.",
        };
    }
    
    // 402 - Payment required
    else if (status === 402) {
        diagnosis = {
            type: "BILLING_QUOTA",
            explanation: "Billing or quota issue. Payment required or quota exhausted.",
            estimatedReset: "After payment/quota renewal",
            action: "Check billing status and add credits if needed.",
        };
    }
    
    // 500/502/503 - Server errors
    else if (status === 500 || status === 502 || status === 503) {
        diagnosis = {
            type: "PROVIDER_OUTAGE",
            explanation: "Provider temporary outage or server error.",
            estimatedReset: "1-5 minutes",
            action: "Wait a few minutes and try again. If persistent, check provider status page.",
        };
    }
    
    // 504 - Gateway timeout
    else if (status === 504) {
        diagnosis = {
            type: "TIMEOUT",
            explanation: "Request timed out. The provider took too long to respond.",
            estimatedReset: "N/A",
            action: "Try again with a shorter prompt or wait and retry.",
        };
    }
    
    // Store for debug endpoint
    lastError = { error: error?.message || error, responseBody: parsedBody };
    lastStatusCode = status;
    lastDiagnosis = diagnosis;
    lastTimestamp = timestamp;
    
    console.log("Diagnosis:", diagnosis);
    console.log("========================");
    
    return diagnosis;
}

/**
 * Get last error information for debug endpoint
 */
function getLastErrorInfo() {
    return {
        lastError,
        lastStatusCode,
        lastDiagnosis,
        lastTimestamp,
    };
}

/**
 * Clear last error information
 */
function clearLastError() {
    lastError = null;
    lastStatusCode = null;
    lastDiagnosis = null;
    lastTimestamp = null;
}

module.exports = {
    analyzeAIError,
    getLastErrorInfo,
    clearLastError,
};
