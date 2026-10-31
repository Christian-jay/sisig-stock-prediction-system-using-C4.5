import AuthService from '../services/AuthService.js';

/**
 * ResetPasswordController
 * Handles the password reset flow - validates token and sets new password
 */
export default class ResetPasswordController {
    constructor() {
        this.authService = new AuthService();
        this.resetToken = null;
        this.initTokenFromUrl();
        this.initEventListeners();
    }

    /**
     * Extract reset token from URL query parameters
     */
    initTokenFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        this.resetToken = urlParams.get('token') || urlParams.get('reset_token');
        this.resetUid = urlParams.get('uid');

        if (!this.resetToken) {
            // Try to get from fragment (some implementations use #token=xxx)
            const fragment = window.location.hash.substring(1);
            const fragmentParams = new URLSearchParams(fragment);
            this.resetToken = fragmentParams.get('token') || fragmentParams.get('reset_token');
            this.resetUid = fragmentParams.get('uid');
        }

        if (!this.resetToken) {
            console.warn('[ResetPasswordController] No reset token found in URL');
            this.showMessage('Invalid or missing reset token. Please request a new password reset link.', 'error');
            this.disableForm();
        }
    }

    initEventListeners() {
        const form = document.getElementById('resetPasswordForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleResetPassword(e));
        }

        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // Real-time password strength checking
        const newPasswordInput = document.getElementById('newPassword');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', () => this.checkPasswordStrength());
            newPasswordInput.addEventListener('input', () => this.checkPasswordMatch());
        }

        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.checkPasswordMatch());
        }
    }

    togglePasswordVisibility(event) {
        const button = event.currentTarget;
        const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
        const eyeOpen = button.querySelector('.eye-open');
        const eyeClosed = button.querySelector('.eye-closed');

        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    }

    checkPasswordStrength() {
        const password = document.getElementById('newPassword').value;
        const strengthContainer = document.getElementById('passwordStrength');
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');

        if (!password) {
            strengthContainer.style.display = 'none';
            return;
        }

        strengthContainer.style.display = 'block';

        // Calculate strength score (0-4)
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        if (checks.length) score++;
        if (checks.lowercase) score++;
        if (checks.uppercase) score++;
        if (checks.number) score++;
        if (checks.special) score++;

        const maxScore = 5;
        const percentage = (score / maxScore) * 100;

        // Update strength bar
        strengthFill.style.width = `${percentage}%`;

        // Color based on score
        if (score <= 2) {
            strengthFill.style.backgroundColor = '#dc2626';
            strengthText.textContent = 'Weak password';
            strengthText.style.color = '#dc2626';
        } else if (score <= 3) {
            strengthFill.style.backgroundColor = '#ca8a04';
            strengthText.textContent = 'Fair password';
            strengthText.style.color = '#ca8a04';
        } else if (score <= 4) {
            strengthFill.style.backgroundColor = '#0284c7';
            strengthText.textContent = 'Good password';
            strengthText.style.color = '#0284c7';
        } else {
            strengthFill.style.backgroundColor = '#16a34a';
            strengthText.textContent = 'Strong password';
            strengthText.style.color = '#16a34a';
        }
    }

    checkPasswordMatch() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const hintElement = document.getElementById('passwordMatchHint');

        if (!confirmPassword) {
            hintElement.style.display = 'none';
            return;
        }

        hintElement.style.display = 'block';

        if (newPassword === confirmPassword) {
            hintElement.textContent = '✓ Passwords match';
            hintElement.style.color = '#16a34a';
        } else {
            hintElement.textContent = '✗ Passwords do not match';
            hintElement.style.color = '#dc2626';
        }
    }

    async handleResetPassword(event) {
        event.preventDefault();

        // Check if we have a token
        if (!this.resetToken) {
            this.showMessage('Invalid or missing reset token. Please request a new password reset link.', 'error');
            return;
        }

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const messageElement = document.getElementById('formMessage');
        const submitButton = document.getElementById('submitButton');
        const buttonText = document.getElementById('buttonText');

        // Validation
        if (!newPassword || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showMessage('Password must be at least 8 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        // UI Loading State
        submitButton.disabled = true;
        buttonText.textContent = "Resetting...";
        this.showMessage('Resetting your password...', 'info');

        try {
            const response = await this.authService.resetPassword(this.resetToken, newPassword, this.resetUid);

            // Success
            this.showMessage(
                'Your password has been reset successfully! Redirecting to login...',
                'success'
            );

            // Disable form
            this.disableForm();

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('[ResetPasswordController] Error:', error);

            let errorMessage = 'Failed to reset password. The link may have expired or already been used.';
            if (error.message) {
                errorMessage = error.message;
            }

            this.showMessage(errorMessage, 'error');

            submitButton.disabled = false;
            buttonText.textContent = "Reset Password";
        }
    }

    disableForm() {
        const form = document.getElementById('resetPasswordForm');
        if (form) {
            form.querySelectorAll('input, button').forEach(el => {
                el.disabled = true;
            });
        }

        const submitButton = document.getElementById('submitButton');
        if (submitButton) {
            submitButton.style.opacity = '0.6';
        }
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
    new ResetPasswordController();
});