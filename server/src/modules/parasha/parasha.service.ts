interface ParashaInfo {
  name: string;
  date: string; // ISO format (YYYY-MM-DD)
  hebrewDate: string;
}

class ParashaService {
  /**
   * Get upcoming Shabbat parashot
   * @param limit - Maximum number of parashot to return (default: 30)
   */
  async getUpcomingParashot(limit: number = 30): Promise<ParashaInfo[]> {
    const { HebrewCalendar, Location, flags } = await import('@hebcal/core');
    
    const today = new Date();
    const endDate = new Date();
    endDate.setFullYear(today.getFullYear() + 1); // Get next year's parashot

    const location = Location.lookup('Jerusalem');
    if (!location) {
      throw new Error('Failed to lookup Jerusalem location');
    }

    const events = HebrewCalendar.calendar({
      start: today,
      end: endDate,
      location: location,
      sedrot: true, // Include weekly Torah portions
      il: true, // Israel holidays
      noHolidays: true, // Exclude holiday events
    });

    const parashot: ParashaInfo[] = [];

    for (const event of events) {
      if (parashot.length >= limit) break;

      // Check if this is a Parasha event using flags
      if ((event.getFlags() & flags.PARSHA_HASHAVUA) !== 0) {
        const parashaEvent = event as any; // ParshaEvent type
        const hdate = event.getDate();

        parashot.push({
          name: parashaEvent.render('he'), // Hebrew name
          date: hdate.greg().toISOString().split('T')[0],
          hebrewDate: hdate.toString(),
        });
      }
    }

    return parashot;
  }

  /**
   * Validate if a parasha name is valid for upcoming year
   */
  async isValidParasha(parashaName: string): Promise<boolean> {
    const upcoming = await this.getUpcomingParashot(52); // Get a full year
    return upcoming.some(p => p.name === parashaName);
  }
}

export const parashaService = new ParashaService();
