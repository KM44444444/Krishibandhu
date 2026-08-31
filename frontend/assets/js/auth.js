// ============================================================
// AUTH — login & register form handling
// ============================================================

function redirectToDashboard(role) {
    window.location.href = `${role}/dashboard.html`;
}

// If already logged in, skip straight to dashboard
function bounceIfLoggedIn() {
    const token = localStorage.getItem('kb_token');
    const user = getCurrentUser();
    if (token && user) redirectToDashboard(user.role);
}

function showAlert(id, message, type = 'error') {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = `alert-box ${type}`;
}

function hideAlert(id) {
    document.getElementById(id).className = 'alert-box';
}

async function handleLogin(e) {
    e.preventDefault();
    hideAlert('authAlert');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        localStorage.setItem('kb_token', data.token);
        localStorage.setItem('kb_user', JSON.stringify(data.user));
        redirectToDashboard(data.user.role);
    } catch (err) {
        showAlert('authAlert', err.message);
        btn.disabled = false;
        btn.textContent = 'Login';
    }
}

let selectedRole = null;

function initRoleSelector() {
    document.querySelectorAll('.role-option').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
            el.classList.add('selected');
            selectedRole = el.dataset.role;
        });
    });
}

async function handleRegister(e) {
    e.preventDefault();
    hideAlert('authAlert');

    if (!selectedRole) {
        showAlert('authAlert', 'Please select an account type.');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showAlert('authAlert', 'Passwords do not match.');
        return;
    }
    if (password.length < 6) {
        showAlert('authAlert', 'Password must be at least 6 characters.');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
        const data = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, phone, password, role: selectedRole })
        });
        localStorage.setItem('kb_token', data.token);
        localStorage.setItem('kb_user', JSON.stringify(data.user));
        redirectToDashboard(data.user.role);
    } catch (err) {
        showAlert('authAlert', err.message);
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}
