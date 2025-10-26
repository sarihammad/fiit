#!/bin/bash

# Security Audit Script for FIIT
# This script checks for common security issues and ensures best practices

set -e

echo "🔒 Starting FIIT Security Audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if .env file exists and contains secrets
check_env_file() {
    echo "Checking .env file..."
    if [ -f ".env" ]; then
        print_warning ".env file exists - ensure it's not committed to git"
        if grep -q "your_" .env; then
            print_warning ".env file contains placeholder values"
        fi
    else
        print_status ".env file not found (good for security)" 0
    fi
}

# Check for secrets in code
check_secrets_in_code() {
    echo "Checking for hardcoded secrets..."
    
    # Check for common secret patterns
    if grep -r -i "password.*=" src/ --exclude-dir=node_modules | grep -v "your_" | grep -v "example"; then
        print_status "Found potential hardcoded passwords" 1
    else
        print_status "No hardcoded passwords found" 0
    fi
    
    if grep -r -i "api.*key.*=" src/ --exclude-dir=node_modules | grep -v "your_" | grep -v "example"; then
        print_status "Found potential hardcoded API keys" 1
    else
        print_status "No hardcoded API keys found" 0
    fi
    
    if grep -r -i "secret.*=" src/ --exclude-dir=node_modules | grep -v "your_" | grep -v "example"; then
        print_status "Found potential hardcoded secrets" 1
    else
        print_status "No hardcoded secrets found" 0
    fi
}

# Check for AsyncStorage usage (should use expo-secure-store)
check_storage_usage() {
    echo "Checking storage usage..."
    
    if grep -r "AsyncStorage" src/ --exclude-dir=node_modules; then
        print_warning "Found AsyncStorage usage - ensure sensitive data uses expo-secure-store"
    else
        print_status "No AsyncStorage usage found" 0
    fi
    
    if grep -r "expo-secure-store" src/ --exclude-dir=node_modules; then
        print_status "expo-secure-store is being used" 0
    else
        print_status "expo-secure-store not found - sensitive data should use secure storage" 1
    fi
}

# Check for proper error handling
check_error_handling() {
    echo "Checking error handling..."
    
    if grep -r "console.log" src/ --exclude-dir=node_modules | grep -i "password\|token\|secret"; then
        print_status "Found potential sensitive data in console logs" 1
    else
        print_status "No sensitive data in console logs" 0
    fi
}

# Check for HTTPS usage
check_https_usage() {
    echo "Checking HTTPS usage..."
    
    if grep -r "http://" src/ --exclude-dir=node_modules | grep -v "localhost"; then
        print_status "Found HTTP URLs (should use HTTPS in production)" 1
    else
        print_status "No HTTP URLs found" 0
    fi
}

# Check for proper input validation
check_input_validation() {
    echo "Checking input validation..."
    
    if grep -r "zod" src/ --exclude-dir=node_modules; then
        print_status "Zod validation is being used" 0
    else
        print_status "Zod validation not found - should validate all inputs" 1
    fi
}

# Check for proper authentication
check_authentication() {
    echo "Checking authentication implementation..."
    
    if grep -r "expo-secure-store" src/ --exclude-dir=node_modules; then
        print_status "Secure token storage implemented" 0
    else
        print_status "Secure token storage not implemented" 1
    fi
    
    if grep -r "X-API-Key" src/ --exclude-dir=node_modules; then
        print_status "API key authentication implemented" 0
    else
        print_status "API key authentication not found" 1
    fi
}

# Check for proper CORS configuration
check_cors_config() {
    echo "Checking CORS configuration..."
    
    if grep -r "CORS" backend/ --exclude-dir=node_modules; then
        print_status "CORS configuration found" 0
    else
        print_status "CORS configuration not found" 1
    fi
}

# Check for rate limiting
check_rate_limiting() {
    echo "Checking rate limiting..."
    
    if grep -r "rate.*limit" backend/ --exclude-dir=node_modules; then
        print_status "Rate limiting implemented" 0
    else
        print_status "Rate limiting not implemented" 1
    fi
}

# Check for security headers
check_security_headers() {
    echo "Checking security headers..."
    
    if grep -r "security.*header" backend/ --exclude-dir=node_modules; then
        print_status "Security headers implemented" 0
    else
        print_status "Security headers not implemented" 1
    fi
}

# Check for proper logging
check_logging() {
    echo "Checking logging configuration..."
    
    if grep -r "sentry" src/ --exclude-dir=node_modules; then
        print_status "Sentry error tracking implemented" 0
    else
        print_status "Sentry error tracking not implemented" 1
    fi
}

# Check for proper testing
check_testing() {
    echo "Checking test coverage..."
    
    if [ -d "src/__tests__" ] || [ -d "src/services/__tests__" ]; then
        print_status "Test files found" 0
    else
        print_status "Test files not found" 1
    fi
}

# Check for proper TypeScript configuration
check_typescript() {
    echo "Checking TypeScript configuration..."
    
    if grep -q '"strict": true' tsconfig.json; then
        print_status "TypeScript strict mode enabled" 0
    else
        print_status "TypeScript strict mode not enabled" 1
    fi
    
    if grep -q '"noUncheckedIndexedAccess": true' tsconfig.json; then
        print_status "TypeScript noUncheckedIndexedAccess enabled" 0
    else
        print_status "TypeScript noUncheckedIndexedAccess not enabled" 1
    fi
}

# Check for proper dependency management
check_dependencies() {
    echo "Checking dependency management..."
    
    if [ -f "package-lock.json" ] || [ -f "yarn.lock" ]; then
        print_status "Lock files found" 0
    else
        print_status "Lock files not found" 1
    fi
    
    if grep -q "expo-secure-store" package.json; then
        print_status "expo-secure-store dependency found" 0
    else
        print_status "expo-secure-store dependency not found" 1
    fi
}

# Run all checks
main() {
    echo "Starting security audit..."
    echo "=========================="
    
    check_env_file
    check_secrets_in_code
    check_storage_usage
    check_error_handling
    check_https_usage
    check_input_validation
    check_authentication
    check_cors_config
    check_rate_limiting
    check_security_headers
    check_logging
    check_testing
    check_typescript
    check_dependencies
    
    echo "=========================="
    echo "Security audit complete!"
    echo ""
    echo "Next steps:"
    echo "1. Review any warnings or failures above"
    echo "2. Ensure all secrets are in environment variables"
    echo "3. Use expo-secure-store for sensitive data"
    echo "4. Enable TypeScript strict mode"
    echo "5. Implement proper error handling and logging"
    echo "6. Add rate limiting and security headers"
    echo "7. Write comprehensive tests"
}

# Run the main function
main "$@"
