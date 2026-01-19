/**
 * LifeOS Advanced Theme Manager
 * Multi-theme support with dark mode and accessibility features
 */

const AdvancedThemeManager = {
  // Available themes
  themes: {
    // Default LifeOS theme (purple gradient)
    lifeos: {
      name: 'LifeOS',
      type: 'light',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#a855f7',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f9fafb',
        dark: '#333333',
        border: '#e0e0e0',
        text: '#666666',
        textLight: '#999999',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        card: '#ffffff',
        surface: '#f8fafc',
        overlay: 'rgba(0, 0, 0, 0.1)'
      }
    },

    // Ocean theme (blue/teal)
    ocean: {
      name: 'Ocean',
      type: 'light',
      colors: {
        primary: '#0891b2',
        secondary: '#0284c7',
        accent: '#06b6d4',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f0f9ff',
        dark: '#0f172a',
        border: '#cbd5e1',
        text: '#475569',
        textLight: '#94a3b8',
        background: 'linear-gradient(135deg, #0891b2 0%, #0284c7 100%)',
        card: '#ffffff',
        surface: '#f1f5f9',
        overlay: 'rgba(8, 145, 178, 0.1)'
      }
    },

    // Forest theme (green)
    forest: {
      name: 'Forest',
      type: 'light',
      colors: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#10b981',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#f0fdf4',
        dark: '#14532d',
        border: '#d1fae5',
        text: '#374151',
        textLight: '#6b7280',
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        card: '#ffffff',
        surface: '#f7fee7',
        overlay: 'rgba(5, 150, 105, 0.1)'
      }
    },

    // Sunset theme (orange/pink)
    sunset: {
      name: 'Sunset',
      type: 'light',
      colors: {
        primary: '#ea580c',
        secondary: '#dc2626',
        accent: '#f97316',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#fff7ed',
        dark: '#7c2d12',
        border: '#fed7aa',
        text: '#9a3412',
        textLight: '#c2410c',
        background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
        card: '#ffffff',
        surface: '#fffbeb',
        overlay: 'rgba(234, 88, 12, 0.1)'
      }
    },

    // Dark theme
    dark: {
      name: 'Dark',
      type: 'dark',
      colors: {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#a855f7',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        light: '#1f2937',
        dark: '#f9fafb',
        border: '#374151',
        text: '#d1d5db',
        textLight: '#9ca3af',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        card: '#1f2937',
        surface: '#374151',
        overlay: 'rgba(139, 92, 246, 0.1)'
      }
    },

    // Midnight theme (dark blue)
    midnight: {
      name: 'Midnight',
      type: 'dark',
      colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        accent: '#60a5fa',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#06b6d4',
        light: '#1e293b',
        dark: '#f1f5f9',
        border: '#334155',
        text: '#cbd5e1',
        textLight: '#94a3b8',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        card: '#1e293b',
        surface: '#334155',
        overlay: 'rgba(59, 130, 246, 0.1)'
      }
    }
  },

  // Current active theme
  currentTheme: 'lifeos',

  // User preferences
  preferences: {
    reduceMotion: false,
    highContrast: false,
    fontSize: 'normal', // 'small', 'normal', 'large', 'xl'
    autoTheme: false // Auto switch based on system preference
  },

  /**
   * Initialize the theme manager
   */
  init() {
    this.loadPreferences();
    this.setupSystemThemeListener();
    this.applyTheme();
    this.injectGlobalStyles();
  },

  /**
   * Load user preferences from localStorage
   */
  loadPreferences() {
    const saved = StorageManager.get('theme-preferences');
    if (saved) {
      this.preferences = { ...this.preferences, ...saved };
    }
    
    const savedTheme = StorageManager.get('current-theme');
    if (savedTheme && this.themes[savedTheme]) {
      this.currentTheme = savedTheme;
    }
  },

  /**
   * Save user preferences to localStorage
   */
  savePreferences() {
    StorageManager.set('theme-preferences', this.preferences);
    StorageManager.set('current-theme', this.currentTheme);
  },

  /**
   * Setup system theme preference listener
   */
  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        if (this.preferences.autoTheme) {
          this.currentTheme = e.matches ? 'dark' : 'lifeos';
          this.applyTheme();
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      // Check initial system preference
      if (this.preferences.autoTheme) {
        this.currentTheme = mediaQuery.matches ? 'dark' : 'lifeos';
      }
    }
  },

  /**
   * Get current theme object
   * @returns {object} Theme object
   */
  getCurrentTheme() {
    return this.themes[this.currentTheme] || this.themes.lifeos;
  },

  /**
   * Switch to a different theme
   * @param {string} themeName - Name of the theme to switch to
   */
  switchTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme();
      this.savePreferences();
      this.dispatchThemeChangeEvent();
    }
  },

  /**
   * Toggle between light and dark themes
   */
  toggleDarkMode() {
    const currentType = this.getCurrentTheme().type;
    if (currentType === 'light') {
      this.switchTheme('dark');
    } else {
      this.switchTheme('lifeos');
    }
  },

  /**
   * Apply current theme to document
   */
  applyTheme() {
    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply additional theme properties
    root.style.setProperty('--gradient-primary', theme.colors.background);
    root.style.setProperty('--shadow-light', '0 2px 4px rgba(0,0,0,0.05)');
    root.style.setProperty('--shadow-medium', '0 10px 30px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-heavy', '0 20px 50px rgba(0,0,0,0.15)');
    root.style.setProperty('--border-radius', '8px');
    root.style.setProperty('--border-radius-lg', '15px');
    root.style.setProperty('--transition', this.preferences.reduceMotion ? 'none' : 'all 0.3s');

    // Apply dark mode class
    if (theme.type === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    // Apply accessibility preferences
    this.applyAccessibilitySettings();
  },

  /**
   * Apply accessibility settings
   */
  applyAccessibilitySettings() {
    const root = document.documentElement;

    // Font size
    const fontSizes = {
      small: '14px',
      normal: '16px',
      large: '18px',
      xl: '20px'
    };
    root.style.setProperty('--base-font-size', fontSizes[this.preferences.fontSize]);

    // High contrast mode
    if (this.preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (this.preferences.reduceMotion) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--transition', 'none');
    } else {
      root.classList.remove('reduce-motion');
    }
  },

  /**
   * Update accessibility preference
   * @param {string} preference - Preference to update
   * @param {any} value - New value
   */
  updatePreference(preference, value) {
    this.preferences[preference] = value;
    this.applyTheme();
    this.savePreferences();
  },

  /**
   * Inject global accessibility and theme styles
   */
  injectGlobalStyles() {
    const style = document.createElement('style');
    style.id = 'advanced-theme-styles';
    style.textContent = `
      /* Base font size */
      html {
        font-size: var(--base-font-size, 16px);
      }

      /* High contrast mode */
      .high-contrast {
        --color-border: #000000;
        --shadow-light: 0 2px 4px rgba(0,0,0,0.3);
        --shadow-medium: 0 10px 30px rgba(0,0,0,0.3);
      }

      .high-contrast .insight-card,
      .high-contrast .stat-card,
      .high-contrast .app-card {
        border: 2px solid var(--color-border);
      }

      /* Reduced motion */
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* Focus indicators for accessibility */
      *:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      /* Skip link for screen readers */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--color-primary);
        color: white;
        padding: 8px;
        border-radius: 4px;
        text-decoration: none;
        z-index: 1000;
      }

      .skip-link:focus {
        top: 6px;
      }

      /* Improved button states */
      button, .btn, .app-button {
        position: relative;
        overflow: hidden;
      }

      button:disabled, .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Theme-aware scrollbar */
      ::-webkit-scrollbar {
        width: 12px;
      }

      ::-webkit-scrollbar-track {
        background: var(--color-light);
      }

      ::-webkit-scrollbar-thumb {
        background: var(--color-border);
        border-radius: 6px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--color-primary);
      }

      /* Dark theme adjustments */
      .dark-theme {
        color-scheme: dark;
      }

      .dark-theme ::-webkit-scrollbar-track {
        background: var(--color-surface);
      }

      .dark-theme ::-webkit-scrollbar-thumb {
        background: var(--color-border);
      }

      /* Print styles */
      @media print {
        * {
          background: white !important;
          color: black !important;
          box-shadow: none !important;
        }
      }
    `;

    // Remove existing style if it exists
    const existing = document.getElementById('advanced-theme-styles');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(style);
  },

  /**
   * Get all available themes
   * @returns {Array} Array of theme objects with name and key
   */
  getAvailableThemes() {
    return Object.entries(this.themes).map(([key, theme]) => ({
      key,
      name: theme.name,
      type: theme.type
    }));
  },

  /**
   * Create theme selector UI
   * @param {HTMLElement} container - Container element to append theme selector
   */
  createThemeSelector(container) {
    const themeSelector = document.createElement('div');
    themeSelector.className = 'theme-selector';
    themeSelector.innerHTML = `
      <h3>Choose Theme</h3>
      <div class="theme-grid">
        ${this.getAvailableThemes().map(theme => `
          <div class="theme-option ${theme.key === this.currentTheme ? 'active' : ''}" 
               data-theme="${theme.key}">
            <div class="theme-preview" style="background: ${this.themes[theme.key].colors.background}"></div>
            <span class="theme-name">${theme.name}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="accessibility-options">
        <h4>Accessibility</h4>
        <label class="option-label">
          <input type="checkbox" ${this.preferences.reduceMotion ? 'checked' : ''} data-pref="reduceMotion">
          Reduce motion
        </label>
        <label class="option-label">
          <input type="checkbox" ${this.preferences.highContrast ? 'checked' : ''} data-pref="highContrast">
          High contrast
        </label>
        <label class="option-label">
          <input type="checkbox" ${this.preferences.autoTheme ? 'checked' : ''} data-pref="autoTheme">
          Auto theme (follows system)
        </label>
        
        <label class="option-label">
          Font size:
          <select data-pref="fontSize">
            <option value="small" ${this.preferences.fontSize === 'small' ? 'selected' : ''}>Small</option>
            <option value="normal" ${this.preferences.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="large" ${this.preferences.fontSize === 'large' ? 'selected' : ''}>Large</option>
            <option value="xl" ${this.preferences.fontSize === 'xl' ? 'selected' : ''}>Extra Large</option>
          </select>
        </label>
      </div>
    `;

    // Add event listeners
    themeSelector.addEventListener('click', (e) => {
      const themeOption = e.target.closest('.theme-option');
      if (themeOption) {
        const themeName = themeOption.dataset.theme;
        this.switchTheme(themeName);
        
        // Update UI
        themeSelector.querySelectorAll('.theme-option').forEach(option => {
          option.classList.remove('active');
        });
        themeOption.classList.add('active');
      }
    });

    themeSelector.addEventListener('change', (e) => {
      const input = e.target;
      const pref = input.dataset.pref;
      
      if (pref) {
        let value;
        if (input.type === 'checkbox') {
          value = input.checked;
        } else {
          value = input.value;
        }
        
        this.updatePreference(pref, value);
      }
    });

    container.appendChild(themeSelector);
    
    // Add styles for theme selector
    this.injectThemeSelectorStyles();
  },

  /**
   * Inject styles for theme selector
   */
  injectThemeSelectorStyles() {
    const style = document.createElement('style');
    style.id = 'theme-selector-styles';
    style.textContent = `
      .theme-selector {
        background: var(--color-card);
        padding: 24px;
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-medium);
        margin: 20px 0;
      }

      .theme-selector h3, .theme-selector h4 {
        color: var(--color-dark);
        margin-bottom: 16px;
      }

      .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .theme-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        border: 2px solid var(--color-border);
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
      }

      .theme-option:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
      }

      .theme-option.active {
        border-color: var(--color-primary);
        background: var(--color-light);
      }

      .theme-preview {
        width: 60px;
        height: 40px;
        border-radius: var(--border-radius);
        margin-bottom: 8px;
        border: 1px solid var(--color-border);
      }

      .theme-name {
        font-size: 0.9em;
        font-weight: 500;
        color: var(--color-text);
      }

      .accessibility-options {
        border-top: 1px solid var(--color-border);
        padding-top: 20px;
      }

      .option-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 12px 0;
        color: var(--color-text);
        cursor: pointer;
      }

      .option-label input, .option-label select {
        margin-right: 8px;
      }

      .option-label select {
        padding: 4px 8px;
        border: 1px solid var(--color-border);
        border-radius: var(--border-radius);
        background: var(--color-light);
        color: var(--color-text);
      }
    `;

    const existing = document.getElementById('theme-selector-styles');
    if (existing) {
      existing.remove();
    }

    document.head.appendChild(style);
  },

  /**
   * Dispatch theme change event
   */
  dispatchThemeChangeEvent() {
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: {
        theme: this.currentTheme,
        themeData: this.getCurrentTheme()
      }
    }));
  },

  /**
   * Get theme-aware color
   * @param {string} colorName - Name of the color
   * @returns {string} Color value
   */
  getColor(colorName) {
    const theme = this.getCurrentTheme();
    return theme.colors[colorName] || theme.colors.primary;
  },

  /**
   * Generate theme CSS for dynamic injection
   * @returns {string} CSS string
   */
  generateThemeCSS() {
    const theme = this.getCurrentTheme();
    return `
      :root {
        ${Object.entries(theme.colors).map(([key, value]) => `--color-${key}: ${value};`).join('\n        ')}
        --gradient-primary: ${theme.colors.background};
        --shadow-light: 0 2px 4px rgba(0,0,0,0.05);
        --shadow-medium: 0 10px 30px rgba(0,0,0,0.1);
        --shadow-heavy: 0 20px 50px rgba(0,0,0,0.15);
        --border-radius: 8px;
        --border-radius-lg: 15px;
        --transition: ${this.preferences.reduceMotion ? 'none' : 'all 0.3s'};
        --base-font-size: ${this.preferences.fontSize === 'small' ? '14px' : 
                           this.preferences.fontSize === 'large' ? '18px' : 
                           this.preferences.fontSize === 'xl' ? '20px' : '16px'};
      }
    `;
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AdvancedThemeManager.init());
} else {
  AdvancedThemeManager.init();
}

// Make available globally
window.AdvancedThemeManager = AdvancedThemeManager;