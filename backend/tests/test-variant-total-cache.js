/**
 * Test: Variant Total Cache
 * Validates the simple cache implementation for variant totals
 */

const simpleCache = require('../utils/simpleCache');

console.log('🧪 Testing Simple Cache Implementation\n');

let allPassed = true;

// Test 1: Basic set/get
console.log('📝 Test 1: Basic set/get');
simpleCache.clear();
simpleCache.set('test-key', 123);
const value = simpleCache.get('test-key');
if (value === 123) {
  console.log('  ✅ PASS: Cache stores and retrieves values');
} else {
  console.log(`  ❌ FAIL: Expected 123, got ${value}`);
  allPassed = false;
}

// Test 2: Cache miss
console.log('\n📝 Test 2: Cache miss returns null');
const missing = simpleCache.get('non-existent-key');
if (missing === null) {
  console.log('  ✅ PASS: Missing keys return null');
} else {
  console.log(`  ❌ FAIL: Expected null, got ${missing}`);
  allPassed = false;
}

// Test 3: TTL expiration
console.log('\n📝 Test 3: TTL expiration (50ms timeout)');
const { SimpleCache } = require('../utils/simpleCache');
const shortLivedCache = new SimpleCache(100, 50);
shortLivedCache.set('expire-test', 456);
setTimeout(() => {
  const expired = shortLivedCache.get('expire-test');
  if (expired === null) {
    console.log('  ✅ PASS: Expired entries return null');
  } else {
    console.log(`  ❌ FAIL: Expected null, got ${expired}`);
    allPassed = false;
  }
  
  // Test 4: LRU eviction
  console.log('\n📝 Test 4: LRU eviction (maxSize=3)');
  const lruCache = new SimpleCache(3, 60000);
  lruCache.set('key1', 1);
  lruCache.set('key2', 2);
  lruCache.set('key3', 3);
  lruCache.set('key4', 4); // Should evict key1
  
  const evicted = lruCache.get('key1');
  const kept = lruCache.get('key4');
  
  if (evicted === null && kept === 4) {
    console.log('  ✅ PASS: LRU eviction works correctly');
  } else {
    console.log(`  ❌ FAIL: Evicted=${evicted}, Kept=${kept}`);
    allPassed = false;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All cache tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}, 100);
