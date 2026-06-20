export const AVAILABILITY_DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type AvailabilityDayKey = (typeof AVAILABILITY_DAY_KEYS)[number];

export type DayAvailability = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type WeeklySchedule = Record<AvailabilityDayKey, DayAvailability>;

export type ServiceAvailabilityWindow = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type ServiceSchedules = Record<string, ServiceAvailabilityWindow>;

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { enabled: true, startTime: '09:00', endTime: '20:00' },
  tuesday: { enabled: true, startTime: '09:00', endTime: '20:00' },
  wednesday: { enabled: true, startTime: '09:00', endTime: '20:00' },
  thursday: { enabled: true, startTime: '09:00', endTime: '20:00' },
  friday: { enabled: true, startTime: '09:00', endTime: '20:00' },
  saturday: { enabled: true, startTime: '10:00', endTime: '22:00' },
  sunday: { enabled: false, startTime: '10:00', endTime: '18:00' },
};

export function normalizeWeeklySchedule(
  schedule?: Partial<WeeklySchedule> | null,
): WeeklySchedule {
  return AVAILABILITY_DAY_KEYS.reduce<WeeklySchedule>((accumulator, day) => {
    const value = schedule?.[day];
    accumulator[day] = {
      enabled: value?.enabled ?? DEFAULT_WEEKLY_SCHEDULE[day].enabled,
      startTime: value?.startTime ?? DEFAULT_WEEKLY_SCHEDULE[day].startTime,
      endTime: value?.endTime ?? DEFAULT_WEEKLY_SCHEDULE[day].endTime,
    };
    return accumulator;
  }, {} as WeeklySchedule);
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function normalizeServiceSchedules(
  offeredServices: string[],
  stored?: ServiceSchedules | null,
): ServiceSchedules {
  return offeredServices.reduce<ServiceSchedules>((accumulator, serviceId) => {
    const value = stored?.[serviceId];

    accumulator[serviceId] = {
      enabled: value?.enabled ?? false,
      startTime:
        value?.startTime && TIME_PATTERN.test(value.startTime)
          ? value.startTime
          : '09:00',
      endTime:
        value?.endTime && TIME_PATTERN.test(value.endTime)
          ? value.endTime
          : '20:00',
    };

    return accumulator;
  }, {});
}
