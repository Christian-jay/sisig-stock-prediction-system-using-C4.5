import { AdminProfile } from '../models/AdminProfileModel.js';

export class AdminProfileService {
    async getProfile() {
        return new AdminProfile("Admin", "admin@foodhub.com", "Administrator");
    }

    async updateProfile(profileData) {
        localStorage.setItem('foodhub_admin_profile', JSON.stringify(profileData));
        return { success: true, message: "Admin profile updated successfully!" };
    }
}