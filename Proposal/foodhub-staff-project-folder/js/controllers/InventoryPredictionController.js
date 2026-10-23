// import InventoryPrediction from '../services/InventoryPredictionService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    loadSidebarNav();
    loadTopNavbar();
});