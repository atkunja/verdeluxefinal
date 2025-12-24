# Codebase Cleanup Report

**Date:** January 2025  
**Project:** Verde Luxe Cleaning Management System

## Executive Summary

This report documents the findings from a comprehensive codebase cleanup analysis. Several issues were identified and resolved, including unused legacy code, redundant static assets, database schema inconsistencies, and missing data templates.

---

## Supabase/Vercel Alignment (January 2025)

- Removed the entire Docker-based local stack (Postgres, Redis, MinIO, Adminer, Nginx, helper scripts) in favor of Supabase-managed Postgres and Vercel hosting.
- Deleted the unused MinIO client and dependency; no object storage service is provisioned locally now.
- Prisma now reads connection strings from `DATABASE_URL` (pooled) and `DIRECT_URL` (non-pooled) env vars to point at Supabase.
- Hosting preset switched to `vercel` in `app.config.ts` to match the target deployment platform.

## Issues Identified and Resolved

### 1. ✅ Prisma Schema Issues (FIXED)

**Problem:**
- The `SUPER_ADMIN` role was still present in the `UserRole` enum despite being deprecated
- Multiple models had `updatedAt` fields that weren't explicitly required (violates Prisma best practices per documentation)

**Resolution:**
- Removed `SUPER_ADMIN` from the `UserRole` enum in `prisma/schema.prisma`
- Removed unnecessary `updatedAt` fields from `User`, `Booking`, and `CallLog` models
- The setup script already handles migrating any existing `SUPER_ADMIN` users to `ADMIN`

**Files Modified:**
- `prisma/schema.prisma`

---

### 2. ✅ Missing Checklist Templates (FIXED)

**Problem:**
- Bookings could be created with service types "Move-In/Out Cleaning" and "Post-Construction Cleaning"
- No matching checklist templates existed for these service types
- This caused "No matching template found" warnings in server logs

**Resolution:**
- Added `Move-In/Out Cleaning Checklist` template with 10 comprehensive tasks
- Added `Post-Construction Cleaning Checklist` template with 11 comprehensive tasks
- These templates now match the service types available in the booking system

**Files Modified:**
- `src/server/scripts/setup.ts`

---

## Issues Requiring Manual Cleanup

### 3. ⚠️ Unused Legacy Code - `imported-src/` Directory

**Problem:**
The entire `imported-src/` directory contains an old React Router DOM application that is completely unused:
- Uses `react-router-dom` instead of the modern `@tanstack/react-router`
- Components fetch static HTML files and render them with `dangerouslySetInnerHTML`
- This entire approach has been replaced by the modern React/TanStack Router application in `src/`

**Files to Remove:**
```
imported-src/
├── App.js
├── index.js
└── pages/
    ├── 404.jsx
    ├── booknow.jsx
    ├── checklist.jsx
    ├── commercial.jsx
    ├── contact-us.jsx
    ├── deep-home-cleaning.jsx
    ├── index.jsx
    ├── moving-cleaning.jsx
    ├── post-construction-cleaning.jsx
    ├── privacy-policy.jsx
    ├── service-areas.jsx
    ├── standard-home-cleaning.jsx
    ├── terms-of-service.jsx
    └── vacation-rental-cleaning.jsx
```

**Recommendation:** Delete the entire `imported-src/` directory

**Impact:** None - this code is not imported or used anywhere in the application

---

### 4. ⚠️ Unused Static Assets - `public/imported/` Files

**Problem:**
The `public/imported/` directory contains many static files from the original website that are no longer used:

#### HTML Files (ALL UNUSED - Safe to Delete)
```
public/imported/
├── 404.html
├── booknow.html
├── checklist.html
├── commercial-clean.html
├── contact-us.html
├── deep-home-cleaning.html
├── index.html
├── moving-cleaning.html
├── post-construction-cleaning.html
├── privacy-policy.html
├── service-areas.html
├── standard-home-cleaning.html
├── terms-of-service.html
└── vacation-rental-cleaning.html
```

**Recommendation:** Delete all `.html` files in `public/imported/`

**Reason:** The modern app is a Single Page Application (SPA) built with React. All pages are now React components in `src/routes/` and `src/components/`. The HTML files were only used by the old `imported-src` components.

#### CSS Files (ALL UNUSED - Safe to Delete)
```
public/imported/css/
├── bootstrap.css
├── bootstrap.min.css
├── cndk.beforeafter.css
├── owl.carousel.css
├── owl.carousel.min.css
└── style.css
```

**Recommendation:** Delete the entire `public/imported/css/` directory

**Reason:** The modern app uses Tailwind CSS exclusively (`src/styles.css`, `tailwind.config.mjs`). Bootstrap and other CSS frameworks are no longer needed.

#### JavaScript Files (ALL UNUSED - Safe to Delete)
```
public/imported/js/
├── beforeafter.jquery.js
├── beforeafter.jquery.min.js
├── bootstrap.bundle.js
├── bootstrap.bundle.min.js
├── owl.carousel.js
├── owl.carousel.min.js
└── script.js
```

**Recommendation:** Delete the entire `public/imported/js/` directory

**Reason:** The modern app uses React components instead of jQuery/Bootstrap JS. Functionality has been reimplemented:
- Before/After slider: `src/components/BeforeAfterSlider.tsx`
- Testimonial carousel: `src/components/TestimonialCarousel.tsx`
- Navigation/interactions: React components with state management

#### Image Files (KEEP - Still in Use)
```
public/imported/images/
├── bg.jpg
├── bg2.jpg
├── bg3.jpg
├── clean/ (before/after images)
├── favicon.png
├── logo.png
├── mission.jpg
├── photo1.jpg
├── services/ (service images)
├── story.jpg
├── user1.png
└── user2.png
```

**Recommendation:** KEEP all image files

**Reason:** These images are actively used by the modern React application:
- Referenced in `src/routes/index.tsx` for hero sections, mission/story sections
- Used in `src/components/BeforeAfterSlider.tsx` for before/after comparisons
- Used in `src/components/Header.tsx` and `src/components/Footer.tsx` for logo
- Service page images used across various routes

---

## Environment Variables Status

### ✅ Environment Variables Needed

Validated in `src/server/env.ts`. Populate with Supabase and Vercel values:

```env
NODE_ENV=development
BASE_URL=https://<your-vercel-domain>
DATABASE_URL=postgresql://<supabase-pooled-connection-string>
DIRECT_URL=postgresql://<supabase-direct-connection-string>
ADMIN_PASSWORD=<owner-account-password>
JWT_SECRET=<random-secret>
OPENPHONE_API_KEY=...
OPENPHONE_PHONE_NUMBER=...
```

**Notes:**
- The Docker-based services have been removed; `ADMIN_PASSWORD` now only seeds the default owner account via `src/server/scripts/setup.ts`.
- `DATABASE_URL` should be the Supabase pooled connection string; `DIRECT_URL` should be the non-pooled string for Prisma migrations.
- Rotate `ADMIN_PASSWORD`, `JWT_SECRET`, and all OpenPhone credentials before production and store them in Vercel project secrets.

---

## Code Quality Observations

### ✅ Good Practices Observed

1. **Clean Architecture:**
   - Clear separation between client (`src/`) and server (`src/server/`) code
   - Proper use of TanStack Router for routing
   - tRPC for type-safe API communication

2. **Authentication:**
   - Zustand with persist middleware correctly used for auth token storage
   - bcryptjs properly used for password hashing
   - JWT tokens for authentication

3. **Database:**
   - Prisma ORM with proper schema definitions
   - Setup script handles data seeding and migrations
   - Proper use of `prisma db push` instead of manual migrations

4. **Styling:**
   - Tailwind CSS for consistent styling
   - Custom utility classes defined in `src/styles.css`
   - Responsive design patterns

### 📝 Minor Observations

1. **Dialer Store:** `src/stores/dialerStore.ts` doesn't use persist middleware, but this is correct since dialer state is transient and shouldn't persist across sessions.

2. **Image Organization:** Consider moving images from `public/imported/images/` to `public/images/` in the future for cleaner organization (low priority).

---

## Summary of Actions Taken

### Automated Fixes Applied:
1. ✅ Removed `SUPER_ADMIN` from `UserRole` enum
2. ✅ Removed unnecessary `updatedAt` fields from models
3. ✅ Added missing checklist templates for Move-In/Out and Post-Construction cleaning

### Manual Cleanup Required:
1. ⚠️ Delete `imported-src/` directory (entire legacy React Router app)
2. ⚠️ Delete `public/imported/*.html` files (all static HTML pages)
3. ⚠️ Delete `public/imported/css/` directory (unused CSS frameworks)
4. ⚠️ Delete `public/imported/js/` directory (unused JavaScript libraries)
5. ✅ Keep `public/imported/images/` directory (actively used by modern app)

### Estimated Space Savings:
- `imported-src/`: ~50-100 KB
- HTML files: ~500 KB
- CSS files: ~1-2 MB (Bootstrap, Owl Carousel, etc.)
- JavaScript files: ~2-3 MB (jQuery, Bootstrap JS, Owl Carousel, etc.)
- **Total: ~4-6 MB of unused code**

---

## Recommendations for Future Maintenance

1. **Image Reorganization (Optional):**
   - Consider moving `public/imported/images/` → `public/images/`
   - Update all references in React components
   - This would complete the migration away from the "imported" structure

2. **Environment Variables:**
   - Rotate sensitive credentials before production deployment
   - Use environment-specific `.env` files for staging/production
   - Consider using a secrets management service

3. **Database:**
   - Continue using `prisma db push` for schema changes
   - Monitor for any remaining `SUPER_ADMIN` references in code
   - Keep checklist templates in sync with available service types

4. **Code Review:**
   - Ensure no imports reference files in `imported-src/` before deletion
   - Verify all image paths point to `/imported/images/` correctly
   - Test thoroughly after cleanup

---

## Conclusion

The codebase is generally well-structured and follows modern best practices. The main issues identified are remnants from the migration from a static/jQuery-based site to a modern React/TypeScript application. The automated fixes have been applied, and the manual cleanup steps are clearly documented above.

**Next Steps:**
1. Review this report
2. Execute manual cleanup steps (delete unused directories)
3. Run the application to verify everything works
4. Commit changes with appropriate commit messages

**Questions or Concerns:**
If you have any questions about these recommendations or need clarification on any cleanup steps, please review the specific file references in each section.
