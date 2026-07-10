"use strict";

// ---------------------------------------------------------------------------
// modules/diary/diary.repository.js
//
// Compatibility shim — all diary sub-services (murajah, tasmee, ikhtebar,
// jadeed, juzzHali) do:
//
//   const repo = require("../diary.repository");
//
// which resolves to THIS file. We simply re-export the real repository so
// those existing requires keep working without any changes to the services.
//
// New code should import the repository directly:
//   const diaryRepo = require("../../repositories/diary.repository");
// ---------------------------------------------------------------------------

module.exports = require("../../repositories/diary.repository");