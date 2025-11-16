# 🔧 Firebase Setup Guide

Follow these steps to set up Firebase for your Invoice Billing System.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `invoice-billing-system` (or your preferred name)
4. Click **Continue**
5. (Optional) Enable Google Analytics
6. Click **Create project**
7. Wait for the project to be created and click **Continue**

## Step 2: Register Your Web App

1. In the Firebase Console, click on the **Web icon** (</>)
2. Register app nickname: `Invoice Web App`
3. Check **"Also set up Firebase Hosting"** (optional)
4. Click **Register app**
5. **Copy the Firebase configuration object** - you'll need this for `.env.local`

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "invoice-billing-xxxxx.firebaseapp.com",
  projectId: "invoice-billing-xxxxx",
  storageBucket: "invoice-billing-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 3: Enable Authentication

1. In Firebase Console sidebar, click **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **Enable**
   - Click **Save**
5. Enable **Google**:
   - Click on "Google"
   - Toggle **Enable**
   - Enter project support email
   - Click **Save**

## Step 4: Set Up Firestore Database

1. In Firebase Console sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your **Cloud Firestore location** (e.g., asia-south1 for India)
5. Click **Enable**

### Update Security Rules (Important!)

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User document rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Company subcollection
      match /companies/{companyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Products subcollection
        match /products/{productId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Clients subcollection
        match /clients/{clientId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
        
        // Invoices subcollection
        match /invoices/{invoiceId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

## Step 5: Set Up Firebase Storage

1. In Firebase Console sidebar, click **Storage**
2. Click **Get started**
3. Choose **Start in test mode** (for development)
4. Click **Next**
5. Select your **Storage location** (same as Firestore)
6. Click **Done**

### Update Storage Rules

Replace the default rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 6: Configure Environment Variables

1. Open `.env.local` in your project
2. Fill in the values from Step 2:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=invoice-billing-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=invoice-billing-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=invoice-billing-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. **Save the file**
4. **Restart your development server**: `pnpm dev`

## Step 7: Verify Setup

1. Run the app: `pnpm dev`
2. Open http://localhost:3000
3. Try to register a new user
4. Check Firebase Console:
   - **Authentication** > **Users** (should show your test user)
   - **Firestore Database** (should see `users` collection)

## 🔒 Production Security Rules

Before deploying to production, update your Firestore and Storage rules:

### Firestore Production Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /companies/{companyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /{subcollection}/{docId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### Storage Production Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                  && request.auth.uid == userId
                  && request.resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}
```

## 📊 Optional: Create Firestore Indexes

For better query performance, create these indexes:

1. Go to **Firestore Database** > **Indexes**
2. Click **Create index**
3. Create the following composite indexes:

**Invoices Index:**
- Collection: `invoices`
- Fields:
  - `createdAt` (Descending)
  - `invoiceNumber` (Ascending)

**Products Index:**
- Collection: `products`
- Fields:
  - `productName` (Ascending)
  - `createdAt` (Descending)

## ✅ Setup Complete!

Your Firebase backend is now fully configured and ready to use with the Invoice Billing System.

Next steps:
- Continue with Phase 2: Project Structure & TypeScript Interfaces
- Test authentication flow
- Create your first company profile

## 🆘 Troubleshooting

**Issue: "Firebase config is invalid"**
- Double-check all environment variables are correct
- Ensure no extra spaces or quotes
- Restart dev server after changing .env.local

**Issue: "Permission denied" errors**
- Verify Firestore security rules are set correctly
- Check that user is authenticated
- Ensure userId matches in the request

**Issue: "Storage upload fails"**
- Verify Storage rules allow write access
- Check file size limits
- Ensure user is authenticated

For more help, visit [Firebase Documentation](https://firebase.google.com/docs)
