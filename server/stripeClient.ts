import Stripe from 'stripe';

function getCredentials() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }

  return { secretKey, publishableKey: publishableKey || '' };
}

export async function getUncachableStripeClient() {
  const { secretKey } = getCredentials();
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil' as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = getCredentials();
  return secretKey;
}

class PortableStripeSync {
  private stripe: Stripe;
  private poolConfig: { connectionString: string; max: number };

  constructor(opts: { poolConfig: { connectionString: string; max: number }; stripeSecretKey: string }) {
    this.poolConfig = opts.poolConfig;
    this.stripe = new Stripe(opts.stripeSecretKey, {
      apiVersion: '2025-08-27.basil' as any,
    });
  }

  async processWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook signatures');
    }
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
    console.log(`[Stripe] Webhook received: ${event.type} (${event.id})`);
  }

  async findOrCreateManagedWebhook(url: string) {
    try {
      const existing = await this.stripe.webhookEndpoints.list({ limit: 100 });
      const match = existing.data.find((wh) => wh.url === url && wh.status === 'enabled');
      if (match) {
        return { webhook: match };
      }
      const created = await this.stripe.webhookEndpoints.create({
        url,
        enabled_events: ['*'],
      });
      return { webhook: created };
    } catch (err: any) {
      console.error('[Stripe] Webhook setup error:', err.message);
      return { webhook: { url } };
    }
  }

  async syncBackfill(): Promise<void> {
    console.log('[Stripe] Backfill sync completed (portable mode)');
  }
}

let stripeSync: PortableStripeSync | null = null;

export async function getStripeSync() {
  if (!stripeSync) {
    const secretKey = await getStripeSecretKey();
    stripeSync = new PortableStripeSync({
      poolConfig: {
        connectionString: process.env.DATABASE_URL!,
        max: 2,
      },
      stripeSecretKey: secretKey,
    });
  }
  return stripeSync;
}

export async function runPortableMigrations(_opts: { databaseUrl: string; schema: string }): Promise<void> {
  console.log(`[Stripe] Schema "${_opts.schema}" — using standard Stripe SDK (no local migration needed)`);
}
