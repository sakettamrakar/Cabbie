# TROUBLESHOOTING.md

**Next.js + Docker Development Stack Issues**

## Quick Triage: What Do You See?

| **Symptoms** | **Jump to Section** |
|--------------|---------------------|
| `curl localhost:3000` fails / connection refused | [A) Port binding](#a-port-binding--container-up-but-not-exposed) |
| Environment variables undefined / missing | [B) Environment variables](#b-environment-variables--env-not-loading) |
| Container exits immediately or loops | [C) App container keeps restarting](#c-app-container-keeps-restarting) |
| White page, hydration mismatch, React errors | [D) Blank white page or hydration errors](#d-blank-white-page-or-hydration-errors) |
| 500 error, Next.js error overlay, SSR crash | [E) 500 or Next.js error overlay](#e-500-or-nextjs-error-overlay-ssr-crash) |
| 404 on pages that should exist | [F) 404 on pages that should exist](#f-404-on-pages-that-should-exist) |
| Database connection errors, Prisma failures | [G) Database / Prisma issues](#g-database--prisma-issues) |
| API endpoints return wrong data or errors | [H) API endpoint debugging](#h-api-endpoint-debugging) |
| Docker not installed or permission denied | [I) No Docker or Docker blocked](#i-no-docker-or-docker-blocked) |
| File changes not reflected, volume mount issues | [J) File mounting & path issues](#j-file-mounting--path-issues-windowswsl-mac) |
| Need a clean slate to verify setup | [K) Minimal "known good" baseline](#k-minimal-known-good-baseline) |
| General debugging checklist | [L) Top 10 pitfalls checklist](#l-top-10-pitfalls-checklist) |
| What logs/info to collect for help | [M) What info to capture](#m-what-info-to-capture) |

---

## A) Port binding / container up but not exposed

**Goal:** Ensure container is running and port 3000 is accessible from host.

**Commands:**
```bash
# Check if container is running
docker ps

# Check port mapping
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

# Test container networking
docker exec -it <container_name> curl localhost:3000

# Test from host
curl -I localhost:3000
```

**Expected output:**
- `docker ps` shows container with `0.0.0.0:3000->3000/tcp`
- `curl localhost:3000` returns HTTP headers or HTML content

**Common fixes:**
1. **Missing port expose:** Add `-p 3000:3000` to `docker run` or `ports:` in docker-compose
2. **Wrong port mapping:** Verify container listens on `0.0.0.0:3000` not `127.0.0.1:3000`
3. **Firewall blocking:** Try `curl -I localhost:3001` with different port
4. **Container not started:** Run `docker-compose up -d` or restart container

---

## B) Environment variables / `.env` not loading

**Goal:** Verify environment variables are loaded correctly in container.

**Commands:**
```bash
# Check .env files exist
ls -la .env*

# Inspect container environment
docker exec -it <container_name> env | grep -E "(DATABASE_URL|NEXT_|NODE_)"

# Check docker-compose env loading
docker-compose config | grep -A 20 environment

# Test specific variable inside container
docker exec -it <container_name> node -e "console.log(process.env.DATABASE_URL)"
```

**Expected output:**
- `.env` files present in project root
- Environment variables visible in container
- No `undefined` for critical variables

**Common fixes:**
1. **Missing .env:** Copy `.env.example` to `.env` and fill values
2. **Docker not loading .env:** Add `env_file: .env` to docker-compose service
3. **Wrong variable names:** Check `NEXT_PUBLIC_` prefix for client-side variables
4. **Rebuild needed:** Run `docker-compose up --build` after env changes

---

## C) App container keeps restarting

**Goal:** Identify and fix container exit/restart loops.

**Commands:**
```bash
# Check container status and restart count
docker ps -a

# View container logs (last 50 lines)
docker logs --tail=50 <container_name>

# Follow logs in real-time
docker logs -f <container_name>

# Check container resource usage
docker stats <container_name>

# Inspect container configuration
docker inspect <container_name> | jq '.RestartPolicy'
```

**Expected output:**
- Container status shows `Up` not `Restarting`
- Logs show successful Next.js startup: `✓ Ready in XXXms`
- No memory/CPU resource exhaustion

**Common fixes:**
1. **Package install failure:** Check `npm install` errors in logs, run `docker-compose up --build`
2. **Port already in use:** Change port mapping or kill process using port 3000
3. **Out of memory:** Increase Docker memory limit or add swap
4. **Missing dependencies:** Verify `package.json` and `Dockerfile` are correct
5. **Permission errors:** Check file ownership, run with `--user $(id -u):$(id -g)` if needed

---

## D) Blank white page or hydration errors

**Goal:** Fix client-side rendering and hydration mismatches.

**Commands:**
```bash
# Check browser developer console for errors
# Open DevTools → Console tab

# Check Next.js build for hydration warnings
docker exec -it <container_name> npm run build

# Verify pages directory structure
docker exec -it <container_name> find pages -name "*.js" -o -name "*.tsx"

# Check for SSR/client differences
docker exec -it <container_name> curl -s localhost:3000 | head -20

# Enable React strict mode debugging
# Add to next.config.js: { reactStrictMode: true }
```

**Expected output:**
- Browser console shows no React hydration errors
- Build completes without warnings about SSR/client mismatches
- Page HTML contains expected content in initial response

**Common fixes:**
1. **Hydration mismatch:** Ensure server and client render identical HTML
2. **Missing key props:** Add unique `key` to mapped components
3. **Conditional rendering:** Use `useEffect` for client-only code
4. **Document undefined:** Check for `window` or `document` usage in SSR code
5. **CSS-in-JS hydration:** Ensure styled-components or emotion SSR setup

---

## E) 500 or Next.js error overlay (SSR crash)

**Goal:** Debug server-side rendering and API route crashes.

**Commands:**
```bash
# Check detailed error in container logs
docker logs <container_name> | grep -A 10 -B 5 "Error"

# Enable Next.js debug mode
docker exec -it <container_name> DEBUG=* npm run dev

# Test specific page that crashes
curl -v localhost:3000/problematic-page

# Check memory usage during crash
docker stats <container_name>

# Validate syntax and imports
docker exec -it <container_name> npm run build
```

**Expected output:**
- Detailed stack trace pinpointing error location
- Successful page render without 500 errors
- Build passes without syntax errors

**Common fixes:**
1. **Import/export errors:** Check file paths and default exports
2. **Async/await issues:** Ensure `getServerSideProps` returns proper object
3. **Database connection:** Verify DATABASE_URL and connection pooling
4. **Missing dependencies:** Run `npm install` for new packages
5. **Memory leak:** Check for unclosed database connections or infinite loops

---

## F) 404 on pages that should exist

**Goal:** Ensure Next.js routing recognizes your page files.

**Commands:**
```bash
# List all page files
docker exec -it <container_name> find pages -type f \( -name "*.js" -o -name "*.tsx" -o -name "*.ts" \)

# Check Next.js build output for routes
docker exec -it <container_name> npm run build | grep -A 20 "Route"

# Test file system case sensitivity
docker exec -it <container_name> ls -la pages/

# Verify file extensions are correct
docker exec -it <container_name> file pages/*.js pages/*.tsx 2>/dev/null
```

**Expected output:**
- Page files exist in correct `pages/` directory
- Build output lists expected routes
- File extensions match (.js, .jsx, .ts, .tsx)

**Common fixes:**
1. **Wrong file location:** Move files to `pages/` directory (not `components/`)
2. **Missing default export:** Add `export default function PageName() {}`
3. **Case sensitivity:** Ensure filename matches URL case exactly
4. **Invalid characters:** Remove spaces, special chars from filenames
5. **Dynamic routes:** Use `[param].js` syntax for dynamic segments

---

## G) Database / Prisma issues

**Goal:** Establish working database connection and schema sync.

**Commands:**
```bash
# Check database connection
docker exec -it <container_name> npx prisma db pull

# Verify Prisma schema
docker exec -it <container_name> npx prisma validate

# Check generated Prisma client
docker exec -it <container_name> npx prisma generate

# Test database connection directly
docker exec -it <container_name> node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected')).catch(console.error)"

# Check database container status (if using docker-compose)
docker-compose ps db
```

**Expected output:**
- Prisma schema validation passes
- Database connection succeeds
- Prisma client generates without errors

**Common fixes:**
1. **Wrong DATABASE_URL:** Check connection string format and credentials
2. **Database not started:** Start database container first
3. **Schema drift:** Run `npx prisma db push` or `npx prisma migrate dev`
4. **Missing Prisma client:** Run `npx prisma generate` after schema changes
5. **Connection pooling:** Add `?connection_limit=5` to DATABASE_URL

---

## H) API endpoint debugging

**Goal:** Ensure API routes return expected data and status codes.

**Commands:**
```bash
# Test API endpoint directly
curl -X GET localhost:3000/api/health -H "Content-Type: application/json"

# Test with request body
curl -X POST localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"test"}'

# Check API route file exists
docker exec -it <container_name> ls -la pages/api/

# View API route logs
docker logs -f <container_name> | grep "API"

# Test database query in API context
docker exec -it <container_name> node -e "const handler = require('./pages/api/users.js'); console.log(handler)"
```

**Expected output:**
- HTTP status codes 200-299 for successful requests
- Valid JSON responses with expected data structure
- API route files exist in `pages/api/`

**Common fixes:**
1. **Missing exports:** Ensure `export default function handler(req, res) {}`
2. **HTTP method not handled:** Check `req.method` conditions
3. **CORS issues:** Add proper headers for cross-origin requests
4. **Database query errors:** Wrap in try-catch and log errors
5. **Request validation:** Validate request body and parameters

---

## I) No Docker or Docker blocked

**Goal:** Install Docker or find alternative development approach.

**Commands:**
```bash
# Check if Docker is installed
docker --version

# Check Docker daemon status
docker info

# Test Docker without sudo (Linux)
docker run hello-world

# Alternative: Check if Node.js is installed locally
node --version && npm --version

# Set up local development without Docker
npm install
npm run dev
```

**Expected output:**
- Docker version information displays
- Docker daemon is running
- Can run containers without permission errors

**Common fixes:**
1. **Docker not installed:** Visit https://docs.docker.com/get-docker/
2. **Docker daemon not running:** Start Docker Desktop or run `sudo systemctl start docker`
3. **Permission denied:** Add user to docker group: `sudo usermod -aG docker $USER`
4. **Corporate firewall:** Use local Node.js development instead
5. **WSL2 required:** Enable WSL2 on Windows for Docker Desktop

---

## J) File mounting & path issues (Windows/WSL, Mac)

**Goal:** Ensure code changes reflect in container and paths resolve correctly.

**Commands:**
```bash
# Check current working directory and mounts
docker exec -it <container_name> pwd
docker exec -it <container_name> ls -la

# Verify volume mount is working
echo "test-$(date)" > test-file.txt
docker exec -it <container_name> cat test-file.txt
rm test-file.txt

# Check Docker volume mounts
docker inspect <container_name> | jq '.[].Mounts'

# For Windows: Check line endings
docker exec -it <container_name> file package.json
```

**Expected output:**
- File changes on host appear immediately in container
- Paths use forward slashes, not backslashes
- Line endings are LF not CRLF

**Common fixes:**
1. **Volume not mounted:** Add `volumes: - .:/app` to docker-compose
2. **Windows path issues:** Use WSL2 or convert paths to Unix format
3. **Line ending problems:** Configure git: `git config core.autocrlf false`
4. **Permission issues:** Set correct ownership in Dockerfile
5. **Performance on Mac:** Use cached volumes: `- .:/app:cached`

---

## K) Minimal "known good" baseline

**Goal:** Create a working minimal setup to isolate issues.

**Commands:**
```bash
# Create minimal test setup
mkdir test-nextjs && cd test-nextjs

# Create basic package.json
cat > package.json << 'EOF'
{
  "name": "test-nextjs",
  "scripts": {
    "dev": "next dev",
    "build": "next build"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  }
}
EOF

# Create minimal page
mkdir pages
cat > pages/index.js << 'EOF'
export default function Home() {
  return <h1>Hello Next.js</h1>
}
EOF

# Create minimal Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
EOF

# Test minimal setup
docker build -t test-nextjs .
docker run -p 3000:3000 test-nextjs
```

**Expected output:**
- Container builds successfully
- App starts without errors
- `curl localhost:3000` returns Hello Next.js page

**Common fixes:**
1. **If minimal works:** Issue is in your complex setup - compare configurations
2. **If minimal fails:** Docker/system issue - check Docker installation
3. **Build context too large:** Add `.dockerignore` with `node_modules`

---

## L) Top 10 pitfalls checklist

**Goal:** Quick verification of most common configuration issues.

```bash
# ✅ 1. Check Docker is running and has sufficient resources
docker info | grep -E "(CPUs|Total Memory)"

# ✅ 2. Verify .env file exists and is not .env.example
test -f .env && echo "✅ .env exists" || echo "❌ .env missing"

# ✅ 3. Confirm port 3000 is not in use by another process
lsof -ti:3000 | wc -l | grep -q "^0$" && echo "✅ Port 3000 free" || echo "❌ Port 3000 in use"

# ✅ 4. Check node_modules is in .dockerignore
grep -q "node_modules" .dockerignore && echo "✅ node_modules ignored" || echo "❌ Add node_modules to .dockerignore"

# ✅ 5. Verify package.json has required scripts
grep -q '"dev":' package.json && echo "✅ dev script found" || echo "❌ Missing dev script"

# ✅ 6. Check pages directory exists with at least one page
test -d pages && test -f pages/index.* && echo "✅ pages/index found" || echo "❌ Missing pages/index"

# ✅ 7. Confirm dependencies are installed
test -f package-lock.json || test -f yarn.lock && echo "✅ Lock file exists" || echo "❌ Run npm install first"

# ✅ 8. Verify no syntax errors in key files
node -c next.config.js 2>/dev/null && echo "✅ next.config.js valid" || echo "❌ Check next.config.js syntax"

# ✅ 9. Check file permissions (Linux/Mac)
test -r pages/index.js && echo "✅ Files readable" || echo "❌ Fix file permissions"

# ✅ 10. Confirm Docker compose version compatibility
docker-compose --version | grep -E "v?[2-9]\." && echo "✅ Docker Compose v2+" || echo "❌ Update Docker Compose"
```

---

## M) What info to capture

**Goal:** Collect comprehensive diagnostic information for troubleshooting support.

**Commands:**
```bash
# System information
echo "=== SYSTEM INFO ==="
uname -a
docker --version
docker-compose --version
node --version 2>/dev/null || echo "Node not installed locally"

# Docker environment
echo -e "\n=== DOCKER STATUS ==="
docker ps -a
docker images | head -10
docker system df

# Container logs (last 100 lines)
echo -e "\n=== CONTAINER LOGS ==="
docker logs --tail=100 <container_name>

# Environment variables (sanitized)
echo -e "\n=== ENVIRONMENT ==="
docker exec -it <container_name> env | grep -v -E "(PASSWORD|SECRET|KEY)" | sort

# File structure
echo -e "\n=== PROJECT STRUCTURE ==="
find . -type f -name "*.json" -o -name "Dockerfile*" -o -name "docker-compose*" -o -name ".env*" | head -20

# Network connectivity
echo -e "\n=== NETWORK TEST ==="
curl -I localhost:3000 2>&1 || echo "Connection failed"

# Package versions
echo -e "\n=== KEY DEPENDENCIES ==="
docker exec -it <container_name> npm list next react react-dom 2>/dev/null | head -10

# Recent errors
echo -e "\n=== RECENT ERRORS ==="
docker logs <container_name> 2>&1 | grep -i error | tail -5
```

**Expected output:**
- Complete diagnostic dump for troubleshooting
- Sanitized environment (no secrets exposed)
- Recent error context

---

## ✅ Success Criteria

Your development environment is working correctly when:

1. **✅ Container health:** `docker ps` shows container as `Up` with correct port mapping
2. **✅ HTTP response:** `curl localhost:3000` returns HTML content (not connection refused)
3. **✅ Environment loaded:** Critical variables like `DATABASE_URL` are accessible in container
4. **✅ File sync:** Code changes on host immediately reflect in running container
5. **✅ Build passes:** `npm run build` completes without errors
6. **✅ Database connected:** Prisma queries execute successfully
7. **✅ API endpoints:** `/api/health` returns 200 status
8. **✅ Hot reload:** Saving files triggers automatic page refresh
9. **✅ No console errors:** Browser DevTools shows no React or hydration errors
10. **✅ Clean logs:** Container logs show normal Next.js startup sequence

**Quick health check command:**
```bash
curl -s localhost:3000/api/health && echo "✅ API OK" || echo "❌ API failed"
```

---

*For additional help, join our Discord or create an issue with the output from section M.*
