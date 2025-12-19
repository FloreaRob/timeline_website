// Admin Panel Logic - Add Albums (URL-based, no uploads)

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is authenticated (redirect if not)
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      showToast('Please login to add albums', 'error');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }

    initAdminPanel();
  });
});

// Initialize Admin Panel
function initAdminPanel() {
  const imageUrlInput = document.getElementById('imageUrl');
  const addAlbumForm = document.getElementById('addAlbumForm');
  const addAnotherBtn = document.getElementById('addAnotherBtn');

  // Image URL preview
  imageUrlInput.addEventListener('input', handleImageUrlChange);
  imageUrlInput.addEventListener('blur', handleImageUrlChange);

  // Form submission
  addAlbumForm.addEventListener('submit', handleFormSubmit);

  // Add another button
  addAnotherBtn.addEventListener('click', resetForm);

  // Set default year to current year
  document.getElementById('year').value = new Date().getFullYear();
}

// Handle image URL change (show preview)
function handleImageUrlChange(event) {
  const url = event.target.value.trim();
  const imagePreview = document.getElementById('imagePreview');
  const imagePlaceholder = document.getElementById('imagePlaceholder');

  if (!url) {
    // No URL, show placeholder
    imagePreview.classList.remove('show');
    imagePlaceholder.classList.remove('hidden');
    return;
  }

  // Try to load the image
  const testImg = new Image();

  testImg.onload = () => {
    // Valid image URL
    imagePreview.src = url;
    imagePreview.classList.add('show');
    imagePlaceholder.classList.add('hidden');
  };

  testImg.onerror = () => {
    // Invalid image URL
    imagePreview.classList.remove('show');
    imagePlaceholder.classList.remove('hidden');
  };

  testImg.src = url;
}

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();

  // Get form values
  const title = document.getElementById('title').value.trim();
  const type = document.getElementById('type').value;
  const month = parseInt(document.getElementById('month').value);
  const year = parseInt(document.getElementById('year').value);
  const imageUrl = document.getElementById('imageUrl').value.trim();
  const currentUser = firebase.auth().currentUser;

  // Validate required fields
  if (!title || !type || !month || !year) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Validate image URL only if provided
  if (imageUrl && !isValidUrl(imageUrl)) {
    showToast('Please enter a valid image URL', 'error');
    return;
  }

  // Show loading state
  const submitButton = document.getElementById('submitButton');
  const submitButtonText = document.getElementById('submitButtonText');
  const submitSpinner = document.getElementById('submitSpinner');

  submitButton.disabled = true;
  submitButtonText.textContent = 'Adding to timeline...';
  submitSpinner.classList.remove('hidden');

  try {
    // Add album to Firestore
    const albumData = {
      title: title,
      type: type,
      imageUrl: imageUrl || '', // Empty string if no URL provided
      releaseDate: {
        month: month,
        year: year
      },
      addedBy: currentUser.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('albums').add(albumData);

    // Show success message
    showSuccessMessage(title);

    // Reset button state
    submitButton.disabled = false;
    submitButtonText.textContent = 'Add to Timeline';
    submitSpinner.classList.add('hidden');

  } catch (error) {
    console.error('Error adding album:', error);
    showToast('Failed to add album. Please try again.', 'error');

    // Reset button state
    submitButton.disabled = false;
    submitButtonText.textContent = 'Add to Timeline';
    submitSpinner.classList.add('hidden');
  }
}

// Validate URL format
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// Show success message
function showSuccessMessage(albumTitle) {
  const form = document.getElementById('addAlbumForm');
  const successMessage = document.getElementById('successMessage');
  const addedAlbumTitle = document.getElementById('addedAlbumTitle');

  form.style.display = 'none';
  successMessage.classList.add('show');
  addedAlbumTitle.textContent = `"${albumTitle}" has been added to your timeline!`;
}

// Reset form (for adding another album)
function resetForm() {
  const form = document.getElementById('addAlbumForm');
  const successMessage = document.getElementById('successMessage');
  const imagePreview = document.getElementById('imagePreview');
  const imagePlaceholder = document.getElementById('imagePlaceholder');

  // Hide success, show form
  successMessage.classList.remove('show');
  form.style.display = 'block';

  // Reset form fields
  form.reset();

  // Reset image preview
  imagePreview.src = '';
  imagePreview.classList.remove('show');
  imagePlaceholder.classList.remove('hidden');

  // Reset year to current
  document.getElementById('year').value = new Date().getFullYear();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
