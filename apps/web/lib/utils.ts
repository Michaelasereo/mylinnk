import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deep clone and convert BigInt/Decimal values to strings/numbers for client serialization
 */
export function serializeForClient<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString() as T;
  }

  if (typeof obj === 'object' && 'toNumber' in obj && typeof obj.toNumber === 'function') {
    // Handle Prisma Decimal objects
    return obj.toNumber() as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeForClient(item)) as T;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeForClient(value);
    }
    return result;
  }

  return obj;
}

