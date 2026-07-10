# Hifz al-Quran Platform

## Overview
A React + Node.js web application for Quran memorization (Hifz) 
with four core features and AI-powered tools.

## Tech Stack
- Frontend: React, React Router, TailwindCSS, Islamic color theme
- Backend: Node.js, Express, SQLite
- AI: Anthropic Claude API (claude-sonnet-4-6)

## Features Built

### 1. Mutashabihat (Similar Verses)
- Search any Surah/Ayah to find structurally similar verses
- Similarity percentage and word-level difference highlighting
- Auto-generated AI memory tip on first visit to each pair
- Tips saved to DB per user, never regenerated
- User can edit tips with pencil icon
- 429 rate limit handling with retry button

### 2. Flashcards
- Create flashcard sets from the Flashcards page
- 4 set types: Sequence of Ayah in Surah, Ayah in Page, 
  Pages in Juz, Surahs in Juz
- Starting/Ending modes for each set type
- Memory Aid with 3 tabs: Flowchart, First/Key Words, AI Story
- Flowchart always fetches live Quran data (not from saved cards)
- Study section with set-type-specific questions using real Quran data
- Built-in categories (Surah Openings, Verses Twice, etc.)
- Print support for flowcharts
- Sets persist per user in DB

### 3. My Diary
- 5 entry types: MURAJAH, TASMEE, IKHTEBAR, JADEED, JUZ HALI
- Tasks & Targets with status tracking (Completed/In Progress/Pending)
- Streak system with themed banners (unlocks over time)
- Immersive streak banner with cosmic themes

### 4. Time Management (Ustadh AI Scheduler)
- 8-step wizard: Progress Analysis → Weekly Cycle → Build My Week 
  → Exceptions → Review → Generated Schedule → Unit Details → Adjust
- Events persist across sessions (saved to DB per user)
- Deduplication of events on load
- Free time calculation per day with interval merging (handles overlapping events)
- Schedule generation based on page scores (1-10 scale)
- Time per page: Poor=5min, Fair=4min, Good=3min, 
  Very Good=2min, Excellent=1min
- Color-coded page scores in unit details
- Adjust/reschedule/skip/split session options

### 5. AQMOS Profile
- Learning style assessment
- Profile saved to DB and shown in side panel
- Retake test option (old profile preserved until new one saved)

### 6. Interactive Onboarding Tour
- Auto-starts for new users (localStorage based)
- 24-step interactive tour covering all features
- Banner persists across page navigation (React Portal)
- Steps sync with actual user actions (not just Next clicks)
- "?" button to reopen tour anytime
- Islamic color themed banner
- Positioned at top of screen (below navbar) to avoid covering content

## Color Theme
- Deep Green: #1B4332
- Forest Green: #2D6A4F  
- Mint Green: #52B788
- Islamic Gold: #C9A84C
- Cream White: #F5F0E8
- Warm Sand: #E8DCC8
- Ruby Accent: #C0392B (errors only)

## Quick Start

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create backend environment variables:

```bash
cd backend
copy .env.example .env
```

Set `JWT_SECRET` and `GROQ_API_KEY` in `backend/.env`, then from the project root run:

```bash
npm run backend:setup
npm run backend:dev
```

In a second terminal:

```bash
npm run frontend
```

## Useful Scripts

Run these from the project root:

```bash
npm run frontend       # start React dev server
npm run backend        # start Express API
npm run backend:dev    # start Express API with nodemon
npm run backend:setup  # apply schema/migrations and import ayah data
npm run build          # build frontend for production
```

Backend-only checks:

```bash
cd backend
npm run check:db
npm run check:streak
```

## Known Issues / In Progress
- Review free time calculation now handles overlapping events correctly
- GeneratedSchedule now generates from weeklyCycle when schedule prop is undefined
- has_seen_walkthrough column exists in schema.sql; migration 002 is for backward compatibility
