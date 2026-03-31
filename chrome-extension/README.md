# Channel Companion Chrome Extension

A complete, functional Chrome Extension scaffold for Channel Companion, an AI-powered channel intelligence platform.

## Directory Structure

```
chrome-extension/
├── manifest.json                 # Manifest V3 extension configuration
├── popup/                        # Extension popup UI
│   ├── popup.html               # Popup interface
│   ├── popup.css                # Popup styling
│   └── popup.js                 # Popup logic & event handlers
├── content/                      # Content scripts for different platforms
│   ├── gmail.js                 # Gmail email detection & sidebar injection
│   ├── outlook.js               # Outlook web email detection & sidebar
│   ├── linkedin.js              # LinkedIn profile detection & floating card
│   └── styles.css               # Shared styles for all content scripts
├── background/                  # Service worker
│   └── service-worker.js        # API calls, caching, message routing
├── options/                     # Settings page
│   ├── options.html             # Settings UI
│   ├── options.css              # Settings styling
│   └── options.js               # Settings management
└── icons/                       # Extension icons
    ├── icon16.svg               # 16px icon
    ├── icon48.svg               # 48px icon
    └── icon128.svg              # 128px icon
```

## Features

### Popup (`popup/`)
- Quick advisor lookup search bar
- 3-5 recently viewed advisors
- Quick stats (active deals, needs attention, at-risk)
- Connection status indicator
- Open Dashboard button
- Settings access

### Content Scripts

#### Gmail (`content/gmail.js`)
- Detects when emails are opened in Gmail
- Extracts sender email address
- Injects right-side advisor panel showing:
  - Advisor name, company, pulse badge
  - Friction level with visual indicator
  - MRR (Monthly Recurring Revenue)
  - Last interaction date
  - Active deals count
  - View Full Profile link
- Shows "Unknown contact" UI for non-portfolio advisors
- Smooth slide-in/out animations

#### Outlook (`content/outlook.js`)
- Same functionality as Gmail but adapted for Outlook Web
- Detects sender in Outlook's reading pane structure
- Identical advisor panel styling and functionality

#### LinkedIn (`content/linkedin.js`)
- Detects when viewing LinkedIn profile pages
- Extracts person's name from profile header
- Injects floating card showing:
  - Advisor info if in portfolio
  - "Not in portfolio" UI if unknown
  - One-click add as advisor
  - Quick action buttons
- Non-intrusive floating card design

### Service Worker (`background/service-worker.js`)
- Handles all messaging from content scripts
- API communication with Channel Manager platform
- Advisor data caching (5-minute refresh interval)
- Methods:
  - `lookupAdvisor(query, searchType)` - Search by email or name
  - `getRecentAdvisors(limit)` - Get recently viewed advisors
  - `getDashboardStats()` - Get dashboard metrics
  - `setApiToken(token)` - Store authentication token
  - `addAdvisor(advisorData)` - Add new advisor to portfolio
- Badge management (shows at-risk advisor count)

### Settings (`options/`)
- API endpoint configuration
- API token management with show/hide toggle
- Per-site activation toggles (Gmail, Outlook, LinkedIn)
- Notification preferences
- Cache management with clear button
- Cache refresh interval configuration
- About section with support link

### Styling (`content/styles.css`)
- Professional brand color palette (teal #157A6E)
- Responsive sidebar panel (320px width)
- Floating card for LinkedIn
- Badge styling for pulse, friction, status
- Smooth animations and transitions
- Inter font via Google Fonts
- CSS custom properties for themability

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. The extension will appear in your extensions menu

## Configuration

1. Click the extension icon → Settings (gear icon)
2. Enter your API token (get from Channel Manager dashboard)
3. Verify connection status
4. Toggle which sites to activate on
5. Click "Save Settings"

## API Integration

The extension communicates with:
```
https://channel-manager-experience-production.up.railway.app/api/live
```

Required endpoints:
- `GET /advisors` - Get all advisors
- `GET /advisors/search?email={email}` - Search by email
- `GET /advisors/search?name={name}` - Search by name
- `POST /advisors` - Add new advisor
- `GET /advisors/{id}` - Get advisor details

## Development Notes

- All JavaScript uses modern ES6+ features
- Manifest V3 compliant (no background pages)
- CSS uses CSS custom properties for easy theming
- Content scripts use MutationObserver for DOM monitoring
- Service worker caches data to reduce API calls
- All styles scoped to avoid conflicts with host pages
- Error handling includes user-friendly fallbacks

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Brave
- All Chromium-based browsers supporting Manifest V3

## Security

- API token stored in Chrome's local storage only
- No data transmitted to third-party services
- No cookies or tracking
- Extension-only communication channels
- Content scripts isolated from host page globals
