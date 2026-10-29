import User from '../models/User.js';
import AuthService from '../services/AuthService.js';

/**
 * LoginController
 * Connects UI events with the AuthService business logic.
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
        messageElement.textContent = "Verifying admin credentials...";

        try {
            const response = await this.authService.authenticate(user);

            // Success Handling
            messageElement.style.color = "#16a34a"; // Green
            messageElement.textContent = response.message;

            // Redirect to inventory page on successful login
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);

        } catch (error) {
            // Error Handling
            messageElement.style.color = "#dc2626"; // Red
            messageElement.textContent = error.message;
        } finally {
            submitButton.disabled = false;
            buttonText.textContent = "Sign In to Dashboard";
        }
    }
}