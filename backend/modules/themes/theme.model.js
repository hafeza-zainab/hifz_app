// modules/themes/theme.model.js
// ---------------------------------------------------------------------------
// DEPRECATED — kept only so any indirect callers (e.g. diary sub-controllers
// that call ThemeModel.incrementStreak) continue to work without changes.
//
// All SQL now lives in repositories/theme.repository.js.
// New code should import the repository directly.
// This file will be removed in the next cleanup pass once all callers
// have been updated to import from the repository.
// ---------------------------------------------------------------------------
"use strict";

module.exports = require("../../repositories/theme.repository");