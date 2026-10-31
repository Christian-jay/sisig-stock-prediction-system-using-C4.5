/**
 * AuthGuard - Frontend Route Protection
 *
 * Provides authentication and authorization guards for protected pages.
 * Validates JWT tokens, checks user roles, and redirects unauthorized users.
 */

import { getAccessToken, getRefreshToken, apiRequest, clearTokens } from './api.js';

/**
 * AuthGuard class for protecting routes
 */
export class AuthGuard {
    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    static isAuthenticated() {
        return !!getAccessToken();
    }

    /**
     * Decode JWT payload (handles base64url encoding)
     * @param {string} token - JWT token
     * @returns {Object|null} Decoded payload or null
     */
    static decodeTokenPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            if (!base64Url) return null;
            // Convert base64url to base64
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            // Add padding if needed
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
            return JSON.parse(atob(padded));
        } catch (error) {
            console.error('[AuthGuard] Failed to decode token:', error);
            return null;
        }
    }

    /**
     * Get current user role from token (without API call)
     * @returns {string|null} User role or null if not available
     */
    static getUserRoleFromToken() {
        const token = getAccessToken();
        if (!token) return null;
        const payload = this.decodeTokenPayload(token);
        return payload?.role || null;
    }

    /**
     * Get current user ID from token
     * @returns {number|null} User ID or null
     */
    static getUserIdFromToken() {
        const token = getAccessToken();
        if (!token) return null;
        const payload = this.decodeTokenPayload(token);
        return payload?.user_id || payload?.id || null;
    }

    /**
     * Validate token with backend
     * @returns {Promise<Object|null>} User data or null if invalid
     */
    static async validateToken() {
        try {
            const response = await apiRequest('/accounts/users/me/');
            return response;
        } catch (error) {
            console.error('[AuthGuard] Token validation failed:', error);
            return null;
        }
    }

    /**
     * Protect a page - redirect to login if not authenticated or unauthorized
     * @param {Object} options - Guard options
     * @param {string[]} options.allowedRoles - Array of allowed roles (e.g., ['ADMIN', 'STAFF'])
     * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
     * @param {string} options.loginUrl - Login page URL (default: 'login.html')
     * @returns {Promise<Object|null>} User data if authorized, null if redirected
     */
    static async protect(options = {}) {
        const {
            allowedRoles = ['ADMIN', 'STAFF'],
            requireAuth = true,
            loginUrl = '/foodhub-admin-root-project-folder/login.html'
        } = options;

        // Check if we have a token
        if (requireAuth && !this.isAuthenticated()) {
            console.warn('[AuthGuard] No authentication token found, redirecting to login');
            this.redirectToLogin(loginUrl);
            return null;
        }

        // If no auth required, allow access
        if (!requireAuth) {
            return { role: 'GUEST' };
        }

        // Get role from token (quick check)
        const tokenRole = this.getUserRoleFromToken();

        // If we have a role from token, do quick authorization check
        if (tokenRole) {
            if (!allowedRoles.includes(tokenRole)) {
                console.warn(`[AuthGuard] Role ${tokenRole} not allowed for this page`);
                this.handleUnauthorized();
                return null;
            }
            // Quick check passed, return user info from token
            return {
                role: tokenRole,
                userId: this.getUserIdFromToken()
            };
        }

        // If we couldn't get role from token, validate with backend
        const userData = await this.validateToken();
        if (!userData) {
            console.warn('[AuthGuard] Token validation failed, redirecting to login');
            this.redirectToLogin(loginUrl);
            return null;
        }

        // Check role from backend response
        const userRole = userData.role;
        if (!allowedRoles.includes(userRole)) {
            console.warn(`[AuthGuard] Role ${userRole} not allowed for this page`);
            this.handleUnauthorized();
            return null;
        }

        return userData;
    }

    /**
     * Redirect to login page
     * @param {string} loginUrl - Login page URL
     */
    static redirectToLogin(loginUrl) {
        // Preserve the current page for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        const encodedPath = encodeURIComponent(currentPath);

        // Check if loginUrl already has query params
        const separator = loginUrl.includes('?') ? '&' : '?';
        window.location.href = `${loginUrl}${separator}redirect=${encodedPath}`;
    }

    /**
     * Handle unauthorized access - redirect to appropriate dashboard based on role
     */
    static handleUnauthorized() {
        const tokenRole = this.getUserRoleFromToken();
        let redirectUrl;

        if (tokenRole === 'ADMIN') {
            // Admin trying to access staff page → redirect to admin dashboard
            redirectUrl = '/foodhub-admin-root-project-folder/dashboard.html';
        } else if (tokenRole === 'STAFF') {
            // Staff trying to access admin page → redirect to staff dashboard
            redirectUrl = '/foodhub-staff-project-folder/dashboard.html';
        } else {
            // Unknown role → redirect to login
            redirectUrl = '/foodhub-admin-root-project-folder/login.html';
        }

        window.location.href = redirectUrl;
    }

    /**
     * Logout user and redirect to login
     * @param {string} loginUrl - Login page URL
     */
    static logout(loginUrl = 'login.html') {
        clearTokens();
        // Preserve theme preference
        // localStorage.removeItem('foodhub_theme');
        window.location.href = loginUrl;
    }

    /**
     * Initialize auth guard for a page (convenience method)
     * @param {Object} options - Guard options
     * @returns {Promise<Object|null>} User data if authorized
     */
    static async init(options = {}) {
        return this.protect(options);
    }
}

/**
 * Admin-only guard - convenience function
 * @returns {Promise<Object|null>} User data if admin
 */
export async function requireAdmin() {
    return AuthGuard.protect({ allowedRoles: ['ADMIN'] });
}

/**
 * Staff-or-admin guard - convenience function
 * @returns {Promise<Object|null>} User data if staff or admin
 */
export async function requireStaff() {
    return AuthGuard.protect({ allowedRoles: ['STAFF', 'ADMIN'] });
}

/**
 * Any authenticated user guard - convenience function
 * @returns {Promise<Object|null>} User data if authenticated
 */
export async function requireAuth() {
    return AuthGuard.protect({ allowedRoles: ['ADMIN', 'STAFF'] });
}

/**
 * Hook for protecting pages that load as ES modules
 * Usage: import { protectPage } from './utils/AuthGuard.js';
 *        protectPage({ allowedRoles: ['ADMIN'] });
 *
 * @param {Object} options - Guard options
 */
export async function protectPage(options = {}) {
    const userData = await AuthGuard.protect(options);

    // If we get here, user is authorized
    // Return user data for controllers to use
    return userData;
}

export default AuthGuard;