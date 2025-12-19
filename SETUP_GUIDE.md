# Quick Setup Guide

Follow these steps to get your Music Timeline website up and running.

## Step 1: Create Firebase Project (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it (e.g., "music-timeline")
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Enable Firebase Services (5 minutes)

### Enable Authentication
1. **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Save

### Enable Firestore
1. **Firestore Database** → **Create database**
2. Choose **"Standard edition"** (free tier)
3. Choose location (pick closest to you)
4. Click "Enable" or "Create"
   - Note: Don't worry about security rules yet, we'll set them in Step 3

## Step 3: Apply Security Rules (1 minute)

### Firestore Rules
1. **Firestore Database** → **Rules**
2. Copy content from [`firestore.rules`](firestore.rules)
3. Publish

## Step 4: Get Firebase Config (3 minutes)

1. **Project Settings** (gear icon) → **General**
2. Scroll to "Your apps"
3. Click Web icon `</>`
4. Register app (name: "Music Timeline")
5. Copy the `firebaseConfig` object

## Step 5: Configure Website (2 minutes)

1. Copy `js/firebase-config.template.js` to `js/firebase-config.js`:
   ```bash
   copy js\firebase-config.template.js js\firebase-config.js
   ```

2. Open `js/firebase-config.js`

3. Replace placeholder values with your config from Step 4

## Step 6: Test Locally (1 minute)

Open `index.html` in your browser OR use a local server:

**Option A: VS Code Live Server**
- Install Live Server extension
- Right-click `index.html` → "Open with Live Server"

**Option B: Python**
```bash
python -m http.server 8000
# Visit http://localhost:8000
```

**Option C: Node.js**
```bash
npx http-server
```

## Step 7: Add Your First User (2 minutes)

1. Firebase Console → **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. Save
5. Use these credentials to log in!

## Step 8: Add Your First Album (3 minutes)

1. Log in to your website with the user you created
2. Click **"Add Album"** button
3. Fill in the form:
   - **Image URL**: Upload your album cover to [Imgur](https://imgur.com/upload) (free, no account needed), then paste the direct image link
   - **Title**: Album or song name
   - **Type**: Select "Album" or "Song"
   - **Release Date**: Choose month and year
4. Click **"Add to Timeline"**
5. Your album appears on the timeline!

**Image Hosting Tips:**
- [Imgur](https://imgur.com/upload) - Easiest, no account needed
- Google Drive - Share image, copy link
- Dropbox - Get shareable link
- Any image URL from the web works!

## Step 9: Deploy to GitHub Pages (5 minutes)

1. Create GitHub repository
2. Push code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Music Timeline website"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Repository **Settings** → **Pages**
   - Source: **main** branch
   - Save

4. Your site will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## You're Done! 🎉

Your music timeline is now live. Here's what you can do:

- **Log in** with the user you created
- **Add albums** via the admin panel
- **Add comments** and ratings
- **Share the URL** with friends (you'll need to add them as users first)

## Next Steps

- Add more users in Firebase Console
- Start adding your favorite albums
- Customize colors in `css/variables.css`

## Need Help?

Check the full [README.md](README.md) for detailed documentation and troubleshooting.

---

**Total Setup Time: ~25 minutes**
