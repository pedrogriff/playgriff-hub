// js/state.js - Reactive EventTarget State Store

class RetentionStore extends EventTarget {
  constructor() {
    super();
    this.state = {
      currentProfile: null,
      activeAward: null,
      grantAmount: 200000,
      activeTab: 'proto1'
    };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.dispatchEvent(new CustomEvent('retention-state-change', { detail: this.state }));
  }

  getState() {
    return this.state;
  }
}

export const store = new RetentionStore();
