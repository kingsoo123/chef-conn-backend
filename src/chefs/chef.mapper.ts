import { ChefProfile } from './chef-profile.entity';
import {
  AVAILABILITY_DAY_KEYS,
  normalizeServiceSchedules,
  normalizeWeeklySchedule,
  type ServiceSchedules,
  type WeeklySchedule,
} from '../availability/availability.constants';

const DEFAULT_CHEF_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDrY9rfRi4O82wUquIwf8w80n0bskGFymamRUwtFmqXGbnCwK99lGKx8nuXrR_wZ-c8XcMqI0aja44CA-vmHcVW0hF574cPV2kK3Sa-5Xdcp2hATtrgpbtaX1PP8nd-ucj3Ax9C4D2ROW4x_fnvBUyjlMer4X4FZK3tDqqusp3O4YiSkqRCLRX4qAwafeRhlVgv_VozlAy5dOSyCS4uyKSg1E7RtjxoQE1noaAPirc6z26s85oFRThrj28ZtBPmKmaRgeRC7eyM_C1p';

const EXPERIENCE_LABELS: Record<string, string> = {
  '1-3': '1–3 years',
  '4-7': '4–7 years',
  '8-12': '8–12 years',
  '12+': '12+ years',
};

const SERVICE_API_TO_CLIENT: Record<string, string> = {
  catering: 'event-catering',
};

const SERVICE_CLIENT_TO_API: Record<string, string> = {
  'event-catering': 'catering',
};

export function mapServiceToClient(service: string): string {
  return SERVICE_API_TO_CLIENT[service] ?? service;
}

export function mapServicesToApi(services: string[]): string[] {
  return services.map(
    (service) => SERVICE_CLIENT_TO_API[service] ?? service,
  );
}

const DAY_SHORT_LABELS: Record<(typeof AVAILABILITY_DAY_KEYS)[number], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export function mapEnabledDayLabels(
  schedule?: Partial<WeeklySchedule> | null,
): string[] {
  const normalized = normalizeWeeklySchedule(schedule);

  return AVAILABILITY_DAY_KEYS.filter((day) => normalized[day].enabled).map(
    (day) => DAY_SHORT_LABELS[day],
  );
}

export function mapChefPublicAvailability(
  profile: ChefProfile,
  blockedDates: string[],
) {
  const today = new Date().toISOString().slice(0, 10);
  const weeklySchedule = normalizeWeeklySchedule(
    profile.weeklySchedule as WeeklySchedule | null,
  );
  const apiServiceSchedules = normalizeServiceSchedules(
    profile.services,
    profile.serviceSchedules as ServiceSchedules | null,
  );
  const serviceSchedules = Object.fromEntries(
    Object.entries(apiServiceSchedules).map(([serviceId, window]) => [
      mapServiceToClient(serviceId),
      window,
    ]),
  );

  return {
    acceptingBookings: profile.isAvailable,
    weeklySchedule,
    serviceSchedules,
    availableDays: mapEnabledDayLabels(
      profile.weeklySchedule as WeeklySchedule | null,
    ),
    blockedDates: blockedDates
      .filter((date) => date >= today)
      .slice(0, 60),
  };
}

export function mapChefProfileToListItem(profile: ChefProfile) {
  const image = profile.imageUrl ?? DEFAULT_CHEF_IMAGE;

  return {
    id: profile.id,
    slug: profile.slug ?? profile.id,
    name: profile.displayName,
    specialty: profile.specialties[0] ?? 'Private Chef',
    specialties: profile.specialties,
    rating: Number(profile.rating ?? 0),
    reviews: profile.reviewCount ?? 0,
    pricePerDay: profile.pricePerDay ?? 0,
    services: profile.services.map(mapServiceToClient),
    areas: profile.areas,
    description: profile.bio,
    image,
    alt: `Portrait of ${profile.displayName}`,
    experience: EXPERIENCE_LABELS[profile.experience] ?? profile.experience,
    experienceLevel: profile.experience,
    available: profile.isAvailable,
    availableDays: mapEnabledDayLabels(
      profile.weeklySchedule as WeeklySchedule | null,
    ),
    verified: profile.status === 'approved',
  };
}
