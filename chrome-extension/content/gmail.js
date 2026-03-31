/**
 * Channel Companion - Gmail Content Script
 * Detects opened emails and injects advisor sidebar
 */

const API_BASE = 'https://channel-manager-experience-production.up.railway.app/api/live';

class GmailCompanion {
  constructor() {
    this.currentEmail = null;
    this.sidebar = null;
    this.init();
  }

  init() {
    // Watch for Gmail's compose/read view changes
    this.watchDOMChanges();
    // Try to detect initial email on page load
    setTimeout(() => this.detectAndInjectSidebar(), 1000);
  }

  watchDOMChanges() {
    const observer = new MutationObserver(() => {
      this.detectAndInjectSidebar();
    });

    const config = {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-label', 'data-message-id']
    };

    // Watch the main Gmail container
    const mainContainer = document.querySelector('[role="main"]');
    if (mainContainer) {
      observer.observe(mainContainer, config);
    } else {
      // Fallback to body
      observer.observe(document.body, config);
    }
  }

  detectAndInjectSidebar() {
    // Check if we're in a conversation/email view
    const emailHeader = this.findEmailHeader();
    if (!emailHeader) return;

    const senderEmail = this.extractSenderEmail(emailHeader);
    if (!senderEmail) return;

    // Only inject if not already present
    if (document.querySelector('.cc-sidebar')) return;

    // Inject sidebar
    this.createAndInjectSidebar(senderEmail);
  }

  findEmailHeader() {
    // Gmail conversation view typically has a header section
    const headers = document.querySelectorAll('[data-message-id], .a4w4de');
    for (let header of headers) {
      if (this.extractSenderEmail(header)) {
        return header;
      }
    }
    return null;
  }

  extractSenderEmail(element) {
    // Look for email address patterns in the header
    // Gmail stores sender info in various places
    const headerCells = element.querySelectorAll('[email], .gD');

    for (let cell of headerCells) {
      const email = cell.getAttribute('email') || cell.textContent;
      if (this.isValidEmail(email)) {
        return email.toLowerCase();
      }
    }

    // Alternative: search for email patterns in text
    const text = element.textContent;
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      return emailMatch[1].toLowerCase();
    }

    return null;
  }

  isValidEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  createAndInjectSidebar(senderEmail) {
    this.currentEmail = senderEmail;

    // Create sidebar container
    const sidebar = document.createElement('div');
    sidebar.className = 'cc-sidebar';
    sidebar.innerHTML = this.renderSidebarHTML();

    // Insert into the page
    document.body.appendChild(sidebar);
    this.sidebar = sidebar;

    // Fetch advisor data
    this.loadAdvisorData(senderEmail, sidebar);

    // Setup close button
    const closeBtn = sidebar.querySelector('.cc-sidebar-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSidebar());
    }
  }

  renderSidebarHTML() {
    return `
      <div class="cc-sidebar-header">
        <h3 class="cc-sidebar-title">Channel Companion</h3>
        <p class="cc-sidebar-subtitle">Advisor Intelligence</p>
        <button class="cc-sidebar-close" title="Close sidebar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="cc-sidebar-content">
        <div class="cc-loading">
          <div class="cc-spinner"></div>
          <p>Loading advisor data...</p>
        </div>
      </div>
    `;
  }

  async loadAdvisorData(email, sidebar) {
    try {
      const message = {
        action: 'lookupAdvisor',
        query: email,
        searchType: 'email'
      };
      const response = await chrome.runtime.sendMessage(message);

      if (response?.success && response.data) {
        this.renderAdvisorPanel(response.data, sidebar);
      } else {
        this.renderUnknownContact(email, sidebar);
      }
    } catch (error) {
      console.error('Failed to load advisor data:', error);
      this.renderErrorState(sidebar);
    }
  }

  renderAdvisorPanel(advisor, sidebar) {
    const content = sidebar.querySelector('.cc-sidebar-content');
    if (!content) return;

    const lastInteraction = advisor.lastInteraction
      ? new Date(advisor.lastInteraction).toLocaleDateString()
      : 'Never';

    content.innerHTML = `
      <div class="cc-advisor-card">
        <div class="cc-advisor-header">
          <div class="cc-advisor-avatar">${this.getInitials(advisor.name)}</div>
          <div>
            <h4 class="cc-advisor-name">${advisor.name}</h4>
            <p class="cc-advisor-company">${advisor.company || 'Unknown'}</p>
          </div>
        </div>

        <div class="cc-advisor-badges">
          <span class="cc-badge cc-pulse-badge ${advisor.pulse?.toLowerCase() || 'inactive'}">
            ● ${advisor.pulse || 'Inactive'}
          </span>
          <span class="cc-badge cc-friction-badge ${this.getFrictionLevel(advisor.friction)}">
            ⚡ Friction: ${advisor.friction || 'N/A'}
          </span>
          ${advisor.atRisk ? '<span class="cc-badge cc-status-badge at-risk">⚠️ At Risk</span>' : ''}
          ${advisor.needsAttention ? '<span class="cc-badge cc-status-badge needs-attention">📌 Needs Attention</span>' : ''}
        </div>

        <div class="cc-metrics">
          <div class="cc-metric">
            <div class="cc-metric-label">MRR</div>
            <div class="cc-metric-value">${this.formatCurrency(advisor.mrr)}</div>
          </div>
          <div class="cc-metric">
            <div class="cc-metric-label">Active Deals</div>
            <div class="cc-metric-value">${advisor.activeDeals || 0}</div>
          </div>
          <div class="cc-metric">
            <div class="cc-metric-label">Last Interaction</div>
            <div class="cc-metric-value" style="font-size: 11px;">${lastInteraction}</div>
          </div>
          <div class="cc-metric">
            <div class="cc-metric-label">Email</div>
            <div class="cc-metric-value" style="font-size: 11px; word-break: break-all;">${this.currentEmail}</div>
          </div>
        </div>

        <button class="cc-view-profile-btn">
          View Full Profile →
        </button>
      </div>
    `;

    // Setup profile button
    const profileBtn = content.querySelector('.cc-view-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.openAdvisorProfile(advisor.id);
      });
    }
  }

  renderUnknownContact(email, sidebar) {
    const content = sidebar.querySelector('.cc-sidebar-content');
    if (!content) return;

    content.innerHTML = `
      <div class="cc-unknown-contact">
        <div class="cc-unknown-icon">👤</div>
        <p class="cc-unknown-message">
          This contact isn't in your Channel Companion portfolio yet.
        </p>
        <p style="font-size: 12px; color: var(--cc-text-light); margin-bottom: 12px;">
          ${email}
        </p>
        <button class="cc-add-contact-btn">+ Add as Advisor</button>
      </div>
    `;

    const addBtn = content.querySelector('.cc-add-contact-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addAsAdvisor(email);
      });
    }
  }

  renderErrorState(sidebar) {
    const content = sidebar.querySelector('.cc-sidebar-content');
    if (!content) return;

    content.innerHTML = `
      <div class="cc-error-message">
        Failed to load advisor data. Please check your connection and try again.
      </div>
    `;
  }

  async addAsAdvisor(email) {
    // In a real implementation, this would send a request to the API
    console.log('Adding advisor:', email);
    // Could open a modal or redirect to dashboard
  }

  openAdvisorProfile(advisorId) {
    const profileUrl = `https://channel-manager-experience-production.up.railway.app/advisors/${advisorId}`;
    chrome.tabs.create({ url: profileUrl });
  }

  closeSidebar() {
    if (this.sidebar) {
      this.sidebar.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        this.sidebar?.remove();
        this.sidebar = null;
      }, 300);
    }
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatCurrency(amount) {
    if (!amount) return '$0';
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  }

  getFrictionLevel(friction) {
    if (!friction) return 'medium';
    const level = friction.toLowerCase();
    return ['low', 'medium', 'high'].includes(level) ? level : 'medium';
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GmailCompanion();
  });
} else {
  new GmailCompanion();
}
