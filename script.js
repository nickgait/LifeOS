document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const moduleContent = document.getElementById('module-content');
    
    // Show initial loading state
    showInitialLoading();
    
    // Load daily Quran verse with loading state
    loadQuranVerseWithLoading('daily-verse-container');
    
    const modules = {
        fitness: {
            title: 'Fitness Tracker',
            content: `
                <h2>Fitness Tracker</h2>
                <div class="fitness-module">
                    <p>Track your workouts, monitor progress, and maintain a healthy lifestyle.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Fitness/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Fitness App</button>
                    </div>
                </div>
            `
        },
        todo: {
            title: 'To-Do List',
            content: `
                <h2>To-Do List Manager</h2>
                <div class="todo-module">
                    <p>Organize your tasks, set priorities, and boost your productivity.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='ToDoList/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open To-Do App</button>
                    </div>
                </div>
            `
        },
        finance: {
            title: 'Finance Manager',
            content: `
                <h2>Finance Manager</h2>
                <div class="finance-module">
                    <p>Track expenses, manage budgets, and monitor your financial health.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Finance/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Finance App</button>
                    </div>
                </div>
            `
        },
        habits: {
            title: 'Habit Tracker',
            content: `
                <h2>Habit Tracker</h2>
                <div class="habits-module">
                    <p>Build positive habits, break bad ones, and track your daily progress.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Habits/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Habits App</button>
                    </div>
                </div>
            `
        },
        goals: {
            title: 'Goal Setting',
            content: `
                <h2>Goal Setting & Tracking</h2>
                <div class="goals-module">
                    <p>Set meaningful goals, create action plans, and track your progress toward success.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Goals/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Goals App</button>
                    </div>
                </div>
            `
        },
        journal: {
            title: 'Daily Journal',
            content: `
                <h2>Daily Journal</h2>
                <div class="journal-module">
                    <p>Reflect on your day, capture thoughts, and track your personal growth journey.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Journal/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Journal App</button>
                    </div>
                </div>
            `
        },
        poetry: {
            title: 'Poetry Collection',
            content: `
                <h2>Poetry Collection</h2>
                <div class="poetry-module">
                    <p>A private sanctuary for your dark and introspective verses. Write, organize, and preserve your creative expressions.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Poetry/index.html'" style="background: #2d1b4e; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Poetry App</button>
                    </div>
                </div>
            `
        }
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            
            // Show loading state
            showModuleLoading(this, module);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            if (modules[module]) {
                // Simulate loading delay for better UX
                setTimeout(() => {
                    moduleContent.innerHTML = modules[module].content;
                    hideModuleLoading();
                }, 300);
            }
        });
    });
    
    // Set initial welcome content after loading
    setTimeout(() => {
        showWelcomeWithDashboard();
        hideInitialLoading();
        
        // Initialize theme manager
        if (window.ThemeManager) {
            ThemeManager.addThemeButton();
        }
        
        // Add data management button
        if (window.DataManager) {
            addDataManagementButton();
        }
        
        // Initialize service worker
        if (window.ServiceWorkerManager) {
            ServiceWorkerManager.init();
        }
    }, 1000);
});

// Loading state functions
function showInitialLoading() {
    const navContainer = document.querySelector('.main-nav');
    const moduleContent = document.getElementById('module-content');
    
    // Show skeleton for navigation
    navContainer.innerHTML = `
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
        <div class="skeleton-nav-item">
            <div class="loading-skeleton skeleton-title"></div>
            <div class="loading-skeleton skeleton-text"></div>
        </div>
    `;
    
    // Show skeleton for content
    moduleContent.innerHTML = `
        <div class="skeleton-content">
            <div class="loading-skeleton skeleton-header"></div>
            <div class="loading-skeleton skeleton-paragraph"></div>
            <div class="loading-skeleton skeleton-paragraph"></div>
            <div class="loading-skeleton skeleton-paragraph"></div>
        </div>
    `;
}

function hideInitialLoading() {
    const navContainer = document.querySelector('.main-nav');
    
    // Restore navigation items
    navContainer.innerHTML = `
        <div class="nav-item" data-module="fitness">
            <h3>Fitness</h3>
            <p>Track workouts and health metrics</p>
        </div>
        <div class="nav-item" data-module="todo">
            <h3>To-Do List</h3>
            <p>Manage tasks and projects</p>
        </div>
        <div class="nav-item" data-module="finance">
            <h3>Finance</h3>
            <p>Budget and expense tracking</p>
        </div>
        <div class="nav-item" data-module="habits">
            <h3>Habits</h3>
            <p>Build and track daily habits</p>
        </div>
        <div class="nav-item" data-module="goals">
            <h3>Goals</h3>
            <p>Set and achieve life goals</p>
        </div>
        <div class="nav-item" data-module="journal">
            <h3>Journal</h3>
            <p>Daily reflection and notes</p>
        </div>
        <div class="nav-item" data-module="poetry">
            <h3>Poetry</h3>
            <p>Dark and introspective poetry collection</p>
        </div>
    `;
    
    // Re-attach event listeners
    attachNavListeners();
}

function showModuleLoading(clickedItem, module) {
    const moduleContent = document.getElementById('module-content');
    
    // Add loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-message">
            <div class="loading-spinner"></div>
            Loading ${clickedItem.querySelector('h3').textContent}...
        </div>
    `;
    
    moduleContent.style.position = 'relative';
    moduleContent.appendChild(overlay);
}

function hideModuleLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function loadQuranVerseWithLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Show loading skeleton
    container.innerHTML = `
        <div class="quran-verse-loading">
            <div class="loading-skeleton verse-skeleton"></div>
            <div class="loading-skeleton reference-skeleton"></div>
        </div>
    `;
    
    // Load actual verse
    loadQuranVerse(containerId);
}

function attachNavListeners() {
    const navItems = document.querySelectorAll('.nav-item');
    const moduleContent = document.getElementById('module-content');
    
    const modules = {
        fitness: {
            title: 'Fitness Tracker',
            content: `
                <h2>Fitness Tracker</h2>
                <div class="fitness-module">
                    <p>Track your workouts, monitor progress, and maintain a healthy lifestyle.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Fitness/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Fitness App</button>
                    </div>
                </div>
            `
        },
        todo: {
            title: 'To-Do List',
            content: `
                <h2>To-Do List Manager</h2>
                <div class="todo-module">
                    <p>Organize your tasks, set priorities, and boost your productivity.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='ToDoList/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open To-Do App</button>
                    </div>
                </div>
            `
        },
        finance: {
            title: 'Finance Manager',
            content: `
                <h2>Finance Manager</h2>
                <div class="finance-module">
                    <p>Track expenses, manage budgets, and monitor your financial health.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Finance/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Finance App</button>
                    </div>
                </div>
            `
        },
        habits: {
            title: 'Habit Tracker',
            content: `
                <h2>Habit Tracker</h2>
                <div class="habits-module">
                    <p>Build positive habits, break bad ones, and track your daily progress.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Habits/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Habits App</button>
                    </div>
                </div>
            `
        },
        goals: {
            title: 'Goal Setting',
            content: `
                <h2>Goal Setting & Tracking</h2>
                <div class="goals-module">
                    <p>Set meaningful goals, create action plans, and track your progress toward success.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Goals/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Goals App</button>
                    </div>
                </div>
            `
        },
        journal: {
            title: 'Daily Journal',
            content: `
                <h2>Daily Journal</h2>
                <div class="journal-module">
                    <p>Reflect on your day, capture thoughts, and track your personal growth journey.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Journal/index.html'" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Journal App</button>
                    </div>
                </div>
            `
        },
        poetry: {
            title: 'Poetry Collection',
            content: `
                <h2>Poetry Collection</h2>
                <div class="poetry-module">
                    <p>A private sanctuary for your dark and introspective verses. Write, organize, and preserve your creative expressions.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.location.href='Poetry/index.html'" style="background: #2d1b4e; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">Open Poetry App</button>
                    </div>
                </div>
            `
        }
    };
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const module = this.dataset.module;
            
            // Show loading state
            showModuleLoading(this, module);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            if (modules[module]) {
                // Simulate loading delay for better UX
                setTimeout(() => {
                    moduleContent.innerHTML = modules[module].content;
                    hideModuleLoading();
                }, 300);
            }
        });
    });
}

function showWelcomeWithDashboard() {
    const moduleContent = document.getElementById('module-content');
    
    moduleContent.innerHTML = `
        <div style="text-align: center; padding: 40px 40px 20px 40px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Welcome to LifeOS</h2>
            <p style="font-size: 1.1rem; margin-bottom: 30px;">Your comprehensive personal life management system</p>
            <p style="opacity: 0.7; margin-bottom: 30px;">Select a module above to get started, or view your progress below!</p>
        </div>
        <div id="dashboard-container"></div>
    `;
    
    // Initialize and render dashboard widgets
    if (window.DashboardWidgets) {
        DashboardWidgets.init();
        DashboardWidgets.renderWidgets('dashboard-container');
        DashboardWidgets.addWidgetClickHandlers();
    }
}

function addDataManagementButton() {
    const container = document.querySelector('.container');
    if (!container) return;

    const dataButton = document.createElement('button');
    dataButton.className = 'data-management-btn';
    dataButton.innerHTML = '📊';
    dataButton.title = 'Data Management';
    dataButton.onclick = () => DataManager.showDataManager();

    // Add button styles
    const style = document.createElement('style');
    style.textContent = `
        .data-management-btn {
            position: fixed;
            top: 80px;
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
        
        .data-management-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
    `;
    
    if (!document.querySelector('#data-button-styles')) {
        style.id = 'data-button-styles';
        document.head.appendChild(style);
    }

    container.appendChild(dataButton);
}