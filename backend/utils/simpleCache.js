/**
 * Simple in-memory cache with LRU eviction and TTL
 * Used for caching expensive calculations like total variant count
 */
class SimpleCache {
  constructor(maxSize = 100, ttlMs = 1800000) { // 30 min default TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  set(key, value) {
    // LRU eviction: remove oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(`🗑️  [Cache] Evicted oldest entry: ${firstKey}`);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttlMs,
      createdAt: Date.now()
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      console.log(`⏰ [Cache] Expired entry: ${key}`);
      return null;
    }
    
    return entry.value;
  }

  clear() {
    this.cache.clear();
    console.log('🧹 [Cache] Cleared all entries');
  }

  size() {
    return this.cache.size;
  }
}

// Export singleton instance
module.exports = new SimpleCache();
