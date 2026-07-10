//C:\quran-similarity-app\backend\modules\ayah\ayah.routes.js
const express    = require("express");
const router     = express.Router();
const controller = require("./ayah.controller");

// ✅ IMPORTANT: Specific string routes MUST come FIRST, before parameterized routes!
// Otherwise /:surah will match /page/:page/full as if "page" is a surah number

// String-based routes (exact matches)
router.get("/juz-pages",      controller.getJuzPages);
router.get("/pages-in-range", controller.getPagesInRange);
router.get("/page-details",   controller.getPageDetails);
router.get("/surahs",         controller.getSurahs);
router.get("/context",        controller.getAyahContext);

// Full data routes (must come BEFORE single param routes)
router.get("/page/:page/full",    controller.getPageFull);      // ✅ BEFORE /:surah routes
router.get("/juz/:juz/full",      controller.getJuzFull);       // ✅ BEFORE /:surah routes
router.get("/:surah/full",        controller.getSurahFull);     // ✅ BEFORE /:surah/:ayah

// Parameterized routes (more specific first)
router.get("/:surah/first-words", controller.getFirstWords);
router.get("/:surah/ayahs",       controller.getAyahsBySurah);
router.get("/:surah/:ayah",       controller.getSingleAyah);    // ✅ LAST: More generic

module.exports = router;
