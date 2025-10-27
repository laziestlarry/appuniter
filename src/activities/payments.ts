export interface CheckoutRequest {
  amount: number; // minor units optional; keep simple for scaffold
  currency: 'USD' | 'EUR' | 'GBP';
  reference?: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  currency: string;
  amount: number;
  url?: string;
  provider: 'payoneer';
  status: 'created' | 'pending' | 'paid' | 'failed';
}

export interface LocalAccounts {
  USD?: { accountNumber?: string; bankName?: string };
  EUR?: { accountNumber?: string; bankName?: string; iban?: string };
  GBP?: { accountNumber?: string; sortCode?: string; bankName?: string };
}

// NOTE: These are stubs; wire real Payoneer API inside activities in production
export async function createPayoneerCheckout(req: CheckoutRequest): Promise<CheckoutSession> {
  // Placeholder checkout session
  return {
    id: `chk_${Date.now()}`,
    currency: req.currency,
    amount: req.amount,
    url: `https://pay.example/checkout/${Date.now()}`,
    provider: 'payoneer',
    status: 'created',
  };
}

export async function getLocalizedAccounts(): Promise<LocalAccounts> {
  // Placeholder localized receiving accounts
  return {
    USD: { accountNumber: '0001234567', bankName: 'Demo Bank USA' },
    EUR: { accountNumber: 'DEMOIBAN1234567890', bankName: 'Demo Bank EU', iban: 'DE89 3704 0044 0532 0130 00' },
    GBP: { accountNumber: '12345678', sortCode: '12-34-56', bankName: 'Demo Bank UK' },
  };
}

