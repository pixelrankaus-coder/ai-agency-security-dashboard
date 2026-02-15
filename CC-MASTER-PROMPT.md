# SecScan Security Scanner Dashboard - Master Prompt

## Project Overview

**SecScan** is a modern security scanning dashboard built with Next.js 16 that helps web developers and security professionals scan websites for common security vulnerabilities. The application provides real-time scanning with AI-powered analysis using Claude 4.5 Sonnet.

**Key Features:**
- Real-time security scanning with live progress tracking
- AI-powered vulnerability analysis and recommendations
- Client management system
- Multiple security scanners (Observatory, SSL, Crawler, Safe Browsing)
- Historical scan tracking and comparison
- Export capabilities (JSON and HTML reports)

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: shadcn/ui + Radix UI + Tailwind CSS
- **AI**: Anthropic Claude 4.5 Sonnet API
- **Runtime**: Node.js
- **Storage**: JSON files in `data/` directory
- **Port**: 3002 (single unified application)

### Important: Single Application Architecture
**This is NOT a separate frontend/backend.** The Next.js app contains both UI and API routes in a single codebase:
- UI: App Router pages in `app/dashboard/(auth)/`
- API: Next.js API routes in `app/api/`
- No external Python backend, no separate ports
- API routes handle all scanner logic directly

### Storage System
All data is stored in JSON files in the `data/` directory:
- `data/scans.json` - All scan results
- `data/clients.json` - Client information
- Mock data available in `lib/mock-data.ts` for development

**Storage Functions** (`lib/storage.ts`):
```typescript
getScans() -> Scan[]
getScanById(id) -> Scan | undefined
saveScan(scan) -> void
getClients() -> Client[]
saveClient(client) -> void
```

## Scanners

### Current Active Scanners

1. **Observatory Scanner** (`observatory`)
   - Uses Mozilla HTTP Observatory API
   - Tests security headers (CSP, HSTS, X-Frame-Options, etc.)
   - Returns grade (A+ to F) and detailed header analysis
   - External API: `https://http-observatory.security.mozilla.org/api/v1/analyze`
   - Always available (no API key required)

2. **SSL Scanner** (`ssl`)
   - Built-in scanner using Node.js `tls` module
   - Validates SSL certificates
   - Checks expiry dates, issuer, cipher strength
   - Always available

3. **Crawler Scanner** (`crawler`)
   - Built-in web crawler
   - Detects technologies (WordPress, React, etc.)
   - Finds sensitive files (.env, .git, xmlrpc.php, etc.)
   - Tests for common vulnerabilities
   - Always available

4. **Safe Browsing Scanner** (`safe_browsing`)
   - Uses Google Safe Browsing API
   - Checks for malware, phishing, unwanted software
   - Requires `GOOGLE_SAFE_BROWSING_API_KEY` in `.env.local`
   - Only available if API key is configured

### Deleted Scanners (DO NOT REFERENCE)
These scanners were removed during migration:
- ❌ `headers` - replaced by Observatory
- ❌ `nuclei` - removed
- ❌ `nmap` - removed
- ❌ `wpscan` - removed

## Key API Routes

### Scan Management
- `POST /api/scans` - Start new scan
  - Body: `{ url, client_name?, scanners[] }`
  - Returns: `{ id, status: "queued" }`
  - Fire-and-forget: Scan runs in background

- `GET /api/scans` - List all scans
  - Query: `?client=name` (optional filter)
  - Returns: `Scan[]`

- `GET /api/scans/[id]` - Get scan details
  - Returns full scan with results array
  - **Important**: Returns partial results during active scans
  - Each scanner's results are added as they complete

- `DELETE /api/scans/[id]` - Delete scan and files

### Client Management
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `DELETE /api/clients/[id]` - Delete client

### Health Check
- `GET /api/health` - System status
  - Returns scanner availability
  - Returns total scans/clients count

### AI Analysis
- `POST /api/ai/analyze` - Generate AI analysis
  - Body: `{ scan_detail: ScanDetail }`
  - Requires `ANTHROPIC_API_KEY` in `.env.local`
  - Returns markdown analysis

## Core Type Definitions

```typescript
// Main scan object
interface Scan {
  id: string;
  url: string;
  client_name: string | null;
  scanners: string[];
  status: "queued" | "scanning" | "complete" | "failed";
  progress: number;
  current_scanner: string | null;
  summary: {
    total_findings: number;
    severities: { critical: number; high: number; medium: number; low: number; info: number };
    scanners_run: number;
    scanners_total: number;
  } | null;
  report_file: string | null;
  json_file: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

// Detailed scan with results
interface ScanDetail extends Scan {
  results: ScanResult[];
  analysis?: string; // AI-generated markdown
}

// Individual scanner result
interface ScanResult {
  scanner: string;
  success: boolean;
  findings: Finding[];
  error: string;
  duration_seconds: number;
  metadata?: Record<string, unknown>;
}

// Individual finding
interface Finding {
  title: string;
  severity: SeverityLevel; // "critical" | "high" | "medium" | "low" | "info"
  description: string;
  recommendation: string;
  affected_url: string;
  evidence: string;
  type?: string; // Finding type identifier
  [key: string]: any; // Scanner-specific fields
}

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
```

## Project Structure

```
security-dashboard/
├── app/
│   ├── api/                      # Next.js API routes
│   │   ├── scans/
│   │   │   ├── route.ts          # GET /api/scans, POST /api/scans
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET /api/scans/[id], DELETE /api/scans/[id]
│   │   ├── clients/
│   │   ├── health/
│   │   └── ai/
│   │       └── analyze/
│   ├── dashboard/
│   │   └── (auth)/               # Protected dashboard routes
│   │       ├── page.tsx          # Dashboard home
│   │       ├── scans/
│   │       │   ├── page.tsx      # Scans list
│   │       │   └── [id]/
│   │       │       └── page.tsx  # Scan detail
│   │       ├── clients/
│   │       │   └── page.tsx      # Clients management
│   │       └── settings/
│   │           └── page.tsx      # Settings page
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── security/
│   │   ├── scan-progress-modal.tsx    # Real-time scan progress
│   │   ├── new-scan-dialog.tsx        # Start new scan
│   │   ├── add-client-dialog.tsx      # Add client
│   │   ├── severity-badge.tsx         # Finding severity display
│   │   └── index.ts
│   ├── layout/
│   │   ├── sidebar/
│   │   └── header/
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── api.ts                    # API client functions
│   ├── storage.ts                # JSON file storage
│   ├── mock-data.ts              # Development mock data
│   ├── scanner-info.ts           # Scanner metadata
│   ├── demo-context.tsx          # Demo mode context (legacy)
│   └── scanners/
│       ├── types.ts              # Scanner interfaces
│       ├── observatory-scanner.ts
│       ├── ssl-scanner.ts
│       ├── crawler-scanner.ts
│       └── safe-browsing-scanner.ts
├── types/
│   └── index.ts                  # Global TypeScript types
├── data/                         # JSON storage directory
│   ├── scans.json
│   └── clients.json
└── public/
    └── reports/                  # Generated HTML reports
```

## Key Features & Patterns

### 1. Real-Time Scan Progress Modal

**File**: `components/security/scan-progress-modal.tsx`

**How it works**:
- Polls `GET /api/scans/[id]` every 2 seconds during active scan
- Calculates elapsed time from `scan.created_at` timestamp (no drift)
- Deduplicates findings using a Set to track shown IDs
- Minimizable: Collapses to floating widget in bottom-right corner
- Plays completion sound using Web Audio API
- Auto-scrolls findings feed as new findings appear

**Integration pattern**:
```typescript
// In parent component (e.g., scans/page.tsx)
const [progressModalOpen, setProgressModalOpen] = useState(false);
const [activeScanId, setActiveScanId] = useState<string | null>(null);

function handleScanStarted(scanId: string) {
  setActiveScanId(scanId);
  setProgressModalOpen(true);
}

// Pass to NewScanDialog
<NewScanDialog onScanStarted={handleScanStarted} />
<ScanProgressModal scanId={activeScanId} isOpen={progressModalOpen} onClose={...} />
```

### 2. Fire-and-Forget Scan Pattern

When `POST /api/scans` is called:
1. Creates scan record with `status: "queued"`
2. Returns scan ID immediately
3. Runs scanners asynchronously in background
4. Calls `saveScan()` after each scanner completes
5. Updates `status: "complete"` when all scanners finish

This allows the UI to immediately show the progress modal while the scan runs.

### 3. AI Analysis Integration

**Trigger**: User clicks "Generate AI Analysis" button on scan detail page

**Flow**:
1. Call `POST /api/ai/analyze` with full ScanDetail
2. API uses Anthropic SDK to send findings to Claude
3. Returns markdown analysis
4. Save to scan.analysis field
5. Display in scan detail page

**Prompt structure** (in `app/api/ai/analyze/route.ts`):
- Executive summary
- Critical findings with actionable fixes
- Prioritized recommendations
- Client-friendly language (not overly technical)

### 4. Demo Mode Context (Legacy)

**Note**: Demo mode is largely deprecated because the API is built-in. The `demo-context.tsx` file exists but is not actively used. When working on new features, assume the API is always available at the same origin.

## Common Development Tasks

### Adding a New Scanner

1. Create scanner file in `lib/scanners/`:
```typescript
// lib/scanners/my-scanner.ts
import type { Scanner, ScanResult } from "./types";

export const myScanner: Scanner = {
  async scan(target: string): Promise<ScanResult> {
    const findings: Finding[] = [];
    // ... scanning logic
    return {
      scanner: "my_scanner",
      success: true,
      findings,
      error: "",
      duration_seconds: 0,
    };
  },
};
```

2. Register in scanner registry (check existing scanners for pattern)
3. Add to `SCANNER_INFO` in `lib/scanner-info.ts`
4. Update health check in `app/api/health/route.ts`
5. Update settings page scanner list

### Adding a New Finding Type

1. Add type to Finding interface in `types/index.ts`
2. Update severity badge colors if needed
3. Add AI analysis prompt handling in `app/api/ai/analyze/route.ts`
4. Update mock data if needed

### Working with Timestamps

**Always use ISO 8601 strings**:
```typescript
created_at: new Date().toISOString()
```

**Calculate elapsed time**:
```typescript
const start = new Date(scan.created_at).getTime();
const end = scan.completed_at
  ? new Date(scan.completed_at).getTime()
  : Date.now();
const seconds = Math.floor((end - start) / 1000);
```

### shadcn/ui Component Usage

Components are pre-installed in `components/ui/`. Common ones:
- `Dialog` - Modals and dialogs
- `Card` - Content containers
- `Badge` - Status indicators
- `Button` - Actions
- `Table` - Data tables
- `Skeleton` - Loading states
- `Alert` - Notifications

Import from `@/components/ui/*`

## Environment Variables

Required in `.env.local`:

```bash
# Required for AI analysis
ANTHROPIC_API_KEY=sk-ant-...

# Optional for Safe Browsing scanner
GOOGLE_SAFE_BROWSING_API_KEY=...

# Auto-set by Next.js (internal API)
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_HAS_ANTHROPIC_KEY=true  # Set automatically if key exists
```

## Important Notes

### DO NOT:
- ❌ Reference old Python backend on port 8000
- ❌ Use old scanner names (headers, nuclei, nmap, wpscan)
- ❌ Create separate backend services
- ❌ Use external databases
- ❌ Implement SSE (polling is fine for now)
- ❌ Remove the fire-and-forget pattern (required for long-running scans)

### DO:
- ✅ Use Next.js API routes for all backend logic
- ✅ Store data in `data/` JSON files
- ✅ Use TypeScript strict mode
- ✅ Follow shadcn/ui patterns
- ✅ Implement proper loading/error states
- ✅ Use timestamp-based timers (not setInterval for elapsed time)
- ✅ Deduplicate findings in real-time displays
- ✅ Test with both mock data and real scans

## Current State (Feb 2026)

**Completed features**:
- ✅ Dashboard with stat cards and recent scans
- ✅ Scans page with filtering and status tracking
- ✅ Scan detail page with AI analysis
- ✅ Client management (add, delete, view scans)
- ✅ Settings page with scanner status
- ✅ Real-time scan progress modal with minimization
- ✅ Delete functionality with cascade (scans, reports, JSON files)
- ✅ Migration from Python backend to Next.js API routes

**Known limitations**:
- Polling-based real-time updates (no SSE yet)
- No user authentication (single-user app)
- No export to PDF (only HTML and JSON)
- No scan scheduling or automation

## Testing

**Development**:
```bash
npm run dev  # Runs on http://localhost:3002
```

**Testing with mock data**:
- Mock data available in `lib/mock-data.ts`
- Use `MOCK_SCANS`, `MOCK_CLIENTS`, `MOCK_SCAN_DETAIL`

**Testing real scans**:
- Use public websites (e.g., `example.com`)
- Safe Browsing requires API key
- Observatory scanner may rate-limit on repeated scans

## Future Considerations

**Potential enhancements** (not yet implemented):
- Server-Sent Events for real-time updates
- PDF report generation
- Scan scheduling and automation
- Multi-user support with authentication
- Webhook notifications
- Custom scanner plugins
- Scan comparison view
- Trend analysis over time

---

**Last Updated**: February 2026
**Current Version**: 1.0.0
**Architecture**: Next.js 16 unified application with built-in API routes
