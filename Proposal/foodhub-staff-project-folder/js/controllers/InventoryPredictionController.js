// import InventoryPrediction from '../services/InventoryPredictionService.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { loadSidebarNav } from '../components/SidebarNav.js';
import { waitForCurrentUser } from '../utils/authWait.js';

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const userData = await waitForCurrentUser();
    loadSidebarNav('', userData);
    loadTopNavbar(userData);
});