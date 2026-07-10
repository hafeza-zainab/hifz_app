// backend/utils/tokenUsageTracker.js
//
// Tracks token usage for AI requests to identify large prompts causing TPM limits

const MAX_REQUESTS = 20;

let requestHistory = [];

/**
 * Record a request's token usage
 * @param {Object} data - Request data
 * @param {number} data.promptTokens - Prompt tokens used
 * @param {number} data.completionTokens - Completion tokens used
 * @param {number} data.totalTokens - Total tokens used
 * @param {number} data.charsSent - Total characters sent in request
 * @param {string} data.endpoint - API endpoint used
 */
function recordRequest({ promptTokens, completionTokens, totalTokens, charsSent, endpoint }) {
    const request = {
        timestamp: new Date().toISOString(),
        promptTokens: promptTokens || 0,
        completionTokens: completionTokens || 0,
        totalTokens: totalTokens || 0,
        charsSent: charsSent || 0,
        endpoint: endpoint || "unknown",
    };

    requestHistory.push(request);

    // Keep only the last MAX_REQUESTS
    if (requestHistory.length > MAX_REQUESTS) {
        requestHistory.shift();
    }

    console.log("=== TOKEN USAGE RECORDED ===");
    console.log("Prompt tokens:", request.promptTokens);
    console.log("Completion tokens:", request.completionTokens);
    console.log("Total tokens:", request.totalTokens);
    console.log("Chars sent:", request.charsSent);
    console.log("Endpoint:", request.endpoint);
    console.log("============================");
}

/**
 * Get request history and statistics
 * @returns {Object} Statistics including history, averages, and largest values
 */
function getTokenUsageStats() {
    if (requestHistory.length === 0) {
        return {
            last20Requests: [],
            averagePromptTokens: 0,
            largestPromptTokens: 0,
            largestCharsSent: 0,
        };
    }

    const totalPromptTokens = requestHistory.reduce((sum, req) => sum + req.promptTokens, 0);
    const averagePromptTokens = Math.round(totalPromptTokens / requestHistory.length);
    const largestPromptTokens = Math.max(...requestHistory.map(req => req.promptTokens));
    const largestCharsSent = Math.max(...requestHistory.map(req => req.charsSent));

    return {
        last20Requests: requestHistory,
        averagePromptTokens,
        largestPromptTokens,
        largestCharsSent,
    };
}

/**
 * Clear request history
 */
function clearHistory() {
    requestHistory = [];
}

module.exports = {
    recordRequest,
    getTokenUsageStats,
    clearHistory,
};
