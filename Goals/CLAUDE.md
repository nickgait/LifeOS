# Goals Tracker - CLAUDE Configuration

## Project Overview
Goal setting and tracking application for LifeOS - helps users set meaningful goals, track progress, and achieve success through systematic planning and milestone tracking.

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
- Add/edit/delete goals with deadlines
- Goal categories (Personal, Career, Health, Finance, Learning, etc.)
- Progress tracking with visual indicators
- Milestone/sub-goal system
- Goal status management (Not Started, In Progress, Completed, Paused)
- Achievement celebrations and statistics
- Local data persistence
- Responsive design
- Export/import functionality

## File Structure
```
Goals/
├── index.html          # Main application
├── styles.css          # Styling
├── script.js           # Core functionality
├── CLAUDE.md           # This file
└── tasks.md            # Task tracking
```

## Data Structure
```javascript
goal = {
  id: string,
  title: string,
  description: string,
  category: string,
  startDate: date,
  targetDate: date,
  status: 'not-started' | 'in-progress' | 'completed' | 'paused',
  progress: number (0-100),
  milestones: [
    {
      id: string,
      title: string,
      completed: boolean,
      completedDate: date
    }
  ],
  createdDate: date,
  completedDate: date
}
```

## Development Notes
- Uses localStorage for persistence
- Mobile-first responsive design
- Follows LifeOS design system (gradient themes, card layouts)
- No external dependencies
- Progress calculations based on milestones and manual updates

## Task Management
When working on this project, use tasks.md to track development progress. Mark completed items with `- [x]` to show completion status. Update tasks.md immediately after completing features to maintain accurate project status.

**Completed Core Features:**
- ~~[x] Main HTML structure~~ ✓
- ~~[x] CSS styling with LifeOS theme~~ ✓
- ~~[x] JavaScript functionality for goal management~~ ✓
- ~~[x] Local storage persistence~~ ✓
- ~~[x] Add/edit/delete goal functionality~~ ✓
- ~~[x] Progress tracking system~~ ✓
- ~~[x] Milestone management~~ ✓
- ~~[x] Goal statistics display~~ ✓

**Completed UI Components:**
- ~~[x] Header with app title and navigation~~ ✓
- ~~[x] Add/edit goal form with categories and dates~~ ✓
- ~~[x] Goals list display with filtering~~ ✓
- ~~[x] Goal detail view with progress tracking~~ ✓
- ~~[x] Milestone management interface~~ ✓
- ~~[x] Progress visualization (bars, percentages)~~ ✓
- ~~[x] Statistics dashboard~~ ✓
- ~~[x] Goal status management~~ ✓

**Completed Data Management:**
- ~~[x] Goal data structure design~~ ✓
- ~~[x] Local storage implementation~~ ✓
- ~~[x] Data validation and error handling~~ ✓
- ~~[x] Progress calculation logic~~ ✓
- ~~[x] Milestone tracking system~~ ✓
- ~~[x] Export/import functionality~~ ✓

**Completed Additional Features:**
- ~~[x] Progress history tracking~~ ✓
- ~~[x] Keyboard shortcuts (N, F, Escape, E)~~ ✓
- ~~[x] Search functionality~~ ✓
- ~~[x] Cross-browser compatibility~~ ✓
- ~~[x] Mobile device optimization~~ ✓
- ~~[x] Data persistence verification~~ ✓
- ~~[x] Edge case handling~~ ✓