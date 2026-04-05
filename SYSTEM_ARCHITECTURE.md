# OneStopBook - System Architecture Documentation

> A comprehensive sports facility booking platform with real-time availability, user authentication, and admin management.

**Last Updated:** April 5, 2026  
**Project:** OneStopBook  
**Tech Stack:** Next.js 14 • TypeScript • Supabase • Tailwind CSS • React 18

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Directory Structure](#directory-structure)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)
8. [API Endpoints](#api-endpoints)
9. [Component Hierarchy](#component-hierarchy)
10. [State Management](#state-management)
11. [Real-time Features](#real-time-features)
12. [Booking Flow](#booking-flow)
13. [Time Slot Management](#time-slot-management)
14. [Deployment & Infrastructure](#deployment--infrastructure)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER INTERFACE LAYER                       │
│  (Next.js 14 Frontend - SSR + Client Components)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │   Public Pages   │  │  User Dashboard  │  │  Admin Panel     ││
│  │  • Homepage      │  │  • Bookings      │  │  • Services      ││
│  │  • Facility      │  │  • Credits       │  │  • Alerts        ││
│  │    Details       │  │  • Profile       │  │  • Users         ││
│  │  • Login         │  │  • Notifications │  │  • Bookings      ││
│  └──────────────────┘  └──────────────────┘  └──────────────────┘│
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT LAYER                        │
│  (React Hooks + Client-side Supabase Queries)                   │
│  • useAuth (Authentication state)                               │
│  • useBookings (User bookings)                                  │
│  • useFacilities (Real-time facility updates)                   │
│  • useCredits (User credits)                                    │
│  • useNotifications (Real-time notifications)                   │
├─────────────────────────────────────────────────────────────────┤
│                    API & SERVER LAYER                            │
│  (Next.js Server Components + API Routes)                        │
│  • App Router (SSR pages)                                       │
│  • Server Actions (RPC-like API calls)                          │
│  • API Routes (/api/cron/*)                                     │
│  • Authentication Routes (/auth/callback)                       │
├─────────────────────────────────────────────────────────────────┤
│                  MIDDLEWARE & AUTH LAYER                         │
│  (Next.js Middleware - Edge Runtime)                            │
│  • Session validation                                            │
│  • Cookie management                                             │
│  • Protected route enforcement                                   │
├─────────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                                │
│  (Supabase PostgreSQL)                                           │
│  • Tables: profiles, facilities, time_slots, bookings,          │
│    alerts, notifications, reviews, credits                      │
│  • Row Level Security (RLS) policies                            │
│  • Realtime subscriptions                                        │
│  • Storage bucket (facility images)                             │
├─────────────────────────────────────────────────────────────────┤
│               BACKGROUND JOBS & CRON LAYER                       │
│  • Daily time slot generation (rolling 14-day window)           │
│  • External cron triggers (EasyCron, Vercel Crons)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 with App Router (SSR + Static Generation)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 3.4
- **UI Components:** Custom components + Lucide React icons
- **State:** React hooks + Supabase client subscriptions

### Backend
- **Runtime:** Node.js (Next.js server)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (OAuth2 + JWT)
- **Storage:** Supabase Storage (S3-compatible)
- **Realtime:** Supabase Realtime subscriptions

### Infrastructure
- **Hosting:** Vercel (or self-hosted)
- **Database Host:** Supabase Cloud
- **Cron Jobs:** Vercel Crons / EasyCron

### Key Dependencies
```json
{
  "@supabase/ssr": "^0.10.0",           // SSR auth helpers
  "@supabase/supabase-js": "^2.101.1",  // Supabase client
  "next": "14.2.35",                    // Next.js framework
  "react": "^18",                       // UI library
  "date-fns": "^4.1.0",                 // Date manipulation
  "tailwindcss": "^3.4.1"               // CSS framework
}
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│  auth.users │ ──1──∞──│  profiles   │
└─────────────┘         └─────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────┴─────┐         ┌─────┴──────┐      ┌──────┴──────┐
    │ bookings  │         │  reviews   │      │ credits     │
    └────┬─────┘         └─────┬──────┘      └──────┬──────┘
         │                     │                    │
    ┌────┴─────┐         ┌─────┴──────┐      ┌──────┴──────┐
    │facilities │◄────────│   (FK)     │      │   (FK)      │
    └────┬─────┘         └────────────┘      └─────────────┘
         │
    ┌────┴──────────┐
    │  time_slots   │
    └───────────────┘

┌──────────────────┐
│  notifications   │ ──∞──┬──► profiles (user_id)
└──────────────────┘      └──► bookings (booking_id)

┌────────┐
│ alerts │ ──∞──► facilities (facility_id)
└────────┘
```

### Core Tables

#### 1. **profiles**
```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name       TEXT,
  avatar_url      TEXT,
  phone           TEXT,
  is_admin        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** User profile information
- **Key Fields:** `is_admin` determines access level
- **RLS:** Users can read own; admins can read all

#### 2. **facilities**
```sql
CREATE TABLE facilities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  category            TEXT CHECK (category IN ('outdoor', 'indoor', 'service')),
  surface_type        TEXT,
  capacity            INT,
  price_per_hour      NUMERIC NOT NULL,
  slot_duration_hours NUMERIC,
  images              TEXT[],
  status              TEXT CHECK (status IN ('open', 'delayed', 'closed')) DEFAULT 'open',
  rules               TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** Sports facility definitions
- **Categories:** outdoor (football, tennis), indoor (basketball, badminton), service (laundry)
- **RLS:** Public read; admins manage

#### 3. **time_slots**
```sql
CREATE TABLE time_slots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id  UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** Booking availability windows (1-hour blocks)
- **Strategy:** Pre-generated in rolling 14-day window
- **RLS:** Public read; admins + service role manage

#### 4. **bookings**
```sql
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id),
  facility_id     UUID REFERENCES facilities(id),
  slot_id         UUID REFERENCES time_slots(id),
  status          TEXT CHECK (status IN ('confirmed', 'cancelled', 'delayed', 'completed')),
  total_amount    NUMERIC NOT NULL,
  payment_status  TEXT CHECK (payment_status IN ('paid', 'pending', 'refunded', 'credited')),
  payment_method  TEXT,
  booking_ref     TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** User bookings with payment tracking
- **booking_ref:** Unique reference code for user identification
- **RLS:** Users read own; admins read all

#### 5. **notifications**
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id),
  booking_id    UUID REFERENCES bookings(id),
  title         TEXT NOT NULL,
  message       TEXT NOT NULL,
  type          TEXT CHECK (type IN ('confirmation', 'reminder_day', 'reminder_5hr', 'disruption', 'reschedule', 'credit')),
  is_read       BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** Real-time user notifications
- **Types:** confirmation, reminders, disruptions, rescheduling notifications
- **Realtime:** Subscribed by client for push-like behavior

#### 6. **alerts**
```sql
CREATE TABLE alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  alert_type  TEXT CHECK (alert_type IN ('weather', 'maintenance', 'emergency', 'operational')),
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** Admin announcements for facilities
- **Public:** All users see active alerts

#### 7. **reviews**
```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  facility_id UUID REFERENCES facilities(id),
  booking_id  UUID REFERENCES bookings(id),
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** User ratings and feedback
- **Constraint:** Only allow reviews for completed bookings

#### 8. **credits**
```sql
CREATE TABLE credits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id),
  amount     NUMERIC NOT NULL,
  reason     TEXT,
  booking_id UUID REFERENCES bookings(id),
  is_used    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **Purpose:** User wallet/credit system
- **Use Case:** Cancellations, refunds, promotions

### Row Level Security (RLS) Policies

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| profiles | Users read own; Admins read all | Service role | Users update own; Admins | Users delete own |
| facilities | Public | Admins only | Admins only | Admins only |
| time_slots | Public | Admins; Service role | Admins; Service role | Admins |
| bookings | Users read own; Admins read all | Users create own; Service role | Admins; Service role | Admins |
| alerts | Public | Admins; Service role | Admins; Service role | Admins |
| notifications | Users read own | Service role | Users update own; Service role | - |
| reviews | Public | Users create own | Admins | Admins |
| credits | Users read own | Service role | Service role | - |

---

## Directory Structure

```
OneStopBooking/
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Root layout with Navbar
│   ├── page.tsx                        # Homepage (SSR)
│   ├── globals.css                     # Global Tailwind styles
│   │
│   ├── admin/                          # Admin dashboard (protected)
│   │   ├── layout.tsx                  # Admin layout with sidebar
│   │   ├── page.tsx                    # Admin dashboard overview
│   │   ├── alerts/
│   │   │   ├── page.tsx                # Alert management UI
│   │   │   └── actions.ts              # Alert server actions
│   │   ├── bookings/
│   │   │   ├── page.tsx                # Booking management table
│   │   │   └── actions.ts              # Booking operations
│   │   ├── services/                   # Facility management
│   │   │   ├── page.tsx                # Services list
│   │   │   ├── new/
│   │   │   │   └── page.tsx            # New service form
│   │   │   ├── [id]/
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx        # Edit service form
│   │   │   └── actions.ts              # Service CRUD operations + time slot generation
│   │   └── users/
│   │       └── page.tsx                # User management
│   │
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                # OAuth callback handler
│   │
│   ├── booking/
│   │   └── [id]/
│   │       └── page.tsx                # Booking details page
│   │
│   ├── dashboard/                      # User dashboard (protected)
│   │   ├── page.tsx                    # Dashboard overview
│   │   └── actions.ts                  # Dashboard data operations
│   │
│   ├── facilities/                     # Facility browsing
│   │   ├── [id]/
│   │   │   ├── page.tsx                # Facility detail + booking flow
│   │   │   └── actions.ts              # Booking operations
│   │   └── (layout with detail view)
│   │
│   ├── login/
│   │   ├── page.tsx                    # Login page
│   │   └── actions.ts                  # Auth actions
│   │
│   ├── fonts/                          # Custom fonts
│   │
│   └── api/
│       └── cron/
│           └── generate-slots/
│               └── route.ts            # Daily slot generation endpoint
│
├── components/                         # Reusable React components
│   ├── HomepageClient.tsx              # Homepage client component
│   ├── admin/
│   │   ├── AlertForm.tsx               # Alert creation/edit form
│   │   ├── AlertsPageClient.tsx        # Alerts page wrapper
│   │   ├── BookingsTable.tsx           # Bookings data table
│   │   ├── ServiceForm.tsx             # Facility form with image upload
│   │   └── StatsGrid.tsx               # Admin stats display
│   ├── booking/
│   │   ├── CalendarPicker.tsx          # Date selection calendar
│   │   └── SlotPicker.tsx              # Time slot selection
│   ├── dashboard/
│   │   ├── BookingList.tsx             # User's bookings list
│   │   ├── CreditList.tsx              # Credit/wallet display
│   │   ├── NotificationList.tsx        # User notifications
│   │   ├── ProfileCard.tsx             # User profile info
│   │   └── UpcomingBookingsStrip.tsx   # Quick upcoming view
│   ├── facilities/
│   │   ├── FacilityCard.tsx            # Card for facility list
│   │   ├── FacilityDetailClient.tsx    # Facility detail + booking UI
│   │   ├── FacilityGrid.tsx            # Grid of facilities
│   │   └── FacilityDetailClient.tsx    # Full facility detail page
│   ├── layout/
│   │   ├── AdminSidebar.tsx            # Admin panel sidebar
│   │   ├── AlertBar.tsx                # Global alert banner
│   │   ├── MobileNav.tsx               # Mobile navigation
│   │   └── Navbar.tsx                  # Top navigation
│   ├── payment/
│   │   └── PaymentForm.tsx             # Payment processing form
│   └── ui/
│       ├── Badge.tsx                   # Status badges
│       ├── Button.tsx                  # Reusable button
│       ├── Card.tsx                    # Card container
│       ├── Input.tsx                   # Form input
│       ├── Modal.tsx                   # Modal dialog
│       └── Skeleton.tsx                # Loading skeleton
│
├── hooks/                              # Custom React hooks
│   ├── useAuth.ts                      # Authentication state hook
│   ├── useBookings.ts                  # User bookings with real-time
│   ├── useCredits.ts                   # User credits hook
│   ├── useFacilities.ts                # Facilities with real-time updates
│   └── useNotifications.ts             # Real-time notifications
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client + service role
│   │   └── middleware.ts               # Session validation middleware
│   ├── types/
│   │   └── database.ts                 # TypeScript types for DB entities
│   └── utils/
│       ├── cn.ts                       # Tailwind class merger
│       ├── formatters.ts               # Date/currency formatting
│       ├── booking-ref.ts              # Booking reference generator
│       └── generate-slots.ts           # Time slot generation utility
│
├── supabase/
│   ├── schema.sql                      # Database schema definition
│   └── seed.sql                        # Initial seed data
│
├── middleware.ts                       # Next.js middleware
├── next.config.mjs                     # Next.js configuration
├── tsconfig.json                       # TypeScript configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── postcss.config.mjs                  # PostCSS configuration
├── .eslintrc.json                      # ESLint configuration
├── package.json                        # Project dependencies
├── package-lock.json                   # Dependency lock file
├── .env.local                          # Environment variables (local)
├── .env.local.example                  # Environment template
├── .gitignore                          # Git ignore rules
└── README.md                           # Project documentation
```

---

## Authentication & Authorization

### Auth Flow

```
1. USER VISITS SITE
   ↓
2. MIDDLEWARE RUNS
   └─ Checks session cookie
   └─ Validates JWT with Supabase
   └─ Refreshes token if needed
   ↓
3a. AUTHENTICATED           3b. NOT AUTHENTICATED
    ├─ Continue to page         └─ Redirect to /login
    └─ Set auth context
       ├─ User object
       └─ Profile (is_admin)
    
4. PROTECTED ROUTES
   ├─ /dashboard/* → Users only
   ├─ /admin/* → Admins only
   └─ /login → Redirect if already auth'd
```

### Session Management

**Server-Side Session:**
- Stored in HTTP-only cookies
- Validated on every request via middleware
- Automatically refreshed by Supabase SSR helper

**Client-Side Auth State:**
```typescript
// From useAuth hook
{
  user: User | null,           // Supabase Auth user
  profile: Profile | null,     // User profile from DB
  loading: boolean,            // Initial load state
  isAdmin: boolean             // Quick admin check
}
```

### Authorization Levels

| Level | Access |
|-------|--------|
| **Public** | Homepage, facility details, auth pages |
| **Authenticated** | Dashboard, bookings, profile |
| **Admin** | Admin panel, create/edit facilities, manage users |

### Implementation

**Middleware (`middleware.ts`):**
```typescript
- Runs on all routes
- Validates/refreshes session
- Ensures cookies are up-to-date
```

**Protected Routes:**
```typescript
// Example: Admin-only page
'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  
  if (!profile?.is_admin) redirect('/');
  
  // Render admin content
}
```

---

## Data Flow

### 1. Facility Browsing Flow

```
USER VISITS HOMEPAGE
        ↓
[Server Component: page.tsx]
├─ Call: supabase.from('facilities').select('*')
├─ Call: supabase.from('alerts').select('*').eq('is_active', true)
└─ Pass to: <HomepageClient />
        ↓
[Client Component: HomepageClient]
├─ Display: Facility cards grid
├─ Display: Active alert banner
└─ On Click: Navigate to /facilities/{id}
        ↓
[Server Component: facilities/[id]/page.tsx]
├─ Fetch: facility details
├─ Fetch: reviews for facility
├─ Fetch: time_slots where date >= today
└─ Pass to: <FacilityDetailClient />
        ↓
[Client Component: FacilityDetailClient]
├─ Display: Facility info, images, rules
├─ Render: <CalendarPicker /> (select date)
├─ Render: <SlotPicker /> (select time)
└─ On Proceed: Show payment form
```

### 2. Booking Flow

```
USER SELECTS SLOT
        ↓
[Client: SlotPicker]
├─ Update: selectedSlot state
├─ Show: Proceed button
└─ On Click: setStep('payment')
        ↓
[Router: Replace URL with ?step=payment&slotId=...]
        ↓
[Server: Fetch slot details from URL params]
        ↓
[Client: PaymentForm]
├─ Display: Booking summary
├─ Display: Payment method selection
└─ On Submit: Call server action
        ↓
[Server Action: createBooking()]
├─ Validate: User authenticated
├─ Validate: Slot still available
├─ Transaction:
│  ├─ Create booking record
│  ├─ Update time_slot.is_available = false
│  └─ Create notification
├─ Generate: booking reference
└─ Return: success + booking_ref
        ↓
[Client: Show confirmation]
├─ Display: Booking reference
├─ Display: Booking details
└─ Option: Download / Share
```

### 3. Admin Facility Creation Flow

```
ADMIN OPENS /admin/services/new
        ↓
[Client: ServiceForm]
├─ Input: Name, description, price, rules, images
├─ Upload: Images to Supabase Storage
└─ On Submit: Call server action upsertFacility()
        ↓
[Server Action: upsertFacility()]
├─ Insert: Facility into DB (get ID)
├─ Generate: Time slots using generateTimeSlots()
│  └─ 14 days × 12 hours = 168 slots
├─ Insert: All slots into time_slots table
├─ Invalidate: Cache for /admin/services, /
└─ Redirect: To /admin/services
        ↓
[Realtime Update]
├─ Supabase broadcasts: facilities INSERT event
├─ useFacilities hook: Receives update
└─ Facilities list: Auto-refreshes on homepage
```

### 4. Daily Time Slot Generation (Cron)

```
[SCHEDULED TIME: Daily 12:00 AM UTC]
        ↓
[External Cron Service: Calls /api/cron/generate-slots]
├─ Header: Authorization: Bearer {CRON_SECRET}
        ↓
[API Endpoint: generate-slots/route.ts]
├─ Verify: Secret matches CRON_SECRET env var
├─ Query: SELECT * FROM facilities WHERE status = 'open'
├─ For each facility:
│  ├─ Calculate: today + 14 days
│  ├─ Check: Do slots exist for that date?
│  ├─ If No:
│  │  └─ Generate & insert 12 slots (8AM-8PM)
│  └─ If Yes:
│     └─ Skip (already generated)
└─ Return: { success, slotsCreated, timestamp }
        ↓
[Result]
└─ All facilities always have 14-day availability
```

### 5. Real-time Updates

```
[Real-time Subscriptions]

1. FACILITIES (Client Hook: useFacilities)
   ├─ Subscribe to: 'UPDATE' on facilities table
   ├─ Trigger: When admin changes facility status
   └─ Effect: Component re-renders with new status
   
2. NOTIFICATIONS (Client Hook: useNotifications)
   ├─ Subscribe to: 'INSERT' on notifications table
   ├─ Filter: WHERE user_id = current_user_id
   ├─ Trigger: When booking created or reminder time reached
   └─ Effect: Toast/banner appears instantly
   
3. BOOKINGS (Client Hook: useBookings)
   ├─ Subscribe to: 'UPDATE' on bookings table
   ├─ Filter: WHERE user_id = current_user_id
   └─ Effect: Booking status updates in real-time
```

---

## Key Features

### 1. Facility Management
- **Create:** Admin creates facility with details, images, rules
- **Browse:** Users see all facilities with real-time status
- **Details:** Full facility info, reviews, availability calendar
- **Categories:** outdoor, indoor, service

### 2. Time Slot System
- **Pre-generated:** 14-day rolling window
- **Daily refresh:** Cron job maintains window
- **Granularity:** 1-hour blocks (8AM-8PM)
- **Availability:** Real-time is_available flag

### 3. Booking System
- **Selection:** Calendar + time picker UI
- **Payment:** Payment method selection
- **Confirmation:** Unique booking reference
- **Status tracking:** confirmed, cancelled, delayed, completed

### 4. Credit System
- **Wallet:** User credit balance
- **Earned:** Refunds, cancellations, promotions
- **Used:** Apply to future bookings
- **Tracking:** Transaction history

### 5. Notification System
- **Types:** confirmation, reminder_day, reminder_5hr, disruption, reschedule, credit
- **Real-time:** Supabase subscriptions
- **Persistent:** Stored in DB

### 6. Alert System
- **Types:** weather, maintenance, emergency, operational
- **Scope:** Per-facility
- **Public:** All users see active alerts
- **Broadcast:** Real-time updates

### 7. Review System
- **Rating:** 1-5 stars
- **Comments:** Optional text review
- **Constraints:** One review per booking
- **Public:** All users see reviews

---

## API Endpoints

### Server Actions (RSC → Server)

Located in `actions.ts` files across app directories.

#### Auth Actions
- `login(email, password)` → Returns: { user, error }
- `logout()` → Clears session

#### Facility Actions (`/admin/services/actions.ts`)
- `upsertFacility(input)` → Inserts/updates facility + generates slots
- `deleteFacility(id)` → Deletes facility + cascade slots
- `uploadFacilityImage(formData)` → Uploads to Supabase Storage

#### Booking Actions (`/facilities/[id]/actions.ts`)
- `createBooking(slotId)` → Creates booking + updates slot availability

#### Alert Actions (`/admin/alerts/actions.ts`)
- `createAlert(data)` → Creates facility alert
- `deleteAlert(id)` → Deletes alert

#### Dashboard Actions (`/dashboard/actions.ts`)
- `getUpcomingBookings()` → Fetches user's upcoming bookings
- `getNotifications()` → Fetches user's notifications

### Cron Endpoints

#### GET `/api/cron/generate-slots`
- **Auth:** Bearer token (CRON_SECRET)
- **Purpose:** Daily time slot generation
- **Response:**
```json
{
  "success": true,
  "message": "Generated slots for 6 facilities",
  "slotsCreated": 168,
  "timestamp": "2026-04-05T00:00:00Z"
}
```

---

## Component Hierarchy

```
<RootLayout>
  ├─ <Navbar />
  └─ <Page Component>
  
  ├─ Public Pages
  │  ├─ / (HomePage)
  │  │  └─ <HomepageClient>
  │  │     ├─ <AlertBar />
  │  │     └─ <FacilityGrid>
  │  │        └─ <FacilityCard> (x many)
  │  │
  │  ├─ /login
  │  │  └─ <LoginForm>
  │  │
  │  └─ /facilities/[id]
  │     └─ <FacilityDetailClient>
  │        ├─ <CalendarPicker />
  │        ├─ <SlotPicker />
  │        └─ <PaymentForm />
  │
  ├─ Protected Pages (Authenticated Users)
  │  ├─ /dashboard
  │  │  ├─ <ProfileCard />
  │  │  ├─ <UpcomingBookingsStrip />
  │  │  ├─ <BookingList />
  │  │  ├─ <CreditList />
  │  │  └─ <NotificationList />
  │  │
  │  └─ /booking/[id]
  │     └─ <BookingDetails>
  │
  └─ Admin Pages (Admin Only)
     ├─ <AdminLayout>
     │  ├─ <AdminSidebar />
     │  └─ <AdminPage>
     │
     ├─ /admin
     │  └─ <StatsGrid />
     │
     ├─ /admin/services
     │  └─ <ServicesList />
     │
     ├─ /admin/services/new
     │  └─ <ServiceForm />
     │
     ├─ /admin/bookings
     │  └─ <BookingsTable />
     │
     ├─ /admin/alerts
     │  └─ <AlertForm />
     │
     └─ /admin/users
        └─ <UsersList />
```

---

## State Management

### Global State
- **Authentication:** `useAuth()` hook
  - Source: Supabase client auth state
  - Scope: App-wide
  - Persistence: Session cookie

### Local State
- **Page-level:** React `useState()`
- **Server data:** Passed via props from server components
- **Client data:** Fetched with `useEffect()` + hooks

### Real-time State
- **Subscriptions:** Supabase Realtime subscriptions
- **Hooks:**
  - `useFacilities()` → Real-time facility updates
  - `useNotifications()` → Real-time notifications
  - `useBookings()` → Real-time booking updates

### Data Fetching Strategy

| Source | Method | Cache | Real-time |
|--------|--------|-------|-----------|
| Public data | Server component | ISR 60s | No |
| Auth data | useAuth hook | Session | Yes (auth events) |
| Facility details | Server component | Dynamic | No |
| User bookings | useBookings hook | None | Yes (subscriptions) |
| Notifications | useNotifications hook | None | Yes (subscriptions) |
| Admin data | Server action | None | No |

---

## Real-time Features

### Architecture

```
CLIENT (Browser)
    ↓
[Supabase Realtime WebSocket]
    ↓
[Supabase Realtime Server]
    ↓
PostgreSQL [NOTIFY/LISTEN]
    ↓
[Database Trigger]
    ↓
When INSERT/UPDATE/DELETE happens
    ↓
WebSocket Event → Client
    ↓
React hook updates state → Component re-renders
```

### Implemented Real-time Features

1. **Facility Status Updates**
   ```typescript
   // app/hooks/useFacilities.ts
   channel.on('postgres_changes', {
     event: 'UPDATE',
     schema: 'public',
     table: 'facilities'
   }, (payload) => {
     // Update facility state
   }).subscribe();
   ```

2. **Notifications**
   ```typescript
   // app/hooks/useNotifications.ts
   channel.on('postgres_changes', {
     event: 'INSERT',
     schema: 'public',
     table: 'notifications',
     filter: `user_id=eq.${userId}`
   }, (payload) => {
     // Show notification toast
   }).subscribe();
   ```

3. **User Bookings**
   ```typescript
   // app/hooks/useBookings.ts
   channel.on('postgres_changes', {
     event: 'UPDATE',
     schema: 'public',
     table: 'bookings',
     filter: `user_id=eq.${userId}`
   }, (payload) => {
     // Update booking status
   }).subscribe();
   ```

### Supabase Realtime Setup

**Required in Supabase Dashboard:**
- Database → Replication → Enable for: `facilities`, `notifications`, `bookings`
- Set events: `INSERT, UPDATE` for notifications; `UPDATE` for others

---

## Booking Flow

### Step-by-Step Process

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: FACILITY SELECTION                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ User sees facility list on homepage or searches                │
│ Clicks on a facility card                                       │
│ Navigates to /facilities/{facility_id}                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: DATE SELECTION (CalendarPicker)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Server fetches:                                                 │
│  - Facility details                                            │
│  - Time slots where date >= today                              │
│                                                                 │
│ Client renders:                                                 │
│  - Calendar with available dates highlighted                   │
│  - Past dates disabled (grayed out)                             │
│  - No availability dates disabled                               │
│                                                                 │
│ User clicks date → selectedDate state updated                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: TIME SLOT SELECTION (SlotPicker)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Client filters slots for selected date                         │
│                                                                 │
│ Renders available time slots:                                   │
│  - 8:00-9:00 AM [AVAILABLE]                                     │
│  - 9:00-10:00 AM [AVAILABLE]                                    │
│  - 10:00-11:00 AM [BOOKED]                                      │
│  - ...                                                           │
│                                                                 │
│ User clicks slot → selectedSlot state updated                  │
│ Proceed button enabled                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: AUTH CHECK                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ User clicks "Proceed to Payment"                               │
│                                                                 │
│ Check: Is user authenticated?                                  │
│  ├─ YES → Continue to step 5                                   │
│  └─ NO → Redirect to /login?redirectTo=/facilities/{id}        │
│           After login, return to booking                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: PAYMENT (PaymentForm)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Router updates URL:                                             │
│  ?step=payment&slotId={slot_id}                                │
│                                                                 │
│ Display booking summary:                                        │
│  - Facility: Basketball Court                                  │
│  - Date: April 10, 2026                                        │
│  - Time: 6:00 PM - 7:00 PM                                     │
│  - Price: ৳400                                                 │
│  - Total: ৳400                                                 │
│                                                                 │
│ Payment method options:                                         │
│  - Card (via Stripe / Khalti)                                  │
│  - Mobile money                                                │
│  - Use credits                                                 │
│                                                                 │
│ User selects payment method & clicks "Pay"                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: BOOKING CREATION (Server Action)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Call: createBooking(slotId, paymentMethod)                     │
│                                                                 │
│ Server validates:                                               │
│  ✓ User is authenticated                                        │
│  ✓ Slot exists                                                  │
│  ✓ Slot is still available (check is_available = true)         │
│  ✓ Slot date is in future                                      │
│  ✓ Payment succeeds (external gateway)                         │
│                                                                 │
│ If all checks pass:                                             │
│  1. Generate unique booking_ref (e.g., "FB-20260410-A1B2")     │
│  2. Create booking record:                                      │
│     {                                                            │
│       id: UUID,                                                 │
│       user_id: current_user,                                    │
│       facility_id: facility,                                    │
│       slot_id: slot,                                            │
│       status: 'confirmed',                                      │
│       payment_status: 'paid',                                   │
│       booking_ref: 'FB-20260410-A1B2'                          │
│     }                                                            │
│  3. Update time_slot: is_available = false                     │
│  4. Create notification: "Booking confirmed!"                  │
│                                                                 │
│ If checks fail:                                                 │
│  → Return error to client (slot became unavailable, etc.)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: CONFIRMATION                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Display confirmation page with:                                │
│  ✓ Booking Reference: FB-20260410-A1B2                         │
│  ✓ Booking details                                             │
│  ✓ Payment receipt                                             │
│  ✓ Options: Download, Share, Add to Calendar                  │
│                                                                 │
│ Send email/SMS confirmation                                    │
│                                                                 │
│ Update user's dashboard with new booking                       │
│ (real-time via useBookings hook)                               │
│                                                                 │
│ Send notification:                                              │
│  "Your booking is confirmed! Facility opens 30 mins before"   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Example: Booking Creation

```typescript
// app/facilities/[id]/actions.ts
'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { generateBookingRef } from '@/lib/utils/booking-ref';

export async function createBooking(slotId: string) {
  const supabase = await createServiceClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Validate slot
  const { data: slot, error: slotError } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', slotId)
    .single();
  
  if (!slot || !slot.is_available) {
    throw new Error('Slot not available');
  }
  
  // Process payment (external)
  const payment = await processPayment(slot.price_per_hour);
  if (!payment.success) throw new Error('Payment failed');
  
  // Create booking in transaction
  const bookingRef = generateBookingRef();
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      facility_id: slot.facility_id,
      slot_id: slotId,
      status: 'confirmed',
      payment_status: 'paid',
      total_amount: slot.price_per_hour,
      booking_ref: bookingRef
    });
  
  if (bookingError) throw new Error('Booking creation failed');
  
  // Update slot availability
  await supabase
    .from('time_slots')
    .update({ is_available: false })
    .eq('id', slotId);
  
  // Create confirmation notification
  await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      title: 'Booking Confirmed!',
      message: `Your booking (${bookingRef}) is confirmed`,
      type: 'confirmation'
    });
  
  return { success: true, bookingRef };
}
```

---

## Time Slot Management

### Generation Strategy

**Rolling 14-Day Window:**
- Users always see exactly 14 days of availability
- New slots generated daily (day 15 becomes available)
- Old slots (day 0) auto-expire

**Slot Specification:**
- **Duration:** 1 hour blocks (configurable per facility)
- **Hours:** 8 AM to 8 PM (12 slots per day)
- **Days:** 14-day range
- **Total:** 168 slots per facility per generation

### Generation Flow

```
FACILITY CREATED (Admin Dashboard)
    ↓
upsertFacility() server action
    ↓
Call generateTimeSlots(facilityId)
    ↓
generateTimeSlots() utility:
    ├─ Loop: 14 days
    ├─ Loop: Hours 8-20 (12 hours)
    ├─ Create slot object:
    │  {
    │    facility_id: UUID,
    │    date: '2026-04-05',
    │    start_time: '08:00:00',
    │    end_time: '09:00:00',
    │    is_available: true
    │  }
    └─ Return array of 168 slots
    ↓
Insert all slots into time_slots table
    ↓
Facility now bookable!
```

### Daily Refresh (Cron Job)

```
SCHEDULED: Daily 12:00 AM UTC
    ↓
External cron service calls: /api/cron/generate-slots
    ↓
API validates request with CRON_SECRET
    ↓
Loop through all facilities:
    ├─ Calculate: today + 14 days
    ├─ Query: Do slots exist for that date?
    ├─ If NO:
    │  └─ Generate & insert 12 new slots
    └─ If YES:
       └─ Skip (already generated)
    ↓
Result: { slotsCreated: N, timestamp: ... }
    ↓
All facilities maintain rolling 14-day window
```

### Slot Availability Logic

```typescript
// CalendarPicker component
const availableDates = useMemo(() => {
  const set = new Set<string>();
  
  // Add dates that have at least one available slot
  slots
    .filter(s => s.is_available)  // ← Only available slots
    .forEach(s => set.add(s.date)); // ← Add to set
  
  return set;
}, [slots]);

// Render calendar
slots.forEach(date => {
  const isPast = isBefore(date, today);
  const isAvailable = availableDates.has(dateStr);
  
  if (isPast || !isAvailable) {
    // Render disabled (grayed out)
  } else {
    // Render clickable
  }
});
```

### Database Queries

**Check availability for facility on date:**
```sql
SELECT id, start_time, end_time
FROM time_slots
WHERE facility_id = $1
  AND date = $2
  AND is_available = true
ORDER BY start_time;
```

**Mark slot as booked:**
```sql
UPDATE time_slots
SET is_available = false
WHERE id = $1;
```

**Generate slots (cron):**
```sql
INSERT INTO time_slots 
  (facility_id, date, start_time, end_time, is_available)
VALUES
  ($1, $2, '08:00:00', '09:00:00', true),
  ($1, $2, '09:00:00', '10:00:00', true),
  ...
```

---

## Deployment & Infrastructure

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Edge Runtime)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Next.js Server Functions                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │ SSR Pages    │  │ API Routes   │  │ Server Adtns │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Middleware (Edge Runtime)                      │   │
│  │  - Session validation                                    │   │
│  │  - Cookie management                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Static & Client-Side Assets                    │   │
│  │  - JavaScript bundles                                    │   │
│  │  - CSS                                                   │   │
│  │  - Images                                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE CLOUD REGION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           PostgreSQL Database                            │   │
│  │  - 8 tables with RLS policies                            │   │
│  │  - Realtime subscriptions enabled                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Auth Service                                   │   │
│  │  - User signup / login                                   │   │
│  │  - OAuth providers                                       │   │
│  │  - Session JWT tokens                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Realtime Server                                │   │
│  │  - WebSocket connections                                 │   │
│  │  - Broadcast events                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Storage (S3)                                   │   │
│  │  - facility-images bucket (public)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL CRON SERVICE (Daily)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Vercel Crons / EasyCron                                 │   │
│  │  - Calls: /api/cron/generate-slots                       │   │
│  │  - Frequency: Daily 12:00 AM UTC                         │   │
│  │  - Auth: Bearer {CRON_SECRET}                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://iqeqguyjxxqpzrqovald.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cron Security
CRON_SECRET=550cccd6ca16e8c12af4fc94d73c8299

# Payment Gateway (Optional)
STRIPE_SECRET_KEY=sk_test_...
KHALTI_SECRET_KEY=...
```

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com/new
   - Import GitHub repository
   - Add environment variables
   - Click Deploy

3. **Configure Cron**
   - Option A (Vercel Crons): Add `vercel.json`
     ```json
     {
       "crons": [{
         "path": "/api/cron/generate-slots",
         "schedule": "0 0 * * *"
       }]
     }
     ```
   - Option B (EasyCron): Create cron job via dashboard

4. **Update Supabase Settings**
   - Enable Realtime for: facilities, notifications, bookings
   - Allow: INSERT, UPDATE events

### Performance Considerations

| Aspect | Strategy |
|--------|----------|
| **SSR Pages** | Revalidate every 60s (ISR) |
| **Client Data** | React query + Supabase subscriptions |
| **Images** | Lazy load, optimize with Vercel Image Optimization |
| **Database** | Indexes on foreign keys + frequently queried columns |
| **Real-time** | Selective subscriptions (filter by user_id) |
| **Cron Jobs** | Run once daily, low frequency |

### Monitoring

- **Vercel Analytics:** Performance metrics
- **Supabase Logs:** Database query performance
- **Error Tracking:** Implement Sentry or similar
- **Cron Status:** Email alerts if cron fails

---

## Summary

OneStopBook is a **full-stack sports facility booking platform** with:

✅ **Modern Stack:** Next.js 14, TypeScript, Tailwind CSS  
✅ **Real-time Features:** Supabase Realtime subscriptions  
✅ **Secure Auth:** Supabase Auth with RLS policies  
✅ **Rolling Availability:** 14-day window with daily cron refresh  
✅ **Admin Dashboard:** Facility, booking, alert management  
✅ **User Dashboard:** Bookings, credits, notifications  
✅ **Payment Integration:** Multiple payment methods  
✅ **Scalable:** Serverless architecture on Vercel + Supabase  

The system is designed for **high availability, real-time updates, and easy maintenance**.
