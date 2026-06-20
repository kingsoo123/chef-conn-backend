function unfoldIcs(content: string) {
  return content.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

function normalizeIcsDateValue(raw: string) {
  const value = raw.trim();

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  if (/^\d{8}T\d{6}Z?$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return null;
}

export function extractBusyDatesFromIcs(content: string) {
  const unfolded = unfoldIcs(content);
  const dates = new Set<string>();

  for (const line of unfolded.split('\n')) {
    if (!line.startsWith('DTSTART')) {
      continue;
    }

    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const normalized = normalizeIcsDateValue(line.slice(separatorIndex + 1));

    if (normalized) {
      dates.add(normalized);
    }
  }

  return [...dates].sort();
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsUtcDateTime(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function addDaysToIsoDate(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

type CalendarBooking = {
  id: string;
  eventDate: string;
  eventTime: string;
  hostName: string;
  service: string;
  status: string;
};

export function buildChefCalendarFeed(input: {
  chefName: string;
  blockedDates: string[];
  bookings: CalendarBooking[];
}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChefConnect//Chef Availability//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:ChefConnect - ' + escapeIcsText(input.chefName),
  ];

  for (const blockedDate of input.blockedDates) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:blocked-${blockedDate}@chefconnect.app`);
    lines.push(`DTSTAMP:${formatIcsUtcDateTime(new Date())}`);
    lines.push(`DTSTART;VALUE=DATE:${blockedDate.replace(/-/g, '')}`);
    lines.push(`DTEND;VALUE=DATE:${addDaysToIsoDate(blockedDate, 1)}`);
    lines.push('SUMMARY:Blocked - Unavailable');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  for (const booking of input.bookings) {
    const start = new Date(`${booking.eventDate}T12:00:00`);
    const eventMinutes = booking.eventTime.match(/(\d{1,2}):(\d{2})/);

    if (eventMinutes) {
      let hours = Number(eventMinutes[1]);
      const minutes = Number(eventMinutes[2]);

      if (/pm/i.test(booking.eventTime) && hours !== 12) {
        hours += 12;
      }

      if (/am/i.test(booking.eventTime) && hours === 12) {
        hours = 0;
      }

      start.setHours(hours, minutes, 0, 0);
    }

    const end = new Date(start);
    end.setHours(end.getHours() + 2);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:booking-${booking.id}@chefconnect.app`);
    lines.push(`DTSTAMP:${formatIcsUtcDateTime(new Date())}`);
    lines.push(`DTSTART:${formatIcsUtcDateTime(start)}`);
    lines.push(`DTEND:${formatIcsUtcDateTime(end)}`);
    lines.push(
      `SUMMARY:${escapeIcsText(`${booking.hostName} - ${booking.service}`)}`,
    );
    lines.push(`DESCRIPTION:${escapeIcsText(`Status: ${booking.status}`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return `${lines.join('\r\n')}\r\n`;
}
