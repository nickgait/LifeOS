# Poetry Collection - CLAUDE Configuration

## Project Overview
Dark and introspective poetry collection app for LifeOS - a private, elegant space for writing, organizing, and preserving poems with mood-based organization and distraction-free interface.

## Commands
- **Test**: No specific test framework configured yet
- **Lint**: No linting configured yet
- **Build**: Static HTML/CSS/JS - no build process required

## Tech Stack
- HTML5
- CSS3 (with CSS Grid/Flexbox)
- Vanilla JavaScript
- Local Storage for data persistence
- Dark mode optimized interface

## Key Features
- **Distraction-free writing** - Clean, minimal editor for poetry creation
- **Mood & theme tagging** - Organize poems by emotional content
- **Chronological organization** - Track creative journey over time
- **Advanced search** - Find poems by keywords, themes, or dates
- **Privacy-focused** - All data stored locally
- **Dark mode interface** - Comfortable for late-night writing sessions
- **Export functionality** - Individual poems or full collections
- **Draft management** - Separate works in progress from finished pieces
- **Favorites system** - Mark significant works
- **Backup/restore** - Protect your creative work

## File Structure
```
Poetry/
├── index.html          # Main application
├── styles.css          # Dark-themed styling
├── script.js           # Core functionality
├── CLAUDE.md           # This file
└── tasks.md            # Task tracking
```

## Data Structure
```javascript
poem = {
  id: string,
  title: string,
  content: string,
  mood: string,
  themes: string[],
  isDraft: boolean,
  isFavorite: boolean,
  dateCreated: string (ISO),
  dateModified: string (ISO),
  wordCount: number,
  notes: string
}
```

## Development Notes
- Uses localStorage for persistence
- Dark-first responsive design
- Follows LifeOS design system with darker aesthetic
- No external dependencies
- Focus on typography and readability
- Minimal UI to avoid creative distractions
- Privacy-first approach

## Task Management
When working on this project, use tasks.md to track development progress. Mark completed items with `- [x]` to show completion status. **Always update tasks.md immediately after completing features** to maintain accurate project status. **Cross out completed items in CLAUDE.md using ~~strikethrough~~ ✓ format**.

**IMPORTANT: After completing any feature or task:**
1. **Update tasks.md** - Change `- [ ]` to `- [x]` for completed items
2. **Update CLAUDE.md** - Cross out completed items using `~~[x] Feature Name~~ ✓`
3. **Maintain accurate documentation** - Keep both files in sync with actual progress

**Completed Core Features:**
- ~~[x] Main HTML structure~~ ✓
- ~~[x] CSS styling with dark theme~~ ✓
- ~~[x] JavaScript functionality for poetry management~~ ✓
- ~~[x] Local storage persistence~~ ✓
- ~~[x] Poetry editor with autosave~~ ✓
- ~~[x] Mood and theme tagging system~~ ✓
- ~~[x] Search and filtering~~ ✓
- ~~[x] Export functionality~~ ✓

**Completed UI Components:**
- ~~[x] Header with app title and controls~~ ✓
- ~~[x] Poetry writing interface~~ ✓
- ~~[x] Poem list/gallery view~~ ✓
- ~~[x] Search and filter controls~~ ✓
- ~~[x] Poem display modal~~ ✓
- ~~[x] Settings panel~~ ✓
- ~~[x] Export interface~~ ✓

**Completed Data Management:**
- ~~[x] Poem data structure design~~ ✓
- ~~[x] Local storage implementation~~ ✓
- ~~[x] Search indexing system~~ ✓
- ~~[x] Export/import functionality~~ ✓
- ~~[x] Data validation and backup~~ ✓

**Completed Advanced Features:**
- ~~[x] Mood-based organization~~ ✓
- ~~[x] Theme tagging system~~ ✓
- ~~[x] Favorites management~~ ✓
- ~~[x] Draft/published states~~ ✓
- ~~[x] Reading mode optimization~~ ✓
- ~~[x] Typography controls~~ ✓
- ~~[x] Word count analytics~~ ✓
- [ ] Creative writing prompts (optional)

**Remaining Future Enhancements:**
- [ ] Writing streak tracking
- [ ] Mood trend analysis
- [ ] Writing session timer
- [ ] Auto-recovery from crashes
- [ ] Optional data encryption
- [ ] Cross-browser compatibility testing
- [ ] Accessibility improvements