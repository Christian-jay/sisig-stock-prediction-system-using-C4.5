import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { AdminProfileService } from '../services/AdminProfileService.js';
import { AdminProfile } from '../models/AdminProfileModel.js';

class AdminProfileController {
    constructor() {
        this.profileService = new AdminProfileService();
        this.initProfile();
    }

    async initProfile() {
        try {
            const profile = await this.profileService.getProfile();
            document.getElementById('adminName').value = profile.name;
            document.getElementById('adminEmail').value = profile.email;

            this.initEventListeners();
        } catch (error) {
            console.error("Failed to load admin profile:", error);
        }
    }

    initEventListeners() {
        const form = document.getElementById('adminProfileForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedProfile = new AdminProfile(
                document.getElementById('adminName').value,
                document.getElementById('adminEmail').value,
                "Administrator"
            );

            const result = await this.profileService.updateProfile(updatedProfile);
            if (result.success) {
                alert(result.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
    new AdminProfileController();
});