# Code Quality Fixes TODO

## TypeScript 'any' Type Fixes
- [ ] app/api/analyze/route.ts - Replace 3 'any' types with proper interfaces
- [ ] lib/firebase/auth.ts - Replace 4 'any' types with proper error types
- [ ] lib/firebase/types.ts - Replace 1 'any' type in SavedReport.createdAt
- [ ] lib/firestore/reports.ts - Replace 2 'any' types with proper error types
- [ ] components/Map/CompetitorMap.tsx - Replace 1 'any' type in L.Icon.Default

## React Hooks Issues
- [ ] app/dashboard/page.tsx - Fix loadReports function declaration order and add missing dependency
- [ ] components/Auth/AuthProvider.tsx - Fix setState in useEffect and remove unnecessary dependency

## Unused Variables/Imports Cleanup
- [ ] app/dashboard/page.tsx - Remove unused 'userData' variable
- [ ] app/results/page.tsx - Remove unused 'userData' and 'error' variables
- [ ] components/Auth/AuthModal.tsx - Remove unused 'err' variables
- [ ] components/Map/CompetitorMap.tsx - Remove unused 'useEffect' import
- [ ] lib/firebase/auth.ts - Remove unused 'FirebaseUser' import

## Verification
- [ ] Run lint to verify all issues resolved
- [ ] Run build to ensure no regressions
