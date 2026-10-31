/**
 * Settings Controller - UI rendering, event handling, validation, loading states.
 */
import { SettingsService } from '../services/SettingsService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class SettingsController {
    constructor() {
        this.settingsService = new SettingsService();
        this.currentSettings = null;
        this.activeTab = 'general';

        // Track event binding state to prevent duplicates
        this._tabEventListenersBound = false;
        this._menuEventListenersBound = false;
        this._backupInProgress = false;
        this._saveInProgress = false;

        // DOM element references
        this._elements = {
            loadingState: null,
            errorState: null,
            errorMessage: null,
            retryBtn: null,
            contentGrid: null,
            tabContent: null,
            menuItems: null,
            form: null,
        };

        this.initLayout();
        this.initTheme();
        this.initMenu();
        this.loadSettings();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();

        // Cache DOM elements
        this._elements.loadingState = document.getElementById('settingsLoadingState');
        this._elements.errorState = document.getElementById('settingsErrorState');
        this._elements.errorMessage = document.getElementById('settingsErrorMessage');
        this._elements.retryBtn = document.getElementById('settingsRetryBtn');
        this._elements.contentGrid = document.getElementById('settingsContentGrid');
        this._elements.tabContent = document.getElementById('staffTabContent');
        this._elements.form = document.getElementById('staffSettingsForm');
    }

    /**
     * Initialize theme from localStorage immediately (before API load)
     * to prevent flash of wrong theme.
     */
    initTheme() {
        const localTheme = this.settingsService.getLocalThemeMode();
        this.applyTheme(localTheme);
    }

    applyTheme(mode) {
        if (mode === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }

    /**
     * Initialize sidebar menu event listeners (only once).
     */
    initMenu() {
        if (this._menuEventListenersBound) return;

        this._elements.menuItems = document.querySelectorAll('.settings-menu-item');

        this._elements.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.getAttribute('data-tab'));
            });
        });

        this._menuEventListenersBound = true;
    }

    /**
     * Switch between settings tabs.
     */
    switchTab(tabName) {
        if (!this._elements.menuItems) return;

        // Update active menu item
        this._elements.menuItems.forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.settings-menu-item[data-tab="${tabName}"]`);
        if (activeItem) activeItem.classList.add('active');

        this.activeTab = tabName;
        this.renderTabContent(tabName);
    }

    /**
     * Show loading state.
     */
    _showLoading() {
        this._elements.loadingState.style.display = 'flex';
        this._elements.errorState.style.display = 'none';
        this._elements.contentGrid.style.display = 'none';
    }

    /**
     * Hide loading state.
     */
    _hideLoading() {
        this._elements.loadingState.style.display = 'none';
    }

    /**
     * Show error state.
     */
    _showError(message) {
        this._elements.loadingState.style.display = 'none';
        this._elements.contentGrid.style.display = 'none';
        this._elements.errorState.style.display = 'flex';
        this._elements.errorMessage.textContent = message;
    }

    /**
     * Show content grid.
     */
    _showContent() {
        this._elements.loadingState.style.display = 'none';
        this._elements.errorState.style.display = 'none';
        this._elements.contentGrid.style.display = 'grid';
    }

    /**
     * Load settings from service.
     */
    async loadSettings() {
        this._showLoading();

        try {
            this.currentSettings = await this.settingsService.getSettings();
            this.applyTheme(this.currentSettings.themeMode);
            this._showContent();
            this.renderTabContent(this.activeTab);
        } catch (error) {
            console.error('[SettingsController] Failed to load settings:', error);
            this._showError(error.message || 'Failed to load settings. Please try again.');
        }
    }

    /**
     * Retry loading settings.
     */
    _retryLoad() {
        this.loadSettings();
    }

    /**
     * Render tab content based on active tab.
     */
    renderTabContent(tabName) {
        const container = this._elements.tabContent;
        if (!container || !this.currentSettings) return;

        const s = this.currentSettings;

        switch (tabName) {
            case 'general':
                container.innerHTML = this._renderGeneralTab(s);
                break;
            case 'notification':
                container.innerHTML = this._renderNotificationTab(s);
                break;
            case 'backup':
                container.innerHTML = this._renderBackupTab(s);
                break;
            default:
                container.innerHTML = this._renderGeneralTab(s);
        }

        // Bind events for this tab (only once per tab)
        this._bindTabEvents(tabName);
    }

    /**
     * Render General Settings tab.
     */
    _renderGeneralTab(s) {
        const isDarkMode = s.themeMode === 'dark';

        return `
            <div class="tab-pane">
                <h3>General Settings</h3>
                <p class="tab-desc">Control basic system preferences, themes, and language options.</p>

                <div class="form-group">
                    <label>System Name</label>
                    <input type="text" id="sysName" class="form-control" value="${this._escapeHtml(s.systemName)}" readonly>
                    <small class="form-hint">System name cannot be changed.</small>
                </div>

                <div class="form-group">
                    <label for="sysLanguage">System Language</label>
                    <select id="sysLanguage" class="form-control">
                        <option value="English" ${s.language === 'English' ? 'selected' : ''}>English</option>
                        <option value="Tagalog" ${s.language === 'Tagalog' ? 'selected' : ''}>Tagalog</option>
                    </select>
                </div>

                <div class="form-group">
                    <div class="toggle-row">
                        <div class="toggle-info">
                            <strong>Dark Appearance Mode</strong>
                            <p class="text-muted font-12">Switch between clean light interface and dark theme.</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggleThemeMode" ${isDarkMode ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-primary" id="saveGeneralBtn">Save Changes</button>
                </div>
            </div>
        `;
    }

    /**
     * Render Notification Settings tab.
     */
    _renderNotificationTab(s) {
        return `
            <div class="tab-pane">
                <h3>Notification Preferences</h3>
                <p class="tab-desc">Configure alerts and audio chimes for new incoming orders and updates.</p>

                <div class="form-group">
                    <div class="toggle-row">
                        <div class="toggle-info">
                            <strong>Email Alerts for New Orders</strong>
                            <p class="text-muted font-12">Receive instant email notifications whenever a new order is placed.</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifEmailOrders" ${s.emailAlertsForNewOrders ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <div class="toggle-row">
                        <div class="toggle-info">
                            <strong>In-App Sound Alerts</strong>
                            <p class="text-muted font-12">Play notification audio chimes directly on the dashboard terminal.</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifSoundAlerts" ${s.inAppSoundAlerts ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <div class="toggle-row">
                        <div class="toggle-info">
                            <strong>SMS Notifications</strong>
                            <p class="text-muted font-12">Send text alerts to designated mobile numbers for critical status logs.</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="notifSms" ${s.smsNotifications ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-primary" id="saveNotificationBtn">Save Changes</button>
                </div>
            </div>
        `;
    }

    /**
     * Render Backup & Logout tab.
     */
    _renderBackupTab(s) {
        return `
            <div class="tab-pane">
                <h3>System Backup & Data</h3>
                <p class="tab-desc">Manage database backups and system restoration points.</p>

                <div class="form-group">
                    <div class="toggle-row">
                        <div class="toggle-info">
                            <strong>Enable Automatic Daily Backups</strong>
                            <p class="text-muted font-12">Automatically back up transaction records and inventory logs daily.</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="bakAutoDaily" ${s.enableAutomaticDailyBackups ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Last Successful Backup</label>
                    <input type="text" class="form-control" id="lastBackupDisplay" value="${this._escapeHtml(s.lastBackupFormatted)}" readonly>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-primary" id="saveBackupBtn">Save Changes</button>
                    <button type="button" class="btn-secondary" id="backupNowBtn">Backup Now</button>
                </div>

                <div class="section-divider"></div>

                <div class="danger-zone">
                    <h4 style="color: #dc2626; margin-bottom: 6px; font-size: 15px;">Terminal Session Control</h4>
                    <p class="text-muted font-12" style="margin-bottom: 12px;">Sign out of the current staff administration profile securely.</p>
                    <button type="button" class="btn-danger" id="logoutBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Log Out System Session
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Bind events for the current tab (prevents duplicate listeners).
     */
    _bindTabEvents(tabName) {
        // Save buttons
        const saveBtnIds = {
            general: 'saveGeneralBtn',
            notification: 'saveNotificationBtn',
            backup: 'saveBackupBtn'
        };

        const saveBtnId = saveBtnIds[tabName];
        if (saveBtnId) {
            const saveBtn = document.getElementById(saveBtnId);
            if (saveBtn && !saveBtn.dataset.bound) {
                saveBtn.dataset.bound = 'true';
                saveBtn.addEventListener('click', () => this._handleSave(tabName));
            }
        }

        // Backup Now button
        if (tabName === 'backup') {
            const backupBtn = document.getElementById('backupNowBtn');
            if (backupBtn && !backupBtn.dataset.bound) {
                backupBtn.dataset.bound = 'true';
                backupBtn.addEventListener('click', () => this._handleBackup());
            }

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn && !logoutBtn.dataset.bound) {
                logoutBtn.dataset.bound = 'true';
                logoutBtn.addEventListener('click', () => this._handleLogout());
            }

            // Theme toggle (in general tab but need to handle here too)
            const themeToggle = document.getElementById('toggleThemeMode');
            if (themeToggle && !themeToggle.dataset.bound) {
                themeToggle.dataset.bound = 'true';
                themeToggle.addEventListener('change', (e) => this._handleThemeChange(e.target.checked));
            }
        }
    }

    /**
     * Handle theme change immediately (before save).
     */
    _handleThemeChange(isDark) {
        const themeMode = isDark ? 'dark' : 'light';
        this.applyTheme(themeMode);
        this.settingsService.saveLocalThemeMode(themeMode);

        // Update current settings optimistically
        if (this.currentSettings) {
            this.currentSettings.themeMode = themeMode;
        }
    }

    /**
     * Handle save for each tab.
     */
    async _handleSave(tabName) {
        if (this._saveInProgress) return;

        const s = this.currentSettings;
        if (!s) return;

        // Collect form data based on tab
        const updates = {};

        if (tabName === 'general') {
            updates.language = document.getElementById('sysLanguage').value;
            // themeMode already updated via _handleThemeChange
        } else if (tabName === 'notification') {
            updates.emailAlertsForNewOrders = document.getElementById('notifEmailOrders').checked;
            updates.inAppSoundAlerts = document.getElementById('notifSoundAlerts').checked;
            updates.smsNotifications = document.getElementById('notifSms').checked;
        } else if (tabName === 'backup') {
            updates.enableAutomaticDailyBackups = document.getElementById('bakAutoDaily').checked;
        }

        // Validate
        const tempModel = s.cloneWith(updates);
        const validation = tempModel.validate();
        if (!validation.isValid) {
            this.showToast(validation.errors.join(' '), 'error');
            return;
        }

        this._saveInProgress = true;
        const saveBtn = document.getElementById(`save${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`);
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        try {
            const updatedSettings = await this.settingsService.updateSettings(tempModel);
            this.currentSettings = updatedSettings;
            this.showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('[SettingsController] Save failed:', error);
            this.showToast(`Failed to save settings: ${error.message}`, 'error');
        } finally {
            this._saveInProgress = false;
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        }
    }

    /**
     * Handle backup now action.
     */
    async _handleBackup() {
        if (this._backupInProgress) return;

        this._backupInProgress = true;
        const backupBtn = document.getElementById('backupNowBtn');
        const saveBtn = document.getElementById('saveBackupBtn');

        if (backupBtn) {
            backupBtn.disabled = true;
            backupBtn.textContent = 'Backing up...';
        }
        if (saveBtn) saveBtn.disabled = true;

        try {
            const updatedSettings = await this.settingsService.createBackup();
            this.currentSettings = updatedSettings;

            // Update last backup display
            const lastBackupDisplay = document.getElementById('lastBackupDisplay');
            if (lastBackupDisplay) {
                lastBackupDisplay.value = updatedSettings.lastBackupFormatted;
            }

            this.showToast('Backup completed successfully!', 'success');
        } catch (error) {
            console.error('[SettingsController] Backup failed:', error);
            this.showToast(`Backup failed: ${error.message}`, 'error');
        } finally {
            this._backupInProgress = false;
            if (backupBtn) {
                backupBtn.disabled = false;
                backupBtn.textContent = 'Backup Now';
            }
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    /**
     * Handle logout.
     */
    _handleLogout() {
        if (confirm('Are you sure you want to log out from FOODHUB?')) {
            // Clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // Note: foodhub_theme is preserved for theme preference
            window.location.href = '../foodhub-admin-root-project-folder/login.html';
        }
    }

    /**
     * Show toast notification (consistent with Expenses page).
     */
    showToast(message, type = 'info') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${this._escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto dismiss
        const dismissTimer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);

        // Manual dismiss
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(dismissTimer);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    /**
     * Escape HTML to prevent XSS.
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsController();
});