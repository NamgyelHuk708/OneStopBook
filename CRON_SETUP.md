# Rolling 14-Day Time Slots Setup Guide

## Overview
This system automatically maintains a rolling 14-day window of available time slots for all facilities. Every day, new slots are generated for "day 14" from now, ensuring users always have 14 days of booking availability.

## How It Works

### 1. **Time Slot Generation Utility** (`lib/utils/generate-slots.ts`)
- Generates exactly 14 days of time slots (8AM-8PM, 1-hour blocks)
- Used by both facility creation and the daily cron job
- Returns an array of slot objects ready to insert into Supabase

### 2. **Facility Creation** (`app/admin/services/actions.ts`)
- When a new facility is created, `generateTimeSlots()` is called
- 14 days of slots are immediately available for booking
- No manual slot creation needed

### 3. **Daily Cron Job** (`app/api/cron/generate-slots/route.ts`)
- Runs once per day (you configure the schedule)
- Checks all active facilities
- For each facility, checks if slots exist for "day 14 from now"
- If missing, generates new slots for that day
- Maintains the rolling 14-day window automatically

## Setup Instructions

### Step 1: Generate a Cron Secret
```bash
# Generate a random secret (use this command or go to https://generate-secret.vercel.app/32)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Update Environment Variables
Add to your `.env.local`:
```
CRON_SECRET=your_generated_secret_here
```

### Step 3: Deploy to Vercel
If deploying to Vercel, add the environment variable in your Vercel project settings:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add `CRON_SECRET` with the value from Step 1

### Step 4: Set Up Daily Cron Trigger

Choose one of the following options:

#### **Option A: Vercel Crons (Recommended for Vercel deployment)**
1. Create/update `vercel.json` in your project root:
```json
{
  "crons": [{
    "path": "/api/cron/generate-slots",
    "schedule": "0 0 * * *"
  }]
}
```
2. Deploy to Vercel
3. Vercel will automatically call your endpoint daily at midnight UTC

#### **Option B: EasyCron (Free external service)**
1. Go to [easycron.com](https://www.easycron.com/)
2. Sign up (free)
3. Create a new cron job:
   - **URL**: `https://yourdomain.vercel.app/api/cron/generate-slots`
   - **HTTP Authorization Header**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Frequency**: Every day at 12:00 AM UTC
4. Click "Create"

#### **Option C: Render Crons (If using Render)**
Similar setup to Vercel - add to your deployment config

### Step 5: Test the Endpoint (Local)
```bash
# Terminal 1: Start your dev server
npm run dev

# Terminal 2: Test the endpoint
curl -H "Authorization: Bearer your_cron_secret" \
  http://localhost:3000/api/cron/generate-slots
```

Expected response:
```json
{
  "success": true,
  "message": "Generated slots for 6 facilities",
  "slotsCreated": 168,
  "timestamp": "2026-04-05T00:00:00.000Z"
}
```

## Monitoring

### Check If It's Working
1. Pick a facility
2. Look at available dates in the calendar (should always be 14 days)
3. Check tomorrow + 14 days - slots should exist there too
4. After the cron runs, tomorrow + 15 days should have slots

### Production Monitoring
- Check your cron service logs (EasyCron dashboard, Vercel logs, etc.)
- Monitor Supabase for time_slots table growth
- Set up alerts if the endpoint returns `success: false`

## Troubleshooting

### "Unauthorized" Error
- Check that `CRON_SECRET` is set in your environment variables
- Verify the Authorization header matches: `Bearer YOUR_SECRET`
- For Vercel crons, no authorization header is needed (Vercel verifies internally)

### No Slots Being Generated
- Check if any facilities have `status = 'open'`
- Verify the cron is actually being called (check logs)
- Manually test the endpoint with curl

### Too Many Slots Generated
- This shouldn't happen - the endpoint checks if slots already exist for day 14
- If duplicate slots appear, they were inserted twice (check cron logs)

## Database Queries to Monitor

### Check slot distribution:
```sql
SELECT facility_id, DATE(date) as slot_date, COUNT(*) as slot_count
FROM time_slots
WHERE date >= CURRENT_DATE
GROUP BY facility_id, slot_date
ORDER BY slot_date, facility_id;
```

### Verify rolling window:
```sql
SELECT 
  facility_id,
  MIN(date) as earliest_date,
  MAX(date) as latest_date,
  COUNT(*) as total_slots
FROM time_slots
WHERE date >= CURRENT_DATE
GROUP BY facility_id;
```

## Costs
- **Vercel Crons**: Free (included with Vercel deployment)
- **EasyCron**: Free tier with limit on frequency and execution time
- **Database**: Minimal impact - only ~168 new rows per facility per day

## Next Steps
- ✅ Test the endpoint locally
- ✅ Deploy to Vercel
- ✅ Configure the cron schedule
- ✅ Monitor for a few days
