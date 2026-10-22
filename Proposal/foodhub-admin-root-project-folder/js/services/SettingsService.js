import {
    GeneralSettings,
    BusinessInfoSettings,
    NotificationSettings,
    PaymentSettings,
    BackupSettings
} from '../models/SettingsModel.js';

export class SettingsService {
    async getAllSettings() {
        return {
            general: new GeneralSettings("FOODHUB", "English"),
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
        // Mock save logic (maaaring i-save sa localStorage)
        localStorage.setItem(`foodhub_${tabKey}_settings`, JSON.stringify(data));
        return { success: true, message: `${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)} settings saved successfully!` };
    }
}