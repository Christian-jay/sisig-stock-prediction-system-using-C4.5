/**
 * Settings Model - Data transformation, validation, and defaults.
 */

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
        this.lastSuccessfulBackup = data.lastSuccessfulBackup || null;
        this.lastBackupFormatted = data.lastBackupFormatted || 'Never';

        // Metadata
        this.createdAt = data.createdAt || null;
        this.updatedAt = data.updatedAt || null;
    }

    /**
     * Transform backend API response to frontend model.
     * Backend uses snake_case, frontend uses camelCase.
     */
    static fromAPI(apiData) {
        if (!apiData) return new SettingsModel();

        return new SettingsModel({
            systemName: 'FOODHUB', // System name is not user-specific
            language: apiData.language,
            themeMode: apiData.theme_mode,
            emailAlertsForNewOrders: apiData.email_alerts_for_new_orders,
            inAppSoundAlerts: apiData.in_app_sound_alerts,
            smsNotifications: apiData.sms_notifications,
            enableAutomaticDailyBackups: apiData.enable_automatic_daily_backups,
            lastSuccessfulBackup: apiData.last_successful_backup,
            lastBackupFormatted: apiData.last_backup_formatted || 'Never',
            createdAt: apiData.created_at,
            updatedAt: apiData.updated_at,
        });
    }

    /**
     * Transform frontend model to API request payload.
     * Frontend uses camelCase, backend expects snake_case.
     */
    toJSON() {
        return {
            language: this.language,
            theme_mode: this.themeMode,
            email_alerts_for_new_orders: this.emailAlertsForNewOrders,
            in_app_sound_alerts: this.inAppSoundAlerts,
            sms_notifications: this.smsNotifications,
            enable_automatic_daily_backups: this.enableAutomaticDailyBackups,
        };
    }

    /**
     * Validate settings before sending to API.
     * Returns { isValid: boolean, errors: string[] }
     */
    validate() {
        const errors = [];

        // General validation
        if (!this.language || !['English', 'Tagalog'].includes(this.language)) {
            errors.push('Language must be English or Tagalog.');
        }

        if (!this.themeMode || !['light', 'dark'].includes(this.themeMode)) {
            errors.push('Theme mode must be light or dark.');
        }

        // Notification validation (booleans - just ensure they're booleans)
        if (typeof this.emailAlertsForNewOrders !== 'boolean') {
            errors.push('Email alerts must be a boolean value.');
        }
        if (typeof this.inAppSoundAlerts !== 'boolean') {
            errors.push('In-app sound alerts must be a boolean value.');
        }
        if (typeof this.smsNotifications !== 'boolean') {
            errors.push('SMS notifications must be a boolean value.');
        }

        // Backup validation
        if (typeof this.enableAutomaticDailyBackups !== 'boolean') {
            errors.push('Automatic daily backups must be a boolean value.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get default settings for initialization.
     */
    static getDefaults() {
        return new SettingsModel();
    }

    /**
     * Create a copy with updated values.
     */
    cloneWith(updates = {}) {
        return new SettingsModel({
            ...this,
            ...updates
        });
    }
}