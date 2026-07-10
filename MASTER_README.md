# Hifz al-Quran Platform - Master Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Features Overview](#features-overview)
4. [User Flow & Navigation](#user-flow--navigation)
5. [Tour System](#tour-system)
6. [Mutashabihat (Similar Verses)](#mutashabihat-similar-verses)
7. [Flashcards System](#flashcards-system)
8. [My Diary](#my-diary)
9. [Time Management (Ustadh AI Scheduler)](#time-management-ustadh-ai-scheduler)
10. [Printables](#printables)
11. [Streak Banner](#streak-banner)
12. [Daily Quotes](#daily-quotes)
13. [Marks Calculation Logic](#marks-calculation-logic)
14. [Memory Aids](#memory-aids)
15. [AQMOS Profile](#aqmos-profile)
16. [Color Theme](#color-theme)
17. [Quick Start](#quick-start)
18. [Useful Scripts](#useful-scripts)

---

## Overview

The Hifz al-Quran Platform is a comprehensive React + Node.js web application designed for Quran memorization (Hifz) with AI-powered tools. It provides an integrated suite of features to help students track progress, manage schedules, identify similar verses, and use flashcards for memorization.

---

## Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Islamic color theme** - Custom design system

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite** - Database

### AI Integration
- **Groq API** (llama-3.3-70b-versatile, OpenAI-compatible endpoint) - AI-powered memory tips and analysis

---

## Features Overview

### 1. Mutashabihat (Similar Verses)
- Search any Surah/Ayah to find structurally similar verses
- Similarity percentage and word-level difference highlighting
- Manual tip entry and editing via ✏️ pencil icon
- Tips saved to DB per user
- Bidirectional verse comparison (Verse A ↔ Verse B)

### 2. Flashcards
- Create flashcard sets from the Flashcards page
- 4 set types: Sequence of Ayah in Surah, Ayah in Page, Pages in Juz, Surahs in Juz
- Starting/Ending modes for each set type
- Memory Aid with 3 tabs: Flowchart, First/Key Words, AI Story
- Flowchart always fetches live Quran data (not from saved cards)
- Study section with set-type-specific questions using real Quran data
- Built-in categories (Surah Openings, Verses Twice, etc.)
- Print support for flowcharts
- Sets persist per user in DB
- Folder organization for flashcard sets

### 3. My Diary
- 5 entry types: MURAJAH, TASMEE, IKHTEBAR, JADEED, JUZ HALI
- Tasks & Targets with status tracking (Completed/In Progress/Pending)
- Streak system with themed banners (unlocks over time)
- Immersive streak banner with cosmic themes
- Quran Map visualization of page strength
- Performance analytics
- Log history timeline

### 4. Time Management (Ustadh AI Scheduler)
- 8-step wizard: Progress Analysis → Weekly Cycle → Build My Week → Exceptions → Review → Generated Schedule → Unit Details → Adjust
- Events persist across sessions (saved to DB per user)
- Deduplication of events on load
- Free time calculation per day with interval merging (handles overlapping events)
- Schedule generation based on page scores (1-10 scale)
- Time per page: Poor=5min, Fair=4min, Good=3min, Very Good=2min, Excellent=1min
- Color-coded page scores in unit details
- Adjust/reschedule/skip/split session options
- Printable weekly schedule (7-day grid layout on single landscape page)

### 5. AQMOS Profile
- Learning style assessment
- Profile saved to DB and shown in side panel
- Retake test option (old profile preserved until new one saved)

### 6. Interactive Onboarding Tour
- Auto-starts for new users (localStorage based)
- 32-step interactive tour covering all features
- Banner persists across page navigation (React Portal)
- Steps sync with actual user actions (not just Next clicks)
- "?" button to reopen tour anytime
- Islamic color themed banner
- Positioned at top of screen (below navbar) to avoid covering content

---

## User Flow & Navigation

### Main Navigation
The application uses React Router for navigation with the following main routes:

- `/` - Home page with feature cards and daily quote
- `/similarity` - Mutashabihat (Similar Verses) search
- `/flashcards` - Flashcards management and study
- `/diary` - Hifz diary logging
- `/coach` - Time Management wizard (Ustadh AI Scheduler)
- `/analytics` - Performance analytics

### Typical User Journey

1. **First Visit**
   - User lands on home page
   - Tour auto-starts (if localStorage shows tour not completed)
   - User completes 32-step interactive tour
   - Tour completion saved to localStorage

2. **Daily Routine**
   - User logs diary entry (MURAJAH, TASMEE, IKHTEBAR, JADEED, or JUZ HALI)
   - Streak updates based on consecutive days of logging
   - Quran Map updates with new page strength scores
   - Performance analytics refresh

3. **Weekly Planning**
   - User navigates to Coach (Time Management)
   - Completes 8-step wizard to generate schedule
   - Events saved to DB for reuse
   - Printable schedule generated

4. **Study Session**
   - User opens Flashcards
   - Studies from built-in categories or user-created sets
   - Uses Memory Aid tabs (Flowchart, First Words, AI Story)
   - Tests knowledge with Test Yourself mode

5. **Similarity Research**
   - User navigates to Similarity page
   - Searches for Surah/Ayah
   - Reviews similar verses with AI memory tips
   - Edits tips for personalization

---

### Taking the Tour

#### How to Start the Tour
The interactive onboarding tour helps new users learn all features:

**Auto-Start for New Users:**
- Tour auto-starts on first visit
- Checks localStorage for `hifz_tour_completed` flag
- If flag is not set, tour begins automatically
- Tour banner appears at top of screen (below navbar)

**Manual Start:**
- Click "?" button in navbar (top right)
- Tour starts from Step 1
- Can be started anytime, even if previously completed

#### Tour Navigation

**Tour Banner:**
- Positioned at top of screen (below navbar)
- Shows current step content
- Islamic color themed design
- React Portal for proper z-index layering

**Navigation Buttons:**
- **Previous**: Go back to previous step
- **Next**: Advance to next step
- **Skip**: Skip current step (if applicable)
- **Close**: End tour early

**Event-Driven Progression:**
- Tour advances based on actual user actions
- Not just clicking "Next" button
- Steps sync with real feature interactions
- Example: Must actually search for similarities to advance past Step 3

#### Tour Steps Overview

**Mutashabihat (Steps 1-7):**
1. Welcome to Mutashābihāt tool
2. Filter dropdown usage (manual)
3. Search functionality (action: search)
4. Result selection (action: click result)
5. Mutashabiha Score explanation
6. Memory Tip editing (action: edit tip)
7. Bidirectional verse pairs

**Flashcards (Steps 8-17):**
8. 4 flashcard types overview
9. Create flashcard set (action: create set)
10. Open flashcard set (action: open set)
11. Study view overview
12. Memory Aid tabs explanation
13. Test Yourself mode (action: open test)
14. Rename/Delete actions
15. Create folder (action: create folder)
16. Add sets to folder (action: add to folder)
17. Built-in categories

**Diary (Steps 18-25):**
18. Diary overview
19. 5 entry types
20. Save entry (action: save entry)
21. Entry type purposes
22. Streak system
23. Quran Map overview
24. Diary timeline
25. Quran Map legend

**Coach/Time Management (Steps 26-31):**
26. Progress Overview (action: continue)
27. Weekly Cycle (action: continue)
28. Build My Week (action: continue)
29. Exceptions (action: continue)
30. Review (action: continue)
31. Generated Schedule overview

**Completion (Step 32):**
32. Tour complete message

#### Tour Persistence

**Completion Status:**
- Stored in localStorage: `hifz_tour_completed`
- Set to `true` when tour completed
- Checked on each page load
- Can be reset to retake tour

**Step Progress:**
- Current step stored in React Context
- Completed steps tracked
- Can resume from where left off
- State lost on page refresh (resets to Step 1)

#### Tour Best Practices

**For New Users:**
- Complete all steps in order
- Actually perform actions (don't just click Next)
- Read each step carefully
- Ask questions if confused
- Take time to explore features

**For Returning Users:**
- Use "?" button to refresh memory
- Skip familiar sections if needed
- Focus on new features
- Use as reference guide

---

## Home Page

### Purpose
The home page serves as the main dashboard and entry point to all features of the Hifz al-Quran Platform.

### Layout and Components

#### Header Section
- **Logo/Branding**: Hifz al-Quran Platform logo
- **Navigation**: Links to all main features
- **User Menu**: Profile, settings, logout
- **Tour Button**: "?" to start/restart tour

#### Daily Quote Card
- **Location**: Prominent position near top
- **Content**: Daily Islamic wisdom quote
- **Format**: Arabic text with English translation
- **Rotation**: Changes daily at midnight
- **Source**: 100+ quotes from `dailyQuotes.js`
- **Categories**: Quran, Allah, Character & Manners

#### Feature Cards
- **Purpose**: Quick access to all main features
- **Layout**: Grid of cards with icons
- **Cards Include:**
  - **Mutashabihat**: Similar verses search
  - **Flashcards**: Memorization aids
  - **My Diary**: Progress tracking
  - **Time Management**: Schedule wizard
  - **Analytics**: Performance analysis
  - **AQMOS Profile**: Learning style assessment

**Card Features:**
- Icon representing feature
- Brief description
- "Explore" button to navigate
- Hover effects
- Islamic color theme

#### Streak Banner (if logged in)
- **Location**: Below feature cards
- **Content**: Current streak count and tier
- **Progress Bar**: Shows progress to next tier
- **Theme**: Cosmic themed with particles
- **Interactivity**: Can change theme

#### Quick Stats (if logged in)
- **Total Entries**: Diary entries logged
- **Current Streak**: Consecutive days
- **Completed Siparas**: Juz completed
- **Current Page**: Latest memorized page

#### Recent Activity (if logged in)
- **Timeline**: Recent diary entries
- **Type Icons**: Different icons per entry type
- **Dates**: Entry dates
- **Quick Actions**: View, edit, delete

### Navigation from Home Page

**To Mutashabihat:**
- Click "Mutashabihat" feature card
- Or use navbar navigation
- Lands on Similarity page

**To Flashcards:**
- Click "Flashcards" feature card
- Or use navbar navigation
- Lands on Flashcards page

**To Diary:**
- Click "My Diary" feature card
- Or use navbar navigation
- Lands on Diary page

**To Time Management:**
- Click "Time Management" feature card
- Or use navbar navigation
- Lands on Coach page (wizard)

**To Analytics:**
- Click "Analytics" feature card
- Or use navbar navigation
- Lands on Performance Analytics page

**To AQMOS Profile:**
- Click "AQMOS Profile" feature card
- Or use side panel in Coach page
- Opens assessment or profile view

### Home Page Behavior

**For Logged-In Users:**
- Shows personalized stats
- Displays streak banner
- Shows recent activity
- Quick access to all features
- Daily quote visible

**For Logged-Out Users:**
- Shows feature overview only
- No personalized stats
- No streak banner
- No recent activity
- Daily quote still visible
- Login/Register buttons prominent

**First Visit:**
- Tour auto-starts
- Tour banner appears
- Guided through features
- Welcome message

### Responsive Design

**Desktop (>768px):**
- Feature cards in 3-column grid
- Daily quote prominent
- Stats in sidebar
- Full navigation visible

**Tablet (768px-1024px):**
- Feature cards in 2-column grid
- Daily quote slightly smaller
- Stats below feature cards
- Navigation collapsible

**Mobile (<768px):**
- Feature cards in single column
- Daily quote compact
- Stats stacked
- Hamburger menu for navigation

### Home Page Customization

**Theme:**
- Follows Islamic color theme
- Consistent with rest of app
- Can be customized via CSS

**Layout:**
- Component-based architecture
- Easy to add/remove sections
- Responsive grid system

**Content:**
- Daily quotes can be added/modified
- Feature cards can be reordered
- Stats can be customized

### Technical Details

**Component:** `frontend/src/features/auth/pages/Home.jsx`

**Key Features:**
- React Router for navigation
- Context for user state
- localStorage for tour status
- API calls for user data
- Responsive CSS with Tailwind

**Data Fetching:**
- User stats from `/user/stats`
- Recent entries from `/diary/logs`
- Streak from `/diary/streak`
- Daily quote from local data

**State Management:**
- User authentication state
- Tour active state
- Feature card hover states
- Mobile menu open/close

---

## Mutashabihat (Similar Verses)

### Purpose
Find structurally similar Quran verses that are easy to confuse during memorization.

### Core Logic

#### Similarity Search Algorithm
The search identifies Mutashabihat (similar verses) based on the following logic:

**Primary Criterion: 3+ Same Words in Same Order**
- Verses are considered similar if they share 3 or more consecutive words in the exact same order
- Example: Verse A has "وَمَا أَهْلَكْنَا مِن قَرْيَةٍ" and Verse B has the same sequence → matched
- Word-level comparison ensures structural similarity, not just random word matches
- The more consecutive matching words, the higher the similarity score

**Match Analysis Process**
1. User selects Surah first → Ayah dropdown only shows Ayahs present in that Surah
2. System fetches the selected verse's Arabic text
3. Algorithm compares against all other verses in the database
4. Identifies verses with 3+ consecutive matching words in same order
5. Calculates similarity percentage based on:
   - Number of matching consecutive words
   - Total words in the verse
   - Position of matching sequences
6. Results ranked by similarity score (highest first)

#### Similarity Score Calculation
- Score ranges from 0-100
- Higher score = more confusable
- Scores above 70 need careful attention
- Calculated based on:
  - Consecutive matching word sequences
  - Word patterns and roots
  - Structural similarities (endings, beginnings)
  - Contextual overlap

#### Marhala (Memorization Stage) Filters
The filter dropdown allows users to narrow results by their memorization stage:

**Filter Options:**
- **All** - Show all similar verses regardless of memorization stage
- **Memorized** - Only show verses from Surahs you have memorized
- **In Progress** - Only show verses from Surahs you are currently memorizing
- **Not Started** - Only show verses from Surahs you haven't started

**How It Works:**
- Filter checks your progress data (completed Siparas, current page)
- Compares target Surah against your memorization status
- Hides results that don't match selected stage
- Helps focus on relevant verses for your current level

#### Side Panel Features

**Previous/Next Ayah Display**
- Side panel shows the selected verse pair with context
- Displays previous Ayah (before the matched verse) for context
- Displays next Ayah (after the matched verse) for context
- Helps user understand the verse within its Surah context
- Full Arabic text and translation shown for all verses

**Manual Memory Tips**
- User creates tips manually via ✏️ pencil icon
- Tips saved to database per user
- User can edit tips anytime
- Edits saved to database, replacing previous version

**Tip Content**
- Word-level differences highlighted between verses
- Contextual explanations of why verses are similar
- Mnemonic suggestions for differentiation
- Structural pattern analysis
- Personalized tips encouraged

### Components

#### SearchBar (`frontend/src/features/similarity/components/SearchBar.jsx`)
- Surah/Ayah input fields
- Filter dropdown by memorization stage
- Search button
- Auto-search from Coach page via navigation state

#### AyahDisplay (`frontend/src/features/similarity/components/AyahDisplay.jsx`)
- Displays source verse (searched verse)
- Shows Arabic text and translation

#### SimilarityList (`frontend/src/features/similarity/components/SimilaritiesList.jsx`)
- Lists similar verses with scores
- Click to select and view details
- Color-coded scores (green/yellow/red based on similarity)

#### SidePanel (`frontend/src/features/similarity/components/SidePanel.jsx`)
- Displays selected verse pair
- Shows AI memory tip
- Edit tip functionality
- Word-level difference highlighting

### Auto-Search from Coach

Coach page can trigger similarity search:
```javascript
navigate('/similarity', { 
  state: { 
    autoSearch: true, 
    surah: 2, 
    ayah: 255 
  } 
});
```

---

## Flashcards System

### Flashcard System

### Creating Flashcards

#### Step-by-Step Process

1. **Navigate to Flashcards page** (`/flashcards`)
2. **Click "+ Create Flashcard Set"** button
3. **Configure your set:**
   - **Set Type**: Choose from 4 types (see below)
   - **Starting Mode**: From beginning or custom start
   - **Ending Mode**: To end or custom end
   - **Set Name**: Give your set a descriptive name
4. **Click "Generate"** to create the set
5. **Cards are automatically generated** from Quran API data
6. **Set appears in your flashcard list** and persists to database

#### Flashcard Types

**1. Sequence of Ayah in Surah**
- Cards show Ayahs in sequence within a Surah
- Starting mode: From beginning of Surah or custom Ayah
- Ending mode: To end of Surah or custom Ayah
- Example: Surah Al-Baqarah, Ayah 1-10 → 10 cards
- **Default Questions:**
  - "What comes after Ayah X?"
  - "What is the Ayah before Y?"
  - "Which Ayah is number Z in the Surah?"

**2. Ayah in Page**
- Cards show Ayahs within a specific page
- Starting mode: From beginning of page or custom Ayah
- Ending mode: To end of page or custom Ayah
- Example: Page 1, Ayah 1-7 → 7 cards
- **Default Questions:**
  - "Which Ayah is on page X?"
  - "How many Ayahs are on page Y?"
  - "What is the first Ayah on page Z?"

**3. Pages in Juz**
- Cards show pages within a Juz
- Starting mode: From beginning of Juz or custom page
- Ending mode: To end of Juz or custom page
- Example: Juz 1, Page 1-20 → 20 cards
- **Default Questions:**
  - "What page comes after X?"
  - "Which Juz contains page Y?"
  - "What is the last page of Juz Z?"

**4. Surahs in Juz**
- Cards show Surahs within a Juz
- Starting mode: From first Surah in Juz or custom Surah
- Ending mode: To last Surah in Juz or custom Surah
- Example: Juz 1, Surah Al-Baqarah to Al-Baqarah → 1 card
- **Default Questions:**
  - "Which Surah comes after X?"
  - "How many Surahs are in Juz Y?"
  - "What is the first Surah of Juz Z?"

### Folder Organization

#### Creating Folders
1. Click "+ New Folder" button
2. Type folder name in input field
3. Press Enter to create
4. Folder appears in folder list
5. Folders persist per user in database

#### Adding Sets to Folders
1. Click on a folder to open it
2. Click "+ Add Sets to Folder" button
3. Selection panel appears with all your flashcard sets
4. Check boxes next to sets you want to add
5. Click "Add" button
6. Sets added to folder and saved to database

#### Organizing Flashcards
- **Built-in Categories**: Always visible on left sidebar (Surah Openings, Verses Twice, Mnemonics, Spelling Precision)
- **User Sets**: Displayed in main area
- **Folders**: Organize related sets together
- **Folder View**: Click folder to see only sets inside it
- **Back to All**: Click back button to return to all sets view

#### Renaming Flashcards and Folders

**Rename Flashcard Set:**
1. Open the flashcard set
2. Click ✏️ pencil icon next to set name
3. Type new name in input field
4. Click Save or press Enter
5. Name updated in database

**Rename Folder:**
1. Click ✏️ pencil icon next to folder name
2. Type new name in input field
3. Click Save or press Enter
4. Name updated in database

#### Deleting Flashcards and Folders

**Delete Flashcard Set:**
1. Open the flashcard set
2. Click "Delete Set" button
3. Confirm deletion in dialog
4. Set and all its cards removed from database
5. Cannot be undone

**Delete Folder:**
1. Click ✕ icon next to folder name
2. Confirm deletion in dialog
3. Folder removed from database
4. Sets inside folder are NOT deleted (they return to main list)
5. Cannot be undone

### Test Yourself Mode

#### How It Works
1. Open any flashcard set (built-in or user-created)
2. Click "Test Yourself" tab
3. Front of card shown with question
4. Click card or press Space to flip
5. Back of card shown with answer
6. Mark as Correct (✓) or Incorrect (✗)
7. Progress bar updates in real-time
8. At end, see score summary

#### Features
- **Flip Animation**: Smooth card flip effect
- **Keyboard Support**: Space to flip, arrows to navigate
- **Progress Tracking**: Shows X/Y cards completed
- **Score Summary**: Percentage correct at end
- **Retry Option**: Can restart test anytime
- **Shuffle Mode**: Randomize card order (optional)

### Flowchart Printing

#### How to Print Flowcharts
1. Open any flashcard set
2. Click "Memory Aid" tab
3. Click "Flowchart" sub-tab
4. Click "Print Flowchart" button
5. Browser print dialog opens
6. Select printer or save as PDF
7. Print maintains visual connections and layout

#### Print Features
- High-quality output
- Maintains Ayah connections
- Works for built-in and user-created sets
- Optimized for A4 paper
- Color-coded for clarity
- Arabic text properly rendered

#### Snake Layout (Boustrophedon)
- Horizontal wrapping with CSS flex-wrap for natural row breaks
- Alternating row direction: Row 0 flows right-to-left (RTL), Row 1 flows left-to-right (LTR), etc.
- JavaScript detects rows after CSS wrapping to apply snake direction dynamically
- Horizontal arrows point in correct direction based on row flow
- Vertical arrows connect end of one row to start of next row
- Supports both Portrait and Landscape orientations
- Box-per-row count adapts automatically to available page width

### Memory Aid System

#### 3 Tabs

**Flowchart Tab**
- Visual flowchart of Ayah sequence
- Always fetches live Quran data (not cached)
- Shows connections between Ayahs
- Print support

**First/Key Words Tab**
- Displays first words of each Ayah
- Key words highlighted
- Helps with recognition memory

**AI Story Tab**
- AI-generated narrative connecting Ayahs using simple visualizable imagery (sun, moon, mother, land, sky, etc.)
- Uses Groq API (llama-3.3-70b-versatile)
- Story saved per user/flashcard set
- Never regenerated once saved

### Study Mode

#### Questions
Set-type-specific questions using real Quran data:
- Sequence: "What comes after Ayah X?"
- Page: "Which Ayah is on page Y?"
- Juz Pages: "What page comes after Z?"
- Juz Surahs: "Which Surah is after W?"

#### Test Yourself
- Flip card to reveal answer
- Track correct/incorrect
- Progress indicator

### Built-in Categories

#### Category 1: Surah Openings
- 6 Surahs beginning with الٓمٓ
- 5 Surahs beginning with الحمد لله
- 5 Surahs beginning with الٓر
- 7 Surahs beginning with إذا
- 10 Surahs beginning with يا أيها
- Groups of two (ألم, قل, إنا, قد, تبارك, هل, ويل, والسماء, طسم, يسبح, لا)
- 7 Surahs beginning with حم

**Sample Questions:**
- "Name the seven Surahs beginning with حم."
- "Which Surahs begin with الٓر?"
- "Memory Pattern for الٓمٓ: Which are Madinan and which are Makkan?"

#### Category 2: Verses Appearing Only Twice
- Rare repeated phrases appearing exactly twice in Quran
- Powerful anchors for recognition memory
- Surah linking and Mutashābihāt precision

**Sample Phrases:**
- وَمَا أَهْلَكْنَا مِن قَرْيَةٍ (Al‑Ḥijr & Ash‑Shu‘arā’)
- فَبِئْسَ مَثْوَى الْمُتَكَبِّرِينَ (Az‑Zumar & Ghāfir)
- أَصْحَابُ الرَّسِّ (Al‑Furqān & Qāf)

**Sample Questions:**
- "Where does 'إِنَّهُ لَكَبِيرُكُمُ' appear?"
- "Which phrase appears in Al‑Infiṭār and Al‑Muṭaffifīn?"

#### Category 3: Mnemonics & Memory Systems
- "Travel Through the Earth" mnemonic (غفر الله للحج محمد يوسف)
- Singular vs Plural Fruit Rule (فاكهة vs فواكه)
- Sabbaha vs Yusabbihu Rule (based on first letter dots)
- رجل and القسط Placement Rule

**Sample Questions:**
- "What does 'غفر الله للحج محمد يوسف' refer to?"
- "When is فواكه used?"
- "When is فاكهة used?"

#### Category 4: Qur'anic Spelling Precision
- Open Tā’ Rule (امرأت) - when husband mentioned
- Closed Tā’ Rule (امرأة) - when husband not mentioned
- Other spelling rules

### Folder Organization

#### Creating Folders
- Click "+ New Folder"
- Type name and press Enter
- Folders persist per user in DB

#### Adding Sets to Folders
- Click folder to open
- Click "+ Add Sets to Folder"
- Select sets from list
- Click Add

### Data Persistence
- User-created sets saved to database
- Cards generated from Quran API on creation
- Memory aids saved per user
- Folders and folder memberships persisted

---

## My Diary

### Streak Banner System

#### How Streak Banner Works
The streak banner motivates consistent daily diary logging through themed milestones:

**Streak Calculation:**
- Uses UTC-based day-of-year index for timezone independence
- Advances at midnight (not mid-day)
- Incremented when diary entry logged on consecutive days
- Missed day = streak freezes (not reset)
- Streak unfreezes when logging resumes
- Stored in database per user
- Fetched via `getStreak()` API call

**Streak Tiers:**
- **0 days**: Getting Started (🌱 gray)
- **3 days**: Building Momentum (⚡ orange)
- **7 days**: On Fire! (🔥 red)
- **14 days**: Unstoppable (💪 purple)
- **30 days**: Hifz Legend (👑 green)
- **60 days**: Quran Master (🏆 dark green)
- **100+ days**: Immortal (⭐ gold)

**Progress Bar:**
- Shows progress toward next tier
- Displays "X days to [Next Tier Title]"
- Max tier (100+) shows 100% progress
- Visual motivation to maintain consistency

### Theme Selection

#### How to Choose and Change Theme
The diary features an immersive streak banner with cosmic themes:

**Theme Options:**
- **Sky Theme**: Blue gradient with clouds
- **Space Theme**: Dark with stars and nebula
- **Sunset Theme**: Orange/purple gradient
- **Forest Theme**: Green with trees
- **Ocean Theme**: Blue with waves

**Changing Theme:**
1. Click the theme selector icon (🎨) on streak banner
2. Theme dropdown appears with available options
3. Click on desired theme
4. Theme applies immediately
5. Selection saved to localStorage
6. Theme persists across sessions

**Immersive View:**
- Full-screen animated background
- Cosmic particles and effects
- Interactive elements
- Can be toggled on/off
- Optimized for performance

### Takhteet (Planning)

#### How Takhteet Works
Takhteet is the planning component of the diary that helps users set targets and track progress:

**Features:**
- Set daily/weekly/monthly targets
- Track target completion status
- Link targets to diary entries
- Visual progress indicators
- Historical target performance

**Late-Set Feature (Goals Set After Day 5):**
- When setting monthly goals after the 5th day of the month, the tracking period starts from the goal set date (not the 1st of the month)
- UI displays messaging to clarify the adjusted tracking period
- Example: Setting a goal on the 15th tracks from 15th to end of month, not full month
- Ensures fair goal tracking regardless of when goals are set

**Target Types:**
- **Juz Completion**: Target to complete a specific Juz
- **Surah Memorization**: Target to memorize a Surah
- **Page Count**: Target to revise X pages
- **Time-Based**: Target to study for X minutes
- **Custom**: User-defined targets

**Status Tracking:**
- **Completed**: Target achieved
- **In Progress**: Target ongoing
- **Pending**: Target not started

**Integration:**
- Targets linked to diary entries
- Progress affects schedule generation
- Visible in performance analytics
- Can be modified anytime

### Entry Types (All 5)

#### 1. MURAJAH (Revision)

**Purpose:** Track revision sessions for memorized portions

**How to Enter:**
1. Select "MURAJAH" tab in diary
2. Enter Surah number
3. Enter Ayah range (start and end)
4. Enter marks (0-10) for the revision
5. Add optional notes
6. Click "Save Entry"

**Fields:**
- Surah (dropdown: 1-114)
- Start Ayah (number)
- End Ayah (number)
- Marks (0-10 slider or input)
- Notes (optional text area)

**Template:**
- Auto-calculates Ayah count
- Shows estimated revision time based on marks
- Previous entries for same Surah displayed

#### 2. TASMEE (Recitation)

**Purpose:** Track recitation practice with page-by-page scoring

**How to Enter:**
1. Select "TASMEE" tab in diary
2. Enter page range (start and end)
3. Click "Generate Template"
4. Juz auto-detected based on page range
5. Template generates page-by-page scoring form
6. Enter marks (0-10) for each page
7. Add optional notes
8. Click "Save Entry"

**Fields:**
- Start Page (number, 1-604)
- End Page (number, 1-604)
- Per-page marks (0-10 for each page in range)
- Notes (optional text area)

**Template Features:**
- Auto-detects Juz from page range
- Generates scoring form for each page
- Color-coded marks input
- Shows total pages and Juz
- Calculates average score

#### 3. IKHTEBAR (Testing)

**Purpose:** Self-testing of memorization to assess retention

**How to Enter:**
1. Select "IKHTEBAR" tab in diary
2. Enter Surah number
3. Enter Ayah range (start and end)
4. Enter marks (0-10) for the test
5. Add optional notes
6. Click "Save Entry"

**Fields:**
- Surah (dropdown: 1-114)
- Start Ayah (number)
- End Ayah (number)
- Marks (0-10 slider or input)
- Notes (optional text area)

**Template:**
- Similar to MURAJAH but for testing
- Shows test-specific tips
- Previous test scores for comparison

#### 4. JADEED (New Memorization)

**Purpose:** Track new verses memorized

**How to Enter:**
1. Select "JADEED" tab in diary
2. Enter Surah number
3. Enter Ayah range (start and end)
4. Enter marks (0-10) for new memorization
5. Add optional notes
6. Click "Save Entry"

**Fields:**
- Surah (dropdown: 1-114)
- Start Ayah (number)
- End Ayah (number)
- Marks (0-10 slider or input)
- Notes (optional text area)

**Template:**
- Increments jadeed log counter
- Shows total new verses memorized
- Tracks memorization pace
- Celebrates milestones

#### 5. JUZ HALI (Juz Completion)

**Purpose:** Mark Juz completion milestone

**How to Enter:**
1. Select "JUZ HALI" tab in diary
2. Enter Juz number
3. Completion date auto-fills (can edit)
4. Add optional notes
5. Click "Save Entry"

**Fields:**
- Juz (dropdown: 1-30)
- Completion Date (date picker)
- Notes (optional text area)

**Template:**
- Special milestone entry
- Shows completion celebration
- Tracks overall progress
- Links to performance analytics

### Logged Entries Storage and Usage

#### How Entries Are Stored
- All diary entries saved to database table `diary_logs`
- Each entry includes: user_id, type, date, marks, notes, metadata
- Metadata stores type-specific data (Surah, Ayah range, page range, etc.)
- Indexed by user_id and date for fast retrieval
- Entries persist across sessions

#### How Entries Are Used

**1. Quran Map Generation**
- Page scores calculated from diary entries
- Average marks per page determine color
- Recent entries weighted more heavily
- Updates in real-time as entries are logged

**2. Schedule Generation**
- Page strength from diary marks
- Weaker pages get more revision time
- Strong pages get less time
- Used by Time Management wizard

**3. Performance Analytics**
- Entry trends over time
- Marks progression
- Streak calculation
- Target completion tracking

**4. Assessment Logs**
- Historical performance data
- Retention analysis
- Weakness identification
- Progress visualization

### Assessment Log and Performance Analysis

#### Assessment Log
The assessment log tracks your Hifz performance over time:

**Data Tracked:**
- Daily entry counts by type
- Average marks per entry type
- Streak history
- Target completion rates
- Page strength trends

**Visualization:**
- Line charts for marks progression
- Bar charts for entry distribution
- Heatmaps for page strength
- Timeline for milestones

#### Performance Analysis

**How It Works:**
1. Aggregates diary entry data
2. Calculates metrics (averages, trends, patterns)
3. Identifies strengths and weaknesses
4. Provides actionable insights
5. Generates recommendations

**Categories Represented:**

**1. Overall Performance**
- Total entries logged
- Average marks across all entries
- Streak length
- Target completion rate

**2. Entry Type Breakdown**
- MURAJAH: Revision frequency and quality
- TASMEE: Recitation consistency
- IKHTEBAR: Test scores
- JADEED: New memorization pace
- JUZ HALI: Completion milestones

**3. Page Strength Distribution**
- Percentage of pages by quality tier
- Weakest pages (needs urgent attention)
- Strongest pages (well-memorized)
- Priority areas for revision

**4. Time-Based Analysis**
- Weekly/daily/monthly trends
- Peak performance times
- Consistency metrics
- Improvement trajectory

**5. Target Performance**
- Targets set vs completed
- Overdue targets
- Upcoming targets
- Success rate

### Quran Map

#### What is Quran Map
The Quran Map is a visual representation of your Hifz progress across all 604 pages of the standard Madinah Mushaf:

**Visualization:**
- 604-page grid layout
- Color-coded by page strength score
- Interactive hover to see page details
- Zoom and pan functionality
- Print support

**Reading the Map:**
- **Green pages (7-10)**: Strong, minimal revision needed
- **Orange pages (3-6)**: Fair, regular revision needed
- **Red pages (1-2)**: Urgent, intensive revision needed
- **Gray pages**: No data logged yet

#### How Data is Stored Using Logs
- Page scores calculated from diary entries
- Each time you log an entry, relevant pages updated
- Average marks per page stored
- Recency weighting applied:
  - Recent entries (last 7 days): 2x weight
  - Older entries (7-30 days): 1x weight
  - Very old entries (30+ days): 0.5x weight
- Weighted average rounded to nearest integer
- Stored in database for fast retrieval

#### How Quran Map is Used in Other Places

**1. Time Management (Scheduler)**
- Page strength determines time allocation
- Weaker pages get more revision time
- Stronger pages get less time
- Used to generate weekly schedule

**2. Coach Page**
- Shows current page strength
- Displays weakest pages
- Identifies priority areas
- Guides revision focus

**3. Performance Analytics**
- Visual representation of progress
- Identifies patterns
- Tracks improvement over time
- Highlights problem areas

**4. Mutashabihat**
- Can filter by memorized Surahs
- Uses page data to determine stage
- Helps focus on relevant verses

#### How to Print Quran Map
1. Navigate to Diary page
2. Locate Quran Map section
3. Click "Print Quran Map" button
4. Browser print dialog opens
5. Select printer or save as PDF
6. Print maintains color coding and layout
7. Optimized for A4 paper

**Print Features:**
- High-quality color output
- Maintains page grid layout
- Color legend included
- Date and user info
- Suitable for offline reference

### Marks Calculation

#### Scale: 0-10
- 0: Not attempted
- 1-2: Poor (needs urgent revision)
- 3-4: Fair (needs revision)
- 5-6: Good (acceptable)
- 7-8: Very Good (strong)
- 9-10: Excellent (mastered)

#### Color Coding
- Red (1-2): Urgent attention needed
- Orange (3-4): Needs revision
- Yellow (5-6): Acceptable
- Green (7-8): Strong
- Dark Green (9-10): Mastered

#### Score Color Function
```javascript
const scoreColor = (score) => {
  if (score >= 9) return '#1B4332'; // Excellent - Dark Green
  if (score >= 7) return '#52B788'; // Very Good - Light Green
  if (score >= 5) return '#F1C40F'; // Good - Yellow
  if (score >= 3) return '#E67E22'; // Fair - Orange
  if (score >= 1) return '#C0392B'; // Poor - Red
  return '#9CA3AF'; // Default gray
};
```

### Quran Map

#### Visualization
- 604-page grid (standard Madinah Mushaf)
- Color-coded by average page strength score
- Updates as diary entries are logged

#### Reading the Map
- Green pages (7-10): Strong, minimal revision needed
- Orange pages (3-6): Fair, regular revision needed
- Red pages (1-2): Urgent, intensive revision needed

#### Data Source
- Page scores calculated from diary entries
- Average of all marks for that page
- Weighted by recency (recent entries have more impact)

### Tasks & Targets

#### Status Tracking
- Completed: Task finished
- In Progress: Task ongoing
- Pending: Task not started

#### Integration
- Tasks linked to diary entries
- Progress affects schedule generation
- Visible in performance analytics

### Log History
- Timeline of all diary entries
- Filterable by entry type
- Edit and delete functionality
- Export option

---

## Time Management (Ustadh AI Scheduler)

### How Time Management Works

The Time Management wizard (Ustadh AI Scheduler) generates a personalized weekly Hifz schedule based on your page strength scores, available time, and study preferences. The `/coach` route goes directly to Step 1 of the 8-step wizard (no landing page).

### Adding Your Profile (AQMOS)

#### How to Add Profile
1. Navigate to Coach page (`/coach`)
2. Look for "AQMOS Profile" section in side panel
3. If no profile exists, click "Take Assessment"
4. Complete the learning style assessment (10-15 questions)
5. Submit answers
6. Profile saved to database
7. Profile displayed in side panel

#### Profile Features
- **Learning Style Dimensions**: Visual vs Auditory, Sequential vs Global, Active vs Reflective, Structured vs Flexible
- **Visual Representation**: Bar chart showing scores for each dimension
- **Recommendations**: Personalized study tips based on your style
- **Retake Option**: Can retake assessment anytime (old profile preserved until new saved)

#### Profile Usage
- Influences flashcard recommendations
- Affects schedule personalization
- Guides memory aid suggestions
- Provides study technique tips

### The 8 Steps Explained

#### Step 1: Progress Analysis

**Purpose:** Analyze your current Hifz progress to understand your starting point.

**What It Shows:**
- Completed Siparas (Juz) count
- Current page number
- Overall progress percentage
- Page strength scores heatmap
- Weakest pages identification
- Strongest pages identification

**Data Source:**
- Fetched from backend API: `/coach/wizard/tm/analyze`
- Uses your diary logs to calculate progress
- Analyzes page strength from marks
- Identifies patterns in your memorization

**How to Use:**
1. Review your progress overview
2. Note weakest pages (red/orange)
3. Note strongest pages (green)
4. Click "Continue" to proceed

#### Step 2: Weekly Cycle

**Purpose:** Set how many days per week you dedicate to Quran study.

**Options:**
- 1 day (minimal)
- 2 days (light)
- 3 days (moderate)
- 4 days (regular)
- 5 days (intensive)
- 6 days (very intensive)
- 7 days (daily)

**Logic Behind Weekly Cycle:**
- Determines study frequency in schedule
- Affects how revision units are distributed
- More days = shorter sessions per day
- Fewer days = longer sessions per day
- Cycle data saved to wizard state

**How to Use:**
1. Select number of study days
2. Consider your availability
3. Consider your energy levels
4. Click "Continue" to proceed

#### Step 3: Build My Week

**Purpose:** Add your fixed events (prayers, school, work, etc.) to calculate available study time.

**What Are Events:**
- **Fixed Events**: Recurring events that happen every week (prayers, school, work hours)
- **Weekly Events**: Events that happen on specific days (sports practice, classes)
- **One-time Events**: Handled in Step 4 (Exceptions)

**Default Events:**
- None provided by default
- User must add their own events
- Events persist across sessions (saved to DB per user)
- Deduplication on load prevents duplicates

**How to Add Events:**
1. Click "Add Event" button
2. Enter event title (e.g., "Fajr Prayer", "School")
3. Select days of week (checkboxes for Sunday-Saturday)
4. Set start time
5. Set end time
6. Mark as "Fixed" if it's a permanent commitment
7. Click "Save"
8. Event appears in your weekly routine

**Event Persistence:**
- Events saved to database table `scheduler_events`
- Each event includes: user_id, title, days_of_week, start_time, end_time, is_fixed
- Events loaded on wizard revisit
- Deduplication prevents duplicate entries

**How to Use:**
1. Add all your fixed commitments
2. Add recurring weekly activities
3. Review total time blocked
4. Click "Continue" to proceed

#### Step 4: Exceptions

**Purpose:** Add one-time exceptions (sports tournaments, appointments, etc.) that conflict with your routine.

**What Are Exceptions:**
- One-time events that don't recur weekly
- Temporary conflicts (appointments, exams, trips)
- Special occasions (weddings, family events)
- Any event that affects a specific day only

**How Exceptions Work:**
- Exceptions persisted to localStorage
- Auto-loads on wizard revisit
- Does NOT save to database (temporary)
- Cleared when you start a new wizard session

**How to Add Exceptions:**
1. Click "Add Exception" button
2. Enter exception title (e.g., "Doctor Appointment", "Sports Tournament")
3. Select day (dropdown: Sunday-Saturday)
4. Set start time
5. Set end time
6. Click "Add"
7. Exception appears in list

**Exception Logic:**
- Overrides regular events on that day
- Reduces available study time for that day
- Considered in free time calculation
- Can be deleted before generating schedule

**How to Use:**
1. Add all one-time conflicts for the week
2. Review total exceptions
3. Click "Continue" to proceed

#### Step 5: Review

**Purpose:** Review your weekly routine summary and free time calculation.

**What It Shows:**
- **Fixed Events Count**: Number of fixed events added
- **Weekly Events Count**: Number of weekly events added
- **Exceptions Count**: Number of exceptions added
- **Free Time Per Day**: Available study time for each day
- **Total Free Time**: Sum of free time across all study days

**Free Time Calculation Logic:**
1. Start with 24 hours per day
2. Subtract 8 hours for sleep (480 minutes)
3. Subtract duration of all events for that day
4. Handle overlapping events with interval merging:
   - Sort events by start time
   - Merge overlapping intervals
   - Calculate total merged duration
   - Subtract from remaining time
5. Floor at 0 (no negative free time)
6. Convert to hours and minutes

**Interval Merging Example:**
```
Events: 9:00-10:00, 9:30-10:30
Merged: 9:00-10:30 (90 minutes instead of 120)
```

**How to Use:**
1. Review free time for each day
2. Ensure sufficient time for study
3. Go back to adjust events if needed
4. Click "Continue" to proceed

#### Step 6: Generated Schedule

**Purpose:** View your AI-generated weekly schedule based on page strength scores.

**What It Shows:**
- **Timeline View**: Visual timeline of daily sessions
- **Units View**: Revision units grouped by Sipara
- **Focus Pages View**: Pages needing most attention

**Schedule Generation Algorithm:**
1. **Calculate Free Time**: From Step 5 (24h - sleep - events)
2. **Identify Weaker Pages**: From diary marks (red/orange pages)
3. **Allocate Time per Page by Quality**:
   - Poor (1-2): 5 minutes per page
   - Fair (3-4): 4 minutes per page
   - Good (5-6): 3 minutes per page
   - Very Good (7-8): 2 minutes per page
   - Excellent (9-10): 1 minute per page
4. **Distribute Across Study Days**: Based on weekly cycle from Step 2
5. **Generate Timeline**: Calculate start/end times for each session
6. **Group into Units**: Create revision units (Sipara blocks)

**Data Sources:**
- **Page Strength**: From diary marks (Quran Map)
- **Available Time**: From events and exceptions
- **Study Frequency**: From weekly cycle
- **JUZZ_START_PAGES**: Array mapping Juz to starting page numbers

**Schedule Views:**

**Timeline View:**
- Day-by-day timeline
- Session blocks with time ranges
- Color-coded by quality
- Hover for details

**Units View:**
- Grouped by Sipara (Juz)
- Shows pages in each unit
- Quality distribution
- Total duration

**Focus Pages View:**
- Pages needing most attention
- Sorted by weakness
- Priority ranking

**How to Use:**
1. Review generated schedule
2. Click on units to see details
3. Adjust if needed (Step 7-8)
4. Print schedule for reference
5. Click "Continue" to proceed

#### Step 7: Unit Details

**Purpose:** View detailed breakdown of a specific revision unit.

**What It Shows:**
- **Unit Info**: Sipara number, total duration
- **Page Breakdown**: Each page in the unit with score
- **Quality Distribution**: Count of pages by quality tier
- **Time Allocation**: Time spent on each quality tier

**Actions Available:**
- **Adjust**: Modify time allocation
- **Skip**: Remove this unit from schedule
- **Split**: Divide into smaller units

**How to Use:**
1. Click on any unit in Generated Schedule
2. Review page-by-page breakdown
3. Take action if needed (Adjust/Skip/Split)
4. Return to schedule view
5. Click "Continue" to proceed

#### Step 8: Adjust Unit

**Purpose:** Make specific adjustments to a revision unit.

**Adjustment Options:**

**Reschedule Session:**
- Change day/time
- Move to different time slot
- Adjust duration

**Skip Session:**
- Remove from schedule entirely
- Time freed for other units
- Can be re-added later

**Split Unit:**
- Divide into smaller chunks
- Better for long units
- More manageable sessions

**How Changes Reflect:**
- Schedule updates in real-time
- Timeline adjusts automatically
- Total time recalculated
- Other units may shift

**How to Use:**
1. Select adjustment type
2. Configure new parameters
3. Confirm changes
4. Review updated schedule
5. Save final schedule

### Templates

#### What Are Templates
Templates are pre-configured event sets that can be applied to quickly set up your weekly routine.

#### Default Templates Provided

**1. Student Template**
- School hours (Monday-Friday, 8am-3pm)
- Lunch break (12pm-1pm)
- Homework time (4pm-6pm)
- Suitable for school students

**2. Working Professional Template**
- Work hours (Monday-Friday, 9am-5pm)
- Lunch break (12pm-1pm)
- Commute time (8am-9am, 5pm-6pm)
- Suitable for working adults

**3. Full-Time Hifz Template**
- Morning revision (6am-8am)
- Midday revision (12pm-2pm)
- Evening revision (6pm-8pm)
- Night revision (9pm-11pm)
- Suitable for dedicated students

#### How to Apply Templates
1. In Build My Week step, click "Apply Template"
2. Select template from dropdown
3. Template events loaded into your routine
4. Modify as needed
5. Save your routine

#### How to Edit Templates
1. Apply a template
2. Modify events as needed
3. Add/remove events
4. Adjust times
5. Save as custom template

#### How to Create Your Own Template
1. Build your ideal weekly routine in Build My Week
2. Click "Save as Template"
3. Enter template name
4. Template saved to database
5. Available for future use

#### How to Save Your Template
1. After building your routine, click "Save as Template"
2. Enter template name
3. Template saved to database table `scheduler_templates`
4. Includes: user_id, name, events
5. Available in template dropdown

### How Routine is Created

**Routine Creation Process:**
1. **Events Added**: User adds fixed and weekly events
2. **Exceptions Added**: User adds one-time conflicts
3. **Free Time Calculated**: System calculates available time
4. **Schedule Generated**: AI allocates revision time based on page strength
5. **Units Created**: Revision units grouped by Sipara
6. **Timeline Generated**: Start/end times calculated
7. **Schedule Saved**: Final schedule saved to database

**Routine Logic:**
- Weaker pages get more time
- Stronger pages get less time
- Time distributed across study days
- Sessions fit within free time windows
- No overlapping sessions

### How Quran Time is Allotted in Your Day

**Time Allocation Logic:**

**1. Calculate Total Available Time:**
```
Available Time = 24 hours - Sleep (8h) - Events - Exceptions
```

**2. Calculate Time per Page:**
```
Time per Page = getTimePerPage(pageScore)
- Poor (1-2): 5 minutes
- Fair (3-4): 4 minutes
- Good (5-6): 3 minutes
- Very Good (7-8): 2 minutes
- Excellent (9-10): 1 minute
```

**3. Calculate Sipara Duration:**
```
Sipara Duration = Sum(Time per Page for all 20 pages)
```

**4. Distribute Across Study Days:**
```
Daily Study Time = Available Time / Study Days
```

**5. Create Revision Units:**
- Group pages by Sipara
- Calculate total duration per Sipara
- Fit units into daily time slots
- Adjust to fit within available windows

**Example:**
- Available time: 2 hours per day
- Study days: 5 days
- Total weekly study time: 10 hours
- Weaker pages (score 2): 5 min/page
- Stronger pages (score 9): 1 min/page
- Schedule prioritizes weaker pages

### How to Print Your Quran Schedule

**Step-by-Step Process:**
1. Navigate to Generated Schedule step (Step 6)
2. Click "Print / Download Schedule" button
3. Choose option:
   - **Print**: Opens browser print dialog
   - **Download PDF**: Generates PDF file
4. Print/PDF shows:
   - 7-day grid layout (Sunday-Saturday)
   - Time, Sipara, Duration columns
   - Single landscape page
   - Legend: "Page quality details available in Quran Map"
5. Select printer or save location
6. Print/Download completes

**Print Features:**
- **Layout**: 7-day side-by-side grid
- **Orientation**: Landscape (A4)
- **Columns**: Time, Sipara, Duration
- **Quality Details**: Referenced in Quran Map (not in print)
- **Auto-fit**: Columns adjust to page width
- **High Quality**: Optimized for printing

**Technical Details:**
- Component: `PrintableSchedule.jsx`
- PDF generation: html2pdf.js
- CSS Grid: `repeat(7, 1fr)`
- Font sizes: Optimized for readability
- Color scheme: Black text on white background

### Schedule Generation Logic

#### Time per Page by Quality
- Poor (1-2): 5 minutes
- Fair (3-4): 4 minutes
- Good (5-6): 3 minutes
- Very Good (7-8): 2 minutes
- Excellent (9-10): 1 minute

#### Algorithm
1. Calculate free time per day (24h - sleep - events)
2. Identify weaker pages from diary marks
3. Allocate more time to weaker pages
4. Distribute across study days
5. Generate timeline with start/end times

#### Data Sources
- Diary marks for page strength
- Events for time availability
- Weekly cycle for study frequency
- Exceptions for one-time conflicts

### Printable Schedule

#### Layout
- 7-day side-by-side grid
- Single landscape page
- 3 columns per day: Time, Sipara, Duration
- Quality category details in Quran Map
- Legend: "Page quality details available in Quran Map"

#### Generation
- Uses html2pdf.js library
- Landscape orientation (A4)
- Auto-fit columns
- PDF download option

---

## Printables

### Printable Schedule

#### Purpose
Generate a weekly schedule for offline reference or printing.

#### Features
- 7-day grid layout (Sunday-Saturday)
- Single landscape page
- Time, Sipara, Duration columns
- Quality category details in Quran Map (not in print)
- Legend note for quality reference

#### Technical Details
- Component: `PrintableSchedule.jsx`
- PDF generation: html2pdf.js
- Orientation: Landscape
- Format: A4
- CSS Grid: `repeat(7, 1fr)`

#### Usage
1. Navigate to Generated Schedule step
2. Click "Print / Download Schedule"
3. Choose Print (browser print dialog) or Download PDF
4. Print/PDF shows all 7 days on single landscape page

### Flowchart Printing

#### Purpose
Print flashcard flowcharts for offline study.

#### Features
- Print support for Memory Aid flowcharts
- Snake layout (boustrophedon) with horizontal wrapping
- Alternating row direction (RTL/LTR) for natural reading flow
- Supports both Portrait and Landscape orientations
- Box-per-row count adapts to available page width
- Maintains visual connections
- High-quality output
- Works for both built-in and user-created sets

---

## Streak Banner

### Purpose
Motivate consistent daily diary logging with themed milestones.

### Streak Calculation

#### Day of Year Index
```javascript
function dayOfYearIndex() {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((today - startOfYear) / 86_400_000);
}
```

- Uses UTC to be timezone-independent
- Advances at midnight (not mid-day)
- Previous bug: mixed UTC and local time causing mid-day advances

### Streak Tiers

| Tier | Min Streak | Title | Description | Color | Emoji |
|------|-----------|-------|-------------|-------|-------|
| 0 | 0 | Getting Started | Start your journey today | #9CA3AF | 🌱 |
| 1 | 3 | Building Momentum | You're on the right track | #F59E0B | ⚡ |
| 2 | 7 | On Fire! | Consistency is key | #DC2626 | 🔥 |
| 3 | 14 | Unstoppable | Nothing can stop you | #7C3AED | 💪 |
| 4 | 30 | Hifz Legend | You've mastered consistency | #059669 | 👑 |
| 5 | 60 | Quran Master | Truly exceptional dedication | #1B4332 | 🏆 |
| 6 | 100 | Immortal | Your dedication is legendary | #C9A84C | ⭐ |

### Progress Calculation

```javascript
const progress = nextTier 
  ? Math.min(100, ((streak - currentTier.minStreak) / (nextTier.minStreak - currentTier.minStreak)) * 100)
  : 100;
```

- Shows progress bar toward next tier
- Displays "X days to [Next Tier Title]"
- Max tier (100+) shows 100% progress

### Streak Behavior

- Incremented when diary entry logged on consecutive days
- Missed day = streak freezes (not reset)
- Streak unfreezes when logging resumes
- Stored in database per user
- Fetched via `getStreak()` API call

### Component
- File: `frontend/src/shared/components/StreakBanner.jsx`
- Styles: `frontend/src/styles/StreakBanner.css`
- API: `frontend/src/shared/services/taskApi.js`

---

## Daily Quotes

### Purpose
Provide daily Islamic inspiration and wisdom.

### Data Structure

Array of quote objects with Arabic and English text:

```javascript
{
  arabic: "اَلْقُرْآنُ هُوَ الدَّوَاءُ وَالدُّعَاءُ هُوَ الْعِبَادَةُ",
  english: "Al-Quran itself is the cure and du'aa' itself is 'ibaadat."
}
```

### Categories

#### 1. Directly Refers to the Qur'an
- Quotes about Quran's healing power
- Importance of teaching and learning Quran

#### 2. Directly Refers to Allah
- Quotes about Allah's attributes
- Trust in Allah's will
- Allah's provision and guidance

#### 3. Character & Manners (Akhlaq)
- Quotes about good character
- Patience, generosity, humility
- Social conduct and relationships

### Selection Logic

```javascript
const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = dayOfYearIndex();
  return dailyQuotes[dayOfYear % dailyQuotes.length];
};
```

- Rotates based on day of year
- Cycles through all quotes annually
- Consistent quote for all users on same day

### Display

- Shown on home page
- Islamic card design
- Arabic text with English translation
- Updates daily at midnight
- **User-scoped visibility**: Each user sees the splash screen independently based on their username (localStorage key: `lastQuoteDate_${username}`)

### Data File
- Location: `frontend/src/shared/data/dailyQuotes.js`
- Total quotes: 100+
- Categories: 3 main categories

---

## Marks Calculation Logic

### Diary Entry Marks

#### Scale: 0-10

**Score Interpretation:**
- **0**: Not attempted
- **1-2**: Poor - Urgent revision needed
- **3-4**: Fair - Regular revision needed
- **5-6**: Good - Acceptable retention
- **7-8**: Very Good - Strong retention
- **9-10**: Excellent - Mastered

#### Color Coding Function

```javascript
const scoreColor = (score) => {
  if (score === null || score === undefined) return '#9CA3AF';
  if (score >= 9) return '#1B4332'; // Excellent - Dark Green
  if (score >= 7) return '#52B788'; // Very Good - Light Green
  if (score >= 5) return '#F1C40F'; // Good - Yellow
  if (score >= 3) return '#E67E22'; // Fair - Orange
  if (score >= 1) return '#C0392B'; // Poor - Red
  return '#9CA3AF'; // Default gray
};
```

#### Input Validation
- Minimum: 0
- Maximum: 10
- Type: Number
- Default: 0 (if not provided)

### Page Strength Calculation

#### Algorithm

1. **Fetch all diary entries for a page**
   - Query database for entries containing the page
   - Filter by date range (recent entries weighted more)

2. **Calculate average score**
   ```javascript
   const average = entries.reduce((sum, entry) => sum + entry.marks, 0) / entries.length;
   ```

3. **Apply recency weighting**
   - Recent entries (last 7 days): 2x weight
   - Older entries (7-30 days): 1x weight
   - Very old entries (30+ days): 0.5x weight

4. **Round to nearest integer**
   ```javascript
   const pageStrength = Math.round(weightedAverage);
   ```

#### Quran Map Visualization
- Page strength determines color
- Updates in real-time as entries are logged
- Used by scheduler for time allocation

### Schedule Time Allocation

#### Time per Page by Quality

```javascript
const getTimePerPage = (score) => {
  if (score === null || score === undefined) return 0;
  if (score >= 9) return 1;  // Excellent: 1 min
  if (score >= 7) return 2;  // Very Good: 2 min
  if (score >= 5) return 3;  // Good: 3 min
  if (score >= 3) return 4;  // Fair: 4 min
  if (score >= 1) return 5;  // Poor: 5 min
  return 3; // Default: 3 min
};
```

#### Sipara Duration Calculation

```javascript
const calculateSiparaDuration = (siparaNumber, heatmapData) => {
  const pageScores = {};
  const startPage = JUZZ_START_PAGES[siparaNumber - 1] || 1;
  
  // Map heatmap data to page scores
  heatmapData.forEach(entry => {
    if (entry.juz === siparaNumber) {
      const relativePage = entry.page - startPage + 1;
      if (relativePage >= 1 && relativePage <= 20) {
        pageScores[relativePage] = entry.score;
      }
    }
  });
  
  // Sum time per page
  const pages = Array.from({ length: 20 }, (_, i) => i + 1);
  return pages.reduce((sum, page) => {
    const score = pageScores[page];
    if (score === null || score === undefined) return sum;
    return sum + getTimePerPage(score);
  }, 0);
};
```

---

## Memory Aids

### Flashcard Memory Aid System

#### 3 Tabs

**1. Flowchart Tab**
- Visual representation of Ayah sequence
- Shows connections between consecutive Ayahs
- Always fetches live Quran data
- Print support for offline study

**2. First/Key Words Tab**
- Displays first words of each Ayah
- Key words highlighted for emphasis
- Helps with recognition memory
- Useful for sequence memorization

**3. AI Story Tab**
- AI-generated narrative connecting Ayahs using simple visualizable imagery (sun, moon, mother, land, sky, etc.)
- Uses Groq API (llama-3.3-70b-versatile)
- Story saved per user/flashcard set
- Never regenerated once saved
- Editable by user

#### Data Flow

```
User creates flashcard set
→ Quran API fetches Ayah data
→ Flowchart generated from live data
→ AI Story generated via Groq API
→ Story saved to database
→ Memory Aid tabs populated
```

### Mutashabihat Memory Tips

#### Manual Entry
- User creates tips manually via ✏️ pencil icon
- Tips saved to database per user
- User can edit tips anytime
- Edits saved to database, replacing previous version

#### Content
- Word-level differences highlighted
- Contextual explanations
- Mnemonic suggestions
- Structural pattern analysis

### Built-in Mnemonics

#### "Travel Through the Earth" Mnemonic
- Verse: أفلم يسيروا في الأرض
- Mnemonic: غفر الله للحج محمد يوسف
- Identifies 4 Surahs containing the verse

#### Singular vs Plural Fruit Rule
- Singular Surah name → فاكهة
- Plural Surah name → فواكه
- Examples provided in flashcard data

#### Sabbaha vs Yusabbihu Rule
- First letter without dots → سبح
- First letter with dots → يسبح
- Examples: Al‑Ḥadīd vs At‑Taghābun

#### رجل and القسط Placement Rule
- رجل: Al‑Qaṣaṣ (early), Yā Sīn (later)
- القسط: An‑Nisā’ (early), Al‑Mā’idah (later)

---

## AQMOS Profile

### Purpose
Assess and store user's learning style for personalized recommendations.

### Assessment

#### Learning Style Dimensions
- Visual vs Auditory preference
- Sequential vs Global processing
- Active vs Reflective learning
- Structured vs Flexible approach

#### Questions
- Multiple choice format
- 10-15 questions
- Takes 5-10 minutes
- No time limit

### Profile Storage

#### Database Schema
- User ID
- Learning style scores
- Assessment date
- Profile version

#### Display
- Shown in side panel
- Visual representation of scores
- Recommendations based on style

### Retake Option

#### Behavior
- Old profile preserved until new saved
- Can retake anytime
- Comparison with previous profile
- Track changes over time

### Integration

#### Uses
- Flashcard recommendations
- Schedule personalization
- Memory aid suggestions
- Study technique tips

---

## Color Theme

### Primary Colors

- **Deep Green**: #1B4332
- **Forest Green**: #2D6A4F
- **Mint Green**: #52B788
- **Islamic Gold**: #C9A84C
- **Cream White**: #F5F0E8
- **Warm Sand**: #E8DCC8

### Accent Colors

- **Ruby Accent**: #C0392B (errors only)
- **Success Green**: #059669
- **Warning Orange**: #F59E0B
- **Info Blue**: #3B82F6

### Neutral Colors

- **Gray 100**: #F3F4F6
- **Gray 200**: #E5E7EB
- **Gray 300**: #D1D5DB
- **Gray 400**: #9CA3AF
- **Gray 500**: #6B7280
- **Gray 600**: #4B5563
- **Gray 700**: #374151
- **Gray 800**: #1F2937
- **Gray 900**: #111827

### Usage Guidelines

- Primary colors for main UI elements
- Accent colors for actions and states
- Neutral colors for text and borders
- Islamic Gold for highlights and special elements
- Deep Green for primary branding

---

## Quick Start

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Backend Setup

```bash
cd backend
copy .env.example .env
```

Set `JWT_SECRET` and `GROQ_API_KEY` in `backend/.env`

### Initialize Database

```bash
npm run backend:setup
```

This applies schema, migrations, and imports Quran data.

### Start Development Servers

**Backend (with nodemon):**
```bash
npm run backend:dev
```

**Frontend:**
```bash
npm run frontend
```

Or from project root:
```bash
npm run backend:dev
npm run frontend
```

### Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## Useful Scripts

### From Project Root

```bash
npm run frontend       # Start React dev server
npm run backend        # Start Express API
npm run backend:dev    # Start Express API with nodemon
npm run backend:setup  # Apply schema/migrations and import ayah data
npm run build          # Build frontend for production
```

### Backend-Only Checks

```bash
cd backend
npm run check:db       # Check database integrity
npm run check:streak   # Check streak calculation
```

### Production Build

```bash
npm run build
cd frontend
npm start
```

---

## File Structure

### Frontend

```
frontend/
├── src/
│   ├── features/
│   │   ├── analytics/          # Performance analytics
│   │   ├── auth/               # Authentication pages
│   │   ├── coach/              # Time Management wizard
│   │   ├── diary/              # Hifz diary
│   │   ├── flashcards/         # Flashcards system
│   │   ├── scheduler/          # Scheduler components
│   │   ├── similarity/         # Mutashabihat search
│   │   └── tasks/              # Task management
│   ├── shared/
│   │   ├── components/         # Shared UI components
│   │   ├── context/            # React contexts
│   │   ├── data/               # Static data (quotes, etc.)
│   │   ├── services/           # API services
│   │   ├── styles/             # Global styles
│   │   └── utils/              # Utility functions
│   ├── App.js                  # Main app component
│   └── index.js                # Entry point
```

### Backend

```
backend/
├── src/
│   ├── controllers/            # Route controllers
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── scripts/                # Utility scripts
│   ├── services/               # Business logic
│   └── utils/                  # Utility functions
├── migrations/                 # Database migrations
├── schema.sql                  # Database schema
└── server.js                   # Express server
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user

### Diary
- `GET /diary/logs` - Get user's diary logs
- `POST /diary/logs` - Create diary entry
- `PUT /diary/logs/:id` - Update diary entry
- `DELETE /diary/logs/:id` - Delete diary entry
- `GET /diary/streak` - Get user's streak

### Flashcards
- `GET /flashcards/user-sets` - Get user's flashcard sets
- `POST /flashcards/user-sets` - Create flashcard set
- `GET /flashcards/user-sets/:id` - Get specific set
- `DELETE /flashcards/user-sets/:id` - Delete set
- `PATCH /flashcards/user-sets/:id` - Rename set

### Similarity
- `POST /similarity/search` - Search for similar verses
- `GET /similarity/tips/:pairId` - Get memory tip for pair
- `PUT /similarity/tips/:pairId` - Update memory tip

### Scheduler
- `GET /scheduler/events` - Get user's events
- `POST /scheduler/events` - Create event
- `PUT /scheduler/events/:id` - Update event
- `DELETE /scheduler/events/:id` - Delete event
- `POST /scheduler/schedule/generate` - Generate schedule
- `GET /scheduler/schedule/current` - Get current schedule

### AQMOS
- `GET /aqmos/profile` - Get user's AQMOS profile
- `POST /aqmos/profile` - Save AQMOS profile

---

## Database Schema

### Key Tables

#### users
- id, username, email, password_hash, created_at

#### diary_logs
- id, user_id, type, date, marks, notes, metadata

#### flashcard_sets
- id, user_id, name, type, config, created_at

#### flashcard_cards
- id, set_id, front, back, order

#### similarity_tips
- id, user_id, pair_id, tip, created_at

#### scheduler_events
- id, user_id, title, days_of_week, start_time, end_time, is_fixed

#### aqmos_profiles
- id, user_id, scores, created_at

---

## Known Issues & Limitations

### Current Limitations
- Quran Map uses 604-page Madinah Mushaf format only
- AI tips require internet connection (Groq API)
- Schedule generation limited to 7-day weekly cycle
- Flashcard AI stories may take time to generate

### Recently Fixed
- Streak calculation now uses UTC consistently
- Schedule exceptions now persist to localStorage
- Printable schedule now fits on single landscape page
- Quran Map print CSS scoped to avoid global clipping

### In Progress
- Performance analytics enhancements
- Additional flashcard categories
- More mnemonic systems
- Advanced scheduling options

---

---

## Troubleshooting

### Common Issues and Solutions

#### Tour Not Starting

**Problem:** Tour doesn't auto-start for new users.

**Solutions:**
1. Check localStorage for `hifz_tour_completed` flag
   - Open browser DevTools → Application → Local Storage
   - If flag exists, delete it and refresh
2. Clear browser cache and cookies
3. Check console for JavaScript errors
4. Verify TourContext is properly mounted
5. Ensure user is logged in (if required)

**Debug Steps:**
```javascript
// In browser console:
localStorage.getItem('hifz_tour_completed')
// Should return null for new users
```

#### Schedule Not Generating

**Problem:** Generated Schedule step shows no results.

**Solutions:**
1. Verify diary entries exist (schedule needs page strength data)
2. Check that events are properly saved
3. Ensure weekly cycle is set (Step 2)
4. Verify free time calculation is positive
5. Check backend API endpoint: `/coach/wizard/tm/analyze`

**Debug Steps:**
- Open Network tab in DevTools
- Check API responses for errors
- Review wizard state in React DevTools
- Verify heatmap data is populated

#### Streak Not Updating

**Problem:** Streak count doesn't increase after logging entry.

**Solutions:**
1. Verify entry was saved successfully
2. Check UTC time calculation (should be midnight UTC)
3. Verify streak API endpoint: `/diary/streak`
4. Check database for streak records
5. Refresh page after saving entry

**Debug Steps:**
```javascript
// Check streak calculation:
console.log(new Date().toISOString())
// Should show current UTC time
```

#### API Errors (429 Rate Limit)

**Problem:** "Too many requests" error when using AI features.

**Solutions:**
1. Wait for cooldown period (typically 1 minute)
2. Click retry button when it appears
3. Reduce frequency of AI requests
4. Check API key quota
5. Verify GROQ_API_KEY is valid

#### Quran Map Not Loading

**Problem:** Quran Map shows all gray or doesn't render.

**Solutions:**
1. Verify diary entries exist with page data
2. Check page strength calculation
3. Refresh page after logging new entries
4. Check browser console for rendering errors
5. Verify Quran API is accessible

#### Flashcards Not Saving

**Problem:** Flashcard set not saved after creation.

**Solutions:**
1. Check internet connection (Quran API required)
2. Verify user is logged in
3. Check API endpoint: `/flashcards/user-sets`
4. Review console for error messages
5. Ensure set name is not empty

#### Print/PDF Not Working

**Problem:** Print dialog doesn't open or PDF fails to generate.

**Solutions:**
1. Check html2pdf.js library is loaded
2. Verify print element ref is properly set
3. Check browser print permissions
4. Try different browser (Chrome/Firefox recommended)
5. Disable ad blockers that might interfere

#### Exceptions Not Persisting

**Problem:** Exceptions disappear after page refresh.

**Solutions:**
1. Verify localStorage is enabled
2. Check for localStorage quota exceeded
3. Review console for localStorage errors
4. Clear localStorage and try again
5. Verify exceptions are being saved to correct key

### Browser-Specific Issues

**Chrome:**
- Clear cache: Ctrl+Shift+Delete
- Disable extensions that might interfere
- Check for CORS errors in DevTools

**Firefox:**
- Check for strict CSP settings
- Verify localStorage permissions
- Disable tracking protection if needed

**Safari:**
- Enable localStorage in preferences
- Check for ITP (Intelligent Tracking Prevention)
- Clear website data

### Getting Help

If issues persist:
1. Check this documentation first
2. Review console error messages
3. Verify API endpoints are responding
4. Test with fresh data
5. Report issue with:
   - Browser and version
   - Steps to reproduce
   - Console errors
   - Expected vs actual behavior

---

## FAQ

### General Questions

**Q: Can I change my streak?**
A: No, streaks are calculated automatically based on consecutive days of diary logging. You cannot manually edit streaks, but you can maintain or improve them by logging entries daily.

**Q: How do I reset my progress?**
A: Currently, there's no built-in progress reset. To reset, you would need to:
- Delete your diary entries (contact admin for data deletion)
- Clear localStorage
- Create a new account

**Q: Is my data backed up?**
A: Data is stored in a SQLite database on the server. Regular backups should be configured by your system administrator. For personal backups, export your diary entries periodically.

**Q: Can I use the app offline?**
A: Partially. Some features work offline (viewing cached data), but most features require internet connection for:
- AI-powered features (memory tips, stories)
- Quran API calls
- Database operations

### Feature-Specific Questions

**Q: How accurate is the Mutashabihat search?**
A: The search identifies verses with 3+ consecutive matching words in the same order. While this catches many similar verses, it may not catch all types of similarities. The similarity score (0-100) helps prioritize results.

**Q: Can I share my flashcard sets with others?**
A: Currently, flashcard sets are personal and cannot be shared. This feature may be added in future updates.

**Q: How do I change my AQMOS profile?**
A: Go to Coach page, find AQMOS Profile in side panel, click "Retake Assessment". Your old profile is preserved until you save the new one.

**Q: What happens if I miss a day of logging?**
A: Your streak freezes (not resets). When you log an entry again, your streak unfreezes and continues from where it left off.

**Q: Can I customize the time per page allocation?**
A: Currently, time per page is fixed based on quality scores (Poor=5min to Excellent=1min). Custom time allocation may be added in future updates.

**Q: How do I print only specific days from my schedule?**
A: Currently, the printable schedule shows all 7 days. To print specific days, you would need to use browser print settings to select specific pages or take screenshots.

**Q: Can I import/export my diary data?**
A: Currently, there's no built-in import/export. This feature is planned for future updates.

### Technical Questions

**Q: What browsers are supported?**
A: Chrome, Firefox, Safari, and Edge (latest versions). Internet Explorer is not supported.

**Q: Is my data secure?**
A: Yes, passwords are hashed using bcrypt. API keys are stored in environment variables. All data transmission uses HTTPS in production.

**Q: How much storage do I need?**
A: The app itself is lightweight (~50MB). Your data storage depends on usage:
- Diary entries: ~1KB per entry
- Flashcard sets: ~5KB per set
- Memory tips: ~2KB per tip

**Q: Can I use the app on mobile?**
A: Yes, the app is responsive and works on mobile browsers. A dedicated mobile app is planned for future development.

**Q: How often is the Quran data updated?**
A: Quran data is imported from a reliable source during database setup. Updates are rare as Quran text doesn't change.

### Account Questions

**Q: Can I have multiple accounts?**
A: Yes, you can create multiple accounts with different email addresses. Each account has its own data.

**Q: How do I delete my account?**
A: Contact the administrator for account deletion. All your data will be permanently removed.

**Q: Can I change my email?**
A: Currently, email change is not supported. This feature may be added in future updates.

**Q: What happens if I forget my password?**
A: Use the "Forgot Password" link on the login page. You'll receive an email with reset instructions.

---

## Deployment Guide

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Database (SQLite for development, PostgreSQL/MySQL for production)
- Cloud hosting account (Vercel, Netlify, AWS, etc.)

### Environment Variables

Create `.env` file in backend directory:

```bash
# Backend
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
GROQ_API_KEY=your-groq-api-key
DATABASE_URL=your-database-connection-string

# Frontend (if using separate deployment)
REACT_APP_API_URL=https://your-api-domain.com
```

### Deployment Options

#### Option 1: Vercel (Recommended for Frontend)

**Frontend Deployment:**
1. Install Vercel CLI: `npm i -g vercel`
2. Build frontend: `npm run build`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard
5. Configure custom domain

**Backend Deployment:**
1. Use Vercel Functions or deploy separately
2. For separate deployment, use Railway, Render, or AWS
3. Set DATABASE_URL for production database
4. Configure CORS for frontend domain

#### Option 2: Netlify

**Frontend Deployment:**
1. Build frontend: `npm run build`
2. Connect Netlify to GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `frontend/build`
4. Set environment variables in Netlify dashboard
5. Add `_redirects` file for API proxy

**Backend Deployment:**
1. Deploy backend to Railway, Render, or AWS
2. Set environment variables
3. Configure CORS for Netlify domain

#### Option 3: AWS (Full Stack)

**Frontend (S3 + CloudFront):**
1. Build frontend: `npm run build`
2. Upload `build` folder to S3 bucket
3. Configure CloudFront CDN
4. Set up custom domain with Route 53
5. Enable HTTPS with ACM certificate

**Backend (EC2 + RDS):**
1. Launch EC2 instance (Ubuntu)
2. Install Node.js and dependencies
3. Set up RDS database (PostgreSQL)
4. Configure security groups
5. Use PM2 for process management
6. Set up Nginx as reverse proxy
7. Configure SSL with Let's Encrypt

#### Option 4: Docker Deployment

**Dockerfile (Backend):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run backend:setup
EXPOSE 5000
CMD ["node", "server.js"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/hifz
      - JWT_SECRET=${JWT_SECRET}
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - db
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=hifz
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

### Database Setup for Production

**PostgreSQL:**
```bash
# Create database
createdb hifz_quran

# Run schema
psql hifz_quran < backend/schema.sql

# Run migrations
psql hifz_quran < backend/migrations/001_initial.sql
```

**MySQL:**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE hifz_quran;"

# Run schema
mysql -u root -p hifz_quran < backend/schema.sql
```

### SSL/HTTPS Configuration

**Let's Encrypt (Ubuntu/NGINX):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Vercel/Netlify:**
- HTTPS is automatic
- SSL certificates managed by platform

### Monitoring and Logging

**Recommended Tools:**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Google Analytics**: User analytics
- **New Relic**: Performance monitoring

**Basic Logging:**
```javascript
// Backend
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrated
- [ ] SSL/HTTPS enabled
- [ ] CORS configured
- [ ] API endpoints tested
- [ ] Frontend build verified
- [ ] Error monitoring set up
- [ ] Backup strategy configured
- [ ] Domain configured
- [ ] DNS propagated
- [ ] Load testing performed
- [ ] Security audit completed

---

## Security Considerations

### Authentication & Authorization

**JWT Implementation:**
- JWTs signed with secret key (stored in environment variables)
- Token expiration: 7 days
- Refresh token mechanism recommended for production
- Tokens stored in httpOnly cookies (more secure than localStorage)

**Password Security:**
- Passwords hashed using bcrypt (salt rounds: 10)
- Minimum password length: 8 characters
- Password complexity requirements enforced
- Never store plain text passwords

**Session Management:**
- Sessions expire after inactivity
- Logout invalidates tokens server-side
- Concurrent session limits (optional)

### API Security

**Rate Limiting:**
```javascript
// Express rate limiting example
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

**Input Validation:**
- Validate all user inputs
- Sanitize data before database operations
- Use parameterized queries to prevent SQL injection
- Validate file uploads (type, size)

**CORS Configuration:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Data Protection

**Encryption at Rest:**
- Database encryption (if supported by DB)
- Environment variables for sensitive data
- Never commit secrets to version control

**Encryption in Transit:**
- HTTPS mandatory in production
- TLS 1.2 or higher
- Valid SSL certificates
- HSTS headers enabled

**Data Minimization:**
- Collect only necessary data
- Regularly audit data collection
- Provide data export/deletion options

### API Key Security

**Best Practices:**
- Never expose API keys in frontend code
- Use proxy server for API calls
- Rotate API keys regularly
- Use different keys for development/production
- Monitor API key usage

**Groq API Security:**
```javascript
// Backend proxy for Groq API
app.post('/api/coach/chat', async (req, res) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Server-side only
    },
    body: JSON.stringify(req.body)
  });
  // ... handle response
});
```

### Common Vulnerabilities

**SQL Injection:**
- Use parameterized queries
- Validate and sanitize inputs
- Use ORM (Sequelize, TypeORM)

**XSS (Cross-Site Scripting):**
- Sanitize user-generated content
- Use Content Security Policy (CSP)
- Escape HTML in React (automatic)

**CSRF (Cross-Site Request Forgery):**
- Use CSRF tokens for state-changing operations
- Validate Origin and Referer headers
- SameSite cookie attribute

**File Upload Security:**
- Validate file types
- Limit file sizes
- Scan uploads for malware
- Store uploads outside web root

### Security Headers

```javascript
// Helmet middleware for security headers
const helmet = require('helmet');
app.use(helmet());

// Custom headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### Security Auditing

**Recommended Tools:**
- **npm audit**: Check for vulnerable dependencies
- **Snyk**: Dependency vulnerability scanning
- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Security testing tool

**Regular Tasks:**
- Update dependencies regularly
- Run security scans before deployment
- Review access logs
- Monitor for suspicious activity
- Conduct penetration testing

---

## Browser Compatibility

### Supported Browsers

**Desktop Browsers:**
- **Chrome**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

**Mobile Browsers:**
- **Chrome Mobile**: Latest
- **Safari iOS**: 14+
- **Samsung Internet**: Latest
- **Firefox Mobile**: Latest

**Unsupported:**
- Internet Explorer (any version)
- Opera Mini
- UC Browser (known issues)

### Browser-Specific Features

**Chrome:**
- Full feature support
- Best performance
- Recommended for development

**Firefox:**
- Full feature support
- Excellent DevTools
- Some CSS rendering differences

**Safari:**
- Full feature support
- ITP may affect localStorage
- Different default fonts
- Print dialog behavior differs

**Edge:**
- Full feature support
- Similar to Chrome
- Good performance

### Known Browser Issues

**Safari ITP (Intelligent Tracking Prevention):**
- May clear localStorage after 7 days
- Solution: Use IndexedDB for critical data
- Warn users about potential data loss

**Firefox CSS Rendering:**
- Flexbox gap not supported in older versions
- Solution: Use polyfills or alternative layouts
- Test thoroughly on Firefox

**Mobile Safari:**
- 100vh height includes address bar
- Solution: Use CSS custom properties
- Test responsive design on iOS devices

**Chrome Autocomplete:**
- May interfere with custom forms
- Solution: Use `autocomplete="off"` where needed
- Test form interactions

### Polyfills and Fallbacks

**Required Polyfills:**
```javascript
// package.json
{
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

**Optional Polyfills:**
- `core-js` for older JavaScript features
- `whatwg-fetch` for fetch API
- `react-app-polyfill` for React support

### Testing Across Browsers

**Manual Testing:**
1. Test on Chrome (baseline)
2. Test on Firefox (CSS differences)
3. Test on Safari (localStorage issues)
4. Test on Edge (Chromium-based)
5. Test on mobile browsers

**Automated Testing:**
- BrowserStack for cross-browser testing
- Selenium for automated tests
- Cypress for E2E testing

### Progressive Enhancement

**Graceful Degradation:**
- Core features work without JavaScript
- Enhanced features with JavaScript
- Fallbacks for unsupported APIs

**Feature Detection:**
```javascript
if ('serviceWorker' in navigator) {
  // Register service worker
}

if ('localStorage' in window) {
  // Use localStorage
} else {
  // Use fallback (IndexedDB)
}
```

---

## Testing Guide

### Unit Testing

**Setup:**
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Example Test:**
```javascript
// frontend/src/features/diary/__tests__/DiaryPage.test.js
import { render, screen } from '@testing-library/react';
import DiaryPage from '../DiaryPage';

describe('DiaryPage', () => {
  test('renders diary entry tabs', () => {
    render(<DiaryPage />);
    expect(screen.getByText('MURAJAH')).toBeInTheDocument();
    expect(screen.getByText('TASMEE')).toBeInTheDocument();
  });
});
```

**Run Tests:**
```bash
npm test
```

### Integration Testing

**API Testing:**
```javascript
// backend/src/tests/api.test.js
const request = require('supertest');
const app = require('../server');

describe('Diary API', () => {
  test('GET /diary/logs returns user logs', async () => {
    const response = await request(app)
      .get('/diary/logs')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
  });
});
```

### End-to-End Testing

**Cypress Setup:**
```bash
npm install --save-dev cypress
```

**Example Test:**
```javascript
// cypress/e2e/diary.spec.js
describe('Diary Flow', () => {
  it('should save a diary entry', () => {
    cy.visit('/diary');
    cy.get('[data-testid="murajah-tab"]').click();
    cy.get('[data-testid="surah-input"]').type('2');
    cy.get('[data-testid="save-button"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
```

**Run E2E Tests:**
```bash
npx cypress open
```

### Testing Best Practices

**Unit Tests:**
- Test individual functions and components
- Mock external dependencies
- Keep tests fast and isolated
- Aim for high code coverage

**Integration Tests:**
- Test component interactions
- Test API endpoints
- Use test database
- Clean up after tests

**E2E Tests:**
- Test critical user flows
- Test across browsers
- Use realistic test data
- Keep tests maintainable

### Test Coverage

**Generate Coverage Report:**
```bash
npm test -- --coverage
```

**Target Coverage:**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

### Continuous Integration

**GitHub Actions Example:**
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run build
```

---

## Development Workflow

### Git Workflow

**Branching Strategy:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `hotfix/*`: Urgent production fixes

**Commit Conventions:**
```
feat: add user authentication
fix: resolve streak calculation bug
docs: update README
style: format code
refactor: simplify component structure
test: add unit tests
chore: update dependencies
```

**Pull Request Process:**
1. Create feature branch from `develop`
2. Make changes and commit
3. Push to remote
4. Create pull request
5. Request code review
6. Address feedback
7. Merge to `develop`
8. Delete feature branch

### Code Review Guidelines

**Before Submitting PR:**
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Accessibility checked

**Review Checklist:**
- [ ] Code is readable and maintainable
- [ ] No security vulnerabilities
- [ ] Performance is acceptable
- [ ] Error handling is proper
- [ ] Tests are comprehensive

### Development Environment

**VS Code Extensions:**
- ESLint
- Prettier
- GitLens
- React/Redux snippets
- Tailwind CSS IntelliSense

**Pre-commit Hooks:**
```bash
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**lint-staged Configuration:**
```json
{
  "lint-staged": {
    "*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{css,scss}": ["prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

### Code Style

**JavaScript/React:**
- Use functional components with hooks
- Prefer const over let
- Use arrow functions
- Destructure props and state
- Use meaningful variable names

**CSS:**
- Use Tailwind CSS utility classes
- Follow BEM for custom CSS
- Use CSS variables for theming
- Mobile-first responsive design

**Comments:**
- Comment complex logic
- Document API endpoints
- Explain non-obvious decisions
- Keep comments up-to-date

### Debugging

**Frontend Debugging:**
- React DevTools for component inspection
- Redux DevTools for state management
- Network tab for API calls
- Console for error messages

**Backend Debugging:**
- Node.js debugger
- Winston for logging
- Postman for API testing
- Database query logs

### Performance Profiling

**Frontend:**
- React Profiler for component performance
- Lighthouse for overall performance
- Network tab for load times
- Bundle size analysis

**Backend:**
- Node.js profiler
- Database query analysis
- API response time monitoring
- Memory usage tracking

---

## Performance Optimization

### Frontend Optimization

**Code Splitting:**
```javascript
// Lazy load components
const FlashcardsPage = React.lazy(() => import('./features/flashcards/FlashcardsPage'));
const DiaryPage = React.lazy(() => import('./features/diary/DiaryPage'));
```

**Bundle Size Reduction:**
- Tree shaking (remove unused code)
- Minification (production build)
- Gzip compression
- Image optimization

**Image Optimization:**
- Use WebP format
- Lazy load images
- Responsive images with srcset
- Compress images before upload

**Caching Strategy:**
```javascript
// Service worker for caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/static/css/main.css',
        '/static/js/main.js'
      ]);
    })
  );
});
```

**Lazy Loading:**
```javascript
// Intersection Observer for lazy loading
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
});
```

### Backend Optimization

**Database Optimization:**
- Add indexes to frequently queried columns
- Use connection pooling
- Optimize SQL queries
- Use prepared statements

**API Optimization:**
- Implement pagination
- Use compression (gzip)
- Cache frequently accessed data
- Use Redis for session storage

**Query Optimization:**
```javascript
// Use indexes
CREATE INDEX idx_user_id ON diary_logs(user_id);
CREATE INDEX idx_date ON diary_logs(date);

// Use pagination
const logs = await DiaryLog.findAll({
  where: { user_id },
  limit: 20,
  offset: (page - 1) * 20
});
```

### Monitoring Performance

**Frontend Metrics:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)

**Backend Metrics:**
- Response time
- Error rate
- Request rate
- Database query time

**Tools:**
- Lighthouse for frontend
- New Relic for APM
- Datadog for monitoring
- Google Analytics for user metrics

### Optimization Checklist

**Frontend:**
- [ ] Code splitting implemented
- [ ] Images optimized
- [ ] Caching strategy in place
- [ ] Bundle size minimized
- [ ] Lazy loading used
- [ ] Service worker registered

**Backend:**
- [ ] Database indexes added
- [ ] Connection pooling configured
- [ ] API responses compressed
- [ ] Caching implemented
- [ ] Queries optimized
- [ ] Rate limiting configured

---

## Error Handling

### Frontend Error Handling

**Error Boundaries:**
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

**API Error Handling:**
```javascript
const fetchData = async () => {
  try {
    const response = await authFetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to load data', 'error');
    return null;
  }
};
```

**Form Validation:**
```javascript
const validateForm = (data) => {
  const errors = {};
  
  if (!data.surah || data.surah < 1 || data.surah > 114) {
    errors.surah = 'Invalid Surah number';
  }
  
  if (!data.ayah || data.ayah < 1) {
    errors.ayah = 'Invalid Ayah number';
  }
  
  return errors;
};
```

### Backend Error Handling

**Global Error Handler:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

**Async Error Handling:**
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

**Database Error Handling:**
```javascript
try {
  const result = await db.query('SELECT * FROM users');
  res.json(result);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    res.status(400).json({ error: 'Duplicate entry' });
  } else {
    res.status(500).json({ error: 'Database error' });
  }
}
```

### User-Friendly Error Messages

**Guidelines:**
- Use clear, non-technical language
- Suggest actionable solutions
- Provide context when possible
- Maintain brand voice

**Examples:**
- "Network error. Please check your connection and try again."
- "We couldn't save your entry. Please try again."
- "This feature requires an internet connection."
- "Your session has expired. Please log in again."

### Error Logging

**Frontend Logging:**
```javascript
const logError = (error, context) => {
  console.error('Error:', error, 'Context:', context);
  // Send to error tracking service
  if (window.Sentry) {
    Sentry.captureException(error, { extra: context });
  }
};
```

**Backend Logging:**
```javascript
const logger = require('./utils/logger');

app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  next(err);
});
```

### Error Recovery

**Retry Logic:**
```javascript
const retryFetch = async (url, options, retries = 3) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
};
```

**Fallback Content:**
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(false);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(() => setError(true))
    .finally(() => setLoading(false));
}, []);

if (error) {
  return <ErrorFallback onRetry={() => window.location.reload()} />;
}
```

---

## Data Privacy

### GDPR Compliance

**Data Collection:**
- Only collect necessary data
- Obtain explicit consent
- Provide privacy policy
- Allow data export
- Allow data deletion

**User Rights:**
- Right to access data
- Right to rectification
- Right to erasure
- Right to restrict processing
- Right to data portability

**Implementation:**
```javascript
// Data export endpoint
app.get('/api/user/export', authenticate, async (req, res) => {
  const userData = await exportUserData(req.user.id);
  res.json(userData);
});

// Data deletion endpoint
app.delete('/api/user/delete', authenticate, async (req, res) => {
  await deleteUserData(req.user.id);
  res.json({ message: 'Data deleted' });
});
```

### Data Retention

**Retention Policy:**
- Diary entries: Retained indefinitely (user can delete)
- Flashcard sets: Retained indefinitely (user can delete)
- Memory tips: Retained indefinitely (user can delete)
- Activity logs: Retained for 90 days
- Error logs: Retained for 30 days

**Automatic Deletion:**
- Implement cleanup jobs for old logs
- Delete data after account deletion
- Anonymize old data if needed

### Data Security

**Encryption:**
- Encrypt sensitive data at rest
- Use HTTPS for all data transmission
- Encrypt backups
- Secure key management

**Access Control:**
- Role-based access control
- Principle of least privilege
- Regular access reviews
- Audit trails

**Data Backup:**
- Regular automated backups
- Off-site backup storage
- Backup encryption
- Disaster recovery plan

### Privacy Policy

**Required Sections:**
- What data is collected
- How data is used
- Who data is shared with
- Data retention period
- User rights
- Contact information

**Example:**
```
Privacy Policy

We collect the following data:
- Account information (email, username)
- Diary entries (Surah, Ayah, marks, notes)
- Flashcard sets (cards, memory aids)
- Schedule data (events, preferences)

We use this data to:
- Provide Hifz tracking services
- Generate personalized schedules
- Improve our services

We do not sell your data to third parties.

You can request data export or deletion by contacting us.
```

### Cookie Policy

**Cookie Usage:**
- Authentication tokens
- User preferences
- Analytics (optional)
- Session management

**Cookie Consent:**
- Obtain consent before using non-essential cookies
- Provide cookie settings
- Respect Do Not Track

---

## Accessibility

### WCAG Compliance

**Target Level:** WCAG 2.1 AA

**Key Guidelines:**
- Perceivable: Information must be presentable
- Operable: Interface components must be operable
- Understandable: Information and operation must be understandable
- Robust: Content must be robust enough to be interpreted

### Keyboard Navigation

**Tab Order:**
- Logical tab order
- Visible focus indicators
- Skip to main content link
- No keyboard traps

**Keyboard Shortcuts:**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
  if (e.key === 'Enter' && e.target.classList.contains('card')) {
    openCard(e.target);
  }
});
```

### Screen Reader Support

**ARIA Labels:**
```jsx
<button aria-label="Close modal" onClick={onClose}>
  <span aria-hidden="true">×</span>
</button>

<div role="navigation" aria-label="Main menu">
  {/* Navigation items */}
</div>
```

**Semantic HTML:**
```jsx
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/diary">Diary</a></li>
    <li><a href="/flashcards">Flashcards</a></li>
  </ul>
</nav>

<main aria-label="Main content">
  {/* Main content */}
</main>
```

### Color Contrast

**Contrast Ratios:**
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

**Color Blindness:**
- Don't rely on color alone
- Use patterns or icons
- Provide text labels
- Test with color blindness simulators

### Focus Management

**Focus Indicators:**
```css
:focus-visible {
  outline: 2px solid #C9A84C;
  outline-offset: 2px;
}
```

**Focus Trapping:**
```javascript
const trapFocus = (element) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
};
```

### Accessibility Testing

**Tools:**
- axe DevTools
- WAVE
- Lighthouse
- Screen readers (NVDA, JAWS)

**Testing Checklist:**
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Color contrast meets WCAG AA
- [ ] Forms have proper labels
- [ ] Images have alt text
- [ ] Videos have captions
- [ ] Error messages are accessible

---

## Internationalization (i18n)

### Future Implementation

**Planned Support:**
- English (current)
- Arabic
- Urdu
- Malay
- Other languages as needed

### Implementation Strategy

**i18n Library:**
```bash
npm install i18next react-i18next
```

**Configuration:**
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          welcome: 'Welcome to Hifz al-Quran Platform'
        }
      },
      ar: {
        translation: {
          welcome: 'مرحباً بك في منصة حفظ القرآن'
        }
      }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
```

**RTL Support:**
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="ltr"] {
  direction: ltr;
  text-align: left;
}
```

**Date/Time Formatting:**
```javascript
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

const formatDate = (date, locale) => {
  return format(date, 'PPP', { locale: locale === 'ar' ? arSA : enUS });
};
```

### Content Translation

**Translation Files:**
```
locales/
├── en/
│   ├── common.json
│   ├── diary.json
│   └── flashcards.json
├── ar/
│   ├── common.json
│   ├── diary.json
│   └── flashcards.json
```

**Usage:**
```jsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
}
```

---

## Mobile/PWA

### Progressive Web App Features

**Service Worker:**
```javascript
// public/sw.js
const CACHE_NAME = 'hifz-quran-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Manifest File:**
```json
{
  "name": "Hifz al-Quran Platform",
  "short_name": "Hifz Quran",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1B4332",
  "theme_color": "#1B4332",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Mobile Optimization

**Responsive Design:**
- Mobile-first CSS
- Touch-friendly targets (min 44px)
- Readable font sizes (min 16px)
- Optimized images

**Touch Gestures:**
```javascript
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => nextCard(),
  onSwipedRight: () => previousCard()
});

<div {...handlers}>
  {/* Card content */}
</div>
```

**Viewport Meta Tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Mobile-Specific Features

**Push Notifications:**
```javascript
if ('Notification' in window && 'serviceWorker' in navigator) {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      // Subscribe to push notifications
    }
  });
}
```

**Offline Support:**
- Service worker caching
- Offline fallback UI
- Sync when back online

**App Installation:**
- Add to home screen prompt
- Install button in UI
- App shortcuts

---

## Backup and Restore

### User Data Backup

**Export Functionality:**
```javascript
const exportUserData = async () => {
  const response = await authFetch('/api/user/export');
  const data = await response.json();
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hifz-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**Backup Contents:**
- Diary entries
- Flashcard sets
- Memory tips
- Schedule data
- User preferences

### Restore Functionality

**Import Functionality:**
```javascript
const importUserData = async (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const response = await authFetch('/api/user/import', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        showToast('Data restored successfully', 'success');
      }
    } catch (error) {
      showToast('Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
};
```

### Server-Side Backup

**Database Backup:**
```bash
# SQLite
cp database.sqlite backup.sqlite

# PostgreSQL
pg_dump hifz_quran > backup.sql

# MySQL
mysqldump hifz_quran > backup.sql
```

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
pg_dump hifz_quran > /backups/hifz-$DATE.sql
find /backups -name "hifz-*.sql" -mtime +30 -delete
```

### Backup Strategy

**Backup Frequency:**
- Daily: Full database backup
- Hourly: Incremental backup (if using PostgreSQL)
- Real-time: Replication (for production)

**Backup Locations:**
- Local storage
- Cloud storage (AWS S3, Google Cloud Storage)
- Off-site backup

**Recovery Testing:**
- Test restore monthly
- Document recovery procedure
- Keep backup documentation updated

---

## Monitoring

### Application Monitoring

**Error Tracking (Sentry):**
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

**Performance Monitoring:**
```javascript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Server Monitoring

**Health Check Endpoint:**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

**Metrics Collection:**
```javascript
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code']
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration.observe({
      method: req.method,
      route: req.route?.path || req.path,
      code: res.statusCode
    });
  });
  next();
});
```

### Logging

**Structured Logging:**
```javascript
const logger = require('./utils/logger');

logger.info('User logged in', {
  userId: user.id,
  timestamp: new Date().toISOString(),
  ip: req.ip
});

logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  query: sql
});
```

**Log Levels:**
- error: Critical errors
- warn: Warning messages
- info: Informational messages
- debug: Debugging information

### Alerts

**Alert Conditions:**
- Error rate > 5%
- Response time > 2s
- Database connection failures
- Disk space < 10%
- Memory usage > 80%

**Alert Channels:**
- Email
- Slack
- SMS (for critical alerts)
- PagerDuty

### Monitoring Tools

**Recommended Tools:**
- **Sentry**: Error tracking
- **Datadog**: APM and infrastructure
- **New Relic**: Performance monitoring
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Uptime Robot**: Uptime monitoring

### Dashboard

**Key Metrics to Track:**
- Active users
- API response times
- Error rates
- Database performance
- Server uptime
- Feature usage

**Dashboard Example:**
- User count over time
- API request rate
- Error rate by endpoint
- Database query performance
- Server resource usage

---

## Contributing

### Development Guidelines
- Follow existing code style
- Use Islamic color theme for new features
- Add tour steps for new features
- Test with multiple user scenarios
- Update documentation for new features

### Git Workflow
- Create feature branch from main
- Commit with descriptive messages
- Test thoroughly before PR
- Update relevant documentation

---

## Support

For issues or questions:
1. Check this documentation
2. Review existing issues
3. Check console for error messages
4. Verify API endpoints are working
5. Test with fresh data

---

## License

See LICENSE file for details.

---

## Credits

Built for the Hifz al-Quran community with the intention of making Quran memorization easier and more effective. May Allah accept this effort and make it beneficial for all students of His Book. آمين
