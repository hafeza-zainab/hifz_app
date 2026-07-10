// modules/coach/chat.routes.js
"use strict";

const express     = require("express");
const router      = express.Router();
const auth        = require("../../middleware/authMiddleware");
const coachRepo   = require("../../repositories/coach.repository");
const { buildSystemPrompt } = require("./promptBuilder");
const { analyzeAIError, getLastErrorInfo } = require("../../utils/aiErrorHandler");
const { recordRequest, getTokenUsageStats } = require("../../utils/tokenUsageTracker");

const UNLIMITED_USER_ID = parseInt(process.env.UNLIMITED_USER_ID || "0");
const DAILY_LIMIT       = 10;

// ─── GET /api/coach/remaining ─────────────────────────────────────────────────
router.get("/remaining", auth, async (req, res, next) => {
    try {
        const isUnlimited = Number(req.user.id) === UNLIMITED_USER_ID;
        if (isUnlimited)
            return res.json({ success: true, data: { remaining: null, unlimited: true } });

        const used = await coachRepo.getDailyCount(req.user.id);
        res.json({
            success: true,
            data: { remaining: Math.max(0, DAILY_LIMIT - used), unlimited: false },
        });
    } catch (err) { next(err); }
});

// ─── POST /api/coach/chat ─────────────────────────────────────────────────────
router.post("/chat", auth, async (req, res, next) => {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 30_000);

    try {
        const isUnlimited = Number(req.user.id) === UNLIMITED_USER_ID;

        // 1. Daily limit check
        if (!isUnlimited) {
            const used = await coachRepo.getDailyCount(req.user.id);
            if (used >= DAILY_LIMIT) {
                clearTimeout(timeout);
                return res.status(429).json({
                    success: false,
                    error:   `Daily limit of ${DAILY_LIMIT} coach messages reached. Come back tomorrow!`,
                });
            }
        }

        // 2. Groq key guard
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            clearTimeout(timeout);
            return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
        }

        // 3. Build messages
        const { messages = [], system: clientSystem, state: currentState = "home" } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            clearTimeout(timeout);
            return res.status(400).json({ error: "messages array is required and must not be empty." });
        }

        const studentDataSection =
            clientSystem && clientSystem.includes("=== STUDENT")
                ? "\n\n" + clientSystem.substring(clientSystem.indexOf("=== STUDENT"))
                : clientSystem && clientSystem.includes("=== JUZ")
                ? "\n\n" + clientSystem.substring(clientSystem.indexOf("=== JUZ"))
                : clientSystem
                ? "\n\n" + clientSystem
                : "";

        console.log("=== STUDENT DATA SECTION ===");
        console.log("Before studentDataSection length:", 0);
        console.log("After studentDataSection length:", studentDataSection.length);
        console.log("Chars added:", studentDataSection.length);
        console.log("==============================");

        // Add current state to system prompt so AI knows where it is in the flow
        const stateSection = `\n\nCURRENT CONVERSATION STATE: ${currentState}`;
        
        console.log("=== STATE SECTION ===");
        console.log("Before stateSection length:", 0);
        console.log("After stateSection length:", stateSection.length);
        console.log("Chars added:", stateSection.length);
        console.log("======================");

        // Build system prompt dynamically based on state
        const baseSystemPrompt = buildSystemPrompt(currentState);
        const fullSystem = baseSystemPrompt + stateSection + studentDataSection;

        console.log("=== FULL SYSTEM PROMPT ===");
        console.log("Before fullSystem length:", baseSystemPrompt.length);
        console.log("After fullSystem length:", fullSystem.length);
        console.log("Chars added:", stateSection.length + studentDataSection.length);
        console.log("==========================");

        const formattedMessages = [
            { role: "system", content: fullSystem },
            ...messages.map((m) => ({
                role:    m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            })),
        ];

        // Calculate prompt diagnostics
        const systemPromptLength = fullSystem.length;
        const userMessages = messages.filter(m => m.role === "user").map(m => m.content).join("");
        const userTextLength = userMessages.length;
        const conversationText = messages.map(m => m.content).join("");
        const conversationLength = conversationText.length;
        const contextSection = clientSystem || "";
        const quranContextLength = contextSection.length;
        const totalChars = systemPromptLength + userTextLength + conversationLength + quranContextLength;

        console.log("=== PROMPT SECTION LENGTHS ===");
        console.log("System Prompt:", systemPromptLength);
        console.log("Conversation History:", conversationLength);
        console.log("Quran Context:", quranContextLength);
        console.log("User Message:", userTextLength);
        console.log("Total Request:", totalChars);
        console.log("==============================");

        console.log("=== FINAL SYSTEM PROMPT ===");
        console.log("Final systemPrompt length:", systemPromptLength);
        console.log("SystemPrompt preview start:", fullSystem.substring(0, 500));
        console.log("SystemPrompt preview end:", fullSystem.substring(fullSystem.length - 500));
        console.log("==========================");

        console.log("=== PROMPT DIAGNOSTICS ===");
        console.log("System prompt chars:", systemPromptLength);
        console.log("User message chars:", userTextLength);
        console.log("Conversation chars:", conversationLength);
        console.log("Quran context chars:", quranContextLength);
        console.log("Total request chars:", totalChars);

        if (quranContextLength > 0) {
            console.log("Quran context preview:");
            console.log(contextSection.substring(0, 500));
        }

        console.log("==========================");

        // Duplicate detection
        console.log("=== DUPLICATE DETECTION ===");
        const option1Count = (fullSystem.match(/OPTION 1 - Sequence/g) || []).length;
        const option2Count = (fullSystem.match(/OPTION 2 - Mutashabihat/g) || []).length;
        const option3Count = (fullSystem.match(/OPTION 3 - Best Method/g) || []).length;
        const option4Count = (fullSystem.match(/OPTION 4 - Time Management/g) || []).length;
        
        console.log("OPTION 1 - Sequence occurrences:", option1Count);
        console.log("OPTION 2 - Mutashabihat occurrences:", option2Count);
        console.log("OPTION 3 - Best Method occurrences:", option3Count);
        console.log("OPTION 4 - Time Management occurrences:", option4Count);
        console.log("==========================");

        // 4. Groq call
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method:  "POST",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body:   JSON.stringify({ model: "llama-3.3-70b-versatile", messages: formattedMessages, max_tokens: 1200, temperature: 0.7 }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!groqResponse.ok) {
            const errText = await groqResponse.text();
            const diagnosis = analyzeAIError(groqResponse.status, errText, new Error(errText), "Groq");
            
            return res.status(groqResponse.status).json({
                success: false,
                error: diagnosis.explanation,
                diagnosis: diagnosis,
            });
        }

        const groqData = await groqResponse.json();
        const text     = groqData.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";

        // Log API usage
        console.log("Prompt tokens:", groqData.usage?.prompt_tokens);
        console.log("Completion tokens:", groqData.usage?.completion_tokens);
        console.log("Total tokens:", groqData.usage?.total_tokens);

        // Record token usage
        recordRequest({
            promptTokens: groqData.usage?.prompt_tokens,
            completionTokens: groqData.usage?.completion_tokens,
            totalTokens: groqData.usage?.total_tokens,
            charsSent: totalChars,
            endpoint: "/api/coach/chat",
        });

        // 5. Record usage (limited users only)
        if (!isUnlimited) {
            await coachRepo.recordUsage(req.user.id)
                .catch((e) => console.error("Failed to record coach_message:", e.message));
        }

        // 6. Respond
        res.json({ content: [{ type: "text", text }] });
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
            const diagnosis = analyzeAIError(504, "Request timeout", err, "Groq");
            return res.status(504).json({
                success: false,
                error: diagnosis.explanation,
                diagnosis: diagnosis,
            });
        }
        
        const diagnosis = analyzeAIError(500, err.message, err, "Groq");
        console.error("Coach proxy error:", err.message);
        next(err);
    }
});

// ─── GET /api/coach/sessions ──────────────────────────────────────────────────
router.get("/sessions", auth, async (req, res, next) => {
    try {
        const sessions = await coachRepo.getSessions(req.user.id);
        res.json({ success: true, data: sessions });
    } catch (err) { next(err); }
});

// ─── POST /api/coach/sessions ─────────────────────────────────────────────────
router.post("/sessions", auth, async (req, res, next) => {
    try {
        const session = await coachRepo.createSession(req.user.id, req.body.title);
        res.status(201).json({ success: true, data: session });
    } catch (err) { next(err); }
});

// ─── GET /api/coach/sessions/:id/messages ────────────────────────────────────
router.get("/sessions/:id/messages", auth, async (req, res, next) => {
    try {
        const session = await coachRepo.getSessionByIdAndUser(req.params.id, req.user.id);
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found." });

        const messages = await coachRepo.getMessages(req.params.id);
        res.json({ success: true, data: messages });
    } catch (err) { next(err); }
});

// ─── GET /api/debug/ai-status ─────────────────────────────────────────────────
router.get("/debug/ai-status", auth, async (req, res, next) => {
    try {
        const errorInfo = getLastErrorInfo();
        res.json({
            success: true,
            data: errorInfo,
        });
    } catch (err) { next(err); }
});

// ─── GET /api/debug/token-usage ───────────────────────────────────────────────
router.get("/debug/token-usage", auth, async (req, res, next) => {
    try {
        const stats = getTokenUsageStats();
        res.json({
            success: true,
            data: stats,
        });
    } catch (err) { next(err); }
});

// ─── POST /api/coach/sessions/:id/messages ───────────────────────────────────
router.post("/sessions/:id/messages", auth, async (req, res, next) => {
    try {
        const { role, content } = req.body;

        if (!role || !content)
            return res.status(400).json({ success: false, message: "role and content are required." });
        if (!["user", "assistant"].includes(role))
            return res.status(400).json({ success: false, message: "role must be user or assistant." });

        const session = await coachRepo.getSessionByIdAndUser(req.params.id, req.user.id);
        if (!session)
            return res.status(404).json({ success: false, message: "Session not found." });

        const newId = await coachRepo.addMessage(req.params.id, role, content);
        await coachRepo.touchSession(req.params.id);

        if (role === "user") {
            await coachRepo.autoTitleSession(req.params.id, content);
        }

        res.status(201).json({ success: true, data: { id: newId } });
    } catch (err) { next(err); }
});

// ─── DELETE /api/coach/sessions/:id ──────────────────────────────────────────
router.delete("/sessions/:id", auth, async (req, res, next) => {
    try {
        const changes = await coachRepo.deleteSession(req.params.id, req.user.id);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Session not found." });
        res.json({ success: true, message: "Session deleted." });
    } catch (err) { next(err); }
});

// ─── PATCH /api/coach/sessions/:id ───────────────────────────────────────────
router.patch("/sessions/:id", auth, async (req, res, next) => {
    try {
        const { title } = req.body;
        if (!title)
            return res.status(400).json({ success: false, message: "title is required." });

        const changes = await coachRepo.renameSession(req.params.id, req.user.id, title);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Session not found." });
        res.json({ success: true, message: "Session renamed." });
    } catch (err) { next(err); }
});

module.exports = router;