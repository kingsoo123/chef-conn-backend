import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvailabilityService } from '../availability/availability.service';
import { ChefProfile } from '../chefs/chef-profile.entity';
import { mapServicesToApi } from '../chefs/chef.mapper';
import { Booking, type BookingStatus } from './booking.entity';
import { mapBookingToResponse } from './booking.mapper';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(ChefProfile)
    private readonly chefProfilesRepository: Repository<ChefProfile>,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async createForChefSlug(slug: string, dto: CreateBookingDto) {
    const profile = await this.findBookableProfile(slug);
    const service = this.resolveService(profile, dto.service);

    await this.availabilityService.validateBookingForProfile(profile, {
      service,
      eventDate: dto.eventDate,
      eventTime: dto.eventTime.trim(),
    });

    const country = dto.country.trim();
    const state = dto.state?.trim() || null;
    const address = dto.address.trim();

    const booking = this.bookingsRepository.create({
      chefProfileId: profile.id,
      hostName: dto.hostName.trim(),
      hostEmail: dto.hostEmail?.trim().toLowerCase() || null,
      hostPhone: dto.hostPhone?.trim() || null,
      service,
      eventDate: dto.eventDate,
      eventTime: dto.eventTime.trim(),
      guestCount: dto.guestCount,
      country,
      state,
      address,
      location: this.formatLocation({ country, state, address }),
      notes: dto.notes.trim(),
      budget: dto.budget ?? null,
      status: 'new',
    });

    const saved = await this.bookingsRepository.save(booking);

    return {
      booking: mapBookingToResponse(saved),
    };
  }

  async listForChef(userId: string) {
    const profile = await this.findChefProfileForUser(userId);

    const bookings = await this.bookingsRepository.find({
      where: { chefProfileId: profile.id },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return {
      data: bookings.map((booking) =>
        mapBookingToResponse(booking),
      ),
    };
  }

  async updateStatusForChef(
    userId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const profile = await this.findChefProfileForUser(userId);

    const booking = await this.bookingsRepository.findOne({
      where: {
        id: bookingId,
        chefProfileId: profile.id,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.assertStatusTransition(booking.status, dto.status);

    booking.status = dto.status;
    const saved = await this.bookingsRepository.save(booking);

    return {
      booking: mapBookingToResponse(saved),
    };
  }

  private formatLocation(parts: {
    country: string;
    state: string | null;
    address: string;
  }) {
    return [parts.address, parts.state, parts.country].filter(Boolean).join(', ');
  }

  private resolveService(profile: ChefProfile, requestedService: string) {
    const normalized = mapServicesToApi([requestedService])[0] ?? requestedService;

    if (!profile.services.includes(normalized)) {
      throw new BadRequestException('Selected service is not offered by this chef');
    }

    return normalized;
  }

  private assertStatusTransition(
    current: BookingStatus,
    next: UpdateBookingStatusDto['status'],
  ) {
    const allowed: Record<BookingStatus, UpdateBookingStatusDto['status'][]> = {
      new: ['confirmed', 'declined'],
      awaiting_response: ['confirmed', 'declined'],
      confirmed: ['completed'],
      declined: [],
      completed: [],
      cancelled: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot move booking from ${current} to ${next}`,
      );
    }
  }

  private async findBookableProfile(slug: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { slug, status: 'approved', isAvailable: true },
    });

    if (!profile) {
      throw new NotFoundException('Chef is not available for bookings');
    }

    return profile;
  }

  private async findChefProfileForUser(userId: string) {
    const profile = await this.chefProfilesRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Chef profile not found');
    }

    return profile;
  }
}
