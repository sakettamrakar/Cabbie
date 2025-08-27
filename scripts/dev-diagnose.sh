#!/bin/bash
#
# dev-diagnose.sh - Next.js + Docker Development Stack Diagnostic
# 
# Usage: bash scripts/dev-diagnose.sh
#        npm run dev:doctor
#
# Runs non-destructive checks to identify common development issues.
# Exit codes: 0 = all checks pass, 1 = hard failure found
#
# For detailed troubleshooting, see TROUBLESHOOTING.md sections A-M
#

# Remove set -e to handle errors gracefully

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# OS detection
OS="unknown"
case "$OSTYPE" in
  darwin*)  OS="darwin" ;;
  linux*)   OS="linux" ;;
  msys*|cygwin*) OS="windows" ;;
esac

# WSL detection
if grep -qi microsoft /proc/version 2>/dev/null; then
    OS="wsl"
fi

# Windows/Git Bash detection
if [[ "$OS" == "unknown" ]] && [[ -n "$WINDIR" || -n "$PROGRAMFILES" ]]; then
    OS="windows"
fi

echo -e "${BLUE}=== Next.js Development Stack Diagnostic ===${NC}"
echo "OS detected: $OS"
echo "Timestamp: $(date)"
echo ""

# Check counters
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_FAILED=0
HARD_FAILURES=()
SUGGESTIONS=()

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

hard_fail() {
    HARD_FAILURES+=("$1")
    check_fail "$1"
}

add_suggestion() {
    SUGGESTIONS+=("$1")
}

# =============================================================================
# 1. DOCKER CHECKS
# =============================================================================
echo -e "${BLUE}[1/6] Docker Environment${NC}"
((CHECKS_TOTAL++))

if ! command -v docker >/dev/null 2>&1; then
    check_warn "Docker not installed - checking local Node.js setup instead"
    DOCKER_MODE=false
    
    # Try multiple ways to find Node.js (Windows compatibility)
    if command -v node >/dev/null 2>&1; then
        check_pass "Node.js available: $(node --version)"
    elif command -v node.exe >/dev/null 2>&1; then
        check_pass "Node.js available: $(node.exe --version)"
    elif [ "$OS" = "windows" ] && which node 2>/dev/null; then
        check_pass "Node.js available: $(node --version 2>/dev/null || echo 'version check failed')"
    else
        hard_fail "Neither Docker nor Node.js found in PATH"
        add_suggestion "Install Node.js or see TROUBLESHOOTING.md section I) No Docker or Docker blocked"
        exit 1
    fi
else
    DOCKER_MODE=true
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        hard_fail "Docker daemon not running"
        add_suggestion "Start Docker Desktop or run: sudo systemctl start docker"
        exit 1
    fi
    
    check_pass "Docker daemon running: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    
    # Check docker-compose
    if command -v docker-compose >/dev/null 2>&1; then
        check_pass "Docker Compose available: $(docker-compose --version | cut -d' ' -f4 | tr -d ',')"
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        check_pass "Docker Compose (plugin) available: $(docker compose version --short)"
        COMPOSE_CMD="docker compose"
    else
        check_warn "Docker Compose not found - using docker run commands"
        COMPOSE_CMD=""
    fi
    
    # Check container status
    if [ -n "$COMPOSE_CMD" ] && [ -f "docker-compose.yml" ]; then
        echo "Container status:"
        $COMPOSE_CMD ps 2>/dev/null | grep -E "(app|db|redis)" || echo "  No compose services running"
        
        # Check app container health
        APP_CONTAINER=$($COMPOSE_CMD ps -q app 2>/dev/null || echo "")
        if [ -n "$APP_CONTAINER" ]; then
            if docker ps --filter "id=$APP_CONTAINER" --format "{{.Status}}" | grep -q "Up"; then
                check_pass "App container running"
            else
                check_fail "App container not healthy"
                echo "Last 60 lines of app logs:"
                docker logs --tail=60 "$APP_CONTAINER" 2>&1 | tail -20
                add_suggestion "See TROUBLESHOOTING.md section C) App container keeps restarting"
            fi
        fi
    fi
fi

# =============================================================================
# 2. PORT BINDING CHECKS
# =============================================================================
echo -e "\n${BLUE}[2/6] Port Binding${NC}"
((CHECKS_TOTAL++))

# Check if port 3000 is listening
DETECTED_PORT=""
if command -v lsof >/dev/null 2>&1; then
    if lsof -ti:3000 >/dev/null 2>&1; then
        check_pass "Port 3000 is listening"
        DETECTED_PORT="3000"
    elif lsof -ti:3001 >/dev/null 2>&1; then
        check_warn "Port 3000 not available, found server on port 3001"
        DETECTED_PORT="3001"
    else
        check_fail "Neither port 3000 nor 3001 are listening"
        add_suggestion "Start the development server or check docker-compose up"
    fi
    
    # If Docker mode, verify proper binding
    if [ "$DOCKER_MODE" = true ] && [ -n "$APP_CONTAINER" ] && [ "$DETECTED_PORT" = "3000" ]; then
        if docker port "$APP_CONTAINER" 2>/dev/null | grep -q "3000.*0.0.0.0:3000"; then
            check_pass "Docker port mapping: 0.0.0.0:3000->3000"
        else
            check_fail "Docker port not properly mapped to 0.0.0.0:3000"
            add_suggestion "See TROUBLESHOOTING.md section A) Port binding"
        fi
    fi
elif command -v netstat >/dev/null 2>&1; then
    if netstat -ln 2>/dev/null | grep -q ":3000 "; then
        check_pass "Port 3000 is listening (netstat)"
        DETECTED_PORT="3000"
    elif netstat -ln 2>/dev/null | grep -q ":3001 "; then
        check_warn "Port 3000 not available, found server on port 3001 (netstat)"
        DETECTED_PORT="3001"
    else
        check_fail "Neither port 3000 nor 3001 are listening (netstat)"
    fi
else
    # Try PowerShell as final fallback for Windows
    check_warn "Port detection tools not available - trying PowerShell connection test"
    
    if powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3000/' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { \$false }" 2>/dev/null | grep -q "True"; then
        check_pass "Port 3000 responding (PowerShell test)"
        DETECTED_PORT="3000"
    elif powershell -Command "try { (Invoke-WebRequest -Uri 'http://localhost:3001/' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { \$false }" 2>/dev/null | grep -q "True"; then
        check_warn "Port 3001 responding instead of 3000 (PowerShell test)"
        DETECTED_PORT="3001"
    else
        check_fail "Neither port 3000 nor 3001 responding"
        add_suggestion "Start the development server: npm run dev"
        DETECTED_PORT="3000"  # Default assumption
    fi
fi

# Determine base URL for endpoint tests
if [ "$DETECTED_PORT" = "3001" ]; then
    BASE_URL="http://localhost:3001"
    echo "Using detected server on port 3001 for endpoint tests"
else
    BASE_URL="http://localhost:3000"
fi

# =============================================================================
# 3. ENVIRONMENT VARIABLES
# =============================================================================
echo -e "\n${BLUE}[3/6] Environment Variables${NC}"
((CHECKS_TOTAL++))

if [ -f ".env" ]; then
    check_pass ".env file present"
    
    # Check key variables exist in .env
    if grep -q "SITE_DOMAIN" .env 2>/dev/null; then
        SITE_DOMAIN=$(grep "SITE_DOMAIN" .env | cut -d'=' -f2 | tr -d '"' | head -1)
        check_pass "SITE_DOMAIN configured: $SITE_DOMAIN"
    else
        check_warn "SITE_DOMAIN not found in .env"
    fi
    
    if grep -q "DATABASE_URL" .env 2>/dev/null; then
        # Show database type without exposing credentials
        DB_TYPE=$(grep "DATABASE_URL" .env | cut -d'=' -f2 | cut -d':' -f1 | tr -d '"')
        check_pass "DATABASE_URL configured ($DB_TYPE)"
    else
        check_fail "DATABASE_URL not found in .env"
        add_suggestion "Add DATABASE_URL to .env file"
    fi
    
    # If Docker mode, verify variables are loaded in container
    if [ "$DOCKER_MODE" = true ] && [ -n "$APP_CONTAINER" ]; then
        if docker exec "$APP_CONTAINER" printenv SITE_DOMAIN >/dev/null 2>&1; then
            check_pass "Environment variables loaded in container"
        else
            check_fail "Environment variables not loaded in container"
            add_suggestion "See TROUBLESHOOTING.md section B) Environment variables"
        fi
    fi
else
    check_fail ".env file missing"
    add_suggestion "Copy .env.example to .env and configure values"
fi

# =============================================================================
# 4. DATABASE & PRISMA CHECKS
# =============================================================================
echo -e "\n${BLUE}[4/6] Database & Prisma${NC}"
((CHECKS_TOTAL++))

# Check Prisma installation
if [ "$DOCKER_MODE" = true ] && [ -n "$APP_CONTAINER" ]; then
    PRISMA_CMD="docker exec $APP_CONTAINER npx prisma"
else
    PRISMA_CMD="npx prisma"
fi

if $PRISMA_CMD --version >/dev/null 2>&1; then
    PRISMA_VERSION=$($PRISMA_CMD --version | grep "prisma" | head -1 | cut -d':' -f2 | xargs)
    check_pass "Prisma available: $PRISMA_VERSION"
    
    # Check database file for SQLite
    if grep -q "sqlite" .env 2>/dev/null; then
        DB_FILE=$(grep "DATABASE_URL" .env 2>/dev/null | grep -o "file:.*\.db" | sed 's/file://' | tr -d '"' || echo "")
        if [ -n "$DB_FILE" ] && [ -f "$DB_FILE" ]; then
            check_pass "SQLite database file exists: $DB_FILE"
        else
            check_warn "SQLite database file not found, may need migration"
        fi
    elif grep -q "postgresql" .env 2>/dev/null; then
        check_pass "PostgreSQL connection configured"
    fi
    
    # Check migration status (non-destructive)
    if $PRISMA_CMD migrate status >/dev/null 2>&1; then
        check_pass "Database migrations up to date"
    else
        check_warn "Database migrations may need to be applied"
        add_suggestion "Run: npx prisma migrate dev or npx prisma db push"
    fi
    
else
    check_fail "Prisma not available"
    add_suggestion "See TROUBLESHOOTING.md section G) Database / Prisma issues"
fi

# =============================================================================
# 5. APPLICATION ENDPOINTS
# =============================================================================
echo -e "\n${BLUE}[5/6] Application Endpoints${NC}"
((CHECKS_TOTAL+=4)) # 4 endpoint checks

# BASE_URL was set in the port binding section above

# Helper function for endpoint checks
test_endpoint() {
    local url="$1"
    local expect_type="$2"
    local description="$3"
    
    # Try PowerShell Invoke-WebRequest on Windows
    if powershell -Command "try { \$response = Invoke-WebRequest -Uri '$url' -UseBasicParsing -TimeoutSec 5; \$response.StatusCode -eq 200 } catch { \$false }" 2>/dev/null | grep -q "True"; then
        if [ "$expect_type" = "html" ]; then
            # Basic HTML check via PowerShell
            if powershell -Command "try { \$response = Invoke-WebRequest -Uri '$url' -UseBasicParsing -TimeoutSec 5; \$response.Content -match '<html|<!doctype' } catch { \$false }" 2>/dev/null | grep -q "True"; then
                check_pass "$description"
            else
                check_fail "$description (no HTML content)"
            fi
        elif [ "$expect_type" = "json" ]; then
            # Basic JSON check via PowerShell
            if powershell -Command "try { \$response = Invoke-WebRequest -Uri '$url' -UseBasicParsing -TimeoutSec 5; \$response.Content | ConvertFrom-Json; \$true } catch { \$false }" 2>/dev/null | grep -q "True"; then
                check_pass "$description"
            else
                check_fail "$description (invalid JSON)"
            fi
        else
            check_pass "$description"
        fi
    else
        check_fail "$description (connection failed)"
        add_suggestion "Check if server is running on correct port"
    fi
}

# Test endpoints
test_endpoint "$BASE_URL/" "html" "Homepage (/) responds with HTML"
test_endpoint "$BASE_URL/api/health" "json" "Health API (/api/health) responds"
test_endpoint "$BASE_URL/raipur/bilaspur/fare" "html" "Fare page responds with HTML"
test_endpoint "$BASE_URL/api/v1/routes/1" "json" "Routes API responds with JSON"

# =============================================================================
# 6. FILE STRUCTURE VALIDATION
# =============================================================================
echo -e "\n${BLUE}[6/6] File Structure${NC}"
((CHECKS_TOTAL+=3))

# Check critical files
if [ -f "package.json" ]; then
    check_pass "package.json exists"
    
    if grep -q '"dev":' package.json; then
        check_pass "dev script configured in package.json"
    else
        check_fail "dev script missing from package.json"
    fi
else
    hard_fail "package.json missing"
    exit 1
fi

if [ -d "pages" ] || [ -d "src/pages" ]; then
    check_pass "pages directory exists"
else
    check_fail "pages directory not found"
    add_suggestion "See TROUBLESHOOTING.md section F) 404 on pages that should exist"
fi

# =============================================================================
# SUMMARY & RECOMMENDATIONS
# =============================================================================
echo ""
echo -e "${BLUE}=== DIAGNOSTIC SUMMARY ===${NC}"
echo "Total checks: $CHECKS_TOTAL"
echo -e "Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Failed: ${RED}$CHECKS_FAILED${NC}"

if [ ${#HARD_FAILURES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}HARD FAILURES FOUND:${NC}"
    for failure in "${HARD_FAILURES[@]}"; do
        echo -e "  ${RED}•${NC} $failure"
    done
    exit 1
fi

if [ $CHECKS_FAILED -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}ISSUES DETECTED:${NC}"
    echo "Your development environment has some issues that may affect functionality."
    
    if [ ${#SUGGESTIONS[@]} -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}SUGGESTED NEXT STEPS:${NC}"
        for suggestion in "${SUGGESTIONS[@]}"; do
            echo -e "  ${YELLOW}•${NC} $suggestion"
        done
    fi
    
    echo ""
    echo "For detailed troubleshooting, see TROUBLESHOOTING.md"
else
    echo ""
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo "Your development environment appears to be working correctly."
    echo ""
    echo "Quick health check:"
    echo "  curl $BASE_URL/api/health"
fi

echo ""
echo "For more help: see TROUBLESHOOTING.md or run with --verbose for detailed output"

exit $CHECKS_FAILED
