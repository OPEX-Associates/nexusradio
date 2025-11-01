export class SharingService {
  static async shareStation(stationName: string, currentUrl?: string) {
    const shareData = {
      title: `استمع إلى ${stationName} - راديو نيكسوس`,
      text: `أستمع حالياً إلى ${stationName} على راديو نيكسوس`,
      url: currentUrl || window.location.href
    };

    try {
      if (navigator.share && this.canShare()) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        return 'clipboard';
      }
    } catch (error) {
      console.error('Sharing failed:', error);
      // Final fallback - manual copy
      this.fallbackShare(shareData);
      return 'manual';
    }
  }

  static async shareApp() {
    const shareData = {
      title: 'راديو نيكسوس - الإذاعات المغربية',
      text: 'استمع للإذاعات المغربية المفضلة لديك مع راديو نيكسوس',
      url: window.location.origin
    };

    try {
      if (navigator.share && this.canShare()) {
        await navigator.share(shareData);
        return true;
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        return 'clipboard';
      }
    } catch (error) {
      console.error('App sharing failed:', error);
      this.fallbackShare(shareData);
      return 'manual';
    }
  }

  private static canShare(): boolean {
    return 'share' in navigator && /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
  }

  private static fallbackShare(shareData: { title: string; text: string; url: string }) {
    // Create a temporary element with the share text
    const textarea = document.createElement('textarea');
    textarea.value = `${shareData.text}\n${shareData.url}`;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
    } catch (error) {
      console.error('Fallback copy failed:', error);
    }
    
    document.body.removeChild(textarea);
  }

  static createShareUrls(stationName: string) {
    const baseUrl = window.location.href;
    const text = encodeURIComponent(`أستمع حالياً إلى ${stationName} على راديو نيكسوس`);
    const url = encodeURIComponent(baseUrl);

    return {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      email: `mailto:?subject=${encodeURIComponent('راديو نيكسوس')}&body=${text}%20${url}`
    };
  }
}