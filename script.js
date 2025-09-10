document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const moduleContent = document.getElementById('module-content');
    
    // Load daily Quran verse
    loadQuranVerse('daily-verse-container');
    
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
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            if (modules[module]) {
                moduleContent.innerHTML = modules[module].content;
            }
        });
    });
    
    moduleContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Welcome to LifeOS</h2>
            <p style="font-size: 1.1rem; margin-bottom: 30px;">Your comprehensive personal life management system</p>
            <p style="opacity: 0.7;">Select a module above to get started with organizing your life!</p>
        </div>
    `;
});