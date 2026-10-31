import { apiGet, apiPatch, apiPost } from '../utils/api.js';

export class StaffProfileService {
    /**
     * Get the current authenticated user's profile from the backend.
     * @returns {Promise<Object>} User profile data with fullName, email, role
     */
    async getStaffProfileData() {
        const response = await apiGet('/accounts/users/me/');

        // Backend returns: { id, username, email, first_name, last_name, role, role_display, ... }
        // Frontend expects: { profile: { fullName, email, role } }
        const fullName = `${response.first_name || ''} ${response.last_name || ''}`.trim()
            || response.username
            || 'Staff Member';

        return {
            profile: {
                id: response.id,
                fullName: fullName,
                email: response.email,
                role: response.role_display || response.role
            }
        };
    }

    /**
     * Update the current user's personal details (name and email).
     * @param {Object} updatedProfile - { fullName, email }
     * @returns {Promise<Object>} Updated profile data
     */
    async updateProfile(updatedProfile) {
        // Split fullName into first_name and last_name
        const nameParts = updatedProfile.fullName.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        const response = await apiPatch('/accounts/users/me/', {
            first_name: first_name,
            last_name: last_name,
            email: updatedProfile.email
        });

        const fullName = `${response.first_name || ''} ${response.last_name || ''}`.trim()
            || response.username
            || 'Staff Member';

        return {
            profile: {
                id: response.id,
                fullName: fullName,
                email: response.email,
                role: response.role_display || response.role
            }
        };
    }

    /**
     * Change the current user's password.
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Success message
     */
    async updatePassword(currentPassword, newPassword) {
        const response = await apiPost('/accounts/users/change_password/', {
            old_password: currentPassword,
            new_password: newPassword,
            new_password_confirm: newPassword
        });

        return {
            success: true,
            message: response.detail || 'Password changed successfully.'
        };
    }
}