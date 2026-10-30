import User from '../models/User.js';
import AuthService from '../services/AuthService.js';

/**
 * LoginController
 * Connects UI events with the AuthService business logic.
 * Handles role-based redirection after successful authentication.
 */
export default class LoginController {
    constructor() {
        this.authService = new AuthService();
        this.initEventListeners();
    }

    initEventListeners() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Password visibility toggle
        const togglePasswordBtn = document.querySelector('.toggle-password');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const eyeOpen = document.querySelector('.eye-open');
        const eyeClosed = document.querySelector('.eye-closed');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            passwordInput.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    }

    async handleLogin(event) {
        event.preventDefault();

        const emailInput = document.getElementById('email').value.trim();
        const passwordInput = document.getElementById('password').value;
        const rememberMeInput = document.getElementById('rememberMe').checked;
        const messageElement = document.getElementById('loginMessage');
        const submitButton = document.getElementById('loginButton');
        const buttonText = document.getElementById('buttonText');

        // Create Entity Model
        const user = new User(emailInput, passwordInput, rememberMeInput);

        // UI Loading State
        submitButton.disabled = true;
        buttonText.textContent = "Authenticating...";
        messageElement.style.color = "#0284c7";
        messageElement.textContent = "Verifying credentials...";

        try {
            const response = await this.authService.authenticate(user);

            // Success Handling
            messageElement.style.color = "#16a34a"; // Green
            messageElement.textContent = response.message;

            // Redirect based on user role
            const redirectUrl = this.getRedirectUrl(response.user);

            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);

        } catch (error) {
            // Error Handling
            messageElement.style.color = "#dc2626"; // Red
            messageElement.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            buttonText.textContent = "Sign In";
        }
    }

    /**
     * Determine redirect URL based on user role
     * @param {Object|null} user - User object from API response
     * @returns {string} Redirect URL
     */
    getRedirectUrl(user) {
        // Default fallback
        if (!user || !user.role) {
            return "dashboard.html";
        }

        // Role-based redirect
        // Both admin and staff projects have their own dashboard.html
        // The login page is shared, so we need to determine which project to redirect to
        const isAdmin = user.role === 'ADMIN';

        if (isAdmin) {
            // Admin: redirect to admin dashboard (same folder as login)
            return "dashboard.html";
        } else {
            // Staff: redirect to staff dashboard (in staff project folder)
            return "../foodhub-staff-project-folder/dashboard.html";
        }
    }
}

// Initialize LoginController
new LoginController();