// features/coach/hooks/useCoachChat.js
//
// FIXES in this version:
//
//   1. Context section ORDER — was [diary, mutashabihat, quran].
//      After the 3 000-char cap, the quranContext (most relevant to the
//      current message) was the first section cut. Reordered to:
//        [quranContext, mutashabihatContext, diaryContext]
//      so the per-message Quran data is always preserved and the large
//      diary blob is trimmed last.
//
//   2. buildDiaryContext produces up to ~38 000 chars for a full Quran
//      heatmap (604 pages). The 3 000-char cap means diary fills the
//      whole budget when quranContext is placed last. Reorder fixes this.
//
//   Everything else (history trim, 503 handling, parsers) is unchanged.

import { useState, useCallback, useRef } from "react";
import { useNavigate }           from "react-router-dom";
import { API_BASE, authFetch }   from "../coachConstants";
import { buildDiaryContext, buildMutashabihatContext } from "../coachConstants";
import { buildQuranContext }      from "../utils/quranContextBuilder";
import { parseTipsFromResponse }  from "../parsers/tipParser";
import { parseAllCommands }       from "../parsers/useCoachParsers";

const MAX_HISTORY_TURNS = 8;
const MAX_CONTEXT_CHARS = 3000;

export function useCoachChat({
  heatmapData,
  recentLogs,
  similarities,
  isUnlimited,
  setRemainingMessages,
  messages,
  setMessages,
  setError,
  setInput,
  saveMessage,
  loadSessions,
}) {
  const navigate = useNavigate();

  const [loading,        setLoading]        = useState(false);
  const [navigating,     setNavigating]     = useState(false);
  const [flashcardSaved, setFlashcardSaved] = useState(null);
  const [learningStyle,  setLearningStyle]  = useState(null);
  const [weeklyCycle,    setWeeklyCycle]    = useState(null);
  const [latestSchedule, setLatestSchedule] = useState(null);
  const [memoryTips,     setMemoryTips]     = useState([]);
  const [chatState,      setChatState]      = useState('home');
  const [aiError,        setAIError]        = useState(null);
  const [aiDiagnosis,    setAIDiagnosis]    = useState(null);

  const inflightRef = useRef(false);

  const persistFlashcards = useCallback(async (setName, cards) => {
    console.log("9. POST /api/flashcards/user-sets being called");
    console.log("10. Exact payload being sent:", JSON.stringify({ name: setName, cards }, null, 2));
    try {
      const json = await authFetch('/flashcards/user-sets', {
        method: "POST",
        body:   JSON.stringify({ name: setName, cards }),
      });
      const json = await res.json();
      console.log("11. POST response:", json);
      if (json.success) {
        console.log("12. Flashcard save SUCCESS - setting flashcardSaved state");
        setFlashcardSaved({ count: cards.length, name: setName });
      } else {
        console.log("12. Flashcard save FAILED:", json);
      }
    } catch (e) {
      console.error("13. persistFlashcards() ERROR:", e);
    }
  }, []);

  const refreshQuota = useCallback(async () => {
    if (isUnlimited) return;
    try {
      const json = await authFetch('/coach/remaining');
      if (json.success && json.data?.remaining !== undefined) {
        setRemainingMessages(json.data.remaining);
      }
    } catch (e) {
      console.error("[useCoachChat] refreshQuota:", e);
    }
  }, [isUnlimited, setRemainingMessages]);

  const sendMessageWithHistory = useCallback(async (userText, historyBefore, sessionId) => {
    const traceId = Date.now();
    console.log(`=== COACH TRACE ${traceId} START ===`);

    if (!userText.trim() || inflightRef.current) return;
    inflightRef.current = true;
    setLoading(true);
    setError(null);

    const userMsg    = { role: "user", content: userText };
    const optimistic = [...historyBefore, userMsg];
    setMessages(optimistic);

    try {
      // 1. USER INPUT
      console.log("TRACE", traceId, "Current State:", chatState);
      console.log("TRACE", traceId, "User Input:", userText);

      await saveMessage(sessionId, "user", userText);

      // 3. QURAN CONTEXT
      try {
        console.log("TRACE", traceId, "Building Quran Context");
        const { context: quranContext }   = await buildQuranContext(userText, chatState);
        console.log("TRACE", traceId, "Quran Context Length:", quranContext.length);
        console.log("TRACE", traceId, "Quran Context Preview:", quranContext.substring(0, 300));

        // 4. MUTASHABIHAT CONTEXT
        try {
          const mutashabihatContext = buildMutashabihatContext(similarities);
          console.log("TRACE", traceId, "Mutashabihat Context Length:", mutashabihatContext.length);

          // 5. DIARY CONTEXT
          try {
            const diaryContext = buildDiaryContext(heatmapData, recentLogs);
            console.log("TRACE", traceId, "Diary Context Length:", diaryContext.length);

            // FIX: quranContext first — it's most relevant and must survive the cap.
            // diaryContext last — it's largest and least per-message relevant.
            let contextSections = [quranContext, mutashabihatContext, diaryContext]
              .filter(Boolean)
              .join("\n\n");

            console.log("=== CONTEXT SECTIONS SENT TO BACKEND ===");
            console.log("quranContext length:", quranContext.length);
            console.log("quranContext > 0:", quranContext.length > 0 ? "YES" : "NO");
            console.log("quranContext preview:", quranContext.substring(0, 200));
            console.log("Full contextSections length:", contextSections.length);
            console.log("========================================");

            if (contextSections.length > MAX_CONTEXT_CHARS) {
              contextSections = contextSections.slice(0, MAX_CONTEXT_CHARS);
            }

            // 6. REQUEST SENT TO BACKEND
            try {
              const trimmedHistory  = historyBefore.slice(-MAX_HISTORY_TURNS);
              const messagesPayload = [
                ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: userText },
              ];

              console.log("TRACE", traceId, "Messages Sent:", messagesPayload);
              console.log("TRACE", traceId, "System Context Length:", contextSections.length);
              console.log("TRACE", traceId, "State Sent:", chatState);

              const json = await authFetch('/coach/chat', {
                method: "POST",
                body: JSON.stringify({
                  messages: messagesPayload,
                  system:   contextSections || undefined,
                  state:    chatState,
                }),
              });

              if (!json.success) {
                const errBody = await res.text();
                let parsed = {};
                try { parsed = JSON.parse(errBody); } catch (_) {}
                
                // Handle new AI error diagnosis format
                if (parsed.diagnosis) {
                  setAIError(parsed.error);
                  setAIDiagnosis(parsed.diagnosis);
                  setError(parsed.error);
                  setMessages(historyBefore);
                  return;
                }
                
                // Legacy 503 handling
                if (res.status === 503) {
                  const seconds = parsed.retryAfter ?? 10;
                  setError(`The AI service is busy. Please wait ${seconds} seconds and try again.`);
                  setMessages(historyBefore);
                  return;
                }
                
                throw new Error(`API ${res.status}: ${errBody}`);
              }

              // 7. RAW AI RESPONSE
              try {
                const json    = await res.json();
                const rawText =
                  (Array.isArray(json.content) && json.content[0]?.text) ||
                  json.reply ||
                  json.message ||
                  "";

                console.log("TRACE", traceId, "Raw AI Response:");
                console.log(rawText);

                if (!rawText) throw new Error("Empty response from coach.");

                // 10. MUTASHABIHAT PIPELINE
                try {
                  const { cleanedText: afterTips, navPairs } =
                    await parseTipsFromResponse(rawText, similarities);

                  console.log("TRACE", traceId, "Tips Found:", navPairs?.length || 0);

                  if (navPairs.length > 0) {
                    console.log("TRACE", traceId, "Saving Tips");
                    setMemoryTips((prev) => [
                      ...prev,
                      ...navPairs.map((p) => ({
                        pair: `${p.sourceSurah}:${p.sourceAyah} ↔ ${p.targetSurah}:${p.targetAyah}`,
                        text: p.tip,
                      })),
                    ]);
                    console.log("TRACE", traceId, "Tips Saved");
                  }

                  // 8. COMMAND PARSING
                  try {
                    const {
                      displayText,
                      flashcards,
                      weeklyCycle:   cycle,
                      schedule,
                      learningStyle: style,
                      navigate:      navCmd,
                      sensoryProfile:  profile,
                    } = parseAllCommands(afterTips);

                    console.log("TRACE", traceId, "Display Text:");
                    console.log(displayText);
                    console.log("TRACE", traceId, "Parsed State:", afterTips.match(/\[STATE:(\w+)\]/)?.[1]);
                    console.log("TRACE", traceId, "Parsed Nav:", navCmd);
                    console.log("TRACE", traceId, "Parsed Flashcards:", flashcards);
                    console.log("TRACE", traceId, "Parsed Tips:", navPairs);
                    console.log("TRACE", traceId, "Parsed Sensory Profile:", profile);

                    // SENSORY PROFILE SAVE
                    if (profile?.profile) {
                      console.log("Sensory Profile received:", profile.profile);
                      try {
                        const json = await authFetch('/auth/sensory-profile', {
                          method: "PATCH",
                          body: JSON.stringify({ sensoryProfile: profile.profile }),
                        });
                        if (json.success) {
                          console.log("Sensory Profile saved:", profile.profile);
                        } else {
                          console.error("Failed to save Sensory Profile:", json.message);
                        }
                      } catch (e) {
                        console.error("Sensory Profile save error:", e);
                      }
                    }

                    // 2. STATE MACHINE
                    try {
                      const stateMatch = afterTips.match(/\[STATE:(\w+)\]/);
                      if (stateMatch) {
                        setChatState(stateMatch[1]);
                        console.log("TRACE", traceId, "New State:", stateMatch[1]);
                      }

                      if (style?.primary)  setLearningStyle(style);
                      if (cycle)           setWeeklyCycle(cycle);
                      if (schedule)        setLatestSchedule(schedule);

                      // 9. FLASHCARD PIPELINE
                      try {
                        console.log("TRACE", traceId, "Flashcard Count:", flashcards?.cards?.length || 0);

                        if (flashcards?.cards?.length) {
                          console.log("TRACE", traceId, "Saving Flashcards");
                          await persistFlashcards(flashcards.name, flashcards.cards);
                          console.log("TRACE", traceId, "Flashcard Save Success");
                        }

                        await refreshQuota();

                        // 12. NAVIGATION
                        try {
                          console.log("TRACE", traceId, "Navigation Command:", navCmd);

                          if (navCmd?.page) {
                            setNavigating(true);
                            // 11. SESSION SAVE
                            try {
                              console.log("TRACE", traceId, "Saving Assistant Message");
                              await saveMessage(sessionId, "assistant", displayText);
                              console.log("TRACE", traceId, "Assistant Message Saved");
                            } catch (err) {
                              console.error("TRACE", traceId, "SESSION SAVE FAILED", err);
                            }

                            await loadSessions();
                            setMessages([...optimistic, { role: "assistant", content: displayText }]);
                            setTimeout(() => {
                              navigate(`/${navCmd.page}`);
                              setNavigating(false);
                            }, 1200);
                            return;
                          }

                          // 11. SESSION SAVE
                          try {
                            console.log("TRACE", traceId, "Saving Assistant Message");
                            setMessages([...optimistic, { role: "assistant", content: displayText }]);
                            await saveMessage(sessionId, "assistant", displayText);
                            console.log("TRACE", traceId, "Assistant Message Saved");
                          } catch (err) {
                            console.error("TRACE", traceId, "SESSION SAVE FAILED", err);
                          }

                          await loadSessions();

                          // 13. FINAL STATE
                          console.log("TRACE", traceId, "Final State:", chatState);
                          console.log(`=== COACH TRACE ${traceId} END ===`);

                        } catch (err) {
                          console.error("TRACE", traceId, "NAVIGATION SECTION FAILED", err);
                          throw err;
                        }

                      } catch (err) {
                        console.error("TRACE", traceId, "FLASHCARD PIPELINE FAILED", err);
                        throw err;
                      }

                    } catch (err) {
                      console.error("TRACE", traceId, "STATE MACHINE SECTION FAILED", err);
                      throw err;
                    }

                  } catch (err) {
                    console.error("TRACE", traceId, "COMMAND PARSING FAILED", err);
                    throw err;
                  }

                } catch (err) {
                  console.error("TRACE", traceId, "MUTASHABIHAT PIPELINE FAILED", err);
                  throw err;
                }

              } catch (err) {
                console.error("TRACE", traceId, "RAW AI RESPONSE SECTION FAILED", err);
                throw err;
              }

            } catch (err) {
              console.error("TRACE", traceId, "REQUEST SENT TO BACKEND FAILED", err);
              throw err;
            }

          } catch (err) {
            console.error("TRACE", traceId, "DIARY CONTEXT SECTION FAILED", err);
            throw err;
          }

        } catch (err) {
          console.error("TRACE", traceId, "MUTASHABIHAT CONTEXT SECTION FAILED", err);
          throw err;
        }

      } catch (err) {
        console.error("TRACE", traceId, "QURAN CONTEXT SECTION FAILED", err);
        throw err;
      }

    } catch (err) {
      console.error("[useCoachChat] sendMessageWithHistory:", err);
      setError("Something went wrong. Please try again.");
      setMessages(historyBefore);
    } finally {
      setLoading(false);
      inflightRef.current = false;
    }
  }, [
    heatmapData, recentLogs, similarities,
    saveMessage, refreshQuota, persistFlashcards,
    loadSessions, navigate,
    setMessages, setError,
    chatState,
  ]);

  const dismissAIError = useCallback(() => {
    setAIError(null);
    setAIDiagnosis(null);
    setError(null);
  }, [setError]);

  return {
    loading,
    navigating,
    flashcardSaved,
    setFlashcardSaved,
    learningStyle,
    weeklyCycle,
    latestSchedule,
    memoryTips,
    chatState,
    setChatState,
    aiError,
    aiDiagnosis,
    dismissAIError,
    sendMessageWithHistory,
  };
}