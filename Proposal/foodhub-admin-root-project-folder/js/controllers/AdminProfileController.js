import { AdminProfileService } from '../services/AdminProfileService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class AdminProfileController {

    constructor() {
        this.adminProfileService = new AdminProfileService();
        this.initLayout();
        this.loadProfileView();
    }

    /* =====================================================
       INITIALIZE LAYOUT
       ===================================================== */

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    /* =====================================================
       LOAD ADMIN PROFILE
       ===================================================== */

    async loadProfileView() {
        try {
            const data = await this.adminProfileService.getAdminProfileData();
            const profile = data.profile;

            // Profile card
            document.getElementById('profileHeaderName').textContent =
                profile.fullName;

            document.getElementById('displayRole').textContent =
                profile.role;

            // Form fields
            document.getElementById('inputFullName').value =
                profile.fullName;

            document.getElementById('inputEmail').value =
                profile.email;

            this.attachEventListeners();
        } catch (error) {
            console.error('[AdminProfileController] Failed to load profile:', error);
            alert('Failed to load profile: ' + error.message);
        }
    }

    /* =====================================================
       EVENT LISTENERS
       ===================================================== */

    attachEventListeners() {

        /* -----------------------------------------------
           UPDATE ADMIN PROFILE
        ------------------------------------------------ */

        const profileForm =
            document.getElementById('adminProfileForm');

        if (profileForm) {

            profileForm.addEventListener('submit', async (event) => {

                event.preventDefault();

                const submitBtn = profileForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';

                try {
                    const updatedProfile = {

                        fullName:
                            document.getElementById('inputFullName').value.trim(),

                        email:
                            document.getElementById('inputEmail').value.trim()

                    };

                    const result =
                        await this.adminProfileService.updateProfile(
                            updatedProfile
                        );

                    document.getElementById('profileHeaderName').textContent =
                        result.fullName;

                    alert('Administrator profile updated successfully!');

                } catch (error) {
                    alert('Error: ' + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }

            });

        }


        /* -----------------------------------------------
           CHANGE ADMIN PASSWORD
        ------------------------------------------------ */

        const securityForm =
            document.getElementById('adminSecurityForm');

        if (securityForm) {

            securityForm.addEventListener('submit', async (event) => {

                event.preventDefault();

                const currentPassword =
                    document.getElementById(
                        'inputCurrentPassword'
                    ).value;

                const newPassword =
                    document.getElementById(
                        'inputNewPassword'
                    ).value;

                const confirmPassword =
                    document.getElementById(
                        'inputConfirmPassword'
                    ).value;


                if (newPassword !== confirmPassword) {

                    alert(
                        'New password and confirm password do not match.'
                    );

                    return;
                }

                const submitBtn = securityForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Changing...';

                try {
                    const result =
                        await this.adminProfileService.updatePassword(
                            currentPassword,
                            newPassword
                        );

                    alert(result.message);
                    securityForm.reset();

                } catch (error) {
                    alert('Error: ' + error.message);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }

            });

        }

    }

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    new AdminProfileController();

});