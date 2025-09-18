/**
 * LifeOS Theme Manager
 * Customize colors, gradients, and appearance settings
 */

class ThemeManager {
    constructor() {
        this.themes = new Map();
        this.currentTheme = 'default';
        this.customTheme = null;
        this.setupDefaultThemes();
        this.loadSavedTheme();
    }

    /**
     * Setup default theme presets
     */
    setupDefaultThemes() {
        this.themes.set('default', {
            name: 'Ocean Breeze',
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#52c41a',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('sunset', {
            name: 'Sunset Glow',
            primary: '#ff6b6b',
            secondary: '#ffa726',
            accent: '#4fc3f7',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('forest', {
            name: 'Forest Deep',
            primary: '#4caf50',
            secondary: '#2e7d32',
            accent: '#81c784',
            background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('midnight', {
            name: 'Midnight Purple',
            primary: '#673ab7',
            secondary: '#3f51b5',
            accent: '#9c27b0',
            background: 'linear-gradient(135deg, #673ab7 0%, #3f51b5 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('rose', {
            name: 'Rose Garden',
            primary: '#e91e63',
            secondary: '#ad1457',
            accent: '#f06292',
            background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('arctic', {
            name: 'Arctic Ice',
            primary: '#00bcd4',
            secondary: '#0097a7',
            accent: '#4dd0e1',
            background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        });

        this.themes.set('dark', {
            name: 'Dark Mode',
            primary: '#bb86fc',
            secondary: '#3700b3',
            accent: '#03dac6',
            background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)',
            cardBg: 'rgba(45, 45, 45, 0.95)',
            textPrimary: '#ffffff',
            textSecondary: '#cccccc',
            borderRadius: '15px'
        });
    }

    /**
     * Apply theme to the page
     * @param {string} themeId - Theme identifier
     */
    applyTheme(themeId) {
        const theme = this.themes.get(themeId) || this.customTheme;
        if (!theme) return;

        this.currentTheme = themeId;
        
        // Apply CSS custom properties
        document.documentElement.style.setProperty('--primary-color', theme.primary);
        document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        document.documentElement.style.setProperty('--accent-color', theme.accent);
        document.documentElement.style.setProperty('--background-gradient', theme.background);
        document.documentElement.style.setProperty('--card-background', theme.cardBg);
        document.documentElement.style.setProperty('--text-primary', theme.textPrimary);
        document.documentElement.style.setProperty('--text-secondary', theme.textSecondary);
        document.documentElement.style.setProperty('--border-radius', theme.borderRadius);

        // Update body background
        document.body.style.background = theme.background;

        // Update navigation items
        this.updateNavItems(theme);
        
        // Update module content
        this.updateModuleContent(theme);
        
        // Update widgets if present
        this.updateWidgets(theme);

        // Save theme preference
        StorageUtils.set('lifeos_theme', themeId);
        
        // Emit theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeId, themeData: theme }
        }));
    }

    /**
     * Update navigation items with theme colors
     */
    updateNavItems(theme) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.style.background = theme.cardBg;
            item.style.color = theme.textPrimary;
            
            // Update hover border color
            item.addEventListener('mouseenter', () => {
                item.style.borderColor = theme.primary;
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.borderColor = 'transparent';
                }
            });
            
            // Update active state
            if (item.classList.contains('active')) {
                item.style.background = theme.background;
                item.style.color = 'white';
            }
        });
    }

    /**
     * Update module content with theme colors
     */
    updateModuleContent(theme) {
        const moduleContent = document.getElementById('module-content');
        if (moduleContent) {
            moduleContent.style.background = theme.cardBg;
            moduleContent.style.color = theme.textPrimary;
        }
    }

    /**
     * Update widgets with theme colors
     */
    updateWidgets(theme) {
        const widgets = document.querySelectorAll('.widget');
        widgets.forEach(widget => {
            widget.style.background = theme.cardBg;
            widget.style.color = theme.textPrimary;
        });
    }

    /**
     * Create theme customizer UI
     */
    createThemeCustomizer() {
        const customizer = document.createElement('div');
        customizer.id = 'theme-customizer';
        customizer.innerHTML = `
            <div class="theme-customizer-panel">
                <div class="theme-header">
                    <h3>🎨 Customize Theme</h3>
                    <button class="close-customizer" onclick="this.closest('#theme-customizer').style.display='none'">×</button>
                </div>
                
                <div class="theme-presets">
                    <h4>Preset Themes</h4>
                    <div class="preset-grid">
                        ${Array.from(this.themes.entries()).map(([id, theme]) => `
                            <div class="preset-item ${id === this.currentTheme ? 'active' : ''}" 
                                 data-theme="${id}" 
                                 style="background: ${theme.background}">
                                <span class="preset-name">${theme.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="custom-theme">
                    <h4>Custom Colors</h4>
                    <div class="color-inputs">
                        <div class="color-group">
                            <label>Primary Color</label>
                            <input type="color" id="primary-color" value="${this.getCurrentTheme().primary}">
                        </div>
                        <div class="color-group">
                            <label>Secondary Color</label>
                            <input type="color" id="secondary-color" value="${this.getCurrentTheme().secondary}">
                        </div>
                        <div class="color-group">
                            <label>Accent Color</label>
                            <input type="color" id="accent-color" value="${this.getCurrentTheme().accent}">
                        </div>
                    </div>
                    <button class="apply-custom-btn">Apply Custom Theme</button>
                </div>
                
                <div class="theme-actions">
                    <button class="export-theme-btn">Export Theme</button>
                    <button class="import-theme-btn">Import Theme</button>
                    <input type="file" id="theme-import-file" accept=".json" style="display: none;">
                </div>
            </div>
        `;

        this.addCustomizerStyles();
        document.body.appendChild(customizer);
        this.attachCustomizerEvents();
    }

    /**
     * Add theme customizer styles
     */
    addCustomizerStyles() {
        if (document.querySelector('#theme-customizer-styles')) return;

        const style = document.createElement('style');
        style.id = 'theme-customizer-styles';
        style.textContent = `
            #theme-customizer {
                position: fixed;
                top: 0;
                right: -400px;
                width: 380px;
                height: 100vh;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(10px);
                box-shadow: -5px 0 20px rgba(0,0,0,0.1);
                z-index: 10000;
                transition: right 0.3s ease;
                overflow-y: auto;
            }
            
            #theme-customizer.open {
                right: 0;
            }
            
            .theme-customizer-panel {
                padding: 20px;
            }
            
            .theme-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            
            .theme-header h3 {
                margin: 0;
                color: #333;
                font-size: 18px;
            }
            
            .close-customizer {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-customizer:hover {
                background: #f0f0f0;
            }
            
            .theme-presets h4,
            .custom-theme h4 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 14px;
                font-weight: 600;
            }
            
            .preset-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 30px;
            }
            
            .preset-item {
                padding: 15px 10px;
                border-radius: 10px;
                text-align: center;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .preset-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .preset-item.active {
                border-color: #fff;
                box-shadow: 0 0 0 2px #667eea;
            }
            
            .preset-name {
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            .color-inputs {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .color-group {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .color-group label {
                font-size: 13px;
                color: #666;
                font-weight: 500;
            }
            
            .color-group input[type="color"] {
                width: 40px;
                height: 40px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .apply-custom-btn,
            .export-theme-btn,
            .import-theme-btn {
                width: 100%;
                padding: 12px;
                border: none;
                border-radius: 8px;
                background: #667eea;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s ease;
                margin-bottom: 10px;
            }
            
            .apply-custom-btn:hover,
            .export-theme-btn:hover,
            .import-theme-btn:hover {
                background: #5a6fd8;
            }
            
            .theme-actions {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Attach event listeners to customizer
     */
    attachCustomizerEvents() {
        // Preset theme selection
        document.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                const themeId = item.dataset.theme;
                this.applyTheme(themeId);
                
                // Update active state
                document.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Custom theme application
        document.querySelector('.apply-custom-btn').addEventListener('click', () => {
            this.applyCustomTheme();
        });

        // Export theme
        document.querySelector('.export-theme-btn').addEventListener('click', () => {
            this.exportTheme();
        });

        // Import theme
        document.querySelector('.import-theme-btn').addEventListener('click', () => {
            document.getElementById('theme-import-file').click();
        });

        document.getElementById('theme-import-file').addEventListener('change', (e) => {
            this.importTheme(e.target.files[0]);
        });
    }

    /**
     * Apply custom theme from color inputs
     */
    applyCustomTheme() {
        const primary = document.getElementById('primary-color').value;
        const secondary = document.getElementById('secondary-color').value;
        const accent = document.getElementById('accent-color').value;

        this.customTheme = {
            name: 'Custom Theme',
            primary: primary,
            secondary: secondary,
            accent: accent,
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
            cardBg: 'rgba(255, 255, 255, 0.95)',
            textPrimary: '#333333',
            textSecondary: '#666666',
            borderRadius: '15px'
        };

        this.applyTheme('custom');
        
        // Update active preset
        document.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
    }

    /**
     * Export current theme
     */
    exportTheme() {
        const theme = this.getCurrentTheme();
        const exportData = {
            name: theme.name,
            ...theme,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifeos-theme-${theme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import theme from file
     */
    async importTheme(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const themeData = JSON.parse(text);
            
            // Validate theme data
            if (!this.validateThemeData(themeData)) {
                throw new Error('Invalid theme file format');
            }

            // Apply imported theme
            this.customTheme = themeData;
            this.applyTheme('custom');
            
            // Update color inputs
            document.getElementById('primary-color').value = themeData.primary;
            document.getElementById('secondary-color').value = themeData.secondary;
            document.getElementById('accent-color').value = themeData.accent;

        } catch (error) {
            alert('Error importing theme: ' + error.message);
        }
    }

    /**
     * Validate theme data structure
     */
    validateThemeData(data) {
        const required = ['name', 'primary', 'secondary', 'accent', 'background'];
        return required.every(prop => data.hasOwnProperty(prop));
    }

    /**
     * Get current theme data
     */
    getCurrentTheme() {
        if (this.currentTheme === 'custom' && this.customTheme) {
            return this.customTheme;
        }
        return this.themes.get(this.currentTheme) || this.themes.get('default');
    }

    /**
     * Load saved theme preference
     */
    loadSavedTheme() {
        const savedTheme = StorageUtils.get('lifeos_theme', 'default');
        const savedCustom = StorageUtils.get('lifeos_custom_theme');
        
        if (savedCustom) {
            this.customTheme = savedCustom;
        }
        
        this.applyTheme(savedTheme);
    }

    /**
     * Show theme customizer
     */
    showCustomizer() {
        if (!document.getElementById('theme-customizer')) {
            this.createThemeCustomizer();
        }
        
        document.getElementById('theme-customizer').classList.add('open');
    }

    /**
     * Hide theme customizer
     */
    hideCustomizer() {
        const customizer = document.getElementById('theme-customizer');
        if (customizer) {
            customizer.classList.remove('open');
        }
    }

    /**
     * Add theme button to navigation
     */
    addThemeButton() {
        const container = document.querySelector('.container');
        if (!container) return;

        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle-btn';
        themeButton.innerHTML = '🎨';
        themeButton.title = 'Customize Theme';
        themeButton.onclick = () => this.showCustomizer();

        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            .theme-toggle-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                border: none;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(10px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                cursor: pointer;
                font-size: 20px;
                transition: all 0.3s ease;
                z-index: 1000;
            }
            
            .theme-toggle-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            }
        `;
        
        if (!document.querySelector('#theme-button-styles')) {
            style.id = 'theme-button-styles';
            document.head.appendChild(style);
        }

        container.appendChild(themeButton);
    }
}

// Create global instance
window.ThemeManager = new ThemeManager();