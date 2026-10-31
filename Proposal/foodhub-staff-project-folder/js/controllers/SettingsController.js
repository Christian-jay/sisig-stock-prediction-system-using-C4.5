/**
 * Settings Controller - UI rendering, event handling, validation, loading states.
 */
import { SettingsService } from '../services/SettingsService.js';
import { ThemeManager } from '../utils/ThemeManager.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class SettingsController {
    constructor() {
        this.settingsService = new SettingsService();
        // Initialize ThemeManager with SettingsService for backend sync capability
        this.themeManager = new ThemeManager({ settingsService: this.settingsService });
        this.currentSettings = null;
        this.activeTab = 'general';

        // Track event binding state to prevent duplicates
        this._tabEventListenersBound = false;
        this._menuEventListenersBound = false;
        this._backupInProgress = false;
        this._saveInProgress = false;

        // Track saved theme reference for Cancel functionality
        this._savedThemeRef = 'light';

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
     * Uses ThemeManager for consistent no-flash initialization.
     */
    async initTheme() {
        await this.themeManager.init();
        // Store initial theme as saved reference for Cancel
        this._savedThemeRef = this.themeManager.get();
    }

    /**
     * Apply theme via ThemeManager (single source of truth).
     * @param {string} mode - 'light' or 'dark'
     */
    applyTheme(mode) {
        this.themeManager.apply(mode);
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
            // Apply theme via ThemeManager (single source of truth)
            this.applyTheme(this.currentSettings.themeMode);
            // Update saved theme reference after successful load from backend
            this._savedThemeRef = this.currentSettings.themeMode || 'light';
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
        const currentTheme = s.themeMode || 'light';

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
                    <label>Theme Appearance</label>
                    <p class="form-hint">Choose your preferred interface theme. Changes apply immediately for preview.</p>

                    <div class="theme-preview-grid" id="themePreviewGrid" data-current-theme="${currentTheme}">
                        <!-- Light Classic Card -->
                        <article class="theme-preview-card ${currentTheme === 'light' ? 'selected' : ''}"
                            data-theme="light" role="button" tabindex="0" aria-pressed="${currentTheme === 'light'}">
                            <div class="theme-preview-visual">
                                <div class="theme-mini-pos theme-mini-pos--light">
                                    <!-- Sidebar -->
                                    <aside class="mini-sidebar">
                                        <nav class="mini-nav">
                                            <a class="mini-nav-item active" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                        </nav>
                                    </aside>
                                    <!-- Main Content -->
                                    <main class="mini-main">
                                        <!-- Topbar -->
                                        <header class="mini-topbar">
                                            <div class="mini-search"></div>
                                            <div class="mini-user"></div>
                                        </header>
                                        <!-- POS Layout: 2-column cards -->
                                        <div class="mini-pos-grid">
                                            <!-- Left: Current Order Card -->
                                            <section class="mini-card mini-order-card">
                                                <header class="mini-card-header">
                                                    <span class="mini-card-title">Current Order</span>
                                                </header>
                                                <div class="mini-cart-area">
                                                    <div class="mini-cart-item"></div>
                                                    <div class="mini-cart-item"></div>
                                                    <div class="mini-cart-item"></div>
                                                </div>
                                                <footer class="mini-cart-footer">
                                                    <div class="mini-cart-summary">
                                                        <span class="mini-summary-label">Total</span>
                                                        <span class="mini-summary-value">₱0.00</span>
                                                    </div>
                                                   
                                                </footer>
                                            </section>
                                            <!-- Right: Menu Catalog Card -->
                                            <section class="mini-card mini-menu-card">
                                                <header class="mini-card-header">
                                                    <span class="mini-card-title">Menu</span>
                                                    <div class="mini-catalog-actions"></div>
                                                </header>
                                                <div class="mini-category-tabs">
                                                    <span class="mini-tab active"></span>
                                                    <span class="mini-tab"></span>
                                                    <span class="mini-tab"></span>
                                                </div>
                                                <div class="mini-menu-grid">
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                </div>
                                            </section>
                                        </div>
                                    </main>
                                </div>
                            </div>
                            <div class="theme-preview-info">
                                <h4 class="theme-preview-name">Light Classic</h4>
                                <p class="theme-preview-desc">Light gray workspace, dark navy sidebar, FOODHUB blue accents</p>
                            </div>
                            <div class="theme-preview-check" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </article>

                        <!-- Dark Midnight Card -->
                        <article class="theme-preview-card ${currentTheme === 'dark' ? 'selected' : ''}"
                            data-theme="dark" role="button" tabindex="0" aria-pressed="${currentTheme === 'dark'}">
                            <div class="theme-preview-visual">
                                <div class="theme-mini-pos theme-mini-pos--dark">
                                    <!-- Sidebar -->
                                    <aside class="mini-sidebar">
                                        <nav class="mini-nav">
                                            <a class="mini-nav-item active" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                            <a class="mini-nav-item" href="#"></a>
                                        </nav>
                                    </aside>
                                    <!-- Main Content -->
                                    <main class="mini-main">
                                        <!-- Topbar -->
                                        <header class="mini-topbar">
                                            <div class="mini-search"></div>
                                            <div class="mini-user"></div>
                                        </header>
                                        <!-- POS Layout: 2-column cards -->
                                        <div class="mini-pos-grid">
                                            <!-- Left: Current Order Card -->
                                            <section class="mini-card mini-order-card">
                                                <header class="mini-card-header">
                                                    <span class="mini-card-title">Current Order</span>
                                                </header>
                                                <div class="mini-cart-area">
                                                    <div class="mini-cart-item"></div>
                                                    <div class="mini-cart-item"></div>
                                                    <div class="mini-cart-item"></div>
                                                </div>
                                                <footer class="mini-cart-footer">
                                                    <div class="mini-cart-summary">
                                                        <span class="mini-summary-label">Total</span>
                                                        <span class="mini-summary-value">₱0.00</span>
                                                    </div>
                                                  
                                                </footer>
                                            </section>
                                            <!-- Right: Menu Catalog Card -->
                                            <section class="mini-card mini-menu-card">
                                                <header class="mini-card-header">
                                                    <span class="mini-card-title">Menu</span>
                                                    <div class="mini-catalog-actions"></div>
                                                </header>
                                                <div class="mini-category-tabs">
                                                    <span class="mini-tab active"></span>
                                                    <span class="mini-tab"></span>
                                                    <span class="mini-tab"></span>
                                                </div>
                                                <div class="mini-menu-grid">
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                    <div class="mini-menu-item"></div>
                                                </div>
                                            </section>
                                        </div>
                                    </main>
                                </div>
                            </div>
                            <div class="theme-preview-info">
                                <h4 class="theme-preview-name">Dark Midnight</h4>
                                <p class="theme-preview-desc">Warm charcoal workspace, sisig-inspired palette, golden amber accents</p>
                            </div>
                            <div class="theme-preview-check" aria-hidden="true">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </article>
                    </div>

                    <!-- Hidden input for form submission (Phase 5) -->
                    <input type="hidden" id="themeModeInput" name="theme_mode" value="${currentTheme}">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-primary" id="saveGeneralBtn">Save Changes</button>
                    <button type="button" class="btn-secondary" id="cancelGeneralBtn" style="display: none;">Cancel</button>
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

        // General tab: Theme preview cards + Cancel button
        if (tabName === 'general') {
            // Theme preview cards
            const themeCards = document.querySelectorAll('.theme-preview-card');
            themeCards.forEach(card => {
                if (!card.dataset.bound) {
                    card.dataset.bound = 'true';
                    card.addEventListener('click', (e) => this._handleThemeCardClick(card));
                    card.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this._handleThemeCardClick(card);
                        }
                    });
                }
            });

            // Cancel button
            const cancelBtn = document.getElementById('cancelGeneralBtn');
            if (cancelBtn && !cancelBtn.dataset.bound) {
                cancelBtn.dataset.bound = 'true';
                cancelBtn.addEventListener('click', () => this._handleCancelGeneral());
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
        }
    }

    /**
     * Handle theme preview card click.
     * Updates visual selection, applies live preview via ThemeManager, shows Cancel button.
     * Does NOT persist to backend on selection.
     */
    _handleThemeCardClick(card) {
        const theme = card.getAttribute('data-theme');
        if (!theme || (theme !== 'light' && theme !== 'dark')) return;

        // Update visual selection
        document.querySelectorAll('.theme-preview-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');

        // Update hidden input
        const hiddenInput = document.getElementById('themeModeInput');
        if (hiddenInput) hiddenInput.value = theme;

        // Live preview via ThemeManager (applies to DOM, updates localStorage)
        this.themeManager.apply(theme);

        // Update current settings optimistically
        if (this.currentSettings) {
            this.currentSettings.themeMode = theme;
        }

        // Show cancel button
        const cancelBtn = document.getElementById('cancelGeneralBtn');
        if (cancelBtn) cancelBtn.style.display = 'inline-flex';

        // Update grid's current theme attribute
        const grid = document.getElementById('themePreviewGrid');
        if (grid) grid.setAttribute('data-current-theme', theme);
    }

    /**
     * Handle Cancel in General tab.
     * Reverts to last successfully saved theme (from backend).
     * Does NOT send API request.
     */
    _handleCancelGeneral() {
        // Use the saved theme reference captured after successful load/save
        const savedTheme = this._savedThemeRef || 'light';

        // Update visual selection
        document.querySelectorAll('.theme-preview-card').forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
        });
        const activeCard = document.querySelector(`.theme-preview-card[data-theme="${savedTheme}"]`);
        if (activeCard) {
            activeCard.classList.add('selected');
            activeCard.setAttribute('aria-pressed', 'true');
        }

        // Update hidden input
        const hiddenInput = document.getElementById('themeModeInput');
        if (hiddenInput) hiddenInput.value = savedTheme;

        // Revert live preview via ThemeManager
        this.themeManager.apply(savedTheme);

        if (this.currentSettings) {
            this.currentSettings.themeMode = savedTheme;
        }

        // Hide cancel button
        const cancelBtn = document.getElementById('cancelGeneralBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';

        // Update grid
        const grid = document.getElementById('themePreviewGrid');
        if (grid) grid.setAttribute('data-current-theme', savedTheme);

        this.showToast('Theme selection cancelled', 'info');
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
            // Read theme from hidden input (set by theme preview cards)
            const themeInput = document.getElementById('themeModeInput');
            if (themeInput) {
                updates.themeMode = themeInput.value;
            }
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

            // Update saved theme reference for Cancel functionality (general tab)
            if (tabName === 'general' && updatedSettings.themeMode) {
                this._savedThemeRef = updatedSettings.themeMode;
                // Persist theme to localStorage via ThemeManager for immediate page-load consistency
                this.themeManager.save(updatedSettings.themeMode);
            }

            // Hide cancel button after successful save (general tab)
            if (tabName === 'general') {
                const cancelBtn = document.getElementById('cancelGeneralBtn');
                if (cancelBtn) cancelBtn.style.display = 'none';
            }

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