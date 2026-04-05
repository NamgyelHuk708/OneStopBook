-- =====================================================================
-- Frost Sports Booking Platform — Seed Data
-- Run AFTER schema.sql in the Supabase SQL editor
-- NOTE: Replace the UUIDs below with real auth.users IDs after creating
--       the three test accounts via the Supabase Auth dashboard or API.
--
-- Test accounts to create first (Supabase Auth > Users > Add user):
--   admin@frost.bt      password: Admin1234!
--   user1@frost.bt      password: User1234!
--   user2@frost.bt      password: User1234!
--
-- Then replace these placeholders with the real UUIDs from auth.users:
--   ADMIN_USER_ID  → admin user's UUID
--   USER1_ID       → user1's UUID
--   USER2_ID       → user2's UUID
-- =====================================================================

-- ── Step 1: Set variables (replace these UUIDs) ───────────────────────
do $$
declare
  admin_id  uuid := 'ADMIN_USER_ID';   -- replace
  user1_id  uuid := 'USER1_ID';        -- replace
  user2_id  uuid := 'USER2_ID';        -- replace

  football_id    uuid := gen_random_uuid();
  basketball_id  uuid := gen_random_uuid();
  badminton_id   uuid := gen_random_uuid();
  tennis_id      uuid := gen_random_uuid();
  tabletennis_id uuid := gen_random_uuid();
  laundry_id     uuid := gen_random_uuid();

  today date := current_date;
begin

-- ── Step 2: Profiles ─────────────────────────────────────────────────
insert into profiles (id, full_name, phone, is_admin) values
  (admin_id,  'Frost Admin',      '+97517000001', true),
  (user1_id,  'Tenzin Wangchuk',  '+97517000002', false),
  (user2_id,  'Karma Dema',       '+97517000003', false)
on conflict (id) do update set full_name = excluded.full_name, is_admin = excluded.is_admin;

-- ── Step 3: Facilities ────────────────────────────────────────────────
insert into facilities (id, name, description, category, surface_type, capacity, price_per_hour, status, rules) values
  (
    football_id,
    'Football Court',
    'Full-size outdoor football court with natural grass. Ideal for 11-a-side matches and training sessions.',
    'outdoor', 'Natural Grass', 22, 500, 'open',
    array[
      'Booking must be made at least 2 hours in advance.',
      'Cleated boots allowed. No metal studs.',
      'Maximum 22 players at a time.',
      'No food or drinks on the pitch.',
      'Please vacate the court 5 minutes before your slot ends.'
    ]
  ),
  (
    basketball_id,
    'Basketball Court',
    'Regulation-size indoor basketball court with hardwood flooring, two hoops, and full lighting.',
    'indoor', 'Hardwood', 10, 400, 'open',
    array[
      'Indoor shoes only — no outdoor soles.',
      'Maximum 10 players.',
      'Bring your own ball or rent one at the front desk.',
      'No dunking on side hoops during shared sessions.'
    ]
  ),
  (
    badminton_id,
    'Badminton Court',
    'Two side-by-side indoor badminton courts with synthetic flooring and professional lighting.',
    'indoor', 'Synthetic PVC', 4, 300, 'open',
    array[
      'Non-marking shoes required.',
      'Rackets available for rent.',
      'Maximum 4 players per court.',
      'No food inside the court area.'
    ]
  ),
  (
    tennis_id,
    'Tennis Court',
    'Outdoor hard-surface tennis court with flood lights for evening play.',
    'outdoor', 'Hard Court', 4, 450, 'open',
    array[
      'Proper tennis shoes required.',
      'Maximum 4 players (doubles).',
      'Balls available for purchase at reception.',
      'Book flood lights separately for evening sessions.'
    ]
  ),
  (
    tabletennis_id,
    'Table Tennis',
    'Two full-size indoor table tennis tables in a climate-controlled room.',
    'indoor', 'Composite', 4, 200, 'open',
    array[
      'Equipment provided. Handle with care.',
      'Maximum 4 players at a time.',
      'No food or drinks near the tables.',
      'Shoes required at all times.'
    ]
  ),
  (
    laundry_id,
    'Laundry Service',
    'Three modern washing machines and dryers available for booking. Great for sports kits and uniforms.',
    'service', null, 3, 150, 'open',
    array[
      'One booking = one machine for 1 hour.',
      'Bring your own detergent or purchase at the desk.',
      'Do not overload the machines.',
      'Please remove clothes promptly when your slot ends.'
    ]
  );

-- ── Step 4: Time slots (8AM–8PM, 1-hour blocks, next 14 days) ────────
declare
  fac_id   uuid;
  day_off  int;
  hour_val int;
begin
  foreach fac_id in array array[
    football_id, basketball_id, badminton_id,
    tennis_id, tabletennis_id, laundry_id
  ] loop
    for day_off in 0..13 loop
      for hour_val in 8..19 loop
        insert into time_slots (facility_id, date, start_time, end_time, is_available)
        values (
          fac_id,
          today + day_off,
          make_time(hour_val, 0, 0),
          make_time(hour_val + 1, 0, 0),
          true
        );
      end loop;
    end loop;
  end loop;
end;

-- ── Step 5: Mark a few slots as taken (for realism) ──────────────────
update time_slots
set is_available = false
where facility_id = football_id
  and date = today
  and start_time in ('10:00:00', '11:00:00', '14:00:00');

update time_slots
set is_available = false
where facility_id = badminton_id
  and date = today
  and start_time = '09:00:00';

-- ── Step 6: Sample bookings ───────────────────────────────────────────
declare
  slot1_id uuid;
  slot2_id uuid;
  slot3_id uuid;
  booking1_id uuid := gen_random_uuid();
  booking2_id uuid := gen_random_uuid();
  booking3_id uuid := gen_random_uuid();
begin
  -- Find an available slot for user1 (football, today+1, 10am)
  select id into slot1_id from time_slots
  where facility_id = football_id
    and date = today + 1
    and start_time = '10:00:00'
  limit 1;

  -- Find a slot for user2 (basketball, today+2, 3pm)
  select id into slot2_id from time_slots
  where facility_id = basketball_id
    and date = today + 2
    and start_time = '15:00:00'
  limit 1;

  -- Find a past slot for user1 (tennis, today-1 if in range, else use today+3)
  select id into slot3_id from time_slots
  where facility_id = tennis_id
    and date = today + 3
    and start_time = '08:00:00'
  limit 1;

  if slot1_id is not null then
    update time_slots set is_available = false where id = slot1_id;
    insert into bookings (id, user_id, facility_id, slot_id, status, total_amount, payment_status, payment_method, booking_ref)
    values (booking1_id, user1_id, football_id, slot1_id, 'confirmed', 520, 'paid', 'card', 'FR-SEED-001');

    insert into notifications (user_id, booking_id, title, message, type, is_read, scheduled_for)
    values (user1_id, booking1_id, 'Booking confirmed!', 'Your Football Court booking (FR-SEED-001) is confirmed.', 'confirmation', false, now());
  end if;

  if slot2_id is not null then
    update time_slots set is_available = false where id = slot2_id;
    insert into bookings (id, user_id, facility_id, slot_id, status, total_amount, payment_status, payment_method, booking_ref)
    values (booking2_id, user2_id, basketball_id, slot2_id, 'confirmed', 420, 'paid', 'mobile_pay', 'FR-SEED-002');

    insert into notifications (user_id, booking_id, title, message, type, is_read, scheduled_for)
    values (user2_id, booking2_id, 'Booking confirmed!', 'Your Basketball Court booking (FR-SEED-002) is confirmed.', 'confirmation', false, now());
  end if;

  if slot3_id is not null then
    update time_slots set is_available = false where id = slot3_id;
    insert into bookings (id, user_id, facility_id, slot_id, status, total_amount, payment_status, payment_method, booking_ref)
    values (booking3_id, user1_id, tennis_id, slot3_id, 'completed', 470, 'paid', 'card', 'FR-SEED-003');
  end if;

-- ── Step 7: Sample reviews ────────────────────────────────────────────
  insert into reviews (user_id, facility_id, booking_id, rating, comment) values
    (user1_id, football_id, booking1_id, 5, 'Amazing pitch! Well maintained grass and good lighting. Will definitely book again.'),
    (user2_id, basketball_id, booking2_id, 4, 'Great court, smooth hardwood floor. Could use a few more balls available for rent.');

-- ── Step 8: One active alert ──────────────────────────────────────────
  insert into alerts (facility_id, title, message, alert_type, is_active, created_by) values
    (tennis_id, 'Resurfacing work scheduled',
     'The tennis court will undergo minor resurfacing on weekends this month. Evening slots may be delayed.',
     'maintenance', true, admin_id);

end;

end $$;
