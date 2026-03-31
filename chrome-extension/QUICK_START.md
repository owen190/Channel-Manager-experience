# Quick Start Guide

## Installation (Developer Mode)

1. Open Chrome and navigate to: `chrome://extensions/`
2. Toggle **"Developer mode"** in the top-right corner
3. Click **"Load unpacked"** button
4. Navigate to and select: `/sessions/inspiring-friendly-einstein/channel-companion/chrome-extension`
5. The "Channel Companion" extension will appear in your extensions list

## Configuration

1. Click the Channel Companion icon in your Chrome toolbar
2. In the popup, click the gear icon (Settings)
3. Enter your API token from the Channel Manager platform
4. Select which sites to enable (Gmail, Outlook, LinkedIn)
5. Click "Save Settings"
6. The status should change to "Connected to platform"

## First Use

### Gmail
- Open any email in Gmail
- A "Channel Companion" panel will slide in from the right
- Shows advisor information if they're in your portfolio
- Click "View Full Profile" to open their dashboard page

### Outlook Web
- Same behavior as Gmail
- Works on Outlook.live.com and Outlook.office.com
- Panel appears on the right side of the reading pane

### LinkedIn
- Visit any LinkedIn profile page
- A floating card appears in the bottom-right corner
- Shows advisor info or "Not in portfolio" option
- Click "Add as Advisor" to add them quickly

### Popup
- Click the extension icon anytime
- Search for advisors by name or email
- View your 3 most recent advisors
- See dashboard stats at a glance
- One-click access to full dashboard

## Troubleshooting

**Extension not appearing?**
- Refresh the page (Ctrl+R or Cmd+R)
- Check that the extension is enabled in chrome://extensions

**No advisor data showing?**
- Verify your API token is correct in Settings
- Check connection status shows "Connected"
- Try clearing cache in Settings → "Clear Cache"
- Refresh the page

**Settings page won't open?**
- Right-click the extension icon
- Select "Options" from the context menu

**API connection errors?**
- Verify your API token is valid and active
- Check internet connection
- Try clicking "Clear Cache" to force a refresh
- Check that the API endpoint URL is correct

## Features at a Glance

- **Real-time advisor lookup** in Gmail, Outlook, and LinkedIn
- **Smart caching** reduces API calls (5-minute refresh)
- **At-risk indicators** show on extension badge
- **Recent advisors** quick access from popup
- **One-click add** to portfolio from unknown contacts
- **Connection status** always visible
- **Customizable activation** per site
- **Notification preferences** for alerts

## Keyboard Shortcuts

Currently no keyboard shortcuts are configured. You can add them via:
1. Go to `chrome://extensions/shortcuts`
2. Find "Channel Companion"
3. Set your preferred shortcuts

## Tips

- The sidebar on Gmail/Outlook closes automatically when you move to a new email
- Click the X button to manually close sidebars or floating cards
- Your 10 most recent advisors are cached locally
- Friction levels use color coding: Green (Low), Orange (Medium), Red (High)
- MRR values are formatted automatically (e.g., $2.5K/mo)

## Support

For issues or feature requests:
1. Check the README.md for technical details
2. Visit: https://channel-manager-experience-production.up.railway.app/support
3. Check Chrome console (F12) for error messages

## Next Steps

- Configure your notification preferences in Settings
- Set your preferred cache refresh interval
- Explore the Dashboard by clicking "Open Dashboard" in the popup
- Add your portfolio of advisors to the platform

---

Ready to enhance your channel management workflow!
