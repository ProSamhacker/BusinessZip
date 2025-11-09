# Local Opportunity Analyzer

A SaaS web application that provides instant insights on business viability for any US zip code by analyzing market demographics and competition data.

## Features

### Features
- ✅ Search by business type and zip code
- ✅ Get demographic data (population, median income)
- ✅ View competitor count
- ✅ Calculate opportunity score
- ✅ View detailed analysis reports
- ✅ Save and compare reports
- ✅ Interactive maps with competitor locations
- ✅ Download PDF reports
- ✅ Dashboard for saved reports
- 🔜 Radius-based search (coming soon)

## Tech Stack

- **Frontend:** Next.js 16 with TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **APIs:**
  - U.S. Census Bureau API (demographics)
  - OpenStreetMap Overpass API (competitor data)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication and database)
- Census Bureau API key ([Get one here](https://api.census.gov/data/key_signup.html))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd local-opportunity-analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Firebase configuration
   - Add your Census Bureau API key

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Census Bureau API Key
CENSUS_API_KEY=your_census_api_key
```

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password and Google sign-in
3. Create Firestore database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see `firestore.rules`)

## Project Structure

```
local-opportunity-analyzer/
├── app/
│   ├── api/
│   │   └── analyze/          # API route for analysis
│   ├── results/              # Results page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── lib/
│   ├── api/
│   │   ├── census.ts         # Census Bureau API integration
│   │   └── overpass.ts       # Overpass API integration
│   └── firebase/
│       ├── config.ts         # Firebase configuration
│       └── types.ts          # TypeScript types
└── public/                   # Static assets
```

## Development Roadmap

- [x] Phase 1: Setup & Core API
- [x] Phase 2: Free Tier UI
- [ ] Phase 3: Auth & Pro Tier Backend
- [ ] Phase 4: Pro Features

## License

MIT
