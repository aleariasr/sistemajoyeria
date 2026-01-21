#!/usr/bin/env node

/**
 * Test Orchestrator - Comprehensive QA Suite Runner
 * 
 * Executes all test suites in sequence and reports results:
 * 1. Backend unit tests
 * 2. Backend integration tests (auth, passing)
 * 3. Backend smoke E2E tests
 * 4. Backend performance tests
 * 5. Storefront unit tests
 * 6. Build verification (frontend and storefront)
 * 7. Lint verification (storefront)
 * 
 * Usage: npm run test:full
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
    {
      name: 'Backend Unit Tests',
      command: 'npx',
      args: ['jest', 'tests/unit/', '--passWithNoTests'],
      cwd: backendDir,
      emoji: '🔬'
    },
    {
      name: 'Backend Integration Tests (Auth)',
      command: 'npx',
      args: ['jest', 'tests/integration/auth.routes.test.js'],
      cwd: backendDir,
      emoji: '🔐'
    },
    {
      name: 'Backend Smoke E2E Tests',
      command: 'npx',
      args: ['jest', 'tests/integration/smoke-e2e.test.js', '--testTimeout=30000'],
      cwd: backendDir,
      emoji: '🚀'
    },
    {
      name: 'Backend Performance Tests',
      command: 'npx',
      args: ['jest', 'tests/performance/', '--testTimeout=10000'],
      cwd: backendDir,
      emoji: '⚡'
    },
    {
      name: 'Storefront Unit Tests',
      command: 'npm',
      args: ['run', 'test'],
      cwd: storefrontDir,
      emoji: '🛍️'
    },
    {
      name: 'Frontend Build Verification',
      command: 'npm',
      args: ['run', 'build'],
      cwd: frontendDir,
      emoji: '🏗️'
    },
    {
      name: 'Storefront Build Verification',
      command: 'npm',
      args: ['run', 'build'],
      cwd: storefrontDir,
      emoji: '🏗️'
    },
    {
      name: 'Storefront Lint Check',
      command: 'npm',
      args: ['run', 'lint'],
      cwd: storefrontDir,
      emoji: '✨'
    }
  ];

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
