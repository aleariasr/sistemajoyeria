#!/usr/bin/env node

/**
 * Test Orchestrator - Comprehensive QA Suite Runner
 * 
 * Executes all test suites in sequence with 100% mocked coverage:
 * 1. Backend unit tests (models, utilities, business logic)
 * 2. Backend auth tests (authentication, middleware)
 * 3. Backend joyas CRUD tests (create, read, update, delete, listings)
 * 4. Backend public API tests (storefront endpoints, mocked)
 * 5. Backend POS tests (ventas, devoluciones, cierre caja, cuentas por cobrar)
 * 6. Backend pedidos online tests (online orders)
 * 7. Backend notifications tests (email, push notifications)
 * 8. Backend smoke E2E tests (complete flows)
 * 9. Backend performance tests (API benchmarks)
 * 10. Frontend POS tests (React components)
 * 11. Storefront unit tests (components, utilities)
 * 12. Storefront lint check
 * 13. Frontend build verification
 * 14. Storefront build verification
 * 15. Storefront E2E tests (optional - set RUN_E2E_TESTS=true)
 * 
 * All tests use mocks - no real services required:
 * - Supabase mocked (in-memory database)
 * - Cloudinary mocked (fake image URLs)
 * - Resend mocked (no emails sent)
 * - Web-push mocked (no notifications sent)
 * 
 * Usage: 
 *   npm run test:full                    # Run all tests except E2E
 *   RUN_E2E_TESTS=true npm run test:full # Run all tests including E2E (requires server)
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: []
};

/**
 * Run a command and return result
 */
function runCommand(command, args, cwd = process.cwd()) {
  return new Promise((resolve) => {
    console.log(`${colors.cyan}▶ Running:${colors.reset} ${command} ${args.join(' ')}`);
    console.log(`${colors.gray}  Working directory: ${cwd}${colors.reset}\n`);

    const startTime = Date.now();
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      resolve({ code, duration });
    });

    proc.on('error', (err) => {
      console.error(`${colors.red}Error executing command:${colors.reset}`, err);
      resolve({ code: 1, duration: 0, error: err });
    });
  });
}

/**
 * Print a section header
 */
function printHeader(title, emoji = '🧪') {
  console.log('\n' + '═'.repeat(80));
  console.log(`${emoji}  ${colors.blue}${title}${colors.reset}`);
  console.log('═'.repeat(80) + '\n');
}

/**
 * Print a summary
 */
function printSummary() {
  console.log('\n' + '═'.repeat(80));
  console.log(`${colors.blue}📊 FINAL RESULTS SUMMARY${colors.reset}`);
  console.log('═'.repeat(80) + '\n');

  if (results.passed.length > 0) {
    console.log(`${colors.green}✅ PASSED (${results.passed.length}):${colors.reset}`);
    results.passed.forEach(r => {
      console.log(`   ${colors.green}✓${colors.reset} ${r.name} ${colors.gray}(${r.duration}s)${colors.reset}`);
    });
    console.log('');
  }

  if (results.skipped.length > 0) {
    console.log(`${colors.yellow}⏭️  SKIPPED (${results.skipped.length}):${colors.reset}`);
    results.skipped.forEach(r => {
      console.log(`   ${colors.yellow}○${colors.reset} ${r.name} - ${r.reason}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log(`${colors.red}❌ FAILED (${results.failed.length}):${colors.reset}`);
    results.failed.forEach(r => {
      console.log(`   ${colors.red}✗${colors.reset} ${r.name} ${colors.gray}(${r.duration}s)${colors.reset}`);
    });
    console.log('');
  }

  const total = results.passed.length + results.failed.length + results.skipped.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

  console.log('─'.repeat(80));
  console.log(`Total: ${total} | Passed: ${results.passed.length} | Failed: ${results.failed.length} | Skipped: ${results.skipped.length}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log('═'.repeat(80) + '\n');
}

/**
 * Main test orchestrator
 */
async function main() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════════════════════╗`);
  console.log(`║                   🧪 COMPREHENSIVE QA TEST SUITE                           ║`);
  console.log(`║                   Sistema de Joyería - Full Test Run                       ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const rootDir = path.resolve(__dirname, '..');
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');
  const storefrontDir = path.join(rootDir, 'storefront');

  // Test suite definitions
  const testSuites = [
    // Backend Unit Tests
    {
      name: 'Backend Unit Tests',
      command: 'npx',
      args: ['jest', 'tests/unit/', '--passWithNoTests'],
      cwd: backendDir,
      emoji: '🔬'
    },
    
    // Backend Integration Tests - Auth
    {
      name: 'Backend Auth Tests',
      command: 'npx',
      args: ['jest', 'tests/unit/auth.middleware.test.js', 'tests/integration/auth.routes.test.js'],
      cwd: backendDir,
      emoji: '🔐'
    },
    
    // Backend Integration Tests - Joyas CRUD
    {
      name: 'Backend Joyas CRUD Tests (Mocked)',
      command: 'npx',
      args: ['jest', 'tests/integration/joyas-crud-mocked.test.js', 'tests/integration/joyas-admin-listing-mocked.test.js'],
      cwd: backendDir,
      emoji: '💎'
    },
    
    // Backend Integration Tests - Public API
    {
      name: 'Backend Public API Tests (Mocked)',
      command: 'npx',
      args: ['jest', 'tests/integration/public.routes.test.js', 'tests/integration/public-listing-mocked.test.js'],
      cwd: backendDir,
      emoji: '🌐'
    },
    
    // Backend Integration Tests - POS (Ventas, Devoluciones, Cierre Caja, Cuentas)
    {
      name: 'Backend POS Tests',
      command: 'npx',
      args: ['jest', 'tests/integration/ventas.routes.test.js', 'tests/integration/devoluciones.routes.test.js', 'tests/integration/cierrecaja.routes.test.js', 'tests/integration/cuentas-por-cobrar.routes.test.js'],
      cwd: backendDir,
      emoji: '🏪'
    },
    
    // Backend Integration Tests - Pedidos Online
    {
      name: 'Backend Pedidos Online Tests',
      command: 'npx',
      args: ['jest', 'tests/integration/pedidos-online.routes.test.js'],
      cwd: backendDir,
      emoji: '📦'
    },
    
    // Backend Integration Tests - Notifications
    {
      name: 'Backend Notifications Tests',
      command: 'npx',
      args: ['jest', 'tests/integration/notifications.routes.test.js', 'tests/unit/emailService.test.js'],
      cwd: backendDir,
      emoji: '📧'
    },
    
    // Backend Smoke E2E Tests
    {
      name: 'Backend Smoke E2E Tests',
      command: 'npx',
      args: ['jest', 'tests/integration/smoke-e2e.test.js', '--testTimeout=30000'],
      cwd: backendDir,
      emoji: '🚀'
    },
    
    // Backend Performance Tests
    {
      name: 'Backend Performance Tests',
      command: 'npx',
      args: ['jest', 'tests/performance/', '--testTimeout=10000'],
      cwd: backendDir,
      emoji: '⚡'
    },
    
    // Frontend POS Tests
    {
      name: 'Frontend POS Tests',
      command: 'npm',
      args: ['run', 'test'],
      cwd: frontendDir,
      emoji: '🖥️'
    },
    
    // Storefront Unit Tests
    {
      name: 'Storefront Unit Tests',
      command: 'npm',
      args: ['run', 'test'],
      cwd: storefrontDir,
      emoji: '🛍️'
    },
    
    // Storefront Lint Check
    {
      name: 'Storefront Lint Check',
      command: 'npm',
      args: ['run', 'lint'],
      cwd: storefrontDir,
      emoji: '✨'
    },
    
    // Build Verification - Frontend
    {
      name: 'Frontend Build Verification',
      command: 'npm',
      args: ['run', 'build'],
      cwd: frontendDir,
      emoji: '🏗️'
    },
    
    // Build Verification - Storefront
    {
      name: 'Storefront Build Verification',
      command: 'npm',
      args: ['run', 'build'],
      cwd: storefrontDir,
      emoji: '🏗️'
    },
    
    // Storefront E2E Tests (Playwright) - Optional, requires running server
    // Uncomment to include E2E tests (requires storefront server running on port 3002)
    // {
    //   name: 'Storefront E2E Tests (Playwright)',
    //   command: 'npm',
    //   args: ['run', 'test:e2e'],
    //   cwd: storefrontDir,
    //   emoji: '🎭'
    // }
  ];
  
  // Allow skipping E2E tests via environment variable
  if (process.env.RUN_E2E_TESTS === 'true') {
    testSuites.push({
      name: 'Storefront E2E Tests (Playwright)',
      command: 'npm',
      args: ['run', 'test:e2e'],
      cwd: storefrontDir,
      emoji: '🎭'
    });
  }

  // Run each test suite
  for (const suite of testSuites) {
    printHeader(suite.name, suite.emoji);
    
    const result = await runCommand(suite.command, suite.args, suite.cwd);
    
    if (result.code === 0) {
      results.passed.push({ name: suite.name, duration: result.duration });
      console.log(`\n${colors.green}✅ ${suite.name} PASSED${colors.reset} ${colors.gray}(${result.duration}s)${colors.reset}\n`);
    } else {
      results.failed.push({ name: suite.name, duration: result.duration });
      console.log(`\n${colors.red}❌ ${suite.name} FAILED${colors.reset} ${colors.gray}(${result.duration}s)${colors.reset}\n`);
      
      // Continue with other tests even if one fails
      console.log(`${colors.yellow}⚠️  Continuing with remaining tests...${colors.reset}\n`);
    }
  }

  // Print summary
  printSummary();

  // Exit with error if any tests failed
  if (results.failed.length > 0) {
    console.log(`${colors.red}❌ Some tests failed. Please review the output above.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ All tests passed successfully!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run the orchestrator
main().catch((err) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
