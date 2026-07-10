// backend/modules/coach/promptBuilder.js
"use strict";

const CORE_PROMPT = require("./prompts/core.prompt");
const HOME_PROMPT = require("./prompts/home.prompt");
const SEQUENCE_PROMPT = require("./prompts/sequence.prompt");
const MUTASHABIHAT_PROMPT = require("./prompts/mutashabihat.prompt");
const BEST_METHOD_PROMPT = require("./prompts/bestMethod.prompt");
const SCHEDULING_PROMPT = require("./prompts/scheduling.prompt");

/**
 * Build system prompt dynamically based on conversation state
 * @param {string} state - Current conversation state
 * @returns {string} Complete system prompt for the current state
 */
function buildSystemPrompt(state) {
    const core = CORE_PROMPT;
    let activeModule = "";
    let moduleName = "HOME";

    if (state === "home") {
        activeModule = HOME_PROMPT;
        moduleName = "HOME";
    } else if (state.startsWith("seq_")) {
        activeModule = SEQUENCE_PROMPT;
        moduleName = "SEQUENCE";
    } else if (state.startsWith("mut_")) {
        activeModule = MUTASHABIHAT_PROMPT;
        moduleName = "MUTASHABIHAT";
    } else if (state === "style_assessment_check" || state === "style_profile_input") {
        activeModule = BEST_METHOD_PROMPT;
        moduleName = "BEST_METHOD";
    } else if (state.startsWith("sched_")) {
        activeModule = SCHEDULING_PROMPT;
        moduleName = "SCHEDULING";
    } else {
        // Default to home for unknown states
        activeModule = HOME_PROMPT;
        moduleName = "HOME";
    }

    const finalPrompt = core + activeModule;

    console.log("=== PROMPT MODULES ===");
    console.log("State:", state);
    console.log("Module:", moduleName);
    console.log("Core length:", core.length);
    console.log("Module length:", activeModule.length);
    console.log("Total length:", finalPrompt.length);
    console.log("======================");

    return finalPrompt;
}

module.exports = {
    buildSystemPrompt,
    CORE_PROMPT,
    HOME_PROMPT,
    SEQUENCE_PROMPT,
    MUTASHABIHAT_PROMPT,
    BEST_METHOD_PROMPT,
    SCHEDULING_PROMPT,
};
