// features/coach/parsers/tipParser.js
//
// NEW: Parse structured JSON tips from AI response
// OLD: Regex-based parsing (deprecated but kept as fallback)
//

import { API_BASE, authFetch } from "../coachConstants";

export async function parseTipsFromResponse(text, similarityPairs) {
  const savedTips = [];
  let cleanedText = text;

  // ── NEW: Parse JSON tips from [MUTASHABIHAT_TIPS]...[/MUTASHABIHAT_TIPS] ─────────
  const jsonTipRegex = /\[MUTASHABIHAT_TIPS\]([\s\S]*?)\[\/MUTASHABIHAT_TIPS\]/g;
  const jsonMatch = jsonTipRegex.exec(text);

  if (jsonMatch) {
    try {
      const tipsJson = JSON.parse(jsonMatch[1].trim());
      console.log("=== JSON TIPS DETECTED ===");
      console.log("Tips array:", tipsJson);

      if (Array.isArray(tipsJson)) {
        for (const tipData of tipsJson) {
          const { sourceSurah, sourceAyah, targetSurah, targetAyah, tip } = tipData;

          if (sourceSurah && sourceAyah && targetSurah && targetAyah && tip) {
            // Find the corresponding similarity pair to get the ID
            // Support bidirectional matching (A:B = B:A) and both snake_case/camelCase
            const pair = similarityPairs?.find((p) => {
              const pSourceSurah = Number(p.source_surah ?? p.sourceSurah);
              const pSourceAyah = Number(p.source_ayah ?? p.sourceAyah);
              const pTargetSurah = Number(p.target_surah ?? p.targetSurah);
              const pTargetAyah = Number(p.target_ayah ?? p.targetAyah);

              const tSourceSurah = Number(sourceSurah);
              const tSourceAyah = Number(sourceAyah);
              const tTargetSurah = Number(targetSurah);
              const tTargetAyah = Number(targetAyah);

              // Match in either direction (A:B = B:A)
              const forwardMatch =
                pSourceSurah === tSourceSurah &&
                pSourceAyah === tSourceAyah &&
                pTargetSurah === tTargetSurah &&
                pTargetAyah === tTargetAyah;

              const reverseMatch =
                pSourceSurah === tTargetSurah &&
                pSourceAyah === tTargetAyah &&
                pTargetSurah === tSourceSurah &&
                pTargetAyah === tSourceAyah;

              return forwardMatch || reverseMatch;
            });

            if (pair) {
              savedTips.push({
                similarityId: pair.id,
                sourceSurah,
                sourceAyah,
                targetSurah,
                targetAyah,
                existingTips: Array.isArray(pair.tips) ? pair.tips : [],
                tip,
              });
              console.log("Tip parsed for pair:", pair.id, tip);
            } else {
              console.warn("No matching pair found for tip:", tipData);
              console.table("Similarity Pairs:", similarityPairs);
              console.table("Tip Data:", [tipData]);
            }
          }
        }
      }

      // Remove the JSON block from the response text
      cleanedText = cleanedText.replace(jsonMatch[0], "");
      console.log("JSON tips parsed:", savedTips.length);
      console.log("========================");
    } catch (e) {
      console.error("Failed to parse JSON tips:", e);
      console.log("Falling back to regex-based parsing");
    }
  }

  // ── FALLBACK: Regex-based parsing (deprecated) ─────────────────────────────────
  if (savedTips.length === 0) {
    console.log("Using fallback regex-based tip parsing");

    // Format A: [TIP:id] ... [/TIP] blocks
    const tipBlockRegex = /\[TIP:(\d+)\]\s*([\s\S]*?)\[\/TIP\]/g;
    let match;
    while ((match = tipBlockRegex.exec(text)) !== null) {
      const similarityId = parseInt(match[1]);
      const tipText      = match[2].trim();
      const pair         = similarityPairs?.find((p) => p.id === similarityId);
      if (pair && tipText) {
        savedTips.push({
          similarityId,
          sourceSurah:  pair.source_surah ?? pair.sourceSurah,
          sourceAyah:   pair.source_ayah  ?? pair.sourceAyah,
          targetSurah:  pair.target_surah,
          targetAyah:   pair.target_ayah,
          existingTips: Array.isArray(pair.tips) ? pair.tips : [],
          tip: tipText,
        });
      }
      cleanedText = cleanedText.replace(match[0], `💡 *Tip saved for pair ${similarityId}*`);
    }

    // Format B: [TIP:id] without closing tag (single-line)
    if (savedTips.length === 0) {
      const singleTipRegex = /\[TIP:(\d+)\]\s*([^[]+?)(?=\[TIP:|$)/gs;
      let m2;
      while ((m2 = singleTipRegex.exec(text)) !== null) {
        const similarityId = parseInt(m2[1]);
        const tipText      = m2[2].trim();
        const pair         = similarityPairs?.find((p) => p.id === similarityId);
        if (pair && tipText) {
          savedTips.push({
            similarityId,
            sourceSurah:  pair.source_surah ?? pair.sourceSurah,
            sourceAyah:   pair.source_ayah  ?? pair.sourceAyah,
            targetSurah:  pair.target_surah,
            targetAyah:   pair.target_ayah,
            existingTips: Array.isArray(pair.tips) ? pair.tips : [],
            tip: tipText,
          });
        }
        cleanedText = cleanedText.replace(m2[0], `💡 *Tip saved for pair ${similarityId}*\n`);
      }
    }

    // Format C: PAIR1: tip text (fallback)
    if (savedTips.length === 0 && similarityPairs?.length > 0) {
      const pairLineRegex = /PAIR(\d+):\s*(.+?)(?=PAIR\d+:|$)/gs;
      let pm;
      while ((pm = pairLineRegex.exec(text)) !== null) {
        const idx  = parseInt(pm[1]) - 1;
        const tip  = pm[2].trim();
        const pair = similarityPairs[idx];
        if (pair && tip) {
          savedTips.push({
            similarityId: pair.id,
            sourceSurah:  pair.source_surah ?? pair.sourceSurah,
            sourceAyah:   pair.source_ayah  ?? pair.sourceAyah,
            targetSurah:  pair.target_surah,
            targetAyah:   pair.target_ayah,
            existingTips: Array.isArray(pair.tips) ? pair.tips : [],
            tip,
          });
        }
      }
      if (savedTips.length > 0) {
        cleanedText = text.replace(/PAIR\d+:\s*.+?(?=PAIR\d+:|$)/gs, "").trim();
        cleanedText += `\n\n✅ ${savedTips.length} tip(s) saved to the Mutashabihat page.`;
      }
    }
  }

  // ── Save tips to DB via authFetch ─────────────────────────────────────────────
  const navPairs = [];

  for (const saved of savedTips) {
    try {
      const newTips = [...saved.existingTips];
      if (!newTips.includes(saved.tip)) {
        newTips.push(saved.tip);
      }

      const json = await authFetch(
        `/similarity/by-pair/tips?ss=${saved.sourceSurah}&sa=${saved.sourceAyah}&ts=${saved.targetSurah}&ta=${saved.targetAyah}`,
        {
          method: "PATCH",
          body:   JSON.stringify({ tips: newTips }),
        }
      );

      if (!json.success) {
        console.error(`Failed to save tip for pair ${saved.similarityId}:`, json.message);
        continue;
      }

      navPairs.push({
        sourceSurah: saved.sourceSurah,
        sourceAyah:  saved.sourceAyah,
        targetSurah: saved.targetSurah,
        targetAyah:  saved.targetAyah,
        tip:         saved.tip,
      });
    } catch (e) {
      console.error("Failed to save tip:", e);
    }
  }

  return { cleanedText, navPairs, count: savedTips.length };
}