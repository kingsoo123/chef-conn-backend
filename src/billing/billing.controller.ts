import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutDto, VerifyCheckoutDto } from './dto/checkout.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(OptionalAuthGuard)
  createCheckout(
    @Body() dto: CreateCheckoutDto,
    @Req() request: Request & { user?: { id: string; email?: string } },
  ) {
    return this.billingService.createCheckout(dto, request.user ?? null);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifyCheckoutDto) {
    return this.billingService.verifyPayment({
      transactionId: dto.transactionId,
      txRef: dto.txRef,
    });
  }

  @Post('webhooks/flutterwave')
  @HttpCode(200)
  handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('verif-hash') verifHash?: string,
  ) {
    return this.billingService.handleWebhook(body, verifHash);
  }
}
