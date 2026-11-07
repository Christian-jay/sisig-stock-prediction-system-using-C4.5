// InventoryPredictionController - Admin version
// Minimal controller: only loads SidebarNav and TopNavbar
// C4.5 logic will be implemented later (similar to staff side)

import { loadSidebarNav } from '../components/SidebarNav.js';
import { loadTopNavbar } from '../components/TopbarNav.js';
import { waitForCurrentUser } from '../utils/authWait.js';

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    const userData = await waitForCurrentUser();
    if (userData) {
        loadSidebarNav('', userData);
        loadTopNavbar(userData);
    }
});