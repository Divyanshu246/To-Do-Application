// Application State
let currentUser = null;
let tasks = [];
let editingTaskId = null;
let filters = {
    status: 'all',
    priority: 'all',
    search: ''
};

// Initialize application
document.addEventListener('DOMContentLoaded', function () {
    loadFromStorage();
    setupNotifications();
    updateStats();
    renderTasks();
});

// Authentication Functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    // Simulate authentication
    currentUser = {
        id: 1,
        name: email.split('@')[0],
        email: email
    };

    showMainApp();
    showNotification('Welcome back!', 'success');
}

function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    currentUser = {
        id: Date.now(),
        name: name,
        email: email
    };

    showMainApp();
    showNotification('Account created successfully!', 'success');
}

function continueAsGuest() {
    currentUser = {
        id: 'guest',
        name: 'Guest User',
        email: 'guest@taskmaster.com'
    };

    showMainApp();
    showNotification('Welcome, Guest User!', 'success');
}

function logout() {
    currentUser = null;
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainApp').classList.remove('active');
    showNotification('Logged out successfully', 'success');
}

function showMainApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainApp').classList.add('active');

    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
}

// Task Management Functions
function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!title) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    const task = {
        id: Date.now(),
        title: title,
        description: description,
        priority: priority,
        dueDate: dueDate,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: currentUser.id
    };

    tasks.push(task);
    saveToStorage();
    clearTaskForm();
    renderTasks();
    updateStats();
    showNotification('Task added successfully!', 'success');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('editTitle').value = task.title;
    document.getElementById('editDescription').value = task.description;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editDueDate').value = task.dueDate;

    editingTaskId = taskId;
    document.getElementById('editModal').classList.add('active');
}

function saveEdit() {
    if (!editingTaskId) return;

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    task.title = document.getElementById('editTitle').value.trim();
    task.description = document.getElementById('editDescription').value.trim();
    task.priority = document.getElementById('editPriority').value;
    task.dueDate = document.getElementById('editDueDate').value;

    if (!task.title) {
        showNotification('Please enter a task title', 'error');
        return;
    }

    saveToStorage();
    renderTasks();
    updateStats();
    closeEditModal();
    showNotification('Task updated successfully!', 'success');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTaskId = null;
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToStorage();
        renderTasks();
        updateStats();
        showNotification('Task deleted successfully!', 'success');
    }
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveToStorage();
        renderTasks();
        updateStats();
        showNotification(task.completed ? 'Task completed!' : 'Task marked as pending', 'success');
    }
}

function clearTaskForm() {
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskDueDate').value = '';
}

// Filtering and Sorting Functions
function filterTasks() {
    filters.search = document.getElementById('searchBox').value.toLowerCase();
    renderTasks();
}

function setStatusFilter(status) {
    filters.status = status;
    updateFilterButtons('status', status);
    renderTasks();
}

function setPriorityFilter(priority) {
    filters.priority = priority;
    updateFilterButtons('priority', priority);
    renderTasks();
}

function updateFilterButtons(type, value) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (type === 'status') {
            if (btn.dataset.filter === value || (value === 'all' && btn.dataset.filter === 'all')) {
                btn.classList.add('active');
            } else if (btn.dataset.filter === 'all' || btn.dataset.filter === 'pending' || btn.dataset.filter === 'completed' || btn.dataset.filter === 'overdue') {
                btn.classList.remove('active');
            }
        } else if (type === 'priority') {
            if (btn.dataset.filter === value || (value === 'all' && btn.dataset.filter === 'all-priority')) {
                btn.classList.add('active');
            } else if (btn.dataset.filter === 'all-priority' || btn.dataset.filter === 'high' || btn.dataset.filter === 'medium' || btn.dataset.filter === 'low') {
                btn.classList.remove('active');
            }
        }
    });
}

function sortTasks() {
    const sortBy = document.getElementById('sortBy').value;
    renderTasks(sortBy);
}

function getFilteredTasks() {
    let filteredTasks = [...tasks];

    // Filter by user
    if (currentUser && currentUser.id !== 'guest') {
        filteredTasks = filteredTasks.filter(task => task.userId === currentUser.id);
    }

    // Filter by status
    if (filters.status !== 'all') {
        if (filters.status === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (filters.status === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (filters.status === 'overdue') {
            filteredTasks = filteredTasks.filter(task =>
                !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
            );
        }
    }

    // Filter by priority
    if (filters.priority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    // Filter by search
    if (filters.search) {
        filteredTasks = filteredTasks.filter(task =>
            task.title.toLowerCase().includes(filters.search) ||
            task.description.toLowerCase().includes(filters.search)
        );
    }

    return filteredTasks;
}

function renderTasks(sortBy = 'created') {
    const container = document.getElementById('tasksContainer');
    let filteredTasks = getFilteredTasks();

    // Sort tasks
    filteredTasks.sort((a, b) => {
        switch (sortBy) {
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'dueDate':
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    if (filteredTasks.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <h3>No tasks found!</h3>
                        <p>Try adjusting your filters or add a new task.</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => {
        const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
        const dueDateFormatted = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';

        return `
                    <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''} fade-in">
                        <div class="task-header">
                            <div>
                                <div class="task-title">${task.title}</div>
                                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                            </div>
                            <div class="task-actions">
                                <button class="action-btn btn-complete" onclick="toggleTaskComplete(${task.id})" title="${task.completed ? 'Mark as pending' : 'Mark as complete'}">
                                    ${task.completed ? '↻' : '✓'}
                                </button>
                                <button class="action-btn btn-edit" onclick="editTask(${task.id})" title="Edit task">
                                    ✏️
                                </button>
                                <button class="action-btn btn-delete" onclick="deleteTask(${task.id})" title="Delete task">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        <div class="task-meta">
                            <span class="priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                            ${dueDateFormatted ? `<span class="task-date">Due: ${dueDateFormatted}</span>` : ''}
                            ${isOverdue ? '<span class="task-date" style="background: var(--error-color); color: white;">OVERDUE</span>' : ''}
                        </div>
                    </div>
                `;
    }).join('');
}

// Statistics Functions
function updateStats() {
    const userTasks = currentUser && currentUser.id !== 'guest'
        ? tasks.filter(task => task.userId === currentUser.id)
        : tasks;

    const total = userTasks.length;
    const completed = userTasks.filter(task => task.completed).length;
    const pending = userTasks.filter(task => !task.completed).length;
    const overdue = userTasks.filter(task =>
        !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
    ).length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('overdueTasks').textContent = overdue;
}

// Theme Functions
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.querySelector('.theme-toggle');

    if (body.dataset.theme === 'dark') {
        body.dataset.theme = 'light';
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.dataset.theme = 'dark';
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.dataset.theme = savedTheme;
        document.querySelector('.theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Storage Functions
function saveToStorage() {
    localStorage.setItem('taskmaster_tasks', JSON.stringify(tasks));
    localStorage.setItem('taskmaster_user', JSON.stringify(currentUser));
}

function loadFromStorage() {
    const savedTasks = localStorage.getItem('taskmaster_tasks');
    const savedUser = localStorage.getItem('taskmaster_user');

    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }

    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }

    loadTheme();
}

// Notification Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function setupNotifications() {
    // Check for overdue tasks every minute
    setInterval(() => {
        if (!currentUser) return;

        const userTasks = currentUser.id !== 'guest'
            ? tasks.filter(task => task.userId === currentUser.id)
            : tasks;

        const overdueTasks = userTasks.filter(task =>
            !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
        );

        if (overdueTasks.length > 0) {
            showNotification(`You have ${overdueTasks.length} overdue task(s)!`, 'warning');
        }
    }, 60000); // Check every minute

    // Check for tasks due today
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task =>
        !task.completed && task.dueDate === today
    );

    if (todayTasks.length > 0) {
        showNotification(`You have ${todayTasks.length} task(s) due today!`, 'warning');
    }
}

// Keyboard Shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + Enter to add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.getElementById('taskTitle').value.trim()) {
            addTask();
        }
    }

    // Escape to close modal
    if (e.key === 'Escape') {
        closeEditModal();
    }
});

// Auto-save functionality
let autoSaveInterval;
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (tasks.length > 0) {
            saveToStorage();
        }
    }, 30000); // Auto-save every 30 seconds
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
}

// Initialize auto-save when user logs in
function initializeAutoSave() {
    startAutoSave();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function isTaskOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
}

// Export/Import Functions
function exportTasks() {
    const userTasks = currentUser && currentUser.id !== 'guest'
        ? tasks.filter(task => task.userId === currentUser.id)
        : tasks;

    const dataStr = JSON.stringify(userTasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'taskmaster_tasks.json';
    link.click();

    showNotification('Tasks exported successfully!', 'success');
}

function importTasks(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedTasks = JSON.parse(e.target.result);

            // Add imported tasks with new IDs
            importedTasks.forEach(task => {
                task.id = Date.now() + Math.random();
                task.userId = currentUser.id;
                tasks.push(task);
            });

            saveToStorage();
            renderTasks();
            updateStats();
            showNotification(`${importedTasks.length} tasks imported successfully!`, 'success');
        } catch (error) {
            showNotification('Error importing tasks. Please check the file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadFromStorage();
    updateStats();
    renderTasks();

    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];
});

// Add some sample tasks for demonstration
function addSampleTasks() {
    if (tasks.length === 0) {
        const sampleTasks = [
            {
                id: 1,
                title: "Complete project proposal",
                description: "Finish the Q4 project proposal document",
                priority: "high",
                dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
                completed: false,
                createdAt: new Date().toISOString(),
                userId: currentUser ? currentUser.id : 'guest'
            },
            {
                id: 2,
                title: "Team meeting preparation",
                description: "Prepare agenda and materials for weekly team meeting",
                priority: "medium",
                dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
                completed: false,
                createdAt: new Date().toISOString(),
                userId: currentUser ? currentUser.id : 'guest'
            },
            {
                id: 3,
                title: "Code review",
                description: "Review pull requests from team members",
                priority: "low",
                dueDate: "",
                completed: true,
                createdAt: new Date().toISOString(),
                userId: currentUser ? currentUser.id : 'guest'
            }
        ];

        tasks.push(...sampleTasks);
        saveToStorage();
        renderTasks();
        updateStats();
    }
}

// Add sample tasks when user logs in for the first time
function onFirstLogin() {
    setTimeout(() => {
        addSampleTasks();
        showNotification('Welcome! Here are some sample tasks to get you started.', 'success');
    }, 1000);
}
