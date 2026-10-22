// import DashboardService from '../services/PaymentsService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
});