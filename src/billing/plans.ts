export type BillingAudience = 'host' | 'chef';
export type BillingInterval = 'monthly' | 'quarterly' | 'annually';
export type PlanId = 'starter' | 'pro' | 'premium';

type PlanPrices = Record<BillingInterval, number>;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  description: string;
  prices: PlanPrices;
};

function withBilling(monthly: number): PlanPrices {
  return {
    monthly,
    quarterly: Math.round(monthly * 3 * 0.85),
    annually: Math.round(monthly * 12 * 0.7),
  };
}

export const HOST_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Discover verified chefs and send booking requests.',
    prices: withBilling(70000),
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Priority matching for hosts who book regularly.',
    prices: withBilling(150000),
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Concierge support and unlimited booking requests.',
    prices: withBilling(200000),
  },
];

export const CHEF_PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'List your profile and receive booking requests.',
    prices: withBilling(50000),
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Priority placement and calendar sync for working chefs.',
    prices: withBilling(100000),
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum visibility and dedicated support.',
    prices: withBilling(150000),
  },
];

const PLANS_BY_AUDIENCE: Record<BillingAudience, PlanDefinition[]> = {
  host: HOST_PLANS,
  chef: CHEF_PLANS,
};

export const INTERVAL_MONTHS: Record<BillingInterval, number> = {
  monthly: 1,
  quarterly: 3,
  annually: 12,
};

export function getPlan(
  audience: BillingAudience,
  planId: PlanId,
): PlanDefinition | undefined {
  return PLANS_BY_AUDIENCE[audience].find((plan) => plan.id === planId);
}

export function getPlanAmount(
  audience: BillingAudience,
  planId: PlanId,
  billing: BillingInterval,
): number | null {
  const plan = getPlan(audience, planId);
  return plan ? plan.prices[billing] : null;
}

export function addBillingPeriod(from: Date, billing: BillingInterval): Date {
  const end = new Date(from);
  end.setMonth(end.getMonth() + INTERVAL_MONTHS[billing]);
  return end;
}
