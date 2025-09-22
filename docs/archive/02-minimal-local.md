# Minimal Local Development (No Docker, No Admin)

Purpose: Run and view the project (or a static placeholder) on a restricted machine without Docker or admin rights.

## Option A: Run Next.js Directly (Preferred)
Requirements: User‑space Node.js 20.x (no admin) + npm.

### 1. Get Node Without Admin
Pick one method:
1. Portable ZIP: Download Node 20.x Windows x64 ZIP from https://nodejs.org, extract to `C:\Users\<you>\node-portable`. Add its `node.exe` folder to PATH for this session:
```
set PATH=C:\Users\<you>\node-portable;%PATH%
```
2. `nvs` (Node Version Switcher) user install: https://github.com/jasongin/nvs (does not require admin when installed under your user profile).
3. WSL (if available): Use `sudo apt install nodejs npm` (may be older) or install `nvm` inside WSL for latest LTS.

Verify:
```
node -v
npm -v
```

### 2. Install Dependencies
From project root:
```
npm install
```

### 3. Run Dev Server
```
npm run dev
```
Open http://localhost:3000 — you should see the placeholder page.

If port busy, choose another:
```
PORT=4000 npm run dev
```
Then visit http://localhost:4000

### 4. (Optional) Prisma Skip
Until MySQL is available, Prisma models can remain placeholder. You can temporarily avoid migrations; the page does not depend on DB yet.

## Option B: Static HTML (Fastest Visual Check)
If you cannot get Node running yet, open `lite.html` directly in your browser for a static confirmation page (no React/Next features).

File: `lite.html` mirrors basic branding and environment summary (static text).

## Option C: WSL Only
If WSL works but Docker not installed, clone repo inside WSL path (e.g., `~/cab-website`) and follow Option A inside WSL. Performance is better than running Node on the Windows filesystem.

## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| `node` not recognized | PATH not updated | Re-open terminal after setting PATH or export again. |
| NPM install very slow | Corporate proxy | Configure `npm config set proxy http://proxy:port` (same for `https-proxy`). |
| Port already in use | Another process | Run with `PORT=4000 npm run dev` / kill old process. |
| Unicode/permission errors | Restricted folder | Move project under your user directory. |

## Acceptance (Minimal Mode)
- You can view placeholder app via `npm run dev` without Docker.
- Or, at minimum, you can open `lite.html` and see project branding.

## Next Step When Admin/Docker Available
Switch back to the full Docker workflow (`make up`) and remove reliance on the static HTML placeholder.
