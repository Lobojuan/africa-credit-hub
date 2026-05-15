import { getUncachableStripeClient } from './stripeClient';

export async function seedStripeProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    const existing = await stripe.products.search({ query: "name:'Universal Credit Hub Standard'" });
    if (existing.data.length > 0) {
      console.log('Stripe products already exist, skipping seed');
      return;
    }

    const standardProduct = await stripe.products.create({
      name: 'Universal Credit Hub Standard',
      description: 'Credit Registry Standard Plan - Up to 10 users, basic reports',
      metadata: { tier: 'standard', maxUsers: '10' },
    });
    await stripe.prices.create({
      product: standardProduct.id,
      unit_amount: 29900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'standard' },
    });

    const proProduct = await stripe.products.create({
      name: 'Universal Credit Hub Professional',
      description: 'Credit Registry Professional Plan - Up to 50 users, advanced analytics',
      metadata: { tier: 'professional', maxUsers: '50' },
    });
    await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 79900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'professional' },
    });

    const entProduct = await stripe.products.create({
      name: 'Universal Credit Hub Enterprise',
      description: 'Credit Registry Enterprise Plan - Unlimited users, full API access',
      metadata: { tier: 'enterprise', maxUsers: '100' },
    });
    await stripe.prices.create({
      product: entProduct.id,
      unit_amount: 199900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier: 'enterprise' },
    });

    console.log('Stripe products seeded successfully');
  } catch (error: any) {
    console.error('Failed to seed Stripe products:', error.message);
  }
}
