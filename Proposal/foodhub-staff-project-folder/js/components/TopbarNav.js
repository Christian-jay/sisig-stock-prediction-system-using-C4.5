export function loadTopNavbar() {
    const topNavbarHTML = `
    <header class="top-navbar">
        <div class="navbar-left">
            <!-- Maaari kang maglagay dito ng page title o mobile toggle button kung kinakailangan -->
        </div>
        <div class="navbar-right">
            <div class="search-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Search...">
            </div>
            <!-- Notification Bell SVG -->
            <button class="icon-btn" title="Notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
            </button>
            <div class="profile-dropdown">
                <span class="avatar-circle">
                    <!-- Vectorized SVG User Profile Icon -->
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </span>
                <span class="profile-name">Staff ▼</span>
            </div>
        </div>
    </header>
    `;

    // Hanapin ang container sa HTML kung saan ito i-i-inject
    const container = document.getElementById('top-navbar-container');
    if (container) {
        container.innerHTML = topNavbarHTML;
    }
}