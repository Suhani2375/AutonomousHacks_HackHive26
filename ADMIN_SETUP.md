# How to Add Admin User in Firestore

## Method 1: Using the "Sign in as Admin" Button (Easiest)

1. Go to the login page
2. Click the **"Sign in as Admin"** button (orange button below Sign In)
3. The system will automatically:
   - Create the Firebase Authentication account (if it doesn't exist)
   - Create the Firestore document with admin role
   - Log you in and redirect to Admin Dashboard

**Default Credentials:**
- Email: `admin@cleancity.gov`
- Password: `admin123456`

---

## Method 2: Manual Setup in Firebase Console

### Step 1: Create User in Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"**
5. Enter:
   - **Email**: `admin@cleancity.gov` (or your preferred admin email)
   - **Password**: `admin123456` (or your preferred password)
6. Click **"Add user"**
7. **Copy the User UID** (you'll need this in the next step)

### Step 2: Create Document in Firestore

1. Go to **Firestore Database** in Firebase Console
2. Navigate to the **`users`** collection
3. Click **"+ Add document"**
4. Set the **Document ID** to the **User UID** you copied from Step 1
5. Add the following fields:

| Field Name | Type | Value |
|------------|------|-------|
| `createdAt` | timestamp | Current date/time (click the clock icon) |
| `email` | string | `admin@cleancity.gov` (or your admin email) |
| `name` | string | `Admin User` (or your preferred name) |
| `username` | string | `admin` |
| `points` | number | `0` |
| `role` | string | `admin` ⚠️ **IMPORTANT: Must be "admin"** |
| `status` | string | `approved` ⚠️ **IMPORTANT: Must be "approved"** |
| `totalCleaned` | number | `0` |
| `totalReports` | number | `0` |

6. Click **"Save"**

---

## Method 3: Update Existing User to Admin

If you already have a user and want to make them an admin:

1. Go to **Firestore Database** → **`users`** collection
2. Click on the user document you want to make admin
3. Click **"+ Add field"** or edit existing fields:
   - Set `role` field to: `admin`
   - Set `status` field to: `approved`
4. Click **"Update"**

---

## Verification

After creating the admin user:

1. Log out if you're currently logged in
2. Go to the login page
3. Either:
   - Use the **"Sign in as Admin"** button, OR
   - Sign in with the admin email and password manually
4. You should be redirected to `/admin/dashboard`

---

## Important Notes

- The `role` field **must** be exactly `"admin"` (lowercase, no spaces)
- The `status` field should be `"approved"` for the admin to have full access
- The Document ID in Firestore **must match** the User UID from Firebase Authentication
- You can change the default admin email/password in `src/pages/Login.jsx` in the `handleAdminLogin` function

---

## Troubleshooting

**If admin login doesn't work:**
1. Check that the `role` field is exactly `"admin"` (case-sensitive)
2. Check that the `status` field is `"approved"`
3. Verify the User UID in Authentication matches the Document ID in Firestore
4. Check browser console for any error messages
