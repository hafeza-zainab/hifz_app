// repositories/folder.repository.js
"use strict";

const db = require("../config/database");

/**
 * Get all folders for a user with set count
 */
const getFoldersByUser = async (userId) => {
    return db.all(
        `SELECT f.id, f.name, f.color, f.created_at,
                COUNT(fi.id) as set_count
         FROM flashcard_folders f
         LEFT JOIN flashcard_folder_items fi ON f.id = fi.folder_id
         WHERE f.user_id = ?
         GROUP BY f.id
         ORDER BY f.created_at DESC`,
        [userId]
    );
};

/**
 * Create a new folder
 */
const createFolder = async (userId, name, color) => {
    const result = await db.run(
        `INSERT INTO flashcard_folders (user_id, name, color) VALUES (?, ?, ?)`,
        [userId, name, color]
    );
    return result.lastID;
};

/**
 * Rename a folder
 */
const renameFolder = async (folderId, userId, name) => {
    return db.run(
        `UPDATE flashcard_folders SET name = ? WHERE id = ? AND user_id = ?`,
        [name, folderId, userId]
    );
};

/**
 * Delete a folder and all sets inside it
 */
const deleteFolder = async (folderId, userId) => {
    // Verify folder belongs to user
    const folder = await db.get(
        `SELECT id FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
    if (!folder) {
        throw new Error("Folder not found or does not belong to user");
    }

    // Get all set IDs in this folder
    const items = await db.all(
        `SELECT set_id FROM flashcard_folder_items WHERE folder_id = ?`,
        [folderId]
    );

    // Delete all sets in this folder (cascade deletes cards via FK)
    for (const item of items) {
        await db.run(
            `DELETE FROM flashcard_sets WHERE id = ? AND user_id = ?`,
            [item.set_id, userId]
        );
    }

    // Delete folder items
    await db.run(
        `DELETE FROM flashcard_folder_items WHERE folder_id = ?`,
        [folderId]
    );

    // Delete folder
    return db.run(
        `DELETE FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
};

/**
 * Add a flashcard set to a folder (auto-move if already in another folder)
 */
const addItemToFolder = async (folderId, userId, setId, setType) => {
    // Verify folder belongs to user
    const folder = await db.get(
        `SELECT id FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
    if (!folder) {
        throw new Error("Folder not found or does not belong to user");
    }

    // Check if set is already in a folder
    const existingItem = await db.get(
        `SELECT folder_id FROM flashcard_folder_items WHERE set_id = ?`,
        [setId]
    );

    // If set is in another folder, remove it first
    if (existingItem && existingItem.folder_id !== folderId) {
        await db.run(
            `DELETE FROM flashcard_folder_items WHERE set_id = ?`,
            [setId]
        );
    }

    // Insert into new folder (if not already there)
    if (!existingItem || existingItem.folder_id !== folderId) {
        return db.run(
            `INSERT INTO flashcard_folder_items (folder_id, set_id, set_type) VALUES (?, ?, ?)`,
            [folderId, setId, setType]
        );
    }

    // Already in this folder, do nothing
    return { changes: 0 };
};

/**
 * Remove a flashcard set from a folder
 */
const removeItemFromFolder = async (folderId, userId, setId) => {
    // Verify folder belongs to user
    const folder = await db.get(
        `SELECT id FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
    if (!folder) {
        throw new Error("Folder not found or does not belong to user");
    }
    
    return db.run(
        `DELETE FROM flashcard_folder_items WHERE folder_id = ? AND set_id = ?`,
        [folderId, setId]
    );
};

/**
 * Get flashcard sets in a folder
 */
const getSetsInFolder = async (folderId, userId) => {
    // Verify folder belongs to user
    const folder = await db.get(
        `SELECT id FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
    if (!folder) {
        throw new Error("Folder not found or does not belong to user");
    }
    
    return db.all(
        `SELECT fs.id, fs.name, fs.created_at,
                (SELECT COUNT(*) FROM flashcard_cards fc WHERE fc.set_id = fs.id) as cards_count
         FROM flashcard_folder_items fi
         JOIN flashcard_sets fs ON fi.set_id = fs.id
         WHERE fi.folder_id = ? AND fs.user_id = ?
         ORDER BY fs.created_at DESC`,
        [folderId, userId]
    );
};

/**
 * Get uncategorised flashcard sets (not in any folder)
 */
const getUncategorisedSets = async (userId) => {
    // Get all sets for the user with card count
    const allSets = await db.all(
        `SELECT fs.id, fs.name, fs.created_at,
                (SELECT COUNT(*) FROM flashcard_cards fc WHERE fc.set_id = fs.id) as cards_count
         FROM flashcard_sets fs
         WHERE fs.user_id = ?
         ORDER BY fs.created_at DESC`,
        [userId]
    );

    // Get all set IDs that are in folders (set_id is TEXT in flashcard_folder_items)
    const categorisedRows = await db.all(
        `SELECT DISTINCT set_id FROM flashcard_folder_items`
    );

    // Convert to Set of strings for efficient lookup
    const categorisedIds = new Set(categorisedRows.map(r => String(r.set_id)));

    // Filter out categorised sets (convert fs.id to string for comparison)
    return allSets.filter(s => !categorisedIds.has(String(s.id)));
};

/**
 * Get items in a folder (legacy - returns folder items, not full sets)
 */
const getFolderItems = async (folderId, userId) => {
    // Verify folder belongs to user
    const folder = await db.get(
        `SELECT id FROM flashcard_folders WHERE id = ? AND user_id = ?`,
        [folderId, userId]
    );
    if (!folder) {
        throw new Error("Folder not found or does not belong to user");
    }
    
    return db.all(
        `SELECT fi.id, fi.set_id, fi.set_type, fi.folder_id
         FROM flashcard_folder_items fi
         WHERE fi.folder_id = ?`,
        [folderId]
    );
};

module.exports = {
    getFoldersByUser,
    createFolder,
    renameFolder,
    deleteFolder,
    addItemToFolder,
    removeItemFromFolder,
    getSetsInFolder,
    getUncategorisedSets,
    getFolderItems
};
