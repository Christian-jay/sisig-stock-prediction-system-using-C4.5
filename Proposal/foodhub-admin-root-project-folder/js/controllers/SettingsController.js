import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { SettingsService } from '../services/SettingsService.js';
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
        this.currentTab = 'general';
        this.settingsData = {};
        this.initSettings();
    }

    async initSettings() {
        try {
            this.settingsData = await this.settingsService.getAllSettings();
            this.applyTheme(this.settingsData.general.themeMode);
            this.renderTabContent(this.currentTab);
            this.initEventListeners();
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    applyTheme(mode) {
        if (mode === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }

    renderTabContent(tabKey) {
        this.currentTab = tabKey;
        const container = document.getElementById('settingsTabContent');

        switch (tabKey) {
            case 'general':
                const isDarkMode = this.settingsData.general.themeMode === 'dark';
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
                        <div class="form-group checkbox-group" style="margin-top: 6px;">
                            <label class="switch-label">
                                <span>Dark Appearance Mode</span>
                                <label class="switch">
                                    <input type="checkbox" id="darkModeToggle" ${isDarkMode ? 'checked' : ''}>
                                    <span class="slider round"></span>
                                </label>
                            </label>
                        </div>
                        <div class="form-actions" style="margin-top: 12px;">
                            <button type="submit" class="btn-primary">Save Changes</button>
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
                        <div class="form-actions" style="display: flex; gap: 12px; align-items: center;">
                            <button type="submit" class="btn-primary">Save Changes</button>
                            <button type="button" id="backupNowBtn" class="btn-secondary" style="padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--slate-text); cursor: pointer; font-weight: 600;">Backup Now</button>
                        </div>

                        <!-- LOGOUT SECTION -->
                        <div style="margin-top: 36px; border-top: 1px solid var(--border-color); padding-top: 20px;">
                            <h3 style="font-size: 16px; font-weight: 700; color: #dc2626; margin-bottom: 4px;">Terminal Session Control</h3>
                            <p style="font-size: 13px; color: var(--slate-muted); margin-bottom: 12px;">Sign out of the current staff or admin session securely.</p>
                            <button type="button" id="logoutBtn" style="background: #fee2e2; color: #dc2626; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                Log Out System Session
                            </button>
                        </div>
                    </div>
                `;

                document.getElementById('backupNowBtn')?.addEventListener('click', () => {
                    alert('Manual backup started successfully!');
                });

                document.getElementById('logoutBtn')?.addEventListener('click', () => {
                    if (confirm('Are you sure you want to log out from FOODHUB?')) {
                        alert('Session terminated successfully. Redirecting to login...');
                        window.location.reload();
                    }
                });
                break;
        }
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
                const isDarkChecked = document.getElementById('darkModeToggle').checked;
                const newTheme = isDarkChecked ? 'dark' : 'light';

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
                alert(result.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
    new SettingsController();
});