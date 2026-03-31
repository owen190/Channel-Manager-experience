/**
 * Channel Companion - Service Worker / Background Script
 * Handles messaging, API calls, caching, and authentication
 */

const API_BASE = 'https://channel-manager-experience-production.up.railway.app/api/live';

class AdvisorService {
  constructor() {
    this.cache = {
      advisors: [],
      lastRefresh: 0,
      refreshInterval: 5 * 60 * 1000 // 5 minutes
    };
    this.apiToken = null;
    this.init();
  }

  async init() {
    // Load stored auth token
    const result = await chrome.storage.local.get(['apiToken']);
    this.apiToken = result.apiToken;

    // Set up message listeners
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Async response
    });

    // Initial cache load
    this.refreshAdvisorCache();
  }

  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'lookupAdvisor':
          const result = await this.lookupAdvisor(request.query, request.searchType);
          sendResponse({ success: true, data: result });
          break;

        case 'getRecentAdvisors':
          const recent = await this.getRecentAdvisors(request.limit || 3);
          sendResponse({ success: true, data: recent });
          break;

        case 'getDashboardStats':
          const stats = await this.getDashboardStats();
          sendResponse({ success: true, data: stats });
          break;

        case 'setApiToken':
          await this.setApiToken(request.token);
          sendResponse({ success: true });
          break;

        case 'getAuthStatus':
          const status = await this.getAuthStatus();
          sendResponse({ success: true, data: status });
          break;

        case 'addAdvisor':
          const addResult = await this.addAdvisor(request.advisorData);
          sendResponse({ success: true, data: addResult });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async lookupAdvisor(query, searchType = 'name') {
    // Ensure cache is fresh
    await this.ensureCacheIsFresh();

    // Search in local cache first
    let advisor = null;

    if (searchType === 'email') {
      advisor = this.cache.advisors.find(a => a.email?.toLowerCase() === query.toLowerCase());
    } else if (searchType === 'name') {
      advisor = this.cache.advisors.find(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(a.name.toLowerCase())
      );
    }

    if (advisor) {
      // Update last viewed
      await this.trackAdvisorView(advisor.id);
      return advisor;
    }

    // If not in cache, try API
    try {
      advisor = await this.fetchAdvisorFromAPI(query, searchType);
      if (advisor) {
        await this.trackAdvisorView(advisor.id);
      }
      return advisor;
    } catch (error) {
      console.error('API lookup failed:', error);
      return null;
    }
  }

  async fetchAdvisorFromAPI(query, searchType) {
    if (!this.apiToken) return null;

    const endpoint = searchType === 'email'
      ? `${API_BASE}/advisors/search?email=${encodeURIComponent(query)}`
      : `${API_BASE}/advisors/search?name=${encodeURIComponent(query)}`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return data.data || null;
  }

  async ensureCacheIsFresh() {
    const now = Date.now();
    if (now - this.cache.lastRefresh > this.cache.refreshInterval) {
      await this.refreshAdvisorCache();
    }
  }

  async refreshAdvisorCache() {
    if (!this.apiToken) return;

    try {
      const response = await fetch(`${API_BASE}/advisors`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      this.cache.advisors = Array.isArray(data.data) ? data.data : [];
      this.cache.lastRefresh = Date.now();

      // Update badge with at-risk count
      this.updateBadge();
    } catch (error) {
      console.error('Failed to refresh advisor cache:', error);
    }
  }

  async getRecentAdvisors(limit = 3) {
    try {
      const result = await chrome.storage.local.get(['recentAdvisors']);
      const recent = result.recentAdvisors || [];

      // Return the most recent advisors
      return recent.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent advisors:', error);
      return [];
    }
  }

  async getDashboardStats() {
    await this.ensureCacheIsFresh();

    const activeDeals = this.cache.advisors.reduce((sum, a) => sum + (a.activeDeals || 0), 0);
    const needsAttention = this.cache.advisors.filter(a => a.needsAttention).length;
    const atRisk = this.cache.advisors.filter(a => a.atRisk).length;

    return {
      activeDeals,
      needsAttention,
      atRisk,
      totalAdvisors: this.cache.advisors.length
    };
  }

  async setApiToken(token) {
    this.apiToken = token;
    await chrome.storage.local.set({
      apiToken: token,
      authStatus: 'connected'
    });
    // Refresh cache with new token
    await this.refreshAdvisorCache();
  }

  async getAuthStatus() {
    const result = await chrome.storage.local.get(['apiToken', 'authStatus']);
    return {
      isAuthenticated: !!result.apiToken,
      status: result.authStatus || 'disconnected'
    };
  }

  async trackAdvisorView(advisorId) {
    // Track recently viewed advisors
    const result = await chrome.storage.local.get(['recentAdvisors']);
    let recent = result.recentAdvisors || [];

    // Add to front, remove if duplicate
    recent = recent.filter(id => id !== advisorId);
    recent.unshift(advisorId);

    // Keep only last 10
    recent = recent.slice(0, 10);

    await chrome.storage.local.set({ recentAdvisors: recent });
  }

  async addAdvisor(advisorData) {
    if (!this.apiToken) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/advisors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(advisorData)
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();

    // Refresh cache
    await this.refreshAdvisorCache();

    return data.data || null;
  }

  updateBadge() {
    const atRiskCount = this.cache.advisors.filter(a => a.atRisk).length;

    if (atRiskCount > 0) {
      chrome.action.setBadgeText({ text: atRiskCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }
}

// Initialize the service
const advisorService = new AdvisorService();

// Refresh cache periodically
setInterval(() => {
  advisorService.refreshAdvisorCache();
}, 5 * 60 * 1000); // Every 5 minutes
