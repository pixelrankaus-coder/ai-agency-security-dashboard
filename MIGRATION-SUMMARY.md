# Backend Migration Summary

**Date**: February 15, 2026
**Status**: ✅ Complete

## What Changed

The SecScan Security Scanner Dashboard has been migrated from a two-process architecture (Next.js frontend + Python FastAPI backend) to a **single full-stack Next.js application**.

### Before
- Next.js frontend on port 3002
- Python FastAPI backend on port 8000
- Two terminal windows required
- External dependencies: Python, FastAPI, uvicorn
- API calls to `http://localhost:8000/api`

### After
- **One Next.js process** on port 3002
- **Built-in API routes** at `/api/*`
- **One command**: `npm run dev`
- **Zero Python** - everything in TypeScript/Node.js
- JSON file-based storage in `data/` directory

## Architecture Changes

### Storage
- **Before**: Database or in-memory storage in Python
- **After**: JSON files (`data/scans.json`, `data/clients.json`)
- Automatically created on first run
- Gitignored to prevent accidental commits

### Scanners
Three **built-in scanners** (no external tools required):
1. **SSL Scanner** - Uses Node.js `tls` module
2. **Headers Scanner** - Uses built-in `fetch` API
3. **Crawler Scanner** - Uses `fetch` + regex analysis

Three **CLI scanners** (optional, graceful degradation):
4. **Nmap** - Port scanning (checks if installed)
5. **Nuclei** - CVE detection (checks if installed)
6. **WPScan** - WordPress security (checks if installed)

### AI Analysis
- Uses Anthropic Claude API (claude-sonnet-4-20250514)
- Optional: works without API key (generates structured summary instead)
- Configure via `ANTHROPIC_API_KEY` in `.env.local`

## New File Structure

```
app/api/
├── health/route.ts          # GET /api/health
├── scans/
│   ├── route.ts            # GET/POST /api/scans
│   └── [id]/route.ts       # GET/DELETE /api/scans/[id]
└── clients/
    ├── route.ts            # GET/POST /api/clients
    ├── [id]/route.ts       # DELETE /api/clients/[id]
    └── [id]/scans/route.ts # GET /api/clients/[id]/scans

lib/
├── storage.ts              # JSON file storage functions
├── scanners/
│   ├── types.ts            # Scanner interfaces
│   ├── index.ts            # runScanners function
│   ├── ssl-scanner.ts      # Built-in (tls module)
│   ├── headers-scanner.ts  # Built-in (fetch)
│   ├── crawler-scanner.ts  # Built-in (fetch)
│   ├── nmap-scanner.ts     # CLI tool (optional)
│   ├── nuclei-scanner.ts   # CLI tool (optional)
│   └── wpscan-scanner.ts   # CLI tool (optional)
└── ai/
    └── analyse.ts          # Claude API integration

data/                       # Created on first run
├── scans.json
└── clients.json
```

## Environment Variables

**Removed**:
- `NEXT_PUBLIC_API_URL` (no longer needed)

**Added**:
```env
# Optional - enables AI-powered scan analysis
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key at: https://console.anthropic.com

## Frontend Changes

### Demo Mode
- **Before**: Showed banner when backend was offline
- **After**: Removed all demo mode banners (API is always available)
- Demo context kept for backward compatibility but always returns `isDemo: false`

### Settings Page
- **Before**: API URL input field, connection retry button
- **After**: Scanner status dashboard, AI analysis status
- Shows which CLI tools are installed and available
- Shows if AI analysis is configured

### API Calls
- **Before**: `fetch("http://localhost:8000/api/scans")`
- **After**: `fetch("/api/scans")` (relative URLs)

## How to Use

### Quick Start
```bash
npm install
npm run dev
```

Open http://localhost:3002 and start scanning!

### With AI Analysis
```bash
echo 'ANTHROPIC_API_KEY=sk-ant-your-key' > .env.local
npm run dev
```

### With CLI Scanners
Install optional tools:
```bash
# macOS
brew install nmap nuclei wpscan

# Linux
sudo apt install nmap
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
gem install wpscan

# Windows
# Download from official websites:
# - nmap.org
# - github.com/projectdiscovery/nuclei
# - wpscan.com
```

Restart the app - scanners will be automatically detected.

## Testing

### 1. Basic Functionality
```bash
npm run dev
```
Navigate to http://localhost:3002/dashboard

Expected:
- ✅ Dashboard loads
- ✅ No console errors
- ✅ `/api/health` returns scanner status
- ✅ No demo mode banners

### 2. Create Client
Go to Clients → Add Client

Expected:
- ✅ Client saved to `data/clients.json`
- ✅ Persists across page refresh

### 3. Run Scan
Go to Scans → New Scan → Enter URL → Start Scan

Expected:
- ✅ Scan created with "scanning" status
- ✅ SSL, Headers, Crawler scanners run
- ✅ Progress updates in real-time
- ✅ Status changes to "complete"
- ✅ Results appear in scan detail page

### 4. AI Analysis
Add `ANTHROPIC_API_KEY` to `.env.local` and restart

Run a scan → Check scan detail page

Expected:
- ✅ AI-generated markdown analysis appears
- ✅ Executive summary, findings, recommendations

### 5. CLI Scanners
Install nmap/nuclei/wpscan → Restart app → Go to Settings

Expected:
- ✅ Scanner status shows "Ready" for installed tools
- ✅ New scans can select CLI scanners
- ✅ Results appear in scan detail

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3002
npx kill-port 3002
npm run dev
```

### Scans not saving
Check permissions on `data/` directory:
```bash
ls -la data/
# Should be readable/writable
```

### CLI scanners not detected
Check PATH:
```bash
which nmap
which nuclei
which wpscan
```

Add to PATH if needed.

### AI analysis not working
Check API key:
```bash
cat .env.local
# Should contain: ANTHROPIC_API_KEY=sk-ant-...
```

Restart app after adding key.

## What's Next

The application is now a **standalone full-stack Next.js app** with:
- ✅ Built-in API and storage
- ✅ Three working scanners (no external deps)
- ✅ Optional CLI scanner integration
- ✅ Optional AI analysis
- ✅ Mobile responsive
- ✅ Production ready

**No Python. No second server. Just `npm run dev`.**

---

**Migration completed successfully!** 🚀
