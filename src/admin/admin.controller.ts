import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../supabase/decorators/current-user.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string; email?: string; role?: string }) {
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role ?? 'admin',
      },
    };
  }

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  users(
    @Query('role') role?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listUsers({
      role: role || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('chefs')
  chefs(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listChefs({
      status: status || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('activities')
  activities(
    @Query('type') type?: string,
    @Query('source') source?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.listActivities({
      type: type || undefined,
      source: source || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('abandoned-payments')
  abandonedPayments(@Query('limit') limit?: string) {
    return this.adminService.listAbandonedPayments(
      limit ? Number(limit) : undefined,
    );
  }

  @Get('location-changes')
  locationChanges(@Query('limit') limit?: string) {
    return this.adminService.listLocationChanges(
      limit ? Number(limit) : undefined,
    );
  }

  @Get('payments')
  payments(@Query('limit') limit?: string) {
    return this.adminService.listRecentPayments(
      limit ? Number(limit) : undefined,
    );
  }
}
