// modules/coach/flashcard.routes.js
"use strict";

const express        = require("express");
const router         = express.Router();
const auth           = require("../../middleware/authMiddleware");
const flashcardRepo  = require("../../repositories/flashcard.repository");
const folderRepo     = require("../../repositories/folder.repository");
const db             = require("../../config/database");

// ─── DEBUG ROUTE: List all tables and columns ─────────────────────────────
router.get("/debug-tables", auth, async (req, res, next) => {
    try {
        const tables = await db.all(
            "SELECT name FROM sqlite_master WHERE type='table'"
        );
        const result = {};
        for (const t of tables) {
            try {
                const cols = await db.all(`PRAGMA table_info(${t.name})`);
                const rows = await db.get(`SELECT COUNT(*) as count FROM ${t.name}`);
                result[t.name] = { columns: cols.map(c => c.name), rowCount: rows.count };
            } catch(e) {
                result[t.name] = { error: e.message };
            }
        }
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/flashcards/user-sets ───────────────────────────────────────────
router.get("/user-sets", auth, async (req, res, next) => {
    try {
        const sets = await flashcardRepo.getSetsByUser(req.user.id);
        res.json({ success: true, data: sets });
    } catch (err) { next(err); }
});

// ─── GET /api/flashcards/user-sets/uncategorised ─────────────────────────────────
// Must be BEFORE /user-sets/:id to avoid being caught by the wildcard
router.get("/user-sets/uncategorised", auth, async (req, res, next) => {
    try {
        console.log('[uncategorised] Fetching for user:', req.user.id);
        const sets = await folderRepo.getUncategorisedSets(req.user.id);
        console.log('[uncategorised] Found sets:', sets.length);
        res.json({ success: true, data: sets });
    } catch (err) {
        console.error('[uncategorised] Error:', err.message);
        console.error('[uncategorised] Stack:', err.stack);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─── POST /api/flashcards/user-sets ──────────────────────────────────────────
// Body: { name: string, cards: [{ front, back }, …] }
router.post("/user-sets", auth, async (req, res, next) => {
    try {
        const { name, cards } = req.body;

        if (!name || typeof name !== "string" || !name.trim())
            return res.status(400).json({ success: false, message: "name is required and must be a non-empty string." });
        if (!Array.isArray(cards) || cards.length === 0)
            return res.status(400).json({ success: false, message: "cards must be a non-empty array." });
        for (const card of cards) {
            if (!card.front || !card.back)
                return res.status(400).json({ success: false, message: "Each card must have front and back properties." });
        }

        console.log('[FLASHCARD CREATE] Creating set with name:', name.trim(), 'for user:', req.user.id);

        const setId = await flashcardRepo.createSet(req.user.id, name);
        await flashcardRepo.bulkInsertCards(setId, cards);

        console.log('[FLASHCARD CREATE] Set created with ID:', setId, 'name:', name.trim());

        res.status(201).json({
            success: true,
            data: {
                id:         setId,
                name:       name.trim(),
                cardCount:  cards.length,
                created_at: new Date().toISOString(),
            },
        });
    } catch (err) { next(err); }
});

// ─── GET /api/flashcards/user-sets/:id ───────────────────────────────────────
router.get("/user-sets/:id", auth, async (req, res, next) => {
    try {
        console.log('[FLASHCARD FETCH] Fetching set ID:', req.params.id, 'for user:', req.user.id);
        const set = await flashcardRepo.getSetByIdAndUser(req.params.id, req.user.id);
        if (!set) return res.status(404).json({ success: false, message: "Set not found." });

        console.log('[FLASHCARD FETCH] Found set:', set.id, 'name:', set.name);
        const cards = await flashcardRepo.getCardsBySet(req.params.id);
        console.log('[FLASHCARD FETCH] Cards count:', cards.length);
        res.json({ success: true, data: { ...set, cards } });
    } catch (err) { next(err); }
});

// ─── PATCH /api/flashcards/user-sets/:id ─────────────────────────────────────
// Body: { name: string }
router.patch("/user-sets/:id", auth, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== "string" || !name.trim())
            return res.status(400).json({ success: false, message: "name is required and must be a non-empty string." });

        const changes = await flashcardRepo.renameSet(req.params.id, req.user.id, name);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Set not found." });

        res.json({ success: true, data: { id: req.params.id, name: name.trim(), message: "Set renamed successfully." } });
    } catch (err) { next(err); }
});

// ─── DELETE /api/flashcards/user-sets/:id ────────────────────────────────────
router.delete("/user-sets/:id", auth, async (req, res, next) => {
    try {
        const changes = await flashcardRepo.deleteSet(req.params.id, req.user.id);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Set not found." });
        res.json({ success: true, message: "Set deleted." });
    } catch (err) { next(err); }
});

// ─── FOLDER ROUTES ───────────────────────────────────────────────────────────────

// ─── GET /api/flashcards/folders ───────────────────────────────────────────────
router.get("/folders", auth, async (req, res, next) => {
    try {
        const folders = await folderRepo.getFoldersByUser(req.user.id);
        res.json({ success: true, data: folders });
    } catch (err) { next(err); }
});

// ─── POST /api/flashcards/folders ──────────────────────────────────────────────
// Body: { name: string, color: string }
router.post("/folders", auth, async (req, res, next) => {
    try {
        const { name, color } = req.body;
        if (!name || typeof name !== "string" || !name.trim())
            return res.status(400).json({ success: false, message: "name is required and must be a non-empty string." });
        
        const folderId = await folderRepo.createFolder(req.user.id, name.trim(), color || '#1B4332');
        res.status(201).json({ success: true, data: { id: folderId, name: name.trim(), color: color || '#1B4332' } });
    } catch (err) { next(err); }
});

// ─── DELETE /api/flashcards/folders/:id ───────────────────────────────────────────
router.delete("/folders/:id", auth, async (req, res, next) => {
    try {
        const changes = await folderRepo.deleteFolder(req.params.id, req.user.id);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Folder not found." });
        res.json({ success: true, message: "Folder deleted." });
    } catch (err) { next(err); }
});

// ─── GET /api/flashcards/folders/:id/sets ─────────────────────────────────────
router.get("/folders/:id/sets", auth, async (req, res, next) => {
    try {
        const sets = await folderRepo.getSetsInFolder(req.params.id, req.user.id);
        res.json({ success: true, data: sets });
    } catch (err) { next(err); }
});

// ─── PATCH /api/flashcards/folders/:id ───────────────────────────────────────────
// Body: { name: string }
router.patch("/folders/:id", auth, async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== "string" || !name.trim())
            return res.status(400).json({ success: false, message: "name is required and must be a non-empty string." });

        const changes = await folderRepo.renameFolder(req.params.id, req.user.id, name.trim());
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Folder not found." });

        res.json({ success: true, data: { id: req.params.id, name: name.trim(), message: "Folder renamed successfully." } });
    } catch (err) { next(err); }
});

// ─── POST /api/flashcards/folders/:id/items/batch ─────────────────────────────────
// Body: { items: [{ set_id: string, set_type: string }, …] }
router.post("/folders/:id/items/batch", auth, async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items) || items.length === 0)
            return res.status(400).json({ success: false, message: "items must be a non-empty array." });
        
        for (const item of items) {
            if (!item.set_id || !item.set_type)
                return res.status(400).json({ success: false, message: "Each item must have set_id and set_type." });
            await folderRepo.addItemToFolder(req.params.id, req.user.id, item.set_id, item.set_type);
        }
        
        res.json({ success: true, message: `${items.length} items added to folder.` });
    } catch (err) { next(err); }
});

// ─── POST /api/flashcards/folders/:id/items ─────────────────────────────────────
// Body: { set_id: string, set_type: string }
router.post("/folders/:id/items", auth, async (req, res, next) => {
    try {
        const { set_id, set_type } = req.body;
        if (!set_id || !set_type)
            return res.status(400).json({ success: false, message: "set_id and set_type are required." });
        
        await folderRepo.addItemToFolder(req.params.id, req.user.id, set_id, set_type);
        res.json({ success: true, message: "Item added to folder." });
    } catch (err) { next(err); }
});

// ─── DELETE /api/flashcards/folders/:id/items/:setId ────────────────────────────
router.delete("/folders/:id/items/:setId", auth, async (req, res, next) => {
    try {
        const changes = await folderRepo.removeItemFromFolder(req.params.id, req.user.id, req.params.setId);
        if (changes === 0)
            return res.status(404).json({ success: false, message: "Item not found in folder." });
        res.json({ success: true, message: "Item removed from folder." });
    } catch (err) { next(err); }
});

module.exports = router;