# SecScan - Security Scanner Dashboard

A professional security scanning dashboard for web agencies to manage and monitor client website security.

## 🎯 Features

- **Dashboard Overview** - At-a-glance security metrics with severity distribution charts
- **Security Scans** - One-click scanning with multiple security tools (SSL, Headers, Crawler, Nuclei, Nmap, WPScan)
- **AI Analysis** - Claude-powered plain-English security reports
- **Client Management** - Organize and track security for multiple clients
- **Built-in Scanners** - No external backend required - everything runs in Next.js

## 🏗️ Architecture

### Full-Stack Next.js Application
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Markdown**: react-markdown
- **Backend**: Built-in Next.js API Routes
- **Storage**: JSON file-based storage (data/ directory)
- **Scanners**:
  - Built-in: SSL (tls), Headers (fetch), Crawler (fetch)
  - CLI Tools: Nmap, Nuclei, WPScan (optional, graceful degradation)
- **AI**: Claude 4.5 Sonnet (Anthropic) - optional

## 📦 Installation

### 1. Clone and Install
```bash
cd security-dashboard
npm install
```

### 2. Configure Environment (Optional)
Create `.env.local` and add your Anthropic API key for AI-powered analysis:
```env
# Optional - enables AI-powered scan analysis
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your API key at: https://console.anthropic.com

**Note**: Scans work without an API key - you'll get a structured summary instead of AI analysis.

### 3. Start the Application
```bash
npm run dev
```

Dashboard will be available at: http://localhost:3002

**That's it!** No Python, no separate backend, no port 8000. Everything runs in one process.

## 🚀 Usage

### Core Scanners (No Installation Required)
Three scanners work out-of-the-box with zero external dependencies:
- **SSL Scanner** - Certificate validation and TLS version checking
- **Headers Scanner** - Security headers analysis (HSTS, CSP, etc.)
- **Crawler Scanner** - Exposed files, mixed content, technology detection

### Optional CLI Scanners
For advanced scanning, install these tools:
- **Nmap** - Port scanning ([nmap.org](https://nmap.org/download.html))
- **Nuclei** - CVE detection ([github.com/projectdiscovery/nuclei](https://github.com/projectdiscovery/nuclei))
- **WPScan** - WordPress scanning ([wpscan.com](https://wpscan.com/))

The dashboard will automatically detect which tools are installed and enable them.

## 📄 Pages

### Dashboard (`/dashboard`)
- 4 stat cards: Total Scans, Active Scans, Total Findings, Critical Issues
- Severity distribution chart
- Recent scans table
- Auto-refresh for active scans

### Scans (`/dashboard/scans`)
- Filterable scans table (All / Complete / In Progress / Failed)
- New Scan dialog with scanner selection
- Auto-polling (3s) for active scans
- Progress indicators

### Scan Detail (`/dashboard/scans/[id]`)
- Dark gradient header with score circle
- AI-generated security analysis (markdown)
- Collapsible scanner results with findings
- Download HTML report and JSON data

### Clients (`/dashboard/clients`)
- Card grid with gradient avatars
- Client stats and latest scan summary
- Quick actions: View Scans, Scan Now
- Add/Delete client management

### Settings (`/dashboard/settings`)
- Scanner availability status (which CLI tools are installed)
- AI analysis configuration status
- Default scanner preferences
- About and documentation links

## 🎨 Design System

### Severity Levels
- 🔴 **Critical** - Red - Requires immediate attention
- 🟠 **High** - Orange - Fix this week
- 🟡 **Medium** - Yellow - Address soon
- 🔵 **Low** - Blue - Minor issue
- ⚪ **Info** - Gray - Informational

### Components (`components/security/`)
- `SeverityBadge` - Colored severity indicators
- `StatusBadge` - Scan status with animations
- `SeveritySummaryBar` - Horizontal severity counts
- `FindingRow` - Detailed finding display
- `ScanProgressBar` - Progress indicator
- `NewScanDialog` - Start new scan modal
- `AddClientDialog` - Add client modal

## 🔌 API Endpoints

Built-in Next.js API routes (in `app/api/`). All API calls are in `lib/api.ts`:

**Scans**
- `GET /api/scans?limit=50` - List scans
- `GET /api/scans/{id}` - Get scan detail
- `POST /api/scans` - Start new scan
- `DELETE /api/scans/{id}` - Delete scan

**Clients**
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `DELETE /api/clients/{id}` - Delete client

**Health**
- `GET /api/health` - Backend status and scanner availability

## 🛠️ Development

### Project Structure
```
security-dashboard/
├── app/
│   ├── api/                 # Next.js API routes (backend)
│   │   ├── health/
│   │   ├── scans/
│   │   └── clients/
│   └── dashboard/(auth)/
│       ├── page.tsx          # Dashboard
│       ├── scans/
│       │   ├── page.tsx      # Scans list
│       │   └── [id]/page.tsx # Scan detail
│       ├── clients/page.tsx  # Clients
│       └── settings/page.tsx # Settings
├── components/security/      # Security components
├── lib/
│   ├── api.ts               # API client functions
│   ├── storage.ts           # JSON file storage
│   ├── scanners/            # Scanner implementations
│   │   ├── ssl-scanner.ts   # Built-in SSL scanner
│   │   ├── headers-scanner.ts # Built-in headers scanner
│   │   ├── crawler-scanner.ts # Built-in crawler
│   │   ├── nmap-scanner.ts  # CLI: Nmap
│   │   ├── nuclei-scanner.ts # CLI: Nuclei
│   │   └── wpscan-scanner.ts # CLI: WPScan
│   ├── ai/analyse.ts        # AI analysis with Claude
│   ├── severity.ts          # Severity config
│   └── scanner-info.ts      # Scanner metadata
├── types/index.ts           # TypeScript types
└── data/                    # JSON storage (gitignored)
    ├── scans.json
    └── clients.json
```

### Adding New Scanners
1. Create scanner in `lib/scanners/your-scanner.ts` implementing the `Scanner` interface
2. Add to `SCANNER_MAP` in `lib/scanners/index.ts`
3. Update `SCANNER_INFO` in `lib/scanner-info.ts` for UI metadata
4. Scanner will automatically appear in NewScanDialog and health checks

### Customizing Colors
Edit `lib/severity.ts` - all severity colors are centralized there.

## 📱 Mobile Support

Fully responsive:
- Sidebar collapses to hamburger menu
- Card grids stack on mobile
- Tables scroll horizontally
- Touch-friendly hit targets

## 🎯 Next Steps

1. **Run First Scan** - Navigate to Scans → New Scan and enter a URL
2. **Review Results** - Check the built-in scanners (SSL, Headers, Crawler)
3. **Add AI Analysis** - Configure ANTHROPIC_API_KEY for AI-powered reports
4. **Install CLI Tools** - Add Nmap, Nuclei, WPScan for advanced scanning
5. **Manage Clients** - Track security across multiple client websites

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)

## 🔒 Security Tools Used

- **Nmap** - Network port scanning
- **Nuclei** - CVE and vulnerability templates
- **WPScan** - WordPress-specific security
- **SSL Labs** - Certificate validation
- **Security Headers** - CSP, HSTS, etc.
- **Site Crawler** - Exposed files and tech detection

## 🤝 Credits

Built on the [Bundui Shadcn UI Kit Dashboard](https://github.com/bundui/shadcn-ui-kit-dashboard)

AI analysis powered by [Claude 4.5 Sonnet](https://www.anthropic.com)

---

**Status**: ✅ Production Ready

**Version**: 1.0.0

**License**: MIT

**Last Updated**: 15 Feb 2026
