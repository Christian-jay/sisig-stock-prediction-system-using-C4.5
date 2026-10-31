/**
 * ThemeManager — Global Admin Side Theme Management
 *
 * Responsibilities:
 * - Apply theme (light/dark) via document.body.dataset.theme
 * - Read locally saved theme on init (before paint)
 * - Validate theme values
 * - Provide methods: init, apply, get, save, sync with backend
 * - Prevent theme flash on page load
 * - Integrate with existing SettingsService for backend sync
 *
 * Usage:
 *   import { ThemeManager } from './utils/ThemeManager.js';
 *   const themeManager = new ThemeManager();
 *   await themeManager.init(); // Call immediately on page load
 *
 *   // Later: themeManager.apply('dark'); themeManager.save();
 *
 * This module is ADMIN SIDE ONLY. Does not affect Staff.
 */

/** Valid theme identifiers */
export const THEMES = Object.freeze({
    LIGHT: 'light',
    DARK: 'dark',
});

/** localStorage key for theme persistence (must match SettingsService) */
const THEME_STORAGE_KEY = 'foodhub_theme';

/** Valid theme values for validation */
const VALID_THEMES = new Set([THEMES.LIGHT, THEMES.DARK]);

/** Default theme when none saved or invalid */
const DEFAULT_THEME = THEMES.LIGHT;

/**
 * ThemeManager class
 */
export class ThemeManager {
    /**
     * @param {Object} options
     * @param {SettingsService} [options.settingsService] - Optional SettingsService instance for backend sync
     */
    constructor(options = {}) {
        this._settingsService = options.settingsService || null;
        this._currentTheme = DEFAULT_THEME;
        this._initialized = false;
        this._syncInProgress = false;
        this._syncPromise = null;
    }

    /**
     * Initialize theme manager.
     * Applies locally saved theme immediately (no flash),
     * then syncs with backend asynchronously.
     *
     * @returns {Promise<string>} Resolves with applied theme
     */
    async init() {
        if (this._initialized) {
            return this._currentTheme;
        }

        // 1. Apply local theme IMMEDIATELY (before paint, no flash)
        const localTheme = this._getLocalTheme();
        this._applyTheme(localTheme);
        this._currentTheme = localTheme;

        // 2. Attempt backend sync AFTER initial paint (non-blocking)
        this._syncWithBackend().catch(err => {
            console.warn('[ThemeManager] Backend sync failed, using local theme:', err.message);
        });

        this._initialized = true;
        return this._currentTheme;
    }

    /**
     * Apply a theme to the document body.
     * Updates DOM attribute only — does not persist.
     *
     * @param {string} theme - 'light' or 'dark'
     * @returns {boolean} True if theme was applied
     */
    apply(theme) {
        if (!this._isValidTheme(theme)) {
            console.warn(`[ThemeManager] Invalid theme: "${theme}". Must be 'light', 'dark', or 'midnight'.`);
            return false;
        }

        this._applyTheme(theme);
        this._currentTheme = theme;
        return true;
    }

    /**
     * Get the currently applied theme.
     *
     * @returns {string} 'light' or 'dark'
     */
    get() {
        return this._currentTheme;
    }

    /**
     * Save theme to localStorage.
     * Called after user confirms selection in Settings.
     *
     * @param {string} theme - 'light' or 'dark'
     * @returns {boolean} True if saved
     */
    save(theme) {
        if (!this._isValidTheme(theme)) {
            console.warn(`[ThemeManager] Cannot save invalid theme: "${theme}".`);
            return false;
        }

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
            // Also update SettingsService's local theme cache for consistency
            if (this._settingsService && typeof this._settingsService.saveLocalThemeMode === 'function') {
                this._settingsService.saveLocalThemeMode(theme);
            }
            return true;
        } catch (err) {
            console.error('[ThemeManager] Failed to save theme to localStorage:', err);
            return false;
        }
    }

    /**
     * Save current theme and sync with backend.
     * Used by SettingsController after user clicks "Save Changes".
     *
     * @returns {Promise<{success: boolean, theme: string, error?: string}>}
     */
    async saveAndSync() {
        const theme = this._currentTheme;

        // 1. Persist locally first
        this.save(theme);

        // 2. Sync with backend if SettingsService available
        if (this._settingsService) {
            try {
                await this._syncThemeToBackend(theme);
                return { success: true, theme };
            } catch (err) {
                console.error('[ThemeManager] Backend sync failed:', err);
                return { success: false, theme, error: err.message };
            }
        }

        // No backend service — local only
        return { success: true, theme };
    }

    /**
     * Force re-sync with backend (e.g., after login or manual refresh).
     *
     * @returns {Promise<string>} Resolved theme from backend or local fallback
     */
    async forceSync() {
        if (!this._settingsService) {
            console.warn('[ThemeManager] No SettingsService available for sync');
            return this._currentTheme;
        }

        return this._syncWithBackend();
    }

    /**
     * Check if a theme value is valid.
     *
     * @param {string} theme
     * @returns {boolean}
     */
    _isValidTheme(theme) {
        return VALID_THEMES.has(theme);
    }

    /**
     * Apply theme to document body.
     * Runs synchronously — no flash.
     *
     * @param {string} theme
     * @private
     */
    _applyTheme(theme) {
        if (document.body) {
            document.body.dataset.theme = theme;
        } else {
            // If body not ready yet (very early init), wait for it
            document.addEventListener('DOMContentLoaded', () => {
                document.body.dataset.theme = theme;
            }, { once: true });
        }
    }

    /**
     * Get theme from localStorage with validation.
     * Falls back to DEFAULT_THEME.
     *
     * @returns {string} 'light' or 'dark'
     * @private
     */
    _getLocalTheme() {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (this._isValidTheme(stored)) {
                return stored;
            }
        } catch (_) {
            // localStorage unavailable or corrupted
        }
        return DEFAULT_THEME;
    }

    /**
     * Sync theme from backend to local.
     * Called once on init. Non-blocking.
     *
     * @returns {Promise<string>} Resolved theme
     * @private
     */
    async _syncWithBackend() {
        if (this._syncInProgress) {
            return this._syncPromise;
        }

        this._syncInProgress = true;

        this._syncPromise = (async () => {
            try {
                // Fetch current user settings from backend
                const settings = await this._settingsService.getAllSettings();

                if (settings && this._isValidTheme(settings.general?.themeMode)) {
                    const backendTheme = settings.general.themeMode;

                    // Only override local if backend differs AND we haven't explicitly saved locally
                    // Check if local was explicitly set (not just default)
                    const localTheme = this._getLocalTheme();
                    const isDefaultLocal = localTheme === DEFAULT_THEME;

                    // If local is default and backend has a preference, adopt backend
                    // If local was explicitly set, keep local (user's explicit choice wins)
                    if (isDefaultLocal && backendTheme !== localTheme) {
                        this._applyTheme(backendTheme);
                        this._currentTheme = backendTheme;
                        // Don't write to localStorage — keep as implicit sync
                        console.log('[ThemeManager] Adopted backend theme:', backendTheme);
                    } else if (backendTheme !== localTheme) {
                        console.log('[ThemeManager] Local theme differs from backend, keeping local:', localTheme);
                    }
                }
            } catch (err) {
                // Silent fail — local theme remains
                console.debug('[ThemeManager] Backend theme fetch failed:', err.message);
            } finally {
                this._syncInProgress = false;
                this._syncPromise = null;
            }

            return this._currentTheme;
        })();

        return this._syncPromise;
    }

    /**
     * Push theme to backend via SettingsService.
     *
     * @param {string} theme
     * @returns {Promise<void>}
     * @private
     */
    async _syncThemeToBackend(theme) {
        // Create a minimal settings update payload
        // SettingsService.updateSettings expects a SettingsModel or plain object
        const payload = { theme_mode: theme };
        await this._settingsService.saveSettings('general', {
            storeName: 'FOODHUB',
            language: 'English',
            themeMode: theme
        });
    }

    /**
     * Inject SettingsService instance (for lazy initialization).
     * Useful if ThemeManager loads before SettingsService.
     *
     * @param {SettingsService} service
     */
    setSettingsService(service) {
        this._settingsService = service;
    }
}

/**
 * Synchronous helper: apply theme immediately without ThemeManager instance.
 * Useful for inline script in <head> before modules load.
 *
 * @param {string} theme - 'light' or 'dark'
 */
export function applyThemeImmediate(theme) {
    if (VALID_THEMES.has(theme)) {
        document.body.dataset.theme = theme;
    }
}

/**
 * Synchronous helper: get theme from localStorage immediately.
 * Useful for inline script in <head> before modules load.
 *
 * @returns {string} 'light' or 'dark'
 */
export function getLocalThemeImmediate() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (VALID_THEMES.has(stored)) {
            return stored;
        }
    } catch (_) {}
    return DEFAULT_THEME;
}

/**
 * Synchronous helper: save theme to localStorage immediately.
 *
 * @param {string} theme - 'light' or 'dark'
 * @returns {boolean}
 */
export function saveThemeImmediate(theme) {
    if (!VALID_THEMES.has(theme)) return false;
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Auto-initialization pattern for pages that don't use modules.
 * Include as inline script in <head> BEFORE themes.css:
 *
 *   <script>
 *     (function() {
 *       const theme = localStorage.getItem('foodhub_theme');
 *       if (theme === 'light' || theme === 'dark') {
 *         document.documentElement.dataset.theme = theme;
 *         document.body.dataset.theme = theme;
 *       }
 *     })();
 *   </script>
 *
 * Then load ThemeManager module normally for full functionality.
 */