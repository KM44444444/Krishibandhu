// ============================================================
// COMMON — role-based sidebar/topbar rendering + auth guard
// ============================================================

const ROLE_NAV = {
    farmer: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
        ]},
        { section: 'Farm', items: [
            { label: 'Farm Profile', icon: 'fa-user', href: 'farm-profile.html', page: 'farm-profile' },
            { label: 'Land Information', icon: 'fa-map', href: 'land.html', page: 'land' },
        ]},
        { section: 'Soil & Crops', items: [
            { label: 'Soil Request', icon: 'fa-flask', href: 'soil-request.html', page: 'soil-request' },
            { label: 'Soil Report', icon: 'fa-file-lines', href: 'soil-report.html', page: 'soil-report' },
            { label: 'Crop Calendar', icon: 'fa-calendar-days', href: 'crop-calendar.html', page: 'crop-calendar' },
            { label: 'Crop Recommendation', icon: 'fa-seedling', href: 'crop-recommendation.html', page: 'crop-recommendation' },
            { label: 'Fertilizer Recommendation', icon: 'fa-jar', href: 'fertilizer-recommendation.html', page: 'fertilizer-recommendation' },
        ]},
        { section: 'Support', items: [
            { label: 'Expert Chat', icon: 'fa-comments', href: 'expert-chat.html', page: 'expert-chat' },
            { label: 'Consultation', icon: 'fa-user-doctor', href: 'consultation.html', page: 'consultation' },
            { label: 'Video Consultation', icon: 'fa-video', href: 'video-consultation.html', page: 'video-consultation' },
        ]},
        { section: 'Commerce', items: [
            { label: 'Marketplace', icon: 'fa-cart-shopping', href: 'marketplace.html', page: 'marketplace' },
            { label: 'My Orders', icon: 'fa-box', href: 'orders.html', page: 'orders' },
        ]},
        { section: 'More', items: [
            { label: 'Learning Center', icon: 'fa-graduation-cap', href: 'learning.html', page: 'learning' },
            { label: 'Plant Disease AI', icon: 'fa-leaf', href: 'disease-ai.html', page: 'disease-ai', soon: true },
            { label: 'Soil Image AI', icon: 'fa-vial', href: 'soil-ai.html', page: 'soil-ai', soon: true },
            { label: 'Notifications', icon: 'fa-bell', href: 'notifications.html', page: 'notifications' },
            { label: 'Settings', icon: 'fa-gear', href: 'settings.html', page: 'settings' },
        ]},
    ],
    government: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
            { label: 'Soil Requests', icon: 'fa-flask', href: 'soil-requests.html', page: 'soil-requests' },
            { label: 'Soil Testing', icon: 'fa-vial-circle-check', href: 'soil-testing.html', page: 'soil-testing' },
            { label: 'Government Alerts', icon: 'fa-bullhorn', href: 'alerts.html', page: 'alerts' },
        ]},
    ],
    admin: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
            { label: 'User Management', icon: 'fa-users', href: 'users.html', page: 'users' },
            { label: 'Crop Management', icon: 'fa-seedling', href: 'crops.html', page: 'crops' },
            { label: 'Marketplace Oversight', icon: 'fa-store', href: 'marketplace.html', page: 'marketplace' },
            { label: 'Consultations Monitor', icon: 'fa-headset', href: 'consultations.html', page: 'consultations' },
            { label: 'Learning Videos', icon: 'fa-video', href: 'learning-videos.html', page: 'learning-videos' },
        ]},
    ],
    buyer: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
            { label: 'Marketplace', icon: 'fa-cart-shopping', href: 'marketplace.html', page: 'marketplace' },
            { label: 'My Orders', icon: 'fa-box', href: 'orders.html', page: 'orders' },
        ]},
    ],
    seller: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
            { label: 'My Products', icon: 'fa-boxes-stacked', href: 'products.html', page: 'products' },
            { label: 'Add Product', icon: 'fa-plus', href: 'add-product.html', page: 'add-product' },
            { label: 'Orders', icon: 'fa-truck', href: 'orders.html', page: 'orders' },
        ]},
    ],
    expert: [
        { section: null, items: [
            { label: 'Dashboard', icon: 'fa-house', href: 'dashboard.html', page: 'dashboard' },
            { label: 'Consultation Requests', icon: 'fa-inbox', href: 'consultations.html', page: 'consultations' },
            { label: 'Chat', icon: 'fa-comments', href: 'chat.html', page: 'chat' },
            { label: 'Video Consultation', icon: 'fa-video', href: 'video-consultation.html', page: 'video-consultation' },
        ]},
    ],
};

const ROLE_LABELS = {
    farmer: 'Farmer', government: 'Government', admin: 'Admin',
    buyer: 'Buyer', seller: 'Seller', expert: 'Agricultural Expert'
};

function getCurrentUser() {
    const raw = localStorage.getItem('kb_user');
    return raw ? JSON.parse(raw) : null;
}

function requireAuth(allowedRoles) {
    const token = localStorage.getItem('kb_token');
    const user = getCurrentUser();
    const root = getRootPath();
    if (!token || !user) {
        window.location.href = root + 'login.html';
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        window.location.href = root + 'unauthorized.html';
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('kb_token');
    localStorage.removeItem('kb_user');
    window.location.href = getRootPath() + 'login.html';
}

function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return d.toLocaleDateString();
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const NOTIF_ICON = {
    soil_report: { icon: 'fa-flask', bg: '#e8f0fd', color: '#3a7bd5' },
    order: { icon: 'fa-cart-shopping', bg: '#e7f5ec', color: '#2d7a4f' },
    consultation: { icon: 'fa-comments', bg: '#f1ebfe', color: '#8b5cf6' },
    government_alert: { icon: 'fa-bullhorn', bg: '#fdf0e2', color: '#f0983c' },
    default: { icon: 'fa-bell', bg: '#f0f1f0', color: '#6b7a73' }
};

// Renders the sidebar + topbar into #app-shell, given the role and active page key.
// pageTitleEl content is left to each page's own script.
function renderLayout(role, activePage, user) {
    const root = getRootPath();
    const nav = ROLE_NAV[role] || [];

    const navHtml = nav.map(group => `
        ${group.section ? `<div class="sidebar-section-label">${group.section}</div>` : ''}
        ${group.items.map(item => `
            <a href="${item.href}" class="${item.page === activePage ? 'active' : ''}">
                <span class="icon"><i class="fa-solid ${item.icon}"></i></span>
                <span>${item.label}</span>
                ${item.soon ? '<span class="soon-tag">SOON</span>' : ''}
                ${item.page === 'notifications' ? '<span class="badge-count" id="sidebarNotifBadge" style="display:none"></span>' : ''}
            </a>
        `).join('')}
    `).join('');

    const shell = document.getElementById('app-shell');
    shell.innerHTML = `
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-logo">
                <div class="logo-icon">🌾</div>
                <div class="logo-text">
                    <h1>KrishiBandhu</h1>
                    <p>Grow Better, Live Better</p>
                </div>
            </div>
            <nav class="sidebar-nav">${navHtml}</nav>
            <div style="padding:12px;border-top:1px solid rgba(255,255,255,0.08)">
                <a href="#" id="logoutBtn" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;color:rgba(255,255,255,0.72)">
                    <span class="icon"><i class="fa-solid fa-arrow-right-from-bracket"></i></span>
                    <span>Logout</span>
                </a>
            </div>
        </aside>
        <div class="main-content">
            <header class="topbar">
                <div class="menu-toggle" id="menuToggle"><i class="fa-solid fa-bars"></i></div>
                <div></div>
                <div class="topbar-right">
                    <div class="bell-wrap" id="bellWrap">
                        <i class="fa-regular fa-bell"></i>
                        <span class="badge-count" id="topbarNotifBadge" style="display:none">0</span>
                        <div class="notif-dropdown" id="notifDropdown">
                            <div class="notif-dropdown-header">
                                <span>Notifications</span>
                                <a href="${role}/notifications.html" id="viewAllNotif">View All</a>
                            </div>
                            <div id="notifList"><div class="notif-empty">Loading...</div></div>
                        </div>
                    </div>
                    <div class="topbar-user">
                        <div class="avatar-circle">${initials(user.name)}</div>
                        <div class="user-meta">
                            <h4>${user.name}</h4>
                            <p>${ROLE_LABELS[user.role] || user.role}</p>
                        </div>
                    </div>
                </div>
            </header>
            <main class="page-content" id="pageContent"></main>
        </div>
    `;

    // Fix "view all" link — only farmer has a notifications page
    const viewAllLink = document.getElementById('viewAllNotif');
    if (role === 'farmer') {
        viewAllLink.href = 'notifications.html';
    } else {
        viewAllLink.style.display = 'none';
    }

    document.getElementById('logoutBtn').addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('bellWrap').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notifDropdown').classList.toggle('open');
    });
    document.addEventListener('click', () => document.getElementById('notifDropdown').classList.remove('open'));

    loadNotifDropdown();
}

async function loadNotifDropdown() {
    try {
        const data = await api.get('/notifications');
        const unread = data.unreadCount || 0;
        const badges = document.querySelectorAll('#topbarNotifBadge, #sidebarNotifBadge');
        badges.forEach(b => {
            if (unread > 0) { b.style.display = ''; b.textContent = unread; }
            else { b.style.display = 'none'; }
        });

        const list = document.getElementById('notifList');
        const recent = data.notifications.slice(0, 5);
        if (recent.length === 0) {
            list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
            return;
        }
        list.innerHTML = recent.map(n => {
            const meta = NOTIF_ICON[n.type] || NOTIF_ICON.default;
            return `
                <div class="notif-item">
                    <div class="notif-icon" style="background:${meta.bg};color:${meta.color}"><i class="fa-solid ${meta.icon}"></i></div>
                    <div>
                        <h5>${n.title}</h5>
                        <p>${n.message || ''}</p>
                        <time>${timeAgo(n.created_at)}</time>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        // fail silently in dropdown
    }
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
