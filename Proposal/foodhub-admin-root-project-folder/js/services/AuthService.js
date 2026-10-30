import { setTokens, clearTokens } from '../utils/api.js';

/**
 * AuthService
 * Handles authentication API communication and token storage.
 */
export default class AuthService {

    /**
     * Safely parse API responses.
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return await response.json();
        }

        const text = await response.text();

        throw new Error(
            `Server returned a non-JSON response (HTTP ${response.status}). ` +
            `Check the API URL and Django server logs.`
        );
    }

    /**
     * Authenticate user with email and password.
     */
    async authenticate(userModel) {
        const response = await fetch(
            'http://127.0.0.1:8000/api/auth/token/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userModel.email,
                    password: userModel.password
                })
            }
        );

        const data = await this.parseResponse(response);

        if (!response.ok) {
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

        if (data.access) {
            setTokens(data.access, data.refresh || '');
        }

        return {
            success: true,
            message: data.user
                ? `Welcome, ${data.user.first_name || data.user.username || 'User'}!`
                : 'Login successful! Redirecting...',
            user: data.user || null
        };
    }

    /**
     * Request password reset email.
     */
    async requestPasswordReset(email) {
        const response = await fetch(
            'http://127.0.0.1:8000/api/accounts/password-reset/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await this.parseResponse(response);

        if (!response.ok) {
            throw new Error(
                data?.detail ||
                data?.error ||
                'Unable to process your password reset request.'
            );
        }

        return data;
    }

    /**
     * Reset password with token.
     */
    async resetPassword(token, newPassword) {
        const response = await fetch(
            'http://127.0.0.1:8000/api/accounts/password-reset/confirm/',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    new_password: newPassword
                })
            }
        );

        const data = await this.parseResponse(response);

        if (!response.ok) {
            let errorMessage =
                'Failed to reset password. The link may have expired or already been used.';

            if (data?.detail) {
                errorMessage = data.detail;
            } else if (data?.token) {
                errorMessage = data.token[0];
            } else if (data?.new_password) {
                errorMessage = data.new_password[0];
            }

            throw new Error(errorMessage);
        }

        return data;
    }

    /**
     * Logout user.
     */
    logout() {
        clearTokens();
    }

    /**
     * Check authentication status.
     */
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }
}