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
            this.renderTabContent(this.currentTab);
            this.initEventListeners();
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    renderTabContent(tabKey) {
        this.currentTab = tabKey;
        const container = document.getElementById('settingsTabContent');

        switch (tabKey) {
            case 'general':
                container.innerHTML = `
                    <div class="card-header">
                        <h2>General Settings</h2>
                        <p>Configure your basic application and store preferences.</p>
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
                        <div class="form-actions">
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
                                <input type="checkbox" id="emailAlerts" ${this.settingsData.notification.emailAlerts ? 'checked' : ''}>
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>In-App Sound Alerts</span>
                                <input type="checkbox" id="orderSoundAlerts" ${this.settingsData.notification.orderSoundAlerts ? 'checked' : ''}>
                            </label>
                        </div>
                        <div class="form-group checkbox-group">
                            <label class="switch-label">
                                <span>SMS Notifications</span>
                                <input type="checkbox" id="smsNotifications" ${this.settingsData.notification.smsNotifications ? 'checked' : ''}>
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
                                <input type="checkbox" id="payAtStore" ${this.settingsData.payment.payAtStore ? 'checked' : ''}>
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
                                <input type="checkbox" id="autoBackup" ${this.settingsData.backup.autoBackup ? 'checked' : ''}>
                            </label>
                        </div>
                        <div class="form-group">
                            <label>Last Successful Backup</label>
                            <input type="text" class="form-control" value="${this.settingsData.backup.lastBackupDate}" disabled>
                        </div>
                        <div class="form-actions" style="display: flex; gap: 12px; align-items: center;">
                            <button type="submit" class="btn-primary">Save Changes</button>
                            <button type="button" id="backupNowBtn" class="btn-secondary" style="padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border-color); background: #fff; cursor: pointer; font-weight: 600;">Backup Now</button>
                        </div>
                    </div>
                `;
                // Backup now event listener
                document.getElementById('backupNowBtn')?.addEventListener('click', () => {
                    alert('Manual backup started successfully!');
                });
                break;
        }
    }

    initEventListeners() {
        // Tab switching clicks
        const menuItems = document.querySelectorAll('.settings-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const tabKey = item.getAttribute('data-tab');
                this.renderTabContent(tabKey);
            });
        });

        // Form submission
        const form = document.getElementById('settingsForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            let updatedData;
            if (this.currentTab === 'general') {
                updatedData = new GeneralSettings(
                    document.getElementById('storeName').value,
                    document.getElementById('language').value
                );
                this.settingsData.general = updatedData;
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