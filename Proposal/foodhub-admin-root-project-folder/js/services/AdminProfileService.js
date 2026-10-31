import {
    AdminProfileDataModel,
    AdminProfileModel
} from '../models/AdminProfileModel.js';
import { apiGet, apiPatch, apiPost } from '../utils/api.js';

/**
 * AdminProfileService
 * Handles admin profile API communication with Django backend.
 */
export class AdminProfileService {

    /**
     * Map backend user data to frontend profile format
     * @param {Object} userData - User data from Django API
     * @returns {Object} Mapped profile data
     */
    mapUserDataToProfile(userData) {
        return {
            fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
            role: userData.role_display || userData.role,
            email: userData.email
        };
    }

    /**
     * Map frontend profile data to backend format
     * @param {Object} profile - Frontend profile data
     * @returns {Object} Backend compatible data
     */
    mapProfileToUserData(profile) {
        // Split full name into first and last name
        const nameParts = profile.fullName.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        return {
            first_name,
            last_name,
            email: profile.email
        };
    }

    /* =====================================================
       GET ADMIN PROFILE
       ===================================================== */

    async getAdminProfileData() {
        try {
            const userData = await apiGet('/accounts/users/me/');
            const profile = this.mapUserDataToProfile(userData);

            return new AdminProfileDataModel({
                profile: profile
            });
        } catch (error) {
            console.error('[AdminProfileService] Failed to fetch profile:', error);
            throw new Error('Failed to load administrator profile. Please try again.');
        }
    }


    /* =====================================================
       UPDATE ADMIN PROFILE
       ===================================================== */

    async updateProfile(updatedProfile) {
        try {
            const userData = this.mapProfileToUserData(updatedProfile);
            const response = await apiPatch('/accounts/users/me/', userData);

            // Return updated profile mapped back to frontend format
            const profile = this.mapUserDataToProfile(response);
            return new AdminProfileModel(profile);
        } catch (error) {
            console.error('[AdminProfileService] Failed to update profile:', error);
            throw new Error(error.message || 'Failed to update administrator profile. Please try again.');
        }
    }


    /* =====================================================
       UPDATE PASSWORD
       ===================================================== */

    async updatePassword(currentPassword, newPassword) {
        try {
            const response = await apiPost('/accounts/users/change_password/', {
                old_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: newPassword
            });

            return {
                success: true,
                message: response.detail || 'Administrator password updated successfully.'
            };
        } catch (error) {
            console.error('[AdminProfileService] Failed to update password:', error);
            throw new Error(error.message || 'Failed to change password. Please try again.');
        }
    }

}