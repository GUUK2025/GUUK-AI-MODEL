document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // Check if user is already logged in and redirect to dashboard
    // This prevents showing the login page if a session is active.
    if (localStorage.getItem('loggedInUser') && localStorage.getItem('userRole')) {
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
             // Only redirect if on index.html or root.
            window.location.href = 'dashboard.html';
            return; // Stop further execution on this page
        }
    }


    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = loginForm.username.value.trim().toLowerCase(); // Standardize username input
            const password = loginForm.password.value;

            // USERS should be defined in config.js and loaded before this script
            if (typeof USERS === 'undefined') {
                if (loginError) {
                    loginError.textContent = 'Configuration error: USERS not loaded.';
                    loginError.style.display = 'block';
                }
                console.error("USERS constant from config.js is not available.");
                return;
            }

            const user = USERS[username];

            if (user && user.password === password) {
                localStorage.setItem('loggedInUser', username); // Store username
                localStorage.setItem('userRole', user.role);   // Store role
                localStorage.setItem('userNameDisplay', user.name || username); // Store display name
                window.location.href = 'dashboard.html';
            } else {
                if (loginError) {
                    loginError.textContent = 'Invalid username or password.';
                    loginError.style.display = 'block';
                }
                loginForm.password.value = ''; // Clear password field
            }
        });
    }
});

// Global logout function, can be called from dashboard.html
function handleUserLogout() {
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userNameDisplay');
    // Clear any other session-specific data if necessary
    localStorage.removeItem('pendingSubmissions'); // Good practice to clear pending data on logout for security/privacy
    localStorage.removeItem('lastActiveFormId'); // Clear last viewed form

    // Redirect to login page
    window.location.href = 'index.html';
}

// Note: dashboard.html will need to ensure that config.js is loaded if it uses any constants from it directly.
// login.js now relies on USERS from config.js. Ensure config.js is loaded before login.js in index.html,
// or login.js is loaded after DOMContentLoaded and assumes config.js has already populated its globals.
// The current setup (login.js in body, no defer/async) should work if config.js is also in body before it,
// or if USERS is available on the window object when login.js executes.
// The current index.html does not load config.js, which is an issue. I'll fix that.

// This script is primarily for index.html.
// Session check for dashboard.html will be handled within dashboard.html or forms.js
console.log("login.js loaded.");
