/**
 * API Client Utility - Staff Side
 * Centralized API requests with JWT authentication,
 * automatic token refresh, and error handling.
 * Shares the same authentication as admin side.
 */

const API_BASE = 'http://127.0.0.1:8000/api';
const REFRESH_ENDPOINT = '/auth/token/refresh/';

/**
 * Get stored access token.
 */
export function getAccessToken() {
    return localStorage.getItem('access_token');
}

/**
 * Get stored refresh token.
 */
export function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

/**
 * Store tokens.
 * With SimpleJWT rotation enabled, always save the new refresh
 * token when Django returns one.
 */
export function setTokens(access, refresh) {
    if (access) {
        localStorage.setItem('access_token', access);
    }

    if (refresh) {
        localStorage.setItem('refresh_token', refresh);
    }
}

/**
 * Clear authentication tokens.
 */
export function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

/**
 * Redirect to login after authentication can no longer be recovered.
 */
function handleAuthFailure() {
    clearTokens();

    if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = '../foodhub-admin-root-project-folder/login.html';
    }
}

/**
 * Shared refresh request.
 * Prevents simultaneous API requests from rotating the same
 * refresh token multiple times.
 */
let refreshPromise = null;

async function refreshAccessToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error('No refresh token found.');
    }

    const response = await fetch(`${API_BASE}${REFRESH_ENDPOINT}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            refresh: refreshToken
        })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.access) {
        throw new Error(
            data?.detail || 'Token refresh failed.'
        );
    }

    // Save both tokens if the backend returns a rotated refresh token.
    // If no new refresh token is returned, keep the existing one.
    setTokens(data.access, data.refresh || refreshToken);

    return data.access;
}

function getRefreshPromise() {
    if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

/**
 * Build request headers without overwriting custom headers.
 * Also supports FormData requests.
 */
function buildHeaders(options, token) {
    const headers = new Headers(options.headers || {});

    if (
        options.body != null &&
        !(options.body instanceof FormData) &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        headers.delete('Authorization');
    }

    return headers;
}

/**
 * Send an API request.
 */
async function sendRequest(endpoint, options, token) {
    return fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: buildHeaders(options, token)
    });
}

/**
 * Extract a readable error message.
 */
async function getErrorMessage(response) {
    let errorMessage = `API error: ${response.status}`;

    const errorData = await response.clone().json().catch(() => null);

    if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
    } else if (errorData?.detail) {
        errorMessage = errorData.detail;
    } else if (errorData?.non_field_errors?.[0]) {
        errorMessage = errorData.non_field_errors[0];
    } else if (errorData && typeof errorData === 'object') {
        // Handle Django REST Framework field validation errors
        // Format: { "field_name": ["error message"], ... }
        const fieldErrors = Object.entries(errorData)
            .filter(([key, value]) => Array.isArray(value) && value.length > 0)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`);

        if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
        }
    }

    return errorMessage;
}

/**
 * Main authenticated API request.
 *
 * On 401:
 * 1. Request a new access token.
 * 2. Save rotated tokens.
 * 3. Retry the original request once.
 * 4. Redirect only if authentication cannot be recovered.
 */
export async function apiRequest(endpoint, options = {}) {
    let token = getAccessToken();

    let response = await sendRequest(endpoint, options, token);

    if (response.status === 401) {
        console.warn('[AUTH] API returned 401:', endpoint);

        try {
            token = await getRefreshPromise();

            // Retry the original request only once.
            response = await sendRequest(endpoint, options, token);
        } catch (error) {
            console.error('[AUTH] Refresh failed:', error.message);

            handleAuthFailure();

            throw new Error(
                'Your session has expired. Please log in again.'
            );
        }
    }

    if (response.status === 401) {
        console.error(
            '[AUTH] Request remains unauthorized after refresh:',
            endpoint
        );

        handleAuthFailure();

        throw new Error(
            'Authentication failed. Please log in again.'
        );
    }

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/**
 * GET request.
 */
export async function apiGet(endpoint) {
    return apiRequest(endpoint, {
        method: 'GET'
    });
}

/**
 * POST request.
 */
export async function apiPost(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * PATCH request.
 */
export async function apiPatch(endpoint, data) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

/**
 * DELETE request.
 */
export async function apiDelete(endpoint) {
    return apiRequest(endpoint, {
        method: 'DELETE'
    });
}