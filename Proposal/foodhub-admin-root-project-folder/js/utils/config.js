/**
 * API Configuration
 * Dynamically determines API base URL based on current hostname
 */
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    // If accessing via LAN IP, use same hostname with API port
    // If accessing via localhost, use localhost with API port
    return `http://${hostname}:8000/api`;
};

export const API_BASE_URL = getApiBaseUrl();
export const AUTH_ENDPOINTS = {
    login: `${API_BASE_URL}/auth/token/`,
    passwordReset: `${API_BASE_URL}/accounts/password-reset/`,
    passwordResetConfirm: `${API_BASE_URL}/accounts/password-reset/confirm/`,
};

// For backward compatibility
export const API_URL = API_BASE_URL;