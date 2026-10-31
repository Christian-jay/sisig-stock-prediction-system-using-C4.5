import { StaffProfileService } from '../services/StaffProfileService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

export class StaffProfileController {
    constructor() {
        this.staffProfileService = new StaffProfileService();
        this.initLayout();
        this.loadProfileView();
    }

    initLayout() {
        loadSidebarNav();
        loadTopNavbar();
    }

    loadProfileView() {
        const data = this.staffProfileService.getStaffProfileData();

        // Populate Left Profile Box Header
        document.getElementById('profileHeaderName').textContent = data.profile.fullName;
        document.getElementById('displayRole').textContent = data.profile.role;

        // Populate Profile Edit Form Inputs
        document.getElementById('inputFullName').value = data.profile.fullName;
        document.getElementById('inputEmail').value = data.profile.email;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Save Personal Info
        const profileForm = document.getElementById('staffProfileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const updated = {
                    fullName: document.getElementById('inputFullName').value,
                    email: document.getElementById('inputEmail').value
                };
                this.staffProfileService.updateProfile(updated);
                document.getElementById('profileHeaderName').textContent = updated.fullName;
                alert('Profile details updated successfully!');
            });
        }

        // Change Password Form
        const passwordForm = document.getElementById('securityForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const currPass = document.getElementById('inputCurrentPassword').value;
                const newPass = document.getElementById('inputNewPassword').value;
                const confirmPass = document.getElementById('inputConfirmPassword').value;

                if (newPass !== confirmPass) {
                    alert('New password and confirm password do not match.');
                    return;
                }

                const res = this.staffProfileService.updatePassword(currPass, newPass);
                alert(res.message);
                passwordForm.reset();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StaffProfileController();
});