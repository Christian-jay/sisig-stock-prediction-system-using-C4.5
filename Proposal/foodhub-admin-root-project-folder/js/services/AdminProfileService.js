import {
    AdminProfileDataModel,
    AdminProfileModel
} from '../models/AdminProfileModel.js';


export class AdminProfileService {

    /* =====================================================
       GET ADMIN PROFILE
       ===================================================== */

    getAdminProfileData() {

        const profile = {

            fullName: 'Juan Dela Cruz',

            role: 'Administrator',

            email: 'juan.delacruz@foodhub.com'

        };

        return new AdminProfileDataModel({
            profile: profile
        });

    }


    /* =====================================================
       UPDATE ADMIN PROFILE
       ===================================================== */

    updateProfile(updatedProfile) {

        console.warn(
            'Static mode: Administrator profile updated in UI only.'
        );

        return new AdminProfileModel(updatedProfile);

    }


    /* =====================================================
       UPDATE PASSWORD
       ===================================================== */

    updatePassword(currentPassword, newPassword) {

        console.warn(
            'Static mode: Administrator password update simulated.'
        );

        return {
            success: true,
            message: 'Administrator password updated successfully.'
        };

    }

}