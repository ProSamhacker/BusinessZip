# Vercel Deployment Checklist

## ✅ Pre-Deployment Review

### 1. Environment Variables Required

Set these in Vercel Dashboard → Settings → Environment Variables:

**Firebase (Required):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Census API (Required):**
- `CENSUS_API_KEY`

**Stripe (Optional - for Pro tier):**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

**App URL (Optional - for Stripe redirects):**
- `NEXT_PUBLIC_APP_URL` (e.g., `https://your-app.vercel.app`)

### 2. Build Configuration

✅ **package.json** - Build scripts are correct:
- `build`: `next build`
- `start`: `next start`

✅ **next.config.ts** - Basic configuration (may need adjustments)

✅ **tsconfig.json** - TypeScript configuration is correct

### 3. API Routes Review

✅ **/api/analyze** - Server-side route, uses environment variables correctly

⚠️ **/api/stripe/webhook** - Needs Vercel-specific configuration for raw body

✅ **/api/stripe/create-checkout** - Server-side route, properly configured

### 4. Firebase Configuration

✅ **Client-side config** - Properly checks for `typeof window !== 'undefined'`

✅ **Server-side config** - Webhook route initializes Firebase correctly

### 5. Client-Side Components

✅ All components using `'use client'` directive where needed

✅ Dynamic imports for Leaflet (prevents SSR issues)

### 6. Static Files

✅ Public assets in `/public` directory

✅ Favicon included

## 🔧 Required Fixes for Vercel

### Fix 1: Webhook Route Body Configuration

Vercel requires special handling for webhook routes that need raw body access. The webhook route needs to be configured to accept raw body.

### Fix 2: Next.js Configuration

Add runtime configuration for better Vercel compatibility.

### Fix 3: Environment Variables Documentation

Ensure all required environment variables are documented.

## 📋 Deployment Steps

1. **Push to GitHub/GitLab/Bitbucket**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Configure project settings

3. **Set Environment Variables**
   - Add all required environment variables in Vercel Dashboard
   - Set for Production, Preview, and Development environments

4. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Test the deployed application

## ⚠️ Known Issues & Solutions

### Issue 1: Webhook Body Parsing
**Solution:** Vercel automatically handles raw body for webhook routes, but we need to ensure the route is configured correctly.

### Issue 2: Firebase Server-Side Initialization
**Solution:** Already handled - webhook route initializes Firebase separately.

### Issue 3: Environment Variables
**Solution:** All environment variables must be set in Vercel Dashboard before deployment.

### Issue 4: CORS Issues
**Solution:** Next.js API routes handle CORS automatically. External API calls (Census, Overpass) should work without issues.

## 🧪 Post-Deployment Testing

1. **Test Free Tier:**
   - Search functionality
   - Results display
   - Error handling

2. **Test Authentication:**
   - Sign up / Sign in
   - Google OAuth
   - User document creation

3. **Test Pro Features (if Stripe configured):**
   - Checkout flow
   - Webhook handling
   - Report saving
   - Map display
   - PDF download

4. **Test API Routes:**
   - `/api/analyze` - Test with sample zip code
   - `/api/stripe/create-checkout` - Test checkout creation
   - `/api/stripe/webhook` - Test webhook (use Stripe CLI for local testing)

## 📝 Additional Notes

- **Firebase Hosting:** If you prefer Firebase Hosting, you can use `firebase deploy` instead
- **Custom Domain:** Configure in Vercel Dashboard → Settings → Domains
- **Analytics:** Consider adding Vercel Analytics for monitoring
- **Edge Functions:** Consider using Vercel Edge Functions for better performance

