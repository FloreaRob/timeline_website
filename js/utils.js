// Utility Functions

// Format date as "Month Year" (e.g., "March 2023")
function formatDate(month, year) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${monthNames[month - 1]} ${year}`;
}

// Format date as short version (e.g., "Mar 2023")
function formatDateShort(month, year) {
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${monthNamesShort[month - 1]} ${year}`;
}

// Calculate timeline position based on date
// Reference date: January 2000 = position 0
function calculateTimelinePosition(month, year) {
  const referenceYear = 2000;
  const yearWidth = 1200; // pixels per year (from CSS variables)
  const monthWidth = 100; // pixels per month (yearWidth / 12)

  const yearOffset = (year - referenceYear) * yearWidth;
  const monthOffset = (month - 1) * monthWidth;

  return yearOffset + monthOffset;
}

// Get date from timeline position
function getDateFromPosition(position) {
  const referenceYear = 2000;
  const yearWidth = 1200;
  const monthWidth = 100;

  const year = Math.floor(position / yearWidth) + referenceYear;
  const month = Math.floor((position % yearWidth) / monthWidth) + 1;

  return { month, year };
}

// Debounce function (limits function calls)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function (ensures function runs at most once per interval)
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Show toast notification
function showToast(message, type = 'info', duration = 4000) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

// Show loading spinner
function showLoading(container) {
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
    </div>
  `;
}

// Create star rating display (for showing ratings)
function createStarRating(rating, maxRating = 10) {
  const percentage = (rating / maxRating) * 100;
  const filledStars = Math.round((rating / maxRating) * 5); // Convert to 5-star scale

  let html = '<div class="star-rating">';

  for (let i = 1; i <= 5; i++) {
    if (i <= filledStars) {
      html += '<span class="star filled">★</span>';
    } else {
      html += '<span class="star empty">☆</span>';
    }
  }

  html += `<span class="rating-text">${rating}/10</span>`;
  html += '</div>';

  return html;
}

// Create star rating input (for editing ratings)
function createStarRatingInput(currentRating = 0, name = 'rating') {
  let html = '<div class="star-rating-input">';

  for (let i = 1; i <= 10; i++) {
    const checked = i === currentRating ? 'checked' : '';
    html += `
      <input type="radio" id="${name}-${i}" name="${name}" value="${i}" ${checked} class="star-input">
      <label for="${name}-${i}" class="star-label" data-rating="${i}">★</label>
    `;
  }

  html += '</div>';

  return html;
}

// Format timestamp to relative time (e.g., "2 hours ago")
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Truncate text to specified length
function truncate(text, length = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Validate image file
function validateImageFile(file) {
  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push('No file selected');
    return errors;
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    errors.push('File size too large. Maximum size is 5MB.');
  }

  return errors;
}

// Generate unique filename for storage
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${randomString}.${extension}`;
}

// Sanitize HTML (prevent XSS)
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Get URL parameter
function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Smooth scroll to element
function smoothScrollTo(element, offset = 0) {
  const targetPosition = element.offsetLeft - offset;
  element.parentElement.scrollTo({
    left: targetPosition,
    behavior: 'smooth'
  });
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Export functions (if using modules - not needed for simple HTML includes)
// For now, these are global functions
