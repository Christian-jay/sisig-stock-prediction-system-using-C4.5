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

    /**
     * Show/hide loading state on forms
     */
    setFormLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        if (!form) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Saving...' : submitBtn.dataset.originalText || 'Save';
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    }

    async loadProfileView() {
        // Show loading state in profile header
        const profileNameEl = document.getElementById('profileHeaderName');
        const profileRoleEl = document.getElementById('displayRole');

        if (profileNameEl) profileNameEl.textContent = 'Loading...';
        if (profileRoleEl) profileRoleEl.textContent = 'Loading...';

        // Clear form inputs while loading
        const fullNameInput = document.getElementById('inputFullName');
        const emailInput = document.getElementById('inputEmail');
        if (fullNameInput) fullNameInput.value = '';
        if (emailInput) emailInput.value = '';

        try {
            const data = await this.staffProfileService.getStaffProfileData();

            // Populate Left Profile Box Header
            if (profileNameEl) profileNameEl.textContent = data.profile.fullName;
            if (profileRoleEl) profileRoleEl.textContent = data.profile.role;

            // Populate Profile Edit Form Inputs
            if (fullNameInput) fullNameInput.value = data.profile.fullName;
            if (emailInput) emailInput.value = data.profile.email;

            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to load profile:', error);

            if (profileNameEl) profileNameEl.textContent = 'Failed to load';
            if (profileRoleEl) profileRoleEl.textContent = 'Failed to load';

            this.showToast(`Failed to load profile: ${error.message}`, 'error');
        }
    }

    attachEventListeners() {
        // Save Personal Info
        const profileForm = document.getElementById('staffProfileForm');
        if (profileForm) {
            // Store original button text
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
            }

            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.setFormLoading('staffProfileForm', true);

                const updated = {
                    fullName: document.getElementById('inputFullName').value.trim(),
                    email: document.getElementById('inputEmail').value.trim()
                };

                // Basic validation
                if (!updated.fullName) {
                    this.showToast('Full name is required.', 'error');
                    this.setFormLoading('staffProfileForm', false);
                    return;
                }
                if (!updated.email) {
                    this.showToast('Email address is required.', 'error');
                    this.setFormLoading('staffProfileForm', false);
                    return;
                }
                if (!updated.email.includes('@')) {
                    this.showToast('Please enter a valid email address.', 'error');
                    this.setFormLoading('staffProfileForm', false);
                    return;
                }

                try {
                    const result = await this.staffProfileService.updateProfile(updated);

                    // Update header name
                    document.getElementById('profileHeaderName').textContent = result.profile.fullName;

                    this.showToast('Profile details updated successfully!', 'success');
                    this.setFormLoading('staffProfileForm', false);
                } catch (error) {
                    console.error('Profile update failed:', error);
                    this.showToast(error.message, 'error');
                    this.setFormLoading('staffProfileForm', false);
                }
            });
        }

        // Change Password Form
        const passwordForm = document.getElementById('securityForm');
        if (passwordForm) {
            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.dataset.originalText = submitBtn.textContent;
            }

            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.setFormLoading('securityForm', true);

                const currPass = document.getElementById('inputCurrentPassword').value;
                const newPass = document.getElementById('inputNewPassword').value;
                const confirmPass = document.getElementById('inputConfirmPassword').value;

                // Validation
                if (!currPass) {
                    this.showToast('Current password is required.', 'error');
                    this.setFormLoading('securityForm', false);
                    return;
                }
                if (!newPass) {
                    this.showToast('New password is required.', 'error');
                    this.setFormLoading('securityForm', false);
                    return;
                }
                if (newPass !== confirmPass) {
                    this.showToast('New password and confirm password do not match.', 'error');
                    this.setFormLoading('securityForm', false);
                    return;
                }

                try {
                    const res = await this.staffProfileService.updatePassword(currPass, newPass);

                    this.showToast(res.message, 'success');
                    this.setFormLoading('securityForm', false);
                    passwordForm.reset();
                } catch (error) {
                    console.error('Password change failed:', error);
                    this.showToast(error.message, 'error');
                    this.setFormLoading('securityForm', false);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StaffProfileController();
});