# TODO: Fix Redirect Loop and Radius Input Bug

## Tasks
- [x] app/page.tsx: Change radiusMiles state to string (line 11)
- [x] app/page.tsx: Change onChange handler to set string directly (line 144)
- [x] app/results/page.tsx: Add address and radius variables from searchParams (around line 29)
- [x] app/results/page.tsx: Update useEffect validation to check for either zipCode or address (line 32)
- [x] app/results/page.tsx: Update fetch body to send correct data (around line 39)
- [x] app/results/page.tsx: Add address and radius to useEffect dependency array (line 51)
- [x] app/results/page.tsx: Make reportName dynamic (line 104)
- [x] app/results/page.tsx: Make searchQuery object dynamic (line 107)
- [x] app/results/page.tsx: Update header text to show address or zip code (line 85)
- [x] app/results/page.tsx: Update PDF filename to handle address searches (line 125)
- [x] app/results/page.tsx: Update PDF location parameter to handle address (line 127)
- [x] lib/utils/pdf.ts: Update function signature to accept location instead of zipCode
- [x] lib/utils/pdf.ts: Update PDF text to use location parameter
- [x] lib/utils/pdf.ts: Update interpretation text to say "area" instead of "zip code"
- [x] app/dashboard/page.tsx: Update location display to show "Zip Code" or "Near" based on type
