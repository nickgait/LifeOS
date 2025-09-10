# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a single-file fitness tracking web application (`Logger.html`) built with vanilla HTML, CSS, and JavaScript. The app uses:

- Tailwind CSS via CDN for styling
- Browser localStorage for data persistence
- Vanilla JavaScript for all functionality

## Architecture

The application is structured as a single-page application with the following key components:

### Core Functionality
- **Goal Management**: Users can create fitness goals with different types (count, weight, distance, time)
- **Progress Tracking**: Daily logging system with history and progress visualization
- **Data Persistence**: All data stored in browser localStorage using the key `fitnessGoals`
- **Progress Analytics**: Projected completion dates and performance tracking relative to daily targets

### Key JavaScript Functions
- `renderUI()`: Main rendering function that updates the entire interface
- `saveGoals()`: Persists goal data to localStorage
- `renderGoalButtons()`: Dynamically creates goal selection buttons
- `renderGoalDetails()`: Updates progress display, history, and analytics
- `showMessage()`: Custom modal system for user feedback

### Data Structure
Goals are stored as objects with:
- `name`: Goal identifier
- `type`: One of 'count', 'weight', 'distance', 'time'
- `target`: Total amount to achieve
- `dailyTarget`: Expected daily progress for projections
- `history`: Array of daily entries with amount, date, and fullDate

## Development Notes

- No build system or package manager - open `Logger.html` directly in a browser
- Uses modern JavaScript features (ES6+) - requires modern browser support
- Responsive design with mobile-first approach
- All styling is embedded in the HTML file (custom CSS + Tailwind)
- Modal system implemented with vanilla JavaScript (no external libraries)

## Testing

No formal test suite exists. Manual testing involves:
1. Opening the HTML file in a browser
2. Creating goals of different types
3. Logging progress entries
4. Verifying localStorage persistence across browser sessions
5. Testing responsive behavior on different screen sizes

## Task Management

When new development tasks are identified, they should be added to `tasks.md` as a checklist. Mark tasks as completed by striking them through (~~task~~) when finished. This helps track progress and maintain a development roadmap.