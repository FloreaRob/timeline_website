// Timeline Page Logic

let albums = [];
let isDragging = false;
let startX = 0;
let scrollLeft = 0;

// Initialize timeline when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initTimeline();
});

// Initialize Timeline
async function initTimeline() {
  const loadingState = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');
  const timelineCanvas = document.getElementById('timelineCanvas');

  try {
    // Show loading
    loadingState.style.display = 'flex';

    // Load albums from Firestore (with realtime updates)
    // Note: We fetch all albums and sort client-side to avoid needing a composite index
    db.collection('albums')
      .onSnapshot((snapshot) => {
        albums = [];

        snapshot.forEach((doc) => {
          albums.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort client-side by year and month
        albums.sort((a, b) => {
          if (a.releaseDate.year !== b.releaseDate.year) {
            return a.releaseDate.year - b.releaseDate.year;
          }
          return a.releaseDate.month - b.releaseDate.month;
        });

        // Hide loading
        loadingState.style.display = 'none';

        // Show empty state or render timeline
        if (albums.length === 0) {
          emptyState.classList.remove('hidden');
          timelineCanvas.innerHTML = '';
        } else {
          emptyState.classList.add('hidden');
          renderTimeline();
        }
      }, (error) => {
        console.error('Error loading albums:', error);
        loadingState.style.display = 'none';

        // Show more helpful error message
        if (error.code === 'permission-denied') {
          showToast('Permission denied. Check your Firestore rules are published.', 'error');
        } else if (error.message.includes('indexes')) {
          showToast('Database index needed. Check console for link.', 'error');
        } else {
          showToast('Failed to load timeline. Check your Firebase config and internet connection.', 'error');
        }
      });

    // Initialize interactions
    initTimelineInteractions();

  } catch (error) {
    console.error('Error initializing timeline:', error);
    loadingState.style.display = 'none';
    showToast('Failed to initialize timeline.', 'error');
  }
}

// Render Timeline
function renderTimeline() {
  const timelineCanvas = document.getElementById('timelineCanvas');

  // Clear existing content
  timelineCanvas.innerHTML = '';

  // Determine timeline range
  const range = getTimelineRange();

  // Create timeline axis
  createTimelineAxis(timelineCanvas);

  // Create year and month markers
  createTimeMarkers(timelineCanvas, range);

  // Create album markers
  createAlbumMarkers(timelineCanvas);

  // Center timeline on current date or latest album
  centerTimeline();
}

// Get timeline range (start and end years)
function getTimelineRange() {
  if (albums.length === 0) {
    const currentYear = new Date().getFullYear();
    return {
      startYear: currentYear - 5,
      endYear: currentYear + 5
    };
  }

  const years = albums.map(a => a.releaseDate.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Add padding
  return {
    startYear: minYear - 2,
    endYear: maxYear + 2
  };
}

// Create timeline axis (horizontal line)
function createTimelineAxis(container) {
  const axis = document.createElement('div');
  axis.className = 'timeline-axis';
  container.appendChild(axis);
}

// Create year and month markers
function createTimeMarkers(container, range) {
  const yearWidth = 1200; // pixels per year
  const monthWidth = 100; // pixels per month

  for (let year = range.startYear; year <= range.endYear; year++) {
    // Create year marker
    const yearPosition = calculateTimelinePosition(1, year);
    const yearMarker = document.createElement('div');
    yearMarker.className = 'year-marker';
    yearMarker.style.left = `${yearPosition}px`;
    yearMarker.innerHTML = `
      <div class="year-marker-line"></div>
      <div class="year-marker-label">${year}</div>
    `;
    container.appendChild(yearMarker);

    // Create month markers (subtle indicators)
    for (let month = 1; month <= 12; month++) {
      if (month === 1) continue; // Skip January (already has year marker)

      const monthPosition = calculateTimelinePosition(month, year);
      const monthMarker = document.createElement('div');
      monthMarker.className = 'month-marker';
      monthMarker.style.left = `${monthPosition}px`;
      container.appendChild(monthMarker);
    }
  }
}

// Create album markers
function createAlbumMarkers(container) {
  // Group albums by date (to handle multiple albums at same position)
  const albumsByDate = {};

  albums.forEach(album => {
    const dateKey = `${album.releaseDate.year}-${album.releaseDate.month}`;

    if (!albumsByDate[dateKey]) {
      albumsByDate[dateKey] = [];
    }

    albumsByDate[dateKey].push(album);
  });

  // Create markers for each date
  Object.keys(albumsByDate).forEach(dateKey => {
    const albumsAtDate = albumsByDate[dateKey];
    const position = calculateTimelinePosition(
      albumsAtDate[0].releaseDate.month,
      albumsAtDate[0].releaseDate.year
    );

    if (albumsAtDate.length === 1) {
      // Single album
      createSingleAlbumMarker(container, albumsAtDate[0], position);
    } else {
      // Multiple albums - create group
      createAlbumGroup(container, albumsAtDate, position);
    }
  });
}

// Create single album marker
function createSingleAlbumMarker(container, album, position) {
  const marker = document.createElement('div');
  marker.className = 'album-marker';
  marker.style.left = `${position}px`;
  marker.dataset.albumId = album.id;

  // Add image or placeholder
  if (album.imageUrl) {
    const img = document.createElement('img');
    img.src = album.imageUrl;
    img.alt = album.title;
    marker.appendChild(img);
  } else {
    marker.classList.add('no-image');
    marker.textContent = '🎵';
  }

  // Add type badge
  if (album.type) {
    const badge = document.createElement('div');
    badge.className = 'album-type-badge';
    badge.textContent = album.type === 'album' ? 'A' : 'S';
    badge.title = album.type;
    marker.appendChild(badge);
  }

  // Add event listeners
  marker.addEventListener('click', () => navigateToAlbum(album.id));
  marker.addEventListener('mouseenter', (e) => showAlbumPreview(e, album));
  marker.addEventListener('mouseleave', hideAlbumPreview);

  container.appendChild(marker);
}

// Create album group (multiple albums at same date)
function createAlbumGroup(container, albumsAtDate, position) {
  const group = document.createElement('div');
  group.className = 'album-marker-group';
  group.style.left = `${position}px`;

  // Add count badge
  const badge = document.createElement('div');
  badge.className = 'album-count-badge';
  badge.textContent = albumsAtDate.length;
  group.appendChild(badge);

  // Create marker for each album
  albumsAtDate.forEach((album, index) => {
    const marker = document.createElement('div');
    marker.className = 'album-marker';
    marker.dataset.albumId = album.id;

    if (album.imageUrl) {
      const img = document.createElement('img');
      img.src = album.imageUrl;
      img.alt = album.title;
      marker.appendChild(img);
    } else {
      marker.classList.add('no-image');
      marker.textContent = '🎵';
    }

    // Add type badge
    if (album.type) {
      const typeBadge = document.createElement('div');
      typeBadge.className = 'album-type-badge';
      typeBadge.textContent = album.type === 'album' ? 'A' : 'S';
      typeBadge.title = album.type;
      marker.appendChild(typeBadge);
    }

    marker.addEventListener('click', () => navigateToAlbum(album.id));
    marker.addEventListener('mouseenter', (e) => showAlbumPreview(e, album));
    marker.addEventListener('mouseleave', hideAlbumPreview);

    group.appendChild(marker);
  });

  container.appendChild(group);
}

// Show album preview on hover
function showAlbumPreview(event, album) {
  const preview = document.getElementById('albumPreview');
  const previewImage = document.getElementById('previewImage');
  const previewTitle = document.getElementById('previewTitle');
  const previewDate = document.getElementById('previewDate');

  // Set content
  previewImage.src = album.imageUrl || '';
  previewImage.style.display = album.imageUrl ? 'block' : 'none';
  previewTitle.textContent = album.title;
  previewDate.textContent = formatDate(album.releaseDate.month, album.releaseDate.year);

  // Position near cursor
  preview.style.left = `${event.clientX + 20}px`;
  preview.style.top = `${event.clientY - 100}px`;

  // Show preview
  preview.classList.remove('hidden');
}

// Hide album preview
function hideAlbumPreview() {
  const preview = document.getElementById('albumPreview');
  preview.classList.add('hidden');
}

// Navigate to album detail page
function navigateToAlbum(albumId) {
  window.location.href = `album.html?id=${albumId}`;
}

// Center timeline on current date or latest album
function centerTimeline() {
  const container = document.getElementById('timelineContainer');
  const currentDate = new Date();
  const currentPosition = calculateTimelinePosition(
    currentDate.getMonth() + 1,
    currentDate.getFullYear()
  );

  // Center on current position
  const containerWidth = container.offsetWidth;
  container.scrollLeft = currentPosition - (containerWidth / 2);
}

// Initialize Timeline Interactions
function initTimelineInteractions() {
  const container = document.getElementById('timelineContainer');
  const jumpToTodayBtn = document.getElementById('jumpToTodayBtn');

  // Horizontal scroll with mouse wheel
  container.addEventListener('wheel', (e) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // Click and drag scrolling
  container.addEventListener('mousedown', (e) => {
    // Only start drag if clicking on container, not on album markers
    if (e.target.closest('.album-marker')) return;

    isDragging = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.style.cursor = 'grabbing';
  });

  container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'grab';
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    container.scrollLeft = scrollLeft - walk;
  });

  // Jump to today button
  if (jumpToTodayBtn) {
    jumpToTodayBtn.addEventListener('click', centerTimeline);
  }

  // Touch support for mobile
  let touchStartX = 0;
  let touchScrollLeft = 0;

  container.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX;
    touchScrollLeft = container.scrollLeft;
  });

  container.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX;
    const walk = (touchStartX - x) * 2;
    container.scrollLeft = touchScrollLeft + walk;
  });
}
