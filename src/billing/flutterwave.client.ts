import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

type CreatePaymentInput = {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  meta: Record<string, string | number | boolean | null>;
  title: string;
  description: string;
};

type FlutterwavePaymentResponse = {
  status: string;
  message: string;
  data?: {
    link?: string;
  };
};

type FlutterwaveVerifyResponse = {
  status: string;
  message: string;
  data?: {
    id?: number;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number;
    currency?: string;
    status?: string;
    customer?: {
      email?: string;
      name?: string;
    };
  };
};

@Injectable()
export class FlutterwaveClient {
  private readonly logger = new Logger(FlutterwaveClient.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  private getSecretKey(): string {
    const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY.',
      );
    }
    return key;
  }

  async createPaymentLink(input: CreatePaymentInput): Promise<string> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.getSecretKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: input.txRef,
        amount: input.amount,
        currency: input.currency,
        redirect_url: input.redirectUrl,
        customer: input.customer,
        meta: input.meta,
        customizations: {
          title: input.title,
          description: input.description,
        },
      }),
    });

    const body = (await response.json()) as FlutterwavePaymentResponse;

    if (!response.ok || body.status !== 'success' || !body.data?.link) {
      this.logger.error(
        `Flutterwave payment create failed: ${body.message ?? response.status}`,
      );
      throw new ServiceUnavailableException(
        body.message || 'Unable to start Flutterwave checkout',
      );
    }

    return body.data.link;
  }

  async verifyTransaction(transactionId: string) {
    const response = await fetch(
      `${this.baseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.getSecretKey()}`,
        },
      },
    );

    const body = (await response.json()) as FlutterwaveVerifyResponse;

    if (!response.ok || body.status !== 'success' || !body.data) {
      this.logger.warn(
        `Flutterwave verify failed for ${transactionId}: ${body.message}`,
      );
      throw new ServiceUnavailableException(
        body.message || 'Unable to verify Flutterwave payment',
      );
    }

    return body.data;
  }
}
