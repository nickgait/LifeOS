# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeOS is a comprehensive personal life management system built as a modular web application. It serves as a central hub for managing different aspects of personal productivity and life organization through interconnected modules.

## Architecture

### Modular Structure
The application follows a modular architecture with:
- **Main Hub**: Root `index.html` serves as the navigation center
- **Independent Modules**: Each module is a complete standalone application
- **Shared Design System**: Common gradient theme (`#667eea` to `#764ba2`) and styling patterns

### Module Organization
```
LifeOS/
├── index.html, script.js, styles.css    # Main hub/launcher
├── ToDoList/                            # Task management with priorities
├── Fitness/                             # Health and fitness tracking
├── Finance/                             # Budget and expense management  
├── Habits/                              # Daily habit tracking
├── Goals/                               # Goal setting and milestone tracking
├── Journal/                             # Personal reflection and notes
└── Poetry/                              # Creative writing collection
```

## Development Commands

No build system is required - all modules are vanilla HTML/CSS/JavaScript applications.

### Testing
- Open `index.html` in browser to test main navigation
- Navigate to individual module directories and open their `index.html` files
- Test localStorage persistence across browser sessions
- Verify responsive behavior on different screen sizes

### Module-Specific Testing
Each module has its own testing approach documented in their respective CLAUDE.md files.

## Technical Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: 
  - Custom CSS with CSS Grid/Flexbox
  - Some modules use Tailwind CSS via CDN
  - Shared gradient theme and card-based layouts
- **Data Persistence**: Browser localStorage (per-module)
- **No Dependencies**: All modules are framework-free

## Design System

### Visual Theme
- **Primary Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Cards**: White backgrounds with `rgba(255, 255, 255, 0.95)` opacity
- **Border Radius**: 15px for main elements
- **Typography**: System fonts with clean, modern styling

### Layout Patterns
- Responsive grid layouts (`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`)
- Card-based interfaces with consistent padding and spacing
- Mobile-first responsive design

## Data Architecture

Each module maintains its own data structure in localStorage:
- **ToDoList**: Priority-weighted task system with progress tracking
- **Fitness**: Goal-based tracking with multiple metric types
- **Finance**: Transaction and budget management
- **Goals**: Milestone-based goal tracking with progress analytics
- **Habits**: Daily streak tracking and habit formation
- **Journal**: Date-based entry system with reflection prompts
- **Poetry**: Creative writing collection with categorization

## Module Integration

While modules are independent, they share:
- Common navigation pattern (back to main hub)
- Consistent visual design language
- Similar localStorage patterns for data persistence
- Responsive design principles

## Development Guidelines

### Adding New Modules
1. Create new directory with `index.html`, `script.js`, and related files
2. Follow existing design patterns and color scheme
3. Implement localStorage for data persistence
4. Add module entry in main `script.js` modules object
5. Create module-specific CLAUDE.md and tasks.md files

### Working with Existing Modules
- Each module has its own CLAUDE.md with specific architecture details
- Use tasks.md files for tracking development progress
- Maintain consistency with existing UX patterns
- Test localStorage persistence and responsive behavior

### Task Management
- **IMPORTANT**: Document all changes to any app in that app's `tasks.md` file
- Use `tasks.md` files in each module directory for feature tracking
- Mark completed tasks with strikethrough (~~task~~) when finished
- Create new tasks as development needs arise
- Always update the relevant `tasks.md` before and after making changes
- Keep CLAUDE.md files focused on architecture and learning documentation