/**
 * Currency abstraction layer for proper monetary value handling
 * Replaces raw BigInt usage with type-safe currency operations
 */

export class Currency {
  constructor(
    public readonly amount: bigint, // Raw value in smallest currency unit (kobo for NGN)
    public readonly currency: string = 'NGN',
    public readonly scale: number = 100 // Kobo per Naira
  ) {
    if (amount < 0n) {
      throw new Error('Currency amount cannot be negative');
    }
  }

  // Create from major currency unit (e.g., 100.50 NGN)
  static fromMajor(amount: number, currency: string = 'NGN', scale: number = 100): Currency {
    const minorAmount = BigInt(Math.round(amount * scale));
    return new Currency(minorAmount, currency, scale);
  }

  // Create from minor currency unit (e.g., 10050 kobo)
  static fromMinor(amount: bigint, currency: string = 'NGN', scale: number = 100): Currency {
    return new Currency(amount, currency, scale);
  }

  // Get major currency value (for display)
  toMajor(): number {
    return Number(this.amount) / this.scale;
  }

  // Get formatted display string
  toDisplayString(): string {
    const major = this.toMajor();
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(major);
  }

  // JSON serialization (safe for BigInt)
  toJSON() {
    return {
      amount: this.amount.toString(),
      currency: this.currency,
      scale: this.scale,
      display: this.toDisplayString(),
      major: this.toMajor()
    };
  }

  // Arithmetic operations
  add(other: Currency): Currency {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add currencies with different codes');
    }
    return new Currency(this.amount + other.amount, this.currency, this.scale);
  }

  subtract(other: Currency): Currency {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract currencies with different codes');
    }
    const result = this.amount - other.amount;
    if (result < 0n) {
      throw new Error('Currency subtraction would result in negative amount');
    }
    return new Currency(result, this.currency, this.scale);
  }

  multiply(factor: number): Currency {
    const result = BigInt(Math.round(Number(this.amount) * factor));
    return new Currency(result, this.currency, this.scale);
  }

  // Comparison
  equals(other: Currency): boolean {
    return this.amount === other.amount &&
           this.currency === other.currency &&
           this.scale === other.scale;
  }

  greaterThan(other: Currency): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare currencies with different codes');
    }
    return this.amount > other.amount;
  }

  // Zero check
  isZero(): boolean {
    return this.amount === 0n;
  }

  // Clone with new amount
  withAmount(amount: bigint): Currency {
    return new Currency(amount, this.currency, this.scale);
  }
}

// Common currency instances
export const ZERO_NGN = new Currency(0n, 'NGN', 100);
export const ONE_NGN = new Currency(100n, 'NGN', 100);

// Utility functions
export function parseCurrency(value: string | number, currency: string = 'NGN'): Currency {
  if (typeof value === 'string') {
    // Assume it's in major units if string
    return Currency.fromMajor(parseFloat(value), currency);
  }
  return Currency.fromMajor(value, currency);
}

export function formatCurrencyRange(min: Currency, max: Currency): string {
  if (min.equals(max)) {
    return min.toDisplayString();
  }
  return `${min.toDisplayString()} - ${max.toDisplayString()}`;
}

// Paystack-specific utilities (Paystack uses kobo)
export function toPaystackAmount(currency: Currency): number {
  if (currency.currency !== 'NGN') {
    throw new Error('Paystack only supports NGN');
  }
  return Number(currency.amount);
}

export function fromPaystackAmount(amount: number): Currency {
  return Currency.fromMinor(BigInt(amount), 'NGN', 100);
}
