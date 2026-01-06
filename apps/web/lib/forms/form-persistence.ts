interface PersistedFormData {
  data: any;
  timestamp: number;
  formId: string;
  version: string;
}

interface FormPersistenceOptions {
  expiryHours?: number;
  maxEntries?: number;
  version?: string;
}

/**
 * Form persistence utility for multi-step forms
 * Saves form state to localStorage with expiration and cleanup
 */
export class FormPersistence {
  private storageKey: string;
  private options: Required<FormPersistenceOptions>;

  constructor(
    formId: string,
    options: FormPersistenceOptions = {}
  ) {
    this.storageKey = `form-persistence-${formId}`;
    this.options = {
      expiryHours: 24, // Default 24 hours
      maxEntries: 10,  // Keep max 10 entries
      version: '1.0',  // Version for data compatibility
      ...options,
    };
  }

  /**
   * Save form data to localStorage
   */
  save(data: any): void {
    try {
      const persistedData: PersistedFormData = {
        data,
        timestamp: Date.now(),
        formId: this.storageKey,
        version: this.options.version,
      };

      // Clean up old entries first
      this.cleanup();

      localStorage.setItem(this.storageKey, JSON.stringify(persistedData));
    } catch (error) {
      console.warn('Failed to save form data:', error);
      // Silently fail - don't break the form
    }
  }

  /**
   * Load form data from localStorage
   */
  load(): any | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return null;

      const persistedData: PersistedFormData = JSON.parse(stored);

      // Check if data is expired
      const ageHours = (Date.now() - persistedData.timestamp) / (1000 * 60 * 60);
      if (ageHours > this.options.expiryHours) {
        this.clear();
        return null;
      }

      // Check version compatibility
      if (persistedData.version !== this.options.version) {
        this.clear();
        return null;
      }

      return persistedData.data;
    } catch (error) {
      console.warn('Failed to load form data:', error);
      this.clear(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Clear stored form data
   */
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear form data:', error);
    }
  }

  /**
   * Check if form data exists and is valid
   */
  exists(): boolean {
    return this.load() !== null;
  }

  /**
   * Clean up expired entries across all forms
   */
  private cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const formKeys = keys.filter(key => key.startsWith('form-persistence-'));

      if (formKeys.length <= this.options.maxEntries) {
        return; // No cleanup needed
      }

      // Get all form entries with timestamps
      const entries = formKeys.map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          return {
            key,
            timestamp: data.timestamp || 0,
          };
        } catch {
          return { key, timestamp: 0 };
        }
      });

      // Sort by timestamp (oldest first) and remove oldest entries
      entries.sort((a, b) => a.timestamp - b.timestamp);

      const toRemove = entries.slice(0, entries.length - this.options.maxEntries);
      toRemove.forEach(entry => {
        localStorage.removeItem(entry.key);
      });
    } catch (error) {
      console.warn('Form cleanup failed:', error);
    }
  }
}

/**
 * React hook for form persistence
 */
export function useFormPersistence<T>(
  formId: string,
  options?: FormPersistenceOptions
) {
  const persistence = new FormPersistence(formId, options);

  const saveFormData = (data: T) => {
    persistence.save(data);
  };

  const loadFormData = (): T | null => {
    return persistence.load();
  };

  const clearFormData = () => {
    persistence.clear();
  };

  const hasPersistedData = (): boolean => {
    return persistence.exists();
  };

  return {
    saveFormData,
    loadFormData,
    clearFormData,
    hasPersistedData,
  };
}

/**
 * Pre-configured persistence instances for common forms
 */
export const formPersistence = {
  onboarding: new FormPersistence('creator-onboarding', {
    expiryHours: 24,
    version: '1.0',
  }),
  contentCreation: new FormPersistence('content-creation', {
    expiryHours: 12,
    version: '1.0',
  }),
  bookingForm: new FormPersistence('service-booking', {
    expiryHours: 6,
    version: '1.0',
  }),
};

/**
 * Utility to clear all form persistence data
 */
export function clearAllFormData(): void {
  try {
    const keys = Object.keys(localStorage);
    const formKeys = keys.filter(key => key.startsWith('form-persistence-'));

    formKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`Cleared ${formKeys.length} persisted form entries`);
  } catch (error) {
    console.warn('Failed to clear all form data:', error);
  }
}

/**
 * Get storage usage statistics
 */
export function getFormPersistenceStats(): {
  totalEntries: number;
  totalSizeBytes: number;
  entries: Array<{ key: string; sizeBytes: number; ageHours: number }>;
} {
  try {
    const keys = Object.keys(localStorage);
    const formKeys = keys.filter(key => key.startsWith('form-persistence-'));

    let totalSizeBytes = 0;
    const entries = formKeys.map(key => {
      const value = localStorage.getItem(key) || '';
      const sizeBytes = new Blob([value]).size;
      totalSizeBytes += sizeBytes;

      let ageHours = 0;
      try {
        const data = JSON.parse(value);
        ageHours = (Date.now() - (data.timestamp || 0)) / (1000 * 60 * 60);
      } catch {}

      return {
        key,
        sizeBytes,
        ageHours,
      };
    });

    return {
      totalEntries: entries.length,
      totalSizeBytes,
      entries,
    };
  } catch (error) {
    console.warn('Failed to get persistence stats:', error);
    return {
      totalEntries: 0,
      totalSizeBytes: 0,
      entries: [],
    };
  }
}
