#!/bin/bash

# Test Orchestrator Shell Wrapper
# 
# This script executes the comprehensive QA test suite for Sistema de Joyería.
# All tests use mocks - no real services required.
#
# Usage: ./scripts/test-full.sh
# Or: npm run test:full

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          🧪 COMPREHENSIVE QA TEST SUITE - Shell Wrapper                   ║${NC}"
echo -e "${CYAN}║                   Sistema de Joyería - Full Test Run                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to root directory
cd "$ROOT_DIR"

echo -e "${BLUE}📍 Working directory: ${ROOT_DIR}${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
    echo ""
fi

# Set environment variables for test mode
export NODE_ENV=test
export CI=false

# Optional: Set minimal environment variables if needed
# These are typically not required for mocked tests, but can be set if needed
# export SUPABASE_URL=mock://localhost
# export SUPABASE_KEY=mock-key
# export CLOUDINARY_CLOUD_NAME=mock
# export RESEND_API_KEY=mock-key

echo -e "${BLUE}🚀 Starting comprehensive test suite...${NC}"
echo ""

# Execute the test orchestrator
node scripts/test-orchestrator.js

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  ✅ ALL TESTS PASSED SUCCESSFULLY! ✅                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ❌ SOME TESTS FAILED ❌                                 ║${NC}"
    echo -e "${RED}║              Please review the output above for details                    ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit $EXIT_CODE
fi
