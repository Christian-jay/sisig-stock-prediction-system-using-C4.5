/**
 * Auth Wait Utility
 * Provides a promise that resolves when window.currentUser is available.
 * This handles the race condition between AuthGuard (module script) and
 * controllers (DOMContentLoaded).
 * Uses polling approach - no HTML modifications needed.
 */

/**
 * Wait for currentUser to be available, with optional timeout
 * @param {number} timeoutMs - Optional timeout in milliseconds (default: 5000)
 * @returns {Promise<Object|null>} userData or null if timeout
 */
export async function waitForCurrentUser(timeoutMs = 5000) {
    // If already available, return immediately
    if (window.currentUser) {
        return window.currentUser;
    }

    return new Promise((resolve) => {
        const startTime = Date.now();

        const check = setInterval(() => {
            if (window.currentUser) {
                clearInterval(check);
                resolve(window.currentUser);
            } else if (Date.now() - startTime > timeoutMs) {
                clearInterval(check);
                console.warn('[authWait] Timeout waiting for currentUser');
                resolve(null);
            }
        }, 50);
    });
}

/**
 * Synchronous check - returns currentUser if available, undefined otherwise
 * Use this in synchronous contexts where you can't await
 */
export function getCurrentUserSync() {
    return window.currentUser;
}