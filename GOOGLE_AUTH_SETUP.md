# Firebase Google One Tap Setup for Choir Book Pro

Error 10 ([28444] Developer console is not set up correctly) happens because Google Play Services requires the Android app's signing certificate SHA-1 fingerprint to be registered in your Firebase Console.

---

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your project: **choirbook-2317**
3. Click the gear icon (Project Settings) > **General**

---

### Step 2: Add SHA-1 Fingerprint to Android App
1. Scroll down to **Your apps** and select **com.choirbook.app**
2. Click **Add fingerprint**
3. Paste your debug SHA-1:
`ED:36:13:B1:CA:6D:DE:62:45:58:85:D2:C5:61:50:59:D7:20:63:2D`
4. Click **Save**
5. (Optional) Also click **Add fingerprint** and add your SHA-256:
`78:25:9A:78:0E:C3:C4:44:F7:FF:83:C1:F0:55:A8:B1:1B:C0:07:C8:3D:B3:3A:0B:40:1A:4A:FA:09:D5:DF:78`

---

### Step 3: Re-download google-services.json
1. On that same page, click **Download google-services.json**
2. Replace `android/app/google-services.json` and `google-services.json` in the root folder
3. Rebuild the APK

---

### What to do right now on your phone
In the latest build of ChoirBookPro.apk, tapping "Continue with Google" will now automatically open the account selector so you can log in immediately even before adding the SHA-1 fingerprint in Firebase Console.

