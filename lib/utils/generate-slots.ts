/**
 * Generate time slots for a facility
 * Creates 14 days of 1-hour slots from 8AM to 8PM
 */
export function generateTimeSlots(facilityId: string, fromDate: Date = new Date()) {
  const timeSlots = [];
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0); // Start from midnight

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (let hour = 8; hour < 20; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`;

      timeSlots.push({
        facility_id: facilityId,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        is_available: true,
      });
    }
  }

  return timeSlots;
}
