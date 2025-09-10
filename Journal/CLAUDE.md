# Journal App - CLAUDE Configuration

## Project Overview
Daily journaling application for LifeOS - helps users reflect on their day, capture thoughts, track moods, and maintain personal growth through consistent writing practice.

## Commands
- **Test**: No specific test framework configured yet
- **Lint**: No linting configured yet
- **Build**: Static HTML/CSS/JS - no build process required

## Tech Stack
- HTML5
- CSS3 (with CSS Grid/Flexbox)
- Vanilla JavaScript
- Local Storage for data persistence

## Key Features
- Daily journal entries with rich text editing
- Mood tracking with visual indicators
- Tag system for categorizing entries
- Search functionality across all entries
- Calendar view for browsing past entries
- Word count and writing streak tracking
- Local data persistence
- Export/import functionality
- Responsive design

## File Structure
```
Journal/
├── index.html          # Main application
├── styles.css          # Styling
├── script.js           # Core functionality
├── CLAUDE.md           # This file
└── tasks.md            # Task tracking
```

## Data Structure
```javascript
entry = {
  id: string,
  date: string (YYYY-MM-DD),
  title: string,
  content: string,
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible',
  tags: string[],
  wordCount: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Development Notes
- Uses localStorage for persistence
- Mobile-first responsive design
- Follows LifeOS design system (gradient themes, card layouts)
- No external dependencies
- Simple rich text formatting (bold, italic, lists)
- Auto-save functionality to prevent data loss

## Task Management
When working on this project, use tasks.md to track development progress. Mark completed items with `- [x]` to show completion status. **Always update tasks.md immediately after completing features** to maintain accurate project status. **Cross out completed items in CLAUDE.md using ~~strikethrough~~ ✓ format**.

**Completed Core Features:**
- ~~[x] Main HTML structure~~ ✓
- ~~[x] CSS styling with LifeOS theme~~ ✓
- ~~[x] JavaScript functionality for journal management~~ ✓
- ~~[x] Local storage persistence~~ ✓
- ~~[x] Add/edit/delete entry functionality~~ ✓
- ~~[x] Rich text editor with basic formatting~~ ✓
- ~~[x] Auto-save functionality~~ ✓
- ~~[x] Entry statistics (word count, writing streaks)~~ ✓

**Completed UI Components:**
- ~~[x] Header with app title and navigation~~ ✓
- ~~[x] Today's entry quick access~~ ✓
- ~~[x] Entry editor with formatting toolbar~~ ✓
- ~~[x] Entry list/feed with search~~ ✓
- ~~[x] Calendar view for date navigation~~ ✓
- ~~[x] Mood selector with visual indicators~~ ✓
- ~~[x] Tag management system~~ ✓
- ~~[x] Statistics dashboard~~ ✓

**Completed Additional Features:**
- ~~[x] Keyboard shortcuts (Ctrl+B, Ctrl+I, N, E, C, F, Escape, Ctrl+S)~~ ✓
- ~~[x] Export/import functionality~~ ✓
- ~~[x] Cross-browser compatibility~~ ✓
- ~~[x] Mobile device optimization~~ ✓
- ~~[x] Auto-save with visual indicators~~ ✓
- ~~[x] Entry modal with full content display~~ ✓
- ~~[x] Advanced search and filtering~~ ✓
- ~~[x] Calendar navigation with entry indicators~~ ✓