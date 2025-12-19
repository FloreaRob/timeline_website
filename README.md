# Music Timeline Website

A beautiful, interactive horizontal timeline for tracking music albums and songs with collaborative comments and ratings.

## Features

- **Interactive Timeline**: Horizontal scrollable timeline with drag navigation
- **Authentication**: Secure login system (no public registration)
- **Guest Mode**: Read-only access for non-authenticated visitors
- **Album Covers**: Use image URLs from any hosting service (Imgur, Google Drive, etc.)
- **Comments & Ratings**: Per-user comments with 1-10 ratings
- **Real-time Updates**: Live synchronization across all users
- **Dark Theme**: Modern, music-focused aesthetic
- **100% Free**: No credit card needed, runs entirely on free tiers

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Firestore, Authentication)
- **Hosting**: GitHub Pages
- **Images**: User-provided URLs (Imgur, etc.)

## Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "music-timeline")
4. Disable Google Analytics (optional, not needed)
5. Click "Create Project"

### 2. Enable Firebase Services

#### Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click "Save"

#### Enable Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **"Standard edition"** (this is the free tier)
4. Choose a location (closest to your users)
5. Click "Enable" or "Create"
   - Note: Security rules will be set in the next step

### 3. Configure Security Rules

#### Firestore Rules
1. Go to **Firestore Database** → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anyone can read (for guest mode)
    match /{document=**} {
      allow read: if true;
    }

    // Only authenticated users can add albums
    match /albums/{albumId} {
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.addedBy;
    }

    // Only owner can modify their comments
    match /comments/{commentId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. Click "Publish"

### 4. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the **Web icon** (</>)
4. Register your app:
   - App nickname: "Music Timeline"
   - **Do NOT** check "Firebase Hosting" (we're using GitHub Pages)
   - Click "Register app"
5. Copy the `firebaseConfig` object

### 5. Configure the Website

1. Navigate to the `js/` folder
2. Copy `firebase-config.template.js` to `firebase-config.js`:
   ```bash
   cp js/firebase-config.template.js js/firebase-config.js
   ```
3. Open `js/firebase-config.js`
4. Replace the placeholder values with your Firebase config from step 4

### 6. Add Users (Manual Registration)

Since there's no public registration, you manually add users:

1. Go to Firebase Console → **Authentication** → **Users** tab
2. Click **"Add user"**
3. Enter:
   - Email: user's email
   - Password: temporary password
4. Click "Add user"
5. Share credentials securely with the user
6. (Optional) User can change password after first login

### 7. Local Development

Simply open `index.html` in a web browser. For best experience:

**Option 1: VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

**Option 2: Python Simple Server**
```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000
```

**Option 3: Node.js http-server**
```bash
npx http-server
```

### 8. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to repository **Settings** → **Pages**
4. Under "Source", select **"main"** branch
5. Click "Save"
6. Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

**Important**: Make sure `js/firebase-config.js` is created and configured before deploying!

### 9. Add Your First Album

1. Log in with an admin account
2. Navigate to `admin.html` (or click "Add Album" in the timeline)
3. Fill in:
   - **Image URL**: Upload your cover to [Imgur](https://imgur.com/upload) (free, no account), then paste the direct link
   - Title (album/song name)
   - Type (album or song)
   - Select month and year
4. Click "Add Album"
5. View it on the timeline!

**Image Hosting Options:**
- [Imgur](https://imgur.com/upload) - Easiest, no account needed
- Google Drive - Share image, get link
- Dropbox - Get shareable link
- Any direct image URL works!

## Usage Guide

### For Guests (Non-Authenticated Users)
- View the timeline
- See all albums and comments
- Cannot add albums or comments

### For Authenticated Users
- All guest permissions, plus:
- Add new albums via admin panel
- Add/edit your own comments and ratings
- Cannot edit other users' comments

### Navigation
- **Scroll**: Use mouse wheel or trackpad to scroll horizontally
- **Drag**: Click and drag the timeline
- **Hover**: Hover over album markers to preview
- **Click**: Click an album to view details and comments

## Project Structure

```
timeline_website/
├── index.html              # Login page (entry point)
├── timeline.html           # Main timeline view
├── album.html              # Album detail page
├── admin.html              # Admin panel (add albums)
├── css/
│   ├── variables.css       # Design tokens (colors, spacing)
│   ├── main.css            # Global styles
│   ├── login.css           # Login page styles
│   ├── timeline.css        # Timeline visualization
│   └── album.css           # Album detail page
├── js/
│   ├── firebase-config.template.js  # Template (copy to firebase-config.js)
│   ├── auth.js             # Authentication logic
│   ├── timeline.js         # Timeline rendering
│   ├── album.js            # Album detail page
│   ├── admin.js            # Admin panel
│   └── utils.js            # Utilities
└── README.md               # This file
```

## Database Schema

### Collections

**albums**
- `id`: Auto-generated
- `title`: Album/song name
- `type`: "album" or "song"
- `imageUrl`: Direct image URL (from Imgur, etc.)
- `releaseDate`: { month: 1-12, year: YYYY }
- `addedBy`: User ID who added it
- `createdAt`: Timestamp

**comments**
- `id`: Auto-generated
- `albumId`: Reference to album
- `userId`: User who wrote it
- `userName`: Display name (denormalized)
- `rating`: Number (1-10)
- `comment`: Text content
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Troubleshooting

### "Firebase not defined" error
- Make sure you include Firebase SDK scripts BEFORE firebase-config.js
- Check that firebase-config.js is loaded in your HTML

### Images not displaying
- Ensure you're using a direct image URL (not a webpage link)
- Verify the image URL is publicly accessible
- Try opening the URL directly in your browser to test
- Check for HTTPS (some hosts require secure links)

### Can't see timeline data
- Check Firestore rules are published
- Verify firebase-config.js has correct credentials
- Check browser console for errors

### Not redirecting after login
- Clear browser cache and localStorage
- Check auth.js is loaded correctly

## Firebase Free Tier Limits

Your app stays free as long as you're under these limits:

- **Firestore**: 50K reads/day, 20K writes/day
- **Authentication**: Unlimited users
- **Hosting (GitHub Pages)**: Unlimited, free forever

For a personal music timeline with friends, you'll likely never hit these limits! **No credit card required.**

## Future Enhancements

Ideas for extending this project:
- Search functionality
- Filter by year/decade
- Statistics dashboard
- Spotify API integration
- Export to CSV
- Dark/light theme toggle
- User profile pages
- Collaborative playlists

## License

MIT License - Feel free to use and modify!

## Support

For issues or questions:
1. Check Firebase Console for service status
2. Review browser console for error messages
3. Verify all setup steps were completed

Enjoy tracking your music journey! 🎵
