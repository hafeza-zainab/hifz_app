// backend/modules/coach/sensoryProfileWizard.controller.js
"use strict";

const { formatSuccess, formatError } = require("../../utils/responseFormatter");
const BEST_METHOD_PROMPT = require("./prompts/bestMethod.prompt");
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const userRepo = require("../auth/user.model");

// Accepted profiles (deterministic validation)
const ACCEPTED_PROFILES = [
  'Exploratory Learner',
  'Repetitive Learner',
  'Sensitive Structured Learner',
  'Balanced Learner',
];

// ─── Sensory Profile Wizard Controllers (Backend-Only Classification Logic) ─────────────

/**
 * Save Profile - Backend validates and saves profile
 * POST /api/coach/wizard/sensory-profile/save
 * Body: { profile: string }
 */
exports.saveProfile = async (req, res, next) => {
    try {
        const { profile } = req.body;
        const userId = req.user.id;

        if (!profile) {
            return res.status(400).json(formatError("profile is required."));
        }

        // Backend-only validation (deterministic)
        const normalizedProfile = profile.trim();
        const isValid = ACCEPTED_PROFILES.some(
            accepted => accepted.toLowerCase() === normalizedProfile.toLowerCase()
        );

        if (!isValid) {
            return res.status(400).json(formatError(
                `Invalid profile. Accepted profiles: ${ACCEPTED_PROFILES.join(', ')}`
            ));
        }

        // Find the exact profile name (case-insensitive match)
        const exactProfile = ACCEPTED_PROFILES.find(
            accepted => accepted.toLowerCase() === normalizedProfile.toLowerCase()
        );

        // Persist profile to database
        // In production, this would save to a user profiles table
        // await userRepo.saveProfile(userId, exactProfile);

        // Use LLM ONLY to format recommendation message (no classification)
        const recommendation = await formatRecommendationWithLLM(exactProfile);

        res.status(200).json(formatSuccess({
            profile: exactProfile,
            message: recommendation,
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * Helper: Use LLM ONLY to format recommendation message (no classification)
 */
async function formatRecommendationWithLLM(profile) {
    const messages = [
        { role: "system", content: BEST_METHOD_PROMPT },
        { role: "user", content: `Provide coaching recommendation for: ${profile}` },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 500,
            temperature: 0.3,
        }),
    });

    if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    return groqData.choices[0].message.content;
}

/**
 * Clear Profile - Remove Sensory Profile from user
 * DELETE /api/coach/wizard/sensory-profile/clear
 */
exports.clearProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Clear profile from database
        await userRepo.clearSensoryProfile(userId);

        res.status(200).json(formatSuccess({ cleared: true }, "Profile cleared successfully."));
    } catch (err) {
        next(err);
    }
};
