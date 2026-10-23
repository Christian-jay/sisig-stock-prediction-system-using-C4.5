export function loadSidebarNav(customTitle = '') {
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

    const pageConfig = {
        'dashboard.html': { title: 'Dashboard Overview' },
        'orders.html': { title: 'Orders Management' },
        'todays_orders.html': { title: "Today's Orders" },
        'payment.html': { title: 'Orders / Payment' },
        'inventory.html': { title: 'Inventory & Stock Control' },
        'inventory_prediction.html': { title: 'Predictive Stock Alert' },
        'payments.html': { title: 'Daily Transactions' },
        'expenses.html': { title: 'Daily Expenses and Costs Management' },
        'settings.html': { title: 'Staff Settings' },
        'staff_profile.html': { title: 'Staff Profile' }
    };

    const currentPageInfo = pageConfig[currentPath] || { title: 'Staff Dashboard' };
    const finalTitle = customTitle || currentPageInfo.title;

    const pageHeaderTitle = document.getElementById('page-header-title');
    if (pageHeaderTitle) {
        pageHeaderTitle.textContent = finalTitle;
    }

    const isOrdersRoute = ['orders.html', 'payment.html', 'todays_orders.html'].includes(currentPath);

    // 1. Suriin kung ang kasalukuyang pahina ay nasa inventory routes para bumukas ang dropdown nito
    const isInventoryRoute = ['inventory.html', 'inventory_prediction.html'].includes(currentPath);

    const navHTML = `
        <!-- SIDEBAR NAVIGATION -->
        <aside class="sidebar">
            <div class="sidebar-brand">
                <svg class="brand-logo-icon" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                        d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                    <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
                <span>FOODHUB</span>
            </div>

            <nav class="sidebar-nav">
                <!-- Dashboard -->
                <a href="dashboard.html" class="nav-item ${currentPath === 'dashboard.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                    </svg>
                    Dashboard
                </a>

                <!-- Orders Dropdown Group -->
                <div class="nav-group ${isOrdersRoute ? 'open' : ''}">
                    <div class="nav-item dropdown-btn ${isOrdersRoute ? 'active' : ''}" id="ordersDropdownBtn">
                        <div class="nav-item-content">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>Orders</span>
                        </div>
                        <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div class="sub-nav-container">
                        <a href="orders.html" class="sub-nav-item ${currentPath === 'orders.html' || currentPath === 'payment.html' ? 'active-sub' : ''}">
                            Order and Pay
                        </a>
                        <a href="todays_orders.html" class="sub-nav-item ${currentPath === 'todays_orders.html' ? 'active-sub' : ''}">
                            Today's Orders
                        </a>
                    </div>
                </div>

                <!-- 2. Inventory Dropdown Group (Nilagyan ng Sub-menu para sa C4.5) -->
                <div class="nav-group ${isInventoryRoute ? 'open' : ''}">
                    <div class="nav-item dropdown-btn ${isInventoryRoute ? 'active' : ''}" id="inventoryDropdownBtn">
                        <div class="nav-item-content">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                            <span>Inventory</span>
                        </div>
                        <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div class="sub-nav-container">
                        <a href="inventory.html" class="sub-nav-item ${currentPath === 'inventory.html' ? 'active-sub' : ''}">
                            Stock Control
                        </a>
                        <a href="inventory_prediction.html" class="sub-nav-item ${currentPath === 'inventory_prediction.html' ? 'active-sub' : ''}">
                            C4.5 Predictive Alert
                        </a>
                    </div>
                </div>

                <!-- Payments -->
                <a href="payments.html" class="nav-item ${currentPath === 'payments.html' ? 'active' : ''}">
                     <svg width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                        <path d="M6 15h4" />
                    </svg>
                    Payments
                </a>

                <!-- Expenses -->
                <a href="expenses.html" class="nav-item ${currentPath === 'expenses.html' ? 'active' : ''}">
                     <svg width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2z" />
                        <path d="M8 9h8M8 13h6" />
                    </svg>
                    Expenses
                </a>

                <!-- Settings -->
                <a href="settings.html" class="nav-item ${currentPath === 'settings.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                </a>
            </nav>

            <div class="sidebar-footer">
                <a href="staff_profile.html" class="admin-profile-link ${currentPath === 'staff_profile.html' ? 'active-profile' : ''}">
                    <div class="admin-profile-mini">
                        <div class="admin-avatar">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="admin-info">
                            <span class="admin-name" style="color: #ffffff;">Staff</span>
                            <span class="admin-role" style="color: #94a3b8;">Staff Member</span>
                        </div>
                    </div>
                </a>
            </div>
        </aside>
    `;

    const container = document.getElementById('sidebar-nav-container');
    if (container) {
        container.innerHTML = navHTML;

        // 3. I-bind ang click event para sa Orders dropdown
        const ordersDropdownBtn = document.getElementById('ordersDropdownBtn');
        if (ordersDropdownBtn) {
            ordersDropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const navGroup = ordersDropdownBtn.closest('.nav-group');
                navGroup.classList.toggle('open');
            });
        }

        // 4. I-bind ang click event para sa bagong Inventory dropdown
        const inventoryDropdownBtn = document.getElementById('inventoryDropdownBtn');
        if (inventoryDropdownBtn) {
            inventoryDropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const navGroup = inventoryDropdownBtn.closest('.nav-group');
                navGroup.classList.toggle('open');
            });
        }
    }
}