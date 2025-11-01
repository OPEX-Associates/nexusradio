export interface FeedbackData {
  type: 'bug' | 'suggestion' | 'general';
  message: string;
  userAgent: string;
  timestamp: string;
  currentStation?: string;
  appVersion: string;
}

export class FeedbackService {
  private static readonly FEEDBACK_KEY = 'nexus-radio-feedback';
  private static readonly APP_VERSION = '2.0.0';

  static async submitFeedback(data: Omit<FeedbackData, 'userAgent' | 'timestamp' | 'appVersion'>): Promise<boolean> {
    try {
      const feedbackData: FeedbackData = {
        ...data,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        appVersion: this.APP_VERSION
      };

      // Store locally for now (in a real app, this would be sent to a server)
      this.storeFeedbackLocally(feedbackData);
      
      // In a real implementation, you would send this to your feedback API:
      // await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(feedbackData)
      // });

      console.log('Feedback submitted:', feedbackData);
      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  private static storeFeedbackLocally(feedback: FeedbackData) {
    try {
      const existing = localStorage.getItem(this.FEEDBACK_KEY);
      const feedbacks: FeedbackData[] = existing ? JSON.parse(existing) : [];
      feedbacks.push(feedback);
      
      // Keep only last 50 feedback items to avoid storage bloat
      const recentFeedbacks = feedbacks.slice(-50);
      localStorage.setItem(this.FEEDBACK_KEY, JSON.stringify(recentFeedbacks));
    } catch (error) {
      console.warn('Failed to store feedback locally:', error);
    }
  }

  static getFeedbackHistory(): FeedbackData[] {
    try {
      const stored = localStorage.getItem(this.FEEDBACK_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load feedback history:', error);
      return [];
    }
  }

  static clearFeedbackHistory() {
    localStorage.removeItem(this.FEEDBACK_KEY);
  }

  static getQuickFeedbackTemplates() {
    return {
      bug: [
        'الصوت متقطع في المحطة',
        'التطبيق يتوقف عن العمل',
        'لا يمكنني تشغيل المحطة',
        'مشكلة في الأزرار'
      ],
      suggestion: [
        'إضافة محطة إذاعية جديدة',
        'تحسين التصميم',
        'إضافة ميزة جديدة',
        'تحسين جودة الصوت'
      ],
      general: [
        'تطبيق رائع!',
        'شكراً لكم',
        'أحب هذا التطبيق',
        'استمروا في العمل الجيد'
      ]
    };
  }
}