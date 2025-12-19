// Album Detail Page Logic

let currentAlbum = null;
let currentUserComment = null;
let allComments = [];
let albumId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get album ID from URL
  albumId = getURLParameter('id');

  if (!albumId) {
    showToast('No album specified', 'error');
    setTimeout(() => {
      window.location.href = 'timeline.html';
    }, 2000);
    return;
  }

  initAlbumPage();
});

// Initialize Album Page
async function initAlbumPage() {
  const loadingState = document.getElementById('loadingState');
  const albumContent = document.getElementById('albumContent');

  try {
    // Load album data
    const albumDoc = await db.collection('albums').doc(albumId).get();

    if (!albumDoc.exists) {
      showToast('Album not found', 'error');
      setTimeout(() => {
        window.location.href = 'timeline.html';
      }, 2000);
      return;
    }

    currentAlbum = { id: albumDoc.id, ...albumDoc.data() };

    // Render album header
    renderAlbumHeader();

    // Load comments (with realtime updates)
    loadComments();

    // Hide loading, show content
    loadingState.style.display = 'none';
    albumContent.classList.remove('hidden');

    // Initialize comment form interactions
    initCommentForms();

  } catch (error) {
    console.error('Error loading album:', error);
    showToast('Failed to load album', 'error');
    loadingState.style.display = 'none';
  }
}

// Render Album Header
function renderAlbumHeader() {
  const albumCover = document.getElementById('albumCover');
  const albumCoverLarge = albumCover.parentElement;

  // Handle image - show default icon if no image URL
  if (currentAlbum.imageUrl && currentAlbum.imageUrl.trim()) {
    albumCover.src = currentAlbum.imageUrl;
    albumCover.style.display = 'block';
    albumCoverLarge.classList.remove('no-image');
  } else {
    // No image - show default music note icon
    albumCover.style.display = 'none';
    albumCoverLarge.classList.add('no-image');
    // Add music note emoji if not already there
    if (!albumCoverLarge.querySelector('.default-icon')) {
      const defaultIcon = document.createElement('div');
      defaultIcon.className = 'default-icon';
      defaultIcon.textContent = '🎵';
      albumCoverLarge.insertBefore(defaultIcon, albumCoverLarge.firstChild);
    }
  }

  document.getElementById('albumTitle').textContent = currentAlbum.title;
  document.getElementById('albumDate').textContent = formatDate(
    currentAlbum.releaseDate.month,
    currentAlbum.releaseDate.year
  );

  // Type badge
  const typeBadge = document.getElementById('albumTypeBadge');
  typeBadge.textContent = currentAlbum.type || 'Album';
  typeBadge.className = 'type-badge';

  // Set page title
  document.title = `${currentAlbum.title} - Music Timeline`;

  // Show delete button if user is the album owner
  const currentUser = getCurrentUser();
  if (currentUser && currentAlbum.addedBy === currentUser.uid) {
    const deleteSection = document.getElementById('deleteAlbumSection');
    const deleteBtn = document.getElementById('deleteAlbumBtn');

    if (deleteSection && deleteBtn) {
      deleteSection.style.display = 'block';
      deleteBtn.addEventListener('click', handleDeleteAlbum);
    }
  }
}

// Load Comments
function loadComments() {
  db.collection('comments')
    .where('albumId', '==', albumId)
    .onSnapshot((snapshot) => {
      allComments = [];
      currentUserComment = null;

      const currentUser = getCurrentUser();
      const currentUserId = currentUser ? currentUser.uid : null;

      snapshot.forEach((doc) => {
        const comment = { id: doc.id, ...doc.data() };

        if (currentUserId && comment.userId === currentUserId) {
          currentUserComment = comment;
        } else {
          allComments.push(comment);
        }
      });

      // Sort comments client-side by creation date (newest first)
      allComments.sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      renderComments();
      updateStats();
    }, (error) => {
      console.error('Error loading comments:', error);

      // Show more helpful error message
      if (error.code === 'permission-denied') {
        showToast('Permission denied. Check your Firestore rules.', 'error');
      } else {
        showToast('Failed to load comments. Check console for details.', 'error');
      }
    });
}

// Render Comments
function renderComments() {
  const isAuthenticated = getCurrentUser() !== null;
  const isGuest = isGuestMode();

  // Show/hide guest banner
  const guestBanner = document.getElementById('guestCommentBanner');
  if (isGuest || !isAuthenticated) {
    guestBanner.classList.remove('hidden');
  } else {
    guestBanner.classList.add('hidden');
  }

  // Handle current user's comment section
  if (isAuthenticated && !isGuest) {
    if (currentUserComment) {
      renderCurrentUserComment();
    } else {
      showAddCommentSection();
    }
  } else {
    // Hide write controls for guests
    document.getElementById('currentUserComment').classList.add('hidden');
    document.getElementById('addCommentSection').classList.add('hidden');
  }

  // Render other users' comments
  renderOtherComments();
}

// Render current user's comment (view mode)
function renderCurrentUserComment() {
  const currentUserCommentEl = document.getElementById('currentUserComment');
  const commentView = document.getElementById('currentCommentView');
  const commentEdit = document.getElementById('currentCommentEdit');
  const addCommentSection = document.getElementById('addCommentSection');

  currentUserCommentEl.classList.remove('hidden');
  addCommentSection.classList.add('hidden');
  commentView.classList.remove('hidden');
  commentEdit.classList.add('hidden');

  // Render view
  commentView.innerHTML = `
    <div class="rating-display">
      ${createStarRating(currentUserComment.rating)}
    </div>
    <div class="comment-text">${sanitizeHTML(currentUserComment.comment)}</div>
    <div class="comment-date text-muted">
      ${formatRelativeTime(currentUserComment.createdAt?.toMillis())}
      ${currentUserComment.updatedAt ? `(edited ${formatRelativeTime(currentUserComment.updatedAt.toMillis())})` : ''}
    </div>
  `;
}

// Show add comment section (for users without a comment)
function showAddCommentSection() {
  const currentUserCommentEl = document.getElementById('currentUserComment');
  const addCommentSection = document.getElementById('addCommentSection');

  currentUserCommentEl.classList.add('hidden');
  addCommentSection.classList.remove('hidden');
}

// Render other users' comments
function renderOtherComments() {
  const otherCommentsEl = document.getElementById('otherComments');
  const noCommentsEl = document.getElementById('noComments');

  // Check if there are ANY comments (including current user's)
  const totalComments = allComments.length + (currentUserComment ? 1 : 0);

  if (totalComments === 0) {
    // No comments at all - show "no comments" message
    otherCommentsEl.innerHTML = '';
    noCommentsEl.classList.remove('hidden');
    return;
  }

  // There are comments - hide "no comments" message
  noCommentsEl.classList.add('hidden');

  // If there are no OTHER users' comments, don't show that section
  if (allComments.length === 0) {
    otherCommentsEl.innerHTML = '';
    return;
  }

  otherCommentsEl.innerHTML = allComments.map(comment => `
    <div class="comment-card">
      <div class="comment-header">
        <div>
          <h3 class="comment-author">${sanitizeHTML(comment.userName || 'Anonymous')}</h3>
          <p class="comment-date">
            ${formatRelativeTime(comment.createdAt?.toMillis())}
            ${comment.updatedAt ? `(edited)` : ''}
          </p>
        </div>
      </div>
      <div class="rating-display">
        ${createStarRating(comment.rating)}
      </div>
      <div class="comment-text">${sanitizeHTML(comment.comment)}</div>
    </div>
  `).join('');
}

// Update album stats
function updateStats() {
  const totalComments = allComments.length + (currentUserComment ? 1 : 0);
  const ratings = [...allComments.map(c => c.rating)];
  if (currentUserComment) ratings.push(currentUserComment.rating);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
    : 'N/A';

  document.getElementById('albumStats').innerHTML = `
    <span class="stat-item">💬 ${totalComments} comment${totalComments !== 1 ? 's' : ''}</span>
    <span class="stat-item">⭐ ${avgRating}/10 average</span>
  `;
}

// Initialize Comment Forms
function initCommentForms() {
  // Show add comment form button
  const showAddCommentBtn = document.getElementById('showAddCommentBtn');
  const addCommentForm = document.getElementById('addCommentForm');
  const cancelAddBtn = document.getElementById('cancelAddBtn');

  if (showAddCommentBtn) {
    showAddCommentBtn.addEventListener('click', () => {
      addCommentForm.classList.remove('hidden');
      showAddCommentBtn.style.display = 'none';
      initRatingInput('newRatingInput', 0);
    });
  }

  if (cancelAddBtn) {
    cancelAddBtn.addEventListener('click', () => {
      addCommentForm.classList.add('hidden');
      showAddCommentBtn.style.display = 'inline-flex';
      document.getElementById('newCommentText').value = '';
    });
  }

  // New comment form submit
  const newCommentForm = document.getElementById('newCommentForm');
  if (newCommentForm) {
    newCommentForm.addEventListener('submit', handleNewComment);
  }

  // Edit button
  const editCommentBtn = document.getElementById('editCommentBtn');
  if (editCommentBtn) {
    editCommentBtn.addEventListener('click', showEditMode);
  }

  // Cancel edit button
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', hideEditMode);
  }

  // Save comment form
  const commentForm = document.getElementById('commentForm');
  if (commentForm) {
    commentForm.addEventListener('submit', handleSaveComment);
  }

  // Delete button
  const deleteCommentBtn = document.getElementById('deleteCommentBtn');
  if (deleteCommentBtn) {
    deleteCommentBtn.addEventListener('click', handleDeleteComment);
  }
}

// Initialize rating input
function initRatingInput(containerId, currentRating = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  for (let i = 10; i >= 1; i--) {
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `${containerId}-${i}`;
    input.name = `${containerId}-rating`;
    input.value = i;
    input.className = 'star-input';
    if (i === currentRating) input.checked = true;

    const label = document.createElement('label');
    label.htmlFor = `${containerId}-${i}`;
    label.className = 'star-label';
    label.textContent = '★';
    label.dataset.rating = i;

    container.appendChild(input);
    container.appendChild(label);
  }
}

// Get selected rating from input
function getSelectedRating(containerId) {
  const selected = document.querySelector(`input[name="${containerId}-rating"]:checked`);
  return selected ? parseInt(selected.value) : 0;
}

// Handle new comment submission
async function handleNewComment(e) {
  e.preventDefault();

  const rating = getSelectedRating('newRatingInput');
  const commentText = document.getElementById('newCommentText').value.trim();
  const currentUser = getCurrentUser();

  if (!rating || rating < 1 || rating > 10) {
    showToast('Please select a rating (1-10)', 'error');
    return;
  }

  if (!commentText) {
    showToast('Please enter a comment', 'error');
    return;
  }

  try {
    await db.collection('comments').add({
      albumId: albumId,
      userId: currentUser.uid,
      userName: currentUser.email.split('@')[0], // Use email prefix as name
      rating: rating,
      comment: commentText,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: null
    });

    showToast('Comment added successfully!', 'success');

    // Reset form
    document.getElementById('newCommentText').value = '';
    document.getElementById('addCommentForm').classList.add('hidden');
    document.getElementById('showAddCommentBtn').style.display = 'inline-flex';

  } catch (error) {
    console.error('Error adding comment:', error);
    showToast('Failed to add comment', 'error');
  }
}

// Show edit mode for current user's comment
function showEditMode() {
  const commentView = document.getElementById('currentCommentView');
  const commentEdit = document.getElementById('currentCommentEdit');

  commentView.classList.add('hidden');
  commentEdit.classList.remove('hidden');

  // Populate form with current values
  initRatingInput('ratingInput', currentUserComment.rating);
  document.getElementById('commentText').value = currentUserComment.comment;
}

// Hide edit mode
function hideEditMode() {
  const commentView = document.getElementById('currentCommentView');
  const commentEdit = document.getElementById('currentCommentEdit');

  commentView.classList.remove('hidden');
  commentEdit.classList.add('hidden');
}

// Handle save comment (update)
async function handleSaveComment(e) {
  e.preventDefault();

  const rating = getSelectedRating('ratingInput');
  const commentText = document.getElementById('commentText').value.trim();

  if (!rating || rating < 1 || rating > 10) {
    showToast('Please select a rating (1-10)', 'error');
    return;
  }

  if (!commentText) {
    showToast('Please enter a comment', 'error');
    return;
  }

  try {
    await db.collection('comments').doc(currentUserComment.id).update({
      rating: rating,
      comment: commentText,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('Comment updated successfully!', 'success');
    hideEditMode();

  } catch (error) {
    console.error('Error updating comment:', error);
    showToast('Failed to update comment', 'error');
  }
}

// Handle delete comment
async function handleDeleteComment() {
  if (!confirm('Are you sure you want to delete your comment? This cannot be undone.')) {
    return;
  }

  try {
    await db.collection('comments').doc(currentUserComment.id).delete();
    showToast('Comment deleted', 'success');

  } catch (error) {
    console.error('Error deleting comment:', error);
    showToast('Failed to delete comment', 'error');
  }
}

// Handle delete album
async function handleDeleteAlbum() {
  const confirmMessage = `Are you sure you want to delete "${currentAlbum.title}"?\n\nThis will also delete ALL comments on this album. This cannot be undone.`;

  if (!confirm(confirmMessage)) {
    return;
  }

  try {
    // Delete all comments for this album first
    const commentsSnapshot = await db.collection('comments')
      .where('albumId', '==', albumId)
      .get();

    const deletePromises = [];
    commentsSnapshot.forEach((doc) => {
      deletePromises.push(doc.ref.delete());
    });

    await Promise.all(deletePromises);

    // Delete the album
    await db.collection('albums').doc(albumId).delete();

    showToast('Album deleted successfully', 'success');

    // Redirect to timeline after a short delay
    setTimeout(() => {
      window.location.href = 'timeline.html';
    }, 1500);

  } catch (error) {
    console.error('Error deleting album:', error);
    showToast('Failed to delete album. ' + error.message, 'error');
  }
}
