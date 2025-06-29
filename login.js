document.addEventListener('DOMContentLoaded', () => {
    // Hardcoded users (in a real app, this would come from a secure backend)
    const users = {
        "admin": { password: "password123", role: "Admin" },
        "meofficer": { password: "password123", role: "M&E Officer" },
        "supervisor": { password: "password123", role: "Supervisor" }
    };

    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = loginForm.username.value.trim();
            const password = loginForm.password.value;

            if (users[username] && users[username].password === password) {
                localStorage.setItem('loggedInUser', username);
                localStorage.setItem('userRole', users[username].role);
                window.location.href = 'forms.html';
            } else {
                if (loginError) {
                    loginError.textContent = 'Invalid username or password.';
                    loginError.style.display = 'block';
                }
            }
        });
    }

    // Logout functionality (can be called from other pages)
    window.logout = function() {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userRole');
        // Potentially clear other session-related data from localStorage if needed
        localStorage.removeItem('pendingSubmissions');
        window.location.href = 'index.html';
    };

    // Check if user is already logged in (e.g., if they try to access index.html directly)
    // and redirect to forms.html if they are.
    // This should ideally be on a script loaded by all pages or handled by routing.
    // For this specific file (login.js), it makes sense if index.html is the current page.
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        if (localStorage.getItem('loggedInUser') && localStorage.getItem('userRole')) {
            // User is already logged in, redirect to dashboard
            // window.location.href = 'forms.html'; // Commented out to allow logout and return to login page
        }
    }

    // If on forms.html, ensure user is logged in, otherwise redirect to login
    // This part is more relevant for forms.js, but good to think about session management globally.
    // We will handle this check more robustly in forms.js or a shared utility script.
});

// Global function for logout, accessible from forms.html
function handleLogout() {
    if (typeof window.logout === 'function') {
        window.logout();
    } else {
        // Fallback if login.js wasn't fully loaded or logout wasn't set on window
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('userRole');
        localStorage.removeItem('pendingSubmissions');
        window.location.href = 'index.html';
    }
}

// Example of how forms.html might call logout:
// document.getElementById('logoutButton').addEventListener('click', handleLogout);
// This event listener setup will be in forms.js or forms.html script tag.
