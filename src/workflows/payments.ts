import { proxyActivities } from '@temporalio/workflow';
import * as payments from '../activities/payments';

const { createPayoneerCheckout, getLocalizedAccounts } = proxyActivities<typeof payments>({ startToCloseTimeout: '10 minute' });

export async function createCheckout(amount: number, currency: 'USD' | 'EUR' | 'GBP', reference?: string, metadata?: any) {
  return createPayoneerCheckout({ amount, currency, reference, metadata });
}

export async function localizedAccounts() {
  return getLocalizedAccounts();
}

