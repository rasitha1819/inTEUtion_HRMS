# Firebase Setup Guide for HRMS

This guide walks you through setting up **Google Firebase** (Cloud Firestore & Firebase Authentication) to store your HRMS data in the cloud.

---

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"** (or **"Create a project"**).
3. Enter a project name (e.g., `my-hrms-app`) and click **Continue**.
4. (Optional) Disable or Enable Google Analytics according to your preference, then click **Create project**.
5. Once your project is ready, click **Continue**.

---

## Step 2: Register a Web App in Firebase

1. On the project overview page, click the **Web icon (`</>`)** to add a web app.
2. Enter an app nickname (e.g., `HRMS Web`).
3. (Optional) Check "Also set up Firebase Hosting" if desired, or leave unchecked.
4. Click **Register app**.
5. Firebase will display your **`firebaseConfig`** object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-hrms-app.firebaseapp.com",
     projectId: "my-hrms-app",
     storageBucket: "my-hrms-app.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```
6. Copy these values to your `frontend/.env` file:
   ```env
   VITE_DATA_SOURCE=firebase
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=my-hrms-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=my-hrms-app
   VITE_FIREBASE_STORAGE_BUCKET=my-hrms-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

---

## Step 3: Enable Firebase Authentication

1. In the Firebase console left sidebar, navigate to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, click **Email/Password**.
4. Enable the first toggle (**Email/Password**) and click **Save**.
5. Under the **Users** tab, click **Add user** to create your initial admin account:
   - **Email:** `admin@hrms.com`
   - **Password:** `Password@123` (or your chosen secure password)
   - Click **Add user**.

---

## Step 4: Create Cloud Firestore Database

1. In the left sidebar, navigate to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a database location close to your users (e.g., `nam5 (us-central)` or `asia-south1`).
4. Under Secure Rules, select **Start in production mode** (or **test mode** for development).
5. Click **Create** / **Enable**.

### Configure Firestore Security Rules:
Go to the **Rules** tab in Firestore Database and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write to HRMS collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Click **Publish**.

---

## Step 5: Seed Sample Data

1. Run the frontend (`npm run dev` in `frontend/` or open the deployed Netlify URL).
2. On the Login screen, click **"Seed Sample Data"** under the login form.
3. This automatically populates:
   - Initial Departments (Engineering, Human Resources, Product & Design, Sales, Finance)
   - Sample Employees with designations and contact info
   - Leave Types & standard quotas

You are now ready to log in and manage your HRMS data directly on Firebase!
