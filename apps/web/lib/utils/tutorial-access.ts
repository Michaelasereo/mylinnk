// Tutorial Access Utility Functions

export interface AccessInfo {
  hasAccess: boolean;
  accessType: 'free' | 'collection' | 'individual' | 'purchase_required';
  requiresPayment: boolean;
  collectionId?: string;
  collectionTitle?: string;
  collectionPrice?: number;
  tutorialPrice?: number;
  subscriptionType?: 'one_time' | 'recurring';
}

export interface TutorialInfo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  accessType: string;
  tutorialPrice?: number;
  collectionId?: string;
  collection?: {
    id: string;
    title: string;
    price?: number;
    subscriptionPrice?: number;
    subscriptionType?: string;
  };
}

/**
 * Determine what access is required for a tutorial
 */
export function getAccessRequiredInfo(tutorial: TutorialInfo): AccessInfo {
  // Free tutorials
  if (tutorial.accessType === 'free') {
    return {
      hasAccess: true,
      accessType: 'free',
      requiresPayment: false,
    };
  }

  // Tutorial is part of a collection
  if (tutorial.collectionId && tutorial.collection) {
    return {
      hasAccess: false,
      accessType: 'collection',
      requiresPayment: true,
      collectionId: tutorial.collection.id,
      collectionTitle: tutorial.collection.title,
      collectionPrice: tutorial.collection.price || tutorial.collection.subscriptionPrice,
      subscriptionType: (tutorial.collection.subscriptionType as 'one_time' | 'recurring') || 'one_time',
    };
  }

  // Individual tutorial purchase required
  if (tutorial.tutorialPrice) {
    return {
      hasAccess: false,
      accessType: 'individual',
      requiresPayment: true,
      tutorialPrice: tutorial.tutorialPrice,
    };
  }

  // Default: subscription required (fallback)
  return {
    hasAccess: false,
    accessType: 'purchase_required',
    requiresPayment: true,
  };
}

/**
 * Format price in Naira from kobo
 */
export function formatPriceNaira(priceInKobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(priceInKobo / 100);
}

/**
 * Get display text for access type
 */
export function getAccessTypeLabel(accessType: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    subscription: 'Subscription Required',
    one_time: 'One-time Purchase',
    collection: 'Collection Access Required',
    individual: 'Purchase Required',
    purchase_required: 'Purchase Required',
  };
  return labels[accessType] || 'Access Required';
}

/**
 * Check if content should show a lock icon
 */
export function shouldShowLock(
  accessType: string,
  hasVerifiedAccess: boolean
): boolean {
  if (accessType === 'free') return false;
  return !hasVerifiedAccess;
}

/**
 * Get the appropriate action text for a locked tutorial
 */
export function getUnlockActionText(accessInfo: AccessInfo): string {
  if (accessInfo.accessType === 'collection') {
    return `Subscribe to Collection (${formatPriceNaira(accessInfo.collectionPrice || 0)})`;
  }
  if (accessInfo.accessType === 'individual' && accessInfo.tutorialPrice) {
    return `Purchase Tutorial (${formatPriceNaira(accessInfo.tutorialPrice)})`;
  }
  return 'Unlock Access';
}

/**
 * Storage key for verified access (localStorage)
 */
export function getVerifiedAccessKey(type: 'collection' | 'tutorial', id: string): string {
  return `verified_${type}_${id}`;
}

/**
 * Store verified access in localStorage
 */
export function storeVerifiedAccess(
  type: 'collection' | 'tutorial',
  id: string,
  email: string
): void {
  if (typeof window === 'undefined') return;
  const key = getVerifiedAccessKey(type, id);
  const data = { email, verifiedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Get stored verified access from localStorage
 */
export function getStoredVerifiedAccess(
  type: 'collection' | 'tutorial',
  id: string
): { email: string; verifiedAt: string } | null {
  if (typeof window === 'undefined') return null;
  const key = getVerifiedAccessKey(type, id);
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Clear stored verified access
 */
export function clearVerifiedAccess(type: 'collection' | 'tutorial', id: string): void {
  if (typeof window === 'undefined') return;
  const key = getVerifiedAccessKey(type, id);
  localStorage.removeItem(key);
}

/**
 * Check if email is stored for verified access
 */
export function hasStoredVerifiedAccess(
  type: 'collection' | 'tutorial',
  id: string,
  email?: string
): boolean {
  const stored = getStoredVerifiedAccess(type, id);
  if (!stored) return false;
  if (email && stored.email !== email.toLowerCase()) return false;
  return true;
}

