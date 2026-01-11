# ✨ LuxeClean

LuxeClean is a premium, full-stack housekeeping and property management platform designed for high-end boutique cleaning services. It features a bespoke booking experience, an interactive admin/owner dashboard, and dedicated portals for cleaners and clients.

## 🚀 Key Features

- **Bespoke Booking Quiz**: A dynamic, multi-step booking flow that calculates quotes in real-time based on square footage, room count, and frequency.
- **Dedicated Portals**:
  - **Owner/Admin**: Full business visibility, schedule management, revenue tracking, and automated payroll.
  - **Cleaner**: Mobile-optimized view of upcoming jobs, check-in/out functionality, and earnings history.
  - **Client**: Easy rescheduling, payment management, and service history.
- **Smart Scheduling**: Automated job assignment and route optimization.
- **Integrated Payments**: Secure payment processing via Stripe.
- **Real-time Messaging**: Customer communication platform with automated notifications.

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/router/v1/docs/guide/start) (Full-stack React with type-safe routing)
- **Language**: TypeScript
- **Database**: PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM**: [Prisma](https://www.prisma.io/)
- **API**: [tRPC](https://trpc.io/) (End-to-end type safety)
- **Styling**: Tailwind CSS / Vanilla CSS
- **Authentication**: Supabase Auth (with custom auto-syncing)
- **Services**: Stripe (Payments), OpenPhone (Messaging - Mocked), Mercury (Banking - Mocked)

## 🌟 Portfolio Demo Mode

This project is optimized for showcasing as a zero-cost live portfolio. I have implemented several custom features to ensure a seamless experience for recruiters:

- **Mocked External APIs**: OpenPhone (SMS) and Mercury (Banking) are fully mocked. The app functions flawlessly without requiring live API keys or incurring costs.
- **OTP Bypass**: For the booking quiz, entering any phone number will provide a master bypass code (`123456`) to continue the flow without needing a real SMS.
- **Master Admin Password**: Recruiters can log in to *any* account in the database (Owner, Cleaner, or Client) using the password **`devadmin`**.
- **Auto-Syncing Auth**: New users created in the app database are automatically synced to Supabase Auth on their first login attempt, making the setup zero-maintenance.

## 🏁 Getting Started

### 1. Prerequisite
- Node.js (v20+)
- Supabase Account

### 2. Environment Setup
Create a `.env` file from the template and provide your keys. Several services are mocked for the portfolio demo, so you only need the critical Supabase keys to get started.

| Variable | Description | Portfolio Note |
| :--- | :--- | :--- |
| **DATABASE_URL** | PostgreSQL connection string | **Required** |
| **DIRECT_URL** | Direct connection string for migrations | **Required** |
| **VITE_SUPABASE_URL** | Your Supabase Project URL | **Required** |
| **VITE_SUPABASE_ANON_KEY** | Your Supabase Anon Key | **Required** |
| **SUPABASE_SERVICE_ROLE_KEY**| Service Role Key for Admin API | **Required** |
| **ADMIN_PASSWORD** | Master password for all accounts | Defaults to `devadmin` |
| **JWT_SECRET** | Secret for signing tokens | Any secure string |
| **STRIPE_SECRET_KEY** | Stripe Secret Key for payments | Optional (Mocked) |
| **VITE_STRIPE_PUBLISHABLE_KEY**| Stripe Publishable Key | Optional (Mocked) |
| **VITE_GOOGLE_PLACES_KEY** | Google Places API key | Optional (Mocked) |
| **OPENPHONE_API_KEY** | OpenPhone API for SMS/Voice | Optional (Mocked) |
| **MERCURY_API_KEY** | Mercury Banking API key | Optional (Mocked) |
| **SMTP_HOST** | Outgoing email server | Optional (Mocked) |

### 3. Database Initialization
Apply the schema and seed the default portfolio accounts:
```bash
# Apply Prisma models
npx prisma db push

# (Optional) Run the provided SQL in Supabase for default accounts
# owner@example.com / cleaner@example.com (Password: devadmin)
```

### 4. Run Locally
```bash
npm install
npm run dev
```

---
*Built with ❤️ for high-end service businesses.*
