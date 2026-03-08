/**
 * Manual test to demonstrate the variant deduplication fix
 * This test shows that:
 * 1. Products with variants are not duplicated
 * 2. Each variant has a unique name (no parent name prefix)
 * 3. Each variant has a unique image
 */

const axios = require('axios');

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testVariantFix() {
  console.log('🧪 Testing Variant Product Fix\n');
  console.log('='.repeat(60));
  
  // Test with miyuki products that have variants
  const response = await axios.get(`${API_BASE_URL}/api/public/products?per_page=300&search=miyuki`);
  const products = response.data.products;
  
  console.log(`\n📊 Total products returned: ${products.length}`);
  
  // Filter variant products
  const variants = products.filter(p => p.variante_id);
  const nonVariants = products.filter(p => !p.variante_id);
  
  console.log(`   - Variant products: ${variants.length}`);
  console.log(`   - Non-variant products: ${nonVariants.length}`);
  
  // Group variants by parent ID
  const variantsByParent = {};
  variants.forEach(v => {
    if (!variantsByParent[v.id]) {
      variantsByParent[v.id] = [];
    }
    variantsByParent[v.id].push(v);
  });
  
  console.log(`\n🔍 Variant groups by parent product:`);
  Object.keys(variantsByParent).forEach(parentId => {
    const group = variantsByParent[parentId];
    console.log(`\n   Parent ID ${parentId}: ${group.length} variants`);
    
    // Check for duplicates
    const variantIds = group.map(v => v.variante_id);
    const uniqueIds = new Set(variantIds);
    
    if (variantIds.length !== uniqueIds.size) {
      console.log(`   ❌ DUPLICATES FOUND! ${variantIds.length} items but only ${uniqueIds.size} unique IDs`);
    } else {
      console.log(`   ✅ No duplicates - all ${group.length} variants are unique`);
    }
    
    // Check names don't have " - " separator
    const hasOldFormat = group.some(v => v.nombre.includes(' - '));
    if (hasOldFormat) {
      console.log(`   ❌ Some variants use old "Parent - Variant" naming`);
    } else {
      console.log(`   ✅ All variants use independent naming (no parent prefix)`);
    }
    
    // Check all have different images
    const imageUrls = group.map(v => v.imagen_url);
    const uniqueImages = new Set(imageUrls);
    
    if (imageUrls.length !== uniqueImages.size) {
      console.log(`   ❌ Some variants share the same image`);
    } else {
      console.log(`   ✅ All variants have unique images`);
    }
    
    // Show sample variants
    console.log(`\n   Sample variants:`);
    group.slice(0, 3).forEach(v => {
      const imageId = v.imagen_url.split('/').pop().substring(0, 20);
      console.log(`     - "${v.nombre}" (variant_id: ${v.variante_id}, img: ${imageId}...)`);
    });
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed successfully!\n');
}

testVariantFix().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
