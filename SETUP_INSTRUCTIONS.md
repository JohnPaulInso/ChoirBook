# Setup Instructions for Firestore and GitHub

## 1. Firestore Setup Guide

### Step A: Create a Firebase Project
1. Open https://console.firebase.google.com in your web browser.
2. Click **Add project** (or **Create a project**).
3. Enter your project name (e.g., `Choir Book Pro`) and follow the steps (Google Analytics is optional).

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

### Step D: Enable Google Authentication
1. In the left navigation menu under **Build**, click **Authentication**.
2. Click **Get started**.
3. Select **Google** under Additional providers.
4. Toggle **Enable**, choose your support email, and click **Save**.

### Step E: Copy Firebase Config
1. Click the gear icon next to **Project Overview** in the top left and select **Project settings**.
2. Scroll down to **Your apps** section and click the Web icon (`</>`).
3. Enter an app nickname (e.g., `Choir Book Pro Web`) and click **Register app**.
4. Copy the `firebaseConfig` keys (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
5. Open `firebase-config.js` in your project editor and replace the placeholder strings with your actual keys.

---

## 2. GitHub Setup Guide

### Step A: Create GitHub Repository
1. Go to https://github.com/new.
2. Set Repository name to `ChoirBookPro` (or your preferred repository name).
3. Choose Public or Private.
4. Do **NOT** check "Add a README file" or ".gitignore" (these are already present in your project).
5. Click **Create repository**.

### Step B: Connect and Push using g.bat
1. If your GitHub repository URL matches `https://github.com/JohnPaulInso/ChoirBookPro.git`, you are ready to push.
2. If your repository URL is different, open `g.bat` and update line 42 with your GitHub repository URL.
3. Open terminal or command prompt in your project folder.
4. Run `.\g.bat` (or double click `g.bat` in File Explorer).
5. All files will automatically stage, commit with a timestamp, and push to the `main` branch on GitHub.
