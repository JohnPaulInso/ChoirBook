# Setup Instructions for Firestore, Google Login, and GitHub

## 1. Firestore & Google Login Setup Guide

### Step A: Create a Firebase Project
1. Open https://console.firebase.google.com in your web browser.
2. Click **Add project** (or **Create a project**).
3. Enter your project name (e.g., `Choir Book`) and follow the steps.

### Step B: Create Firestore Database
1. In the left navigation menu, expand **Build** and click **Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** and select your closest location region.
4. Click **Enable**.

### Step C: Configure Security Rules
1. Inside your Firestore Database screen, click the **Rules** tab at the top.
2. Replace the existing rules with the following:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/data/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
3. Click **Publish**.

### Step D: Enable Google Authentication Provider
1. In the left navigation menu under **Build**, click **Authentication**.
2. Click **Get started** (if not already enabled).
3. Under the **Sign-in method** tab, click **Google** under Additional providers.
4. Toggle **Enable**.
5. Choose your **Project support email**.
6. Click **Save**.

### Step E: Fix "auth/unauthorized-domain" Error (Add 127.0.0.1)
1. Go to https://console.firebase.google.com and open project `choirbook-2317`.
2. Expand **Build** > **Authentication** in the left sidebar.
3. Click the **Settings** tab at the top.
4. Click **Authorized domains** in the menu.
5. Click **Add domain**.
6. Enter `127.0.0.1` and click **Save** / **Add**.
7. Refresh your browser at `http://127.0.0.1:5500` and click Sign in with Google again.

### Step F: Add SHA-1 Fingerprint for Android Google Login
1. Your local debug certificate SHA-1 fingerprint is:
   `A0:9C:B9:88:64:26:BA:E7:33:87:32:7D:29:A0:C7:AD:3E:7A:FD:1C`
2. Your SHA-256 fingerprint is:
   `13:E2:43:A9:B5:70:13:07:4E:2D:21:A7:30:DB:70:EC:19:68:4A:F8:DE:4C:74:B9:5F:C1:11:79:C6:A9:FB:D7`
3. Go to https://console.firebase.google.com > **Project Settings** (gear icon) > **General**.
4. Scroll down to your Android app (`com.choirbook.app`).
5. Click **Add fingerprint** and paste your SHA-1 fingerprint.
6. Click **Save**.
7. Download the updated `google-services.json` and place it in `android/app/google-services.json`.

---

## 2. GitHub Setup Guide

### Step A: Create GitHub Repository
1. Go to https://github.com/new.
2. Set Repository name to `ChoirBook`.
3. Choose Public or Private.
4. Do **NOT** check "Add a README file" or ".gitignore".
5. Click **Create repository**.

### Step B: Connect and Push using g.bat
1. Run `.\g.bat` in your project folder.
2. All files will automatically stage, commit with a timestamp, and push to the `main` branch on GitHub.
