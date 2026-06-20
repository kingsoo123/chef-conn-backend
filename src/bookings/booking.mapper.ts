import { Booking } from './booking.entity';
import { mapServiceToClient } from '../chefs/chef.mapper';

const SERVICE_LABELS: Record<string, string> = {
  'home-dining': 'Home dining',
  'meal-prep': 'Meal preparation',
  catering: 'Event catering',
  'event-catering': 'Event catering',
  'private-events': 'Private events',
};

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

function getHostInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

function formatBudget(pricePerDay: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(pricePerDay);
}

function formatBudgetLabel(budget: number | null) {
  if (budget == null) {
    return 'Not specified';
  }

  return formatBudget(budget);
}

function formatBookingArea(booking: Booking) {
  if (booking.address && booking.country) {
    return [booking.address, booking.state, booking.country]
      .filter(Boolean)
      .join(', ');
  }

  return booking.location;
}

export function mapBookingToResponse(booking: Booking) {
  const serviceId = mapServiceToClient(booking.service);
  const serviceLabel = SERVICE_LABELS[serviceId] ?? SERVICE_LABELS[booking.service] ?? 'Private dining';

  return {
    id: booking.id,
    hostName: booking.hostName,
    hostInitials: getHostInitials(booking.hostName),
    hostEmail: booking.hostEmail,
    hostPhone: booking.hostPhone,
    serviceId,
    title: `${serviceLabel} request`,
    guests: booking.guestCount,
    area: formatBookingArea(booking),
    dateLabel: formatEventDate(booking.eventDate),
    timeLabel: booking.eventTime,
    budget: booking.budget,
    budgetLabel: formatBudgetLabel(booking.budget),
    status: booking.status,
    note: booking.notes,
    eventDate: booking.eventDate,
    createdAt: booking.createdAt.toISOString(),
  };
}
