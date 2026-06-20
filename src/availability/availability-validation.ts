import { BadRequestException } from '@nestjs/common';
import {
  AVAILABILITY_DAY_KEYS,
  normalizeWeeklySchedule,
  type AvailabilityDayKey,
  type ServiceAvailabilityWindow,
  type WeeklySchedule,
} from './availability.constants';

const DAY_INDEX_TO_KEY: AvailabilityDayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function getDayKeyFromDate(date: string): AvailabilityDayKey {
  const dayIndex = new Date(`${date}T12:00:00`).getDay();
  return DAY_INDEX_TO_KEY[dayIndex] ?? 'monday';
}

export function parseClockTimeToMinutes(value: string) {
  const [hoursPart, minutesPart] = value.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

export function parseFlexibleTimeToMinutes(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ').toUpperCase();
  const twelveHour = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (twelveHour) {
    let hours = Number(twelveHour[1]);
    const minutes = Number(twelveHour[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    if (twelveHour[3] === 'AM' && hours === 12) {
      hours = 0;
    }

    if (twelveHour[3] === 'PM' && hours !== 12) {
      hours += 12;
    }

    return hours * 60 + minutes;
  }

  const twentyFourHour = normalized.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHour) {
    const hours = Number(twentyFourHour[1]);
    const minutes = Number(twentyFourHour[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return hours * 60 + minutes;
  }

  return null;
}

function formatMinutesAsLabel(minutes: number) {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

export function assertBookingSlotAvailable(input: {
  isAvailable: boolean;
  weeklySchedule?: Partial<WeeklySchedule> | null;
  serviceSchedules?: Record<string, ServiceAvailabilityWindow> | null;
  blockedDates: string[];
  service: string;
  eventDate: string;
  eventTime: string;
}) {
  if (!input.isAvailable) {
    throw new BadRequestException(
      'This chef is not accepting new bookings right now.',
    );
  }

  if (input.blockedDates.includes(input.eventDate)) {
    throw new BadRequestException(
      'This chef is not available on the selected date.',
    );
  }

  const weeklySchedule = normalizeWeeklySchedule(input.weeklySchedule);
  const dayKey = getDayKeyFromDate(input.eventDate);
  const daySchedule = weeklySchedule[dayKey];

  if (!daySchedule.enabled) {
    throw new BadRequestException(
      `This chef does not accept bookings on ${dayKey}s.`,
    );
  }

  const eventMinutes = parseFlexibleTimeToMinutes(input.eventTime);

  if (eventMinutes == null) {
    throw new BadRequestException(
      'Enter a valid event time, such as 7:00 PM.',
    );
  }

  const dayStart = parseClockTimeToMinutes(daySchedule.startTime);
  const dayEnd = parseClockTimeToMinutes(daySchedule.endTime);

  if (dayStart == null || dayEnd == null) {
    throw new BadRequestException('Chef availability schedule is invalid.');
  }

  if (eventMinutes < dayStart || eventMinutes > dayEnd) {
    throw new BadRequestException(
      `Event time must be between ${formatMinutesAsLabel(dayStart)} and ${formatMinutesAsLabel(dayEnd)} on ${dayKey}s.`,
    );
  }

  const serviceWindow = input.serviceSchedules?.[input.service];

  if (!serviceWindow?.enabled) {
    return;
  }

  const serviceStart = parseClockTimeToMinutes(serviceWindow.startTime);
  const serviceEnd = parseClockTimeToMinutes(serviceWindow.endTime);

  if (serviceStart == null || serviceEnd == null) {
    throw new BadRequestException('Service availability schedule is invalid.');
  }

  const effectiveStart = Math.max(dayStart, serviceStart);
  const effectiveEnd = Math.min(dayEnd, serviceEnd);

  if (effectiveStart >= effectiveEnd) {
    throw new BadRequestException(
      'This service is not available during the selected day window.',
    );
  }

  if (eventMinutes < effectiveStart || eventMinutes > effectiveEnd) {
    throw new BadRequestException(
      `This service is only available between ${formatMinutesAsLabel(effectiveStart)} and ${formatMinutesAsLabel(effectiveEnd)} on that day.`,
    );
  }
}

export function isValidAvailabilityDayKey(value: string): value is AvailabilityDayKey {
  return AVAILABILITY_DAY_KEYS.includes(value as AvailabilityDayKey);
}
