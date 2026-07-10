/**
 * scripts/_db.js
 *
 * Shared SQLite helper for all scripts.
 * Promisifies sqlite3 and exposes run / get / all / close.
 *
 * Usage:
 *   const { openDb } = require('../_db');
 *   const db = await openDb();
 *   await db.run('INSERT INTO ...', [...]);
 *   await db.close();
 */

"use strict";

const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const fs      = require("fs");

const DB_PATH = path.resolve(__dirname, "../database/quran.db");

/**
 * Opens the database and returns a thin promise wrapper.
 * @param {object}  [opts]
 * @param {boolean} [opts.readOnly=false]  Open in SQLITE_OPEN_READONLY mode.
 * @param {boolean} [opts.wal=true]        Enable WAL journal mode (write connections).
 * @returns {Promise<DbHandle>}
 */
async function openDb({ readOnly = false, wal = true } = {}) {
    // Fail fast if the file doesn't exist for read-only callers
    if (readOnly && !fs.existsSync(DB_PATH)) {
        throw new Error(`Database file not found: ${DB_PATH}\nRun: node scripts/maintenance/setup.js`);
    }

    const mode = readOnly
        ? sqlite3.OPEN_READONLY
        : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;

    const raw = await new Promise((resolve, reject) => {
        const instance = new sqlite3.Database(DB_PATH, mode, (err) => {
            if (err) reject(new Error(`Cannot open database at ${DB_PATH}: ${err.message}`));
            else resolve(instance);
        });
    });

    if (!readOnly && wal) {
        await _run(raw, "PRAGMA journal_mode=WAL");
        await _run(raw, "PRAGMA foreign_keys=ON");
    }

    /** @type {DbHandle} */
    const db = {
        /** Execute a statement; resolves { lastID, changes }. */
        run: (sql, params = []) => _run(raw, sql, params),

        /** Fetch one row or undefined. */
        get: (sql, params = []) => _get(raw, sql, params),

        /** Fetch all rows. */
        all: (sql, params = []) => _all(raw, sql, params),

        /** Execute multi-statement SQL (no params). */
        exec: (sql) => _exec(raw, sql),

        /** Convenience: BEGIN / COMMIT / ROLLBACK wrappers. */
        begin:    () => _run(raw, "BEGIN TRANSACTION"),
        commit:   () => _run(raw, "COMMIT"),
        rollback: () => _run(raw, "ROLLBACK"),

        /** Close the connection. Always call in a finally block. */
        close: () => _close(raw),

        /** The raw sqlite3.Database, for edge cases. */
        raw,
    };

    return db;
}

// ─── Internal promise wrappers ────────────────────────────────────────────────

function _run(raw, sql, params = []) {
    return new Promise((resolve, reject) => {
        raw.run(sql, params, function (err) {
            if (err) reject(annotate(err, sql));
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function _get(raw, sql, params = []) {
    return new Promise((resolve, reject) => {
        raw.get(sql, params, (err, row) => {
            if (err) reject(annotate(err, sql));
            else resolve(row);
        });
    });
}

function _all(raw, sql, params = []) {
    return new Promise((resolve, reject) => {
        raw.all(sql, params, (err, rows) => {
            if (err) reject(annotate(err, sql));
            else resolve(rows);
        });
    });
}

function _exec(raw, sql) {
    return new Promise((resolve, reject) => {
        raw.exec(sql, (err) => {
            if (err) reject(annotate(err, sql));
            else resolve();
        });
    });
}

function _close(raw) {
    return new Promise((resolve, reject) => {
        raw.close((err) => {
            if (err) reject(new Error(`Failed to close database: ${err.message}`));
            else resolve();
        });
    });
}

/** Attaches a snippet of the SQL to the error for easier debugging. */
function annotate(err, sql) {
    const snippet = sql.replace(/\s+/g, " ").trim().slice(0, 80);
    err.message = `${err.message}\n  SQL: ${snippet}`;
    return err;
}

module.exports = { openDb, DB_PATH };