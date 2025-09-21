/**
 * LifeOS Global Search
 * Search across all modules with intelligent filtering and ranking
 */

class GlobalSearch {
    constructor() {
        this.searchIndex = new Map();
        this.searchResults = [];
        this.isIndexing = false;
        this.lastIndexUpdate = null;
        this.searchHistory = [];
        this.maxHistory = 20;
        
        this.modules = {
            'todoList': {
                name: 'Tasks',
                icon: '✓',
                color: '#667eea',
                searchFields: ['text', 'description', 'category', 'tags']
            },
            'habits': {
                name: 'Habits',
                icon: '🔄',
                color: '#52c41a',
                searchFields: ['name', 'description', 'category', 'notes']
            },
            'goals': {
                name: 'Goals',
                icon: '🎯',
                color: '#fa8c16',
                searchFields: ['title', 'description', 'category', 'milestones']
            },
            'fitness': {
                name: 'Fitness',
                icon: '💪',
                color: '#eb2f96',
                searchFields: ['name', 'type', 'notes', 'exercises']
            },
            'finance': {
                name: 'Finance',
                icon: '💰',
                color: '#13c2c2',
                searchFields: ['description', 'category', 'notes', 'tags']
            },
            'journal': {
                name: 'Journal',
                icon: '📝',
                color: '#722ed1',
                searchFields: ['title', 'content', 'mood', 'tags']
            },
            'poetry': {
                name: 'Poetry',
                icon: '🖋️',
                color: '#2d1b4e',
                searchFields: ['title', 'content', 'theme', 'tags']
            }
        };
        
        this.initializeSearch();
    }

    /**
     * Initialize search system
     */
    async initializeSearch() {
        await this.buildSearchIndex();
        this.loadSearchHistory();
        this.setupSearchUI();
    }

    /**
     * Build search index from all modules
     */
    async buildSearchIndex() {
        if (this.isIndexing) return;
        
        this.isIndexing = true;
        this.searchIndex.clear();
        
        console.log('Building search index...');
        
        for (const [moduleKey, moduleConfig] of Object.entries(this.modules)) {
            try {
                await this.indexModule(moduleKey, moduleConfig);
            } catch (error) {
                console.error(`Error indexing module ${moduleKey}:`, error);
            }
        }
        
        this.lastIndexUpdate = new Date().toISOString();
        this.isIndexing = false;
        
        console.log(`Search index built with ${this.searchIndex.size} items`);
    }

    /**
     * Index a specific module
     */
    async indexModule(moduleKey, moduleConfig) {
        const moduleData = window.StorageUtils.getModuleData(moduleKey);
        
        Object.entries(moduleData).forEach(([dataKey, items]) => {
            if (Array.isArray(items)) {
                items.forEach((item, index) => {
                    const searchItem = this.createSearchItem(item, moduleKey, moduleConfig, dataKey, index);
                    if (searchItem) {
                        const itemId = `${moduleKey}_${dataKey}_${index}`;
                        this.searchIndex.set(itemId, searchItem);
                    }
                });
            } else if (typeof items === 'object' && items !== null) {
                // Handle object data
                const searchItem = this.createSearchItem(items, moduleKey, moduleConfig, dataKey, 0);
                if (searchItem) {
                    const itemId = `${moduleKey}_${dataKey}_0`;
                    this.searchIndex.set(itemId, searchItem);
                }
            }
        });
    }

    /**
     * Create searchable item
     */
    createSearchItem(item, moduleKey, moduleConfig, dataKey, index) {
        if (!item || typeof item !== 'object') return null;
        
        const searchableText = this.extractSearchableText(item, moduleConfig.searchFields);
        if (!searchableText.trim()) return null;
        
        return {
            id: `${moduleKey}_${dataKey}_${index}`,
            module: moduleKey,
            moduleName: moduleConfig.name,
            moduleIcon: moduleConfig.icon,
            moduleColor: moduleConfig.color,
            dataKey: dataKey,
            index: index,
            title: this.extractTitle(item),
            subtitle: this.extractSubtitle(item),
            content: searchableText,
            keywords: this.extractKeywords(searchableText),
            data: item,
            lastModified: item.lastModified || item.date || item.createdAt || new Date().toISOString(),
            type: this.determineItemType(item, dataKey),
            url: this.generateItemUrl(moduleKey, item, dataKey)
        };
    }

    /**
     * Extract searchable text from item
     */
    extractSearchableText(item, searchFields) {
        const texts = [];
        
        searchFields.forEach(field => {
            const value = this.getNestedValue(item, field);
            if (value) {
                if (Array.isArray(value)) {
                    texts.push(...value.map(v => String(v)));
                } else {
                    texts.push(String(value));
                }
            }
        });
        
        return texts.join(' ').trim();
    }

    /**
     * Get nested object value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Extract title for search result
     */
    extractTitle(item) {
        return item.title || item.name || item.text || item.description || 'Untitled';
    }

    /**
     * Extract subtitle for search result
     */
    extractSubtitle(item) {
        if (item.description && item.description !== item.title) {
            return item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '');
        }
        if (item.content) {
            return item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '');
        }
        if (item.category) {
            return `Category: ${item.category}`;
        }
        return '';
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
            
        // Remove duplicates and return
        return [...new Set(words)];
    }

    /**
     * Check if word is a stop word
     */
    isStopWord(word) {
        const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'];
        return stopWords.includes(word);
    }

    /**
     * Determine item type
     */
    determineItemType(item, dataKey) {
        if (dataKey.includes('task')) return 'task';
        if (dataKey.includes('habit')) return 'habit';
        if (dataKey.includes('goal')) return 'goal';
        if (dataKey.includes('workout')) return 'workout';
        if (dataKey.includes('transaction')) return 'transaction';
        if (dataKey.includes('entry')) return 'journal_entry';
        if (dataKey.includes('poem')) return 'poem';
        return 'item';
    }

    /**
     * Generate URL for item
     */
    generateItemUrl(moduleKey, item, dataKey) {
        const moduleMap = {
            'todoList': 'ToDoList',
            'habits': 'Habits',
            'goals': 'Goals',
            'fitness': 'Fitness',
            'finance': 'Finance',
            'journal': 'Journal',
            'poetry': 'Poetry'
        };
        
        const modulePath = moduleMap[moduleKey] || moduleKey;
        const itemId = item.id || '';
        
        return `/${modulePath}/index.html${itemId ? `#${itemId}` : ''}`;
    }

    /**
     * Perform search
     */
    async search(query, options = {}) {
        if (!query || query.trim().length < 2) {
            return { results: [], total: 0, query: query };
        }
        
        const searchQuery = query.trim().toLowerCase();
        const results = [];
        
        // Search through index
        for (const [itemId, searchItem] of this.searchIndex) {
            const score = this.calculateRelevanceScore(searchQuery, searchItem, options);
            if (score > 0) {
                results.push({
                    ...searchItem,
                    score: score,
                    matchedTerms: this.getMatchedTerms(searchQuery, searchItem)
                });
            }
        }
        
        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);
        
        // Apply filters
        const filteredResults = this.applyFilters(results, options);
        
        // Pagination
        const { page = 1, limit = 50 } = options;
        const startIndex = (page - 1) * limit;
        const paginatedResults = filteredResults.slice(startIndex, startIndex + limit);
        
        // Add to search history
        this.addToSearchHistory(query, filteredResults.length);
        
        this.searchResults = filteredResults;
        
        return {
            results: paginatedResults,
            total: filteredResults.length,
            query: query,
            page: page,
            totalPages: Math.ceil(filteredResults.length / limit),
            facets: this.generateFacets(filteredResults)
        };
    }

    /**
     * Calculate relevance score
     */
    calculateRelevanceScore(query, searchItem, options) {
        let score = 0;
        const queryTerms = query.split(/\s+/);
        
        queryTerms.forEach(term => {
            // Title matches (highest weight)
            if (searchItem.title.toLowerCase().includes(term)) {
                score += 100;
            }
            
            // Exact keyword matches
            if (searchItem.keywords.includes(term)) {
                score += 50;
            }
            
            // Content matches
            if (searchItem.content.toLowerCase().includes(term)) {
                score += 20;
            }
            
            // Fuzzy matches
            const fuzzyScore = this.calculateFuzzyScore(term, searchItem);
            score += fuzzyScore;
        });
        
        // Boost for recent items
        if (searchItem.lastModified) {
            const daysSinceModified = (Date.now() - new Date(searchItem.lastModified)) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < 7) {
                score *= 1.5; // 50% boost for items modified in last week
            } else if (daysSinceModified < 30) {
                score *= 1.2; // 20% boost for items modified in last month
            }
        }
        
        // Module-specific boosts
        if (options.preferredModules && options.preferredModules.includes(searchItem.module)) {
            score *= 1.3;
        }
        
        return score;
    }

    /**
     * Calculate fuzzy match score
     */
    calculateFuzzyScore(term, searchItem) {
        let score = 0;
        
        // Check if any keyword starts with the term
        searchItem.keywords.forEach(keyword => {
            if (keyword.startsWith(term)) {
                score += 10;
            } else if (keyword.includes(term)) {
                score += 5;
            }
        });
        
        return score;
    }

    /**
     * Get matched terms for highlighting
     */
    getMatchedTerms(query, searchItem) {
        const queryTerms = query.split(/\s+/);
        const matchedTerms = [];
        
        queryTerms.forEach(term => {
            if (searchItem.content.toLowerCase().includes(term)) {
                matchedTerms.push(term);
            }
        });
        
        return matchedTerms;
    }

    /**
     * Apply filters to results
     */
    applyFilters(results, options) {
        let filtered = results;
        
        // Module filter
        if (options.modules && options.modules.length > 0) {
            filtered = filtered.filter(result => options.modules.includes(result.module));
        }
        
        // Date range filter
        if (options.dateFrom || options.dateTo) {
            filtered = filtered.filter(result => {
                const itemDate = new Date(result.lastModified);
                const fromDate = options.dateFrom ? new Date(options.dateFrom) : new Date(0);
                const toDate = options.dateTo ? new Date(options.dateTo) : new Date();
                
                return itemDate >= fromDate && itemDate <= toDate;
            });
        }
        
        // Type filter
        if (options.types && options.types.length > 0) {
            filtered = filtered.filter(result => options.types.includes(result.type));
        }
        
        return filtered;
    }

    /**
     * Generate search facets
     */
    generateFacets(results) {
        const facets = {
            modules: {},
            types: {},
            dates: {}
        };
        
        results.forEach(result => {
            // Module facets
            facets.modules[result.module] = facets.modules[result.module] || {
                name: result.moduleName,
                icon: result.moduleIcon,
                count: 0
            };
            facets.modules[result.module].count++;
            
            // Type facets
            facets.types[result.type] = (facets.types[result.type] || 0) + 1;
            
            // Date facets (by month)
            if (result.lastModified) {
                const date = new Date(result.lastModified);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                facets.dates[monthKey] = (facets.dates[monthKey] || 0) + 1;
            }
        });
        
        return facets;
    }

    /**
     * Add search to history
     */
    addToSearchHistory(query, resultCount) {
        const historyItem = {
            query: query,
            timestamp: new Date().toISOString(),
            resultCount: resultCount
        };
        
        // Remove duplicate if exists
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // Add to beginning
        this.searchHistory.unshift(historyItem);
        
        // Limit history size
        if (this.searchHistory.length > this.maxHistory) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistory);
        }
        
        // Save to storage
        window.StorageUtils.set('lifeos_search_history', this.searchHistory);
    }

    /**
     * Load search history
     */
    loadSearchHistory() {
        this.searchHistory = window.StorageUtils.get('lifeos_search_history', []);
    }

    /**
     * Get search suggestions
     */
    getSearchSuggestions(query) {
        if (!query || query.length < 2) {
            return this.getPopularSearches();
        }
        
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Get suggestions from search history
        this.searchHistory.forEach(item => {
            if (item.query.toLowerCase().includes(queryLower) && item.query !== query) {
                suggestions.push({
                    text: item.query,
                    type: 'history',
                    resultCount: item.resultCount
                });
            }
        });
        
        // Get suggestions from index keywords
        const keywordSuggestions = new Set();
        this.searchIndex.forEach(item => {
            item.keywords.forEach(keyword => {
                if (keyword.includes(queryLower) && !keywordSuggestions.has(keyword)) {
                    keywordSuggestions.add(keyword);
                    suggestions.push({
                        text: keyword,
                        type: 'keyword',
                        module: item.moduleName
                    });
                }
            });
        });
        
        return suggestions.slice(0, 10);
    }

    /**
     * Get popular searches
     */
    getPopularSearches() {
        return this.searchHistory
            .slice(0, 5)
            .map(item => ({
                text: item.query,
                type: 'recent',
                resultCount: item.resultCount
            }));
    }

    /**
     * Setup search UI
     */
    setupSearchUI() {
        this.createSearchInterface();
        this.attachSearchEvents();
    }

    /**
     * Create search interface
     */
    createSearchInterface() {
        // Add search button to main interface
        const searchButton = document.createElement('button');
        searchButton.id = 'global-search-btn';
        searchButton.className = 'global-search-btn';
        searchButton.innerHTML = '🔍';
        searchButton.title = 'Global Search';
        searchButton.onclick = () => this.showSearchModal();

        // Add search modal
        const searchModal = document.createElement('div');
        searchModal.id = 'global-search-modal';
        searchModal.className = 'global-search-modal';
        searchModal.innerHTML = `
            <div class="search-modal-overlay" onclick="GlobalSearch.hideSearchModal()"></div>
            <div class="search-modal-content">
                <div class="search-header">
                    <div class="search-input-container">
                        <input type="text" id="global-search-input" placeholder="Search across all modules..." autocomplete="off">
                        <button class="search-clear-btn" onclick="GlobalSearch.clearSearch()">×</button>
                    </div>
                    <button class="search-close-btn" onclick="GlobalSearch.hideSearchModal()">×</button>
                </div>
                
                <div class="search-filters">
                    <div class="filter-group">
                        <label>Modules:</label>
                        <div class="module-filters" id="module-filters"></div>
                    </div>
                </div>
                
                <div class="search-suggestions" id="search-suggestions"></div>
                <div class="search-results" id="search-results"></div>
                
                <div class="search-footer">
                    <div class="search-stats" id="search-stats"></div>
                    <div class="search-actions">
                        <button class="rebuild-index-btn" onclick="GlobalSearch.rebuildIndex()">🔄 Rebuild Index</button>
                    </div>
                </div>
            </div>
        `;

        this.addSearchStyles();
        
        // Add to page
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(searchButton);
            document.body.appendChild(searchModal);
            
            this.setupModuleFilters();
        }
    }

    /**
     * Setup module filter checkboxes
     */
    setupModuleFilters() {
        const container = document.getElementById('module-filters');
        if (!container) return;

        const filtersHtml = Object.entries(this.modules).map(([key, module]) => `
            <label class="module-filter">
                <input type="checkbox" value="${key}" checked>
                <span class="filter-icon">${module.icon}</span>
                <span class="filter-name">${module.name}</span>
            </label>
        `).join('');

        container.innerHTML = filtersHtml;
    }

    /**
     * Attach search events
     */
    attachSearchEvents() {
        // Search input events
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                } else if (e.key === 'Escape') {
                    this.hideSearchModal();
                }
            });
            
            searchInput.addEventListener('focus', () => {
                this.showSuggestions();
            });
        }

        // Module filter events
        const moduleFilters = document.querySelectorAll('.module-filter input');
        moduleFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                const query = document.getElementById('global-search-input').value;
                if (query) {
                    this.performSearch(query);
                }
            });
        });

        // Global keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showSearchModal();
            }
        });
    }

    /**
     * Show search modal
     */
    showSearchModal() {
        const modal = document.getElementById('global-search-modal');
        const input = document.getElementById('global-search-input');
        
        if (modal && input) {
            modal.style.display = 'block';
            input.focus();
            this.showSuggestions();
        }
    }

    /**
     * Hide search modal
     */
    static hideSearchModal() {
        const modal = document.getElementById('global-search-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Clear search
     */
    static clearSearch() {
        const input = document.getElementById('global-search-input');
        const results = document.getElementById('search-results');
        const suggestions = document.getElementById('search-suggestions');
        
        if (input) input.value = '';
        if (results) results.innerHTML = '';
        if (suggestions) suggestions.innerHTML = '';
        
        window.GlobalSearch.showSuggestions();
    }

    /**
     * Rebuild search index
     */
    static rebuildIndex() {
        window.GlobalSearch.buildSearchIndex().then(() => {
            alert('Search index rebuilt successfully!');
        });
    }

    /**
     * Perform search with current options
     */
    async performSearch(query) {
        if (!query.trim()) {
            this.showSuggestions();
            return;
        }

        const options = this.getSearchOptions();
        const results = await this.search(query, options);
        
        this.displaySearchResults(results);
        this.updateSearchStats(results);
    }

    /**
     * Get current search options from UI
     */
    getSearchOptions() {
        const moduleFilters = document.querySelectorAll('.module-filter input:checked');
        const selectedModules = Array.from(moduleFilters).map(filter => filter.value);
        
        return {
            modules: selectedModules.length < Object.keys(this.modules).length ? selectedModules : null,
            page: 1,
            limit: 20
        };
    }

    /**
     * Display search results
     */
    displaySearchResults(searchResult) {
        const container = document.getElementById('search-results');
        const suggestions = document.getElementById('search-suggestions');
        
        if (!container) return;
        
        // Hide suggestions
        if (suggestions) suggestions.style.display = 'none';
        
        if (searchResult.results.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-text">No results found for "${searchResult.query}"</div>
                    <div class="no-results-suggestions">
                        Try different keywords or check your filters
                    </div>
                </div>
            `;
            return;
        }

        const resultsHtml = searchResult.results.map(result => this.renderSearchResult(result)).join('');
        
        container.innerHTML = `
            <div class="search-results-header">
                <h3>Search Results (${searchResult.total})</h3>
            </div>
            <div class="search-results-list">
                ${resultsHtml}
            </div>
        `;
    }

    /**
     * Render individual search result
     */
    renderSearchResult(result) {
        const highlightedTitle = this.highlightSearchTerms(result.title, result.matchedTerms);
        const highlightedSubtitle = this.highlightSearchTerms(result.subtitle, result.matchedTerms);
        
        return `
            <div class="search-result-item" onclick="GlobalSearch.openSearchResult('${result.url}')">
                <div class="result-module">
                    <span class="result-module-icon" style="color: ${result.moduleColor}">${result.moduleIcon}</span>
                    <span class="result-module-name">${result.moduleName}</span>
                </div>
                <div class="result-content">
                    <div class="result-title">${highlightedTitle}</div>
                    <div class="result-subtitle">${highlightedSubtitle}</div>
                </div>
                <div class="result-meta">
                    <div class="result-score">Score: ${Math.round(result.score)}</div>
                    <div class="result-date">${this.formatDate(result.lastModified)}</div>
                </div>
            </div>
        `;
    }

    /**
     * Highlight search terms in text
     */
    highlightSearchTerms(text, terms) {
        if (!terms || terms.length === 0) return text;
        
        let highlighted = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlighted = highlighted.replace(regex, '<mark>$1</mark>');
        });
        
        return highlighted;
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Open search result
     */
    static openSearchResult(url) {
        window.open(url, '_blank');
        GlobalSearch.hideSearchModal();
    }

    /**
     * Show search suggestions
     */
    showSuggestions() {
        const container = document.getElementById('search-suggestions');
        const input = document.getElementById('global-search-input');
        
        if (!container || !input) return;
        
        const query = input.value.trim();
        const suggestions = this.getSearchSuggestions(query);
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        const suggestionsHtml = suggestions.map(suggestion => `
            <div class="suggestion-item" onclick="GlobalSearch.applySuggestion('${suggestion.text}')">
                <div class="suggestion-text">${suggestion.text}</div>
                <div class="suggestion-meta">
                    ${suggestion.type === 'recent' ? '🕒 Recent' : 
                      suggestion.type === 'history' ? `📊 ${suggestion.resultCount} results` :
                      `📁 ${suggestion.module || 'Keyword'}`}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="suggestions-header">
                <h4>${query ? 'Suggestions' : 'Recent Searches'}</h4>
            </div>
            <div class="suggestions-list">
                ${suggestionsHtml}
            </div>
        `;
        
        container.style.display = 'block';
    }

    /**
     * Apply suggestion
     */
    static applySuggestion(suggestion) {
        const input = document.getElementById('global-search-input');
        if (input) {
            input.value = suggestion;
            window.GlobalSearch.performSearch(suggestion);
        }
    }

    /**
     * Update search statistics
     */
    updateSearchStats(searchResult) {
        const container = document.getElementById('search-stats');
        if (!container) return;
        
        const indexStats = `Index: ${this.searchIndex.size} items`;
        const resultStats = `Found: ${searchResult.total} results`;
        const lastUpdate = this.lastIndexUpdate ? 
            `Updated: ${this.formatDate(this.lastIndexUpdate)}` : '';
        
        container.innerHTML = `${indexStats} • ${resultStats} • ${lastUpdate}`;
    }

    /**
     * Add search styles
     */
    addSearchStyles() {
        if (document.querySelector('#global-search-styles')) return;

        const style = document.createElement('style');
        style.id = 'global-search-styles';
        style.textContent = `
            .global-search-btn {
                position: fixed;
                top: 200px;
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
            
            .global-search-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            }
            
            .global-search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 10003;
                display: none;
            }
            
            .search-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
            }
            
            .search-modal-content {
                position: absolute;
                top: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .search-header {
                display: flex;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
                gap: 15px;
            }
            
            .search-input-container {
                flex: 1;
                position: relative;
            }
            
            #global-search-input {
                width: 100%;
                padding: 15px 45px 15px 20px;
                border: 2px solid #667eea;
                border-radius: 12px;
                font-size: 16px;
                outline: none;
                transition: border-color 0.2s ease;
            }
            
            #global-search-input:focus {
                border-color: #5a6fd8;
            }
            
            .search-clear-btn {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                font-size: 20px;
                color: #999;
                cursor: pointer;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .search-clear-btn:hover {
                background: #f0f0f0;
            }
            
            .search-close-btn {
                background: none;
                border: none;
                font-size: 24px;
                color: #666;
                cursor: pointer;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .search-close-btn:hover {
                background: #f0f0f0;
            }
            
            .search-filters {
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .filter-group label {
                font-size: 13px;
                font-weight: 600;
                color: #666;
                margin-bottom: 8px;
                display: block;
            }
            
            .module-filters {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
            }
            
            .module-filter {
                display: flex !important;
                align-items: center;
                gap: 6px;
                padding: 6px 12px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 13px;
            }
            
            .module-filter:hover {
                background: #f0f0f0;
            }
            
            .module-filter input[type="checkbox"] {
                margin: 0;
            }
            
            .filter-icon {
                font-size: 14px;
            }
            
            .filter-name {
                font-size: 13px;
                color: #666;
            }
            
            .search-suggestions,
            .search-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .search-suggestions {
                display: none;
            }
            
            .suggestions-header h4,
            .search-results-header h3 {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 16px;
            }
            
            .suggestion-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .suggestion-item:hover {
                background: #f8f9fa;
            }
            
            .suggestion-text {
                font-size: 14px;
                color: #333;
            }
            
            .suggestion-meta {
                font-size: 12px;
                color: #666;
            }
            
            .search-result-item {
                display: flex;
                padding: 15px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid #f0f0f0;
                margin-bottom: 10px;
                gap: 15px;
            }
            
            .search-result-item:hover {
                background: #f8f9fa;
                border-color: #667eea;
                transform: translateY(-1px);
            }
            
            .result-module {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 60px;
                text-align: center;
            }
            
            .result-module-icon {
                font-size: 20px;
                margin-bottom: 4px;
            }
            
            .result-module-name {
                font-size: 11px;
                color: #666;
                font-weight: 500;
            }
            
            .result-content {
                flex: 1;
            }
            
            .result-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 6px;
                line-height: 1.4;
            }
            
            .result-title mark {
                background: #fff3cd;
                padding: 1px 3px;
                border-radius: 3px;
            }
            
            .result-subtitle {
                font-size: 14px;
                color: #666;
                line-height: 1.4;
            }
            
            .result-subtitle mark {
                background: #fff3cd;
                padding: 1px 3px;
                border-radius: 3px;
            }
            
            .result-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                min-width: 80px;
                font-size: 12px;
                color: #999;
            }
            
            .result-score {
                font-weight: 500;
                color: #667eea;
            }
            
            .result-date {
                margin-top: 4px;
            }
            
            .no-results {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }
            
            .no-results-icon {
                font-size: 48px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .no-results-text {
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 10px;
            }
            
            .no-results-suggestions {
                font-size: 14px;
                opacity: 0.8;
            }
            
            .search-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 20px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .search-stats {
                font-size: 12px;
                color: #666;
            }
            
            .rebuild-index-btn {
                padding: 8px 16px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s ease;
            }
            
            .rebuild-index-btn:hover {
                background: #5a6fd8;
            }
            
            @media (max-width: 768px) {
                .search-modal-content {
                    top: 5%;
                    width: 95%;
                    max-height: 90vh;
                }
                
                .module-filters {
                    justify-content: center;
                }
                
                .search-result-item {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .result-module {
                    flex-direction: row;
                    min-width: auto;
                    gap: 8px;
                }
                
                .result-meta {
                    flex-direction: row;
                    justify-content: space-between;
                    min-width: auto;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Create global instance when dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.StorageUtils) {
        window.GlobalSearch = new GlobalSearch();
    }
});