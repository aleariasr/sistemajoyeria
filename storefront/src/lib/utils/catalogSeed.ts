/**
 * Session Seed Utility
 * 
 * Manages a deterministic shuffle seed that persists for the duration of the session.
 * This ensures consistent product order when navigating between catalog and product details.
 * 
 * Features:
 * - Generates a random seed once per session and stores in sessionStorage
 * - Separate seeds for different filter combinations (category, search)
 * - Automatically clears seed when filters change
 */

/**
 * Storage key for catalog seed
 */
const SEED_STORAGE_KEY = 'catalog_shuffle_seed';

/**
 * Storage key for filter context to detect when filters change
 */
const FILTER_CONTEXT_KEY = 'catalog_filter_context';

/**
 * Generate a random integer seed
 * Uses crypto.getRandomValues for better randomness when available
 */
function generateSeed(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0];
  }
  // Fallback to Math.random
  return Math.floor(Math.random() * 2147483647);
}

/**
 * Create a filter context string for comparison
 * This helps detect when filters have changed and seed should be regenerated
 */
function getFilterContext(params?: {
  category?: string;
  search?: string;
}): string {
  const parts: string[] = [];
  
  if (params?.category) {
    parts.push(`cat:${params.category}`);
  }
  
  if (params?.search) {
    parts.push(`search:${params.search}`);
  }
  
  return parts.join('|') || 'none';
}

/**
 * Get or create a session seed for the catalog
 * 
 * The seed is:
 * - Generated once per session (stored in sessionStorage)
 * - Invalidated when filter context changes (category or search)
 * - Consistent across page navigations within the same filter context
 * 
 * @param params - Optional filter parameters to create context
 * @returns A deterministic seed for this session and filter context
 */
export function getCatalogSeed(params?: {
  category?: string;
  search?: string;
}): number {
  // Skip on server-side
  if (typeof window === 'undefined') {
    return generateSeed();
  }

  try {
    const currentContext = getFilterContext(params);
    const storedContext = sessionStorage.getItem(FILTER_CONTEXT_KEY);

    // If filter context changed, clear the old seed
    if (storedContext !== currentContext) {
      sessionStorage.setItem(FILTER_CONTEXT_KEY, currentContext);
      sessionStorage.removeItem(SEED_STORAGE_KEY);
    }

    // Re-fetch stored seed after potential clearing
    const storedSeed = sessionStorage.getItem(SEED_STORAGE_KEY);

    // If we have a stored seed for this context, use it
    if (storedSeed) {
      const seed = parseInt(storedSeed, 10);
      if (!isNaN(seed)) {
        return seed;
      }
    }

    // Generate new seed and store it
    const newSeed = generateSeed();
    sessionStorage.setItem(SEED_STORAGE_KEY, newSeed.toString());
    
    return newSeed;
  } catch (error) {
    // If sessionStorage is not available, just return a new seed
    console.warn('sessionStorage not available for catalog seed:', error);
    return generateSeed();
  }
}

/**
 * Clear the catalog seed
 * Useful when you want to force a new shuffle
 */
export function clearCatalogSeed(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(SEED_STORAGE_KEY);
    sessionStorage.removeItem(FILTER_CONTEXT_KEY);
  } catch (error) {
    console.warn('Failed to clear catalog seed:', error);
  }
}

/**
 * Check if a seed exists for the current context
 */
export function hasCatalogSeed(params?: {
  category?: string;
  search?: string;
}): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const currentContext = getFilterContext(params);
    const storedContext = sessionStorage.getItem(FILTER_CONTEXT_KEY);
    const storedSeed = sessionStorage.getItem(SEED_STORAGE_KEY);

    return storedContext === currentContext && storedSeed !== null;
  } catch (error) {
    return false;
  }
}
