// Authentication Logic

// Rate limiting configuration
const RATE_LIMIT_KEY = 'login_attempts';
const LOCKOUT_TIME_KEY = 'login_lockout_until';
const MAX_ATTEMPTS_SOFT = 5;  // First warning threshold
const MAX_ATTEMPTS_HARD = 10; // Hard lockout threshold
const LOCKOUT_DURATION_SOFT = 30 * 1000; // 30 seconds
const LOCKOUT_DURATION_HARD = 5 * 60 * 1000; // 5 minutes

// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the login page
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    initLoginPage();
  } else {
    // On other pages, check auth state
    checkAuthState();
  }
});

// Initialize Login Page
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const guestButton = document.getElementById('guestButton');
  const errorMessage = document.getElementById('errorMessage');
  const loginButton = document.getElementById('loginButton');
  const loginButtonText = document.getElementById('loginButtonText');
  const loginSpinner = document.getElementById('loginSpinner');

  // Ensure button is in correct initial state
  loginButton.disabled = false;
  loginButtonText.textContent = 'Log In';
  loginSpinner.classList.add('hidden');
  errorMessage.classList.add('hidden');

  // Check if currently locked out
  checkAndApplyLockout(loginButton, loginButtonText, errorMessage);

  // Check if user is already logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Clear failed attempts on successful login
      resetLoginAttempts();
      // User is logged in, redirect to timeline
      window.location.href = 'timeline.html';
    }
  });

  // Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if locked out
    if (isLockedOut()) {
      return; // Lockout message is already shown
    }

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Clear previous error
    errorMessage.classList.add('hidden');
    errorMessage.textContent = '';

    // Show loading state
    loginButton.disabled = true;
    loginButtonText.textContent = 'Logging in...';
    loginSpinner.classList.remove('hidden');

    try {
      // Sign in with Firebase
      await firebase.auth().signInWithEmailAndPassword(email, password);

      // Clear guest mode flag and failed attempts
      localStorage.removeItem('guestMode');
      resetLoginAttempts();

      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error('Login error:', error);

      // Increment failed attempts
      incrementLoginAttempts();

      // Show user-friendly error message
      let message = 'Login failed. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email. Contact an admin to create an account.';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address format.';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Account temporarily locked by Firebase. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Check your internet connection.';
          break;
      }

      // Check if we should apply lockout
      const attempts = getLoginAttempts();
      if (attempts >= MAX_ATTEMPTS_HARD) {
        applyLockout(LOCKOUT_DURATION_HARD, loginButton, loginButtonText, errorMessage);
        message = `Too many failed login attempts (${attempts}). Account locked for 5 minutes for security.`;
      } else if (attempts >= MAX_ATTEMPTS_SOFT) {
        applyLockout(LOCKOUT_DURATION_SOFT, loginButton, loginButtonText, errorMessage);
        message = `Multiple failed attempts (${attempts}). Please wait 30 seconds before trying again.`;
      } else if (attempts >= 3) {
        message += ` (${attempts} failed attempts)`;
      }

      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');

      // Reset button state (unless locked out)
      if (!isLockedOut()) {
        loginButton.disabled = false;
        loginButtonText.textContent = 'Log In';
        loginSpinner.classList.add('hidden');
      }
    }
  });

  // Guest Mode Button
  guestButton.addEventListener('click', () => {
    // Set guest mode flag
    localStorage.setItem('guestMode', 'true');

    // Redirect to timeline
    window.location.href = 'timeline.html';
  });
}

// Check Auth State (for protected pages)
function checkAuthState() {
  firebase.auth().onAuthStateChanged((user) => {
    const isGuestMode = localStorage.getItem('guestMode') === 'true';

    // If not logged in and not in guest mode, redirect to login
    if (!user && !isGuestMode) {
      // Allow access to login page
      if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        window.location.href = 'index.html';
      }
    }

    // Update UI based on auth state
    updateUIForAuthState(user, isGuestMode);
  });
}

// Update UI based on authentication state
function updateUIForAuthState(user, isGuestMode) {
  // Get common UI elements (if they exist on the page)
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const logoutButton = document.getElementById('logoutButton');
  const addAlbumButton = document.getElementById('addAlbumButton');
  const guestBanner = document.getElementById('guestBanner');
  const timelineWrapper = document.querySelector('.timeline-wrapper');

  if (isGuestMode) {
    // Guest mode
    if (userInfo) userInfo.style.display = 'none';
    if (addAlbumButton) addAlbumButton.style.display = 'none';
    if (guestBanner) {
      guestBanner.classList.remove('hidden');
      // Adjust timeline height to account for banner (after DOM updates)
      setTimeout(() => {
        if (timelineWrapper) {
          const bannerHeight = guestBanner.offsetHeight || 60;
          // Account for search bar (72px) if it exists
          const searchBar = document.querySelector('.search-container');
          const searchHeight = searchBar ? (searchBar.offsetHeight || 72) : 0;
          timelineWrapper.style.height = `calc(100vh - 80px - ${searchHeight}px - ${bannerHeight}px)`;
        }
      }, 10);
    }

    // Hide all write controls (will be handled per page)
    hideWriteControls();
  } else if (user) {
    // Logged in user
    if (userInfo) userInfo.style.display = 'flex';
    if (userName) userName.textContent = user.email.split('@')[0]; // Use email prefix as name
    if (addAlbumButton) addAlbumButton.style.display = 'inline-flex';
    if (guestBanner) {
      guestBanner.classList.add('hidden');
      // Restore default timeline height (accounting for search bar)
      if (timelineWrapper) {
        const searchBar = document.querySelector('.search-container');
        const searchHeight = searchBar ? (searchBar.offsetHeight || 72) : 0;
        timelineWrapper.style.height = `calc(100vh - 80px - ${searchHeight}px)`;
      }
    }

    // Show write controls
    showWriteControls();
  }

  // Logout button handler
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
}

// Logout Handler
async function handleLogout() {
  try {
    await firebase.auth().signOut();
    localStorage.removeItem('guestMode');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed. Please try again.', 'error');
  }
}

// Hide write controls for guest mode
function hideWriteControls() {
  const writeControls = document.querySelectorAll('.write-control');
  writeControls.forEach(control => {
    control.style.display = 'none';
  });
}

// Show write controls for authenticated users
function showWriteControls() {
  const writeControls = document.querySelectorAll('.write-control');
  writeControls.forEach(control => {
    control.style.display = '';
  });
}

// Check if user is authenticated (helper function)
function isAuthenticated() {
  return firebase.auth().currentUser !== null;
}

// Check if in guest mode (helper function)
function isGuestMode() {
  return localStorage.getItem('guestMode') === 'true';
}

// Get current user (helper function)
function getCurrentUser() {
  return firebase.auth().currentUser;
}

// Show toast notification (helper function)
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// ============================================
// Rate Limiting Functions (Brute Force Protection)
// ============================================

// Get number of failed login attempts
function getLoginAttempts() {
  const attempts = localStorage.getItem(RATE_LIMIT_KEY);
  return attempts ? parseInt(attempts) : 0;
}

// Increment failed login attempts
function incrementLoginAttempts() {
  const attempts = getLoginAttempts() + 1;
  localStorage.setItem(RATE_LIMIT_KEY, attempts.toString());
  return attempts;
}

// Reset login attempts (on successful login)
function resetLoginAttempts() {
  localStorage.removeItem(RATE_LIMIT_KEY);
  localStorage.removeItem(LOCKOUT_TIME_KEY);
}

// Check if currently locked out
function isLockedOut() {
  const lockoutUntil = localStorage.getItem(LOCKOUT_TIME_KEY);
  if (!lockoutUntil) return false;

  const now = Date.now();
  const lockoutTime = parseInt(lockoutUntil);

  if (now < lockoutTime) {
    return true; // Still locked out
  } else {
    // Lockout expired, clear it
    localStorage.removeItem(LOCKOUT_TIME_KEY);
    return false;
  }
}

// Apply lockout and start countdown
function applyLockout(duration, loginButton, loginButtonText, errorMessage) {
  const lockoutUntil = Date.now() + duration;
  localStorage.setItem(LOCKOUT_TIME_KEY, lockoutUntil.toString());

  // Disable login button
  loginButton.disabled = true;

  // Start countdown timer
  startLockoutCountdown(lockoutUntil, loginButton, loginButtonText, errorMessage);
}

// Start countdown timer during lockout
function startLockoutCountdown(lockoutUntil, loginButton, loginButtonText, errorMessage) {
  const updateCountdown = () => {
    const now = Date.now();
    const remaining = lockoutUntil - now;

    if (remaining <= 0) {
      // Lockout expired
      loginButton.disabled = false;
      loginButtonText.textContent = 'Log In';
      errorMessage.classList.add('hidden');
      localStorage.removeItem(LOCKOUT_TIME_KEY);
      return;
    }

    // Update button text with countdown
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      loginButtonText.textContent = `Locked (${minutes}:${secs.toString().padStart(2, '0')})`;
    } else {
      loginButtonText.textContent = `Locked (${secs}s)`;
    }

    // Continue countdown
    setTimeout(updateCountdown, 1000);
  };

  updateCountdown();
}

// Check and apply lockout on page load (if user refreshes during lockout)
function checkAndApplyLockout(loginButton, loginButtonText, errorMessage) {
  const lockoutUntil = localStorage.getItem(LOCKOUT_TIME_KEY);
  if (!lockoutUntil) return;

  const now = Date.now();
  const lockoutTime = parseInt(lockoutUntil);

  if (now < lockoutTime) {
    // Still locked out
    const attempts = getLoginAttempts();
    const duration = lockoutTime - now;
    const durationMinutes = Math.ceil(duration / 60000);

    loginButton.disabled = true;

    let message;
    if (attempts >= MAX_ATTEMPTS_HARD) {
      message = `Too many failed attempts. Please wait ${durationMinutes} minute(s) before trying again.`;
    } else {
      message = `Multiple failed attempts. Please wait before trying again.`;
    }

    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');

    // Start countdown
    startLockoutCountdown(lockoutTime, loginButton, loginButtonText, errorMessage);
  } else {
    // Lockout expired
    localStorage.removeItem(LOCKOUT_TIME_KEY);
  }
}
