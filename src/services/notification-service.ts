export interface NotificationOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top' | 'bottom';
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
  duration: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: Notification[] = [];
  private container: HTMLElement | null = null;
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    if (this.container) return;
    
    this.container = document.createElement('div');
    this.container.id = 'nexus-notifications';
    this.container.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      max-width: 300px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(message: string, options: NotificationOptions = { type: 'info' }) {
    const notification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      message,
      type: options.type,
      timestamp: Date.now(),
      duration: options.duration || (options.type === 'error' ? 5000 : 3000)
    };

    this.notifications.push(notification);
    this.notifyListeners();
    this.renderNotification(notification);

    // Auto remove after duration
    setTimeout(() => {
      this.remove(notification.id);
    }, notification.duration);

    return notification.id;
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
    
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.style.animation = 'slideOut 0.3s ease-in-out forwards';
      setTimeout(() => {
        element.remove();
      }, 300);
    }
  }

  private renderNotification(notification: Notification) {
    if (!this.container) return;

    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.style.cssText = `
      background: ${this.getBackgroundColor(notification.type)};
      color: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      pointer-events: auto;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease-out;
      direction: rtl;
      text-align: right;
      font-family: 'Noto Sans Arabic', sans-serif;
    `;

    const icon = this.getIcon(notification.type);
    element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 1.2em;">${icon}</span>
        <span>${notification.message}</span>
      </div>
    `;

    // Click to dismiss
    element.addEventListener('click', () => {
      this.remove(notification.id);
    });

    // Add CSS animation keyframes if not already added
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.appendChild(element);
  }

  private getBackgroundColor(type: string): string {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': default: return '#17a2b8';
    }
  }

  private getIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': default: return 'ℹ️';
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.notifications]));
  }

  subscribe(callback: (notifications: Notification[]) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Convenience methods
  success(message: string, duration?: number) {
    return this.show(message, { type: 'success', duration });
  }

  error(message: string, duration?: number) {
    return this.show(message, { type: 'error', duration });
  }

  warning(message: string, duration?: number) {
    return this.show(message, { type: 'warning', duration });
  }

  info(message: string, duration?: number) {
    return this.show(message, { type: 'info', duration });
  }

  clear() {
    this.notifications.forEach(n => this.remove(n.id));
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }
}