# Database Architecture

## Overview
SQLite database with relational schema supporting users, diary entries, flashcards, coach sessions, and Quran data.

## Database File
- **Location**: `backend/data/quran.db`
- **Type**: SQLite3
- **Setup**: `backend/scripts/maintenance/setup.js`

## Schema Overview

### Core Tables
- **users**: User accounts and authentication
- **diary_logs**: Hifz diary entries
- **diary_tasks**: Tasks and targets
- **flashcard_sets**: Flashcard collections
- **flashcard_cards**: Individual flashcards
- **folders**: Flashcard organization
- **folder_items**: Folder-flashcard relationships
- **coach_sessions**: AI coach sessions
- **coach_events**: Coach session events
- **aqmos_profiles**: Learning style profiles
- **similarities**: Similar verse pairs
- **user_tips**: Custom memory tips
- **user_themes**: Theme selections
- **heatmap_data**: Page strength data

### Quran Reference Tables
- **surahs**: Surah metadata
- **ayahs**: Verse data
- **pages**: Mushaf page data
- **juz**: Juz metadata

## Key Relationships
- users → diary_logs (1:N)
- users → flashcard_sets (1:N)
- users → coach_sessions (1:N)
- users → aqmos_profiles (1:1)
- flashcard_sets → flashcard_cards (1:N)
- folders → folder_items (1:N)
- coach_sessions → coach_events (1:N)

## Indexes
- Primary keys on all tables
- Foreign key constraints
- Indexes on frequently queried columns (user_id, date, etc.)

## Migrations
- **Location**: `backend/database/migrations/`
- **Format**: SQL files with version numbers
- **Execution**: Applied by setup.js in sequence

## Data Import
- **Ayah data**: Imported from source files
- **Similarity pairs**: Generated from ayah data
- **Heatmap data**: Imported from text files
- **Demo data**: Optional population scripts

## Backup Strategy
- File-based database (quran.db)
- Manual backup by copying database file
- No automated backup configured
