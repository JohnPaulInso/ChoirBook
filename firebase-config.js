// ============================================================
// FIREBASE CONFIG
// ============================================================
// 1. Go to https://console.firebase.google.com -> Add project (free tier is fine).
// 2. Inside the project: Build > Firestore Database > Create database (start in
//    production mode, pick any region close to you).
// 3. Build > Authentication > Sign-in method > enable "Google".
// 4. Project settings (gear icon) > General > "Your apps" > Add app > Web (</>) .
//    Copy the firebaseConfig object it gives you and paste the values below.
// 5. Firestore > Rules, replace with:
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /users/{userId}/data/{document=**} {
//            allow read, write: if request.auth != null && request.auth.uid == userId;
//          }
//        }
//      }
//    This keeps every user's songs private to their own Google account.
//
// Once the values below are filled in with your real project's config,
// the app automatically switches from local/offline storage to live
// Firebase sync the moment you sign in.

window.__FIREBASE_CONFIG__ = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Flips to true automatically once a real apiKey is detected, so the rest of
// the app knows whether Firebase is actually usable or still a placeholder.
window.__FIREBASE_CONFIGURED__ = window.__FIREBASE_CONFIG__.apiKey !== "YOUR_API_KEY";

if (window.__FIREBASE_CONFIGURED__ && typeof firebase !== 'undefined') {
  firebase.initializeApp(window.__FIREBASE_CONFIG__);
}
