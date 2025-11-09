# Setup Guide - Local Opportunity Analyzer

This guide will walk you through setting up the Local Opportunity Analyzer application.

## Prerequisites

1. **Node.js 18+** and npm installed
2. **Firebase Account** - Create a project at [Firebase Console](https://console.firebase.google.com/)
3. **Census Bureau API Key** - Get one from [Census API Key Signup](https://api.census.gov/data/key_signup.html)
4. **Stripe Account** (optional, for Pro tier) - Create at [Stripe Dashboard](https://dashboard.stripe.com/)

## Step 1: Install Dependencies

```bash
cd local-opportunity-analyzer
npm install
```

## Step 2: Firebase Setup

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name and follow the setup wizard
4. Enable Google Analytics (optional)

### 2.2 Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider (optional but recommended)
   - Add your domain to authorized domains
   - Configure OAuth consent screen if needed

### 2.3 Create Firestore Database

1. Go to **Firestore Database** in Firebase Console
2. Click "Create database"
3. Start in **Production mode** (we'll add security rules)
4. Choose a location (preferably close to your users)
5. Click "Enable"

### 2.4 Set Up Security Rules

1. Go to **Firestore Database** > **Rules**
2. Copy the contents of `firestore.rules` from this project
3. Paste into the rules editor
4. Click "Publish"

### 2.5 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (`</>`) to add a web app
4. Register app with a nickname
5. Copy the Firebase configuration object

## Step 3: Environment Variables

1. Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Census Bureau API Key
CENSUS_API_KEY=your_census_api_key_here

# Stripe Keys (optional, for Pro tier)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

2. Fill in all the values from your Firebase project and Census API key

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test the Application

1. **Test Free Tier:**
   - Enter a business type (e.g., "Coffee Shop")
   - Enter a zip code (e.g., "90210")
   - Click "Analyze Opportunity"
   - View the results

2. **Test Authentication:**
   - Click "Sign Up Free" on the results page
   - Create an account or sign in with Google
   - Verify user document is created in Firestore

3. **Test Pro Features (if implemented):**
   - Upgrade to Pro tier (requires Stripe integration)
   - Save a report
   - View saved reports in Dashboard
   - Download PDF report
   - View interactive map

## Troubleshooting

### Census API Issues

- **Error: "Failed to fetch census data"**
  - Verify your Census API key is correct
  - Check that the zip code exists in Census database
  - Note: Census API uses ZCTA (Zip Code Tabulation Area), not all zip codes may be available

### Overpass API Issues

- **Error: "No competitors found"**
  - The zip code might not have any businesses of that type
  - Try a different business type or zip code
  - Overpass API may be rate-limited (wait a few seconds)

### Firebase Issues

- **Authentication not working**
  - Verify Firebase config in `.env.local`
  - Check that Authentication is enabled in Firebase Console
  - Verify authorized domains include localhost

- **Firestore errors**
  - Check security rules are published
  - Verify user is authenticated before accessing Firestore
  - Check browser console for specific error messages

### Map Not Loading

- **Leaflet map not displaying**
  - Check browser console for errors
  - Verify Leaflet CSS is imported (should be automatic)
  - Try refreshing the page

## Next Steps

1. **Deploy to Production:**
   - Deploy to Vercel, Netlify, or Firebase Hosting
   - Update environment variables in hosting platform
   - Update Firebase authorized domains

2. **Set Up Stripe (for Pro tier):**
   - Create products and prices in Stripe Dashboard
   - Set up webhook endpoints
   - Implement subscription management

3. **Add More Features:**
   - Radius-based search
   - Email reports
   - Export to CSV
   - Comparison tool for multiple locations

## Support

For issues or questions, check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Census Bureau API Documentation](https://www.census.gov/data/developers/data-sets.html)

