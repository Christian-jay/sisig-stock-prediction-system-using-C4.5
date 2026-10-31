export function loadSidebarNav(customTitle = '') {
    // 1. Kunin ang pangalan ng kasalukuyang html file mula sa URL
    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

    // 2. I-map ang mga default titles para sa bawat pahina
    const pageConfig = {
        'dashboard.html': { title: 'Dashboard Overview' },
        'orders.html': { title: 'Orders Management' },
        'inventory.html': { title: 'Inventory & Stock Control' },
        'sales_report.html': { title: 'Sales Analytics & Reports' },
        'history.html': { title: 'Order History Logs' },
        'settings.html': { title: 'System Settings' },
        'admin_profile.html': { title: 'Admin Profile' }
    };

    // Piliin ang title: gamitin ang customTitle kung binigay, o kunin sa config, o mag-fallback
    const currentPageInfo = pageConfig[currentPath] || { title: 'Admin Dashboard' };
    const finalTitle = customTitle || currentPageInfo.title;

    // 3. I-update ang Page Header Title kung merong element sa HTML
    const pageHeaderTitle = document.getElementById('page-header-title');
    if (pageHeaderTitle) {
        pageHeaderTitle.textContent = finalTitle;
    }

    // 4. I-render ang Navbar Menu na may dynamic active class
    const navHTML = `
        <!-- SIDEBAR NAVIGATION -->
        <aside class="sidebar">
            <div class="sidebar-brand">
                 <img src="./assets/foodhub_logo_no_bg.png" alt="foodhub"
                        loading="lazy" style="max-width: 30%; height: auto; display: block;">
                <span>FOODHUB</span>
            </div>

            <nav class="sidebar-nav">
                <a href="dashboard.html" class="nav-item ${currentPath === 'dashboard.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
                    </svg>
                    Dashboard
                </a>
                <a href="orders.html" class="nav-item ${currentPath === 'orders.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Orders
                </a>
                <a href="inventory.html" class="nav-item ${currentPath === 'inventory.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    Inventory
                </a>
                <a href="sales_report.html" class="nav-item ${currentPath === 'sales_report.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    Sales Report
                </a>
                <a href="history.html" class="nav-item ${currentPath === 'history.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    History
                </a>
                <a href="settings.html" class="nav-item ${currentPath === 'settings.html' ? 'active' : ''}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                </a>
            </nav>

            <div class="sidebar-footer">
                <a href="admin_profile.html" class="admin-profile-link ${currentPath === 'admin_profile.html' ? 'active-profile' : ''}">
                    <div class="admin-profile-mini">
                        <div class="admin-avatar">
                            <!-- SVG User Profile Icon -->
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sidebar-text-muted)" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="admin-info">
                            <span class="admin-name"  style="color: #ffffff;">Admin</span>
                            <span class="admin-role">Administrator</span>
                        </div>
                    </div>
                </a>
            </div>
        </aside>
    `;

    // 5. I-inject sa container ng HTML
    const container = document.getElementById('sidebar-nav-container');
    if (container) {
        container.innerHTML = navHTML;
    }
}