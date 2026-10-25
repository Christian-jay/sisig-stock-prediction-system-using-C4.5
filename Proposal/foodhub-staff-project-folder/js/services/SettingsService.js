import { SettingsModel } from '../models/SettingsModel.js';

export class SettingsService {
    getSettings() {
        return new SettingsModel({
            systemName: 'FOODHUB',
            language: 'English',
            themeMode: localStorage.getItem('foodhub_theme') || 'light',
            emailAlertsForNewOrders: true,
            inAppSoundAlerts: true,
            smsNotifications: false,
            enableAutomaticDailyBackups: true,
            lastSuccessfulBackup: 'October 27, 2026 - 11:30 PM'
        });
    }

    saveSettings(updatedData) {
        console.warn("Static mode: Settings updated temporarily.", updatedData);
        if (updatedData.themeMode) {
            localStorage.setItem('foodhub_theme', updatedData.themeMode);
        }
        return new SettingsModel(updatedData);
    }
}