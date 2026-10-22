/**
 * User Entity
 * Represents the User/Admin data structure for authentication.
 */
export default class User {
    constructor(email, password, rememberMe = false) {
        this.email = email;
        this.password = password;
        this.rememberMe = rememberMe;
    }

    isValidCredentials() {
        // Simple mock validation rules for future functionality setup
        return this.email.length > 0 && this.password.length >= 6;
    }
}