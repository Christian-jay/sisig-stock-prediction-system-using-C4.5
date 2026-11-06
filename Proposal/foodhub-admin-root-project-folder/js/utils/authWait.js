/**
 * Auth Wait Utility - Polls for window.currentUser to be set by AuthGuard
 * Useful for controllers that need user data before rendering navigation
 */

export async function waitForCurrentUser(timeoutMs = 5000) {
    const startTime = Date.now();
    const pollInterval = 50;

    while (Date.now() - startTime < timeoutMs) {
        if (window.currentUser) {
            return window.currentUser;
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout - return whatever we have (may be null)
    console.warn('[authWait] Timeout waiting for currentUser, proceeding with:', window.currentUser);
    return window.currentUser;
}