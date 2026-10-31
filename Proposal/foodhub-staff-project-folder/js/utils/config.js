/**
 * API Configuration - Staff Side
 * Dynamically determines API base URL based on current hostname
 */
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000/api`;
};

export const API_BASE_URL = getApiBaseUrl();