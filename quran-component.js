// Shared Quran Verse Component for LifeOS
// This component can be included in any LifeOS module to display daily Quran verses

class QuranComponent {
    constructor() {
        this.fallbackVerses = [
            { text: "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.", reference: "Surah At-Talaq 65:3" },
            { text: "And it is He who created the heavens and earth in truth. And the day He says, \"Be,\" and it is, His word is the truth.", reference: "Surah Al-An'am 6:73" },
            { text: "And whoever fears Allah - He will make for him a way out.", reference: "Surah At-Talaq 65:2" },
            { text: "And whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise.", reference: "Surah An-Nisa 4:124" },
            { text: "And Allah would not punish them while they seek forgiveness.", reference: "Surah Al-Anfal 8:33" },
            { text: "And give good tidings to those who believe and do righteous deeds that they will have gardens.", reference: "Surah Al-Baqarah 2:25" },
            { text: "And whoever believes in Allah and does righteousness - He will admit him into gardens beneath which rivers flow.", reference: "Surah At-Taghabun 64:9" },
            { text: "And Allah is the best of planners.", reference: "Surah Al-Anfal 8:30" },
            { text: "So remember Me; I will remember you. And be grateful to Me and do not deny Me.", reference: "Surah Al-Baqarah 2:152" },
            { text: "And whoever trusts in Allah - then He is sufficient for him.", reference: "Surah At-Talaq 65:3" },
            { text: "Indeed, with hardship comes ease.", reference: "Surah Ash-Sharh 94:6" },
            { text: "And Allah loves the doers of good.", reference: "Suran Al-Baqarah 2:195" },
            { text: "And seek help through patience and prayer.", reference: "Surah Al-Baqarah 2:45" },
            { text: "And it is Allah who sends down rain from heaven, and We produce thereby the vegetation of every kind.", reference: "Surah Al-An'am 6:99" },
            { text: "And whoever does good deeds, whether male or female, and is a believer - such will enter Paradise.", reference: "Surah Ghafir 40:40" }
        ];
        
        this.currentVerse = null;
        this.lastFetchDate = null;
    }

    // Get daily verse based on current date (fallback method)
    getDailyVerse() {
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const verseIndex = dayOfYear % this.fallbackVerses.length;
        return this.fallbackVerses[verseIndex];
    }

    // Fetch random verse from Quran API
    async fetchRandomVerse() {
        try {
            // Use Quran Foundation API for random verse
            const response = await fetch('https://api.quran.foundation/v1/random-verse?language=en&words=false');
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            if (data && data.verse) {
                const verse = data.verse;
                const translation = verse.translations && verse.translations[0] ? verse.translations[0].text : '';
                const reference = `Surah ${verse.chapter_id}:${verse.verse_number}`;
                
                return {
                    text: translation || verse.text_uthmani,
                    reference: reference,
                    arabic: verse.text_uthmani
                };
            }
            
            throw new Error('Invalid API response');
            
        } catch (error) {
            console.log('API fetch failed, using fallback verse:', error.message);
            return this.getDailyVerse();
        }
    }

    // Get verse for today (cached to avoid multiple API calls)
    async getTodaysVerse() {
        const today = new Date().toDateString();
        
        // If we already have today's verse, return it
        if (this.currentVerse && this.lastFetchDate === today) {
            return this.currentVerse;
        }
        
        // Fetch new verse for today
        this.currentVerse = await this.fetchRandomVerse();
        this.lastFetchDate = today;
        
        return this.currentVerse;
    }

    // Create HTML element for the verse
    createVerseElement() {
        const verseContainer = document.createElement('div');
        verseContainer.className = 'quran-verse-container';
        verseContainer.innerHTML = `
            <div class="quran-verse">
                <div class="verse-text" id="verse-text">Loading verse...</div>
                <div class="verse-reference" id="verse-reference"></div>
                <div class="verse-arabic" id="verse-arabic" style="display: none;"></div>
            </div>
        `;
        
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .quran-verse-container {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid rgba(102, 126, 234, 0.2);
            }
            
            .quran-verse {
                text-align: center;
            }
            
            .verse-text {
                font-size: 1.1em;
                font-style: italic;
                color: #2c3e50;
                margin-bottom: 10px;
                line-height: 1.6;
            }
            
            .verse-reference {
                font-size: 0.9em;
                color: #667eea;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .verse-arabic {
                font-size: 1.2em;
                color: #2c3e50;
                direction: rtl;
                line-height: 1.8;
                margin-top: 10px;
                font-family: 'Times New Roman', serif;
            }
            
            .show-arabic-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.8em;
                margin-top: 10px;
            }
            
            .show-arabic-btn:hover {
                opacity: 0.9;
            }
            
            /* Universal Dark Theme Detection */
            /* Target apps with dark backgrounds - Poetry, Finance (dark sections), etc. */
            
            /* Poetry App (uses CSS variables for dark theme) */
            .verse-text {
                color: var(--text-primary, #2c3e50);
            }
            
            .verse-arabic {
                color: var(--text-primary, #2c3e50);
            }
            
            .verse-reference {
                color: var(--accent-primary, #667eea);
            }
            
            /* Force white text on any dark app */
            body.dark .verse-text,
            body.dark-theme .verse-text,
            .dark .verse-text,
            [data-theme="dark"] .verse-text,
            /* Force white on apps with dark body backgrounds */
            body[style*="background: #1"] .verse-text,
            body[style*="background: #2"] .verse-text,
            body[style*="background: #3"] .verse-text,
            body[style*="background-color: #1"] .verse-text,
            body[style*="background-color: #2"] .verse-text,
            body[style*="background-color: #3"] .verse-text {
                color: #ffffff !important;
            }
            
            body.dark .verse-arabic,
            body.dark-theme .verse-arabic,
            .dark .verse-arabic,
            [data-theme="dark"] .verse-arabic,
            body[style*="background: #1"] .verse-arabic,
            body[style*="background: #2"] .verse-arabic,
            body[style*="background: #3"] .verse-arabic,
            body[style*="background-color: #1"] .verse-arabic,
            body[style*="background-color: #2"] .verse-arabic,
            body[style*="background-color: #3"] .verse-arabic {
                color: #ffffff !important;
            }
            
            body.dark .verse-reference,
            body.dark-theme .verse-reference,
            .dark .verse-reference,
            [data-theme="dark"] .verse-reference,
            body[style*="background: #1"] .verse-reference,
            body[style*="background: #2"] .verse-reference,
            body[style*="background: #3"] .verse-reference,
            body[style*="background-color: #1"] .verse-reference,
            body[style*="background-color: #2"] .verse-reference,
            body[style*="background-color: #3"] .verse-reference {
                color: #8b9cf7 !important;
            }
            
            /* Enhanced container for better visibility */
            body.dark .quran-verse-container,
            body.dark-theme .quran-verse-container,
            .dark .quran-verse-container,
            [data-theme="dark"] .quran-verse-container,
            body[style*="background: #1"] .quran-verse-container,
            body[style*="background: #2"] .quran-verse-container,
            body[style*="background: #3"] .quran-verse-container {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
                border: 1px solid rgba(102, 126, 234, 0.3);
            }
        `;
        
        // Add styles to head if not already present
        if (!document.querySelector('#quran-verse-styles')) {
            style.id = 'quran-verse-styles';
            document.head.appendChild(style);
        }
        
        return verseContainer;
    }

    // Detect if the page has a dark background and apply white text
    detectAndApplyDarkTheme(verseElement) {
        // Wait a bit for styles to load
        setTimeout(() => {
            const body = document.body;
            const computedStyle = window.getComputedStyle(body);
            const backgroundColor = computedStyle.backgroundColor;
            const background = computedStyle.background;
            
            // Check if body has dark background
            const isDarkBackground = this.isDarkColor(backgroundColor) || 
                                   this.isDarkColor(background) ||
                                   body.classList.contains('dark') ||
                                   body.classList.contains('dark-theme') ||
                                   document.documentElement.getAttribute('data-theme') === 'dark';
            
            if (isDarkBackground) {
                verseElement.classList.add('dark-theme-detected');
                // Add inline styles as backup
                const verseText = verseElement.querySelector('.verse-text');
                const verseArabic = verseElement.querySelector('.verse-arabic');
                const verseReference = verseElement.querySelector('.verse-reference');
                
                if (verseText) verseText.style.color = '#ffffff';
                if (verseArabic) verseArabic.style.color = '#ffffff';
                if (verseReference) verseReference.style.color = '#8b9cf7';
            }
        }, 100);
    }

    // Helper function to determine if a color is dark
    isDarkColor(colorStr) {
        if (!colorStr || colorStr === 'transparent' || colorStr === 'rgba(0, 0, 0, 0)') {
            return false;
        }
        
        // Extract RGB values
        const rgb = colorStr.match(/\d+/g);
        if (!rgb || rgb.length < 3) {
            return false;
        }
        
        // Calculate luminance
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Consider it dark if luminance is less than 0.5
        return luminance < 0.5;
    }

    // Initialize and render the verse component
    async render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Quran verse container not found:', containerId);
            return;
        }
        
        // Create verse element
        const verseElement = this.createVerseElement();
        container.appendChild(verseElement);
        
        // Auto-detect dark background and apply appropriate styles
        this.detectAndApplyDarkTheme(verseElement);
        
        // Load and display the verse
        try {
            const verse = await this.getTodaysVerse();
            
            document.getElementById('verse-text').textContent = `"${verse.text}"`;
            document.getElementById('verse-reference').textContent = `— ${verse.reference}`;
            
            // Add Arabic text if available
            if (verse.arabic) {
                document.getElementById('verse-arabic').textContent = verse.arabic;
                
                // Add button to show/hide Arabic text
                const arabicBtn = document.createElement('button');
                arabicBtn.className = 'show-arabic-btn';
                arabicBtn.textContent = 'Show Arabic';
                arabicBtn.onclick = () => {
                    const arabicDiv = document.getElementById('verse-arabic');
                    if (arabicDiv.style.display === 'none') {
                        arabicDiv.style.display = 'block';
                        arabicBtn.textContent = 'Hide Arabic';
                    } else {
                        arabicDiv.style.display = 'none';
                        arabicBtn.textContent = 'Show Arabic';
                    }
                };
                
                document.querySelector('.quran-verse').appendChild(arabicBtn);
            }
            
        } catch (error) {
            console.error('Error loading verse:', error);
            document.getElementById('verse-text').textContent = 'Error loading daily verse';
            document.getElementById('verse-reference').textContent = '';
        }
    }
}

// Global instance
window.QuranComponent = QuranComponent;

// Helper function for easy integration
window.loadQuranVerse = function(containerId) {
    const quranComponent = new QuranComponent();
    quranComponent.render(containerId);
};