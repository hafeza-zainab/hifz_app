// features/coach/useCoachSessions.js
//
// Responsible for:
//   • sessions list  — load, create, delete, rename  (via JWT REST API)
//   • active session — id + messages array
//   • form state     — input string, error string
//   • saveMessage    — persists a single message row

import { useState, useCallback } from "react";
import { API_BASE, authFetch } from "../coachConstants";

export function useCoachSessions() {
  const [sessions,        setSessions]        = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState("");
  const [error,           setError]           = useState(null);

  // ── Load all sessions ──────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const json = await authFetch('/coach/sessions');
      if (json.success) setSessions(json.data ?? []);
    } catch (e) {
      console.error("[useCoachSessions] loadSessions:", e);
    }
  }, []);

  // ── Load messages for a session ────────────────────────────────────────────
  const loadSession = useCallback(async (sessionId) => {
    setActiveSessionId(sessionId);
    setMessages([]);
    setError(null);
    try {
      const json = await authFetch(`/coach/sessions/${sessionId}/messages`);
      if (json.success) {
        setMessages(
          (json.data ?? []).map((m) => ({ role: m.role, content: m.content }))
        );
      }
    } catch (e) {
      console.error("[useCoachSessions] loadSession:", e);
      setError("Could not load session messages.");
    }
  }, []);

  // ── Create a new session — returns new session id or null ─────────────────
  const createSession = useCallback(async (firstMessageText = "") => {
    const title = (firstMessageText.trim().slice(0, 50)) || "New conversation";
    try {
      const json = await authFetch('/coach/sessions', {
        method: "POST",
        body:   JSON.stringify({ title }),
      });
      if (!json.success || !json.data?.id) return null;

      setSessions((prev) => [json.data, ...prev]);
      setActiveSessionId(json.data.id);
      setMessages([]);
      setError(null);
      return json.data.id;
    } catch (e) {
      console.error("[useCoachSessions] createSession:", e);
      return null;
    }
  }, []);

  // ── Delete a session ───────────────────────────────────────────────────────
  const deleteSession = useCallback(async (sessionId) => {
    try {
      await authFetch(`/coach/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setError(null);
      }
    } catch (e) {
      console.error("[useCoachSessions] deleteSession:", e);
    }
  }, [activeSessionId]);

  // ── Rename a session ───────────────────────────────────────────────────────
  // NOTE: CoachSidebar also calls the PATCH endpoint directly for its inline
  // rename UX. This function is called by CoachSidebar's onRenameSession prop
  // to sync local state after the sidebar's own fetch succeeds.
  const renameSession = useCallback((sessionId, newTitle) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
  }, []);

  // ── Persist a single message ───────────────────────────────────────────────
  const saveMessage = useCallback(async (sessionId, role, content) => {
    try {
      await authFetch(`/coach/sessions/${sessionId}/messages`, {
        method: "POST",
        body:   JSON.stringify({ role, content }),
      });
      // Bump session to top of list by updating updated_at locally
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s
        );
        return [...updated].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
      });
    } catch (e) {
      console.error("[useCoachSessions] saveMessage:", e);
    }
  }, []);

  return {
    sessions,
    loadSessions,
    activeSessionId,
    messages,
    setMessages,
    input,
    setInput,
    error,
    setError,
    loadSession,
    createSession,
    deleteSession,
    renameSession,
    saveMessage,
  };
}