import { SettingsService } from '../services/SettingsService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class SettingsController {
    constructor() {
        this.settingsService = new SettingsService();
        this.currentSettings = this.settingsService.getSettings();

        this.initLayout();
        this.applyTheme(this.currentSettings.themeMode);
        this.initTabs();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    applyTheme(mode) {
        if (mode === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }

    initTabs() {
        const menuItems = document.querySelectorAll('.settings-menu-item');

        // Render default tab (General)
        this.renderTabContent('general');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                menuItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');

                const tabName = item.getAttribute('data-tab');
                this.renderTabContent(tabName);
            });
        });
    }

    renderTabContent(tabName) {
        // Nakatugma na sa id="staffTabContent" sa HTML
        const container = document.getElementById('staffTabContent');
        if (!container) return;

        const s = this.currentSettings;

        switch (tabName) {
            case 'general':
                const isDarkMode = s.themeMode === 'dark';
                container.innerHTML = `
                    <div class="tab-pane">
                        <h3>General Settings</h3>
                        <p class="tab-desc">Control basic system preferences, themes, and language options.</p>
                        
                        <div class="form-group">
                            <label>System Name</label>
                            <input type="text" id="sysName" class="form-control" value="${s.systemName}">
                        </div>

                        <div class="form-group">
                            <label>System Language</label>
                            <select id="sysLanguage" class="form-control">
                                <option value="English" ${s.language === 'English' ? 'selected' : ''}>English</option>
                                <option value="Tagalog" ${s.language === 'Tagalog' ? 'selected' : ''}>Tagalog</option>
                            </select>
                        </div>

                        <div class="toggle-row" style="margin-top: 20px;">
                            <div>
                                <strong>Dark Appearance Mode</strong>
                                <p class="text-muted font-12">Switch between clean light interface and dark theme.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="toggleThemeMode" ${isDarkMode ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div class="form-actions" style="margin-top: 24px;">
                            <button type="button" class="btn-primary">Save Changes</button>
                        </div>
                    </div>
                `;
                break;

            case 'notification':
                container.innerHTML = `
                    <div class="tab-pane">
                        <h3>Notification Preferences</h3>
                        <p class="tab-desc">Configure alerts and audio chimes for new incoming orders and updates.</p>
                        
                        <div class="toggle-row">
                            <div>
                                <strong>Email Alerts for New Orders</strong>
                                <p class="text-muted font-12">Receive instant email notifications whenever a new order is placed.</p>
                            </div>
                            <label class="switch"><input type="checkbox" id="notifEmailOrders" ${s.emailAlertsForNewOrders ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>

                        <div class="toggle-row">
                            <div>
                                <strong>In-App Sound Alerts</strong>
                                <p class="text-muted font-12">Play notification audio chimes directly on the dashboard terminal.</p>
                            </div>
                            <label class="switch"><input type="checkbox" id="notifSoundAlerts" ${s.inAppSoundAlerts ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>

                        <div class="toggle-row">
                            <div>
                                <strong>SMS Notifications</strong>
                                <p class="text-muted font-12">Send text alerts to designated mobile numbers for critical status logs.</p>
                            </div>
                            <label class="switch"><input type="checkbox" id="notifSms" ${s.smsNotifications ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>

                        <div class="form-actions" style="margin-top: 24px;">
                            <button type="button" class="btn-primary">Save Changes</button>
                        </div>
                    </div>
                `;
                break;

            case 'backup':
                container.innerHTML = `
                    <div class="tab-pane">
                        <h3>System Backup & Data</h3>
                        <p class="tab-desc">Manage database backups and system restoration points.</p>
                        
                        <div class="toggle-row">
                            <div>
                                <strong>Enable Automatic Daily Backups</strong>
                                <p class="text-muted font-12">Automatically back up transaction records and inventory logs daily.</p>
                            </div>
                            <label class="switch"><input type="checkbox" id="bakAutoDaily" ${s.enableAutomaticDailyBackups ? 'checked' : ''}><span class="slider round"></span></label>
                        </div>

                        <div class="form-group" style="margin-top: 20px;">
                            <label>Last Successful Backup</label>
                            <input type="text" class="form-control" value="${s.lastSuccessfulBackup}" readonly style="background-color: var(--bg-main); cursor: not-allowed;">
                        </div>

                        <div style="margin-top: 20px; display: flex; gap: 12px; align-items: center; justify-content: flex-start;">
                            <button type="button" class="btn-primary">Save Changes</button>
                            <button type="button" id="backupNowBtn" style="padding: 10px 16px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--slate-text); cursor: pointer; font-weight: 600;">Backup Now</button>
                        </div>

                        <div style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                            <h4 style="color: #dc2626; margin-bottom: 6px; font-size: 15px;">Terminal Session Control</h4>
                            <p class="text-muted font-12" style="margin-bottom: 12px;">Sign out of the current staff administration profile securely.</p>
                            <button type="button" id="logoutBtn" style="background: #fee2e2; color: #dc2626; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Log Out System Session
                            </button>
                        </div>
                    </div>
                `;
                break;
        }

        this.bindTabEvents(tabName);
    }

    bindTabEvents(tabName) {
        const saveBtns = document.querySelectorAll('.btn-primary');
        saveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (tabName === 'general') {
                    this.currentSettings.systemName = document.getElementById('sysName').value;
                    this.currentSettings.language = document.getElementById('sysLanguage').value;

                    const isDarkChecked = document.getElementById('toggleThemeMode').checked;
                    const selectedTheme = isDarkChecked ? 'dark' : 'light';

                    this.currentSettings.themeMode = selectedTheme;
                    this.applyTheme(selectedTheme);
                } else if (tabName === 'notification') {
                    this.currentSettings.emailAlertsForNewOrders = document.getElementById('notifEmailOrders').checked;
                    this.currentSettings.inAppSoundAlerts = document.getElementById('notifSoundAlerts').checked;
                    this.currentSettings.smsNotifications = document.getElementById('notifSms').checked;
                } else if (tabName === 'backup') {
                    this.currentSettings.enableAutomaticDailyBackups = document.getElementById('bakAutoDaily').checked;
                }

                this.settingsService.saveSettings(this.currentSettings);
                alert('Settings updated successfully!');
            });
        });

        const backupNowBtn = document.getElementById('backupNowBtn');
        if (backupNowBtn) {
            backupNowBtn.addEventListener('click', () => {
                alert('Database backup initiated successfully. System snapshot saved!');
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to log out from FOODHUB?')) {
                    alert('Session terminated successfully. Redirecting to login...');
                    window.location.reload();
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsController();
});