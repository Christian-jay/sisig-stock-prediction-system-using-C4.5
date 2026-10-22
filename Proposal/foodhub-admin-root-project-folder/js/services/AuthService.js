/**
 * AuthService
 * Handles business rules and authentication data requests.
 */
export default class AuthService {
    async authenticate(userModel) {
        // Static mock behavior for now (future-ready for Django/Flask API connection)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (userModel.email === "admin@foodhub.com" && userModel.password === "admin123") {
                    resolve({
                        success: true,
                        message: "Login successful! Redirecting...",
                        token: "mock-jwt-token-foodhub-admin"
                    });
                } else {
                    reject({
                        success: false,
                        message: "Invalid email or password (Try: admin@foodhub.com / admin123)"
                    });
                }
            }, 800); // Simulated network delay
        });
    }
}