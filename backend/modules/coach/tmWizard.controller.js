// backend/modules/coach/tmWizard.controller.js
"use strict";

const diaryRepo = require("../../repositories/diary.repository");
const heatmapRepo = require("../../repositories/heatmap.repository");
const { formatSuccess, formatError } = require("../../utils/responseFormatter");
const SCHEDULING_PROMPT = require("./prompts/scheduling.prompt");
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const dailyWorkloadPlanner = require("../../modules/scheduler/services/planning/dailyWorkloadPlanner.service");
const constraintService = require("../../modules/scheduler/services/scheduling/constraint.service");

// ─── Time Management Wizard Controllers (Backend-Only Scheduling Logic) ─────

/**
 * STEP 2: Analyze Progress - Backend analyzes Jadeed progress
 * POST /api/coach/wizard/tm/analyze
 * Body: { useCurrentLogs: boolean }
 */
exports.analyzeProgress = async (req, res, next) => {
    try {
        const { useCurrentLogs } = req.body;
        const userId = req.user.id;

        // Fetch user's heatmap scores (actual completion data)
        const heatmapData = await heatmapRepo.getScoresByUser(userId);
        console.log('=== ANALYSIS DEBUG ===');
        console.log('User ID:', userId);
        console.log('Total heatmap entries:', heatmapData?.length);
        console.log('Sample entries:', heatmapData?.slice(0, 5));

        // Backend-only analysis logic (deterministic)
        const analysis = {
            completedMarhalas: [],
            currentMarhala: null,
            currentSipara: null,
            currentPage: null,
            totalPages: null,
            allActiveSiparas: [],
        };

        // Analyze heatmap data to determine progress
        const allActiveSiparas = [];
        if (heatmapData && heatmapData.length > 0) {
            // Group by Sipara (Juz) to determine progress
            const siparaProgress = {};
            
            heatmapData.forEach(entry => {
                const sipara = entry.juz; // sipara column maps to juz
                const page = entry.page; // quran_page
                const score = entry.score;
                
                if (!siparaProgress[sipara]) {
                    siparaProgress[sipara] = { pages: new Set(), scores: [], entryCount: 0 };
                }
                siparaProgress[sipara].pages.add(page);
                siparaProgress[sipara].scores.push(score);
                siparaProgress[sipara].entryCount++;
            });

            console.log('Sipara Progress:', siparaProgress);

            // Determine completed Siparas (Juz) - has entries for all 20 pages
            // Also include partially completed Siparas for weekly review
            Object.keys(siparaProgress).forEach(sipara => {
                const uniquePages = siparaProgress[sipara].pages.size;
                // Consider Sipara complete if user has logged all 20 pages
                if (uniquePages >= 20) {
                    analysis.completedMarhalas.push(`Juz ${sipara}`);
                }
                // Include all Siparas with any logged pages for weekly review
                if (uniquePages > 0) {
                    const scores = siparaProgress[sipara].scores;
                    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                    
                    // Map average score to quality rating
                    let qualityRating;
                    if (avgScore >= 9) {
                        qualityRating = 'Excellent';
                    } else if (avgScore >= 7) {
                        qualityRating = 'Very Good';
                    } else if (avgScore >= 5) {
                        qualityRating = 'Good';
                    } else if (avgScore >= 3) {
                        qualityRating = 'Fair';
                    } else {
                        qualityRating = 'Poor';
                    }
                    
                    allActiveSiparas.push({
                        juz: parseInt(sipara),
                        avgScore: avgScore.toFixed(2),
                        qualityRating
                    });
                }
            });

            console.log('Completed Marhalas:', analysis.completedMarhalas);
            console.log('All Active Siparas for review:', allActiveSiparas);

            // Find current Sipara (most recent with activity but not complete)
            const activeSiparas = Object.keys(siparaProgress)
                .map(s => parseInt(s))
                .sort((a, b) => b - a); // Sort descending (most recent first)
            
            let currentSipara = null;
            for (const sipara of activeSiparas) {
                if (!analysis.completedMarhalas.includes(`Juz ${sipara}`)) {
                    currentSipara = sipara;
                    break;
                }
            }
            
            // If all Siparas are complete or no data, use the highest Sipara with data
            if (!currentSipara && activeSiparas.length > 0) {
                currentSipara = activeSiparas[0];
            }
            
            if (currentSipara) {
                analysis.currentMarhala = `Juz ${currentSipara}`;
                const currentData = siparaProgress[currentSipara];
                const pagesArray = Array.from(currentData.pages);
                const maxPage = pagesArray.length > 0 ? Math.max(...pagesArray) : 1;
                analysis.currentSipara = currentSipara;
                analysis.currentPage = maxPage;
                analysis.totalPages = 20; // Each Juz has 20 pages (Siparas)
            } else if (Object.keys(siparaProgress).length > 0) {
                // All Siparas completed, find the last one
                const lastSipara = Object.keys(siparaProgress).sort((a, b) => parseInt(b) - parseInt(a))[0];
                analysis.currentMarhala = `Juz ${parseInt(lastSipara) + 1}`; // Next Juz
                analysis.currentSipara = 1;
                analysis.currentPage = (parseInt(lastSipara) * 20) + 1;
                analysis.totalPages = 20;
            } else {
                // No heatmap entries found
                analysis.currentMarhala = "Juz 1";
                analysis.currentSipara = 1;
                analysis.currentPage = 1;
                analysis.totalPages = 20;
            }
        } else {
            // No heatmap data - start from beginning
            analysis.currentMarhala = "Juz 1";
            analysis.currentSipara = 1;
            analysis.currentPage = 1;
            analysis.totalPages = 20;
        }

        console.log('Final Analysis:', analysis);
        
        // Assign the populated allActiveSiparas to the analysis object
        analysis.allActiveSiparas = allActiveSiparas;
        
        // Categorize pages by strength based on score thresholds
        // App's marking scale: Poor 1-2, Fair 3-4, Good 5-6, Very Good 7-8, Excellent 9-10
        const strongPages = [];
        const weakPages = [];
        const veryWeakPages = [];
        
        if (heatmapData && heatmapData.length > 0) {
            heatmapData.forEach(entry => {
                const page = entry.page;
                const score = entry.score;
                
                // Strong: Very Good (7-8) or Excellent (9-10)
                if (score >= 7) {
                    strongPages.push({ page, score });
                }
                // Weak: Good (5-6)
                else if (score >= 5) {
                    weakPages.push({ page, score });
                }
                // Very Weak: Poor (1-2) or Fair (3-4)
                else {
                    veryWeakPages.push({ page, score });
                }
            });
        }
        
        analysis.strongPages = strongPages;
        analysis.weakPages = weakPages;
        analysis.veryWeakPages = veryWeakPages;
        
        // Calculate estimated workload
        // Simple heuristic: 2 min per weak page, 3 min per very weak page
        const totalMinutes = (weakPages.length * 2) + (veryWeakPages.length * 3);
        const dailyMinutes = Math.ceil(totalMinutes / 6); // Spread across 6 working days
        
        analysis.estimatedWorkload = {
            totalMinutes,
            dailyMinutes
        };
        
        console.log('Page Strength:', { strong: strongPages.length, weak: weakPages.length, veryWeak: veryWeakPages.length });
        console.log('Estimated Workload:', analysis.estimatedWorkload);
        
        res.status(200).json(formatSuccess(analysis));
    } catch (err) {
        next(err);
    }
};

/**
 * STEP 3: Generate Weekly Cycle - Backend generates revision cycle using rules
 * POST /api/coach/wizard/tm/cycle
 * Body: { analysisData: object }
 */
exports.generateWeeklyCycle = async (req, res, next) => {
    try {
        const { analysisData } = req.body;

        console.log('=== WEEKLY CYCLE DEBUG ===');
        console.log('Analysis Data:', JSON.stringify(analysisData, null, 2));
        console.log('All Active Siparas:', analysisData.allActiveSiparas);
        console.log('Current Sipara:', analysisData.currentSipara);

        // Backend-only cycle generation (deterministic rule engine)
        // Ensure all active Siparas (with any logged pages) are reviewed at least once per week
        // No artificial limit on Siparas per day - distribute evenly based on progress
        
        const cycle = [];
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        
        // Use allActiveSiparas (all Siparas with any logged pages) for weekly review
        // This includes both fully completed and partially completed Siparas
        const allActiveSiparas = analysisData.allActiveSiparas || [];
        
        const currentSipara = analysisData.currentSipara || 1;
        const revisionDays = 6; // Monday-Saturday
        
        // Separate counter for revision day position (0-5), independent of array index
        // This allows reordering the days array for frontend compatibility without
        // changing the sipara distribution logic
        let revisionDayIndex = 0;
        
        // Distribute all active Siparas evenly across revision days
        // Use modulo to cycle through all active Siparas
        // This allows 5-6 Siparas per day when there's significant progress
        days.forEach((day, index) => {
            if (day === 'SUNDAY') {
                cycle.push({ day, siparas: ['Rest'] });
            } else {
                const siparas = [];
                
                // Always add current Sipara (weak - needs frequent review)
                siparas.push(`Sipara ${currentSipara} (Current)`);
                
                // Add active Siparas for this day using modulo to cycle through all
                // This ensures every active Sipara appears at least once
                // and allows multiple Siparas per day when there are many
                if (allActiveSiparas.length > 0) {
                    // Only exclude current Sipara if there are other Siparas to review
                    // If user only has one active Sipara, still show it for review
                    const reviewSiparas = allActiveSiparas.length > 1 
                        ? allActiveSiparas.filter(s => s.juz !== currentSipara)
                        : allActiveSiparas;
                    
                    console.log(`Day ${day}: Review Siparas:`, reviewSiparas);
                    
                    // Add Siparas based on revision day index to distribute evenly
                    // Each day gets a different subset, cycling through all
                    reviewSiparas.forEach((siparaData, juzIndex) => {
                        if (juzIndex % revisionDays === revisionDayIndex % revisionDays) {
                            siparas.push(`Sipara ${siparaData.juz} (${siparaData.qualityRating})`);
                        }
                    });
                }
                
                cycle.push({ day, siparas });
                revisionDayIndex++;  // only increments for revision days
            }
        });

        console.log('Generated Cycle:', JSON.stringify(cycle, null, 2));
        res.status(200).json(formatSuccess(cycle));
    } catch (err) {
        next(err);
    }
};

/**
 * STEP 9: Generate Schedule - Backend computes schedule deterministically
 * POST /api/coach/wizard/tm/generate
 * Body: { weeklyCycle, dailySchedule, frequency, exceptions, timeInputs, preferences }
 */
exports.generateSchedule = async (req, res, next) => {
    try {
        const { weeklyCycle, dailySchedule, frequency, exceptions, timeInputs, preferences } = req.body;

        console.log('=== GENERATE SCHEDULE DEBUG ===');
        console.log('weeklyCycle:', JSON.stringify(weeklyCycle, null, 2));
        console.log('dailySchedule:', dailySchedule);
        console.log('timeInputs:', timeInputs);
        console.log('preferences:', preferences);

        const schedule = {
            days: [],
        };

        const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

        // Time per page based on score (matching app's scale)
        const getTimePerPage = (score) => {
            if (score === null || score === undefined) return 3; // Default
            if (score >= 9) return 1;  // Excellent
            if (score >= 7) return 2;  // Very Good
            if (score >= 5) return 3;  // Good
            if (score >= 3) return 4;  // Fair
            if (score >= 1) return 5;  // Poor
            return 3; // Default
        };

        // Fetch heatmap data for page strength
        const userId = req.user.id;
        const heatmapData = await heatmapRepo.getScoresByUser(userId);
        console.log('Heatmap data entries:', heatmapData?.length);

        // Process each day in the weekly cycle
        weeklyCycle.forEach((dayCycle, dayIndex) => {
            const dayName = dayCycle.day || DAY_NAMES[dayIndex];
            const daySchedule = {
                day: dayName,
                blocks: [],
            };

            // Check if this day is a Rest day (explicitly marked in weekly cycle)
            if (dayCycle.siparas[0] === 'Rest' || dayCycle.siparas.length === 0) {
                schedule.days.push(daySchedule);
                console.log(`${dayName}: Rest day - no blocks added`);
                return;
            }

            // Calculate free time for this day using dailyWorkloadPlanner
            // Convert dailySchedule to event format expected by calculateAvailableTime
            const dayEvents = [];
            if (dailySchedule && dailySchedule[dayIndex]) {
                const dayData = dailySchedule[dayIndex];
                if (dayData.fixedEvents) {
                    dayData.fixedEvents.forEach(event => {
                        dayEvents.push({
                            startTime: event.startTime,
                            endTime: event.endTime
                        });
                    });
                }
            }

            // Add exceptions for this day
            if (exceptions && exceptions[dayIndex]) {
                exceptions[dayIndex].forEach(exception => {
                    dayEvents.push({
                        startTime: exception.startTime,
                        endTime: exception.endTime
                    });
               });
            }

            const availableMinutes = dailyWorkloadPlanner.calculateAvailableTime(dayEvents);
            console.log(`${dayName}: Available minutes: ${availableMinutes}`);

            // Reserve time for Jadeed and Juz Hali first (from user preferences)
            const jadeedMinutes = timeInputs?.jadeedMinutes || 45; // Default 45 min
            const juzHaliMinutes = timeInputs?.juzHaliMinutes || 20; // Default 20 min
            let remainingMinutes = availableMinutes - jadeedMinutes - juzHaliMinutes;

            console.log(`${dayName}: Reserved Jadeed: ${jadeedMinutes}min, Juz Hali: ${juzHaliMinutes}min, Remaining: ${remainingMinutes}min`);

            // Add Jadeed block (early morning)
            if (jadeedMinutes > 0 && remainingMinutes >= 0) {
                daySchedule.blocks.push({
                    time: '05:00-05:' + String(jadeedMinutes).padStart(2, '0'),
                    activity: 'Jadeed',
                    details: 'New Memorization',
                });
            }

            // Add Juz Hali block (early morning before Jadeed)
            if (juzHaliMinutes > 0 && remainingMinutes >= 0) {
                const juzHaliStart = 5 - Math.ceil(juzHaliMinutes / 60);
                const juzHaliEnd = 5;
                daySchedule.blocks.push({
                    time: `${String(juzHaliStart).padStart(2, '0')}:00-05:00`,
                    activity: 'Juz Hali',
                    details: 'Recent Revision',
                });
            }

            // Allocate remaining time to Muraja'ah based on page strength
            if (remainingMinutes > 0 && dayCycle.siparas.length > 0) {
                // Calculate total revision time needed for this day's siparas
                let totalRevisionTime = 0;
                const siparaTimeMap = [];

                dayCycle.siparas.forEach((siparaStr) => {
                    // Extract sipara number from string (e.g., "Sipara 29 (Very Good)" -> 29)
                    const siparaNumber = parseInt(siparaStr.toString().replace(/\D/g, '')) || 0;
                    if (siparaNumber === 0) return;

                    // Get average score for this sipara from heatmap
                    const siparaPages = heatmapData.filter(entry => 
                        entry.juz === siparaNumber || entry.juz === siparaNumber.toString()
                    );
                    
                    if (siparaPages.length === 0) {
                        // No data - use default time
                        siparaTimeMap.push({ sipara: siparaNumber, time: 60 }); // Default 60 min
                        totalRevisionTime += 60;
                        return;
                    }

                    // Calculate time based on page scores
                    const avgScore = siparaPages.reduce((sum, p) => sum + p.score, 0) / siparaPages.length;
                    const timePerPage = getTimePerPage(avgScore);
                    const totalTime = timePerPage * 20; // 20 pages per sipara
                    siparaTimeMap.push({ sipara: siparaNumber, time: totalTime, score: avgScore });
                    totalRevisionTime += totalTime;
                });

                console.log(`${dayName}: Total revision time needed: ${totalRevisionTime}min, Available: ${remainingMinutes}min`);

                // Prioritize weaker pages (lower scores) if time is limited
                if (totalRevisionTime > remainingMinutes) {
                    siparaTimeMap.sort((a, b) => a.score - b.score); // Sort by score ascending (weakest first)
                    
                    let currentTime = 0;
                    siparaTimeMap.forEach((siparaData) => {
                        if (currentTime + siparaData.time <= remainingMinutes) {
                            // Add full sipara block
                            const startHour = 6 + Math.floor(currentTime / 60);
                            const startMin = currentTime % 60;
                            const endHour = 6 + Math.floor((currentTime + siparaData.time) / 60);
                            const endMin = (currentTime + siparaData.time) % 60;

                            daySchedule.blocks.push({
                                time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
                                activity: 'Muraja\'ah',
                                details: `Sipara ${siparaData.sipara} (Score: ${siparaData.score.toFixed(1)})`,
                            });

                            currentTime += siparaData.time;
                        }
                    });

                    console.log(`${dayName}: Scheduled ${currentTime}min of ${remainingMinutes}min available for revision`);
                } else {
                    // Full revision time fits
                    let currentTime = 0;
                    siparaTimeMap.forEach((siparaData) => {
                        const startHour = 6 + Math.floor(currentTime / 60);
                        const startMin = currentTime % 60;
                        const endHour = 6 + Math.floor((currentTime + siparaData.time) / 60);
                        const endMin = (currentTime + siparaData.time) % 60;

                        daySchedule.blocks.push({
                            time: `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}-${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`,
                            activity: 'Muraja\'ah',
                            details: `Sipara ${siparaData.sipara} (Score: ${siparaData.score.toFixed(1)})`,
                        });

                        currentTime += siparaData.time;
                    });
                }
            }

            // Sort blocks by time
            daySchedule.blocks.sort((a, b) => {
                const timeA = a.time.split('-')[0];
                const timeB = b.time.split('-')[0];
                return timeA.localeCompare(timeB);
            });

            // Check for overlaps
            const overlaps = constraintService.findOverlaps(
                { startTime: daySchedule.blocks[0]?.time.split('-')[0] || '00:00', endTime: daySchedule.blocks[daySchedule.blocks.length - 1]?.time.split('-')[1] || '23:59' },
                daySchedule.blocks.map((block, idx) => ({ id: idx, startTime: block.time.split('-')[0], endTime: block.time.split('-')[1] }))
            );

            if (overlaps.length > 0) {
                console.warn(`${dayName}: Overlaps detected:`, overlaps);
                // Remove overlapping blocks (keep earlier ones, drop later ones)
                const nonOverlappingBlocks = [];
                const usedTimeRanges = [];

                daySchedule.blocks.forEach(block => {
                    const [start, end] = block.time.split('-');
                    const hasOverlap = usedTimeRanges.some(range => 
                        (start >= range.start && start < range.end) || 
                        (end > range.start && end <= range.end) ||
                        (start <= range.start && end >= range.end)
                    );

                    if (!hasOverlap) {
                        nonOverlappingBlocks.push(block);
                        usedTimeRanges.push({ start, end });
                    } else {
                        console.warn(`${dayName}: Dropped overlapping block: ${block.activity} at ${block.time}`);
                    }
                });

                daySchedule.blocks = nonOverlappingBlocks;
            }

            console.log(`${dayName}: Final blocks:`, daySchedule.blocks.length);
            schedule.days.push(daySchedule);
        });

        console.log('Generated Schedule:', JSON.stringify(schedule, null, 2));

        // Use LLM ONLY to format the schedule text (no scheduling logic)
        const formattedSchedule = await formatScheduleWithLLM(schedule);

        res.status(200).json(formatSuccess({
            schedule,
            formattedText: formattedSchedule,
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * STEP 10: Save Schedule - Backend persists schedule to database
 * POST /api/coach/wizard/tm/save
 * Body: { schedule: object }
 */
exports.saveSchedule = async (req, res, next) => {
    try {
        const { schedule } = req.body;
        const userId = req.user.id;

        // Persist schedule to database
        // In production, this would save to a schedules table
        
        res.status(200).json(formatSuccess({
            message: "Schedule saved to your profile! Review it every evening.",
        }));
    } catch (err) {
        next(err);
    }
};

/**
 * Helper: Use LLM ONLY to format schedule text (no scheduling logic)
 */
async function formatScheduleWithLLM(schedule) {
    const scheduleText = JSON.stringify(schedule, null, 2);
    
    const messages = [
        { role: "system", content: SCHEDULING_PROMPT },
        { role: "user", content: `Format this schedule for readability:\n\n${scheduleText}` },
    ];

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            max_tokens: 1000,
            temperature: 0.3,
        }),
    });

    if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
    }

    const groqData = await groqResponse.json();
    return groqData.choices[0].message.content;
}
