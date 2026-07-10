# Time Management Module Redesign
## Revision Unit-Based Intelligent Scheduling Architecture

---

## Core Philosophy

**The timetable is only the final output.**

The primary objective is:

> Maximize Quran retention and improvement using the user's available time.

The scheduler should never think:

> "What activity fits this slot?"

Instead it should think:

> "Which Quran pages will benefit the most from this slot?"

---

## New Pipeline

```
Heatmap Scores
        ↓
Progress Analysis (EXISTING - DO NOT CHANGE)
        ↓
Weekly Cycle Analysis (EXISTING - DO NOT CHANGE)
        ↓
Quality Analysis
        ↓
Page Analysis
        ↓
Revision Unit Generator
        ↓
Priority Engine
        ↓
Time Estimation Engine
        ↓
Daily Workload Planner
        ↓
Timeline Scheduler
        ↓
Final Timetable
```

The scheduler becomes only one component of the system.

---

## Work Types

The system handles three distinct types of Quran work:

1. **Muraja'ah** - Revision of previously memorized pages
2. **Juz Hali** - Current Juz consolidation
3. **Jadeed** - New memorization

Each work type has its own analysis pipeline and Revision Unit generation rules.

---

## 1. Proposed Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Event Builder   │  │  Goal Configurer │  │  Schedule    │ │
│  │  (Calendar UI)   │  │  (Work Targets)  │  │  Viewer      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
│           │                     │                   │          │
│           └─────────────────────┴───────────────────┘          │
│                              │                                 │
│                    ┌──────────▼──────────┐                     │
│                    │  Revision Unit UI  │                     │
│                    │  (Page-level view) │                     │
│                    └──────────┬──────────┘                     │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │      REST API         │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────┐
│                    Backend    │                                 │
│           ┌──────────────────▼──────────────────┐              │
│           │       Analysis Layer (EXISTING)    │              │
│           │  - Progress Analysis                │              │
│           │  - Weekly Cycle Analysis            │              │
│           └──────────────────┬──────────────────┘              │
│                              │                                   │
│           ┌──────────────────▼──────────────────┐              │
│           │       Intelligence Layer           │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Quality Analysis Service      │  │              │
│           │  │  - Page quality assessment   │  │              │
│           │  │  - Mistake pattern analysis  │  │              │
│           │  │  - Revision method selection │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Page Analysis Service       │  │              │
│           │  │  - Historical tracking       │  │              │
│           │  │  - Consecutive weak pages    │  │              │
│           │  │  - Days since revision       │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Revision Unit Generator     │  │              │
│           │  │  - Muraja'ah units           │  │              │
│           │  │  - Juz Hali units            │  │              │
│           │  │  - Jadeed units              │  │              │
│           │  │  - Adaptive grouping         │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Priority Engine             │  │              │
│           │  │  - Multi-factor scoring      │  │              │
│           │  │  - Quality integration         │  │              │
│           │  │  - Goal alignment           │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Time Estimation Engine     │  │              │
│           │  │  - Dynamic time calculation  │  │              │
│           │  │  - Historical data          │  │              │
│           │  │  - Quality profile            │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Daily Workload Planner      │  │              │
│           │  │  - Availability calculation  │  │              │
│           │  │  - Unit ranking             │  │              │
│           │  │  - Workload distribution   │  │              │
│           │  └──────────────────────────────┘  │              │
│           └──────────────────┬──────────────────┘              │
│                              │                                   │
│           ┌──────────────────▼──────────────────┐              │
│           │       Scheduling Layer             │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Timeline Scheduler          │  │              │
│           │  │  - Build timeline            │  │              │
│           │  │  - Insert fixed events       │  │              │
│           │  │  - Detect gaps               │  │              │
│           │  │  - Schedule revision units   │  │              │
│           │  │  - Adaptive splitting         │  │              │
│           │  └──────────────────────────────┘  │              │
│           │  ┌──────────────────────────────┐  │              │
│           │  │  Constraint Engine           │  │              │
│           │  │  - Validate schedules        │  │              │
│           │  │  - Check conflicts          │  │              │
│           │  └──────────────────────────────┘  │              │
│           └──────────────────┬──────────────────┘              │
│                              │                                   │
│           ┌──────────────────▼──────────────────┐              │
│           │       Data Layer                   │              │
│           │  - Revision Unit Repository         │              │
│           │  - Page Analysis Repository         │              │
│           │  - Event Repository                │              │
│           │  - Schedule Repository             │              │
│           └─────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Quran-First**: All scheduling decisions prioritize Quran retention and improvement
2. **Page-Level Granularity**: Scheduler works with individual pages, not generic activities
3. **Intelligence Before Scheduling**: Analysis and planning happen before timeline construction
4. **Adaptive**: Revision units split based on available time
5. **Deterministic**: All decisions are algorithmic, no LLM involvement in scheduling
6. **Quality-Driven**: Priority and revision methods come from quality analysis
7. **Workload-Aware**: Planner respects user availability and commitments
8. **Future-Proof**: Scheduler is decoupled from Hifz intelligence

---

## 2. Folder Structure

### Backend Structure

```
backend/
├── modules/
│   ├── coach/
│   │   └── tmWizard.controller.js (EXISTING - DO NOT CHANGE)
│   └── scheduler/
│       ├── controllers/
│       │   ├── event.controller.js          # CRUD for events
│       │   ├── revisionUnit.controller.js   # CRUD for revision units
│       │   ├── pageAnalysis.controller.js   # CRUD for page analysis
│       │   ├── schedule.controller.js      # Generate/retrieve schedules
│       │   └── workload.controller.js      # Daily workload planning
│       ├── services/
│       │   ├── intelligence/
│       │   │   ├── qualityAnalysis.service.js      # Quality assessment
│       │   │   ├── pageAnalysis.service.js        # Historical page tracking
│       │   │   ├── revisionUnitGenerator.service.js # Generate units for all work types
│       │   │   │   ├── murajaahGenerator.js       # Muraja'ah unit generation
│       │   │   │   ├── juzHaliGenerator.js        # Juz Hali unit generation
│       │   │   │   └── jadeedGenerator.js         # Jadeed unit generation
│       │   │   ├── priorityEngine.service.js      # Multi-factor priority scoring
│       │   │   └── timeEstimation.service.js      # Dynamic time calculation
│       │   ├── planning/
│       │   │   ├── dailyWorkloadPlanner.service.js # Workload distribution
│       │   │   └── weeklyStrategy.service.js       # Weekly weighting
│       │   └── scheduling/
│       │       ├── timeline.service.js             # Build timeline, detect gaps
│       │       ├── unitScheduler.service.js        # Schedule revision units
│       │       ├── adaptiveSplitter.service.js     # Split units based on gaps
│       │       └── constraint.service.js           # Validate schedules
│       ├── repositories/
│       │   ├── event.repository.js
│       │   ├── revisionUnit.repository.js
│       │   ├── pageAnalysis.repository.js
│       │   └── schedule.repository.js
│       ├── models/
│       │   ├── Event.js
│       │   ├── RevisionUnit.js
│       │   ├── PageAnalysis.js
│       │   └── Schedule.js
│       ├── engines/
│       │   ├── timeline.engine.js           # Core timeline operations
│       │   ├── gapDetection.engine.js       # Find available slots
│       │   ├── unitMatching.engine.js       # Match units to gaps
│       │   └── splitting.engine.js          # Adaptive unit splitting
│       ├── utils/
│       │   ├── timeUtils.js                 # Time parsing, validation
│       │   ├── dayOfWeekUtils.js            # Day operations
│       │   └── durationUtils.js             # Duration calculations
│       ├── validators/
│       │   ├── event.validator.js
│       │   ├── revisionUnit.validator.js
│       │   └── schedule.validator.js
│       ├── routes/
│       │   ├── event.routes.js
│       │   ├── revisionUnit.routes.js
│       │   ├── pageAnalysis.routes.js
│       │   ├── schedule.routes.js
│       │   └── workload.routes.js
│       └── constants/
│           ├── workTypes.js                 # Muraja'ah, Juz Hali, Jadeed
│           ├── revisionMethods.js           # Quality revision methods
│           ├── qualityRatings.js            # Poor to Excellent
│           └── schedulingRules.js           # Default scheduling rules
```

### Frontend Structure

```
frontend/src/
├── features/
│   └── scheduler/
│       ├── pages/
│       │   ├── SchedulerPage.jsx            # Main scheduler page
│       │   ├── EventBuilderPage.jsx         # Event creation UI
│       │   ├── RevisionUnitsPage.jsx        # Page-level revision view
│       │   └── ScheduleViewPage.jsx         # Schedule viewer
│       ├── components/
│       │   ├── EventBuilder/
│       │   │   ├── EventForm.jsx            # Single event form
│       │   │   ├── RecurringEventForm.jsx   # Recurring event form
│       │   │   ├── EventList.jsx            # List of events
│       │   │   ├── EventCalendar.jsx        # Calendar view
│       │   │   └── DayCopyModal.jsx         # Copy day to other days
│       │   ├── RevisionUnits/
│       │   │   ├── UnitList.jsx             # List of revision units
│       │   │   ├── UnitCard.jsx             # Individual unit display
│       │   │   ├── UnitFilter.jsx           # Filter by work type/priority
│       │   │   ├── PageDetailView.jsx       # Detailed page analysis view
│       │   │   └── UnitSplitPreview.jsx     # Preview adaptive splitting
│       │   ├── ScheduleView/
│       │   │   ├── WeeklyTimeline.jsx       # Weekly timeline view
│       │   │   ├── DailyTimeline.jsx        # Daily timeline view
│       │   │   ├── ScheduleCard.jsx         # Individual schedule item
│       │   │   ├── GapIndicator.jsx         # Show unused gaps
│       │   │   └── ScheduleStats.jsx        # Schedule statistics
│       │   └── shared/
│       │       ├── TimePicker.jsx            # Time input component
│       │       ├── DaySelector.jsx           # Day of week selector
│       │       ├── WorkTypePicker.jsx        # Muraja'ah/Juz Hali/Jadeed picker
│       │       └── PriorityBadge.jsx         # Priority display
│       ├── hooks/
│       │   ├── useEvents.js                 # Event CRUD
│       │   ├── useRevisionUnits.js          # Revision unit CRUD
│       │   ├── usePageAnalysis.js           # Page analysis data
│       │   ├── useSchedule.js               # Schedule generation/retrieval
│       │   └── useWorkload.js               # Daily workload planning
│       ├── services/
│       │   └── schedulerApi.js              # API client
│       ├── utils/
│       │   ├── scheduleUtils.js              # Schedule formatting
│       │   ├── timeUtils.js                 # Time utilities
│       │   └── unitUtils.js                 # Revision unit utilities
│       └── constants/
│           ├── workTypes.js                 # Work type definitions
│           ├── revisionMethods.js           # Quality revision methods
│           └── qualityRatings.js            # Quality ratings
```

---

## 3. Data Models

### Event Model

```javascript
{
  id: string,
  userId: string,
  title: string,
  category: 'sleep' | 'prayer' | 'meal' | 'commute' | 'school' | 'university' | 
           'work' | 'homework' | 'exercise' | 'family' | 'house_chores' | 
           'shopping' | 'appointment' | 'quran_class' | 'study' | 'leisure' | 'custom',
  
  // Time configuration
  startTime: string,        // "HH:mm" format
  endTime: string,          // "HH:mm" format
  duration: number,         // Duration in minutes (calculated)
  
  // Recurrence
  daysOfWeek: number[],     // [0-6] where 0=Sunday, 6=Saturday
  recurrence: 'none' | 'daily' | 'weekdays' | 'weekends' | 'custom',
  
  // Properties
  isFixed: boolean,         // Cannot be moved by scheduler
  priority: 'low' | 'medium' | 'high',
  location: string | null,
  notes: string | null,
  
  // Metadata
  createdAt: timestamp,
  updatedAt: timestamp,
  isActive: boolean
}
```

### Revision Unit Model

```javascript
{
  id: string,
  userId: string,
  
  // Work type
  workType: 'murajaah' | 'juz_hali' | 'jadeed',
  
  // Page information
  sipara: number,           // Juz number (1-30)
  pages: number[],          // Page numbers in this unit
  pageRange: string,        // Human-readable range "14-18"
  
  // Quality analysis
  quality: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent',
  qualityScore: number,       // 1-10
  revisionMethod: string,   // Quality-determined method
  revisionSteps: string[], // Specific steps for this unit
  
  // Time estimation
  estimatedTime: number,   // Minutes (dynamically calculated)
  minTime: number,         // Minimum required minutes
  maxTime: number,         // Maximum allowed minutes
  
  // Priority
  priority: number,        // Numerical priority (higher = more important)
  priorityFactors: {
    qualityScore: number,
    consecutiveWeak: number,
    daysSinceRevision: number,
    currentSipara: number,
    weeklyCycle: number,
    historicalCompletion: number,
    userGoals: number
  },
  
  // Scheduling properties
  isSplittable: boolean,    // Can be split across multiple time slots
  isScheduled: boolean,    // Has been assigned to a time slot
  scheduledSlots: [        // If split, multiple slots
    {
      startTime: string,
      endTime: string,
      pages: number[]
    }
  ],
  
  // Dependencies
  requiresUnits: string[],  // Other units that must be completed first
  conflictsWith: string[],  // Units that cannot be scheduled adjacent
  
  // Metadata
  generatedAt: timestamp,
  scheduledAt: timestamp | null,
  completedAt: timestamp | null,
  isActive: boolean
}
```

### Page Analysis Model

```javascript
{
  id: string,
  userId: string,
  
  // Page identification
  sipara: number,
  page: number,
  
  // Quality data
  quality: 'poor' | 'fair' | 'good' | 'very_good' | 'excellent',
  qualityScore: number,
  mistakePattern: string[],
  weaknessAreas: string[],
  
  // Historical data
  lastRevisionDate: timestamp | null,
  daysSinceRevision: number,
  revisionCount: number,
  averageScore: number,
  scoreTrend: 'improving' | 'stable' | 'declining',
  
  // Consecutive analysis
  consecutiveWeakPages: number,  // Count of consecutive weak pages
  consecutiveGoodPages: number,  // Count of consecutive good pages
  
  // Time estimation factors
  baseTimeEstimate: number,     // Base minutes for this page
  timeAdjustment: number,       // Adjustment based on factors
  finalTimeEstimate: number,    // Final estimated minutes
  
  // Metadata
  analyzedAt: timestamp,
  updatedAt: timestamp
}
```

### Schedule Model

```javascript
{
  id: string,
  userId: string,
  weekStart: date,         // Start date of the week
  
  // Generated schedule
  schedule: {
    [dayOfWeek]: {         // 0-6
      events: [
        {
          eventId: string | null,  // Reference to event if fixed
          revisionUnitId: string | null, // Reference to revision unit if scheduled
          title: string,
          startTime: string,       // "HH:mm"
          endTime: string,         // "HH:mm"
          duration: number,
          workType: string | null, // murajaah, juz_hali, jadeed
          isFixed: boolean,
          isScheduled: boolean,
          priority: number,
          pages: number[] | null   // Pages if revision unit
        }
      ],
      gaps: [
        {
          startTime: string,
          endTime: string,
          duration: number,
          score: number            // Gap quality score
        }
      ],
      stats: {
        totalScheduledMinutes: number,
        totalFreeMinutes: number,
        murajaahUnits: number,
        juzHaliUnits: number,
        jadeedUnits: number,
        totalPagesCovered: number
      }
    }
  },
  
  // Generation metadata
  generatedAt: timestamp,
  algorithmVersion: string,
  weeklyWorkload: {
    [dayOfWeek]: number      // Percentage of full workload
  },
  conflicts: [],
  warnings: []
}
```

---

## 4. Database Schema

```sql
-- Events Table
CREATE TABLE scheduler_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    days_of_week TEXT NOT NULL, -- JSON array: [0,1,2,3,4,5,6]
    recurrence TEXT NOT NULL DEFAULT 'none',
    is_fixed INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    location TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_scheduler_events_user ON scheduler_events(user_id);
CREATE INDEX idx_scheduler_events_active ON scheduler_events(user_id, is_active);

-- Revision Units Table
CREATE TABLE scheduler_revision_units (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    work_type TEXT NOT NULL, -- 'murajaah', 'juz_hali', 'jadeed'
    sipara INTEGER NOT NULL,
    pages TEXT NOT NULL, -- JSON array: [14, 15, 16, 17, 18]
    page_range TEXT, -- "14-18"
    
    -- Quality analysis
    quality TEXT NOT NULL, -- 'poor', 'fair', 'good', 'very_good', 'excellent'
    quality_score REAL NOT NULL,
    revision_method TEXT,
    revision_steps TEXT, -- JSON array
    
    -- Time estimation
    estimated_time INTEGER NOT NULL,
    min_time INTEGER NOT NULL,
    max_time INTEGER NOT NULL,
    
    -- Priority
    priority REAL NOT NULL,
    priority_factors TEXT, -- JSON object with factor scores
    
    -- Scheduling properties
    is_splittable INTEGER NOT NULL DEFAULT 1,
    is_scheduled INTEGER NOT NULL DEFAULT 0,
    scheduled_slots TEXT, -- JSON array of scheduled slots
    
    -- Dependencies
    requires_units TEXT, -- JSON array
    conflicts_with TEXT, -- JSON array
    
    -- Metadata
    generated_at INTEGER NOT NULL,
    scheduled_at INTEGER,
    completed_at INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_revision_units_user ON scheduler_revision_units(user_id);
CREATE INDEX idx_revision_units_work_type ON scheduler_revision_units(user_id, work_type);
CREATE INDEX idx_revision_units_scheduled ON scheduler_revision_units(user_id, is_scheduled);
CREATE INDEX idx_revision_units_priority ON scheduler_revision_units(user_id, priority);

-- Page Analysis Table
CREATE TABLE scheduler_page_analysis (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    sipara INTEGER NOT NULL,
    page INTEGER NOT NULL,
    
    -- Quality data
    quality TEXT NOT NULL,
    quality_score REAL NOT NULL,
    mistake_pattern TEXT, -- JSON array
    weakness_areas TEXT, -- JSON array
    
    -- Historical data
    last_revision_date INTEGER,
    days_since_revision INTEGER,
    revision_count INTEGER DEFAULT 0,
    average_score REAL,
    score_trend TEXT, -- 'improving', 'stable', 'declining'
    
    -- Consecutive analysis
    consecutive_weak_pages INTEGER DEFAULT 0,
    consecutive_good_pages INTEGER DEFAULT 0,
    
    -- Time estimation factors
    base_time_estimate INTEGER NOT NULL,
    time_adjustment INTEGER DEFAULT 0,
    final_time_estimate INTEGER NOT NULL,
    
    -- Metadata
    analyzed_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_page_analysis_user ON scheduler_page_analysis(user_id);
CREATE INDEX idx_page_analysis_sipara ON scheduler_page_analysis(user_id, sipara);

-- Schedules Table
CREATE TABLE scheduler_schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start INTEGER NOT NULL, -- Unix timestamp
    schedule TEXT NOT NULL, -- JSON object with full schedule
    generated_at INTEGER NOT NULL,
    algorithm_version TEXT NOT NULL,
    weekly_workload TEXT, -- JSON object with day percentages
    conflicts TEXT, -- JSON array
    warnings TEXT, -- JSON array
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_scheduler_schedules_user_week ON scheduler_schedules(user_id, week_start);
```

---

## 5. API Endpoints

### Events

```
POST   /api/scheduler/events          Create event
GET    /api/scheduler/events          List user events
GET    /api/scheduler/events/:id      Get single event
PUT    /api/scheduler/events/:id      Update event
DELETE /api/scheduler/events/:id      Delete event
POST   /api/scheduler/events/copy     Copy event to other days
POST   /api/scheduler/events/bulk     Bulk create/update events
```

### Revision Units

```
GET    /api/scheduler/revision-units           List user revision units
POST   /api/scheduler/revision-units/generate  Generate revision units (all work types)
GET    /api/scheduler/revision-units/:id       Get single revision unit
PUT    /api/scheduler/revision-units/:id       Update revision unit
DELETE /api/scheduler/revision-units/:id       Delete revision unit
POST   /api/scheduler/revision-units/:id/complete Mark unit as completed
```

### Page Analysis

```
GET    /api/scheduler/page-analysis              List user page analysis
POST   /api/scheduler/page-analysis/analyze     Run page analysis
GET    /api/scheduler/page-analysis/:sipara/:page Get specific page analysis
PUT    /api/scheduler/page-analysis/:id         Update page analysis
```

### Schedule

```
POST   /api/scheduler/schedule/generate   Generate weekly schedule
GET    /api/scheduler/schedule/:weekId    Get schedule for week
PUT    /api/scheduler/schedule/:weekId    Manually adjust schedule
POST   /api/scheduler/schedule/regenerate Regenerate with changes
GET    /api/scheduler/schedule/current    Get current week's schedule
POST   /api/scheduler/schedule/validate   Validate schedule constraints
```

### Workload

```
GET    /api/scheduler/workload/today       Get today's workload
GET    /api/scheduler/workload/week       Get weekly workload distribution
POST   /api/scheduler/workload/adjust     Adjust daily workload targets
```

---

## 6. Intelligence Layer Services

### Quality Analysis Service

**Responsibility**: Analyze page quality and determine revision methods

**Operations**:
- Analyze page quality score
- Identify mistake patterns
- Determine weakness areas
- Select appropriate revision method
- Generate revision steps

**Revision Method Selection**:
```javascript
function selectRevisionMethod(qualityScore, mistakePattern, weaknessAreas) {
    if (qualityScore >= 9) {
        return {
            method: 'Quick Review',
            steps: ['Single fluent recitation'],
            estimatedMultiplier: 1.0
        }
    }
    else if (qualityScore >= 7) {
        return {
            method: 'Standard Revision',
            steps: ['Read looking', 'Recite without Mushaf', 'Self-test'],
            estimatedMultiplier: 1.5
        }
    }
    else if (qualityScore >= 5) {
        return {
            method: 'Intensive Revision',
            steps: ['Listen once', 'Read looking', 'Repeat five times', 'Recite without Mushaf', 'Partner test'],
            estimatedMultiplier: 2.5
        }
    }
    else {
        return {
            method: 'Rehabilitation',
            steps: ['Listen multiple times', 'Read with tajweed focus', 'Repeat until fluent', 'Partner test', 'Record and compare'],
            estimatedMultiplier: 4.0
        }
    }
}
```

### Page Analysis Service

**Responsibility**: Track historical page data and patterns

**Operations**:
- Track revision history
- Calculate days since last revision
- Identify consecutive weak pages
- Calculate score trends
- Track average scores

**Consecutive Weak Detection**:
```javascript
function detectConsecutiveWeakPages(pageAnalyses, sipara) {
    const pages = pageAnalyses.filter(p => p.sipara === sipara).sort(by page)
    let consecutiveWeak = 0
    let maxConsecutiveWeak = 0
    
    for page in pages:
        if page.qualityScore <= 4:
            consecutiveWeak++
            maxConsecutiveWeak = max(maxConsecutiveWeak, consecutiveWeak)
        else:
            consecutiveWeak = 0
    
    return maxConsecutiveWeak
}
```

### Revision Unit Generator Service

**Responsibility**: Convert page analysis into revision units for all work types

**Work Type Generators**:

#### Muraja'ah Generator
```javascript
function generateMurajaahUnits(pageAnalyses, weeklyCycle) {
    const units = []
    
    for sipara in weeklyCycle.activeSiparas:
        pages = pageAnalyses.filter(p => p.sipara === sipara)
        
        for page in pages:
            // Grouping rules based on quality
            if page.quality === 'excellent':
                // Single page unit
                units.push(createSinglePageUnit(page))
            else if page.quality === 'very_good':
                // May group 2-4 consecutive good pages
                consecutive = findConsecutiveGoodPages(page, pages)
                if consecutive.length >= 2:
                    units.push(createMultiPageUnit(consecutive))
                else:
                    units.push(createSinglePageUnit(page))
            else if page.quality === 'good':
                // May group if same revision method
                similar = findSimilarMethodPages(page, pages)
                units.push(createMultiPageUnit(similar))
            else if page.quality === 'fair' || page.quality === 'poor':
                // Prefer grouping consecutive weak pages
                consecutiveWeak = findConsecutiveWeakPages(page, pages)
                units.push(createRehabilitationUnit(consecutiveWeak))
    
    return units
}
```

#### Juz Hali Generator
```javascript
function generateJuzHaliUnits(pageAnalyses, currentSipara) {
    const units = []
    pages = pageAnalyses.filter(p => p.sipara === currentSipara)
    
    // Juz Hali focuses on consolidation of current Sipara
    // Group pages based on completion status
    completedPages = pages.filter(p => p.qualityScore >= 8)
    weakPages = pages.filter(p => p.qualityScore < 8)
    
    // Create consolidation units for completed pages
    if completedPages.length > 0:
        units.push(createConsolidationUnit(completedPages))
    
    // Create reinforcement units for weak pages
    for group in groupConsecutivePages(weakPages):
        units.push(createReinforcementUnit(group))
    
    return units
}
```

#### Jadeed Generator
```javascript
function generateJadeedUnits(userProgress, targetPages) {
    const units = []
    
    // Jadeed is new memorization
    // Units are typically smaller (1-2 pages) for quality
    currentPage = userProgress.currentPage
    targetDailyPages = userProgress.dailyTarget
    
    for i from 0 to targetDailyPages:
        unitPages = [currentPage + i]
        units.push({
            workType: 'jadeед',
            sipara: getSiparaForPage(currentPage + i),
            pages: unitPages,
            estimatedTime: 15, // Base time for new memorization
            priority: 100, // Highest priority
            isSplittable: false // Jadeed should not be split
        })
    
    return units
}
```

### Priority Engine

**Responsibility**: Calculate multi-factor priority scores

**Priority Factors**:
```javascript
function calculatePriority(revisionUnit, pageAnalysis, weeklyCycle, userGoals) {
    const factors = {
        qualityScore: (10 - pageAnalysis.qualityScore) * 10, // Lower score = higher priority
        consecutiveWeak: pageAnalysis.consecutiveWeakPages * 5,
        daysSinceRevision: pageAnalysis.daysSinceRevision * 2,
        currentSipara: (revisionUnit.sipara === weeklyCycle.currentSipara) ? 15 : 0,
        weeklyCycle: weeklyCycle.includes(revisionUnit.sipara) ? 10 : 0,
        historicalCompletion: (1 - pageAnalysis.averageScore / 10) * 5,
        userGoals: userGoals.includes(revisionUnit.workType) ? 20 : 0
    }
    
    revisionUnit.priorityFactors = factors
    revisionUnit.priority = Object.values(factors).reduce((a, b) => a + b, 0)
    
    return revisionUnit
}
```

### Time Estimation Engine

**Responsibility**: Dynamically calculate time estimates

**Time Calculation**:
```javascript
function estimateTime(pageAnalysis, revisionMethod, consecutiveWeak) {
    // Base time by quality
    const baseTimes = {
        excellent: 2,
        very_good: 3,
        good: 5,
        fair: 7,
        poor: 12
    }
    
    let baseTime = baseTimes[pageAnalysis.quality]
    
    // Adjust for revision method
    const methodMultipliers = {
        'Quick Review': 1.0,
        'Standard Revision': 1.5,
        'Intensive Revision': 2.5,
        'Rehabilitation': 4.0
    }
    
    baseTime *= methodMultipliers[revisionMethod]
    
    // Adjust for consecutive weak pages
    if consecutiveWeak > 1:
        baseTime *= (1 + (consecutiveWeak * 0.1)) // 10% increase per consecutive weak
    
    // Adjust for days since revision
    if pageAnalysis.daysSinceRevision > 7:
        baseTime *= 1.2
    
    // Adjust for score trend
    if pageAnalysis.scoreTrend === 'declining':
        baseTime *= 1.3
    
    return Math.round(baseTime)
}
```

---

## 7. Planning Layer Services

### Daily Workload Planner

**Responsibility**: Determine what should be scheduled today

**Workload Calculation**:
```javascript
function planDailyWorkload(revisionUnits, events, dayOfWeek, weeklyStrategy) {
    // Calculate total available time
    dayEvents = events.filter(e => e.daysOfWeek.includes(dayOfWeek))
    availableMinutes = calculateAvailableTime(dayEvents)
    
    // Apply weekly strategy weighting
    workloadPercentage = weeklyStrategy[dayOfWeek] // e.g., Monday = 100%, Friday = 65%
    targetWorkload = availableMinutes * (workloadPercentage / 100)
    
    // Calculate total revision time needed
    totalRevisionTime = revisionUnits.reduce((sum, unit) => sum + unit.estimatedTime, 0)
    
    // If total needed > available, rank and prioritize
    if totalRevisionTime > targetWorkload:
        rankedUnits = revisionUnits.sort(by priority descending)
        scheduledUnits = []
        currentTime = 0
        
        for unit in rankedUnits:
            if currentTime + unit.estimatedTime <= targetWorkload:
                scheduledUnits.push(unit)
                currentTime += unit.estimatedTime
        
        return {
            scheduledUnits: scheduledUnits,
            unscheduledUnits: rankedUnits.slice(scheduledUnits.length),
            targetWorkload: targetWorkload,
            actualWorkload: currentTime,
            utilization: (currentTime / targetWorkload) * 100
        }
    else:
        return {
            scheduledUnits: revisionUnits,
            unscheduledUnits: [],
            targetWorkload: targetWorkload,
            actualWorkload: totalRevisionTime,
            utilization: (totalRevisionTime / targetWorkload) * 100
        }
}
```

### Weekly Strategy Service

**Responsibility**: Define workload distribution across the week

**Default Strategy**:
```javascript
const DEFAULT_WEEKLY_STRATEGY = {
    0: 0.50,  // Sunday - Recovery or catch-up (50%)
    1: 1.00,  // Monday - Heaviest (100%)
    2: 0.90,  // Tuesday - 90%
    3: 0.80,  // Wednesday - 80%
    4: 0.75,  // Thursday - 75%
    5: 0.65,  // Friday - Lighter (65%)
    6: 0.90   // Saturday - 90%
}

function calculateWeeklyStrategy(events, commitments) {
    strategy = { ...DEFAULT_WEEKLY_STRATEGY }
    
    // Reduce workload on days with heavy commitments
    for day in commitments:
        if commitments[day].isHeavy:
            strategy[day] *= 0.5 // 50% reduction
        elif commitments[day].isModerate:
            strategy[day] *= 0.75 // 25% reduction
    
    return strategy
}
```

---

## 8. Scheduling Layer Services

### Timeline Scheduler

**Responsibility**: Schedule revision units into available timeline

**Scheduling Algorithm**:
```javascript
function scheduleRevisionUnits(revisionUnits, events, dayOfWeek) {
    // Build timeline
    timeline = buildTimeline(events, dayOfWeek)
    
    // Detect gaps
    gaps = detectGaps(timeline)
    
    // Sort units by priority
    rankedUnits = revisionUnits.sort(by priority descending)
    
    scheduledUnits = []
    
    for unit in rankedUnits:
        // Find best gap
        bestGap = findBestGap(gaps, unit)
        
        if bestGap:
            if unit.estimatedTime <= bestGap.duration:
                // Unit fits in gap
                scheduleUnit(unit, bestGap)
                scheduledUnits.push(unit)
                markGapUsed(bestGap)
            else if unit.isSplittable:
                // Split unit across multiple gaps
                splitSchedule = splitUnitAcrossGaps(unit, gaps)
                scheduledUnits.push(...splitSchedule.scheduledUnits)
                markGapsUsed(splitSchedule.usedGaps)
            else:
                // Unit doesn't fit and can't split
                unit.isScheduled = false
    
    return scheduledUnits
}
```

### Adaptive Splitter

**Responsibility**: Split revision units based on available gaps

**Splitting Algorithm**:
```javascript
function splitUnitAcrossGaps(unit, gaps) {
    const remainingTime = unit.estimatedTime
    const remainingPages = [...unit.pages]
    const scheduledSlots = []
    const usedGaps = []
    
    // Sort gaps by size (largest first)
    sortedGaps = gaps.sort(by duration descending)
    
    for gap in sortedGaps:
        if remainingTime <= 0:
            break
        
        if gap.duration >= 5: // Minimum 5 minutes
            // Calculate how much of this unit fits in this gap
            slotTime = min(gap.duration, remainingTime)
            slotPages = calculatePagesForTime(slotTime, unit)
            
            scheduledSlots.push({
                startTime: gap.startTime,
                endTime: gap.startTime + slotTime,
                pages: slotPages
            })
            
            usedGaps.push(gap)
            remainingTime -= slotTime
            remainingPages = remainingPages.slice(slotPages.length)
    
    unit.scheduledSlots = scheduledSlots
    unit.isScheduled = scheduledSlots.length > 0
    
    return {
        unit: unit,
        scheduledUnits: unit.isScheduled ? [unit] : [],
        usedGaps: usedGaps
    }
}
```

### Constraint Service

**Responsibility**: Validate schedules against constraints

**Validation Rules**:
```javascript
function validateSchedule(schedule, events) {
    violations = []
    
    for day in schedule:
        for event in schedule[day].events:
            // Check for overlaps
            overlaps = findOverlaps(event, schedule[day].events)
            if overlaps.length > 0:
                violations.push({
                    type: 'overlap',
                    severity: 'error',
                    event: event,
                    overlaps: overlaps
                })
            
            // Check for minimum gaps
            gaps = checkMinimumGaps(event, schedule[day].events, 5) // 5 min minimum
            if gaps.length > 0:
                violations.push({
                    type: 'insufficient_gap',
                    severity: 'warning',
                    event: event,
                    gaps: gaps
                })
    
    return violations
}
```

---

## 9. Main Scheduling Algorithm

### Complete Pipeline

```javascript
async function generateWeeklySchedule(userId, weekStart) {
    // Step 1: Load existing analysis (DO NOT CHANGE)
    progressAnalysis = await loadProgressAnalysis(userId)
    weeklyCycle = await loadWeeklyCycle(userId)
    
    // Step 2: Load user events
    events = await loadEvents(userId)
    
    // Step 3: Run Quality analysis
    qualityAnalysis = await qualityAnalysisService.analyze(userId)
    
    // Step 4: Run page analysis
    pageAnalysis = await pageAnalysisService.analyze(userId, qualityAnalysis)
    
    // Step 5: Generate revision units for all work types
    murajaahUnits = await revisionUnitGenerator.generateMurajaah(pageAnalysis, weeklyCycle)
    juzHaliUnits = await revisionUnitGenerator.generateJuzHali(pageAnalysis, progressAnalysis.currentSipara)
    jadeedUnits = await revisionUnitGenerator.generateJadeed(progressAnalysis)
    
    allUnits = [...murajaahUnits, ...juzHaliUnits, ...jadeedUnits]
    
    // Step 6: Calculate priorities
    for unit in allUnits:
        await priorityEngine.calculatePriority(unit, pageAnalysis, weeklyCycle)
    
    // Step 7: Estimate times
    for unit in allUnits:
        unit.estimatedTime = await timeEstimationEngine.estimate(unit, pageAnalysis)
    
    // Step 8: Calculate weekly strategy
    weeklyStrategy = await weeklyStrategyService.calculate(events, commitments)
    
    // Step 9: Generate daily schedules
    schedule = {}
    for day = 0 to 6:
        dailyUnits = await dailyWorkloadPlanner.plan(allUnits, events, day, weeklyStrategy)
        daySchedule = await timelineScheduler.schedule(dailyUnits.scheduledUnits, events, day)
        schedule[day] = daySchedule
    
    // Step 10: Validate schedule
    violations = await constraintService.validate(schedule, events)
    
    // Step 11: Return results
    return {
        schedule: schedule,
        revisionUnits: allUnits,
        pageAnalysis: pageAnalysis,
        violations: violations,
        weeklyStrategy: weeklyStrategy
    }
}
```

---

## 10. Frontend UI Architecture

### Component Hierarchy

```
SchedulerPage
├── EventsTab (Event Builder, Event List)
├── RevisionUnitsTab (Unit List, Page Detail View, Split Preview)
├── ScheduleTab (Weekly Timeline, Daily Timeline, Schedule Stats)
└── WorkloadTab (Daily Workload, Weekly Strategy)
```

### State Management

React Context + useReducer for:
- events
- revisionUnits
- pageAnalysis
- schedule
- weeklyStrategy
- violations

---

## 11. Implementation Phases

### Phase 1: Intelligence Layer
- Quality Analysis Service
- Page Analysis Service
- Revision Unit Generator (Muraja'ah, Juz Hali, Jadeed)
- Priority Engine
- Time Estimation Engine

### Phase 2: Planning Layer
- Daily Workload Planner
- Weekly Strategy Service

### Phase 3: Scheduling Layer
- Timeline Scheduler
- Adaptive Splitter
- Constraint Service

### Phase 4: Data Layer
- Database schema migration
- Repository implementations
- API endpoints

### Phase 5: Frontend
- Event Builder UI
- Revision Units UI
- Schedule Viewer UI
- Workload Planner UI

---

## 12. Migration Strategy

### From Current Time Management

1. **Preserve Existing**: Keep progress analysis and weekly cycle unchanged
2. **Add New Layer**: New scheduler as additional layer
3. **Gradual Rollout**: Opt-in to new scheduler
4. **Data Migration**: Convert existing events to new format

### Backward Compatibility

- Old wizard remains available
- New scheduler is opt-in initially
- Gradual feature deprecation

---

## Summary

This architecture provides:

- **Quran-First**: All decisions prioritize Quran retention
- **Page-Level**: Scheduler works with individual pages
- **Intelligence Before Scheduling**: Analysis happens before timeline construction
- **Adaptive**: Units split based on available time
- **Deterministic**: No LLM in scheduling
- **AQMOS-Driven**: Priority and methods from AQMOS
- **Workload-Aware**: Respects availability and commitments
- **Future-Proof**: Scheduler decoupled from Hifz intelligence
- **Three Work Types**: Muraja'ah, Juz Hali, Jadeed each with specific rules

The scheduler only knows: duration, priority, constraints, deadline, splittable. All Hifz intelligence belongs in analysis and planning layers.

---

## 10. Frontend UI Architecture

### Component Hierarchy

```
SchedulerPage
├── EventsTab (Event Builder, Event List)
├── RevisionUnitsTab (Unit List, Page Detail View, Split Preview)
├── ScheduleTab (Weekly Timeline, Daily Timeline, Schedule Stats)
└── WorkloadTab (Daily Workload, Weekly Strategy)
```

### State Management

React Context + useReducer for:
- events
- revisionUnits
- pageAnalysis
- schedule
- weeklyStrategy
- violations

---

## 11. Implementation Phases

### Phase 1: Intelligence Layer
- Quality Analysis Service
- Page Analysis Service
- Revision Unit Generator (Muraja'ah, Juz Hali, Jadeed)
- Priority Engine
- Time Estimation Engine

### Phase 2: Planning Layer
- Daily Workload Planner
- Weekly Strategy Service

### Phase 3: Scheduling Layer
- Timeline Scheduler
- Adaptive Splitter
- Constraint Service

### Phase 4: Data Layer
- Database schema migration
- Repository implementations
- API endpoints

### Phase 5: Frontend
- Event Builder UI
- Revision Units UI
- Schedule Viewer UI
- Workload Planner UI

---

## 12. Migration Strategy

### From Current Time Management

1. **Preserve Existing**: Keep progress analysis and weekly cycle unchanged
2. **Add New Layer**: New scheduler as additional layer
3. **Gradual Rollout**: Opt-in to new scheduler
4. **Data Migration**: Convert existing events to new format

### Backward Compatibility

- Old wizard remains available
- New scheduler is opt-in initially
- Gradual feature deprecation
