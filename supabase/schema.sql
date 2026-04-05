-- =====================================================================
-- Frost Sports Booking Platform — Supabase Schema
-- Run this in the Supabase SQL editor
-- =====================================================================

-- ── Profiles ─────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid references auth.users primary key,
  full_name   text,
  avatar_url  text,
  phone       text,
  is_admin    boolean default false,
  created_at  timestamptz default now()
);

-- ── Facilities ────────────────────────────────────────────────────────
create table if not exists facilities (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  description    text,
  category       text check (category in ('outdoor', 'indoor', 'service')),
  surface_type   text,
  capacity       int,
  price_per_hour numeric not null,
  images         text[],
  status         text check (status in ('open', 'delayed', 'closed')) default 'open',
  rules          text[],
  created_at     timestamptz default now()
);

-- ── Time slots ────────────────────────────────────────────────────────
create table if not exists time_slots (
  id           uuid primary key default gen_random_uuid(),
  facility_id  uuid references facilities(id) on delete cascade,
  date         date not null,
  start_time   time not null,
  end_time     time not null,
  is_available boolean default true,
  created_at   timestamptz default now()
);

-- ── Bookings ──────────────────────────────────────────────────────────
create table if not exists bookings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id),
  facility_id    uuid references facilities(id),
  slot_id        uuid references time_slots(id),
  status         text check (status in ('confirmed', 'cancelled', 'delayed', 'completed')) default 'confirmed',
  total_amount   numeric not null,
  payment_status text check (payment_status in ('paid', 'pending', 'refunded', 'credited')) default 'pending',
  payment_method text,
  booking_ref    text unique not null,
  created_at     timestamptz default now()
);

-- ── Alerts ────────────────────────────────────────────────────────────
create table if not exists alerts (
  id          uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id),
  title       text not null,
  message     text not null,
  alert_type  text check (alert_type in ('weather', 'maintenance', 'emergency', 'operational')),
  is_active   boolean default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ── Notifications ─────────────────────────────────────────────────────
create table if not exists notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id),
  booking_id    uuid references bookings(id),
  title         text not null,
  message       text not null,
  type          text check (type in ('confirmation', 'reminder_day', 'reminder_5hr', 'disruption', 'reschedule', 'credit')),
  is_read       boolean default false,
  scheduled_for timestamptz,
  created_at    timestamptz default now()
);

-- ── Reviews ───────────────────────────────────────────────────────────
create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  facility_id uuid references facilities(id),
  booking_id  uuid references bookings(id),
  rating      int check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

-- ── Credits ───────────────────────────────────────────────────────────
create table if not exists credits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id),
  amount     numeric not null,
  reason     text,
  booking_id uuid references bookings(id),
  is_used    boolean default false,
  created_at timestamptz default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table profiles    enable row level security;
alter table facilities  enable row level security;
alter table time_slots  enable row level security;
alter table bookings    enable row level security;
alter table alerts      enable row level security;
alter table notifications enable row level security;
alter table reviews     enable row level security;
alter table credits     enable row level security;

-- Helper function to check admin status
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- ── Profiles policies ─────────────────────────────────────────────────
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can read all profiles"
  on profiles for select using (is_admin());

-- Allow service role to insert (used on sign-up)
create policy "Service role can insert profiles"
  on profiles for insert with check (true);

-- ── Facilities policies ────────────────────────────────────────────────
create policy "Public read facilities"
  on facilities for select using (true);

create policy "Admins can insert facilities"
  on facilities for insert with check (is_admin());

create policy "Admins can update facilities"
  on facilities for update using (is_admin());

create policy "Admins can delete facilities"
  on facilities for delete using (is_admin());

-- ── Time slots policies ────────────────────────────────────────────────
create policy "Public read time_slots"
  on time_slots for select using (true);

create policy "Admins can manage time_slots"
  on time_slots for all using (is_admin());

-- Allow service role to update slots (booking creation)
create policy "Service role can update time_slots"
  on time_slots for update using (true);

-- ── Bookings policies ─────────────────────────────────────────────────
create policy "Users can read own bookings"
  on bookings for select using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on bookings for insert with check (auth.uid() = user_id);

create policy "Admins can read all bookings"
  on bookings for select using (is_admin());

create policy "Admins can update bookings"
  on bookings for update using (is_admin());

create policy "Service role can manage bookings"
  on bookings for all using (true);

-- ── Alerts policies ────────────────────────────────────────────────────
create policy "Public read alerts"
  on alerts for select using (true);

create policy "Admins can manage alerts"
  on alerts for all using (is_admin());

-- ── Notifications policies ─────────────────────────────────────────────
create policy "Users can read own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

create policy "Service role can manage notifications"
  on notifications for all using (true);

-- ── Reviews policies ───────────────────────────────────────────────────
create policy "Public read reviews"
  on reviews for select using (true);

create policy "Authenticated users can insert own reviews"
  on reviews for insert with check (auth.uid() = user_id);

-- ── Credits policies ───────────────────────────────────────────────────
create policy "Users can read own credits"
  on credits for select using (auth.uid() = user_id);

create policy "Service role can manage credits"
  on credits for all using (true);

-- =====================================================================
-- Storage bucket
-- =====================================================================
-- Run this in the Supabase dashboard → Storage → New bucket
-- Name: facility-images, Public: true

-- =====================================================================
-- Enable Realtime
-- =====================================================================
-- In Supabase dashboard → Database → Replication, enable:
-- facilities, notifications (INSERT, UPDATE)
