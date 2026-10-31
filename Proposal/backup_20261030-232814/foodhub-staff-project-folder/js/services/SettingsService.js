/**
 * Settings Service - Backend API integration with localStorage fallback.
 */
import { apiGet, apiPatch, apiPost } from '../utils/api.js';
import { SettingsModel } from '../models/SettingsModel.js';

const LOCAL_STORAGE_KEY = 'foodhub_user_settings';

export class SettingsService {
    constructor() {
        this._cachedSettings = null;
        this._cacheTimestamp = null;
        this._cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get settings from backend API with localStorage fallback.
     * @returns {Promise<SettingsModel>}
     */
    async getSettings() {
        // Check cache first
        if (this._isCacheValid()) {
            return this._cachedSettings;
        }

        try {
            // Try to fetch from backend
            const response = await apiGet('/settings/me/');
            const settings = SettingsModel.fromAPI(response);

            // Update cache
            this._cachedSettings = settings;
            this._cacheTimestamp = Date.now();

            // Also update localStorage for offline persistence
            this._saveToLocalStorage(settings);

            return settings;
        } catch (error) {
            console.warn('[SettingsService] Backend fetch failed, falling back to localStorage:', error.message);

            // Fallback to localStorage
            const localSettings = this._loadFromLocalStorage();
            if (localSettings) {
                this._cachedSettings = localSettings;
                this._cacheTimestamp = Date.now();
                return localSettings;
            }

            // Final fallback to defaults
            const defaults = SettingsModel.getDefaults();
            this._cachedSettings = defaults;
            this._cacheTimestamp = Date.now();
            return defaults;
        }
    }

    /**
     * Force refresh settings from backend (bypass cache).
     */
    async refreshSettings() {
        this._cachedSettings = null;
        this._cacheTimestamp = null;
        return this.getSettings();
    }

    /**
     * Update settings via backend API.
     * @param {SettingsModel|Object} settingsData
     * @returns {Promise<SettingsModel>}
     */
    async updateSettings(settingsData) {
        // Convert to payload if it's a SettingsModel
        const payload = settingsData instanceof SettingsModel
            ? settingsData.toJSON()
            : settingsData;

        // Validate before sending
        const tempModel = new SettingsModel(payload);
        const validation = tempModel.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        try {
            const response = await apiPatch('/settings/update_settings/', payload);
            const updatedSettings = SettingsModel.fromAPI(response);

            // Update cache
            this._cachedSettings = updatedSettings;
            this._cacheTimestamp = Date.now();

            // Update localStorage
            this._saveToLocalStorage(updatedSettings);

            return updatedSettings;
        } catch (error) {
            console.error('[SettingsService] Failed to update settings:', error);

            // Don't update localStorage on API failure - we don't want stale data
            throw error;
        }
    }

    /**
     * Trigger backup via backend API.
     * @returns {Promise<SettingsModel>} Updated settings with new backup timestamp
     */
    async createBackup() {
        try {
            const response = await apiPost('/settings/backup/', {});
            const updatedSettings = SettingsModel.fromAPI(response.settings || response);

            // Update cache
            this._cachedSettings = updatedSettings;
            this._cacheTimestamp = Date.now();

            // Update localStorage
            this._saveToLocalStorage(updatedSettings);

            return updatedSettings;
        } catch (error) {
            console.error('[SettingsService] Backup failed:', error);
            throw error;
        }
    }

    /**
     * Check if cache is still valid.
     * @returns {boolean}
     */
    _isCacheValid() {
        if (!this._cachedSettings || !this._cacheTimestamp) return false;
        return (Date.now() - this._cacheTimestamp) < this._cacheTTL;
    }

    /**
     * Save settings to localStorage.
     * @param {SettingsModel} settings
     */
    _saveToLocalStorage(settings) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('[SettingsService] Failed to save to localStorage:', error);
        }
    }

    /**
     * Load settings from localStorage.
     * @returns {SettingsModel|null}
     */
    _loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return new SettingsModel(parsed);
            }
        } catch (error) {
            console.warn('[SettingsService] Failed to load from localStorage:', error);
        }
        return null;
    }

    /**
     * Get theme mode from localStorage (for immediate application on page load).
     * @returns {string}
     */
    getLocalThemeMode() {
        return localStorage.getItem('foodhub_theme') || 'light';
    }

    /**
     * Save theme mode to localStorage (for immediate application).
     * @param {string} themeMode
     */
    saveLocalThemeMode(themeMode) {
        localStorage.setItem('foodhub_theme', themeMode);
    }

    /**
     * Clear all cached data.
     */
    clearCache() {
        this._cachedSettings = null;
        this._cacheTimestamp = null;
    }
}