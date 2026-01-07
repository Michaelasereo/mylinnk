/**
 * Safely serialize Prisma objects for Next.js
 * Converts Decimal, BigInt, Date to strings/numbers
 */
export function serializePrismaObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializePrismaObject(item));
  }

  // Handle Prisma Decimal
  if (obj && typeof obj === 'object' && 'toNumber' in obj && typeof obj.toNumber === 'function') {
    // This is a Prisma Decimal
    return obj.toNumber();
  }

  // Handle BigInt
  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  // Handle Date
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle regular objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializePrismaObject(obj[key]);
      }
    }
    return result;
  }

  // Return primitives as-is
  return obj;
}

/**
 * Specialized serializer for Creator objects
 */
export function serializeCreator(creator: any) {
  if (!creator) return null;

  // First pass: serialize all Prisma special types
  const serialized = serializePrismaObject(creator);

  // Ensure specific fields are numbers
  if (serialized.chargebackRate && typeof serialized.chargebackRate === 'string') {
    serialized.chargebackRate = parseFloat(serialized.chargebackRate);
  }

  return serialized;
}
