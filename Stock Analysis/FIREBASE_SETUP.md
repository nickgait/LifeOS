# Firebase Setup Guide

## 🚀 Quick Test First

**Try the app without Firebase:**
```
http://localhost:8000/index-no-firebase.html
```

This version has all stock features working except the watchlist (which requires Firebase).

## 🔥 Firebase Setup Steps

### 1. Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Create a project"**
3. **Project name**: `stock-dashboard` (or any name)
4. **Disable Google Analytics** (not needed)
5. **Click "Create project"**

### 2. Enable Authentication

1. **In Firebase Console**, go to **Authentication**
2. **Click "Get started"**
3. **Go to "Sign-in method" tab**
4. **Enable "Anonymous"**
   - Click on "Anonymous"
   - Toggle "Enable"
   - Click "Save"

### 3. Enable Firestore Database

1. **In Firebase Console**, go to **Firestore Database**
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select location** (choose closest to you)
5. **Click "Done"**

### 4. Get Firebase Configuration

1. **In Firebase Console**, click the **gear icon** → "Project settings"
2. **Scroll down** to "Your apps"
3. **Click the web icon** `</>`
4. **App nickname**: `stock-dashboard-web`
5. **Don't check "Firebase Hosting"**
6. **Click "Register app"**
7. **Copy the config object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. Add Configuration to Your App

**Option A: Global Variable (Quick Setup)**

Edit `index.html` and add this before the other script tag:

```html
<script>
    // Set Firebase config globally
    window.__firebase_config = JSON.stringify({
        apiKey: "your-api-key",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "123456789",
        appId: "your-app-id"
    });
    window.__app_id = "stock-dashboard";
    
    // Set Finnhub API key
    window.STOCK_API_KEY = 'd379vepr01qskrefa3u0d379vepr01qskrefa3ug';
</script>
```

**Option B: Environment File (Recommended)**

Create `.env` file:
```bash
VITE_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}
VITE_APP_ID=stock-dashboard
VITE_API_KEY=d379vepr01qskrefa3u0d379vepr01qskrefa3ug
```

### 6. Test Firebase Integration

1. **Open**: `http://localhost:8000/index.html`
2. **Check console** for "Firebase initialized successfully"
3. **Search for a stock** (e.g., AAPL)
4. **Try "Add to Watchlist"** button
5. **Check that watchlist** shows up in left sidebar

## 🔧 Firestore Security Rules (Optional)

For production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own watchlist
    match /artifacts/{appId}/users/{userId}/watchlist/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 What Firebase Adds

- ✅ **User Authentication** (anonymous)
- ✅ **Watchlist Storage** (cloud database)
- ✅ **Real-time Sync** (across devices)
- ✅ **Offline Support** (cached data)

## 🐛 Troubleshooting

### "Invalid API Key" Error
- Double-check the Firebase config copy/paste
- Make sure all quotes are properly escaped in JSON

### "Insufficient Permissions" Error
- Check that Firestore is in "test mode"
- Verify Authentication is enabled with Anonymous sign-in

### "User Not Authenticated" Error
- Check browser console for Firebase auth errors
- Try refreshing the page

## ✅ Success Indicators

When working correctly, you should see:
- "Firebase initialized successfully" in console
- "User authenticated: [user-id]" in console
- Watchlist items can be added/removed
- Clicking watchlist items searches for that stock

## 📝 Next Steps

Once Firebase is working:
1. **Deploy to hosting** (Netlify, Vercel, Firebase Hosting)
2. **Add more features** (stock alerts, portfolios)
3. **Upgrade to production** Firestore rules
4. **Add user accounts** (email/password auth)

Need help? The app works great without Firebase - the watchlist is the only feature that requires it!