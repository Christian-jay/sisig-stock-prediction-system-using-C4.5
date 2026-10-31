import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { SettingsService } from '../services/SettingsService.js';
import { ThemeManager } from '../utils/ThemeManager.js';
import {
    GeneralSettings,
    BusinessInfoSettings,
    NotificationSettings,
    PaymentSettings,
    BackupSettings
} from '../models/SettingsModel.js';

class SettingsController {
    constructor() {
        this.settingsService = new SettingsService();
        // Initialize ThemeManager with SettingsService for backend sync capability
        this.themeManager = new ThemeManager({ settingsService: this.settingsService });
        this.currentTab = 'general';
        this.settingsData = {};

        // Track saved theme reference for Cancel functionality
        this._savedThemeRef = 'light';

        this.initSettings();
    }

    async initSettings() {
        try {
            this.settingsData = await this.settingsService.getAllSettings();
            await this.themeManager.init();
            this._savedThemeRef = this.themeManager.get();
            this.renderTabContent(this.currentTab);
            this.initEventListeners();
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    applyTheme(mode) {
        this.themeManager.apply(mode);
    }

    renderTabContent(tabKey) {
        this.currentTab = tabKey;
        const container = document.getElementById('settingsTabContent');

        switch (tabKey) {
            case 'general':
                const currentTheme = this.settingsData.general.themeMode || 'light';
                container.innerHTML = `
                    <div class="card-header">
                        <h2>General Settings</h2>
                        <p>Configure your basic application, appearance, and store preferences.</p>
                    </div>
                    <div class="form-group-container">
                        <div class="form-group">
                            <label for="storeName">Store Name</label>
                            <input type="text" id="storeName" class="form-control" value="${this.settingsData.general.storeName}">
                        </div>
                        <div class="form-group">
                            <label for="language">Language</label>
                            <select id="language" class="form-control">
                                <option value="English" ${this.settingsData.general.language === 'English' ? 'selected' : ''}>English</option>
                                <option value="Tagalog" ${this.settingsData.general.language === 'Tagalog' ? 'selected' : ''}>Tagalog</option>
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
                                                <!-- Admin Layout: 2-column cards -->
                                                <div class="mini-pos-grid">
                                                    <!-- Left: Dashboard Card -->
                                                    <section class="mini-card mini-order-card">
                                                        <header class="mini-card-header">
                                                            <span class="mini-card-title">Dashboard</span>
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
                                                    <!-- Right: Inventory Card -->
                                                    <section class="mini-card mini-menu-card">
                                                        <header class="mini-card-header">
                                                            <span class="mini-card-title">Inventory</span>
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
                                                <!-- Admin Layout: 2-column cards -->
                                                <div class="mini-pos-grid">
                                                    <!-- Left: Dashboard Card -->
                                                    <section class="mini-card mini-order-card">
                                                        <header class="mini-card-header">
                                                            <span class="mini-card-title">Dashboard</span>
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
                                                    <!-- Right: Inventory Card -->
                                                    <section class="mini-card mini-menu-card">
                                                        <header class="mini-card-header">
                                                            <span class="mini-card-title">Inventory</span>
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

                            <!-- Hidden input for form submission -->
                            <input type="hidden" id="themeModeInput" name="theme_mode" value="${currentTheme}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary" id="saveGeneralBtn">Save Changes</button>
                            <button type="button" class="btn-secondary" id="cancelGeneralBtn" style="display: none;">Cancel</button>
                        </div>
                    </div>
                `;
                break;

            case 'business':
                container.innerHTML = `
                    <div class="card-header">
                        <h2>Business Information</h2>
                        <p>Provide legal and operational details about your establishment.</p>
                    </div>
                    <div class="form-group-container">
                        <div class="form-group">
                            <label for="ownerName">Owner / Manager Name</label>
                            <input type="text" id="ownerName" class="form-control" value="${this.settingsData.business.ownerName}">
                        </div>
                        <div class="form-group">
                            <label for="address">Business Address</label>
                            <input type="text" id="address" class="form-control" value="${this.settingsData.business.address}">
                        </div>
                        <div class="form-group">
                            <label for="tinNumber">TIN Number</label>
                            <input type="text" id="tinNumber" class="form-control" value="${this.settingsData.business.tinNumber}">
                        </div>
                        <div class="form-group">
                            <label for="operatingHours">Operating Hours</label>
                            <input type="text" id="operatingHours" class="form-control" value="${this.settingsData.business.operatingHours}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                        </div>
                    </div>
                `;
                break;

            case 'notification':
                container.innerHTML = `
                    <div class="card-header">
                        <h2>Notification Preferences</h2>
                        <p>Choose how you want to receive alerts and notifications.</p>
                    </div>
                    <div class="form-group-container">
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>Email Alerts for New Orders</span>
                                <label class="switch">
                                    <input type="checkbox" id="emailAlerts" ${this.settingsData.notification.emailAlerts ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>In-App Sound Alerts</span>
                                <label class="switch">
                                    <input type="checkbox" id="orderSoundAlerts" ${this.settingsData.notification.orderSoundAlerts ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>SMS Notifications</span>
                                <label class="switch">
                                    <input type="checkbox" id="smsNotifications" ${this.settingsData.notification.smsNotifications ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                        </div>
                    </div>
                `;
                break;

            case 'payment':
                container.innerHTML = `
                    <div class="card-header">
                        <h2>Personal Payment Settings</h2>
                        <p>Configure cash payment options and instructions for in-person transactions.</p>
                    </div>
                    <div class="form-group-container">
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>Pay at Store / Over-the-Counter</span>
                                <label class="switch">
                                    <input type="checkbox" id="payAtStore" ${this.settingsData.payment.payAtStore ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="paymentNote">Personal Payment Note for Customers</label>
                            <textarea id="paymentNote" class="form-control" rows="3" placeholder="e.g. Please prepare exact cash amount upon pickup or delivery.">${this.settingsData.payment.paymentNote || ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                        </div>
                    </div>
                `;
                break;

            case 'backup':
                container.innerHTML = `
                    <div class="card-header">
                        <h2>System Backup & Data</h2>
                        <p>Manage database backups and system restoration points.</p>
                    </div>
                    <div class="form-group-container">
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>Enable Automatic Daily Backups</span>
                                <label class="switch">
                                    <input type="checkbox" id="autoBackup" ${this.settingsData.backup.autoBackup ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Last Successful Backup</label>
                            <input type="text" class="form-control" value="${this.settingsData.backup.lastBackupDate}" disabled>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save Changes</button>
                            <button type="button" id="backupNowBtn" class="btn-secondary">Backup Now</button>
                        </div>

                        <div class="section-divider"></div>

                        <div class="danger-zone">
                            <h4>Terminal Session Control</h4>
                            <p>Sign out of the current admin session securely.</p>
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

                document.getElementById('backupNowBtn')?.addEventListener('click', () => {
                    this.showToast('Manual backup started successfully!', 'info');
                });

                document.getElementById('logoutBtn')?.addEventListener('click', () => {
                    if (confirm('Are you sure you want to log out from FOODHUB?')) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        // Note: foodhub_theme is preserved for theme preference
                        window.location.href = 'login.html';
                    }
                });
                break;
        }

        // Bind events for this tab
        this._bindTabEvents(tabKey);
    }

    initEventListeners() {
        const menuItems = document.querySelectorAll('.settings-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const tabKey = item.getAttribute('data-tab');
                this.renderTabContent(tabKey);
            });
        });

        const form = document.getElementById('settingsForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let updatedData;
            if (this.currentTab === 'general') {
                // Read theme from hidden input (set by theme preview cards)
                const themeInput = document.getElementById('themeModeInput');
                const newTheme = themeInput ? themeInput.value : 'light';

                updatedData = new GeneralSettings(
                    document.getElementById('storeName').value,
                    document.getElementById('language').value,
                    newTheme
                );
                this.settingsData.general = updatedData;
                this.applyTheme(newTheme);
            } else if (this.currentTab === 'business') {
                updatedData = new BusinessInfoSettings(
                    document.getElementById('ownerName').value,
                    document.getElementById('address').value,
                    document.getElementById('tinNumber').value,
                    document.getElementById('operatingHours').value
                );
                this.settingsData.business = updatedData;
            } else if (this.currentTab === 'notification') {
                updatedData = new NotificationSettings(
                    document.getElementById('emailAlerts').checked,
                    document.getElementById('orderSoundAlerts').checked,
                    document.getElementById('smsNotifications').checked
                );
                this.settingsData.notification = updatedData;
            } else if (this.currentTab === 'payment') {
                updatedData = new PaymentSettings(
                    document.getElementById('payAtStore').checked,
                    document.getElementById('paymentNote').value
                );
                this.settingsData.payment = updatedData;
            } else if (this.currentTab === 'backup') {
                updatedData = new BackupSettings(
                    document.getElementById('autoBackup').checked,
                    this.settingsData.backup.lastBackupDate
                );
                this.settingsData.backup = updatedData;
            }

            const result = await this.settingsService.saveSettings(this.currentTab, updatedData);
            if (result.success) {
                this.showToast(result.message, 'success');
                // Update saved theme reference after successful save (general tab)
                if (this.currentTab === 'general' && updatedData.themeMode) {
                    this._savedThemeRef = updatedData.themeMode;
                    this.themeManager.save(updatedData.themeMode);
                }
                // Hide cancel button after successful save (general tab)
                if (this.currentTab === 'general') {
                    const cancelBtn = document.getElementById('cancelGeneralBtn');
                    if (cancelBtn) cancelBtn.style.display = 'none';
                }
            }
        });
    }

    /**
     * Bind events for the current tab (prevents duplicate listeners).
     */
    _bindTabEvents(tabName) {
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

        // Backup tab: Backup Now + Logout buttons
        if (tabName === 'backup') {
            const backupBtn = document.getElementById('backupNowBtn');
            if (backupBtn && !backupBtn.dataset.bound) {
                backupBtn.dataset.bound = 'true';
                backupBtn.addEventListener('click', () => {
                    this.showToast('Manual backup started successfully!', 'info');
                });
            }

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn && !logoutBtn.dataset.bound) {
                logoutBtn.dataset.bound = 'true';
                logoutBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to log out from FOODHUB?')) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        // Note: foodhub_theme is preserved for theme preference
                        window.location.href = 'login.html';
                    }
                });
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
        if (this.settingsData) {
            this.settingsData.general.themeMode = theme;
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

        if (this.settingsData) {
            this.settingsData.general.themeMode = savedTheme;
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
    loadSidebarNav();
    loadTopNavbar();
    new SettingsController();
});