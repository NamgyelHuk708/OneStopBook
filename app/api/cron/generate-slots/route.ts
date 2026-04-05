import { createServiceClient } from '@/lib/supabase/server';
import { generateTimeSlots } from '@/lib/utils/generate-slots';

/**
 * Cron endpoint to generate rolling 14-day time slots
 * Call this daily to ensure all facilities have 14 days of available slots
 * 
 * Example cron setup (EasyCron, Vercel Crons, etc):
 * - URL: https://yoursite.vercel.app/api/cron/generate-slots
 * - Schedule: Every day at 12:00 AM UTC
 */

export async function GET(request: Request) {
  // Verify the request is from a trusted cron service
  const authHeader = request.headers.get('authorization');
  
  // For local testing, allow requests from localhost
  // For production, use a cron secret
  const isValidRequest = 
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    request.headers.get('host')?.includes('localhost');

  if (!isValidRequest && process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createServiceClient();

    // Get all active facilities
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select('id')
      .eq('status', 'open');

    if (facilitiesError) {
      throw new Error(`Failed to fetch facilities: ${facilitiesError.message}`);
    }

    if (!facilities || facilities.length === 0) {
      return Response.json(
        { success: true, message: 'No facilities to process', slotsCreated: 0 },
        { status: 200 }
      );
    }

    let totalSlotsCreated = 0;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 14); // Generate slots for day 14 from now
    tomorrow.setHours(0, 0, 0, 0);

    // For each facility, check if slots exist for day 14
    for (const facility of facilities) {
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Check if slots already exist for day 14
      const { data: existingSlots, error: checkError } = await supabase
        .from('time_slots')
        .select('id', { count: 'exact', head: true })
        .eq('facility_id', facility.id)
        .eq('date', tomorrowStr);

      if (checkError) {
        console.error(`Error checking slots for facility ${facility.id}:`, checkError);
        continue;
      }

      // If slots don't exist for day 14, generate them
      if (!existingSlots || existingSlots.length === 0) {
        const timeSlots = generateTimeSlots(facility.id, tomorrow);

        const { error: insertError, status } = await supabase
          .from('time_slots')
          .insert(timeSlots);

        if (insertError) {
          console.error(`Error inserting slots for facility ${facility.id}:`, insertError);
          continue;
        }

        totalSlotsCreated += timeSlots.length;
        console.log(`Created ${timeSlots.length} slots for facility ${facility.id}`);
      }
    }

    return Response.json(
      {
        success: true,
        message: `Generated slots for ${facilities.length} facilities`,
        slotsCreated: totalSlotsCreated,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
