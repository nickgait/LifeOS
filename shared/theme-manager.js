/**
 * LifeOS Theme Manager
 * Consistent styling and theming across all apps
 */

const ThemeManager = {
  // Theme configuration
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    light: '#f9fafb',
    dark: '#333',
    border: '#e0e0e0',
    text: '#666',
    textLight: '#999'
  },

  // Current theme
  currentTheme: 'light',

  /**
   * Get a color by name
   * @param {string} colorName - Name of the color
   * @returns {string} Hex color code
   */
  getColor(colorName) {
    return this.colors[colorName] || '#667eea';
  },

  /**
   * Get gradient string
   * @param {string} type - Type of gradient ('primary', 'subtle', etc.)
   * @returns {string} CSS gradient
   */
  getGradient(type = 'primary') {
    const gradients = {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      subtle: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    };
    return gradients[type] || gradients.primary;
  },

  /**
   * Get shadow style
   * @param {string} intensity - 'light', 'medium', 'heavy'
   * @returns {string} Box shadow CSS
   */
  getShadow(intensity = 'medium') {
    const shadows = {
      light: '0 2px 4px rgba(0,0,0,0.05)',
      medium: '0 10px 30px rgba(0,0,0,0.1)',
      heavy: '0 20px 50px rgba(0,0,0,0.15)'
    };
    return shadows[intensity] || shadows.medium;
  },

  /**
   * Create CSS variable string for use in :root
   * @returns {string} CSS variables
   */
  getCSSVariables() {
    return `
      --color-primary: ${this.colors.primary};
      --color-secondary: ${this.colors.secondary};
      --color-success: ${this.colors.success};
      --color-danger: ${this.colors.danger};
      --color-warning: ${this.colors.warning};
      --color-info: ${this.colors.info};
      --color-light: ${this.colors.light};
      --color-dark: ${this.colors.dark};
      --color-border: ${this.colors.border};
      --color-text: ${this.colors.text};
      --color-text-light: ${this.colors.textLight};
      --gradient-primary: ${this.getGradient('primary')};
      --shadow-medium: ${this.getShadow('medium')};
      --border-radius: 8px;
      --border-radius-lg: 15px;
      --transition: all 0.3s;
    `;
  },

  /**
   * Initialize theme in document
   */
  init() {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        ${this.getCSSVariables()}
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Get button style object
   * @param {string} variant - 'primary', 'secondary', 'danger', etc.
   * @returns {object} Style object
   */
  getButtonStyle(variant = 'primary') {
    const styles = {
      primary: {
        background: this.colors.primary,
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.3s'
      },
      secondary: {
        background: this.colors.light,
        color: this.colors.dark,
        padding: '12px 24px',
        border: `2px solid ${this.colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.3s'
      },
      danger: {
        background: this.colors.danger,
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.3s'
      }
    };
    return styles[variant] || styles.primary;
  },

  /**
   * Get card style object
   * @returns {object} Style object
   */
  getCardStyle() {
    return {
      background: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: this.getShadow('medium'),
      border: `1px solid ${this.colors.border}`
    };
  },

  /**
   * Get input style object
   * @returns {object} Style object
   */
  getInputStyle() {
    return {
      padding: '10px',
      border: `2px solid ${this.colors.border}`,
      borderRadius: '8px',
      fontSize: '14px',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'border 0.3s'
    };
  }
};

// Initialize theme on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
  ThemeManager.init();
}

// Make available globally
window.ThemeManager = ThemeManager;
