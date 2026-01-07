# 📖 Scripture Reading App

A comprehensive web application for tracking Bible and Quran reading plans with automatic progress tracking, schedule adjustment, and personal notes.

## 🌟 Features

### 📋 Reading Plans
- **Multiple Scripture Types**: Support for both Bible and Quran
- **Flexible Plan Types**:
  - Complete Bible/Quran
  - Old Testament only
  - New Testament only
  - Custom ranges
- **Customizable Duration**: 30 days to 2 years, or set custom target date
- **Multiple Active Plans**: Track Bible and Quran simultaneously

### 📊 Progress Tracking
- **Current Position**: Always know exactly where to start reading
- **Verse Counting**: Automatic calculation of verses read
- **Completion Percentage**: Visual progress bars
- **On-Track Indicator**: Real-time status (On Track / Behind / Ahead)

### 🔄 Automatic Schedule Adjustment
- **Daily Target Calculation**: Initial daily verse targets based on your timeline
- **Dynamic Recalculation**: Automatically adjusts remaining daily targets based on actual progress
- **Status Messages**: Clear feedback on whether you're on track
- **Reading Time Estimates**: Estimated minutes per day based on average reading speed

### 📝 Notes & Reflections
- **Rich Notes**: Write personal reflections on what you read
- **Tagging System**: Organize notes with custom tags
- **Journal Integration**: Optionally save notes to the LifeOS Journal module
- **Copy/Export**: Easily copy notes to clipboard

### 📈 Statistics & History
- **Reading Streak**: Track consecutive days of reading
- **Total Verses**: Running total of all verses read
- **Time Tracking**: Optional duration logging
- **Search & Filter**: Find past readings by reference, notes, or tags

## 🚀 Getting Started

### Creating Your First Plan

1. Navigate to the **Plans** tab
2. Select your scripture type (Bible or Quran)
3. Choose a plan type (Complete, Testament, or Custom)
4. Set your start date and duration
5. Optionally name your plan
6. Click "Create Plan"

**Example:**
- Scripture: Bible
- Plan Type: Complete Bible
- Duration: 365 days (1 year)
- Daily Target: ~85 verses/day
- Estimated Time: ~43 minutes/day

### Logging Your Reading

1. Go to the **Log Reading** tab
2. The app shows your current starting position
3. Enter where you finished reading:
   - For Bible: Select book, chapter, and verse
   - For Quran: Select surah and ayah
4. Add optional notes and tags
5. Click "Log Reading"

**Quick Action:** Use "Mark Daily Target Complete" to automatically calculate your endpoint based on your daily target.

### Understanding Progress

After each reading:
- ✅ **On Track**: You're meeting or exceeding your daily target
- ⚠️ **Behind**: You're behind schedule; daily target will increase
- 🚀 **Ahead**: You're ahead of schedule; keep it up!

The app automatically recalculates your remaining daily target to help you stay on track.

## 📖 How It Works

### Verse Position Tracking

The app uses comprehensive scripture structure data:
- **Bible**: All 66 books with exact verse counts per chapter
- **Quran**: All 114 surahs with exact ayah counts

When you log a reading from Genesis 1:1 to Genesis 2:15:
1. Calculates verses read: 31 (ch 1) + 15 (ch 2:1-15) = 46 verses
2. Updates your total progress
3. Sets next starting position to Genesis 2:16
4. Checks if you're on pace for your target date

### Schedule Adjustment Algorithm

**Initial Calculation:**
```
Daily Target = Total Verses ÷ Total Days
```

**After Each Reading:**
```
Days Elapsed = Today - Start Date
Expected Verses = Daily Target × Days Elapsed
Actual Verses = Sum of all readings
Status = Actual >= Expected ? "On Track" : "Behind"

New Daily Target = Remaining Verses ÷ Remaining Days
```

**Example:**
- Plan: Read Bible in 30 days (31,102 verses)
- Initial target: 1,037 verses/day
- Day 1: Read 46 verses (4.4% of target)
- Status: Behind by 991 verses
- Adjusted target: 1,071 verses/day for remaining 29 days

### Reading Time Estimation

Based on average reading speed:
- ~12 words per verse (average)
- ~200 words per minute (average reading speed)
- Formula: `(Verses × 12) ÷ 200 = Minutes`

Example: 85 verses = ~43 minutes

## 🎯 Tips for Success

### Set Realistic Goals
- **First-time readers**: Consider 1-2 year plans
- **Regular readers**: 6-12 months is achievable
- **Intensive reading**: 30-90 days requires significant daily commitment

### Stay Consistent
- Read at the same time each day
- Use the streak counter for motivation
- Don't let one missed day derail your plan

### Use Notes Effectively
- Write down key insights immediately
- Tag by themes (prayer, faith, creation, etc.)
- Review past notes for deeper understanding

### Combine with Journal
- Enable "Save to Journal" when logging readings
- Your scripture notes appear in your main Journal app
- Keep all your reflections in one place

## 📱 Integration with LifeOS

The Scripture Reading app integrates seamlessly with other LifeOS modules:

- **Journal**: Automatically create journal entries from reading notes
- **Dashboard**: Quick access via "Log Reading" button
- **Storage**: All data saved locally in browser (no login required)
- **Theme**: Matches LifeOS design system

## 🗂️ Data Structure

### Plans
```javascript
{
  id: 1234567890,
  planName: "Complete Bible - 1 Year",
  scriptureType: "bible",
  planType: "complete",
  startDate: "2025-01-15",
  targetDate: "2026-01-15",
  totalDays: 365,
  dailyTarget: 85,
  versesRead: 1250,
  currentPosition: { book: "Genesis", chapter: 15, verse: 1 },
  status: "active"
}
```

### Reading Logs
```javascript
{
  id: 1234567890,
  planId: 987654321,
  date: "2025-01-15",
  startPosition: { book: "Genesis", chapter: 1, verse: 1 },
  endPosition: { book: "Genesis", chapter: 2, verse: 15 },
  versesRead: 46,
  duration: 20,
  notes: "Beautiful creation account...",
  tags: ["creation", "reflection"],
  isOnTrack: false
}
```

## 🔧 Technical Details

### Scripture Data
- **Bible**: 31,102 total verses across 66 books
  - Old Testament: 23,145 verses (39 books)
  - New Testament: 7,957 verses (27 books)
- **Quran**: 6,236 total ayahs across 114 surahs

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Uses localStorage for data persistence

### Data Privacy
- All data stored locally in your browser
- No server uploads or external tracking
- No login or account required
- Export/backup via browser developer tools if needed

## ❓ FAQ

**Q: Can I have multiple active plans?**
A: Yes! You can track Bible and Quran plans simultaneously. One plan is marked as "active" for the Log Reading tab.

**Q: What if I miss days?**
A: The app automatically recalculates your remaining daily target. You'll see your adjusted target and can get back on track.

**Q: Can I edit past readings?**
A: Currently, you can delete readings. Edit functionality can be added in future updates.

**Q: Does this work offline?**
A: The app works offline for core features. Links to BibleGateway.com and Quran.com require internet.

**Q: Can I export my data?**
A: Use the "Copy Notes" feature for individual entries. Full data export can be implemented if needed.

**Q: What if I want to restart a plan?**
A: Create a new plan with your desired settings. Old plans remain in history.

## 🎨 Customization

The app follows LifeOS design patterns and can be customized via CSS variables in `shared/styles.css`:
- Primary color: `#667eea`
- Secondary color: `#764ba2`
- Font family: System default sans-serif
- Responsive breakpoints: 768px, 1024px

## 📄 License

Part of the LifeOS suite. For personal use.

## 🙏 Credits

Scripture structure data compiled from public domain sources:
- Bible verse counts: Standard Protestant canon
- Quran ayah counts: Standard Hafs text

---

**Built with ❤️ as part of LifeOS - Your Personal Life Operating System**
