# Deployment Checklist for Vercel

## ✅ Pre-Deployment Checklist

### Environment Variables
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` - Set in Vercel Dashboard
- [ ] `CENSUS_API_KEY` - Set in Vercel Dashboard
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Set if using Stripe
- [ ] `STRIPE_SECRET_KEY` - Set if using Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` - Set if using Stripe
- [ ] `STRIPE_PRICE_ID` - Set if using Stripe
- [ ] `NEXT_PUBLIC_APP_URL` - Set to your Vercel URL (optional, auto-detected)

### Firebase Configuration
- [ ] Authentication enabled (Email/Password and Google)
- [ ] Firestore database created
- [ ] Security rules deployed (see `firestore.rules`)
- [ ] Authorized domains include your Vercel domain

### Stripe Configuration (if using Pro tier)
- [ ] Stripe account created
- [ ] Product and Price created in Stripe Dashboard
- [ ] Webhook endpoint configured: `https://your-app.vercel.app/api/stripe/webhook`
- [ ] Webhook events subscribed:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### Code Review
- [ ] All TypeScript errors resolved
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in development
- [ ] All API routes tested locally

## 🚀 Deployment Steps

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "Add New..." → "Project"
   - Import your Git repository
   - Select the repository

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `local-opportunity-analyzer` (if in subdirectory)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Check build logs for errors

6. **Post-Deployment**
   - Update Firebase authorized domains with Vercel URL
   - Update Stripe webhook URL
   - Test all functionality
   - Monitor Vercel logs for errors

## 🧪 Testing After Deployment

### Free Tier
- [ ] Landing page loads
- [ ] Search form works
- [ ] Results page displays correctly
- [ ] Error handling works

### Authentication
- [ ] Sign up works
- [ ] Sign in works
- [ ] Google OAuth works
- [ ] User document created in Firestore

### Pro Tier (if configured)
- [ ] Checkout button works
- [ ] Stripe checkout redirects correctly
- [ ] Webhook receives events
- [ ] User upgraded to Pro
- [ ] Save report works
- [ ] Dashboard displays saved reports
- [ ] Map displays correctly
- [ ] PDF download works

### API Routes
- [ ] `/api/analyze` returns data
- [ ] `/api/stripe/create-checkout` creates session
- [ ] `/api/stripe/webhook` processes events

## 🔍 Troubleshooting

### Build Fails
- Check build logs in Vercel
- Verify all environment variables are set
- Check for TypeScript errors locally first

### API Routes Not Working
- Check Vercel function logs
- Verify environment variables are accessible
- Check CORS settings if needed

### Firebase Errors
- Verify Firebase config environment variables
- Check Firebase console for errors
- Verify authorized domains include Vercel URL

### Stripe Webhook Not Working
- Verify webhook URL in Stripe Dashboard
- Check webhook secret matches
- Review Vercel function logs
- Test with Stripe CLI locally first

## 📊 Monitoring

- **Vercel Analytics:** Enable in project settings
- **Function Logs:** View in Vercel Dashboard → Functions
- **Firebase Console:** Monitor Firestore and Auth usage
- **Stripe Dashboard:** Monitor webhook events and payments

