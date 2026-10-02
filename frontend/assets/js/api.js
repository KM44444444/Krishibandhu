
// API — central fetch wrapper for the KrishiBandhu backend

const API_BASE = 'http://localhost:5001/api';

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('kb_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (err) {
        throw new Error('Could not reach the KrishiBandhu server. Make sure the backend is running on port 5000.');
    }

    let data;
    try {
        data = await res.json();
    } catch (err) {
        data = { success: false, message: 'Unexpected server response.' };
    }

    if (res.status === 401) {
        localStorage.removeItem('kb_token');
        localStorage.removeItem('kb_user');
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = getRootPath() + 'login.html';
        }
        throw new Error(data.message || 'Session expired. Please log in again.');
    }

    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Something went wrong.');
    }

    return data;
}

const api = {
    get: (path) => apiFetch(path, { method: 'GET' }),
    post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
    del: (path) => apiFetch(path, { method: 'DELETE' }),
};

// Works out how many "../" to prepend based on current file depth,
// so links work whether a page lives in /farmer/, /admin/, etc.
function getRootPath() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean);
    // if inside a role subfolder (farmer, government, admin, buyer, seller, expert)
    const roleFolders = ['farmer', 'government', 'admin', 'buyer', 'seller', 'expert'];
    const last = parts[parts.length - 2];
    if (roleFolders.includes(last)) return '../';
    return './';
}

// Returns the backend base URL (without /api) for constructing upload/image URLs
function getApiBaseUrl() {
    return API_BASE.replace(/\/api\/?$/, '');
}
