import { setTokens } from '../utils/api.js';

/**
 * AuthService
 * Handles authentication API communication and token storage.
 */
export default class AuthService {
    /**
     * Authenticate user with email and password
     * @param {Object} userModel - Object with email, password, rememberMe properties
     * @returns {Promise<Object>} Response with success, message, and tokens
     */
    async authenticate(userModel) {
        const response = await fetch('http://127.0.0.1:8000/api/auth/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: userModel.email,
                password: userModel.password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle Django REST framework error format
            let errorMessage = 'Invalid email or password';
            if (data?.error?.message) {
                errorMessage = data.error.message;
            } else if (data?.detail) {
                errorMessage = data.detail;
            } else if (data?.non_field_errors) {
                errorMessage = data.non_field_errors[0];
            }
            throw new Error(errorMessage);
        }

        // Store tokens if authentication successful
        if (data.access) {
            setTokens(data.access, data.refresh || '');
        }

        // Return user-friendly response format
        return {
            success: true,
            message: data.user ? `Welcome, ${data.user.first_name || data.user.username || 'Admin'}!` : 'Login successful! Redirecting...',
            user: data.user || null
        };
    }
}