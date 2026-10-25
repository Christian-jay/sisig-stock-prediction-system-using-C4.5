import {
    GeneralSettings,
    BusinessInfoSettings,
    NotificationSettings,
    PaymentSettings,
    BackupSettings
} from '../models/SettingsModel.js';

export class SettingsService {
    async getAllSettings() {
        const savedTheme = localStorage.getItem('foodhub_theme') || 'light';
        return {
            general: new GeneralSettings("FOODHUB", "English", savedTheme),
            business: new BusinessInfoSettings("Juan Dela Cruz", "Biñan, Laguna, Philippines", "000-123-456-789", "09:00 AM - 10:00 PM"),
            notification: new NotificationSettings(true, true, false),
            payment: new PaymentSettings(
                true,
                "Please prepare exact cash amount upon delivery or pickup at the store."
            ),
            backup: new BackupSettings(true, "October 18, 2026 - 10:00 PM")
        };
    }

    async saveSettings(tabKey, data) {
        localStorage.setItem(`foodhub_${tabKey}_settings`, JSON.stringify(data));
        if (tabKey === 'general' && data.themeMode) {
            localStorage.setItem('foodhub_theme', data.themeMode);
        }
        return { success: true, message: `${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} settings saved successfully!` };
    }
}