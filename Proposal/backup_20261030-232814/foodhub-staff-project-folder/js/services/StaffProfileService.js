import { StaffProfileModel, UserProfileModel } from '../models/StaffProfileModel.js';

export class StaffProfileService {
    getStaffProfileData() {
        const rawProfile = {
            id: 'STF-102',
            fullName: 'Juan Dela Cruz',
            role: 'Staff Member',
            email: 'juan.delacruz@foodhub.com'
        };

        return new StaffProfileModel({
            profile: rawProfile
        });
    }

    updateProfile(updatedProfile) {
        console.warn("Static mode: Staff profile updated in UI. Modify StaffProfileService.js for permanent changes.");
        return new UserProfileModel(updatedProfile);
    }

    updatePassword(currentPass, newPass) {
        console.warn("Static mode: Password update simulated.");
        return { success: true, message: "Password updated successfully." };
    }
}