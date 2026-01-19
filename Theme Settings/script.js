/**
 * Theme Settings Script
 * Manages theme selection and accessibility preferences
 */

let themeManager;

// Initialize theme settings page
document.addEventListener('DOMContentLoaded', function() {
    themeManager = window.AdvancedThemeManager;
    initializeThemeSettings();
    setupEventListeners();
    updateUI();
});

/**
 * Initialize theme settings interface
 */
function initializeThemeSettings() {
    populateThemeGrid();
    loadCurrentPreferences();
    setupThemeChangeListener();
}

/**
 * Populate the theme selection grid
 */
function populateThemeGrid() {
    const themeGrid = document.querySelector('.theme-grid');
    const themes = themeManager.getAvailableThemes();
    
    themeGrid.innerHTML = themes.map(theme => `
        <div class="theme-option ${theme.key === themeManager.currentTheme ? 'active' : ''}" 
             data-theme="${theme.key}" 
             role="radio" 
             aria-checked="${theme.key === themeManager.currentTheme}"
             aria-labelledby="theme-${theme.key}-label"
             tabindex="0">
            <div class="theme-preview" 
                 style="background: ${themeManager.themes[theme.key].colors.background}"
                 aria-hidden="true"></div>
            <div class="theme-name" id="theme-${theme.key}-label">${theme.name}</div>
            <div class="theme-type">${theme.type}</div>
        </div>
    `).join('');
}

/**
 * Load current preferences and update UI
 */
function loadCurrentPreferences() {
    // Update checkboxes
    document.getElementById('reduceMotion').checked = themeManager.preferences.reduceMotion;
    document.getElementById('highContrast').checked = themeManager.preferences.highContrast;
    document.getElementById('autoTheme').checked = themeManager.preferences.autoTheme;
    
    // Update font size radio buttons
    const fontSizeInputs = document.querySelectorAll('input[name="fontSize"]');
    fontSizeInputs.forEach(input => {
        input.checked = input.value === themeManager.preferences.fontSize;
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Theme selection
    const themeGrid = document.querySelector('.theme-grid');
    themeGrid.addEventListener('click', handleThemeSelection);
    themeGrid.addEventListener('keydown', handleThemeKeyboard);
    
    // Accessibility preferences
    const preferenceInputs = document.querySelectorAll('[data-pref]');
    preferenceInputs.forEach(input => {
        input.addEventListener('change', handlePreferenceChange);
    });
    
    // Modal events
    document.addEventListener('keydown', handleModalKeyboard);
}

/**
 * Handle theme selection
 */
function handleThemeSelection(e) {
    const themeOption = e.target.closest('.theme-option');
    if (!themeOption) return;
    
    const themeName = themeOption.dataset.theme;
    switchToTheme(themeName);
}

/**
 * Handle keyboard navigation in theme grid
 */
function handleThemeKeyboard(e) {
    const themeOption = e.target.closest('.theme-option');
    if (!themeOption) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const themeName = themeOption.dataset.theme;
        switchToTheme(themeName);
    }
    
    // Arrow key navigation
    const themeOptions = Array.from(document.querySelectorAll('.theme-option'));
    const currentIndex = themeOptions.indexOf(themeOption);
    
    let newIndex;
    switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
            newIndex = (currentIndex + 1) % themeOptions.length;
            break;
        case 'ArrowLeft':
        case 'ArrowUp':
            newIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length;
            break;
        default:
            return;
    }
    
    if (newIndex !== undefined) {
        e.preventDefault();
        themeOptions[newIndex].focus();
    }
}

/**
 * Switch to a theme and update UI
 */
function switchToTheme(themeName) {
    themeManager.switchTheme(themeName);
    updateThemeSelection();
    updatePreview();
    updateThemeInfo();
    showToast(`Switched to ${themeManager.getCurrentTheme().name} theme`, 'success');
}

/**
 * Update theme selection UI
 */
function updateThemeSelection() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        const isActive = option.dataset.theme === themeManager.currentTheme;
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-checked', isActive);
    });
}

/**
 * Handle preference changes
 */
function handlePreferenceChange(e) {
    const preference = e.target.dataset.pref;
    let value;
    
    if (e.target.type === 'checkbox') {
        value = e.target.checked;
    } else if (e.target.type === 'radio') {
        value = e.target.value;
    } else {
        value = e.target.value;
    }
    
    themeManager.updatePreference(preference, value);
    updateAccessibilityStatus();
    updatePreview();
    
    const prefName = preference.replace(/([A-Z])/g, ' $1').toLowerCase();
    showToast(`Updated ${prefName} preference`, 'success');
}

/**
 * Setup theme change listener
 */
function setupThemeChangeListener() {
    window.addEventListener('themeChanged', (e) => {
        updateUI();
    });
}

/**
 * Update all UI elements
 */
function updateUI() {
    updateThemeSelection();
    updatePreview();
    updateThemeInfo();
    updateAccessibilityStatus();
}

/**
 * Update preview card
 */
function updatePreview() {
    // The preview updates automatically through CSS variables
    // This could be enhanced with more dynamic preview content
}

/**
 * Update theme information
 */
function updateThemeInfo() {
    const currentTheme = themeManager.getCurrentTheme();
    document.getElementById('current-theme-name').textContent = currentTheme.name;
    document.getElementById('current-theme-type').textContent = 
        currentTheme.type.charAt(0).toUpperCase() + currentTheme.type.slice(1);
}

/**
 * Update accessibility status
 */
function updateAccessibilityStatus() {
    const features = [];
    
    if (themeManager.preferences.reduceMotion) features.push('Reduced Motion');
    if (themeManager.preferences.highContrast) features.push('High Contrast');
    if (themeManager.preferences.autoTheme) features.push('Auto Theme');
    if (themeManager.preferences.fontSize !== 'normal') {
        features.push(`${themeManager.preferences.fontSize.charAt(0).toUpperCase() + 
                      themeManager.preferences.fontSize.slice(1)} Text`);
    }
    
    document.getElementById('accessibility-status').textContent = 
        features.length > 0 ? features.join(', ') : 'Standard';
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    themeManager.toggleDarkMode();
    updateUI();
    
    const isDark = themeManager.getCurrentTheme().type === 'dark';
    showToast(`Switched to ${isDark ? 'dark' : 'light'} mode`, 'success');
}

/**
 * Reset all settings to defaults
 */
function resetToDefaults() {
    if (confirm('Reset all theme and accessibility settings to defaults?')) {
        // Reset to default theme
        themeManager.switchTheme('lifeos');
        
        // Reset all preferences
        themeManager.updatePreference('reduceMotion', false);
        themeManager.updatePreference('highContrast', false);
        themeManager.updatePreference('autoTheme', false);
        themeManager.updatePreference('fontSize', 'normal');
        
        // Update UI
        loadCurrentPreferences();
        updateUI();
        
        showToast('Settings reset to defaults', 'success');
    }
}

/**
 * Export theme settings
 */
function exportThemeSettings() {
    const settings = {
        theme: themeManager.currentTheme,
        preferences: themeManager.preferences,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifeos-theme-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showToast('Theme settings exported', 'success');
}

/**
 * Show import dialog
 */
function showImportDialog() {
    const modal = document.getElementById('import-dialog');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus the textarea
    setTimeout(() => {
        document.getElementById('import-textarea').focus();
    }, 100);
}

/**
 * Hide import dialog
 */
function hideImportDialog() {
    const modal = document.getElementById('import-dialog');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    // Clear textarea
    document.getElementById('import-textarea').value = '';
}

/**
 * Import theme settings
 */
function importThemeSettings() {
    const textarea = document.getElementById('import-textarea');
    const importData = textarea.value.trim();
    
    if (!importData) {
        showToast('Please paste theme settings data', 'error');
        return;
    }
    
    try {
        const settings = JSON.parse(importData);
        
        // Validate settings structure
        if (!settings.theme || !settings.preferences) {
            throw new Error('Invalid settings format');
        }
        
        // Check if theme exists
        if (!themeManager.themes[settings.theme]) {
            throw new Error(`Theme '${settings.theme}' not found`);
        }
        
        // Apply settings
        themeManager.switchTheme(settings.theme);
        
        Object.keys(settings.preferences).forEach(key => {
            if (key in themeManager.preferences) {
                themeManager.updatePreference(key, settings.preferences[key]);
            }
        });
        
        // Update UI
        loadCurrentPreferences();
        updateUI();
        
        hideImportDialog();
        showToast('Theme settings imported successfully', 'success');
        
    } catch (error) {
        console.error('Import error:', error);
        showToast('Failed to import settings: ' + error.message, 'error');
    }
}

/**
 * Handle modal keyboard events
 */
function handleModalKeyboard(e) {
    const modal = document.querySelector('.modal.show');
    if (!modal) return;
    
    if (e.key === 'Escape') {
        hideImportDialog();
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Global functions for HTML onclick handlers
window.toggleDarkMode = toggleDarkMode;
window.resetToDefaults = resetToDefaults;
window.exportThemeSettings = exportThemeSettings;
window.showImportDialog = showImportDialog;
window.hideImportDialog = hideImportDialog;
window.importThemeSettings = importThemeSettings;