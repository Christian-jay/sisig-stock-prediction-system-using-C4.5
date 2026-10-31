import AuthService from '../services/AuthService.js';

/**
 * ForgotPasswordController
 * Handles the forgot password flow - requests password reset email
 */
export default class ForgotPasswordController {
    constructor() {
        this.authService = new AuthService();
        this.initEventListeners();
    }

    initEventListeners() {
        const form = document.getElementById('forgotPasswordForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();

        const emailInput = document.getElementById('email').value.trim();
        const messageElement = document.getElementById('formMessage');
        const submitButton = document.getElementById('submitButton');
        const buttonText = document.getElementById('buttonText');

        // Basic validation
        if (!emailInput) {
            this.showMessage('Please enter your email address', 'error');
            return;
        }

        if (!this.isValidEmail(emailInput)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        // UI Loading State
        submitButton.disabled = true;
        buttonText.textContent = "Sending...";
        this.showMessage('Sending reset link to your email...', 'info');

        try {
            const response = await this.authService.requestPasswordReset(emailInput);

            // Success
            this.showMessage(
                'If an account exists with that email, a password reset link has been sent. Please check your inbox (and spam folder).',
                'success'
            );

            // Disable form
            submitButton.disabled = true;
            submitButton.style.opacity = '0.6';
            document.getElementById('email').disabled = true;

        } catch (error) {
            // Error - but don't reveal if email exists or not (security)
            console.error('[ForgotPasswordController] Error:', error);
            this.showMessage(
                'If an account exists with that email, a password reset link has been sent. Please check your inbox (and spam folder).',
                'success'
            );

            // Still disable form to prevent spam
            submitButton.disabled = true;
            submitButton.style.opacity = '0.6';
            document.getElementById('email').disabled = true;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('formMessage');
        const colors = {
            success: '#16a34a',
            error: '#dc2626',
            info: '#0284c7',
            warning: '#ca8a04'
        };

        messageElement.style.color = colors[type] || colors.info;
        messageElement.textContent = message;
        messageElement.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ForgotPasswordController();
});