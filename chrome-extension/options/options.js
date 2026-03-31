/**
 * Channel Companion - Options Page Script
 * Handles settings UI and persistence
 */

class OptionsManager {
  constructor() {
    this.formElement = document.getElementById('settings-form');
    this.statusMessage = document.getElementById('status-message');
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.updateAuthStatus();
  }

  setupEventListeners() {
    // Form submission
    this.formElement?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Reset button
    document.getElementById('reset-btn')?.addEventListener('click', () => this.resetSettings());

    // Token toggle
    document.getElementById('toggle-token')?.addEventListener('click', () => this.toggleTokenVisibility());

    // Clear cache
    document.getElementById('clear-cache')?.addEventListener('click', () => this.clearCache());

    // Individual field changes
    document.getElementById('api-token')?.addEventListener('input', () => this.updateAuthStatus());
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'apiUrl',
        'apiToken',
        'siteGmail',
        'siteOutlook',
        'siteLinkedIn',
        'notifyAtRisk',
        'notifyNeedsAttention',
        'notifyDailyDigest',
        'cacheRefresh'
      ]);

      // Set form values
      const form = this.formElement;
      if (form) {
        form.apiUrl.value = result.apiUrl || 'https://channel-manager-experience-production.up.railway.app/api/live';
        form.apiToken.value = result.apiToken || '';
        form.siteGmail.checked = result.siteGmail !== false;
        form.siteOutlook.checked = result.siteOutlook !== false;
        form.siteLinkedIn.checked = result.siteLinkedIn !== false;
        form.notifyAtRisk.checked = result.notifyAtRisk !== false;
        form.notifyNeedsAttention.checked = result.notifyNeedsAttention !== false;
        form.notifyDailyDigest.checked = result.notifyDailyDigest === true;
        form.cacheRefresh.value = result.cacheRefresh || '5';
      }

      this.updateCacheInfo();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showStatus('Failed to load settings', 'error');
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    try {
      const form = this.formElement;
      const settings = {
        apiUrl: form.apiUrl.value,
        apiToken: form.apiToken.value,
        siteGmail: form.siteGmail.checked,
        siteOutlook: form.siteOutlook.checked,
        siteLinkedIn: form.siteLinkedIn.checked,
        notifyAtRisk: form.notifyAtRisk.checked,
        notifyNeedsAttention: form.notifyNeedsAttention.checked,
        notifyDailyDigest: form.notifyDailyDigest.checked,
        cacheRefresh: form.cacheRefresh.value
      };

      await chrome.storage.local.set(settings);

      // Update service worker if API token changed
      if (settings.apiToken) {
        await chrome.runtime.sendMessage({
          action: 'setApiToken',
          token: settings.apiToken
        });
      }

      this.showStatus('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showStatus('Failed to save settings', 'error');
    }
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        const defaultSettings = {
          apiUrl: 'https://channel-manager-experience-production.up.railway.app/api/live',
          apiToken: '',
          siteGmail: true,
          siteOutlook: true,
          siteLinkedIn: true,
          notifyAtRisk: true,
          notifyNeedsAttention: true,
          notifyDailyDigest: false,
          cacheRefresh: '5'
        };

        await chrome.storage.local.set(defaultSettings);
        await this.loadSettings();
        this.showStatus('Settings reset to defaults', 'success');
      } catch (error) {
        console.error('Failed to reset settings:', error);
        this.showStatus('Failed to reset settings', 'error');
      }
    }
  }

  toggleTokenVisibility() {
    const tokenInput = document.getElementById('api-token');
    const toggleBtn = document.getElementById('toggle-token');

    if (tokenInput && toggleBtn) {
      const isPassword = tokenInput.type === 'password';
      tokenInput.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
    }
  }

  async updateAuthStatus() {
    const tokenInput = document.getElementById('api-token');
    const statusEl = document.getElementById('auth-status');

    if (!statusEl) return;

    const token = tokenInput?.value;

    if (token && token.length > 10) {
      statusEl.className = 'form-group';
      statusEl.innerHTML = `
        <div class="auth-status">
          <span class="status-indicator connected"></span>
          <span class="status-text">Ready to Connect</span>
        </div>
      `;
    } else if (token) {
      statusEl.className = 'form-group';
      statusEl.innerHTML = `
        <div class="auth-status">
          <span class="status-indicator"></span>
          <span class="status-text" style="color: #92400e; --cc-text-light: #92400e;">Invalid Token</span>
        </div>
      `;
    } else {
      statusEl.className = 'form-group';
      statusEl.innerHTML = `
        <div class="auth-status">
          <span class="status-indicator disconnected"></span>
          <span class="status-text">No Token Provided</span>
        </div>
      `;
    }
  }

  async clearCache() {
    if (confirm('Clear cached advisor data? This will reload your advisor list from the API.')) {
      try {
        await chrome.storage.local.remove(['recentAdvisors']);
        // Trigger cache refresh in background script
        await chrome.runtime.sendMessage({
          action: 'refreshCache'
        }).catch(() => {
          // Background script might not exist yet
        });
        this.showStatus('Cache cleared successfully', 'success');
        this.updateCacheInfo();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        this.showStatus('Failed to clear cache', 'error');
      }
    }
  }

  async updateCacheInfo() {
    const cacheInfoEl = document.getElementById('cache-info');
    if (!cacheInfoEl) return;

    try {
      const result = await chrome.storage.local.get(['recentAdvisors']);
      const recentCount = (result.recentAdvisors || []).length;

      const cacheSize = recentCount > 0
        ? `${recentCount} recent advisor${recentCount === 1 ? '' : 's'} cached`
        : 'No cached data';

      const sizeEl = cacheInfoEl.querySelector('#cache-size');
      if (sizeEl) {
        sizeEl.textContent = cacheSize;
      }
    } catch (error) {
      console.error('Failed to update cache info:', error);
    }
  }

  showStatus(message, type = 'info') {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message show ${type}`;

    setTimeout(() => {
      this.statusMessage.classList.remove('show');
    }, 3000);
  }
}

// Initialize options page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
  });
} else {
  new OptionsManager();
}
