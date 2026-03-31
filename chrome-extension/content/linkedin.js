/**
 * Channel Companion - LinkedIn Content Script
 * Detects profile pages and injects floating card with advisor info
 */

const API_BASE = 'https://channel-manager-experience-production.up.railway.app/api/live';

class LinkedInCompanion {
  constructor() {
    this.currentPerson = null;
    this.floatingCard = null;
    this.init();
  }

  init() {
    this.watchDOMChanges();
    setTimeout(() => this.detectAndInjectCard(), 1000);
  }

  watchDOMChanges() {
    const observer = new MutationObserver(() => {
      this.detectAndInjectCard();
    });

    const config = {
      subtree: true,
      childList: true,
      attributes: true
    };

    // Watch LinkedIn's main content area
    const mainContent = document.querySelector('main');
    if (mainContent) {
      observer.observe(mainContent, config);
    } else {
      observer.observe(document.body, config);
    }
  }

  detectAndInjectCard() {
    // Extract person's name from LinkedIn profile header
    const name = this.extractPersonName();
    if (!name) return;

    // Only inject if not already present
    if (document.querySelector('.cc-floating-card')) return;

    this.currentPerson = name;
    this.createAndInjectCard(name);
  }

  extractPersonName() {
    // LinkedIn profile name is typically in an h1 or prominent header
    const h1 = document.querySelector('h1, [data-test-id="top-card-profile-name"]');
    if (h1) {
      const name = h1.textContent.trim();
      if (name && name.length > 0 && !name.includes('@')) {
        return name;
      }
    }

    // Alternative selectors for LinkedIn's ever-changing DOM
    const nameEl = document.querySelector('[class*="profile-name"], .pv-text-details__left-panel h1');
    if (nameEl) {
      return nameEl.textContent.trim();
    }

    return null;
  }

  createAndInjectCard(name) {
    const card = document.createElement('div');
    card.className = 'cc-floating-card';
    card.innerHTML = this.renderCardHTML(name);

    document.body.appendChild(card);
    this.floatingCard = card;

    // Fetch advisor data
    this.loadAdvisorData(name, card);

    // Setup close button
    const closeBtn = card.querySelector('.cc-floating-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCard());
    }
  }

  renderCardHTML(name) {
    return `
      <div class="cc-floating-header">
        <div class="cc-floating-title">Channel Companion</div>
        <button class="cc-floating-close" title="Close">×</button>
      </div>
      <div class="cc-floating-body">
        <div style="text-align: center; padding: 20px 0;">
          <div class="cc-spinner"></div>
          <p style="font-size: 12px; color: var(--cc-text-light); margin-top: 8px;">
            Looking up ${name}...
          </p>
        </div>
      </div>
    `;
  }

  async loadAdvisorData(name, card) {
    try {
      const message = {
        action: 'lookupAdvisor',
        query: name,
        searchType: 'name'
      };
      const response = await chrome.runtime.sendMessage(message);

      if (response?.success && response.data) {
        this.renderAdvisorCard(response.data, card);
      } else {
        this.renderUnknownPerson(name, card);
      }
    } catch (error) {
      console.error('Failed to load advisor data:', error);
      this.renderErrorState(card);
    }
  }

  renderAdvisorCard(advisor, card) {
    const body = card.querySelector('.cc-floating-body');
    if (!body) return;

    const lastInteraction = advisor.lastInteraction
      ? new Date(advisor.lastInteraction).toLocaleDateString()
      : 'Never';

    body.innerHTML = `
      <div class="cc-floating-person">
        <div class="cc-floating-avatar">${this.getInitials(advisor.name)}</div>
        <div class="cc-floating-info">
          <h4>${advisor.name}</h4>
          <p>${advisor.company || 'Unknown'}</p>
        </div>
      </div>

      <div style="margin-bottom: 12px;">
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
          <span class="cc-badge cc-pulse-badge ${advisor.pulse?.toLowerCase() || 'inactive'}">
            ● ${advisor.pulse || 'Inactive'}
          </span>
          <span class="cc-badge cc-friction-badge ${this.getFrictionLevel(advisor.friction)}">
            ⚡ ${advisor.friction || 'N/A'}
          </span>
        </div>

        <div style="font-size: 11px; color: var(--cc-text-light); line-height: 1.6;">
          <div><strong>MRR:</strong> ${this.formatCurrency(advisor.mrr)}</div>
          <div><strong>Active Deals:</strong> ${advisor.activeDeals || 0}</div>
          <div><strong>Last Contact:</strong> ${lastInteraction}</div>
        </div>
      </div>

      <div class="cc-floating-actions">
        <button class="cc-floating-btn" id="cc-open-profile">Open Profile</button>
        <button class="cc-floating-btn primary" id="cc-quick-action">Quick Action</button>
      </div>
    `;

    // Setup button listeners
    const openBtn = body.querySelector('#cc-open-profile');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openAdvisorProfile(advisor.id));
    }

    const actionBtn = body.querySelector('#cc-quick-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => this.quickAction(advisor.id));
    }
  }

  renderUnknownPerson(name, card) {
    const body = card.querySelector('.cc-floating-body');
    if (!body) return;

    body.innerHTML = `
      <div style="text-align: center; padding: 16px 0;">
        <div style="font-size: 28px; margin-bottom: 8px;">👤</div>
        <p style="font-size: 12px; color: var(--cc-text-dark); margin-bottom: 4px; font-weight: 500;">
          ${name}
        </p>
        <p style="font-size: 11px; color: var(--cc-text-light); margin-bottom: 12px;">
          Not in your portfolio
        </p>
        <button class="cc-floating-btn primary" id="cc-add-person" style="width: 100%;">
          + Add as Advisor
        </button>
      </div>
    `;

    const addBtn = body.querySelector('#cc-add-person');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addAsAdvisor(name));
    }
  }

  renderErrorState(card) {
    const body = card.querySelector('.cc-floating-body');
    if (!body) return;

    body.innerHTML = `
      <div style="padding: 12px; background: #fee2e2; border-radius: 6px; border: 1px solid #fecaca;">
        <p style="font-size: 12px; color: #991b1b; margin: 0;">
          Failed to load data. Please try again.
        </p>
      </div>
    `;
  }

  async addAsAdvisor(name) {
    console.log('Adding to portfolio:', name);
    // Open the dashboard to add the person
    chrome.tabs.create({
      url: `https://channel-manager-experience-production.up.railway.app/advisors/new?name=${encodeURIComponent(name)}`
    });
    this.closeCard();
  }

  openAdvisorProfile(advisorId) {
    const profileUrl = `https://channel-manager-experience-production.up.railway.app/advisors/${advisorId}`;
    chrome.tabs.create({ url: profileUrl });
  }

  quickAction(advisorId) {
    // Could open a quick action menu or modal
    console.log('Quick action for advisor:', advisorId);
  }

  closeCard() {
    if (this.floatingCard) {
      this.floatingCard.style.animation = 'slideOutDown 0.3s ease-out';
      setTimeout(() => {
        this.floatingCard?.remove();
        this.floatingCard = null;
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
    new LinkedInCompanion();
  });
} else {
  new LinkedInCompanion();
}
