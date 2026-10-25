export class SettingsModel {
    constructor(data = {}) {
        // General Tab
        this.systemName = data.systemName || 'FOODHUB';
        this.language = data.language || 'English';
        this.themeMode = data.themeMode || 'light';

        // Notification Tab
        this.emailAlertsForNewOrders = data.emailAlertsForNewOrders !== undefined ? data.emailAlertsForNewOrders : true;
        this.inAppSoundAlerts = data.inAppSoundAlerts !== undefined ? data.inAppSoundAlerts : true;
        this.smsNotifications = data.smsNotifications !== undefined ? data.smsNotifications : false;

        // Backup Tab
        this.enableAutomaticDailyBackups = data.enableAutomaticDailyBackups !== undefined ? data.enableAutomaticDailyBackups : true;
        this.lastSuccessfulBackup = data.lastSuccessfulBackup || 'October 27, 2026 - 11:30 PM';
    }
}