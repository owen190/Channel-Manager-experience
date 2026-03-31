/**
 * Channel Companion - Popup Script
 * Main popup UI interactions and data loading
 */

const API_BASE = 'https://channel-manager-experience-production.up.railway.app/api/live';

class PopupManager {
  constructor() {
    this.apiToken = null;
    this.advisors = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.checkAuthStatus();
    await this.loadRecentAdvisors();
    await this.loadDashboardStats();
  }

  setupEventListeners() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('advisor-search');
    const dashboardBtn = document.getElementById('open-dashboard');
    const settingsBtn = document.getElementById('settings-btn');
    const advisorItems = document.querySelectorAll('.advisor-item');

    searchBtn?.addEventListener('click', () => this.handleSearch());
    searchInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    dashboardBtn?.addEventListener('click', () => this.openDashboard());
    settingsBtn?.addEventListener('click', () => this.openSettings());

    advisorItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const name = e.currentTarget.querySelector('.advisor-name').textContent;
        this.viewAdvisorProfile(name);
      });
    });
  }

  async checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get(['apiToken', 'authStatus']);
      this.apiToken = result.apiToken;
      const statusIndicator = document.querySelector('.status-indicator');
      const statusText = document.querySelector('.status-text');

      if (this.apiToken && result.authStatus === 'connected') {
        statusIndicator?.classList.add('connected');
        statusText.textContent = 'Connected to platform';
      } else {
        statusIndicator?.classList.remove('connected');
        statusText.textContent = 'Disconnected — Check settings';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  async loadRecentAdvisors() {
    try {
      const message = { action: 'getRecentAdvisors', limit: 3 };
      const response = await chrome.runtime.sendMessage(message);

      if (response?.success && response.data?.length > 0) {
        this.renderRecentAdvisors(response.data);
      }
    } catch (error) {
      console.error('Failed to load recent advisors:', error);
    }
  }

  renderRecentAdvisors(advisors) {
    const list = document.getElementById('recent-advisors');
    if (!list) return;

    list.innerHTML = advisors.map(advisor => `
      <li class="advisor-item" data-advisor-id="${advisor.id}">
        <div class="advisor-avatar">${this.getInitials(advisor.name)}</div>
        <div class="advisor-info">
          <div class="advisor-name">${advisor.name}</div>
          <div class="advisor-company">${advisor.company || 'Unknown'}</div>
        </div>
        <div class="advisor-mrr">${this.formatMRR(advisor.mrr)}</div>
      </li>
    `).join('');

    // Re-attach click listeners
    list.querySelectorAll('.advisor-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const name = e.currentTarget.querySelector('.advisor-name').textContent;
        this.viewAdvisorProfile(name);
      });
    });
  }

  async loadDashboardStats() {
    try {
      const message = { action: 'getDashboardStats' };
      const response = await chrome.runtime.sendMessage(message);

      if (response?.success && response.data) {
        const { activeDeals, needsAttention, atRisk } = response.data;
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = activeDeals || '12';
        if (statValues[1]) statValues[1].textContent = needsAttention || '3';
        if (statValues[2]) statValues[2].textContent = atRisk || '2';
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  }

  async handleSearch() {
    const input = document.getElementById('advisor-search');
    const query = input?.value.trim();

    if (!query) return;

    try {
      const message = {
        action: 'lookupAdvisor',
        query: query,
        searchType: 'name' // Could be 'email' or 'name'
      };
      const response = await chrome.runtime.sendMessage(message);

      if (response?.success && response.data) {
        this.viewAdvisorProfile(response.data.name);
      } else {
        this.showNotification('Advisor not found', 'warning');
      }
    } catch (error) {
      console.error('Search failed:', error);
      this.showNotification('Search failed', 'error');
    }
  }

  viewAdvisorProfile(name) {
    // In a full implementation, this would open the advisor's profile in the dashboard
    // For now, just log and show notification
    console.log('Opening profile for:', name);
    this.showNotification(`Opening ${name}'s profile...`, 'info');

    // Open dashboard (in practice, would open advisor's page)
    setTimeout(() => this.openDashboard(), 500);
  }

  openDashboard() {
    const dashboardUrl = 'https://channel-manager-experience-production.up.railway.app/dashboard';
    chrome.tabs.create({ url: dashboardUrl });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  showNotification(message, type = 'info') {
    // In a full implementation, this would show a toast notification
    console.log(`[${type}] ${message}`);
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatMRR(mrr) {
    if (!mrr) return '$0/mo';
    if (mrr >= 1000) {
      return `$${(mrr / 1000).toFixed(1)}K/mo`;
    }
    return `$${mrr}/mo`;
  }
}

// Initialize popup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
  });
} else {
  new PopupManager();
}
