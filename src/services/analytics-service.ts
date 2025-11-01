export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private events: AnalyticsEvent[] = [];

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  track(event: AnalyticsEvent) {
    // Add timestamp
    const trackingEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(trackingEvent);
    
    // Store in localStorage for offline analytics
    this.saveToStorage();
    
    // Log for development
    console.log('Analytics:', trackingEvent);
    
    // Here you could send to analytics service like Google Analytics
    // gtag('event', event.action, { ... });
  }

  trackStationPlay(stationName: string) {
    this.track({
      action: 'play_station',
      category: 'radio',
      label: stationName
    });
  }

  trackFeatureUse(feature: string) {
    this.track({
      action: 'use_feature',
      category: 'ui',
      label: feature
    });
  }

  trackError(error: string, context?: string) {
    this.track({
      action: 'error',
      category: 'app',
      label: `${context}: ${error}`
    });
  }

  getStats() {
    return {
      totalEvents: this.events.length,
      stationPlays: this.events.filter(e => e.action === 'play_station').length,
      featureUses: this.events.filter(e => e.action === 'use_feature').length,
      errors: this.events.filter(e => e.action === 'error').length,
      mostPlayedStation: this.getMostPlayedStation()
    };
  }

  private getMostPlayedStation(): string | null {
    const stationPlays = this.events.filter(e => e.action === 'play_station');
    const counts: { [key: string]: number } = {};
    
    stationPlays.forEach(event => {
      if (event.label) {
        counts[event.label] = (counts[event.label] || 0) + 1;
      }
    });

    let maxCount = 0;
    let mostPlayed = null;
    for (const [station, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        mostPlayed = station;
      }
    }

    return mostPlayed;
  }

  private saveToStorage() {
    try {
      // Keep only last 100 events to avoid storage bloat
      const recentEvents = this.events.slice(-100);
      localStorage.setItem('nexus-radio-analytics', JSON.stringify(recentEvents));
    } catch (error) {
      console.warn('Failed to save analytics to storage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('nexus-radio-analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load analytics from storage:', error);
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}